import fsp from "node:fs/promises";
import path from "node:path";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import type { ReadableStream as NodeWebReadableStream } from "node:stream/web";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { mediaFiles, projects } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { badRequest, guard, ok } from "@/lib/http";
import {
  UPLOAD_DIR,
  ensureUploadDir,
  safeStoredName,
  isVideoMime,
  isImageMime,
} from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  return guard(async () => {
    await requireAdmin();
    await ensureUploadDir();

    const form = await request.formData();
    const chunk = form.get("chunk");
    const uploadId = String(form.get("uploadId") || "");
    const chunkIndex = Number(form.get("chunkIndex") || 0);
    const totalChunks = Number(form.get("totalChunks") || 1);
    const originalFilename = String(form.get("filename") || "media-upload");
    const kind = String(form.get("kind") || "video") === "video" ? "video" : "image";
    const projectId = form.get("projectId") ? Number(form.get("projectId")) : null;

    if (!(chunk instanceof File)) return badRequest("No chunk payload received.");
    if (!uploadId) return badRequest("Missing upload session ID.");

    // Temporary chunk staging directory
    const stagingDir = path.join(UPLOAD_DIR, ".chunks", uploadId);
    await fsp.mkdir(stagingDir, { recursive: true });

    const chunkPath = path.join(stagingDir, `part-${chunkIndex}`);
    await pipeline(
      Readable.fromWeb(chunk.stream() as unknown as NodeWebReadableStream<Uint8Array>),
      createWriteStream(chunkPath),
    );

    // Check if this is the final chunk
    if (chunkIndex + 1 >= totalChunks) {
      const mime = (chunk.type || (kind === "video" ? "video/mp4" : "image/jpeg")).toLowerCase();
      const finalFilename = safeStoredName(originalFilename, mime);
      const finalPath = path.join(UPLOAD_DIR, finalFilename);
      const writeStream = createWriteStream(finalPath);

      for (let i = 0; i < totalChunks; i++) {
        const partFile = path.join(stagingDir, `part-${i}`);
        const data = await fsp.readFile(partFile);
        writeStream.write(data);
        await fsp.unlink(partFile).catch(() => {});
      }
      writeStream.end();
      await fsp.rm(stagingDir, { recursive: true, force: true }).catch(() => {});

      const stat = await fsp.stat(finalPath);
      const url = `/api/files/${finalFilename}`;

      let mediaRecord = {
        id: Date.now(),
        filename: finalFilename,
        originalName: originalFilename,
        mimeType: mime,
        kind,
        size: stat.size,
        url,
        createdAt: new Date(),
      };

      try {
        const inserted = await db
          .insert(mediaFiles)
          .values({
            filename: finalFilename,
            originalName: originalFilename,
            mimeType: mime,
            kind,
            size: stat.size,
            url,
          })
          .returning();
        if (inserted[0]) {
          mediaRecord = inserted[0];
        }

        if (projectId) {
          if (kind === "video") {
            await db
              .update(projects)
              .set({ videoUrl: url, videoSource: "upload", updatedAt: new Date() })
              .where(eq(projects.id, projectId));
          } else {
            await db
              .update(projects)
              .set({ thumbnailUrl: url, updatedAt: new Date() })
              .where(eq(projects.id, projectId));
          }
        }
      } catch (dbErr) {
        console.warn("[upload-chunk] DB insert notice:", dbErr);
      }

      return ok({
        done: true,
        url,
        kind,
        media: mediaRecord,
      });
    }

    return ok({
      done: false,
      chunkIndex,
      totalChunks,
      message: `Chunk ${chunkIndex + 1}/${totalChunks} received`,
    });
  });
}
