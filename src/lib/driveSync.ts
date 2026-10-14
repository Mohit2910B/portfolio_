import fs from "fs";
import path from "path";
import { DEFAULT_CATEGORIES, DEFAULT_PROJECTS } from "./defaultPortfolioData";
import { getAllVideoOverrides } from "./videoOverrides";
import { isCategoryDeleted } from "./categoryManager";

export interface DriveVideoItem {
  id: number;
  driveFileId: string;
  categoryId: number;
  category: string;
  categoryLabel: string;
  title: string;
  description: string;
  year: number;
  software: string;
  tags: string;
  aspectRatio: string;
  videoUrl: string;
  thumbnailUrl: string;
  externalUrl: string;
  sortOrder: number;
  isFeatured: boolean;
  isPublished: boolean;
  isHighQualityManual?: boolean;
}

export interface DriveCategoryItem {
  id: number;
  driveFolderId?: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  videoCount?: number;
}

export interface DriveSyncResult {
  folderId: string;
  lastSyncedAt: number;
  categories: DriveCategoryItem[];
  projects: DriveVideoItem[];
  source: "live" | "cache" | "default";
}

export const DEFAULT_ROOT_FOLDER_ID = "1qDP0lUvRfyDsvktivuDTviwKxfi67W1i";

// In-memory cache
let memoryCache: DriveSyncResult | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function clearDriveMemoryCache(): void {
  memoryCache = null;
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

function cleanTitle(filename: string): string {
  let title = filename.replace(/\.(mp4|mov|mkv|avi|webm|m4v)$/i, "").trim();
  title = title.replace(/^#/, "");
  title = title.replace(/_/g, " ");
  return title;
}

function getAspectRatio(categoryTitle: string, filename: string): string {
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

/** Fetches Google Drive root folder and all subfolders in parallel */
export async function syncGoogleDriveFolders(
  rootFolderId: string = DEFAULT_ROOT_FOLDER_ID,
  force: boolean = false
): Promise<DriveSyncResult> {
  const now = Date.now();

  // Return in-memory cache if fresh
  if (!force && memoryCache && now - memoryCache.lastSyncedAt < CACHE_TTL_MS) {
    return memoryCache;
  }

  try {
    const rootUrl = `https://drive.google.com/drive/folders/${rootFolderId}`;
    const rootRes = await fetch(rootUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 300 },
    });

    if (!rootRes.ok) {
      throw new Error(`Google Drive root returned status ${rootRes.status}`);
    }

    const rootHtml = await rootRes.text();
    const regex = /AF_initDataCallback\((\{[\s\S]*?\})\);<\/script>/g;
    let match: RegExpExecArray | null;
    const folders: Array<{ id: string; title: string }> = [];

    while ((match = regex.exec(rootHtml)) !== null) {
      try {
        const fn = new Function("return " + match[1]);
        const obj = fn();
        if (obj.key === "ds:3" || obj.key === "ds:0" || obj.key === "ds:2") {
          function walk(arr: unknown) {
            if (!Array.isArray(arr)) return;
            if (
              arr.length > 4 &&
              arr[4] === "application/vnd.google-apps.folder"
            ) {
              const id = arr[0] && (arr[0] as string[])[1];
              const str = JSON.stringify(arr);
              const titleMatch = str.match(/\[\[\["([^"]+)",null,1\]\]\]/);
              if (id && titleMatch) {
                const folderTitle = titleMatch[1].trim();
                if (!folders.some((f) => f.id === id)) {
                  folders.push({ id, title: folderTitle });
                }
              }
            }
            arr.forEach(walk);
          }
          walk(obj.data);
        }
      } catch {}
    }

    if (folders.length === 0) {
      throw new Error("No subfolders discovered in root folder");
    }

    // Filter out deleted/hidden categories
    const activeFolders = folders.filter((f) => {
      const catSlug = slugify(f.title);
      return !isCategoryDeleted({ slug: catSlug, name: f.title, driveFolderId: f.id });
    });

    // Parallel fetch contents of each subfolder
    const folderContents = await Promise.all(
      activeFolders.map(async (folder) => {
        try {
          const fUrl = `https://drive.google.com/drive/folders/${folder.id}`;
          const fRes = await fetch(fUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          });
          const fHtml = await fRes.text();
          const items: Array<{ id: string; name: string }> = [];
          const fRegex = /AF_initDataCallback\((\{[\s\S]*?\})\);<\/script>/g;
          let fMatch: RegExpExecArray | null;
          while ((fMatch = fRegex.exec(fHtml)) !== null) {
            try {
              const fn = new Function("return " + fMatch[1]);
              const obj = fn();
              if (
                obj.key === "ds:3" ||
                obj.key === "ds:0" ||
                obj.key === "ds:2"
              ) {
                function walkItems(arr: unknown) {
                  if (!Array.isArray(arr)) return;
                  if (
                    arr.length > 4 &&
                    typeof arr[4] === "string" &&
                    (arr[4].startsWith("video/") ||
                      arr[4].includes("video") ||
                      arr[4].includes("stream"))
                  ) {
                    const fileId = arr[0] && (arr[0] as string[])[1];
                    const str = JSON.stringify(arr);
                    const nameMatch =
                      str.match(/\[\[\["([^"]+\.(?:mp4|mov|mkv|avi|webm|m4v))"/i) ||
                      str.match(/\[\[\["([^"]+)",null,1\]\]\]/);
                    const fileName = nameMatch ? nameMatch[1] : `Video_${fileId}`;
                    if (fileId && !items.some((it) => it.id === fileId)) {
                      items.push({ id: fileId, name: fileName });
                    }
                  }
                  arr.forEach(walkItems);
                }
                walkItems(obj.data);
              }
            } catch {}
          }
          return { ...folder, items };
        } catch {
          return { ...folder, items: [] };
        }
      })
    );

    // Build categories and projects lists
    const categories: DriveCategoryItem[] = [];
    const projects: DriveVideoItem[] = [];
    let globalProjectId = 0;

    // Fetch any manual high-quality replacements/overrides
    const overrides = getAllVideoOverrides();

    folderContents.forEach((f, idx) => {
      const catId = idx + 1;
      const catName = f.title;
      const catSlug = slugify(catName);

      categories.push({
        id: catId,
        driveFolderId: f.id,
        name: catName,
        slug: catSlug,
        description: `${catName} cinematic showcase edits by Mohit Babariya`,
        sortOrder: catId,
        isActive: true,
        videoCount: f.items.length,
      });

      f.items.forEach((item, itemIdx) => {
        globalProjectId++;
        const title = cleanTitle(item.name);
        const fileId = item.id;
        let videoUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
        let thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
        const externalUrl = `https://drive.google.com/file/d/${fileId}/view`;
        let isHighQualityManual = false;

        const override = overrides[fileId] || overrides[title] || overrides[String(globalProjectId)];
        if (override) {
          if (override.videoUrl) videoUrl = override.videoUrl;
          if (override.thumbnailUrl) thumbnailUrl = override.thumbnailUrl;
          isHighQualityManual = true;
        }

        projects.push({
          id: globalProjectId,
          driveFileId: fileId,
          categoryId: catId,
          category: catName,
          categoryLabel: catName,
          title,
          description: `Cinematic video edit for ${catName} created by Mohit Babariya.`,
          year: 2026,
          software: "Premiere Pro, After Effects, DaVinci Resolve",
          tags: catName,
          aspectRatio: override?.aspectRatio || getAspectRatio(catName, item.name),
          videoUrl,
          thumbnailUrl,
          externalUrl,
          sortOrder: globalProjectId,
          isFeatured: itemIdx === 0,
          isPublished: true,
          isHighQualityManual,
        });
      });
    });

    const result: DriveSyncResult = {
      folderId: rootFolderId,
      lastSyncedAt: now,
      categories,
      projects,
      source: "live",
    };

    memoryCache = result;
    return result;
  } catch (err: unknown) {
    console.warn("[driveSync] Live sync fallback triggered:", err instanceof Error ? err.message : err);

    if (memoryCache) {
      return { ...memoryCache, source: "cache" };
    }

    const overrides = getAllVideoOverrides();
    const fallbackProjects = (DEFAULT_PROJECTS as DriveVideoItem[]).map((p) => {
      const override = overrides[p.driveFileId] || overrides[p.title] || overrides[String(p.id)];
      if (override) {
        return {
          ...p,
          videoUrl: override.videoUrl || p.videoUrl,
          thumbnailUrl: override.thumbnailUrl || p.thumbnailUrl,
          isHighQualityManual: true,
        };
      }
      return p;
    });

    // Default static fallback filtered by deleted categories
    const filteredFallbackCats = (DEFAULT_CATEGORIES as DriveCategoryItem[]).filter(
      (c) => !isCategoryDeleted({ slug: c.slug, id: c.id, name: c.name })
    );
    const filteredFallbackProjects = fallbackProjects.filter(
      (p) => !isCategoryDeleted({ slug: slugify(p.category), name: p.category, id: p.categoryId })
    );

    return {
      folderId: rootFolderId,
      lastSyncedAt: now,
      categories: filteredFallbackCats,
      projects: filteredFallbackProjects,
      source: "default",
    };
  }
}
