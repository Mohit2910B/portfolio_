import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDriveSyncStatus, runDriveSync } from "@/lib/driveSync";
import { DEFAULT_ROOT_FOLDER_ID } from "@/lib/googleDriveApi";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { categories, portfolioProjects } from "@/db/schema";
import { isNull, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const syncStatus = await getDriveSyncStatus();

    // Query active counts from database with catch fallbacks
    const [catCountRes, projCountRes, driveFilesRes] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(categories).where(isNull(categories.deletedAt)).catch(() => [{ count: 0 }]),
      db.select({ count: sql<number>`count(*)` }).from(portfolioProjects).where(isNull(portfolioProjects.deletedAt)).catch(() => [{ count: 0 }]),
      db.select({ count: sql<number>`count(*)` }).from(portfolioProjects).where(sql`${portfolioProjects.driveFileId} IS NOT NULL AND ${portfolioProjects.deletedAt} IS NULL`).catch(() => [{ count: 0 }]),
    ]);

    const activeCategories = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        sortOrder: categories.sortOrder,
        driveFolderId: categories.driveFolderId,
      })
      .from(categories)
      .where(isNull(categories.deletedAt))
      .orderBy(categories.sortOrder)
      .catch(() => []);

    const activeProjects = await db
      .select({
        id: portfolioProjects.id,
        driveFileId: portfolioProjects.driveFileId,
        categoryId: portfolioProjects.categoryId,
        category: portfolioProjects.categoryLabel,
        categoryLabel: portfolioProjects.categoryLabel,
        title: portfolioProjects.title,
        description: portfolioProjects.description,
        year: portfolioProjects.year,
        software: portfolioProjects.software,
        tags: portfolioProjects.tags,
        aspectRatio: portfolioProjects.aspectRatio,
        videoUrl: portfolioProjects.videoUrl,
        thumbnailUrl: portfolioProjects.thumbnailUrl,
        externalUrl: portfolioProjects.externalUrl,
        sortOrder: portfolioProjects.sortOrder,
        isFeatured: portfolioProjects.isFeatured,
        isPublished: portfolioProjects.isPublished,
        isHighQualityManual: portfolioProjects.isReplacement,
      })
      .from(portfolioProjects)
      .where(isNull(portfolioProjects.deletedAt))
      .orderBy(portfolioProjects.sortOrder)
      .catch(() => []);

    return NextResponse.json({
      success: true,
      folderId: syncStatus?.rootFolderId || DEFAULT_ROOT_FOLDER_ID,
      status: syncStatus?.status || "idle",
      lastSyncedAt: syncStatus?.lastSyncCompletedAt
        ? new Date(syncStatus.lastSyncCompletedAt).toISOString()
        : null,
      lastError: syncStatus?.lastError || null,
      categoriesCount: Number(catCountRes[0]?.count ?? 0) || activeCategories.length,
      projectsCount: Number(projCountRes[0]?.count ?? 0) || activeProjects.length,
      syncedDriveFilesCount: Number(driveFilesRes[0]?.count ?? 0),
      categories: activeCategories,
      projects: activeProjects,
    });
  } catch (err: unknown) {
    return NextResponse.json({
      success: true,
      folderId: DEFAULT_ROOT_FOLDER_ID,
      status: "idle",
      categoriesCount: 0,
      projectsCount: 0,
      categories: [],
      projects: [],
    });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const folderId = body.folderId || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || DEFAULT_ROOT_FOLDER_ID;

    // Run core Drive sync
    const result = await runDriveSync(folderId, "manual");

    revalidatePath("/");
    revalidatePath("/admin/categories");
    revalidatePath("/admin/portfolio");
    revalidatePath("/admin/dashboard");

    return NextResponse.json({
      success: result.success,
      isAlreadySyncing: result.isAlreadySyncing || false,
      folderId: result.rootFolderId,
      source: result.source,
      authMethod: result.authMethod,
      lastSyncedAt: result.lastSyncedAt,
      categoriesCount: result.categoriesSynced,
      projectsCount: result.videosSynced,
      totalDriveFiles: result.totalDriveFiles,
      errors: result.errors,
      message: result.isAlreadySyncing
        ? "Synchronization is already in progress."
        : result.success
        ? `Successfully synchronized ${result.categoriesSynced} categories and ${result.videosSynced} videos from Google Drive!`
        : `Sync encountered an issue: ${result.errors?.[0] || "Unknown error"}`,
    });
  } catch (err: unknown) {
    console.error("[api/drive/sync POST error]:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Sync execution failed",
      },
      { status: 500 }
    );
  }
}
