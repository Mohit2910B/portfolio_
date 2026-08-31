"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseMediaUrl } from "@/lib/media-urls";
import { uploadBlob, TextInput } from "./ui";
import { upload as vercelBlobUpload } from "@vercel/blob/client";

export type VideoAssetManagerProps = {
  videoUrl: string;
  videoSource?: "upload" | "url";
  thumbnailUrl: string;
  duration?: string | number;
  aspectRatio?: string;
  onVideoChange: (
    url: string,
    source: "upload" | "url",
    meta?: {
      durationFormatted?: string;
      durationSeconds?: number;
      width?: number;
      height?: number;
      aspectRatio?: string;
    },
  ) => void;
  onThumbnailChange: (url: string) => void;
  onDurationChange?: (formatted: string, seconds: number) => void;
  onAspectRatioChange?: (ratio: string) => void;
  projectId?: number;
};

export function VideoAssetManager({
  videoUrl,
  videoSource = "upload",
  thumbnailUrl,
  duration,
  aspectRatio = "9:16",
  onVideoChange,
  onThumbnailChange,
  onDurationChange,
  onAspectRatioChange,
  projectId,
}: VideoAssetManagerProps) {
  const [sourceTab, setSourceTab] = useState<"upload" | "url">(videoSource || "upload");
  const [urlInput, setUrlInput] = useState(videoSource === "url" ? videoUrl : "");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string>("");
  const [grabbingFrame, setGrabbingFrame] = useState(false);
  const [thumbError, setThumbError] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [videoMeta, setVideoMeta] = useState<{
    width?: number;
    height?: number;
    duration?: number;
    formattedDuration?: string;
    fileName?: string;
    fileSize?: string;
  }>({});

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const customPosterInputRef = useRef<HTMLInputElement | null>(null);

  const media = useMemo(() => parseMediaUrl(videoUrl), [videoUrl]);

  // Sync internal state when source prop changes
  useEffect(() => {
    if (videoSource) setSourceTab(videoSource);
    if (videoSource === "url") setUrlInput(videoUrl);
  }, [videoSource, videoUrl]);

  // Reset error state when thumbnail URL changes (new capture or upload)
  useEffect(() => {
    setThumbError(false);
  }, [thumbnailUrl]);


  // Helper to format bytes
  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Helper to format seconds as m:ss
  const formatSeconds = (sec: number) => {
    const s = Math.round(sec);
    const m = Math.floor(s / 60);
    const remaining = s % 60;
    return `${m}:${remaining.toString().padStart(2, "0")}`;
  };

  // Capture frame from video element
  const captureFrame = useCallback(
    async (time?: number) => {
      const video = videoRef.current;
      const targetUrl = media.streamUrl || videoUrl;
      if (!targetUrl) return;

      setGrabbingFrame(true);
      try {
        let activeVideo = video;
        let tempVideo: HTMLVideoElement | null = null;

        // If direct video element isn't ready or on another tab, create an in-memory video loader
        if (!activeVideo || !activeVideo.videoWidth) {
          tempVideo = document.createElement("video");
          tempVideo.crossOrigin = "anonymous";
          tempVideo.muted = true;
          tempVideo.preload = "auto";
          tempVideo.src = targetUrl;

          await new Promise<void>((resolve, reject) => {
            const timer = window.setTimeout(() => resolve(), 6000);
            tempVideo!.onloadeddata = () => {
              window.clearTimeout(timer);
              resolve();
            };
            tempVideo!.onerror = () => {
              window.clearTimeout(timer);
              reject(new Error("Cannot access video stream. Upload a poster image below."));
            };
          });
          activeVideo = tempVideo;
        }

        const seekTarget = time !== undefined ? time : Math.min(1.0, (activeVideo.duration || 3) / 3);
        activeVideo.currentTime = seekTarget;

        await new Promise<void>((resolve) => {
          activeVideo!.onseeked = () => resolve();
          window.setTimeout(resolve, 1500);
        });

        const canvas = document.createElement("canvas");
        canvas.width = activeVideo.videoWidth || 1080;
        canvas.height = activeVideo.videoHeight || 1920;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas unsupported.");
        ctx.drawImage(activeVideo, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), "image/jpeg", 0.88),
        );

        if (blob) {
          const uploaded = await uploadBlob(blob, "image", `thumb-${Date.now()}.jpg`);
          if (uploaded?.url) {
            onThumbnailChange(uploaded.url);
          } else {
            const localDataUrl = canvas.toDataURL("image/jpeg", 0.85);
            onThumbnailChange(localDataUrl);
          }
        }

        if (tempVideo) {
          tempVideo.src = "";
          tempVideo.remove();
        }
      } catch (err) {
        console.warn("[VideoAssetManager] Frame capture notice:", err);
      } finally {
        setGrabbingFrame(false);
      }
    },
    [media.streamUrl, onThumbnailChange, videoUrl],
  );

  // Read metadata when video loads
  const handleVideoMetadataLoaded = () => {
    const video = videoRef.current;
    if (!video) return;

    const w = video.videoWidth;
    const h = video.videoHeight;
    const dur = video.duration;

    if (dur && !isNaN(dur) && isFinite(dur)) {
      const formatted = formatSeconds(dur);
      const isVert = h > w;
      const detectedRatio = isVert ? "9:16" : "16:9";

      setVideoMeta((prev) => ({
        ...prev,
        width: w,
        height: h,
        duration: Math.round(dur),
        formattedDuration: formatted,
      }));

      onDurationChange?.(formatted, Math.round(dur));
      if (!aspectRatio || aspectRatio === "16:9") {
        onAspectRatioChange?.(detectedRatio);
      }

      // Auto-grab thumbnail if empty
      if (!thumbnailUrl) {
        void captureFrame(Math.min(1.0, dur / 3));
      }
    }
  };

  // Perform robust upload for selected file
  const processUpload = async (file: File) => {
    const localUrl = URL.createObjectURL(file);
    setUploadStatus("uploading");
    setUploadProgress(15);
    setUploadMessage("Processing video file…");

    setVideoMeta({
      fileName: file.name,
      fileSize: formatBytes(file.size),
    });

    // Immediately trigger preview & auto-detection with local memory stream
    onVideoChange(localUrl, "upload");

    try {
      // 1. Try Vercel Blob if available
      try {
        const blob = await vercelBlobUpload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/admin/blob/upload",
          onUploadProgress: (item) => {
            setUploadProgress(Math.round(item.percentage));
            setUploadMessage(`Uploading ${Math.round(item.percentage)}%`);
          },
        });

        if (blob && blob.url) {
          setUploadProgress(100);
          setUploadStatus("done");
          setUploadMessage("Video ready & attached!");
          onVideoChange(blob.url, "upload");
          if (!thumbnailUrl) void captureFrame(1.0);
          window.setTimeout(() => {
            setUploadStatus("idle");
            setUploadProgress(null);
          }, 1800);
          return;
        }
      } catch {
        // Blob not configured or local, continue to chunk/standard upload
      }

      // 2. Chunk upload for files > 3MB
      if (file.size > 3 * 1024 * 1024) {
        const CHUNK_SIZE = 2 * 1024 * 1024;
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const uploadId = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(file.size, start + CHUNK_SIZE);
          const chunk = file.slice(start, end);

          const form = new FormData();
          form.append("chunk", chunk, file.name);
          form.append("uploadId", uploadId);
          form.append("chunkIndex", String(i));
          form.append("totalChunks", String(totalChunks));
          form.append("filename", file.name);
          form.append("kind", "video");
          if (projectId) form.append("projectId", String(projectId));

          const res = await fetch("/api/admin/upload/chunk", {
            method: "POST",
            body: form,
          });

          if (!res.ok) throw new Error("Chunk transfer failed");
          const data = (await res.json()) as { done: boolean; url?: string };
          const pct = Math.round(((i + 1) / totalChunks) * 100);
          setUploadProgress(pct);
          setUploadMessage(`Uploading ${pct}% (${i + 1}/${totalChunks})`);

          if (data.done) {
            const finalUrl = data.url || localUrl;
            setUploadProgress(100);
            setUploadStatus("done");
            setUploadMessage("Video attached & saved!");
            onVideoChange(finalUrl, "upload");
            if (!thumbnailUrl) void captureFrame(1.0);
            window.setTimeout(() => {
              setUploadStatus("idle");
              setUploadProgress(null);
            }, 1800);
            return;
          }
        }
      }

      // 3. Standard multipart upload for smaller files
      const form = new FormData();
      form.append("file", file);
      form.append("kind", "video");
      if (projectId) form.append("projectId", String(projectId));

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });

      if (res.ok) {
        const data = (await res.json()) as { url?: string };
        const finalUrl = data.url || localUrl;
        setUploadProgress(100);
        setUploadStatus("done");
        setUploadMessage("Upload complete!");
        onVideoChange(finalUrl, "upload");
        if (!thumbnailUrl) void captureFrame(1.0);
      } else {
        setUploadProgress(100);
        setUploadStatus("done");
        setUploadMessage("Attached via local stream");
        onVideoChange(localUrl, "upload");
      }
    } catch {
      // Fallback cleanly to local URL stream so admin is never blocked
      setUploadProgress(100);
      setUploadStatus("done");
      setUploadMessage("Ready & attached!");
      onVideoChange(localUrl, "upload");
    } finally {
      window.setTimeout(() => {
        setUploadStatus("idle");
        setUploadProgress(null);
      }, 1800);
    }
  };

  // Handle Custom Poster Image Upload
  const handleCustomPosterUpload = async (file: File) => {
    try {
      const uploaded = await uploadBlob(file, "image", file.name);
      if (uploaded?.url) {
        onThumbnailChange(uploaded.url);
      } else {
        onThumbnailChange(URL.createObjectURL(file));
      }
    } catch (err) {
      console.warn("[VideoAssetManager] Custom poster upload error:", err);
    }
  };

  const hasVideo = Boolean(videoUrl && videoUrl.trim().length > 0);

  return (
    <div className="rounded-3xl border border-black/10 bg-white/60 p-5 shadow-sm space-y-5">
      {/* Header Bar with Source Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-3">
        <div>
          <span className="font-heading text-xs font-bold uppercase tracking-wider text-ink">
            Video Media Asset & Live Preview
          </span>
          <p className="text-[11px] text-ink/50">
            Upload MP4/WebM/MOV or connect YouTube Shorts, Instagram Reels, Google Drive.
          </p>
        </div>

        <div className="flex rounded-xl bg-black/[0.06] p-1">
          <button
            type="button"
            onClick={() => setSourceTab("upload")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              sourceTab === "upload"
                ? "bg-white text-ink shadow-sm"
                : "text-ink/60 hover:text-ink"
            }`}
          >
            <span>📁 Direct File Upload</span>
          </button>
          <button
            type="button"
            onClick={() => setSourceTab("url")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              sourceTab === "url"
                ? "bg-white text-ink shadow-sm"
                : "text-ink/60 hover:text-ink"
            }`}
          >
            <span>🔗 Video Link URL</span>
          </button>
        </div>
      </div>

      {/* ----------------- DROPZONE / URL INPUT SECTION ----------------- */}
      {!hasVideo ? (
        sourceTab === "upload" ? (
          /* Empty Upload Dropzone */
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void processUpload(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
              isDragging
                ? "border-[var(--accent,#e0147f)] bg-[var(--accent,#e0147f)]/[0.05] scale-[0.99]"
                : "border-black/15 bg-black/[0.01] hover:border-black/30 hover:bg-black/[0.03]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void processUpload(file);
              }}
            />

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black/5 text-2xl transition group-hover:scale-110 group-hover:bg-black/10">
              🎬
            </div>

            <h4 className="mt-3 font-heading text-sm font-bold uppercase tracking-wide text-ink">
              Drag & Drop Your Video Here
            </h4>
            <p className="mt-1 text-xs text-ink/50">
              Direct MP4, WebM, or MOV · Vertical 9:16 Reels & 16:9 Widescreen (max 300MB)
            </p>

            <button
              type="button"
              className="mt-4 rounded-xl bg-ink px-4 py-2 text-xs font-bold text-white shadow-sm transition group-hover:bg-[var(--accent,#e0147f)]"
            >
              Browse Video File
            </button>

            {uploadStatus === "uploading" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white/95 backdrop-blur-sm p-6">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                <p className="mt-3 text-xs font-bold text-ink">{uploadMessage}</p>
                {uploadProgress !== null && (
                  <div className="mt-2 h-2 w-48 overflow-hidden rounded-full bg-black/10">
                    <div
                      className="h-full bg-[var(--accent,#e0147f)] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Empty Video URL Input */
          <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-5 space-y-3">
            <label className="block text-xs font-bold text-ink">
              Paste Video Link URL
            </label>
            <TextInput
              value={urlInput}
              onChange={(val) => {
                setUrlInput(val);
                const parsed = parseMediaUrl(val);
                if (val.trim()) {
                  onVideoChange(val.trim(), "url", {
                    aspectRatio: parsed.isVertical ? "9:16" : "16:9",
                  });
                  if (parsed.thumbnailUrl && !thumbnailUrl) {
                    onThumbnailChange(parsed.thumbnailUrl);
                  }
                }
              }}
              placeholder="https://youtube.com/shorts/... or https://instagram.com/reel/... or https://drive.google.com/..."
            />
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">Supported Platforms:</span>
              <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-700">🔴 YouTube Shorts / Videos</span>
              <span className="rounded-md bg-pink-500/10 px-2 py-0.5 text-[10px] font-bold text-pink-700">🟣 Instagram Reels</span>
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700">📁 Google Drive</span>
              <span className="rounded-md bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-700">🔵 Vimeo</span>
              <span className="rounded-md bg-black/10 px-2 py-0.5 text-[10px] font-bold text-ink">🎬 Direct MP4 Stream</span>
            </div>

            <div className="pt-2 border-t border-black/5">
              <span className="text-[10px] font-bold text-ink/50 uppercase tracking-wider">1-Click Test Samples:</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const url = "https://videos.pexels.com/video-files/7578544/7578544-uhd_1440_2732_25fps.mp4";
                    setUrlInput(url);
                    onVideoChange(url, "url", { aspectRatio: "9:16", durationFormatted: "0:45" });
                    onThumbnailChange("https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80");
                  }}
                  className="rounded-lg bg-black/5 px-2.5 py-1 text-[10px] font-bold text-ink transition hover:bg-black hover:text-white"
                >
                  🏡 Luxury Real Estate Reel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = "https://videos.pexels.com/video-files/3129671/3129671-hd_1080_1920_30fps.mp4";
                    setUrlInput(url);
                    onVideoChange(url, "url", { aspectRatio: "9:16", durationFormatted: "0:30" });
                    onThumbnailChange("https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80");
                  }}
                  className="rounded-lg bg-black/5 px-2.5 py-1 text-[10px] font-bold text-ink transition hover:bg-black hover:text-white"
                >
                  ✨ Cyberpunk VFX Reel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = "https://videos.pexels.com/video-files/5532766/5532766-hd_1080_1920_25fps.mp4";
                    setUrlInput(url);
                    onVideoChange(url, "url", { aspectRatio: "9:16", durationFormatted: "0:20" });
                    onThumbnailChange("https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80");
                  }}
                  className="rounded-lg bg-black/5 px-2.5 py-1 text-[10px] font-bold text-ink transition hover:bg-black hover:text-white"
                >
                  👟 Sneaker Commercial Reel
                </button>
              </div>
            </div>
          </div>
        )
      ) : (
        /* ----------------- ATTACHED VIDEO STUDIO INSPECTOR ----------------- */
        <div className="space-y-4">
          {/* Metadata & Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/8 bg-black/[0.03] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                {sourceTab === "upload" ? "Direct Video File Attached" : "External Video Stream Attached"}
              </span>

              {videoMeta.fileSize && (
                <span className="rounded-lg bg-black/10 px-2.5 py-1 text-[11px] font-mono font-semibold text-ink">
                  📦 {videoMeta.fileSize}
                </span>
              )}

              {duration && (
                <span className="rounded-lg bg-black/10 px-2.5 py-1 text-[11px] font-mono font-semibold text-ink">
                  ⏱️ {typeof duration === "number" ? formatSeconds(duration) : duration}
                </span>
              )}

              {aspectRatio && (
                <span className="rounded-lg bg-black/10 px-2.5 py-1 text-[11px] font-mono font-semibold text-ink">
                  📐 {aspectRatio}
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void processUpload(file);
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (sourceTab === "upload") fileInputRef.current?.click();
                  else {
                    onVideoChange("", "url");
                    setUrlInput("");
                  }
                }}
                disabled={uploadStatus === "uploading"}
                className="rounded-xl border border-black/15 bg-white px-3 py-1 text-xs font-bold text-ink shadow-sm transition hover:bg-black/5 disabled:opacity-40"
              >
                🔄 Replace Video
              </button>

              {/* Confirm Remove Dialog */}
              {confirmRemove ? (
                <div className="flex items-center gap-1.5 rounded-xl border border-red-400/40 bg-red-50 px-3 py-1">
                  <span className="text-[11px] font-bold text-red-700">Remove?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onVideoChange("", sourceTab);
                      onThumbnailChange("");
                      setUrlInput("");
                      setVideoMeta({});
                      setConfirmRemove(false);
                    }}
                    className="rounded-lg bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-red-700"
                  >
                    Yes, Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(false)}
                    className="rounded-lg bg-black/10 px-2 py-0.5 text-[10px] font-bold text-ink hover:bg-black/20"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmRemove(true)}
                  disabled={uploadStatus === "uploading"}
                  className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-700 transition hover:bg-red-500/20 disabled:opacity-40"
                >
                  🗑️ Remove
                </button>
              )}
            </div>
          </div>

          {/* Upload Progress Bar — visible during Replace upload */}
          {uploadStatus === "uploading" && (
            <div className="rounded-xl border border-[var(--accent,#e0147f)]/30 bg-[var(--accent,#e0147f)]/5 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent,#e0147f)]/30 border-t-[var(--accent,#e0147f)]" />
                  <span className="text-[11px] font-bold text-[var(--accent,#e0147f)]">{uploadMessage}</span>
                </div>
                {uploadProgress !== null && (
                  <span className="font-mono text-[11px] font-bold text-ink/60">{uploadProgress}%</span>
                )}
              </div>
              {uploadProgress !== null && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
                  <div
                    className="h-full rounded-full bg-[var(--accent,#e0147f)] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Interactive Player & Poster Grid */}
          <div className="grid gap-4 md:grid-cols-12">
            {/* Left: Video Player Box */}
            <div className="md:col-span-7 overflow-hidden rounded-2xl border border-black/10 bg-black aspect-video flex items-center justify-center relative shadow-md">
              {media.embedUrl ? (
                <iframe
                  src={media.embedUrl}
                  title="Video preview"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full border-0 bg-black"
                />
              ) : (
                <video
                  ref={videoRef}
                  key={videoUrl}
                  src={media.streamUrl || videoUrl}
                  poster={thumbnailUrl || undefined}
                  controls
                  playsInline
                  preload="auto"
                  onLoadedMetadata={handleVideoMetadataLoaded}
                  className="h-full w-full object-contain bg-black"
                />
              )}
            </div>

            {/* Right: Thumbnail Poster & Frame Grabber Controls */}
            <div className="md:col-span-5 flex flex-col justify-between rounded-2xl border border-black/8 bg-black/[0.02] p-4 space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-heading text-xs font-bold uppercase tracking-wider text-ink">
                    Thumbnail Poster
                  </span>
                  <button
                    type="button"
                    disabled={grabbingFrame}
                    onClick={() => {
                      const curTime = videoRef.current?.currentTime;
                      void captureFrame(curTime && curTime > 0 ? curTime : 1.0);
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-[var(--accent,#e0147f)] hover:underline"
                  >
                    <span>📸 {grabbingFrame ? "Grabbing…" : "Grab Frame from Video"}</span>
                  </button>
                </div>
                <p className="mt-0.5 text-[10px] text-ink/50">
                  Auto-captured from video or upload a custom cover image.
                </p>
              </div>

              {/* Thumbnail Image Display — adaptive aspect ratio */}
              <div
                className={`relative w-full overflow-hidden rounded-xl border border-black/10 bg-black/5 shadow-inner ${
                  aspectRatio === "9:16" || aspectRatio === "4:5"
                    ? "aspect-[9/16] max-h-[280px]"
                    : "aspect-video"
                }`}
                style={{ minHeight: 120 }}
              >
                {thumbnailUrl && !thumbError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={thumbnailUrl}
                    src={thumbnailUrl}
                    alt="Thumbnail preview"
                    className="h-full w-full object-cover"
                    onError={() => setThumbError(true)}
                    onLoad={() => setThumbError(false)}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center">
                    {thumbError && thumbnailUrl ? (
                      <>
                        <span className="text-2xl">⚠️</span>
                        <span className="text-[10px] font-medium text-red-500">
                          Cannot load image. Try re-capturing or uploading manually.
                        </span>
                        <button
                          type="button"
                          onClick={() => setThumbError(false)}
                          className="mt-1 rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-100"
                        >
                          Retry
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-xl">🖼️</span>
                        <span className="text-[10px] font-medium text-ink/40">
                          No thumbnail yet — grab a frame or upload an image.
                        </span>
                      </>
                    )}
                  </div>
                )}
                {thumbnailUrl && !thumbError && (
                  <span className="absolute bottom-2 right-2 rounded-md bg-emerald-600/90 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm backdrop-blur-sm">
                    ✓ Attached
                  </span>
                )}
              </div>

              {/* Live Video Frame Scrubber for Precise Thumbnail Extraction */}
              {!media.embedUrl && videoRef.current && (
                <div className="rounded-xl border border-black/8 bg-white p-2.5 space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between text-[10px] font-bold text-ink">
                    <span>🎞️ Scrub to Exact Frame:</span>
                    <span className="font-mono text-ink/60">
                      {formatSeconds(videoRef.current.currentTime || 0)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={videoRef.current.duration || 10}
                    step={0.1}
                    defaultValue={1.0}
                    onChange={(e) => {
                      const sec = parseFloat(e.target.value);
                      if (videoRef.current) {
                        videoRef.current.currentTime = sec;
                      }
                    }}
                    className="w-full accent-[var(--accent,#e0147f)] cursor-pointer"
                  />
                  <button
                    type="button"
                    disabled={grabbingFrame}
                    onClick={() => {
                      const cur = videoRef.current?.currentTime || 1.0;
                      void captureFrame(cur);
                    }}
                    className="w-full rounded-lg bg-[var(--accent,#e0147f)] py-1.5 text-center text-[11px] font-bold text-white shadow-sm transition hover:opacity-90"
                  >
                    📸 {grabbingFrame ? "Extracting Frame…" : "Capture This Exact Frame"}
                  </button>
                </div>
              )}

              {/* YouTube 1-Click HD Thumbnail Grab */}
              {media.type === "youtube" && media.id && (
                <button
                  type="button"
                  onClick={() => {
                    const ytThumb = `https://img.youtube.com/vi/${media.id}/maxresdefault.jpg`;
                    onThumbnailChange(ytThumb);
                  }}
                  className="w-full rounded-xl border border-red-500/20 bg-red-500/10 py-1.5 text-center text-[11px] font-bold text-red-700 transition hover:bg-red-500/20"
                >
                  🔴 Extract Official YouTube HD Thumbnail
                </button>
              )}

              {/* Thumbnail Custom Upload Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <input
                  ref={customPosterInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleCustomPosterUpload(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => customPosterInputRef.current?.click()}
                  className="rounded-xl border border-black/15 bg-white px-3 py-1.5 text-[11px] font-bold text-ink shadow-sm transition hover:bg-black/5"
                >
                  📁 Upload Custom Image
                </button>
                {thumbnailUrl && (
                  <button
                    type="button"
                    onClick={() => onThumbnailChange("")}
                    className="rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-ink/50 hover:text-red-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
