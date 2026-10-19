import { and, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, driveSyncState, portfolioProjects } from "@/db/schema";
import {
  DEFAULT_ROOT_FOLDER_ID,
  scanFullGoogleDrive,
} from "./googleDriveApi";

export interface SyncStatsResult {
  success: boolean;
  rootFolderId: string;
  source: "api_live" | "db_synced" | "fallback";
  authMethod: string;
  categoriesSynced: number;
  videosSynced: number;
  totalDriveFiles: number;
  lastSyncedAt: string;
  errors?: string[];
  isAlreadySyncing?: boolean;
}

export function cleanTitle(filename: string): string {
  let title = filename.replace(/\.(mp4|mov|mkv|avi|webm|m4v)$/i, "").trim();
  title = title.replace(/^#/, "");
  title = title.replace(/_/g, " ");
  return title;
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

export function getAspectRatio(categoryTitle: string, filename: string): string {
  const lower = (categoryTitle + " " + filename).toLowerCase();
  if (
    lower.includes("reel") ||
    lower.includes("shorts") ||
    lower.includes("tiktok") ||
    lower.includes("story") ||
    lower.includes("9:16") ||
    lower.includes("vertical")
  ) {
    return "9:16";
  }
  return "9:16"; // Standard portfolio vertical showcase
}

/**
 * Gets the current Drive sync status from the database.
 */
export async function getDriveSyncStatus() {
  try {
    const rows = await db
      .select()
      .from(driveSyncState)
      .orderBy(desc(driveSyncState.id))
      .limit(1);

    if (rows.length > 0) {
      return rows[0];
    }
  } catch (err) {
    console.warn("[driveSync] Error querying drive_sync_state:", err);
  }

  return null;
}

/**
 * Executes a full synchronization between Google Drive and the PostgreSQL database.
 */
export async function runDriveSync(
  rootFolderId: string = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || DEFAULT_ROOT_FOLDER_ID,
  syncType: "manual" | "scheduled" | "initial" = "manual"
): Promise<SyncStatsResult> {
  const now = new Date();

  // 1. Concurrency Lock: Check if another sync is currently running
  const currentStatus = await getDriveSyncStatus();
  if (currentStatus && currentStatus.status === "syncing") {
    const startedAt = currentStatus.lastSyncStartedAt ? new Date(currentStatus.lastSyncStartedAt).getTime() : 0;
    const elapsedMinutes = (now.getTime() - startedAt) / (1000 * 60);

    // If running for less than 10 minutes, prevent overlapping sync
    if (elapsedMinutes < 10) {
      return {
        success: false,
        isAlreadySyncing: true,
        rootFolderId,
        source: "db_synced",
        authMethod: "unknown",
        categoriesSynced: currentStatus.totalCategoriesSynced,
        videosSynced: currentStatus.totalVideosSynced,
        totalDriveFiles: currentStatus.totalDriveFiles,
        lastSyncedAt: currentStatus.lastSyncCompletedAt
          ? new Date(currentStatus.lastSyncCompletedAt).toISOString()
          : now.toISOString(),
        errors: ["Another synchronization job is currently in progress."],
      };
    }
  }

  // Record sync start in DB
  let stateId: number | null = null;
  try {
    const insertedState = await db
      .insert(driveSyncState)
      .values({
        rootFolderId,
        status: "syncing",
        lastSyncStartedAt: now,
        syncType,
        detailsJson: JSON.stringify({ trigger: syncType, startedAt: now.toISOString() }),
      })
      .returning();
    stateId = insertedState[0]?.id ?? null;
  } catch (e) {
    console.warn("[driveSync] Unable to record sync start:", e);
  }

  const errors: string[] = [];

  try {
    // 2. Scan Google Drive via Google Drive API v3
    const scanResult = await scanFullGoogleDrive(rootFolderId);

    if (scanResult.authMethod === "unconfigured") {
      // If Google credentials are not yet configured in environment variables,
      // return current database state with clear advisory
      const [catCountRes, projCountRes] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(categories).where(isNull(categories.deletedAt)),
        db.select({ count: sql<number>`count(*)` }).from(portfolioProjects).where(isNull(portfolioProjects.deletedAt)),
      ]);

      const catCount = Number(catCountRes[0]?.count ?? 0);
      const projCount = Number(projCountRes[0]?.count ?? 0);

      if (stateId) {
        await db
          .update(driveSyncState)
          .set({
            status: "idle",
            lastSyncCompletedAt: now,
            totalCategoriesSynced: catCount,
            totalVideosSynced: projCount,
            lastError: "Google Drive API credentials not configured yet (add GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_API_KEY). Existing database portfolio active.",
            updatedAt: now,
          })
          .where(eq(driveSyncState.id, stateId))
          .catch(() => {});
      }

      return {
        success: true,
        rootFolderId,
        source: "db_synced",
        authMethod: "unconfigured",
        categoriesSynced: catCount,
        videosSynced: projCount,
        totalDriveFiles: projCount,
        lastSyncedAt: now.toISOString(),
        errors: ["Google Drive API credentials unconfigured. Serving database records."],
      };
    }

    let categoriesSynced = 0;
    let videosSynced = 0;
    const seenDriveFileIds = new Set<string>();

    // 3. Process each scanned folder -> Category
    for (const folder of scanResult.folders) {
      const folderName = folder.name.trim();
      const folderSlug = slugify(folderName);

      // Check if category exists by driveFolderId or slug
      const existingCats = await db
        .select()
        .from(categories)
        .where(
          sql`${categories.driveFolderId} = ${folder.id} OR ${categories.slug} = ${folderSlug} OR LOWER(${categories.name}) = LOWER(${folderName})`
        )
        .limit(1);

      let catId: number;

      if (existingCats.length > 0) {
        const existingCat = existingCats[0];
        catId = existingCat.id;

        // SAFE POLICY: If the category was soft-deleted (in Trash), do NOT resurrect it!
        if (existingCat.deletedAt) {
          // Category remains in Trash, skip updating projects for it
          continue;
        }

        // If category name was renamed in Drive, update website category name and label
        if (existingCat.name !== folderName) {
          await db
            .update(categories)
            .set({
              name: folderName,
              driveFolderId: folder.id,
              updatedAt: now,
            })
            .where(eq(categories.id, catId));

          await db
            .update(portfolioProjects)
            .set({ categoryLabel: folderName })
            .where(eq(portfolioProjects.categoryId, catId));
        } else if (!existingCat.driveFolderId) {
          await db
            .update(categories)
            .set({ driveFolderId: folder.id, updatedAt: now })
            .where(eq(categories.id, catId));
        }
      } else {
        // Create new category
        const maxSortRes = await db
          .select({ maxSort: sql<number>`COALESCE(MAX(${categories.sortOrder}), 0)` })
          .from(categories);
        const nextSort = Number(maxSortRes[0]?.maxSort ?? 0) + 1;

        const inserted = await db
          .insert(categories)
          .values({
            name: folderName,
            slug: folderSlug,
            description: `${folderName} cinematic showcase edits by Mohit Babariya`,
            sortOrder: nextSort,
            isActive: true,
            driveFolderId: folder.id,
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        catId = inserted[0].id;
      }

      categoriesSynced++;

      // 4. Process video files inside this folder
      const videos = scanResult.videosByFolder[folder.id] || [];

      for (const video of videos) {
        seenDriveFileIds.add(video.id);
        const videoTitle = cleanTitle(video.name);
        const directVideoUrl = `https://drive.google.com/uc?id=${video.id}&export=download`;
        const driveThumbUrl = `/api/media/drive-thumb?id=${video.id}`;
        const externalUrl = `https://drive.google.com/file/d/${video.id}/view`;

        // Check if project exists by stable driveFileId
        const existingProjects = await db
          .select()
          .from(portfolioProjects)
          .where(eq(portfolioProjects.driveFileId, video.id))
          .limit(1);

        if (existingProjects.length > 0) {
          const proj = existingProjects[0];

          // SAFE POLICY: If already soft-deleted in Trash, respect deletion
          if (proj.deletedAt) {
            continue;
          }

          // If manual high-quality replacement was uploaded, PRESERVE manual videoUrl & thumbnailUrl!
          if (proj.isReplacement) {
            await db
              .update(portfolioProjects)
              .set({
                categoryId: catId,
                categoryLabel: folderName,
                driveFolderId: folder.id,
                title: videoTitle,
                lastSyncedAt: now,
                updatedAt: now,
              })
              .where(eq(portfolioProjects.id, proj.id));
          } else {
            // Update with latest Drive metadata
            await db
              .update(portfolioProjects)
              .set({
                title: videoTitle,
                categoryId: catId,
                categoryLabel: folderName,
                videoUrl: directVideoUrl,
                thumbnailUrl: proj.thumbnailUrl && !proj.thumbnailUrl.includes("drive.google.com") ? proj.thumbnailUrl : driveThumbUrl,
                externalUrl,
                driveFolderId: folder.id,
                fileSize: video.size || proj.fileSize,
                mimeType: video.mimeType || proj.mimeType,
                lastSyncedAt: now,
                updatedAt: now,
              })
              .where(eq(portfolioProjects.id, proj.id));
          }
        } else {
          // New video file discovered in Drive -> Add to portfolio
          const maxSortRes = await db
            .select({ maxSort: sql<number>`COALESCE(MAX(${portfolioProjects.sortOrder}), 0)` })
            .from(portfolioProjects);
          const nextSort = Number(maxSortRes[0]?.maxSort ?? 0) + 1;

          await db.insert(portfolioProjects).values({
            title: videoTitle,
            description: `Cinematic video edit for ${folderName} created by Mohit Babariya.`,
            categoryId: catId,
            categoryLabel: folderName,
            year: 2026,
            software: "Premiere Pro, After Effects, DaVinci Resolve",
            tags: folderName,
            videoUrl: directVideoUrl,
            thumbnailUrl: driveThumbUrl,
            externalUrl,
            aspectRatio: getAspectRatio(folderName, video.name),
            displaySize: "medium",
            isFeatured: false,
            isPublished: true,
            sortOrder: nextSort,
            driveFileId: video.id,
            driveFolderId: folder.id,
            isReplacement: false,
            fileSize: video.size || 0,
            mimeType: video.mimeType || "video/mp4",
            lastSyncedAt: now,
            createdAt: now,
            updatedAt: now,
          });
        }

        videosSynced++;
      }
    }

    // 5. Update sync state as successful
    if (stateId) {
      await db
        .update(driveSyncState)
        .set({
          status: "success",
          lastSyncCompletedAt: now,
          totalDriveFiles: scanResult.totalFiles,
          totalCategoriesSynced: categoriesSynced,
          totalVideosSynced: videosSynced,
          changeToken: scanResult.newStartPageToken || null,
          lastError: null,
          updatedAt: now,
        })
        .where(eq(driveSyncState.id, stateId));
    }

    return {
      success: true,
      rootFolderId,
      source: "api_live",
      authMethod: scanResult.authMethod,
      categoriesSynced,
      videosSynced,
      totalDriveFiles: scanResult.totalFiles,
      lastSyncedAt: now.toISOString(),
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (err: any) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[driveSync] Sync failed with error:", errMsg);

    if (stateId) {
      await db
        .update(driveSyncState)
        .set({
          status: "error",
          lastSyncCompletedAt: now,
          lastError: errMsg,
          updatedAt: now,
        })
        .where(eq(driveSyncState.id, stateId))
        .catch(() => {});
    }

    return {
      success: false,
      rootFolderId,
      source: "fallback",
      authMethod: "error",
      categoriesSynced: 0,
      videosSynced: 0,
      totalDriveFiles: 0,
      lastSyncedAt: now.toISOString(),
      errors: [errMsg],
    };
  }
}
