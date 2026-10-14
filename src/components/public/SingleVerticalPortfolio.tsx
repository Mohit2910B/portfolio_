"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface UnifiedPortfolioItem {
  id: number;
  categoryId?: number;
  title: string;
  category?: string;
  categoryLabel?: string;
  year?: number;
  software?: string;
  tags?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  description?: string;
  externalUrl?: string;
  aspectRatio?: string;
}

interface SingleVerticalPortfolioProps {
  projects?: UnifiedPortfolioItem[];
  carouselItems?: UnifiedPortfolioItem[];
  categories?: Array<{ id: number; name: string; slug: string }>;
  introText?: string;
  onOpenVideo?: (url: string, title: string) => void;
}

function getCleanThumbnail(thumbnailUrl?: string, videoUrl?: string): string {
  const target = thumbnailUrl || videoUrl;
  if (!target) return "";
  const matchId = target.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
  if (matchId) {
    return `/api/media/drive-thumb?id=${matchId[1]}`;
  }
  const matchFile = target.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/);
  if (matchFile) {
    return `/api/media/drive-thumb?id=${matchFile[1]}`;
  }
  return thumbnailUrl || "";
}

export default function SingleVerticalPortfolio({
  projects = [],
  carouselItems = [],
  categories = [],
  introText,
  onOpenVideo,
}: SingleVerticalPortfolioProps) {
  const combined = projects.length > 0 ? projects : carouselItems;
  const list = combined;

  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (categories.length > 0) {
      return categories[0].slug || categories[0].name;
    }
    return "bansari-resort";
  });
  const [activeIndex, setActiveIndex] = useState(0);

  const touchStartX = useRef<number | null>(null);

  // Sync selectedCategory when categories arrive
  useEffect(() => {
    if (categories.length > 0) {
      const match = categories.find(
        (c) =>
          c.slug.toLowerCase() === selectedCategory.toLowerCase() ||
          c.name.toLowerCase() === selectedCategory.toLowerCase()
      );
      if (!match) {
        setSelectedCategory(categories[0].slug || categories[0].name);
      }
    }
  }, [categories, selectedCategory]);

  // Match items with selected category slug or name
  const selectedCatObj = categories.find(
    (c) =>
      c.slug.toLowerCase() === selectedCategory.toLowerCase() ||
      c.name.toLowerCase() === selectedCategory.toLowerCase()
  );

  const filteredItems = list.filter((item) => {
    if (selectedCatObj && item.categoryId && item.categoryId === selectedCatObj.id) {
      return true;
    }
    const targetName = (selectedCatObj?.name || selectedCategory).toLowerCase().trim();
    const targetSlug = (selectedCatObj?.slug || selectedCategory).toLowerCase().trim();
    const cat = (item.categoryLabel || item.category || item.tags || "").toLowerCase().trim();
    const slug = cat.replace(/\s+/g, "-").replace(/[^\w\-]+/g, "");
    return (
      cat === targetName ||
      slug === targetSlug ||
      cat.includes(targetName) ||
      targetName.includes(cat) ||
      slug.includes(targetSlug) ||
      targetSlug.includes(slug)
    );
  });

  const total = filteredItems.length;

  useEffect(() => {
    setActiveIndex(0);
  }, [selectedCategory]);

  const handleNext = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") handleNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    touchStartX.current = null;
    if (diff > 40) handleNext();
    if (diff < -40) handlePrev();
  };

  const activeItem = filteredItems[activeIndex];

  // Build category list with item counts
  const categoryPills = categories.map((cat) => {
    const target = (cat.slug || cat.name).toLowerCase().trim();
    const count = list.filter((item) => {
      const itemCat = (item.category || item.categoryLabel || item.tags || "").toLowerCase().trim();
      const itemSlug = itemCat.replace(/\s+/g, "-").replace(/[^\w\-]+/g, "");
      return (
        itemCat.includes(target) ||
        target.includes(itemCat) ||
        itemSlug.includes(target) ||
        target.includes(itemSlug) ||
        itemCat.includes(cat.name.toLowerCase().trim())
      );
    }).length;

    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      count,
    };
  });

  return (
    <section
      id="work"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="py-24 relative overflow-hidden bg-[var(--bg-main)] border-b border-[var(--border-glass)] transition-colors duration-500"
    >
      {/* Dynamic Ambient Blur Backdrop */}
      {activeItem && (() => {
        const bgThumb = getCleanThumbnail(activeItem.thumbnailUrl, activeItem.videoUrl);
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {bgThumb && (
              <img
                src={bgThumb}
                referrerPolicy="no-referrer"
                alt=""
                className="w-full h-full object-cover blur-[90px] opacity-25 scale-125 transition-all duration-1000"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-main)] via-black/60 to-[var(--bg-main)]" />
          </div>
        );
      })()}

      <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 glass-panel text-[var(--accent)] font-mono text-[11px] tracking-[0.2em] uppercase font-bold">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
            <span>01 // CINEMATIC SHOWREEL CAROUSEL</span>
          </div>

          <h2 className="font-serif font-bold text-5xl sm:text-7xl tracking-tight text-[var(--text-primary)]">
            Mesmerizing <span className="italic font-light text-[var(--accent)]">Motion.</span>
          </h2>

          <p className="text-sm sm:text-base text-[var(--text-secondary)] font-light max-w-xl mx-auto leading-relaxed">
            {introText ||
              "Explore category-wise video edits, commercial reels, architectural walkthroughs, and wedding films."}
          </p>
        </div>

        {/* Dynamic Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 font-mono text-xs tracking-wider uppercase">
          {categoryPills.map((cat) => {
            const isActive =
              selectedCategory.toLowerCase() === (cat.slug || "").toLowerCase() ||
              selectedCategory.toLowerCase() === cat.name.toLowerCase();

            return (
              <button
                key={cat.id || cat.slug}
                onClick={() => setSelectedCategory(cat.slug || cat.name)}
                className={`px-5 py-2.5 rounded-full transition-all flex items-center space-x-2 ${
                  isActive
                    ? "bg-[var(--accent)] text-[var(--bg-main)] font-bold shadow-xl scale-105"
                    : "glass-panel text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isActive
                      ? "bg-[var(--bg-main)] text-[var(--accent)] font-bold"
                      : "bg-white/10 text-[var(--text-secondary)]"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 3D COVERFLOW REEL CAROUSEL CONTAINER */}
        {total === 0 ? (
          <div className="py-20 text-center font-mono text-xs text-[var(--text-secondary)] glass-panel max-w-xl mx-auto p-8 rounded-2xl">
            NO VIDEOS FOUND IN THIS CATEGORY.
          </div>
        ) : (
          <div className="relative pt-6 pb-12 flex flex-col items-center">
            {/* Controls Bar */}
            <div className="w-full max-w-4xl flex items-center justify-between mb-8 px-4 font-mono text-xs text-[var(--text-secondary)]">
              <div className="flex items-center space-x-2">
                <span className="text-[var(--accent)] font-bold text-sm">
                  {String(activeIndex + 1).padStart(2, "0")}
                </span>
                <span>/</span>
                <span>{String(total).padStart(2, "0")}</span>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center space-x-3">
                <span className="text-[11px] text-[var(--text-secondary)] uppercase font-mono hidden sm:inline">
                  Click any card to play in HD
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={handlePrev}
                    aria-label="Previous Reel"
                    className="w-10 h-10 glass-panel rounded-full flex items-center justify-center text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all text-base"
                  >
                    ←
                  </button>
                  <button
                    onClick={handleNext}
                    aria-label="Next Reel"
                    className="w-10 h-10 glass-panel rounded-full flex items-center justify-center text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all text-base"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>

            {/* 3D Perspective Card Stack */}
            <div className="relative w-full max-w-5xl h-[560px] sm:h-[620px] flex items-center justify-center perspective-[1200px]">
              {filteredItems.map((item, idx) => {
                let offset = idx - activeIndex;
                if (offset < -Math.floor(total / 2)) offset += total;
                if (offset > Math.floor(total / 2)) offset -= total;

                const isActive = offset === 0;
                const isVisible = Math.abs(offset) <= 2;

                if (!isVisible) return null;

                const translateX = offset * 260;
                const translateZ = Math.abs(offset) * -180;
                const rotateY = offset * -18;
                const opacity = isActive ? 1 : Math.abs(offset) === 1 ? 0.65 : 0.25;
                const scale = isActive ? 1 : 0.88;
                const thumb = getCleanThumbnail(item.thumbnailUrl, item.videoUrl);

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (isActive) {
                        if (item.videoUrl && onOpenVideo) {
                          onOpenVideo(item.videoUrl, item.title);
                        }
                      } else {
                        setActiveIndex(idx);
                      }
                    }}
                    style={{
                      transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                      opacity: opacity,
                      zIndex: 30 - Math.abs(offset) * 10,
                    }}
                    className={`absolute w-[280px] sm:w-[320px] aspect-[9/16] rounded-[28px] overflow-hidden glass-panel-strong border-2 transition-all duration-700 cursor-pointer group shadow-2xl flex flex-col justify-between ${
                      isActive
                        ? "border-[var(--accent)] shadow-[0_20px_50px_rgba(200,166,106,0.3)] ring-1 ring-[var(--accent)]"
                        : "border-[var(--border-glass)] hover:opacity-90"
                    }`}
                  >
                    {/* Media Layer with High-Def Poster Thumbnail */}
                    <div className="absolute inset-0 bg-black">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          onError={(e) => {
                            const img = e.currentTarget;
                            if (!img.dataset.retry && item.thumbnailUrl && !img.src.includes("drive.google.com")) {
                              img.dataset.retry = "1";
                              img.src = item.thumbnailUrl;
                              return;
                            }
                            img.style.display = "none";
                          }}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : null}

                      {/* Fallback pattern when no thumbnail image */}
                      <div className="w-full h-full absolute inset-0 bg-gradient-to-br from-[#1c1c1c] to-[#0a0a0a] -z-10 flex flex-col items-center justify-center p-6 text-center">
                        <span className="text-3xl mb-2 opacity-50">🎬</span>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--accent)] font-bold">
                          {item.categoryLabel || item.category || "SHOWREEL"}
                        </span>
                      </div>

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/40" />

                      {/* Play Button Overlay (Active Card) */}
                      {isActive && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-16 h-16 rounded-full bg-[var(--accent)]/95 backdrop-blur-md text-[var(--bg-main)] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform pl-1">
                            <span className="text-2xl">▶</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Top Badge */}
                    <div className="relative z-10 p-5 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest">
                      <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[var(--accent)] font-bold border border-[var(--accent)]/40 truncate max-w-[180px]">
                        {item.categoryLabel || item.category || "SHOWREEL"}
                      </span>
                      <span className="text-white/80 font-bold">{item.year || 2026}</span>
                    </div>

                    {/* Bottom Metadata & Play CTA */}
                    <div className="relative z-10 p-5 space-y-3">
                      <div className="space-y-1">
                        <h3 className="font-serif font-bold text-xl sm:text-2xl text-white group-hover:text-[var(--accent)] transition-colors leading-snug line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-xs text-white/70 font-light line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-white/20 flex items-center justify-between font-mono text-[10px] text-white/80 uppercase">
                        <span className="truncate max-w-[150px] text-[var(--accent)]">
                          {item.software || "Premiere Pro / After Effects"}
                        </span>
                        <span className="font-bold text-white group-hover:text-[var(--accent)]">
                          PLAY FULL ↗
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
