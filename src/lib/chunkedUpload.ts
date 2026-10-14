/**
 * Uploads a file in 2MB chunks to /api/media/chunk to prevent 413 "Request Entity Too Large" errors
 * Works on any server (Vercel, local, VPS) regardless of server body size limits!
 */
export async function uploadFileInChunks(
  file: File,
  onProgress?: (percent: number, loadedMB: string, totalMB: string) => void
): Promise<{ success: boolean; url: string; filename?: string }> {
  const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB per chunk (safely under the 4.5MB limit)
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const totalMB = (file.size / (1024 * 1024)).toFixed(1);

  // If file is very small (< 1.5MB), can be uploaded directly or in 1 chunk
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

    const res = await fetch("/api/media/chunk", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      let errorMsg = `Server returned status ${res.status}`;
      try {
        const json = JSON.parse(text);
        if (json.error) errorMsg = json.error;
      } catch {
        if (text) errorMsg = text.slice(0, 100);
      }
      throw new Error(`Upload error on chunk ${i + 1}/${totalChunks}: ${errorMsg}`);
    }

    const data = await res.json();
    if (data.done && data.url) {
      return { success: true, url: data.url, filename: data.filename };
    }
  }

  throw new Error("Upload completed without receiving final file URL.");
}
