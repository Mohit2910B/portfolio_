"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import type { CarouselItem, PublicProject } from "@/lib/data";
import ProjectViewer from "./ProjectViewer";

type Props = {
  carouselItems?: CarouselItem[];
  projects?: PublicProject[];
  onSelectProject?: (p: PublicProject) => void;
  showEmptyNotice?: boolean;
};

export default function SpotlightReelCarousel({
  carouselItems = [],
  projects = [],
  onSelectProject,
  showEmptyNotice = false,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeModalProject, setActiveModalProject] = useState<PublicProject | null>(null);
  const [isPlayingInline, setIsPlayingInline] = useState(false);

  // Filter active carousel items
  const items = useMemo(() => {
    const activeCarousel = carouselItems.filter((i) => i.isActive !== false);
    if (activeCarousel.length > 0) return activeCarousel;
    if (projects.length > 0) {
      return projects
        .filter((p) => p.published !== false)
        .map((p) => ({
          id: p.id,
          title: p.title,
          category: p.categoryLabel || "Reel",
          description: p.description,
          duration: p.durationSeconds ? `${p.durationSeconds}s` : "0:30",
          videoUrl: p.videoUrl,
          videoSource: p.videoSource,
          thumbnailUrl: p.thumbnailUrl,
          aspectRatio: p.aspectRatio || "9:16",
          isActive: true,
          sortOrder: p.sortOrder,
          rawProject: p,
        }));
    }
    return [];
  }, [carouselItems, projects]);

  const handleNext = useCallback(() => {
    setIsPlayingInline(false);
    setActiveIndex((prev) => (items.length > 0 ? (prev + 1) % items.length : 0));
  }, [items.length]);

  const handlePrev = useCallback(() => {
    setIsPlayingInline(false);
    setActiveIndex((prev) => (items.length > 0 ? (prev - 1 + items.length) % items.length : 0));
  }, [items.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev]);

  if (items.length === 0) {
    if (showEmptyNotice) {
      return (
        <div className="mx-auto max-w-4xl rounded-3xl border border-dashed border-white/20 p-12 text-center bg-black/40">
          <p className="font-mono text-sm text-white/50 uppercase tracking-widest">
            0 Active Carousel Items in Database
          </p>
          <p className="mt-2 text-xs text-white/30">
            Add or enable carousel items in the Admin Panel to display them on the website.
          </p>
        </div>
      );
    }
    return null;
  }

  const count = items.length;
  const current = items[activeIndex] || items[0];

  // Helper to convert CarouselItem to PublicProject format for ProjectViewer
  const getProjectForModal = (item: typeof current): PublicProject => {
    const raw = (item as unknown as { rawProject?: PublicProject }).rawProject;
    if (raw) return raw;
    return {
      id: item.id,
      title: item.title,
      description: item.description || "",
      categoryId: null,
      categoryLabel: item.category || "Reel",
      aiLabType: "",
      year: 2026,
      software: "",
      tags: "",
      externalLink: "",
      videoSource: "upload",
      videoUrl: item.videoUrl || "",
      thumbnailUrl: item.thumbnailUrl || "",
      aspectRatio: item.aspectRatio || "9:16",
      displaySize: "medium",
      displayWidth: 540,
      displayHeight: 960,
      width: 1080,
      height: 1920,
      durationSeconds: 30,
      featured: true,
      published: true,
      sortOrder: item.sortOrder || 0,
      demoStatus: "verified",
      carouselEnabled: true,
      carouselPinned: false,
      carouselOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  const handleOpenModal = (item: typeof current) => {
    const proj = getProjectForModal(item);
    if (onSelectProject) {
      onSelectProject(proj);
    } else {
      setActiveModalProject(proj);
    }
  };

  return (
    <section className="relative overflow-hidden bg-[#070709] py-12 text-white sm:py-20 select-none">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* 3D Showcase Carousel Stage */}
        <div className="relative mt-8 min-h-[480px] sm:min-h-[540px] flex items-center justify-center perspective-[1200px]">
          {items.map((item, idx) => {
            // Compute offset relative to activeIndex
            let offset = idx - activeIndex;
            if (offset > count / 2) offset -= count;
            if (offset < -count / 2) offset += count;

            const isCenter = offset === 0;
            const isLeft = offset === -1 || (offset < 0 && count === 2);
            const isRight = offset === 1 || (offset > 0 && count === 2);
            const isVisible = isCenter || isLeft || isRight || Math.abs(offset) <= 2;

            if (!isVisible && count > 5) return null;

            // Positioning & 3D Transforms
            let transform = "translate3d(0, 0, 0) scale(1)";
            let zIndex = 10;
            let opacity = 0.4;
            let pointerEvents: "auto" | "none" = "none";

            if (isCenter) {
              transform = "translate3d(0, 0, 40px) scale(1)";
              zIndex = 30;
              opacity = 1;
              pointerEvents = "auto";
            } else if (offset === -1) {
              transform = "translate3d(-65%, 0, -80px) rotateY(14deg) scale(0.85)";
              zIndex = 20;
              opacity = 0.6;
              pointerEvents = "auto";
            } else if (offset === 1) {
              transform = "translate3d(65%, 0, -80px) rotateY(-14deg) scale(0.85)";
              zIndex = 20;
              opacity = 0.6;
              pointerEvents = "auto";
            } else if (offset < -1) {
              transform = "translate3d(-110%, 0, -160px) rotateY(24deg) scale(0.7)";
              zIndex = 10;
              opacity = 0.2;
            } else if (offset > 1) {
              transform = "translate3d(110%, 0, -160px) rotateY(-24deg) scale(0.7)";
              zIndex = 10;
              opacity = 0.2;
            }

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (!isCenter) {
                    setIsPlayingInline(false);
                    setActiveIndex(idx);
                  }
                }}
                style={{
                  transform,
                  zIndex,
                  opacity,
                  pointerEvents,
                }}
                className={`absolute w-full max-w-[360px] sm:max-w-[460px] cursor-pointer transition-all duration-500 ease-out transform-gpu ${
                  isCenter ? "shadow-[0_0_50px_rgba(224,20,127,0.25)]" : "hover:opacity-80"
                }`}
              >
                <div
                  className={`relative overflow-hidden rounded-3xl border bg-neutral-900 transition-colors duration-300 ${
                    isCenter ? "border-[#e0147f]/60 bg-neutral-950" : "border-white/10"
                  }`}
                >
                  {/* Card Poster / Image */}
                  <div className="relative aspect-[9/16] max-h-[480px] w-full overflow-hidden bg-black">
                    {isCenter && isPlayingInline && item.videoUrl ? (
                      <video
                        src={item.videoUrl}
                        controls
                        autoPlay
                        className="h-full w-full object-cover"
                      />
                    ) : item.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full place-items-center bg-neutral-900 font-mono text-xs text-white/40">
                        [POSTER IMAGE REQUIRED]
                      </div>
                    )}

                    {/* Dark gradient overlay for text legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/20" />

                    {/* Top Badges */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                      <span className="rounded-full bg-[#e0147f] px-3 py-1 font-mono text-[10px] uppercase font-bold tracking-wider text-white shadow-lg">
                        ★ {item.category || "REEL"}
                      </span>
                      <span className="rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-0.5 font-mono text-[10px] text-white/80">
                        {item.duration || "0:30"}
                      </span>
                    </div>

                    {/* Center Play Button Overlay */}
                    {isCenter && !isPlayingInline && (
                      <div className="absolute inset-0 flex items-center justify-center z-20">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.videoUrl) {
                              setIsPlayingInline(true);
                            } else {
                              handleOpenModal(item);
                            }
                          }}
                          aria-label="Play video"
                          className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-[#e0147f] text-white shadow-2xl transition-transform duration-300 hover:scale-110 active:scale-95"
                        >
                          <span className="ml-1 text-2xl font-bold">▶</span>
                          <span className="absolute -inset-2 rounded-full border border-[#e0147f]/40 animate-ping" />
                        </button>
                      </div>
                    )}

                    {/* Bottom Content Info */}
                    <div className="absolute bottom-4 left-4 right-4 z-10 space-y-2">
                      <h3 className="font-heading text-xl sm:text-2xl font-bold uppercase tracking-tight text-white drop-shadow-md">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="line-clamp-2 text-xs text-white/70 leading-relaxed font-sans">
                          {item.description}
                        </p>
                      )}

                      {isCenter && (
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenModal(item);
                            }}
                            className="btn btn-accent btn-xs w-full font-mono uppercase text-[10px] tracking-wider py-2"
                          >
                            Watch Full Film ▶
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Navigation Controls */}
        {count > 1 && (
          <div className="mt-8 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={handlePrev}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/5 text-xl font-bold text-white transition-all hover:border-[#e0147f] hover:bg-[#e0147f] active:scale-90"
              aria-label="Previous carousel item"
            >
              ←
            </button>

            {/* Dots indicator */}
            <div className="flex items-center gap-2">
              {items.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setIsPlayingInline(false);
                    setActiveIndex(idx);
                  }}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    idx === activeIndex
                      ? "w-8 bg-[#e0147f]"
                      : "w-2.5 bg-white/20 hover:bg-white/40"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/5 text-xl font-bold text-white transition-all hover:border-[#e0147f] hover:bg-[#e0147f] active:scale-90"
              aria-label="Next carousel item"
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Fullscreen Video Cinema Modal */}
      {activeModalProject && (
        <ProjectViewer
          project={activeModalProject}
          onClose={() => setActiveModalProject(null)}
        />
      )}
    </section>
  );
}
