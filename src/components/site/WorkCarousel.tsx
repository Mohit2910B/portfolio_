"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PublicProject, SiteData } from "@/lib/data";

export default function WorkCarousel({ data }: { data: SiteData }) {
  const global = data.carouselGlobalSettings || {
    id: 1,
    enabled: true,
    sectionTitle: "Selected Works",
    sectionSubtitle:
      "A curated showcase of video editing, motion design, and visual storytelling.",
    autoplay: true,
    autoplaySpeed: 5,
    infiniteLoop: true,
    showArrows: true,
    showDots: true,
  };

  // If carousel is disabled in global settings, do not render section
  if (!global.enabled) return null;

  // Filter projects for carousel: must be published and carouselEnabled !== false
  const allProjects = data.projects || [];
  const carouselProjects = useMemo(() => {
    const active = allProjects.filter((p) => p.carouselEnabled !== false);
    // Sort: pinned first (descending), then carouselOrder (ascending), then sortOrder (ascending)
    return active.sort((a, b) => {
      if (a.carouselPinned && !b.carouselPinned) return -1;
      if (!a.carouselPinned && b.carouselPinned) return 1;
      const orderA = a.carouselOrder ?? a.sortOrder ?? 0;
      const orderB = b.carouselOrder ?? b.sortOrder ?? 0;
      return orderA - orderB;
    });
  }, [allProjects]);

  return (
    <section id="work" className="relative overflow-hidden py-24 md:py-32">
      {/* Background ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, var(--accent, #e0147f) 0%, rgba(224,20,127,0) 70%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center md:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[var(--accent,#e0147f)] shadow-[0_0_8px_var(--accent,#e0147f)]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
              Featured Showcase
            </span>
          </div>
          <h2 className="mt-4 font-heading text-3xl font-extrabold uppercase tracking-tight text-white sm:text-4xl md:text-5xl">
            {global.sectionTitle || "Selected Works"}
          </h2>
          {global.sectionSubtitle && (
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-base">
              {global.sectionSubtitle}
            </p>
          )}
        </div>

        {/* Carousel Showcase */}
        <CarouselViewer
          projects={carouselProjects}
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

function CarouselViewer({
  projects,
  autoplay,
  autoplaySpeed,
  infiniteLoop,
  showArrows,
  showDots,
}: {
  projects: PublicProject[];
  autoplay: boolean;
  autoplaySpeed: number;
  infiniteLoop: boolean;
  showArrows: boolean;
  showDots: boolean;
}) {
  const count = projects.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Handle single / empty states
  if (count === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center backdrop-blur-md">
        <p className="text-sm text-white/40">No projects currently selected for showcase.</p>
      </div>
    );
  }

  const prev = useCallback(() => {
    setCurrentIndex((prevIdx) => {
      if (prevIdx === 0) {
        return infiniteLoop ? count - 1 : 0;
      }
      return prevIdx - 1;
    });
  }, [count, infiniteLoop]);

  const next = useCallback(() => {
    setCurrentIndex((prevIdx) => {
      if (prevIdx >= count - 1) {
        return infiniteLoop ? 0 : count - 1;
      }
      return prevIdx + 1;
    });
  }, [count, infiniteLoop]);

  // Autoplay timer
  useEffect(() => {
    if (!autoplay || isHovered || count <= 1) return;
    const intervalMs = Math.max(autoplaySpeed, 2) * 1000;
    const timer = setInterval(() => {
      next();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [autoplay, autoplaySpeed, isHovered, count, next]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prev, next]);

  // Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe) next();
    if (isRightSwipe) prev();
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const currentProject = projects[currentIndex];

  return (
    <div
      className="relative select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Cards Viewport */}
      <div className="relative mx-auto flex items-center justify-center">
        {/* Main Center Card Showcase */}
        <div className="w-full max-w-4xl">
          <ProjectCard project={currentProject} isActive={true} />
        </div>

        {/* Previous Card Peek (Desktop only) */}
        {count > 1 && (
          <button
            type="button"
            onClick={prev}
            aria-label="Previous project preview"
            className="absolute -left-12 top-1/2 hidden h-4/5 w-48 -translate-y-1/2 cursor-pointer overflow-hidden rounded-3xl border border-white/5 bg-black/40 opacity-30 blur-[1px] transition-all duration-300 hover:opacity-50 lg:block xl:-left-24"
          >
            <div className="relative h-full w-full">
              {projects[(currentIndex - 1 + count) % count]?.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={projects[(currentIndex - 1 + count) % count].thumbnailUrl}
                  alt="Previous project"
                  className="h-full w-full object-cover grayscale"
                />
              )}
            </div>
          </button>
        )}

        {/* Next Card Peek (Desktop only) */}
        {count > 1 && (
          <button
            type="button"
            onClick={next}
            aria-label="Next project preview"
            className="absolute -right-12 top-1/2 hidden h-4/5 w-48 -translate-y-1/2 cursor-pointer overflow-hidden rounded-3xl border border-white/5 bg-black/40 opacity-30 blur-[1px] transition-all duration-300 hover:opacity-50 lg:block xl:-right-24"
          >
            <div className="relative h-full w-full">
              {projects[(currentIndex + 1) % count]?.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={projects[(currentIndex + 1) % count].thumbnailUrl}
                  alt="Next project"
                  className="h-full w-full object-cover grayscale"
                />
              )}
            </div>
          </button>
        )}
      </div>

      {/* Navigation Controls: Arrows & Dots */}
      <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row sm:px-6">
        {/* Project count indicator */}
        <div className="order-2 text-xs font-medium text-white/40 sm:order-1">
          <span className="font-mono text-sm font-bold text-white">
            {String(currentIndex + 1).padStart(2, "0")}
          </span>
          <span className="mx-1.5 text-white/20">/</span>
          <span className="font-mono">{String(count).padStart(2, "0")}</span>
        </div>

        {/* Dots Indicator */}
        {showDots && count > 1 && (
          <div className="order-1 flex items-center gap-2 sm:order-2">
            {projects.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? "w-8 bg-[var(--accent,#e0147f)] shadow-[0_0_10px_var(--accent,#e0147f)]"
                    : "w-2 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        )}

        {/* Arrow Buttons */}
        {showArrows && count > 1 && (
          <div className="order-3 flex items-center gap-3">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous project"
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
              aria-label="Next project"
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

function ProjectCard({ project, isActive }: { project: PublicProject; isActive: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const isVertical = project.aspectRatio === "9:16";
  const category = project.categoryLabel || "Video Edit";

  // Play / Pause video based on active status
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !project.videoUrl) return;

    if (isActive) {
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay with video preview might be prevented by browser
            setIsPlaying(false);
          });
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive, project.videoUrl]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-2xl backdrop-blur-xl">
      {/* Media Box */}
      <div
        className={`relative w-full overflow-hidden bg-black/80 ${
          isVertical ? "h-[500px] sm:h-[600px] md:h-[680px]" : "h-[320px] sm:h-[440px] md:h-[520px]"
        }`}
      >
        {/* Video Element (when video URL exists and no error) */}
        {project.videoUrl && !videoError ? (
          <video
            ref={videoRef}
            src={project.videoUrl}
            poster={project.thumbnailUrl || undefined}
            muted
            loop
            playsInline
            preload="metadata"
            onError={() => setVideoError(true)}
            className={`h-full w-full object-cover transition-opacity duration-500 ${
              isPlaying ? "opacity-100" : "opacity-95"
            }`}
          />
        ) : project.thumbnailUrl ? (
          // Thumbnail Image fallback
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.thumbnailUrl}
            alt={project.title}
            className="h-full w-full object-cover"
          />
        ) : (
          // Elegant placeholder fallback
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-neutral-900 to-black text-white/30">
            <div className="text-4xl">🎬</div>
            <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-white/40">
              {project.title}
            </p>
          </div>
        )}

        {/* Gradient Overlay for Text Legibility */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Top Badges */}
        <div className="absolute left-6 top-6 flex flex-wrap items-center gap-2">
          {project.carouselPinned && (
            <span className="rounded-full bg-amber-500/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-black shadow-lg">
              ★ Featured Spotlight
            </span>
          )}
          <span className="rounded-full border border-white/15 bg-black/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-md">
            {category}
          </span>
          {project.year && (
            <span className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[11px] font-mono text-white/70 backdrop-blur-md">
              {project.year}
            </span>
          )}
        </div>

        {/* Bottom Details Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <h3 className="font-heading text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl md:text-4xl">
            {project.title}
          </h3>

          {project.description && (
            <p className="mt-2 max-w-2xl line-clamp-2 text-xs leading-relaxed text-white/75 sm:text-sm">
              {project.description}
            </p>
          )}

          {/* Software & Tags */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {project.software &&
              project.software.split(",").map((s) => (
                <span
                  key={s.trim()}
                  className="rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white/80 backdrop-blur-md"
                >
                  {s.trim()}
                </span>
              ))}

            {project.externalLink && (
              <a
                href={project.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black transition hover:bg-white/90"
              >
                <span>View Full Project</span>
                <span>↗</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
