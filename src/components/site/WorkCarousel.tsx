"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ProjectViewer from "./ProjectViewer";
import { SectionHeading } from "./Sections";
import { formatDuration } from "@/lib/carousel";
import type { PublicProject, SiteData } from "@/lib/data";

type Category = { id: number; name: string; slug: string };

export default function WorkCarousel({ data }: { data: SiteData }) {
  const projects = data.projects;
  const categories: Category[] = data.categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
  }));

  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [viewer, setViewer] = useState<PublicProject | null>(null);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);

  // Touch and drag handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Filter projects by category
  const filteredProjects = useMemo(() => {
    let list = [...projects];
    if (activeCategory !== null) {
      list = list.filter((p) => p.categoryId === activeCategory);
    }
    // Check if custom carousel ordering/pinning exists
    const catSetting = data.carouselSettings.find((s) => s.isActive && s.categoryId === activeCategory);
    if (catSetting?.projectIds) {
      try {
        const pinnedIds = JSON.parse(catSetting.projectIds) as number[];
        if (Array.isArray(pinnedIds) && pinnedIds.length > 0) {
          const pinned = pinnedIds
            .map((id) => list.find((p) => p.id === id))
            .filter((p): p is PublicProject => Boolean(p));
          const rest = list.filter((p) => !pinnedIds.includes(p.id));
          list = [...pinned, ...rest];
        }
      } catch {}
    }
    return list;
  }, [projects, activeCategory, data.carouselSettings]);

  // Reset index when category changes
  useEffect(() => {
    setIndex(0);
  }, [activeCategory]);

  const maxIndex = Math.max(0, filteredProjects.length - 1);

  const prev = useCallback(() => {
    if (filteredProjects.length <= 1) return;
    setIndex((curr) => (curr > 0 ? curr - 1 : maxIndex));
  }, [filteredProjects.length, maxIndex]);

  const next = useCallback(() => {
    if (filteredProjects.length <= 1) return;
    setIndex((curr) => (curr < maxIndex ? curr + 1 : 0));
  }, [filteredProjects.length, maxIndex]);

  // Auto-play timer
  useEffect(() => {
    if (!isAutoPlay || filteredProjects.length <= 1 || viewer) return;
    const timer = setInterval(() => {
      next();
    }, 4500);
    return () => clearInterval(timer);
  }, [isAutoPlay, filteredProjects.length, next, viewer]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewer) return;
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prev, next, viewer]);

  // Touch Swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(null);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) next();
    if (distance < -50) prev();
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const map = new Map<number, number>();
    projects.forEach((p) => {
      if (p.categoryId) {
        map.set(p.categoryId, (map.get(p.categoryId) ?? 0) + 1);
      }
    });
    return map;
  }, [projects]);

  return (
    <section id="work" className="relative px-4 sm:px-6 py-20 lg:py-28 overflow-hidden">
      {/* Background Decorative Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-[radial-gradient(ellipse_at_center,rgba(224,20,127,0.07),transparent_70%)] blur-3xl"
      />

      <div className="mx-auto max-w-[1400px]">
        {/* Header with Navigation Controls */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Selected Works"
            title="Creative Portfolio"
            description="Explore cinematic edits, vertical reels, brand motion systems, and AI-assisted productions."
          />

          <div className="flex items-center gap-3 self-start md:self-auto">
            {/* Auto Play Toggle */}
            <button
              type="button"
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.68rem] font-semibold tracking-wider uppercase transition-all ${
                isAutoPlay
                  ? "bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20"
                  : "bg-white/70 border border-ink/10 text-ink/60 hover:text-ink hover:bg-white"
              }`}
              title={isAutoPlay ? "Pause Auto Slide" : "Start Auto Slide"}
            >
              <span>{isAutoPlay ? "⏸ Auto Playing" : "▶ Auto Play"}</span>
            </button>

            {/* Slide Counter */}
            {filteredProjects.length > 0 && (
              <span className="mono text-[0.72rem] font-bold text-ink/45 px-2">
                {String(index + 1).padStart(2, "0")} / {String(filteredProjects.length).padStart(2, "0")}
              </span>
            )}

            {/* Arrows */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={prev}
                aria-label="Previous project"
                disabled={filteredProjects.length <= 1}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/80 border border-ink/10 text-ink shadow-sm transition-all hover:bg-white hover:border-[var(--accent)] hover:text-[var(--accent)] active:scale-95 disabled:opacity-30"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next project"
                disabled={filteredProjects.length <= 1}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/80 border border-ink/10 text-ink shadow-sm transition-all hover:bg-white hover:border-[var(--accent)] hover:text-[var(--accent)] active:scale-95 disabled:opacity-30"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="mt-8">
          <div
            role="tablist"
            className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 sm:flex-wrap"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === null}
              onClick={() => setActiveCategory(null)}
              className={`group flex items-center gap-2 rounded-full px-4 py-2 text-[0.72rem] font-semibold transition-all ${
                activeCategory === null
                  ? "bg-ink text-white shadow-md shadow-ink/15"
                  : "bg-white/70 border border-ink/10 text-ink/65 hover:bg-white hover:text-ink"
              }`}
            >
              <span>All Works</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[0.62rem] font-bold ${
                  activeCategory === null ? "bg-white/20 text-white" : "bg-ink/5 text-ink/50"
                }`}
              >
                {projects.length}
              </span>
            </button>

            {categories.map((cat) => {
              const count = categoryCounts.get(cat.id) ?? 0;
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`group flex items-center gap-2 rounded-full px-4 py-2 text-[0.72rem] font-semibold transition-all ${
                    isSelected
                      ? "bg-ink text-white shadow-md shadow-ink/15"
                      : "bg-white/70 border border-ink/10 text-ink/65 hover:bg-white hover:text-ink"
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[0.62rem] font-bold ${
                      isSelected ? "bg-white/20 text-white" : "bg-ink/5 text-ink/50"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Carousel Showcase Track */}
        <div
          className="relative mt-8"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {filteredProjects.length === 0 ? (
            <div className="glass mx-auto max-w-md rounded-3xl p-10 text-center border border-white/60">
              <p className="text-sm text-ink/60">No projects available in this category yet.</p>
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className="btn btn-dark btn-xs mt-4"
              >
                Show All Works
              </button>
            </div>
          ) : (
            <div className="relative overflow-hidden py-4">
              <div
                ref={trackRef}
                className="flex items-center gap-5 sm:gap-7 transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(calc(-${index * 100}% - ${index * 24}px))`,
                }}
              >
                {filteredProjects.map((project, i) => {
                  const isCurrent = i === index;
                  const isVertical = project.aspectRatio === "9:16";

                  return (
                    <div
                      key={project.id}
                      className="w-full flex-shrink-0 flex justify-center"
                    >
                      <article
                        onClick={() => setViewer(project)}
                        className={`group relative cursor-pointer overflow-hidden rounded-[28px] border transition-all duration-300 bg-black/5 ${
                          isVertical ? "max-w-[340px] aspect-[9/16]" : "max-w-[760px] aspect-[16/9]"
                        } w-full shadow-xl hover:shadow-2xl hover:scale-[1.01] ${
                          isCurrent ? "border-ink/20 ring-2 ring-[var(--accent)]/30" : "border-ink/10 opacity-90"
                        }`}
                      >
                        {/* Thumbnail Image */}
                        {project.thumbnailUrl ? (
                          <img
                            src={project.thumbnailUrl}
                            alt={project.title}
                            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-ink/90 to-black text-white/40">
                            <span className="text-4xl">🎬</span>
                          </div>
                        )}

                        {/* Top Badges */}
                        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
                          <span className="rounded-full bg-black/65 backdrop-blur-md px-3 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-white shadow-sm border border-white/10">
                            {project.categoryLabel || "Video"}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {isVertical && (
                              <span className="rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[0.58rem] font-bold text-white shadow-sm uppercase tracking-wider">
                                9:16 Reel
                              </span>
                            )}
                            {project.durationSeconds && project.durationSeconds > 0 && (
                              <span className="rounded-full bg-black/65 backdrop-blur-md px-2.5 py-0.5 text-[0.62rem] font-mono text-white/90 border border-white/10">
                                {formatDuration(project.durationSeconds)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Center Play Button Overlay */}
                        <div className="absolute inset-0 grid place-items-center bg-black/25 opacity-80 group-hover:opacity-100 group-hover:bg-black/35 transition-all duration-300">
                          <div className="grid h-16 w-16 place-items-center rounded-full bg-white/90 text-ink shadow-2xl backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:bg-[var(--accent)] group-hover:text-white">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="ml-1">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          </div>
                        </div>

                        {/* Bottom Info Gradient */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-6 pt-16 text-white transition-opacity duration-300">
                          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white group-hover:text-[var(--accent)] transition-colors">
                            {project.title}
                          </h3>
                          {project.description && (
                            <p className="mt-1.5 line-clamp-2 text-[0.78rem] text-white/75 leading-relaxed">
                              {project.description}
                            </p>
                          )}
                          {project.software && (
                            <p className="mono mt-3 text-[0.62rem] uppercase tracking-wider text-white/50">
                              {project.software}
                            </p>
                          )}
                        </div>
                      </article>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Carousel Pagination Dots */}
        {filteredProjects.length > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {filteredProjects.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === index ? "w-8 bg-[var(--accent)]" : "w-2 bg-ink/20 hover:bg-ink/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fullframe Universal Video Viewer Modal */}
      {viewer && <ProjectViewer project={viewer} onClose={() => setViewer(null)} />}
    </section>
  );
}
