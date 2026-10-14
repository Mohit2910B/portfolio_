"use client";

import { useEffect } from "react";

interface VideoModalProps {
  videoUrl: string | null;
  title?: string;
  onClose: () => void;
}

function getGoogleDriveId(url: string | null): string | null {
  if (!url) return null;
  const matchUc = url.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
  if (matchUc) return matchUc[1];
  const matchFile = url.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/);
  if (matchFile) return matchFile[1];
  return null;
}

export default function VideoModal({ videoUrl, title, onClose }: VideoModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (videoUrl) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [videoUrl, onClose]);

  if (!videoUrl) return null;

  const driveId = getGoogleDriveId(videoUrl);
  const drivePreviewUrl = driveId ? `https://drive.google.com/file/d/${driveId}/preview` : null;
  const driveDirectUrl = driveId ? `https://drive.google.com/file/d/${driveId}/view` : null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl bg-[#0A0A0A] border border-[var(--border-color)] overflow-hidden shadow-2xl rounded-2xl flex flex-col"
      >
        {/* Top Header */}
        <div className="p-4 bg-[var(--bg-surface)] border-b border-[var(--border-color)] flex items-center justify-between font-mono text-xs text-[var(--text-secondary)]">
          <div className="flex items-center space-x-2 truncate max-w-md sm:max-w-xl">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-[var(--accent)] tracking-widest uppercase font-bold truncate">
              {title || "CINEMATIC VIDEO SHOWCASE"}
            </span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {driveDirectUrl && (
              <a
                href={driveDirectUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center space-x-1 px-3 py-1 bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--accent)] border border-[var(--border-color)] rounded-lg text-[11px] uppercase transition-all"
              >
                <span>OPEN IN DRIVE</span>
                <span>↗</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-[var(--accent)] text-[var(--bg-main)] font-bold rounded-lg text-xs uppercase tracking-wider hover:opacity-90 transition-all font-mono"
            >
              CLOSE [ESC]
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center">
          {drivePreviewUrl ? (
            <iframe
              src={drivePreviewUrl}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              title={title || "Video Player"}
            />
          ) : (
            <video
              src={videoUrl}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
}
