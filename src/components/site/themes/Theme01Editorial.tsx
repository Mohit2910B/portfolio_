"use client";

import { useMemo, useRef, useState } from "react";
import type { SiteData, PublicProject } from "@/lib/data";
import SiteNav from "@/components/site/SiteNav";
import Hero from "@/components/site/Hero";
import { Marquee, About, Services, Footer, SectionHeading } from "@/components/site/Sections";
import SoftwareTools from "@/components/site/SoftwareTools";
import ContactSection from "@/components/site/ContactSection";
import ProjectViewer from "@/components/site/ProjectViewer";
import ChatWidget from "@/components/site/ChatWidget";
import Reveal from "@/components/site/Reveal";
import SpotlightReelCarousel from "@/components/site/SpotlightReelCarousel";
import BeforeAfterSlider from "@/components/site/BeforeAfterSlider";
import ProcessTimeline from "@/components/site/ProcessTimeline";

/* ============================================================
   PROJECT CARD
   Live muted video hover preview + cinematic overlay
   ============================================================ */
function ProjectCard({
  project,
  onSelect,
}: {
  project: PublicProject;
  onSelect: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current && project.videoUrl) {
      void videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const isVertical = project.aspectRatio === "9:16" || project.aspectRatio === "4:5";

  return (
    <article
      onClick={onSelect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onSelect(); }}
      aria-label={`Open ${project.title}`}
      className="group relative cursor-pointer overflow-hidden rounded-[24px] bg-white shadow-[0_4px_30px_-8px_rgba(11,11,12,0.12)] border border-[rgba(11,11,12,0.07)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_-15px_rgba(11,11,12,0.22)] hover:border-[rgba(11,11,12,0.15)]"
    >
      {/* Video / Image Thumbnail */}
      <div
        className={`relative overflow-hidden bg-neutral-100 ${
          isVertical
            ? "aspect-[9/16] max-h-[400px] mx-auto"
            : "aspect-video"
        }`}
      >
        {project.videoUrl ? (
          <video
            ref={videoRef}
            src={project.videoUrl}
            poster={project.thumbnailUrl || undefined}
            muted
            loop
            playsInline
            preload="metadata"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
          />
        ) : project.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.thumbnailUrl}
            alt={project.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full min-h-[200px] place-items-center bg-neutral-100">
            <span className="text-3xl opacity-30">🎬</span>
          </div>
        )}

        {/* Cinematic Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-50 transition duration-300 group-hover:opacity-70" />

        {/* Play Button — visible on hover */}
        <div className="absolute inset-0 grid place-items-center opacity-0 transition duration-300 group-hover:opacity-100">
          <div className="relative grid h-14 w-14 place-items-center rounded-full bg-white text-black shadow-2xl transition duration-300 group-hover:scale-110">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span className="absolute -inset-2 animate-ping rounded-full border border-white/40 opacity-30" />
          </div>
        </div>

        {/* Top-left: aspect-ratio + duration badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="rounded-md bg-black/70 px-2.5 py-1 font-mono text-[0.55rem] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            {project.aspectRatio || "16:9"}
          </span>
          {project.durationSeconds ? (
            <span className="rounded-md bg-black/70 px-2.5 py-1 font-mono text-[0.55rem] font-semibold text-white/90 backdrop-blur-sm">
              ⏱ {project.durationSeconds}s
            </span>
          ) : null}
          {project.featured && (
            <span className="rounded-md bg-[#e0147f] px-2.5 py-1 text-[0.55rem] font-bold uppercase tracking-wider text-white shadow-sm">
              ★ Spotlight
            </span>
          )}
        </div>

        {/* Playing indicator */}
        {isHovered && project.videoUrl && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1 text-[9px] font-bold text-white shadow-xl backdrop-blur-md">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span>PLAYING</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5">
        {/* Category + software row */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-[#e0147f]">
            {project.categoryLabel || "Video Project"}
            {project.year ? ` · ${project.year}` : ""}
          </p>
          {project.software && (
            <span className="rounded-md bg-neutral-100 px-2 py-0.5 font-mono text-[9px] font-semibold text-neutral-500">
              {project.software.split(",")[0]?.trim()}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-2 text-base font-bold leading-tight tracking-tight text-neutral-900 transition group-hover:text-[#e0147f]">
          {project.title}
        </h3>

        {/* Description */}
        {project.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-neutral-500">
            {project.description}
          </p>
        )}

        {/* Bottom CTA row */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-neutral-400">
            Click to view
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 transition duration-300 group-hover:bg-[#e0147f] group-hover:text-white">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   CATEGORY FILTER PILL
   ============================================================ */
function FilterPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] transition-all duration-300 ${
        active
          ? "bg-[#0b0b0c] text-white shadow-lg"
          : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold transition-all ${
          active ? "bg-white/20 text-white" : "bg-neutral-200 text-neutral-400"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

/* ============================================================
   MAIN THEME COMPONENT
   ============================================================ */
export default function Theme01Editorial({ data }: { data: SiteData }) {
  const { homepage, projects, categories } = data;
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(null);

  // Active categories only
  const activeCategories = useMemo(
    () => categories.filter((c) => c.isActive !== false),
    [categories],
  );

  const activeCatIds = useMemo(
    () => new Set(activeCategories.map((c) => c.id)),
    [activeCategories],
  );

  // Filter only published projects belonging to active categories
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (!p.published) return false;
      if (p.categoryId && !activeCatIds.has(p.categoryId)) return false;
      if (activeCategory === "all") return true;
      return (
        String(p.categoryId) === activeCategory ||
        p.categoryLabel?.toLowerCase() === activeCategory.toLowerCase()
      );
    });
  }, [projects, activeCatIds, activeCategory]);

  const totalPublished = projects.filter((p) => p.published).length;

  // Category project counts for filter pills
  const catCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of projects) {
      if (!p.published) continue;
      const key = String(p.categoryId ?? "uncategorized");
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [projects]);

  return (
    <div className="min-h-screen bg-[#f7f5f2] text-[#0b0b0c] antialiased">
      {/* ── Floating Primary Navigation ── */}
      <SiteNav
        name={homepage.ownerName || "MOHIT BABARIYA"}
        availability={homepage.availabilityLabel || "Available for select commissions"}
      />

      {/* ── 1. Hero: NLE video editor mockup with dual CTA ── */}
      <Hero data={data} />

      {/* ── 2. Marquee Ticker ── */}
      <Marquee
        text={typeof homepage.marqueeText === "string" ? homepage.marqueeText : undefined}
      />

      {/* ── 3. 3D Kinetic Spotlight Reel Showcase ─────────────────────────────
           Full-bleed black section with ambient magenta glow
           ────────────────────────────────────────────────────────────────── */}
      <section
        id="reels"
        className="relative overflow-hidden bg-[#070709] py-16 sm:py-24"
      >
        {/* Ambient glow blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/4 h-[600px] w-[700px] -translate-x-1/2 rounded-full bg-[#e0147f]/8 blur-[160px]" />
          <div className="absolute right-0 bottom-0 h-[300px] w-[400px] rounded-full bg-[#00f0ff]/5 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6">
          {/* Section Header */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#e0147f]" />
              <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-[#e0147f]">
                3D Kinetic Showcase
              </p>
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#e0147f]" />
            </div>
            <h2
              className="display mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl xl:text-6xl"
              style={{ letterSpacing: "-0.04em" }}
            >
              SPOTLIGHT{" "}
              <span className="text-white/25">SHOWREELS</span>
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/50">
              Swipe, drag, or click any card to explore films and reels. Click
              the center card to watch in full cinema mode.
            </p>
          </div>

          {/* Carousel */}
          <div className="mt-10">
            <SpotlightReelCarousel
              carouselItems={data.carouselItems}
              projects={filteredProjects}
              onSelectProject={(p) => setSelectedProject(p)}
            />
          </div>
        </div>
      </section>

      {/* ── 4. Before / After Color Grading Slider ── */}
      <div id="grading">
        <BeforeAfterSlider />
      </div>

      {/* ── 5. Selected Works Portfolio Grid ────────────────────────────────
           Clean light-background grid with live hover video preview
           ────────────────────────────────────────────────────────────────── */}
      <section id="portfolio" className="bg-[#f7f5f2] px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          {/* Header row */}
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow="Curated Films & Reels"
              title="SELECTED WORKS"
              description="A curated archive of commercial edits, social reels, motion graphics, and signature color grades."
            />

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2 pb-1">
              <FilterPill
                label="All Works"
                count={totalPublished}
                active={activeCategory === "all"}
                onClick={() => setActiveCategory("all")}
              />
              {activeCategories.map((cat) => (
                <FilterPill
                  key={cat.id}
                  label={cat.name}
                  count={catCounts[String(cat.id)] ?? 0}
                  active={activeCategory === String(cat.id)}
                  onClick={() => setActiveCategory(String(cat.id))}
                />
              ))}
            </div>
          </div>

          {/* Project Cards Grid */}
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project, index) => (
              <Reveal key={project.id} delay={index * 40}>
                <ProjectCard
                  project={project}
                  onSelect={() => setSelectedProject(project)}
                />
              </Reveal>
            ))}
          </div>

          {/* Empty State */}
          {filteredProjects.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
              <span className="text-5xl opacity-25">🎬</span>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-neutral-400">
                No projects in this category yet
              </p>
              <p className="text-sm text-neutral-400">
                Add projects via the{" "}
                <a
                  href="/admin"
                  className="font-bold text-[#e0147f] underline underline-offset-2"
                >
                  Admin Panel
                </a>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── 6. 5-Step Post-Production Editing Pipeline ── */}
      <div id="pipeline">
        <ProcessTimeline />
      </div>

      {/* ── 7. Tools & Software Stack ── */}
      <div id="tools">
        <SoftwareTools data={data} />
      </div>

      {/* ── 8. About / Manifesto ── */}
      <div id="about">
        <About data={data} />
      </div>

      {/* ── 9. Services & Deliverables Packages ── */}
      <div id="services">
        <Services data={data} />
      </div>

      {/* ── 10. Contact & Project Enquiry ── */}
      <div id="contact">
        <ContactSection data={data} />
      </div>

      {/* ── 11. Footer ── */}
      <Footer data={data} />

      {/* ── 12. Cinema Modal Video Player ── */}
      {selectedProject && (
        <ProjectViewer
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}

      {/* ── 13. Live AI Studio Chat Widget ── */}
      <ChatWidget />
    </div>
  );
}
