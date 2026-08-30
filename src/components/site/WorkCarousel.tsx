"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseMediaUrl } from "@/lib/media-urls";
import type { CarouselItem, CarouselGlobalSettings, SiteData } from "@/lib/data";

export default function WorkCarousel({ data }: { data: SiteData }) {
  const global: CarouselGlobalSettings = data.carouselGlobalSettings || {
    id: 1,
    enabled: true,
    sectionTitle: "Engage Audiences with Stunning Videos",
    sectionSubtitle:
      "Boost your brand with high-impact short videos & cinematic visual storytelling.",
    autoplay: true,
    autoplaySpeed: 5,
    infiniteLoop: true,
    showArrows: true,
    showDots: true,
    updatedAt: new Date(),
  };

  // If disabled in global settings, do not render
  if (!global.enabled) return null;

  // Active carousel items (fallback to default curated showcase items)
  const rawItems = data.carouselItems || [];
  const activeItems = useMemo(() => {
    const list = rawItems.filter((item) => item.isActive !== false);
    return list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [rawItems]);

  return (
    <section id="work" className="relative overflow-hidden py-24 md:py-32">
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[600px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15 blur-[140px]"
        style={{
          background:
            "radial-gradient(circle, var(--accent, #e0147f) 0%, rgba(224,20,127,0) 70%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center md:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/20 bg-black/[0.05] px-4 py-1.5 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-black shadow-sm" />
            <span
              style={{ color: "#000000" }}
              className="text-[11px] font-bold uppercase tracking-[0.25em] !text-black"
            >
              {global.sectionBadge || "VIDEO SHOWCASE"}
            </span>
          </div>

          <h2
            style={{ color: "#000000" }}
            className="mt-3 font-heading text-3xl font-black uppercase tracking-tight !text-black sm:text-4xl md:text-5xl lg:text-6xl leading-none"
          >
            {global.sectionTitle || "SELECTED WORKS"}
          </h2>

          {global.sectionSubtitle && (
            <p
              style={{ color: "#000000" }}
              className="mx-auto max-w-2xl text-sm leading-relaxed !text-black opacity-90 sm:text-base font-medium"
            >
              {global.sectionSubtitle}
            </p>
          )}
        </div>

        {/* Reference-Style Panoramic Multi-Card Carousel */}
        <PanoramicVideoCarousel
          items={activeItems}
          autoplay={global.autoplay}
          autoplaySpeed={global.autoplaySpeed}
          infiniteLoop={global.infiniteLoop}
          showArrows={global.showArrows}
          showDots={global.showDots}
        />
      </div>
    </section>
  );
}

function PanoramicVideoCarousel({
  items,
  autoplay,
  autoplaySpeed,
  infiniteLoop,
  showArrows,
  showDots,
}: {
  items: CarouselItem[];
  autoplay: boolean;
  autoplaySpeed: number;
  infiniteLoop: boolean;
  showArrows: boolean;
  showDots: boolean;
}) {
  const count = items.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Empty state
  if (count === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center backdrop-blur-md">
        <p className="text-sm text-white/40">No showcase video cards active.</p>
      </div>
    );
  }

  const prev = useCallback(() => {
    setIsPlaying(false);
    setActiveIndex((prevIdx) => {
      if (prevIdx === 0) return infiniteLoop ? count - 1 : 0;
      return prevIdx - 1;
    });
  }, [count, infiniteLoop]);

  const next = useCallback(() => {
    setIsPlaying(false);
    setActiveIndex((prevIdx) => {
      if (prevIdx >= count - 1) return infiniteLoop ? 0 : count - 1;
      return prevIdx + 1;
    });
  }, [count, infiniteLoop]);

  const selectCard = (index: number) => {
    if (index === activeIndex) {
      // Toggle play state on center card
      setIsPlaying((p) => !p);
    } else {
      setIsPlaying(false);
      setActiveIndex(index);
    }
  };

  // Autoplay loop (pause when video is actively playing or user hovers)
  useEffect(() => {
    if (!autoplay || isHovered || isPlaying || count <= 1) return;
    const intervalMs = Math.max(autoplaySpeed, 2) * 1000;
    const timer = setInterval(() => {
      next();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [autoplay, autoplaySpeed, isHovered, isPlaying, count, next]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === " " && document.activeElement === document.body) {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prev, next]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const dist = touchStartX.current - touchEndX.current;
    if (dist > 45) next();
    if (dist < -45) prev();
    touchStartX.current = null;
    touchEndX.current = null;
  };

  /**
   * Calculate relative offset from active index for panoramic card layout:
   * 0: Center Focus Card
   * -1 / +1: Immediate Left & Right Cards (scale 0.92, opacity 0.85)
   * -2 / +2: Outer Flanking Cards (scale 0.82, opacity 0.6)
   * -3 / +3: Far Edge Cards (scale 0.72, opacity 0.35)
   */
  const visibleCards = useMemo(() => {
    const offsets = [-3, -2, -1, 0, 1, 2, 3];
    return offsets.map((offset) => {
      const idx = (activeIndex + offset + count * 100) % count;
      return {
        item: items[idx],
        index: idx,
        offset,
      };
    });
  }, [activeIndex, count, items]);

  return (
    <div
      className="relative select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ---------------- PANORAMIC MULTI-CARD STRIP ---------------- */}
      <div className="relative mx-auto flex h-[480px] sm:h-[540px] md:h-[600px] lg:h-[640px] w-full items-center justify-center overflow-hidden">
        {visibleCards.map(({ item, index, offset }) => {
          const isCenter = offset === 0;
          const absOffset = Math.abs(offset);

          // Positioning translations for panoramic arch effect
          // On mobile, show fewer outer cards to prevent horizontal overflow
          let translateX = offset * 180; // Desktop card spacing
          if (typeof window !== "undefined" && window.innerWidth < 640) {
            translateX = offset * 130;
          } else if (typeof window !== "undefined" && window.innerWidth < 1024) {
            translateX = offset * 155;
          }

          // Scale and opacity tapering
          const scale = isCenter ? 1.05 : Math.max(0.72, 1 - absOffset * 0.1);
          const opacity = isCenter ? 1 : Math.max(0.2, 1 - absOffset * 0.25);
          const zIndex = 30 - absOffset * 5;

          // Don't render cards too far out on small viewports
          const hideOnSmall = absOffset > 1 ? "hidden sm:block" : "";
          const hideOnMed = absOffset > 2 ? "hidden lg:block" : "";

          return (
            <div
              key={`${item.id}-${offset}`}
              onClick={() => selectCard(index)}
              style={{
                transform: `translateX(${translateX}px) scale(${scale})`,
                zIndex,
                opacity,
              }}
              className={`absolute top-1/2 -translate-y-1/2 cursor-pointer transition-all duration-500 ease-out ${hideOnSmall} ${hideOnMed}`}
            >
              <div
                className={`group relative aspect-[9/16] w-[180px] sm:w-[210px] md:w-[240px] lg:w-[270px] overflow-hidden rounded-3xl border transition-all duration-300 ${
                  isCenter
                    ? "border-white/30 bg-black/80 shadow-[0_0_40px_rgba(224,20,127,0.25)] ring-1 ring-white/20"
                    : "border-white/10 bg-black/50 hover:border-white/20 hover:opacity-90"
                }`}
              >
                {/* Media Presentation: Video or Poster Image */}
                <VideoCardMedia
                  item={item}
                  isCenter={isCenter}
                  isPlaying={isCenter && isPlaying}
                  onEnded={() => setIsPlaying(false)}
                />

                {/* Ambient Top Badges */}
                <div className="absolute left-3 top-3 right-3 flex items-center justify-between pointer-events-none">
                  <span className="rounded-full border border-white/15 bg-black/60 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-md">
                    {item.category || "Video Edit"}
                  </span>
                  {item.duration && (
                    <span className="rounded-full border border-white/10 bg-black/50 px-2 py-0.5 font-mono text-[9px] font-semibold text-white/80 backdrop-blur-md">
                      {item.duration}
                    </span>
                  )}
                </div>

                {/* Center Play Button Overlay (when not playing) */}
                {(!isCenter || !isPlaying) && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div
                      className={`flex items-center justify-center rounded-full text-white backdrop-blur-md transition-all duration-300 ${
                        isCenter
                          ? "h-16 w-16 bg-white/30 text-2xl shadow-[0_0_25px_rgba(255,255,255,0.4)] group-hover:scale-110 group-hover:bg-white/40"
                          : "h-11 w-11 bg-white/20 text-lg opacity-70 group-hover:opacity-100"
                      }`}
                    >
                      ▶
                    </div>
                  </div>
                )}

                {/* Bottom Details Overlay */}
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4">
                  <h4 className="font-heading text-sm font-bold uppercase tracking-tight text-white line-clamp-1">
                    {item.title}
                  </h4>
                  {item.description && isCenter && (
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/70">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ---------------- NAVIGATION CONTROLS ---------------- */}
      <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row sm:px-6">
        {/* Index Indicator */}
        <div className="order-2 text-xs font-medium text-white/40 sm:order-1">
          <span className="font-mono text-sm font-bold text-white">
            {String(activeIndex + 1).padStart(2, "0")}
          </span>
          <span className="mx-1.5 text-white/20">/</span>
          <span className="font-mono">{String(count).padStart(2, "0")}</span>
        </div>

        {/* Dots Pagination */}
        {showDots && count > 1 && (
          <div className="order-1 flex items-center gap-2 sm:order-2">
            {items.map((it, idx) => (
              <button
                key={it.id}
                type="button"
                onClick={() => selectCard(idx)}
                aria-label={`Go to video card ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === activeIndex
                    ? "w-8 bg-[var(--accent,#e0147f)] shadow-[0_0_10px_var(--accent,#e0147f)]"
                    : "w-2 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        )}

        {/* Navigation Arrows */}
        {showArrows && count > 1 && (
          <div className="order-3 flex items-center gap-3">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous video card"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/80 backdrop-blur-md transition hover:border-white/30 hover:bg-white/15 hover:text-white"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={next}
              aria-label="Next video card"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/80 backdrop-blur-md transition hover:border-white/30 hover:bg-white/15 hover:text-white"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Individual Video Card Media component (handling MP4 video streams, embed URLs, or poster fallbacks) */
function VideoCardMedia({
  item,
  isCenter,
  isPlaying,
  onEnded,
}: {
  item: CarouselItem;
  isCenter: boolean;
  isPlaying: boolean;
  onEnded: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoError, setVideoError] = useState(false);

  const media = parseMediaUrl(item.videoUrl);
  const isDirectVideo =
    item.videoUrl &&
    (item.videoUrl.endsWith(".mp4") ||
      item.videoUrl.includes("blob") ||
      item.videoUrl.includes("pexels") ||
      item.videoSource === "upload" ||
      media.streamUrl);

  // Control video playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isDirectVideo) return;

    if (isPlaying) {
      video.muted = false; // Play with sound when user intentionally clicks play
      const p = video.play();
      if (p !== undefined) {
        p.catch(() => {
          // If unmuted playback is restricted, play muted with controls
          video.muted = true;
          void video.play();
        });
      }
    } else {
      video.pause();
    }
  }, [isPlaying, isDirectVideo]);

  // Video Active Playing State
  if (isPlaying) {
    if (isDirectVideo) {
      return (
        <video
          ref={videoRef}
          src={media.streamUrl || item.videoUrl}
          poster={item.thumbnailUrl || undefined}
          controls
          autoPlay
          playsInline
          onEnded={onEnded}
          className="h-full w-full object-cover"
        />
      );
    }

    if (media.embedUrl) {
      return (
        <iframe
          src={`${media.embedUrl}?autoplay=1`}
          title={item.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full border-0"
        />
      );
    }
  }

  // Poster Image / Thumbnail Preview
  if (item.thumbnailUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.thumbnailUrl}
        alt={item.title}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    );
  }

  // If no thumbnail, attempt video poster or fallback
  if (isDirectVideo && !videoError) {
    return (
      <video
        src={media.streamUrl || item.videoUrl}
        muted
        playsInline
        preload="metadata"
        onError={() => setVideoError(true)}
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-neutral-900 to-black text-white/30">
      <span className="text-3xl">🎬</span>
      <span className="mt-1 text-[10px] uppercase tracking-wider">{item.title}</span>
    </div>
  );
}
