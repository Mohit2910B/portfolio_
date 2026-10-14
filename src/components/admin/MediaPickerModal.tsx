"use client";

import { useEffect, useState } from "react";

interface MediaFile {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  kind: "video" | "image" | "file";
  size: number;
  url: string;
  createdAt: string;
}

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  filterKind?: "video" | "image";
}

export default function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  filterKind,
}: MediaPickerModalProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/media");
      const data = await res.json();
      if (data.files) {
        setFiles(data.files);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed.");
      }

      const data = await res.json();
      if (data.file) {
        setFiles((prev) => [data.file, ...prev]);
        onSelect(data.file.url);
        onClose();
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const filteredFiles = filterKind
    ? files.filter((f) => f.kind === filterKind)
    : files;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-[rgba(255,255,255,0.2)] rounded-2xl p-6 w-full max-w-3xl max-h-[85vh] flex flex-col space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.12)] pb-4">
          <div>
            <span className="font-mono text-[10px] text-[#C8A66A] uppercase tracking-widest">
              MEDIA SELECTOR
            </span>
            <h3 className="font-display font-bold text-lg text-[#F5F3EE] uppercase tracking-tight">
              SELECT FROM MEDIA LIBRARY {filterKind ? `(${filterKind.toUpperCase()}S)` : ""}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#A5A5A5] hover:text-[#F5F3EE] font-mono text-xs px-3 py-1 bg-[rgba(255,255,255,0.06)] rounded-full"
          >
            CLOSE [ESC]
          </button>
        </div>

        {/* Upload Button Inline */}
        <div className="flex items-center justify-between bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] p-3 rounded-xl">
          <span className="font-mono text-xs text-[#A5A5A5]">
            Need a new file? Upload directly to Media Library:
          </span>
          <label className="px-4 py-2 bg-[#C8A66A] text-[#08090B] font-mono text-xs font-bold rounded-full cursor-pointer hover:bg-[#D9B77B] transition-all">
            {uploading ? "UPLOADING..." : "⬆ UPLOAD FILE"}
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept={filterKind === "video" ? "video/*" : filterKind === "image" ? "image/*" : "*"}
            />
          </label>
        </div>

        {uploadError && (
          <div className="p-3 bg-rose-950/50 border border-rose-500/40 text-rose-300 font-mono text-xs rounded-xl">
            {uploadError}
          </div>
        )}

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-12 text-center font-mono text-xs text-[#A5A5A5]">
              LOADING MEDIA LIBRARY...
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="py-12 text-center font-mono text-xs text-[#A5A5A5]">
              NO {filterKind ? filterKind.toUpperCase() : "MEDIA"} FILES FOUND IN LIBRARY. UPLOAD ONE ABOVE.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredFiles.map((f) => (
                <div
                  key={f.id}
                  onClick={() => {
                    onSelect(f.url);
                    onClose();
                  }}
                  className="group relative bg-[#08090B] border border-[rgba(255,255,255,0.1)] rounded-xl overflow-hidden cursor-pointer hover:border-[#C8A66A] transition-all"
                >
                  <div className="aspect-video bg-black flex items-center justify-center overflow-hidden">
                    {f.kind === "video" ? (
                      <video src={f.url} className="w-full h-full object-cover" muted loop />
                    ) : f.kind === "image" ? (
                      <img src={f.url} alt={f.originalName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="font-mono text-xs text-[#A5A5A5]">FILE</div>
                    )}
                  </div>
                  <div className="p-2 bg-[rgba(255,255,255,0.04)] font-mono text-[10px] text-[#A5A5A5] truncate group-hover:text-[#C8A66A]">
                    {f.originalName}
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="px-3 py-1 bg-[#C8A66A] text-[#08090B] font-mono text-[10px] font-bold rounded-full uppercase">
                      SELECT
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
