"use client";

import { useEffect, useRef, useState, useCallback } from "react";

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

function getYouTubeId(url: string | null): string | null {
  if (!url) return null;
  const matchWatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (matchWatch) return matchWatch[1];
  const matchShorts = url.match(/youtube\.com\/shorts\/([^"&?\/\s]{11})/i);
  if (matchShorts) return matchShorts[1];
  return null;
}

function getVimeoId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/i);
  return match ? match[3] : null;
}

export default function VideoModal({ videoUrl, title, onClose }: VideoModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aspectMode, setAspectMode] = useState<"auto" | "vertical" | "wide">("auto");

  // Track fullscreen changes across all vendor prefixes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as unknown as {
        fullscreenElement?: Element;
        webkitFullscreenElement?: Element;
        mozFullScreenElement?: Element;
        msFullscreenElement?: Element;
      };
      const active = Boolean(
        doc.fullscreenElement ||
          doc.webkitFullscreenElement ||
          doc.mozFullScreenElement ||
          doc.msFullscreenElement
      );
      setIsFullscreen(active);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  // Keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) {
          exitFullscreen();
        } else {
          onClose();
        }
      }
    };
    if (videoUrl) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [videoUrl, onClose, isFullscreen]);

  const enterFullscreen = useCallback(() => {
    // 1. Direct native video element fullscreen (preferred on iOS Safari)
    if (videoRef.current) {
      const vid = videoRef.current as unknown as {
        webkitEnterFullscreen?: () => void;
        requestFullscreen?: () => Promise<void>;
      };
      if (typeof vid.webkitEnterFullscreen === "function") {
        try {
          vid.webkitEnterFullscreen();
          return;
        } catch {}
      }
    }

    // 2. Fullscreen on the player container
    const elem = containerRef.current as unknown as {
      requestFullscreen?: () => Promise<void>;
      webkitRequestFullscreen?: () => void;
      mozRequestFullScreen?: () => void;
      msRequestFullscreen?: () => void;
    };

    if (!elem) return;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    const doc = document as unknown as {
      exitFullscreen?: () => Promise<void>;
      webkitExitFullscreen?: () => void;
      mozCancelFullScreen?: () => void;
      msExitFullscreen?: () => void;
    };
    if (doc.exitFullscreen) {
      doc.exitFullscreen().catch(() => {});
    } else if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen();
    } else if (doc.mozCancelFullScreen) {
      doc.mozCancelFullScreen();
    } else if (doc.msExitFullscreen) {
      doc.msExitFullscreen();
    }
  }, []);

  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  };

  if (!videoUrl) return null;

  const youtubeId = getYouTubeId(videoUrl);
  const vimeoId = !youtubeId ? getVimeoId(videoUrl) : null;
  const driveId = !youtubeId && !vimeoId ? getGoogleDriveId(videoUrl) : null;

  const isDirectNativeVideo =
    !youtubeId &&
    !vimeoId &&
    !driveId &&
    (videoUrl.startsWith("/uploads/") ||
      videoUrl.includes("blob.vercel-storage.com") ||
      Boolean(videoUrl.match(/\.(mp4|mov|webm|m4v)(\?.*)?$/i)));

  const drivePreviewUrl = driveId ? `https://drive.google.com/file/d/${driveId}/preview` : null;
  const driveDirectUrl = driveId ? `https://drive.google.com/file/d/${driveId}/view` : null;

  const isShort = Boolean(
    videoUrl.includes("/shorts/") ||
    (title && (title.toLowerCase().includes("short") || title.toLowerCase().includes("reel")))
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-6 animate-fade-in overflow-hidden"
    >
      <div
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full bg-[#0A0A0A] border border-[var(--border-color)] overflow-hidden shadow-2xl rounded-2xl flex flex-col transition-all duration-300 ${
          isFullscreen
            ? "fixed inset-0 w-screen h-screen rounded-none z-[200] max-w-none border-0"
            : aspectMode === "vertical" || (aspectMode === "auto" && isShort)
            ? "max-w-md max-h-[94vh]"
            : "max-w-5xl max-h-[92vh]"
        }`}
      >
        {/* Top Header / Mobile Control Bar */}
        <div className="p-3 sm:p-4 bg-[var(--bg-surface)] border-b border-[var(--border-color)] flex items-center justify-between font-mono text-xs text-[var(--text-secondary)] gap-2 shrink-0">
          <div className="flex items-center space-x-2 truncate min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-pulse shrink-0" />
            <span className="text-[var(--accent)] tracking-wider uppercase font-bold truncate text-[11px] sm:text-xs">
              {title || "CINEMATIC VIDEO SHOWCASE"}
            </span>
            {youtubeId && (
              <span className="hidden md:inline-flex px-2 py-0.5 rounded text-[9px] font-bold bg-rose-950 text-rose-400 border border-rose-500/30 shrink-0 uppercase tracking-widest">
                🔴 YOUTUBE HD
              </span>
            )}
            {isDirectNativeVideo && (
              <span className="hidden md:inline-flex px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30 shrink-0 uppercase tracking-widest">
                ⚡ 1080P/4K HQ
              </span>
            )}
            {drivePreviewUrl && (
              <span className="hidden md:inline-flex px-2 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-400 border border-amber-500/30 shrink-0 uppercase tracking-widest">
                ☁ DRIVE STREAM
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            {/* Aspect Fit Selector */}
            <button
              onClick={() =>
                setAspectMode((prev) =>
                  prev === "auto" ? "vertical" : prev === "vertical" ? "wide" : "auto"
                )
              }
              title="Toggle Aspect Fit"
              className="px-2.5 py-1.5 bg-[#161616] hover:bg-[#222] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white rounded-lg text-[10px] sm:text-[11px] font-mono uppercase tracking-wider flex items-center space-x-1 transition-all"
            >
              <span>{aspectMode === "vertical" ? "📱 9:16" : aspectMode === "wide" ? "🖥 16:9" : "FIT"}</span>
            </button>

            {/* Mobile Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-[var(--accent)] text-black font-bold rounded-lg text-[11px] uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all font-mono flex items-center space-x-1 shadow-md"
              title="Mobile Fullscreen"
            >
              <span className="text-sm leading-none">⛶</span>
              <span className="font-extrabold">{isFullscreen ? "EXIT" : "FULLSCREEN"}</span>
            </button>

            {/* YouTube Direct Link */}
            {youtubeId && (
              <a
                href={`https://www.youtube.com/watch?v=${youtubeId}`}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center space-x-1 px-3 py-1.5 bg-[var(--bg-main)] text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-lg text-[11px] uppercase transition-all"
                title="Open directly on YouTube"
              >
                <span>YOUTUBE</span>
                <span>↗</span>
              </a>
            )}

            {/* Drive Original link */}
            {driveDirectUrl && (
              <a
                href={driveDirectUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center space-x-1 px-3 py-1.5 bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--accent)] border border-[var(--border-color)] rounded-lg text-[11px] uppercase transition-all"
                title="Open directly in Google Drive player"
              >
                <span>OPEN HD</span>
                <span>↗</span>
              </a>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-[#1f1f1f] text-white hover:bg-rose-900 border border-white/10 rounded-lg text-xs uppercase font-mono transition-all font-bold"
              aria-label="Close Modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Video Player Container */}
        <div
          className={`relative w-full bg-black flex items-center justify-center overflow-hidden ${
            isFullscreen
              ? "flex-1 h-full max-h-none"
              : aspectMode === "vertical" || (aspectMode === "auto" && isShort)
              ? "h-[74vh] sm:h-[80vh]"
              : aspectMode === "wide"
              ? "aspect-video"
              : "h-[62vh] sm:h-[72vh] max-h-[82vh]"
          }`}
        >
          {youtubeId ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                title={title || "YouTube Video Player"}
              />
            </div>
          ) : vimeoId ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <iframe
                src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&color=c7a56a&title=0&byline=0&portrait=0`}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title={title || "Vimeo Video Player"}
              />
            </div>
          ) : isDirectNativeVideo && !drivePreviewUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              autoPlay
              playsInline
              controlsList="nodownload"
              className="w-full h-full object-contain max-h-full"
            />
          ) : drivePreviewUrl ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <iframe
                src={drivePreviewUrl}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
                title={title || "Video Player"}
              />

              {/* Mobile Quick Tap Fullscreen Helper */}
              <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
                <button
                  onClick={toggleFullscreen}
                  className="px-3.5 py-2 rounded-full bg-black/80 backdrop-blur-md border border-[var(--accent)]/50 text-[var(--accent)] text-xs font-mono font-bold uppercase tracking-wider shadow-2xl hover:bg-[var(--accent)] hover:text-black transition-all flex items-center space-x-1.5"
                >
                  <span>⛶</span>
                  <span>{isFullscreen ? "MINIMIZE" : "EXPAND FULLSCREEN"}</span>
                </button>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain max-h-full"
            />
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className="px-4 py-2 bg-[#080808] border-t border-[var(--border-color)]/50 flex flex-wrap items-center justify-between text-[10px] font-mono text-[var(--text-secondary)] gap-2 shrink-0">
          <div className="flex items-center space-x-2">
            <span>SOURCE:</span>
            {youtubeId ? (
              <span className="text-rose-400 font-bold">YOUTUBE CLOUD STREAM (HD / NO PERMISSIONS REQUIRED)</span>
            ) : isDirectNativeVideo && !drivePreviewUrl ? (
              <span className="text-emerald-400 font-bold">HIGH-QUALITY NATIVE MP4 / MOV</span>
            ) : (
              <span className="text-amber-400 font-bold">GOOGLE DRIVE PREVIEW STREAM</span>
            )}
          </div>

          <div className="flex items-center space-x-3 text-[10px]">
            {youtubeId && (
              <a
                href={`https://www.youtube.com/watch?v=${youtubeId}`}
                target="_blank"
                rel="noreferrer"
                className="text-rose-400 hover:underline"
              >
                Watch on YouTube ↗
              </a>
            )}
            {driveDirectUrl && (
              <a
                href={driveDirectUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline"
              >
                Drive App Stream ↗
              </a>
            )}
            <span className="text-[var(--text-secondary)] hidden sm:inline">Press ESC to Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
