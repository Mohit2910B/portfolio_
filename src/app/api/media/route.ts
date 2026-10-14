import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { mediaFiles } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { badRequest, guard, notFound, ok } from "@/lib/http";
import { put } from "@vercel/blob";
import fs from "node:fs";
import path from "node:path";

export async function GET() {
  return guard(async () => {
    const files = await db
      .select()
      .from(mediaFiles)
      .orderBy(desc(mediaFiles.createdAt));

    return ok({ files });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    await requireAdmin();

    const formData = await req.formData().catch(() => null);
    if (!formData) return badRequest("Invalid form data.");

    const file = formData.get("file") as File | null;
    if (!file) return badRequest("No file uploaded.");

    const fileNameOriginal = file.name || "upload";
    const mimeType = file.type || "application/octet-stream";
    const size = file.size;

    const kind = mimeType.startsWith("video/")
      ? "video"
      : mimeType.startsWith("image/")
      ? "image"
      : "file";

    const timestamp = Date.now();
    const cleanBasename = fileNameOriginal
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, "-")
      .replace(/-+/g, "-");
    const uniqueFilename = `${timestamp}-${cleanBasename}`;

    let fileUrl = "";

    // 1. Try Vercel Blob if token is configured
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(uniqueFilename, file, { access: "public" });
        fileUrl = blob.url;
      } catch (err) {
        console.warn("[media upload] Vercel Blob failed, using local storage fallback:", err);
      }
    }

    // 2. Local filesystem storage fallback
    if (!fileUrl) {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, uniqueFilename);
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      fileUrl = `/uploads/${uniqueFilename}`;
    }

    // 3. Save metadata to PostgreSQL database
    const inserted = await db
      .insert(mediaFiles)
      .values({
        filename: uniqueFilename,
        originalName: fileNameOriginal,
        mimeType,
        kind,
        size,
        url: fileUrl,
      })
      .returning();

    return ok({ success: true, file: inserted[0] });
  });
}

export async function DELETE(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id) return badRequest("Media file ID is required.");

    const fileRows = await db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.id, id))
      .limit(1);

    if (!fileRows.length) return notFound("Media file not found.");

    const fileRecord = fileRows[0];

    // If local file, delete from disk
    if (fileRecord.url.startsWith("/uploads/")) {
      const localPath = path.join(process.cwd(), "public", fileRecord.url);
      if (fs.existsSync(localPath)) {
        try {
          fs.unlinkSync(localPath);
        } catch (err) {
          console.warn("[media delete] Failed to delete local file:", err);
        }
      }
    }

    await db.delete(mediaFiles).where(eq(mediaFiles.id, id));

    return ok({ success: true, deleted: fileRecord });
  });
}
