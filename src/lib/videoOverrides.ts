import fs from "fs";
import path from "path";

export interface VideoOverride {
  driveFileId?: string;
  projectTitle?: string;
  projectId?: number;
  videoUrl: string; // Direct uploaded high quality URL (/uploads/... or Vercel Blob)
  thumbnailUrl?: string;
  aspectRatio?: string;
  isHighQualityManual: boolean;
  uploadedAt: string;
}

// In-memory fallback
let memoryOverrides: Record<string, VideoOverride> = {};

function getFilePath(): string {
  return path.join(process.cwd(), "src", "data", "videoOverrides.json");
}

export function getAllVideoOverrides(): Record<string, VideoOverride> {
  const filePath = getFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      memoryOverrides = { ...memoryOverrides, ...parsed };
      return memoryOverrides;
    }
  } catch (err) {
    console.warn("[videoOverrides] Read failed, returning memory store:", err);
  }
  return memoryOverrides;
}

export function saveVideoOverride(
  key: string,
  override: Omit<VideoOverride, "uploadedAt" | "isHighQualityManual">
): VideoOverride {
  const current = getAllVideoOverrides();
  const entry: VideoOverride = {
    ...override,
    isHighQualityManual: true,
    uploadedAt: new Date().toISOString(),
  };

  current[key] = entry;
  memoryOverrides[key] = entry;

  const filePath = getFilePath();
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(current, null, 2), "utf-8");
  } catch (err) {
    console.warn("[videoOverrides] File write error, persisted in memory:", err);
  }

  return entry;
}

export function deleteVideoOverride(key: string): boolean {
  const current = getAllVideoOverrides();
  if (current[key]) {
    delete current[key];
    delete memoryOverrides[key];
    const filePath = getFilePath();
    try {
      if (fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(current, null, 2), "utf-8");
      }
    } catch {}
    return true;
  }
  return false;
}
