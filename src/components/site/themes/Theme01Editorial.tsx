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

  return (
    <article
      onClick={onSelect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group glass-soft cursor-pointer overflow-hidden rounded-[26px] border border-ink/8 transition duration-500 hover:-translate-y-1.5 hover:shadow-2xl"
    >
      <div className="relative aspect-video overflow-hidden bg-ink/5">
        {project.videoUrl ? (
          <video
            ref={videoRef}
            src={project.videoUrl}
            poster={project.thumbnailUrl || undefined}
            muted
            loop
            playsInline
            preload="metadata"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : project.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.thumbnailUrl}
            alt={project.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-[0.65rem] uppercase tracking-[0.2em] text-ink/35">
            🎬 Video Project
          </div>
        )}

        {/* Play Badge */}
        <div className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 backdrop-blur-[2px] transition duration-300 group-hover:opacity-100">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-white text-ink shadow-2xl transition duration-300 group-hover:scale-110">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Live Motion Sound Wave Pill on Hover */}
        {isHovered && project.videoUrl && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/75 px-2.5 py-1 text-[9px] font-bold text-white shadow-lg backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE PREVIEW</span>
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="rounded-md bg-black/60 px-2 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-md">
            {project.aspectRatio || "16:9"}
          </span>
          {project.durationSeconds ? (
            <span className="rounded-md bg-black/60 px-2 py-1 font-mono text-[0.55rem] font-semibold text-white/90 backdrop-blur-md">
              ⏱️ {project.durationSeconds}s
            </span>
          ) : null}
          {project.featured && (
            <span className="rounded-md bg-[var(--accent,#e0147f)] px-2 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.12em] text-white shadow-sm">
              ★ Spotlight
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-ink/40">
            {project.categoryLabel || "Video Project"}
            {project.year ? ` · ${project.year}` : ""}
          </p>
          {project.software && (
            <span className="text-[9px] font-mono text-ink/50 bg-black/5 px-2 py-0.5 rounded-md">
              {project.software.split(",")[0]}
            </span>
          )}
        </div>
        <h3 className="display mt-2 text-lg text-ink group-hover:text-[var(--accent,#e0147f)] transition">
          {project.title}
        </h3>
        {project.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink/60">
            {project.description}
          </p>
        )}
      </div>
    </article>
  );
}

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

  return (
    <div className="min-h-screen bg-[var(--paper,#f7f5f2)] text-[var(--ink,#0b0b0c)] font-sans antialiased selection:bg-black selection:text-white">
      {/* Primary Floating Navigation Bar */}
      <SiteNav
        name={homepage.ownerName || "MOHIT BABARIYA"}
        availability={homepage.availabilityLabel || "Available for select commissions"}
      />

      {/* Hero Section with Interactive NLE Video Editor Mockup */}
      <Hero data={data} />

      {/* Marquee Ticker Banner */}
      <Marquee text={typeof homepage.marqueeText === "string" ? homepage.marqueeText : undefined} />

      {/* About / Manifesto Section */}
      <About data={data} />

      {/* Tools & Software Stack */}
      <SoftwareTools data={data} />

      {/* Services & Capabilities Section */}
      <Services data={data} />

      {/* ----------------- UNIFIED WORKS & PORTFOLIO SHOWCASE ----------------- */}
      <section id="portfolio" className="px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              eyebrow="Portfolio & Showcase"
              title="SELECTED WORKS"
              description="A curated collection of viral reels, commercial brand films, motion graphics, and color grades."
            />

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={`rounded-full px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] transition ${
                  activeCategory === "all"
                    ? "bg-ink text-white shadow-sm"
                    : "glass text-ink/70 hover:text-ink"
                }`}
              >
                All Works ({projects.filter((p) => p.published).length})
              </button>
              {activeCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(String(cat.id))}
                  className={`rounded-full px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] transition ${
                    activeCategory === String(cat.id)
                      ? "bg-ink text-white shadow-sm"
                      : "glass text-ink/70 hover:text-ink"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Clean Responsive Project Grid with Live Hover Previews */}
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project, index) => (
              <Reveal key={project.id} delay={index * 35}>
                <ProjectCard
                  project={project}
                  onSelect={() => setSelectedProject(project)}
                />
              </Reveal>
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <div className="py-20 text-center text-sm text-ink/50">
              No published projects in this category yet.
            </div>
          )}
        </div>
      </section>

      {/* Contact & Project Enquiry Section */}
      <div id="contact">
        <ContactSection data={data} />
      </div>

      {/* Footer */}
      <Footer data={data} />

      {/* Interactive Project Video Player Modal */}
      {selectedProject && (
        <ProjectViewer
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}

      {/* Live AI Studio Chat Widget */}
      <ChatWidget />
    </div>
  );
}
