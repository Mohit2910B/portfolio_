import { createWriteStream } from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as NodeWebReadableStream } from "node:stream/web";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { mediaFiles, projects } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { badRequest, created, guard, notFound, num, str } from "@/lib/http";
import {
  MAX_UPLOAD_MB,
  UPLOAD_DIR,
  ensureUploadDir,
  isImageMime,
  isVideoMime,
  safeStoredName,
} from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Real server-side upload. Streams the request body to disk, records the
 * file in `media_files` and (optionally) attaches it to a project.
 */
export async function POST(request: Request) {
  return guard(async () => {
    await requireAdmin();
    await ensureUploadDir();

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return badRequest("No file was received.");
    if (file.size === 0) return badRequest("The selected file is empty.");

    const maxBytes = MAX_UPLOAD_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      return badRequest(`File is too large. Maximum size is ${MAX_UPLOAD_MB} MB.`);
    }

    const mime = (file.type || "").toLowerCase();
    const wantsVideo = str(form.get("kind"), "video") === "video";
    if (wantsVideo && !isVideoMime(mime)) {
      return badRequest("Unsupported video format. Use MP4, WebM or MOV.");
    }
    if (!wantsVideo && !isImageMime(mime)) {
      return badRequest("Unsupported image format. Use JPG, PNG or WEBP.");
    }

    const filename = safeStoredName(file.name, mime);
    const target = path.join(UPLOAD_DIR, filename);

    try {
      await pipeline(
        Readable.fromWeb(file.stream() as unknown as NodeWebReadableStream<Uint8Array>),
        createWriteStream(target),
      );
      const stat = await fsp.stat(target);
      if (stat.size === 0) throw new Error("Written file is empty");

      const kind = wantsVideo ? "video" : "image";
      const url = `/api/files/${filename}`;
      let insertedMedia = {
        id: Date.now(),
        filename,
        originalName: file.name,
        mimeType: mime || "application/octet-stream",
        kind,
        size: stat.size,
        url,
        width: num(form.get("width")),
        height: num(form.get("height")),
        createdAt: new Date(),
      };

      try {
        const inserted = await db
          .insert(mediaFiles)
          .values({
            filename,
            originalName: file.name,
            mimeType: mime || "application/octet-stream",
            kind,
            size: stat.size,
            url,
            width: num(form.get("width")),
            height: num(form.get("height")),
          })
          .returning();
        if (inserted[0]) {
          insertedMedia = inserted[0];
        }

        // Optional auto-attach to a project (used by the admin uploader).
        const projectId = num(form.get("projectId"));
        if (projectId) {
          const patch = wantsVideo
            ? { videoUrl: url, videoSource: "upload", updatedAt: new Date() }
            : { thumbnailUrl: url, updatedAt: new Date() };
          await db
            .update(projects)
            .set(patch)
            .where(eq(projects.id, projectId));
        }
      } catch (dbErr) {
        console.warn("[upload] Database save skipped, file written to disk:", dbErr);
      }

      return created({ media: insertedMedia, url, kind });
    } catch (error) {
      await fsp.unlink(target).catch(() => undefined);
      console.error("[upload]", error);
      return badRequest("Upload failed while writing the file. Please try again.");
    }
  });
}
