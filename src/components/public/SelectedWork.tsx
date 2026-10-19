"use client";

import { useState } from "react";

export interface ProjectData {
  id: number;
  title: string;
  description: string;
  categoryId?: number | null;
  categoryLabel?: string;
  year?: number;
  software?: string;
  tags?: string;
  externalUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  aspectRatio?: string;
  displaySize?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  sortOrder?: number;
}

export interface CategoryData {
  id: number;
  name: string;
  slug: string;
}

interface SelectedWorkProps {
  projects?: ProjectData[];
  categories?: CategoryData[];
  introText?: string;
  onOpenVideo?: (videoUrl: string, title: string) => void;
}

const DEFAULT_PROJECTS: ProjectData[] = [
  {
    id: 991,
    title: "Cinematic Luxury Real Estate Film",
    description: "High-end 4K architectural video tour with custom speed ramps, sound design, and color grading for premium villas.",
    categoryLabel: "REAL ESTATE",
    year: 2026,
    software: "Premiere Pro / DaVinci Resolve",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    displaySize: "large",
  },
  {
    id: 992,
    title: "Commercial Brand Commercial Ad",
    description: "Fast-paced promo video with dynamic motion graphics, sound effects, and kinetic typography for digital campaigns.",
    categoryLabel: "COMMERCIAL AD",
    year: 2026,
    software: "After Effects / Premiere Pro",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    displaySize: "medium",
  },
  {
    id: 993,
    title: "Viral Short-Form Reel Edit",
    description: "High-retention Instagram Reel & TikTok edit with custom captions, hook animations, and sound effects.",
    categoryLabel: "SHORTS & REELS",
    year: 2026,
    software: "After Effects / CapCut Pro",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    displaySize: "medium",
  },
  {
    id: 994,
    title: "3D Motion Graphics & VFX Intro",
    description: "3D product animation and intro sequence created with Blender and After Effects compositing.",
    categoryLabel: "MOTION GRAPHICS",
    year: 2026,
    software: "Blender / After Effects",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    displaySize: "large",
  }
];

export default function SelectedWork({
  projects = [],
  categories = [],
  introText,
  onOpenVideo,
}: SelectedWorkProps) {
  const [activeCategory, setActiveCategory] = useState("all");

  const displayProjects = projects.length > 0 ? projects : DEFAULT_PROJECTS;

  const filteredProjects =
    activeCategory === "all"
      ? displayProjects
      : displayProjects.filter((p) => {
          const cat = categories.find((c) => c.slug === activeCategory);
          if (cat) return p.categoryId === cat.id;
          return p.categoryLabel?.toLowerCase().includes(activeCategory.toLowerCase());
        });

  return (
    <section id="work" className="py-24 border-b border-[var(--border-glass)]">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        {/* Header & Category Filters */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <span className="font-mono text-xs tracking-[0.2em] text-[var(--accent)] uppercase font-bold">
              01 // SELECTED PORTFOLIO
            </span>
            <h2 className="font-serif font-bold text-4xl sm:text-6xl tracking-tight text-[var(--text-primary)]">
              Crafted Visuals.
            </h2>
            <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed">
              {introText || "Selected commercial, narrative, real estate, and motion graphics projects crafted with precision."}
            </p>
          </div>

          {/* Glass Filter Pills */}
          <div className="flex flex-wrap gap-2.5 font-mono text-xs tracking-wider uppercase">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-4 py-2.5 rounded-full transition-all ${
                activeCategory === "all"
                  ? "bg-[var(--accent)] text-[var(--bg-main)] font-bold shadow-lg"
                  : "glass-panel text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              ALL WORK ({displayProjects.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.slug)}
                className={`px-4 py-2.5 rounded-full transition-all ${
                  activeCategory === cat.slug
                    ? "bg-[var(--accent)] text-[var(--bg-main)] font-bold shadow-lg"
                    : "glass-panel text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Asymmetric Mixed Editorial Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {filteredProjects.map((project, idx) => {
            const isLarge = project.displaySize === "large" || idx === 0;
            const colSpan = isLarge ? "md:col-span-12" : "md:col-span-6";

            return (
              <div
                key={project.id}
                onClick={() =>
                  project.videoUrl && onOpenVideo
                    ? onOpenVideo(project.videoUrl, project.title)
                    : null
                }
                className={`${colSpan} glass-panel p-6 space-y-6 flex flex-col justify-between group hover:border-[var(--accent)]/60 transition-all duration-500 cursor-pointer`}
              >
                {/* Metadata Header */}
                <div className="flex items-center justify-between font-mono text-xs text-[var(--text-secondary)] tracking-widest uppercase">
                  <span className="text-[var(--accent)] font-bold">
                    {project.categoryLabel || "PROJECT #" + (idx + 1)}
                  </span>
                  <span>{project.year || 2026}</span>
                </div>

                {/* Media Aspect Frame */}
                <div className="relative aspect-video w-full rounded-[16px] overflow-hidden bg-black group-hover:shadow-2xl">
                  {project.videoUrl &&
                  (project.videoUrl.startsWith("/uploads/") ||
                    project.videoUrl.includes("blob.vercel-storage.com") ||
                    Boolean(project.videoUrl.match(/\.(mp4|mov|webm|m4v)(\?.*)?$/i))) &&
                  !project.videoUrl.includes("drive.google.com") &&
                  !project.videoUrl.includes("youtube.com") &&
                  !project.videoUrl.includes("youtu.be") ? (
                    <video
                      src={project.videoUrl}
                      poster={project.thumbnailUrl}
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                      onMouseLeave={(e) => {
                        const v = e.target as HTMLVideoElement;
                        v.pause();
                        v.currentTime = 0;
                      }}
                    />
                  ) : project.thumbnailUrl ? (
                    <img
                      src={project.thumbnailUrl}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--bg-surface)] flex items-center justify-center font-mono text-xs text-[var(--text-secondary)]">
                      NO MEDIA AVAILABLE
                    </div>
                  )}

                  {/* Glass Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="px-6 py-3 bg-[var(--accent)] text-[var(--bg-main)] font-mono text-xs font-bold tracking-widest uppercase rounded-full shadow-xl">
                      PLAY PROJECT REEL ↗
                    </span>
                  </div>
                </div>

                {/* Project Info */}
                <div className="space-y-3">
                  <h3 className="font-serif font-bold text-2xl sm:text-3xl tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed line-clamp-3">
                    {project.description}
                  </p>
                </div>

                {/* Software Footer */}
                <div className="pt-4 border-t border-[var(--border-glass)] flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-[var(--text-secondary)]">
                  <span className="truncate max-w-xs">{project.software || "Premiere Pro / After Effects"}</span>
                  <span className="text-[var(--accent)] font-bold">WATCH FULL ↗</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
