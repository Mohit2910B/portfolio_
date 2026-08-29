"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatDuration } from "@/lib/carousel";

type Props = {
  src: string;
  poster?: string;
  ratio?: string;
  autoPlay?: boolean;
  className?: string;
  onClose?: () => void;
};

export default function VideoPlayer({
  src,
  poster,
  ratio = "16:9",
  autoPlay = true,
  className = "",
  onClose,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const pad = (() => {
    const [w, h] = (ratio || "16:9").split(":").map(Number);
    return w && h ? (h / w) * 100 : 56.25;
  })();

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
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => {
      setCurrent(video.currentTime);
      if (Number.isFinite(video.duration) && video.duration > 0) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };
    const onLoaded = () => {
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
  }, [src, attempt]);

  return (
    <div
      className={`group relative w-full overflow-hidden rounded-2xl bg-black ${className}`}
      style={{ paddingBottom: `${pad}%` }}
    >
      <video
        ref={videoRef}
        key={`${src}-${attempt}`}
        src={src}
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
        <div className="absolute inset-0 grid place-items-center bg-black/85 px-6 text-center">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-white/50">
              Playback error
            </p>
            <p className="mt-3 max-w-sm text-sm text-white/80">
              This video format could not be played in your browser, or the source is unavailable.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFailed(false);
                  setLoading(true);
                  setAttempt((a) => a + 1);
                }}
                className="btn btn-light btn-xs"
              >
                Retry
              </button>
              {onClose && (
                <button type="button" onClick={onClose} className="btn btn-xs border border-white/25 text-white">
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {!playing && !failed && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Play video"
          className="absolute inset-0 grid place-items-center bg-gradient-to-t from-black/45 via-transparent to-black/10"
        >
          <span className="grid h-16 w-16 place-items-center rounded-full border border-white/40 bg-white/15 backdrop-blur-md transition-transform duration-300 hover:scale-110">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}

      <div className="absolute inset-x-0 bottom-0 translate-y-1 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 focus-within:translate-y-0 focus-within:opacity-100">
        <div
          role="slider"
          tabIndex={0}
          aria-label="Seek video"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          onClick={seek}
          className="group/bar relative h-4 cursor-pointer"
        >
          <span className="absolute top-1/2 h-[3px] w-full -translate-y-1/2 rounded-full bg-white/25" />
          <span
            className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[var(--accent)]"
            style={{ width: `${progress}%` }}
          />
          <span
            className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white opacity-0 transition-opacity group-hover/bar:opacity-100"
            style={{ left: `calc(${progress}% - 5px)` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-[0.65rem] font-medium text-white/80">
          <div className="flex items-center gap-3">
            <button type="button" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
              {playing ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                  <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
              {muted ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                  <path d="M4 9h3l4-4v14l-4-4H4zM16 9.5l4 5-1.4 1.1-4-5z" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                  <path d="M4 9h3l4-4v14l-4-4H4zM15.5 8.5a4.5 4.5 0 010 7v-1.6a3 3 0 000-3.8z" />
                </svg>
              )}
            </button>
            <span className="mono tabular-nums">
              {formatDuration(current || 0)} / {formatDuration(duration)}
            </span>
          </div>
          <button
            type="button"
            onClick={goFullscreen}
            aria-label="Toggle fullscreen"
            className="text-white/80 transition-colors hover:text-white"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" aria-hidden="true">
              <path d="M4 9V4h5M20 15v5h-5M15 4h5v5M9 20H4v-5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
