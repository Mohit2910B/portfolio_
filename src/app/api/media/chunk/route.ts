import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ success: false, error: "Invalid form data" }, { status: 400 });
    }

    const chunk = formData.get("chunk") as Blob | null;
    const chunkIndex = Number(formData.get("chunkIndex") || 0);
    const totalChunks = Number(formData.get("totalChunks") || 1);
    const fileName = (formData.get("fileName") as string) || "video.mp4";
    const uploadId = (formData.get("uploadId") as string) || "temp";

    if (!chunk) {
      return NextResponse.json({ success: false, error: "No chunk received" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const tempFilePath = path.join(uploadDir, `upload-session-${uploadId}.tmp`);
    const chunkBuffer = Buffer.from(await chunk.arrayBuffer());

    if (chunkIndex === 0) {
      fs.writeFileSync(tempFilePath, chunkBuffer);
    } else {
      fs.appendFileSync(tempFilePath, chunkBuffer);
    }

    // If this is the final chunk, finalize file
    if (chunkIndex === totalChunks - 1) {
      const timestamp = Date.now();
      const cleanName = fileName.toLowerCase().replace(/[^a-z0-9.]/g, "-").replace(/-+/g, "-");
      const finalFilename = `${timestamp}-${cleanName}`;
      const finalLocalPath = path.join(uploadDir, finalFilename);

      fs.renameSync(tempFilePath, finalLocalPath);

      let finalUrl = `/uploads/${finalFilename}`;

      // If Vercel Blob is available, upload final buffer to Blob
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          const finalBuffer = fs.readFileSync(finalLocalPath);
          const blob = await put(finalFilename, finalBuffer, { access: "public" });
          finalUrl = blob.url;
        } catch (err) {
          console.warn("[chunk upload] Vercel Blob sync fallback to local:", err);
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
