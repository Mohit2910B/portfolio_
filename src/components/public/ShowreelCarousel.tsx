"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface CarouselItemData {
  id: number;
  title: string;
  category: string;
  badge: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;
  aspectRatio: string;
  description: string;
}

interface ShowreelCarouselProps {
  items?: CarouselItemData[];
  onOpenVideo?: (videoUrl: string, title: string) => void;
}

export default function ShowreelCarousel({ items = [], onOpenVideo }: ShowreelCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const total = items.length;

  const nextSlide = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Touch Swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (diff > 50) nextSlide();
    if (diff < -50) prevSlide();
    setTouchStart(null);
  };

  if (total === 0) {
    return (
      <section id="showreel" className="py-24 border-b border-[var(--border-glass)]">
        <div className="max-w-7xl mx-auto px-6 text-center font-mono text-xs text-[var(--text-secondary)] glass-panel p-12">
          SHOWREEL CAROUSEL — NO ITEMS PUBLISHED IN DATABASE YET.
        </div>
      </section>
    );
  }

  return (
    <section
      id="showreel"
      className="py-24 border-b border-[var(--border-glass)] relative overflow-hidden bg-[var(--bg-surface)]/40"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="font-mono text-xs tracking-[0.2em] text-[var(--accent)] uppercase font-bold">
            02 // CINEMATIC SHOWREEL
          </span>
          <h2 className="font-serif font-bold text-4xl sm:text-6xl tracking-tight text-[var(--text-primary)]">
            Featured Motion Reels.
          </h2>
        </div>

        {/* Carousel Navigation Buttons */}
        <div className="flex items-center space-x-4">
          <button
            onClick={prevSlide}
            data-cursor-button
            className="w-12 h-12 glass-panel flex items-center justify-center text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all font-mono"
            aria-label="Previous Slide"
          >
            ←
          </button>
          <span className="font-mono text-xs tracking-widest text-[var(--text-secondary)]">
            0{activeIndex + 1} / 0{total}
          </span>
          <button
            onClick={nextSlide}
            data-cursor-button
            className="w-12 h-12 glass-panel flex items-center justify-center text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all font-mono"
            aria-label="Next Slide"
          >
            →
          </button>
        </div>
      </div>

      {/* Cinematic 3-Card Depth Carousel */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative flex items-center justify-center min-h-[460px] sm:min-h-[560px]">
          {items.map((item, idx) => {
            // Calculate relative offset (-1, 0, 1, etc.)
            let offset = idx - activeIndex;
            if (offset < -1 && activeIndex === total - 1) offset += total;
            if (offset > 1 && activeIndex === 0) offset -= total;

            const isActive = idx === activeIndex;
            const isPrev = offset === -1 || (activeIndex === 0 && idx === total - 1);
            const isNext = offset === 1 || (activeIndex === total - 1 && idx === 0);

            // Hide cards beyond immediate left/right
            if (!isActive && !isPrev && !isNext) return null;

            return (
              <div
                key={item.id}
                onClick={() => setActiveIndex(idx)}
                className={`absolute transition-all duration-700 ease-out cursor-pointer ${
                  isActive
                    ? "z-30 w-full max-w-4xl scale-100 opacity-100"
                    : isPrev
                    ? "z-10 w-[80%] max-w-2xl -translate-x-[45%] scale-90 opacity-40 blur-[1px]"
                    : "z-10 w-[80%] max-w-2xl translate-x-[45%] scale-90 opacity-40 blur-[1px]"
                }`}
              >
                <div
                  data-cursor-media
                  className={`glass-panel-strong p-4 space-y-4 shadow-2xl transition-all ${
                    isActive ? "border-[var(--accent)]/50" : "border-[var(--border-glass)]"
                  }`}
                >
                  {/* Media Aspect Container */}
                  <div className="relative aspect-video w-full rounded-[16px] overflow-hidden bg-black group">
                    <video
                      key={item.id}
                      src={item.videoUrl}
                      poster={item.thumbnailUrl}
                      autoPlay={isActive && isPlaying}
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-main)] via-transparent to-transparent opacity-80" />

                    {/* Badge */}
                    {item.badge && (
                      <span className="absolute top-4 left-4 font-mono text-[9px] tracking-widest px-3 py-1 glass-panel text-[var(--accent)] uppercase font-bold border border-[var(--accent)]/30">
                        {item.badge}
                      </span>
                    )}

                    {/* Play Button Overlay */}
                    {isActive && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button
                          onClick={() =>
                            onOpenVideo
                              ? onOpenVideo(item.videoUrl, item.title)
                              : setIsPlaying(!isPlaying)
                          }
                          className="px-6 py-3 bg-[var(--accent)] text-[var(--bg-main)] font-mono text-xs font-bold tracking-widest uppercase rounded-full shadow-2xl"
                        >
                          {onOpenVideo ? "WATCH FULLSCREEN ↗" : isPlaying ? "PAUSE" : "PLAY"}
                        </button>
                      </div>
                    )}

                    {/* Bottom Metadata */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                      <div className="space-y-1">
                        <span className="font-mono text-[10px] text-[var(--accent)] tracking-widest uppercase">
                          0{idx + 1} // {item.category} • {item.duration || "01:30"}
                        </span>
                        <h3 className="font-serif font-bold text-xl sm:text-3xl text-[var(--text-primary)]">
                          {item.title}
                        </h3>
                      </div>

                      {isActive && onOpenVideo && (
                        <button
                          onClick={() => onOpenVideo(item.videoUrl, item.title)}
                          className="hidden sm:block px-4 py-2 glass-panel text-xs font-mono text-[var(--text-primary)] hover:border-[var(--accent)]"
                        >
                          CINEMA MODE ↗
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Pagination Dots */}
        <div className="flex items-center justify-center space-x-3 mt-8">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === activeIndex
                  ? "w-8 bg-[var(--accent)]"
                  : "w-2 bg-[var(--border-glass-strong)] hover:bg-[var(--text-secondary)]"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
