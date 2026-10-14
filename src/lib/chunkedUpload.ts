import { upload } from "@vercel/blob/client";

/**
 * Uploads a file with dual strategy:
 * 1. Direct browser-to-Vercel Blob upload (supports up to 500MB if token exists)
 * 2. 1.5MB chunked fallback to /api/media/chunk (bypasses server payload limits)
 * Safe response parsing ensures no "Unexpected token 'R'" syntax crashes!
 */
export async function uploadFileInChunks(
  file: File,
  onProgress?: (percent: number, loadedMB: string, totalMB: string) => void
): Promise<{ success: boolean; url: string; filename?: string }> {
  const totalMB = (file.size / (1024 * 1024)).toFixed(1);

  // Strategy 1: Attempt direct client-side Vercel Blob upload
  try {
    const newBlob = await upload(file.name, file, {
      access: "public",
      handleUploadUrl: "/api/blob/upload",
      onUploadProgress: (progress) => {
        const percent = Math.round(progress.percentage);
        const loadedMB = ((progress.loaded) / (1024 * 1024)).toFixed(1);
        if (onProgress) onProgress(percent, loadedMB, totalMB);
      },
    });

    if (newBlob?.url) {
      return { success: true, url: newBlob.url, filename: file.name };
    }
  } catch (blobErr: unknown) {
    console.info("[chunkedUpload] Client blob upload bypassed, using chunked stream:", blobErr);
  }

  // Strategy 2: 1.5MB chunked upload
  const CHUNK_SIZE = 1.5 * 1024 * 1024; // 1.5MB chunks (guaranteed under 4.5MB Vercel serverless limit)
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunkBlob = file.slice(start, end);

    const formData = new FormData();
    formData.append("chunk", chunkBlob);
    formData.append("chunkIndex", String(i));
    formData.append("totalChunks", String(totalChunks));
    formData.append("fileName", file.name);
    formData.append("uploadId", uploadId);

    const percent = Math.round(((i + 1) / totalChunks) * 100);
    const currentMB = (end / (1024 * 1024)).toFixed(1);
    if (onProgress) {
      onProgress(percent, currentMB, totalMB);
    }

    let res: Response;
    try {
      res = await fetch("/api/media/chunk", {
        method: "POST",
        body: formData,
      });
    } catch (networkErr: unknown) {
      throw new Error(`નેટવર્ક એરર આવી છે. કૃપા કરીને ફરી ટ્રાય કરો અથવા 'PASTE URL' વાપરો (${networkErr instanceof Error ? networkErr.message : "Network error"}).`);
    }

    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      if (res.status === 413 || text.includes("Request Entity") || text.includes("Too Large")) {
        throw new Error(
          "ફાઇલ સાઇઝ Vercel લિમિટથી મોટી છે. મહેરબાની કરીને નીચે આપેલા '🔗 PASTE URL' બોક્સમાં ગૂગલ ડ્રાઇવ લિંક કે MP4 વિડિયો લિંક પેસ્ટ કરી 'SAVE' કરો!"
        );
      }
      throw new Error(`Upload response error (${res.status}): ${text.slice(0, 100)}`);
    }

    if (!res.ok || data?.error) {
      throw new Error(data?.error || `Upload error on chunk ${i + 1}/${totalChunks}`);
    }

    if (data.done && data.url) {
      return { success: true, url: data.url, filename: data.filename };
    }
  }

  throw new Error("Upload completed without receiving final video URL.");
}
