import fs from "fs";
import path from "path";
import os from "os";

export interface DeletedCategoryInfo {
  id?: number | string;
  slug: string;
  name: string;
  driveFolderId?: string;
  deletedAt: string;
}

const PRIMARY_FILE_PATH = path.join(process.cwd(), "src", "data", "deletedCategories.json");
const TMP_FILE_PATH = path.join(os.tmpdir(), "mohit_deleted_categories.json");

// In-memory registry
let memoryDeleted: Record<string, DeletedCategoryInfo> = {};
let isInitialized = false;

function loadFromFile(): void {
  const filePaths = [PRIMARY_FILE_PATH, TMP_FILE_PATH];
  for (const fp of filePaths) {
    try {
      if (fs.existsSync(fp)) {
        const raw = fs.readFileSync(fp, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: DeletedCategoryInfo) => {
            if (item && item.slug) {
              memoryDeleted[item.slug.toLowerCase().trim()] = item;
            }
          });
        } else if (parsed && typeof parsed === "object") {
          Object.entries(parsed).forEach(([k, v]) => {
            memoryDeleted[k.toLowerCase().trim()] = v as DeletedCategoryInfo;
          });
        }
      }
    } catch (err) {
      console.warn(`[categoryManager] Read error from ${fp}:`, err);
    }
  }
}

function persistToFile(): void {
  const list = Object.values(memoryDeleted);
  const jsonStr = JSON.stringify(list, null, 2);

  // Try writing to primary project path
  let written = false;
  try {
    const dir = path.dirname(PRIMARY_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(PRIMARY_FILE_PATH, jsonStr, "utf-8");
    written = true;
  } catch (err) {
    console.warn("[categoryManager] Primary write failed (read-only FS on serverless):", err);
  }

  // Also write to OS tmp directory for serverless persistence
  try {
    fs.writeFileSync(TMP_FILE_PATH, jsonStr, "utf-8");
    written = true;
  } catch (err) {
    console.warn("[categoryManager] Temp write failed:", err);
  }

  if (!written) {
    console.warn("[categoryManager] Could not persist to disk, kept in memory.");
  }
}

export function getDeletedCategories(): DeletedCategoryInfo[] {
  if (!isInitialized) {
    loadFromFile();
    isInitialized = true;
  }
  return Object.values(memoryDeleted);
}

export function isCategoryDeleted(cat: {
  id?: number | string;
  slug?: string;
  name?: string;
  driveFolderId?: string;
}): boolean {
  const deletedList = getDeletedCategories();
  if (deletedList.length === 0) return false;

  const targetSlug = (cat.slug || "").toLowerCase().trim();
  const targetName = (cat.name || "").toLowerCase().trim();
  const targetFolderId = cat.driveFolderId || "";
  const targetId = cat.id !== undefined && cat.id !== null ? String(cat.id).trim() : "";

  return deletedList.some((d) => {
    if (targetSlug && d.slug && d.slug.toLowerCase() === targetSlug) return true;
    if (targetName && d.name && d.name.toLowerCase() === targetName) return true;
    if (targetFolderId && d.driveFolderId && d.driveFolderId === targetFolderId) return true;
    if (targetId && d.id !== undefined && String(d.id).trim() === targetId) return true;
    return false;
  });
}

export function markCategoryDeleted(cat: {
  id?: number | string;
  slug?: string;
  name?: string;
  driveFolderId?: string;
}): DeletedCategoryInfo {
  getDeletedCategories(); // ensure loaded

  const slug = (
    cat.slug ||
    cat.name ||
    cat.driveFolderId ||
    `category-${cat.id || Date.now()}`
  )
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "");

  const name = cat.name || cat.slug || `Category ${cat.id || ""}`;

  const info: DeletedCategoryInfo = {
    id: cat.id,
    slug,
    name,
    driveFolderId: cat.driveFolderId,
    deletedAt: new Date().toISOString(),
  };

  memoryDeleted[slug] = info;
  persistToFile();
  return info;
}

export function restoreCategory(identifier: string | number): boolean {
  getDeletedCategories(); // ensure loaded
  const target = String(identifier).toLowerCase().trim();

  let removed = false;
  for (const [slug, item] of Object.entries(memoryDeleted)) {
    if (
      slug.toLowerCase() === target ||
      (item.name && item.name.toLowerCase() === target) ||
      (item.driveFolderId && item.driveFolderId === target) ||
      (item.id !== undefined && String(item.id).trim() === target)
    ) {
      delete memoryDeleted[slug];
      removed = true;
    }
  }

  if (removed) {
    persistToFile();
  }
  return removed;
}
