import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), "storage", "uploads");

export const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB ?? 300);

export const VIDEO_MIME = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
  "video/ogg",
  "video/x-msvideo",
];

export const IMAGE_MIME = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

export async function ensureUploadDir(): Promise<string> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  return UPLOAD_DIR;
}

export function extensionFor(mimeType: string, originalName: string): string {
  const fromMime: Record<string, string> = {
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
    "video/x-m4v": ".m4v",
    "video/ogg": ".ogv",
    "video/x-msvideo": ".avi",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
  };
  if (fromMime[mimeType.toLowerCase()]) return fromMime[mimeType.toLowerCase()];
  const ext = path.extname(originalName || "").toLowerCase();
  return /^\.[a-z0-9]{2,5}$/.test(ext) ? ext : ".bin";
}

export function safeStoredName(originalName: string, mimeType: string): string {
  const base = (originalName || "file")
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${Date.now().toString(36)}-${randomUUID().slice(0, 8)}-${base || "media"}${extensionFor(
    mimeType,
    originalName,
  )}`;
}

export function resolveStoredPath(filename: string): string | null {
  const clean = path.basename(filename);
  if (!clean || clean.includes("..") || clean.includes("/") || clean.includes("\\")) return null;
  return path.join(UPLOAD_DIR, clean);
}

export function contentTypeFor(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const map: Record<string, string> = {
    ".mp4": "video/mp4",
    ".m4v": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".ogv": "video/ogg",
    ".avi": "video/x-msvideo",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".avif": "image/avif",
  };
  return map[ext] ?? "application/octet-stream";
}

export function isVideoMime(mime: string): boolean {
  return VIDEO_MIME.includes(mime.toLowerCase()) || mime.startsWith("video/");
}

export function isImageMime(mime: string): boolean {
  return IMAGE_MIME.includes(mime.toLowerCase()) || mime.startsWith("image/");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export async function deleteStoredFile(url: string): Promise<void> {
  if (!url.startsWith("/api/files/")) return;
  const filename = url.replace("/api/files/", "");
  const target = resolveStoredPath(filename);
  if (!target) return;
  try {
    await fs.unlink(target);
  } catch {
    /* file already gone — nothing to do */
  }
}
