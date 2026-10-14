"use client";

import { useEffect, useState } from "react";

interface MediaFile {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  kind: string;
  size: number;
  url: string;
  createdAt: string;
}

export default function AdminMediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      const res = await fetch("/api/media");
      const data = await res.json();
      if (data.files) setFiles(data.files);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUploadFile = async (file: File) => {
    setUploading(true);
    setErrorMsg("");
    setUploadProgress(20);

    try {
      const formData = new FormData();
      formData.append("file", file);

      setUploadProgress(50);
      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(90);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      setUploadProgress(100);
      await fetchFiles();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Upload error.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this media file?")) return;
    try {
      const res = await fetch(`/api/media?id=${id}`, { method: "DELETE" });
      if (res.ok) setFiles(files.filter((f) => f.id !== id));
    } catch {}
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="border-b border-[rgba(243,240,232,0.12)] pb-6">
        <div className="font-mono text-xs text-[#C7A56A] uppercase tracking-widest">
          MEDIA ASSETS & OBJECT STORAGE
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl uppercase tracking-tight">
          REAL MEDIA LIBRARY ({files.length})
        </h1>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/40 text-rose-300 font-mono text-xs uppercase tracking-widest">
          ⚠ {errorMsg}
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed p-12 text-center transition-all cursor-pointer ${
          dragActive
            ? "border-[#C7A56A] bg-[rgba(199,165,106,0.1)]"
            : "border-[rgba(243,240,232,0.2)] bg-[#111111] hover:border-[#C7A56A]/60"
        }`}
      >
        <input
          type="file"
          id="mediaInput"
          accept="image/*,video/*"
          onChange={(e) => e.target.files?.[0] && handleUploadFile(e.target.files[0])}
          className="hidden"
        />
        <label htmlFor="mediaInput" className="cursor-pointer space-y-3 block">
          <div className="text-3xl">📤</div>
          <div className="font-display font-bold text-lg uppercase text-[#F3F0E8]">
            DRAG & DROP VIDEO OR IMAGE HERE
          </div>
          <div className="font-mono text-xs text-[#8A8A8A]">
            OR CLICK TO BROWSE (MP4, WEBM, MOV, JPG, PNG, WEBP)
          </div>
        </label>

        {uploading && (
          <div className="mt-6 max-w-md mx-auto space-y-2 font-mono text-xs">
            <div className="text-[#C7A56A] font-bold uppercase">UPLOADING MEDIA... {uploadProgress}%</div>
            <div className="w-full h-2 bg-[#080808] overflow-hidden rounded">
              <div
                className="h-full bg-[#C7A56A] transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="py-12 text-center font-mono text-xs text-[#8A8A8A] border border-[rgba(243,240,232,0.12)]">
          LOADING MEDIA LIBRARY...
        </div>
      ) : files.length === 0 ? (
        <div className="py-12 text-center font-mono text-xs text-[#8A8A8A] border border-[rgba(243,240,232,0.12)]">
          MEDIA LIBRARY IS EMPTY. UPLOAD YOUR FIRST IMAGE OR VIDEO ABOVE.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {files.map((file) => (
            <div
              key={file.id}
              className="border border-[rgba(243,240,232,0.12)] bg-[#111111] p-4 space-y-3 flex flex-col justify-between group"
            >
              {/* Preview Thumbnail */}
              <div className="relative aspect-video w-full bg-black overflow-hidden border border-[rgba(243,240,232,0.08)]">
                {file.kind === "video" ? (
                  <video src={file.url} muted className="w-full h-full object-cover" />
                ) : (
                  <img src={file.url} alt={file.originalName} className="w-full h-full object-cover" />
                )}
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 text-[10px] font-mono uppercase text-[#C7A56A]">
                  {file.kind}
                </span>
              </div>

              {/* Info */}
              <div className="space-y-1 font-mono text-xs">
                <div className="font-bold truncate text-[#F3F0E8]" title={file.originalName}>
                  {file.originalName}
                </div>
                <div className="text-[10px] text-[#8A8A8A]">
                  {formatSize(file.size)} • {file.mimeType}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-[rgba(243,240,232,0.08)] flex items-center justify-between font-mono text-xs">
                <button
                  onClick={() => handleCopyUrl(file.url)}
                  className="text-[#C7A56A] hover:underline"
                >
                  {copiedUrl === file.url ? "COPIED! ✓" : "COPY URL"}
                </button>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="text-rose-400 hover:underline"
                >
                  DELETE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
