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

  if (activeItems.length === 0) return null;

  return (
    <section id="work" className="relative overflow-hidden py-20 md:py-28">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-[120px]"
        style={{
          background: "radial-gradient(circle, var(--accent, #e0147f) 0%, rgba(224,20,127,0) 70%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 text-center md:mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-black/[0.04] px-4 py-1.5 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[var(--accent,#e0147f)] shadow-sm animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-ink">
              {global.sectionBadge || "FEATURED SHOWCASE"}
            </span>
          </div>

          <h2 className="font-heading text-3xl font-black uppercase tracking-tight text-ink sm:text-4xl md:text-5xl lg:text-6xl leading-none">
            {global.sectionTitle || "SELECTED WORKS"}
          </h2>

          {global.sectionSubtitle && (
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-ink/75 sm:text-base font-medium">
              {global.sectionSubtitle}
            </p>
          )}
        </div>

        {/* Dynamic Studio Showcase */}
        <StudioVideoCarousel
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

function StudioVideoCarousel({
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
  const [isHovered, setIsHovered] = useState(false);
  const [selectedReel, setSelectedReel] = useState<CarouselItem | null>(null);

  const prev = useCallback(() => {
    setActiveIndex((prevIdx) => {
      if (prevIdx === 0) return infiniteLoop ? count - 1 : 0;
      return prevIdx - 1;
    });
  }, [count, infiniteLoop]);

  const next = useCallback(() => {
    setActiveIndex((prevIdx) => {
      if (prevIdx >= count - 1) return infiniteLoop ? 0 : count - 1;
      return prevIdx + 1;
    });
  }, [count, infiniteLoop]);

  // Autoplay timer
  useEffect(() => {
    if (!autoplay || isHovered || selectedReel || count <= 1) return;
    const intervalMs = Math.max(autoplaySpeed, 3) * 1000;
    const timer = setInterval(() => {
      next();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [autoplay, autoplaySpeed, isHovered, selectedReel, count, next]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedReel(null);
      if (!selectedReel) {
        if (e.key === "ArrowLeft") prev();
        if (e.key === "ArrowRight") next();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prev, next, selectedReel]);

  // If only 1 item: Render clean Single Spotlight Card
  if (count === 1) {
    const singleItem = items[0];
    return (
      <div className="mx-auto max-w-md">
        <ReelShowcaseCard
          item={singleItem}
          isFocused={true}
          onClick={() => setSelectedReel(singleItem)}
        />
        {selectedReel && (
          <ReelPopupModal
            reel={selectedReel}
            onClose={() => setSelectedReel(null)}
            onNext={() => {}}
            onPrev={() => {}}
          />
        )}
      </div>
    );
  }

  // Calculate visible cards cleanly without confusing duplicate cloning
  const getCardPosition = (index: number) => {
    const diff = (index - activeIndex + count) % count;
    if (diff === 0) return 0; // Center
    if (diff === 1 || diff === -(count - 1)) return 1; // Right
    if (diff === count - 1 || diff === -1) return -1; // Left
    return diff > count / 2 ? -2 : 2; // Outer
  };

  return (
    <div
      className="relative select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main 3D Panoramic Stage */}
      <div className="relative mx-auto flex h-[500px] sm:h-[560px] md:h-[620px] w-full items-center justify-center overflow-hidden">
        {items.map((item, index) => {
          const position = getCardPosition(index);
          const isCenter = position === 0;
          const isImmediate = Math.abs(position) === 1;
          const isVisible = Math.abs(position) <= 2;

          if (!isVisible && count > 5) return null;

          // Smooth 3D transforms
          let translateX = position * 220; // px offset
          let scale = 1;
          let opacity = 1;
          let zIndex = 30;

          if (position === 0) {
            translateX = 0;
            scale = 1.05;
            opacity = 1;
            zIndex = 40;
          } else if (position === 1) {
            translateX = 220;
            scale = 0.88;
            opacity = 0.85;
            zIndex = 25;
          } else if (position === -1) {
            translateX = -220;
            scale = 0.88;
            opacity = 0.85;
            zIndex = 25;
          } else if (position > 1) {
            translateX = 400;
            scale = 0.72;
            opacity = 0.4;
            zIndex = 10;
          } else {
            translateX = -400;
            scale = 0.72;
            opacity = 0.4;
            zIndex = 10;
          }

          return (
            <div
              key={item.id}
              onClick={() => {
                if (isCenter) setSelectedReel(item);
                else setActiveIndex(index);
              }}
              style={{
                transform: `translateX(${translateX}px) scale(${scale})`,
                opacity,
                zIndex,
                transition: "transform 500ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 400ms ease",
              }}
              className={`absolute top-1/2 -translate-y-1/2 cursor-pointer ${
                isCenter ? "shadow-[0_20px_60px_rgba(0,0,0,0.25)]" : "shadow-lg hover:opacity-100"
              }`}
            >
              <ReelShowcaseCard
                item={item}
                isFocused={isCenter}
                onClick={() => setSelectedReel(item)}
              />
            </div>
          );
        })}
      </div>

      {/* Navigation Controls & Pagination Dots */}
      <div className="mt-8 flex items-center justify-between px-4">
        {/* Left Arrow */}
        {showArrows && count > 1 && (
          <button
            type="button"
            onClick={prev}
            aria-label="Previous video"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-black/15 bg-white/80 text-ink backdrop-blur-md shadow-sm transition hover:bg-black hover:text-white"
          >
            ←
          </button>
        )}

        {/* Pagination Dots */}
        {showDots && count > 1 && (
          <div className="mx-auto flex items-center gap-2">
            {items.map((it, idx) => (
              <button
                key={it.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  idx === activeIndex
                    ? "w-8 bg-[var(--accent,#e0147f)]"
                    : "w-2.5 bg-black/20 hover:bg-black/40"
                }`}
              />
            ))}
          </div>
        )}

        {/* Right Arrow */}
        {showArrows && count > 1 && (
          <button
            type="button"
            onClick={next}
            aria-label="Next video"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-black/15 bg-white/80 text-ink backdrop-blur-md shadow-sm transition hover:bg-black hover:text-white"
          >
            →
          </button>
        )}
      </div>

      {/* Interactive Full-Screen Reel Modal */}
      {selectedReel && (
        <ReelPopupModal
          reel={selectedReel}
          onClose={() => setSelectedReel(null)}
          onNext={() => {
            const curIdx = items.findIndex((it) => it.id === selectedReel.id);
            const nextIdx = (curIdx + 1) % items.length;
            setSelectedReel(items[nextIdx]);
            setActiveIndex(nextIdx);
          }}
          onPrev={() => {
            const curIdx = items.findIndex((it) => it.id === selectedReel.id);
            const prevIdx = (curIdx - 1 + items.length) % items.length;
            setSelectedReel(items[prevIdx]);
            setActiveIndex(prevIdx);
          }}
        />
      )}
    </div>
  );
}

/** Individual Showcase Card (Vertical 9:16 Reel format) */
function ReelShowcaseCard({
  item,
  isFocused,
  onClick,
}: {
  item: CarouselItem;
  isFocused: boolean;
  onClick: () => void;
}) {
  const media = parseMediaUrl(item.videoUrl);

  return (
    <div className="group relative h-[420px] sm:h-[480px] md:h-[530px] w-[240px] sm:w-[270px] md:w-[300px] overflow-hidden rounded-[28px] border border-black/10 bg-neutral-900 shadow-2xl transition-all duration-300">
      {/* Background Poster / Video Preview */}
      {item.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.thumbnailUrl}
          alt={item.title}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
      ) : item.videoUrl ? (
        <video
          src={media.streamUrl || item.videoUrl}
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-black/40 text-xs uppercase tracking-widest text-white/50">
          🎬 Video Reel
        </div>
      )}

      {/* Top Floating Badges */}
      <div className="absolute left-3.5 top-3.5 right-3.5 flex items-center justify-between gap-2">
        <span className="rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
          {item.category || "Reel"}
        </span>

        {item.duration && (
          <span className="rounded-full bg-black/60 px-2.5 py-1 font-mono text-[10px] font-semibold text-white/90 backdrop-blur-md">
            ⏱️ {item.duration}
          </span>
        )}
      </div>

      {/* Center Play Icon Button */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 backdrop-blur-[2px] transition duration-300 group-hover:opacity-100">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-ink shadow-2xl transition duration-300 group-hover:scale-110">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      {/* Bottom Gradient Metadata Bar */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 text-white">
        <h3 className="font-heading text-sm font-bold uppercase tracking-wide line-clamp-1">
          {item.title}
        </h3>
        {item.description && (
          <p className="mt-1 text-[11px] leading-relaxed text-white/70 line-clamp-2">
            {item.description}
          </p>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--accent,#e0147f)] px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md transition hover:scale-105"
        >
          <span>▶ Watch Reel</span>
        </button>
      </div>
    </div>
  );
}

/** Full-Screen Interactive Pop-up Reel Modal Player */
function ReelPopupModal({
  reel,
  onClose,
  onNext,
  onPrev,
}: {
  reel: CarouselItem;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const media = parseMediaUrl(reel.videoUrl);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-6 backdrop-blur-2xl"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center max-h-[95vh] w-full max-w-md sm:max-w-lg rounded-3xl border border-white/20 bg-neutral-950 p-4 sm:p-6 shadow-[0_0_80px_rgba(0,0,0,0.9)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Category, Title, & Close */}
        <div className="flex w-full items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 min-w-0 pr-3">
            <span className="shrink-0 rounded-full bg-[var(--accent,#e0147f)] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
              {reel.category || "Reel"}
            </span>
            <h3 className="font-heading text-sm font-bold uppercase tracking-tight text-white truncate">
              {reel.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-bold text-white transition hover:bg-white hover:text-black"
            aria-label="Close Reel Modal"
          >
            ✕
          </button>
        </div>

        {/* 9:16 Vertical Reel Player */}
        <div className="relative mt-4 aspect-[9/16] w-full max-h-[66vh] overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl">
          {media.embedUrl ? (
            <iframe
              src={`${media.embedUrl}?autoplay=1`}
              title={reel.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-0"
            />
          ) : (
            <video
              src={media.streamUrl || reel.videoUrl}
              poster={reel.thumbnailUrl || undefined}
              controls
              autoPlay
              playsInline
              preload="auto"
              className="h-full w-full object-contain bg-black"
            />
          )}
        </div>

        {/* Footer info & Prev/Next buttons */}
        <div className="mt-3 flex w-full items-center justify-between pt-2">
          <p className="text-xs text-white/60 line-clamp-1 max-w-[60%]">
            {reel.description || "Video Showcase Reel"}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrev}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={onNext}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
