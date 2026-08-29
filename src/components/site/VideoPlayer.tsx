"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatDuration } from "@/lib/carousel";
import { parseMediaUrl } from "@/lib/media-urls";

type Props = {
  src: string;
  poster?: string;
  ratio?: string;
  autoPlay?: boolean;
  className?: string;
  onClose?: () => void;
  onAspectRatioDetected?: (isVertical: boolean) => void;
};

export default function VideoPlayer({
  src,
  poster,
  ratio = "16:9",
  autoPlay = true,
  className = "",
  onClose,
  onAspectRatioDetected,
}: Props) {
  const media = useMemo(() => parseMediaUrl(src), [src]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [detectedVertical, setDetectedVertical] = useState<boolean | null>(null);

  const [w, h] = (ratio || "16:9").split(":").map(Number);
  const isDeclaredVertical = (w && h && h > w) || ratio === "9:16" || ratio === "4:5" || media.isVertical;
  const isVertical = detectedVertical !== null ? detectedVertical : isDeclaredVertical;

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => setFailed(true));
    } else {
      video.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }, []);

  const goFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const container = video.parentElement ?? video;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void container.requestFullscreen?.();
    }
  }, []);

  const seek = (event: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratioX = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    video.currentTime = ratioX * video.duration;
  };

  useEffect(() => {
    if (media.type !== "direct") {
      setLoading(false);
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => {
      setCurrent(video.currentTime);
      if (Number.isFinite(video.duration) && video.duration > 0) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };
    const onLoaded = () => {
      if (video.videoWidth && video.videoHeight) {
        const isVert = video.videoHeight > video.videoWidth;
        setDetectedVertical(isVert);
        onAspectRatioDetected?.(isVert);
      }
      setDuration(video.duration);
      setLoading(false);
      setFailed(false);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => {
      setLoading(false);
      setFailed(true);
    };
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);

    video.addEventListener("timeupdate", onTime);
    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("canplay", onLoaded);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("error", onError);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("canplay", onLoaded);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("error", onError);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
    };
  }, [src, attempt, media.type, onAspectRatioDetected]);

  // 1. IFRAME EMBED PLAYER (Instagram, Google Drive, YouTube, Vimeo)
  if (media.embedUrl) {
    return (
      <div
        className={`group relative mx-auto w-full overflow-hidden rounded-2xl bg-black ${
          isVertical
            ? "max-w-[340px] sm:max-w-[370px] aspect-[9/16] max-h-[68vh]"
            : "max-w-full aspect-video max-h-[68vh]"
        } ${className}`}
      >
        <iframe
          src={media.embedUrl}
          title="Video preview"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0 bg-black"
        />
      </div>
    );
  }

  // 2. NATIVE HTML5 PLAYER (Direct MP4 / WebM / Blob)
  return (
    <div
      className={`group relative mx-auto w-full overflow-hidden rounded-2xl bg-black ${
        isVertical
          ? "max-w-[340px] sm:max-w-[370px] aspect-[9/16] max-h-[68vh]"
          : "max-w-full aspect-video max-h-[68vh]"
      } ${className}`}
    >
      <video
        ref={videoRef}
        key={`${src}-${attempt}`}
        src={media.streamUrl || src}
        poster={poster || undefined}
        className="absolute inset-0 h-full w-full bg-black object-contain"
        playsInline
        controls={false}
        preload="metadata"
        autoPlay={autoPlay}
        tabIndex={0}
        aria-label="Project video player"
        onKeyDown={(event) => {
          if (event.key === " " || event.key === "k") {
            event.preventDefault();
            togglePlay();
          }
          if (event.key === "m") toggleMute();
        }}
      >
        <track kind="captions" />
      </video>

      {loading && !failed && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="h-9 w-9 animate-spin rounded-full border border-white/25 border-t-white" />
        </div>
      )}

      {failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 p-6 text-center">
          <p className="text-xs font-semibold text-white">Playback error</p>
          <p className="text-[0.68rem] text-white/60">The video could not be loaded directly.</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setFailed(false);
                setLoading(true);
                setAttempt((a) => a + 1);
              }}
              className="btn btn-accent btn-xs"
            >
              Retry
            </button>
            <a
              href={src}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-ghost btn-xs text-white"
            >
              Open source link
            </a>
          </div>
        </div>
      )}

      {/* Hover Controls */}
      <div
        className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/80 via-transparent to-black/40 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100"
        onClick={(e) => {
          if (e.target === e.currentTarget) togglePlay();
        }}
      >
        <div className="flex items-center justify-between">
          <span className="mono text-[0.65rem] uppercase tracking-widest text-white/70">
            {formatDuration(current)} / {formatDuration(duration)}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close video"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2" fill="none">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          )}
        </div>

        {/* Big Center Play Button */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
            className="grid h-14 w-14 place-items-center rounded-full bg-white/20 text-white backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
          >
            {playing ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" className="translate-x-0.5">
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
            )}
          </button>
        </div>

        {/* Bottom Bar */}
        <div className="space-y-2">
          {/* Progress Bar */}
          <div
            className="group/track relative h-1.5 w-full cursor-pointer rounded-full bg-white/20 hover:h-2 transition-all"
            onClick={seek}
          >
            <div
              className="h-full rounded-full bg-[var(--accent)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? "Pause" : "Play"}
                className="text-white hover:opacity-80 transition-opacity"
              >
                {playing ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
                    <path d="M5 3l14 9-14 9V3z" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? "Unmute" : "Mute"}
                className="text-white hover:opacity-80 transition-opacity"
              >
                {muted ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
                  </svg>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={goFullscreen}
              aria-label="Fullscreen"
              className="text-white hover:opacity-80 transition-opacity"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
