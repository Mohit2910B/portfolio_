import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { put } from "@vercel/blob";

import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getUploadDir(): string {
  const localPublic = path.join(process.cwd(), "public", "uploads");
  try {
    if (!fs.existsSync(localPublic)) {
      fs.mkdirSync(localPublic, { recursive: true });
    }
    return localPublic;
  } catch {
    const tmpDir = path.join(os.tmpdir(), "portfolio_uploads");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    return tmpDir;
  }
}

const ALLOWED_EXTENSIONS = [".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v", ".jpeg", ".jpg", ".png", ".webp"];

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ success: false, error: "Invalid form data payload" }, { status: 400 });
    }

    const chunk = formData.get("chunk") as Blob | null;
    const chunkIndex = Number(formData.get("chunkIndex") || 0);
    const totalChunks = Number(formData.get("totalChunks") || 1);
    const fileName = (formData.get("fileName") as string) || "video.mp4";
    const uploadId = (formData.get("uploadId") as string) || "temp";

    const ext = path.extname(fileName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({
        success: false,
        error: `File format "${ext}" is not supported. Please upload an MP4, MOV, WEBM, MKV, JPG, or PNG file.`,
      }, { status: 400 });
    }

    if (!chunk) {
      return NextResponse.json({ success: false, error: "No chunk received" }, { status: 400 });
    }

    const uploadDir = getUploadDir();
    const tempFilePath = path.join(uploadDir, `upload-session-${uploadId}.tmp`);
    const chunkBuffer = Buffer.from(await chunk.arrayBuffer());

    if (chunkIndex === 0) {
      fs.writeFileSync(tempFilePath, chunkBuffer);
    } else {
      fs.appendFileSync(tempFilePath, chunkBuffer);
    }

    // Final chunk reached
    if (chunkIndex === totalChunks - 1) {
      const timestamp = Date.now();
      const cleanName = fileName.toLowerCase().replace(/[^a-z0-9.]/g, "-").replace(/-+/g, "-");
      const finalFilename = `${timestamp}-${cleanName}`;
      const finalLocalPath = path.join(uploadDir, finalFilename);

      try {
        fs.renameSync(tempFilePath, finalLocalPath);
      } catch {
        fs.copyFileSync(tempFilePath, finalLocalPath);
        try { fs.unlinkSync(tempFilePath); } catch {}
      }

      let finalUrl = `/uploads/${finalFilename}`;

      // Upload to Vercel Blob if token available
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          const finalBuffer = fs.readFileSync(finalLocalPath);
          const blob = await put(finalFilename, finalBuffer, { access: "public" });
          finalUrl = blob.url;
        } catch (err) {
          console.warn("[chunk upload] Vercel Blob upload note:", err);
        }
      }

      return NextResponse.json({
        success: true,
        done: true,
        url: finalUrl,
        filename: finalFilename,
      });
    }

    return NextResponse.json({
      success: true,
      done: false,
      chunkIndex,
      totalChunks,
    });
  } catch (err: unknown) {
    console.error("[chunk upload error]:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Chunk upload failed" },
      { status: 500 }
    );
  }
}
