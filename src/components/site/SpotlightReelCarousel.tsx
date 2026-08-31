"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { PublicProject } from "@/lib/data";

type Props = {
  projects: PublicProject[];
  onSelectProject: (project: PublicProject) => void;
};

export default function SpotlightReelCarousel({ projects, onSelectProject }: Props) {
  // Use published projects with video or thumbnail
  const items = useMemo(() => {
    return projects.filter((p) => p.published && (p.videoUrl || p.thumbnailUrl));
  }, [projects]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const dragStartX = useRef<number | null>(null);

  const count = items.length;

  const next = useCallback(() => {
    if (count <= 1) return;
    setActiveIndex((prev) => (prev + 1) % count);
  }, [count]);

  const prev = useCallback(() => {
    if (count <= 1) return;
    setActiveIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  // Autoplay rotation every 5 seconds when not hovered
  useEffect(() => {
    if (isHovered || count <= 1) return;
    const timer = window.setInterval(next, 5000);
    return () => window.clearInterval(timer);
  }, [isHovered, count, next]);

  // Play active center video muted, pause others
  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (!video) return;
      if (idx === activeIndex) {
        void video.play().catch(() => {});
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [activeIndex]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  if (count === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden py-10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={(e) => {
        dragStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (dragStartX.current === null) return;
        const diff = e.changedTouches[0].clientX - dragStartX.current;
        if (diff > 40) prev();
        else if (diff < -40) next();
        dragStartX.current = null;
      }}
      onMouseDown={(e) => {
        dragStartX.current = e.clientX;
      }}
      onMouseUp={(e) => {
        if (dragStartX.current === null) return;
        const diff = e.clientX - dragStartX.current;
        if (diff > 50) prev();
        else if (diff < -50) next();
        dragStartX.current = null;
      }}
    >
      {/* Ambient Spotlight Beam Background */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[420px] w-[650px] rounded-full bg-[var(--accent,#e0147f)]/15 blur-[120px]" />
      </div>

      {/* 3D Perspective Stage */}
      <div
        className="relative mx-auto flex h-[480px] sm:h-[540px] max-w-[1200px] items-center justify-center"
        style={{ perspective: "1400px" }}
      >
        {items.map((project, index) => {
          // Calculate cyclic offset from active index
          let offset = index - activeIndex;
          if (offset > count / 2) offset -= count;
          if (offset < -count / 2) offset += count;

          const isCenter = offset === 0;
          const isLeft = offset === -1 || (offset < 0 && Math.abs(offset) <= 2);
          const isRight = offset === 1 || (offset > 0 && Math.abs(offset) <= 2);
          const isVisible = Math.abs(offset) <= 2;

          if (!isVisible && count > 5) return null;

          // 3D positioning transform
          const translateX = offset * 230; // Horizontal spread
          const translateZ = -Math.abs(offset) * 160; // Push back side cards
          const rotateY = offset * -22; // Inward 3D tilt
          const scale = isCenter ? 1 : Math.max(0.78, 1 - Math.abs(offset) * 0.14);
          const opacity = isCenter ? 1 : Math.max(0.35, 0.8 - Math.abs(offset) * 0.25);
          const zIndex = 30 - Math.abs(offset) * 5;

          return (
            <div
              key={project.id}
              onClick={() => {
                if (isCenter) {
                  onSelectProject(project);
                } else {
                  setActiveIndex(index);
                }
              }}
              style={{
                transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                opacity,
                zIndex,
                transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease",
              }}
              className={`absolute top-0 flex flex-col cursor-pointer select-none overflow-hidden rounded-[32px] border bg-black shadow-2xl ${
                isCenter
                  ? "border-white/30 ring-2 ring-[var(--accent,#e0147f)]/50 shadow-[0_20px_60px_-15px_rgba(224,20,127,0.3)] w-[260px] sm:w-[290px] h-[460px] sm:h-[510px]"
                  : "border-white/10 hover:border-white/25 w-[240px] sm:w-[270px] h-[440px] sm:h-[480px]"
              }`}
            >
              {/* Card Video / Poster Media */}
              <div className="relative flex-1 overflow-hidden bg-neutral-900">
                {project.videoUrl ? (
                  <video
                    ref={(el) => {
                      if (el) videoRefs.current.set(index, el);
                      else videoRefs.current.delete(index);
                    }}
                    src={project.videoUrl}
                    poster={project.thumbnailUrl || undefined}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                ) : project.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.thumbnailUrl}
                    alt={project.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-xs uppercase tracking-widest text-white/40">
                    🎬 Video Reel
                  </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                {/* Live Playing Soundwave Pill for Center Card */}
                {isCenter && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1 text-[9px] font-bold text-white shadow-lg backdrop-blur-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>SPOTLIGHT</span>
                  </div>
                )}

                {/* Top Category Badge */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
                  <span className="rounded-lg bg-[var(--accent,#e0147f)] px-2.5 py-1 text-[0.55rem] font-bold uppercase tracking-wider text-white shadow-md">
                    {project.categoryLabel || "Reel"}
                  </span>
                  {project.durationSeconds ? (
                    <span className="rounded-lg bg-black/60 px-2.5 py-1 font-mono text-[0.55rem] font-bold text-white/90 backdrop-blur-md">
                      ⏱️ {project.durationSeconds}s
                    </span>
                  ) : null}
                </div>

                {/* Center Big Play Button (Click to Open) */}
                {isCenter && (
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="group/btn grid h-14 w-14 place-items-center rounded-full bg-white text-ink shadow-2xl transition duration-300 hover:scale-110 hover:bg-[var(--accent,#e0147f)] hover:text-white">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Card Info & CTA */}
              <div className="p-4 sm:p-5 bg-gradient-to-b from-neutral-900 to-black border-t border-white/10">
                <h4 className="font-heading text-sm font-bold text-white line-clamp-1">
                  {project.title}
                </h4>
                {project.description && (
                  <p className="mt-1 line-clamp-1 text-[11px] text-white/60">
                    {project.description}
                  </p>
                )}

                {isCenter && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProject(project);
                    }}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white/15 py-2 text-center text-xs font-bold text-white transition hover:bg-[var(--accent,#e0147f)]"
                  >
                    <span>▶ Watch Full Reel</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows & Pagination Bar */}
      <div className="mt-4 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous reel"
          className="grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white shadow-md transition duration-300 hover:scale-110 hover:bg-black hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        {/* Pagination Dots */}
        <div className="flex items-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? "w-7 bg-[var(--accent,#e0147f)]"
                  : "w-2 bg-black/20 hover:bg-black/40"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={next}
          aria-label="Next reel"
          className="grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white shadow-md transition duration-300 hover:scale-110 hover:bg-black hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
