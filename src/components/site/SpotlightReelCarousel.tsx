"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { PublicProject, CarouselItem } from "@/lib/data";

type SpotlightItem = {
  id: number;
  title: string;
  category: string;
  description: string;
  videoUrl: string;
  videoSource: string;
  thumbnailUrl: string;
  aspectRatio: string;
  duration: string;
  durationSeconds?: number;
  software?: string;
  featured?: boolean;
  published?: boolean;
};

type Props = {
  carouselItems?: CarouselItem[];
  projects?: PublicProject[];
  onSelectProject: (project: PublicProject) => void;
};

export default function SpotlightReelCarousel({
  carouselItems = [],
  projects = [],
  onSelectProject,
}: Props) {
  // Combine dedicated carousel items + active video projects without duplicates
  const items: SpotlightItem[] = useMemo(() => {
    const list: SpotlightItem[] = [];
    const seenUrls = new Set<string>();

    // 1. Dedicated Carousel items first
    for (const item of carouselItems) {
      if (item.isActive !== false && item.videoUrl && item.videoUrl.trim()) {
        const normUrl = item.videoUrl.trim();
        if (!seenUrls.has(normUrl)) {
          seenUrls.add(normUrl);
          list.push({
            id: item.id,
            title: item.title,
            category: item.category || "Selected Work",
            description: item.description || "",
            videoUrl: normUrl,
            videoSource: item.videoSource || "upload",
            thumbnailUrl: item.thumbnailUrl || "",
            aspectRatio: item.aspectRatio || "16:9",
            duration: item.duration || "0:30",
            published: true,
          });
        }
      }
    }

    // 2. Published Video Projects from portfolio
    for (const p of projects) {
      if (p.published && p.videoUrl && p.videoUrl.trim()) {
        const normUrl = p.videoUrl.trim();
        if (!seenUrls.has(normUrl)) {
          seenUrls.add(normUrl);
          list.push({
            id: p.id,
            title: p.title,
            category: p.categoryLabel || "Selected Work",
            description: p.description || "",
            videoUrl: normUrl,
            videoSource: p.videoSource || "upload",
            thumbnailUrl: p.thumbnailUrl || "",
            aspectRatio: p.aspectRatio || "16:9",
            duration: p.durationSeconds ? `0:${p.durationSeconds}` : "0:45",
            durationSeconds: p.durationSeconds ?? undefined,
            software: p.software,
            featured: p.featured,
            published: true,
          });
        }
      }
    }

    return list;
  }, [carouselItems, projects]);

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

  const currentItem = items[activeIndex];
  const isCurrentVertical = currentItem?.aspectRatio === "9:16" || currentItem?.aspectRatio === "4:5";

  const handleOpenCinema = (item: SpotlightItem) => {
    // Map to PublicProject structure for modal player
    const projectLike: PublicProject = {
      id: item.id,
      title: item.title,
      description: item.description,
      categoryId: 1,
      categoryLabel: item.category,
      aiLabType: "",
      year: 2026,
      software: item.software || "Premiere Pro, DaVinci Resolve",
      tags: item.category,
      externalLink: "",
      videoUrl: item.videoUrl,
      videoSource: item.videoSource,
      thumbnailUrl: item.thumbnailUrl,
      aspectRatio: item.aspectRatio,
      displaySize: "medium",
      displayWidth: 1920,
      displayHeight: 1080,
      width: 1920,
      height: 1080,
      durationSeconds: item.durationSeconds || 45,
      featured: Boolean(item.featured),
      published: true,
      demoStatus: "verified",
      sortOrder: 0,
      carouselEnabled: true,
      carouselPinned: false,
      carouselOrder: 0,
    };
    onSelectProject(projectLike);
  };

  return (
    <div
      className="relative w-full overflow-hidden py-8"
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
        <div className="h-[400px] w-[680px] rounded-full bg-[var(--accent,#e0147f)]/15 blur-[120px]" />
      </div>

      {/* 3D Perspective Stage */}
      <div
        className={`relative mx-auto flex items-center justify-center transition-all duration-500 ${
          isCurrentVertical
            ? "h-[460px] sm:h-[520px] max-w-[1100px]"
            : "h-[360px] sm:h-[440px] max-w-[1250px]"
        }`}
        style={{ perspective: "1400px" }}
      >
        {items.map((item, index) => {
          // Calculate cyclic offset from active index
          let offset = index - activeIndex;
          if (offset > count / 2) offset -= count;
          if (offset < -count / 2) offset += count;

          const isCenter = offset === 0;
          const isVisible = Math.abs(offset) <= 2;

          if (!isVisible && count > 5) return null;

          const isVertical = item.aspectRatio === "9:16" || item.aspectRatio === "4:5";

          // Dynamic spacing based on vertical vs horizontal
          const spreadWidth = isVertical ? 240 : 320;
          const translateX = offset * spreadWidth;
          const translateZ = -Math.abs(offset) * 170;
          const rotateY = offset * -20;
          const scale = isCenter ? 1 : Math.max(0.75, 1 - Math.abs(offset) * 0.16);
          const opacity = isCenter ? 1 : Math.max(0.3, 0.75 - Math.abs(offset) * 0.25);
          const zIndex = 30 - Math.abs(offset) * 5;

          return (
            <div
              key={`${item.id}-${index}`}
              onClick={() => {
                if (isCenter) {
                  handleOpenCinema(item);
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
              className={`absolute flex flex-col cursor-pointer select-none overflow-hidden rounded-[30px] border bg-black shadow-2xl ${
                isCenter
                  ? `border-white/30 ring-2 ring-[var(--accent,#e0147f)]/60 shadow-[0_25px_60px_-15px_rgba(224,20,127,0.35)] ${
                      isVertical
                        ? "w-[260px] sm:w-[290px] h-[450px] sm:h-[500px]"
                        : "w-[340px] sm:w-[460px] md:w-[540px] h-[330px] sm:h-[400px]"
                    }`
                  : `border-white/10 hover:border-white/25 ${
                      isVertical
                        ? "w-[230px] sm:w-[260px] h-[410px] sm:h-[460px]"
                        : "w-[300px] sm:w-[380px] md:w-[440px] h-[280px] sm:h-[340px]"
                    }`
              }`}
            >
              {/* Card Video / Poster Media */}
              <div className="relative flex-1 overflow-hidden bg-neutral-950 flex items-center justify-center">
                {item.videoUrl ? (
                  <video
                    ref={(el) => {
                      if (el) videoRefs.current.set(index, el);
                      else videoRefs.current.delete(index);
                    }}
                    src={item.videoUrl}
                    poster={item.thumbnailUrl || undefined}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                ) : item.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-xs uppercase tracking-widest text-white/40">
                    🎬 Video Showcase
                  </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                {/* Live Playing Soundwave Pill for Center Card */}
                {isCenter && (
                  <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1 text-[9px] font-bold text-white shadow-xl backdrop-blur-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>SPOTLIGHT</span>
                  </div>
                )}

                {/* Top Badges */}
                <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5">
                  <span className="rounded-lg bg-[var(--accent,#e0147f)] px-2.5 py-1 text-[0.55rem] font-bold uppercase tracking-wider text-white shadow-md">
                    {item.category || "Video"}
                  </span>
                  <span className="rounded-lg bg-black/60 px-2.5 py-1 font-mono text-[0.55rem] font-bold text-white/90 backdrop-blur-md">
                    {item.aspectRatio || (isVertical ? "9:16" : "16:9")}
                  </span>
                  {item.duration ? (
                    <span className="rounded-lg bg-black/60 px-2.5 py-1 font-mono text-[0.55rem] font-bold text-white/90 backdrop-blur-md">
                      ⏱️ {item.duration}
                    </span>
                  ) : null}
                </div>

                {/* Center Big Play Button (Click to Open) */}
                {isCenter && (
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-ink shadow-2xl transition duration-300 hover:scale-110 hover:bg-[var(--accent,#e0147f)] hover:text-white">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Card Info & CTA */}
              <div className="p-3.5 sm:p-4 bg-gradient-to-b from-neutral-900 to-black border-t border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-heading text-xs sm:text-sm font-bold text-white line-clamp-1">
                    {item.title}
                  </h4>
                  {item.software && (
                    <span className="hidden sm:inline-block text-[9px] font-mono text-white/50 bg-white/10 px-2 py-0.5 rounded-md">
                      {item.software.split(",")[0]}
                    </span>
                  )}
                </div>

                {isCenter && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCinema(item);
                    }}
                    className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-white/15 py-1.5 sm:py-2 text-center text-xs font-bold text-white transition hover:bg-[var(--accent,#e0147f)]"
                  >
                    <span>▶ Watch Full Film</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows & Pagination Bar */}
      <div className="mt-6 flex items-center justify-center gap-6">
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
