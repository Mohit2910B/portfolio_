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
      className="group glass-soft cursor-pointer overflow-hidden rounded-[28px] border border-ink/8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-ink/20"
    >
      <div className={`relative overflow-hidden bg-ink/5 ${isVertical ? "aspect-[9/16] max-h-[480px] mx-auto" : "aspect-video"}`}>
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

        {/* Cinematic Gradient Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-60 transition duration-300 group-hover:opacity-40" />

        {/* Center Hover Play Badge with Soundwave Ring */}
        <div className="absolute inset-0 grid place-items-center bg-black/25 opacity-0 backdrop-blur-[2px] transition duration-300 group-hover:opacity-100">
          <div className="relative grid h-14 w-14 place-items-center rounded-full bg-white text-ink shadow-2xl transition duration-300 group-hover:scale-110">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span className="absolute -inset-1.5 animate-ping rounded-full border border-white/50 opacity-40" />
          </div>
        </div>

        {/* Live Motion Sound Wave Pill on Hover */}
        {isHovered && project.videoUrl && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1 text-[9px] font-bold text-white shadow-xl backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>PLAYING PREVIEW</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="rounded-lg bg-black/65 px-2.5 py-1 text-[0.55rem] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-md shadow-sm">
            {project.aspectRatio || "16:9"}
          </span>
          {project.durationSeconds ? (
            <span className="rounded-lg bg-black/65 px-2.5 py-1 font-mono text-[0.55rem] font-semibold text-white/90 backdrop-blur-md shadow-sm">
              ⏱️ {project.durationSeconds}s
            </span>
          ) : null}
          {project.featured && (
            <span className="rounded-lg bg-[var(--accent,#e0147f)] px-2.5 py-1 text-[0.55rem] font-bold uppercase tracking-[0.12em] text-white shadow-md">
              ★ Spotlight
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-[var(--accent,#e0147f)]">
            {project.categoryLabel || "Video Project"}
            {project.year ? ` · ${project.year}` : ""}
          </p>
          {project.software && (
            <span className="text-[9px] font-mono font-semibold text-ink/60 bg-black/5 px-2 py-0.5 rounded-md">
              {project.software.split(",")[0]}
            </span>
          )}
        </div>
        <h3 className="display mt-2 text-lg text-ink font-bold group-hover:text-[var(--accent,#e0147f)] transition">
          {project.title}
        </h3>
        {project.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink/65">
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

      {/* 1. Hero Section with Interactive NLE Video Editor Mockup */}
      <Hero data={data} />

      {/* 2. Marquee Ticker Banner */}
      <Marquee text={typeof homepage.marqueeText === "string" ? homepage.marqueeText : undefined} />

      {/* 3. 🌟 3D KINETIC SPOTLIGHT REEL CAROUSEL */}
      <section className="overflow-hidden px-4 py-12 sm:px-6 lg:py-20 bg-black text-white">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-col gap-4 text-center items-center">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--accent,#e0147f)] animate-pulse" />
              <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-[var(--accent,#e0147f)]">
                3D Kinetic Showcase
              </p>
            </div>
            <h2 className="display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              SPOTLIGHT <span className="text-white/40">SHOWREELS</span>
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-white/60">
              Drag, swipe, or click any card to rotate through high-impact vertical reels and widescreen commercial films.
            </p>
          </div>

          <div className="mt-8">
            <Reveal>
              <SpotlightReelCarousel
                carouselItems={data.carouselItems}
                projects={filteredProjects}
                onSelectProject={(p) => setSelectedProject(p)}
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* 4. ✨ INTERACTIVE BEFORE / AFTER COLOR GRADING SLIDER */}
      <div id="grading">
        <BeforeAfterSlider />
      </div>

      {/* 5. ----------------- SELECTED WORKS PORTFOLIO GRID ----------------- */}
      <section id="portfolio" className="px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              eyebrow="Curated Films & Reels"
              title="SELECTED WORKS"
              description="A master archive of commercial edits, social reels, motion graphics, and color grades."
            />

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={`rounded-full px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.16em] transition ${
                  activeCategory === "all"
                    ? "bg-ink text-white shadow-md scale-105"
                    : "glass text-ink/70 hover:text-ink hover:bg-white"
                }`}
              >
                All Works ({projects.filter((p) => p.published).length})
              </button>
              {activeCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(String(cat.id))}
                  className={`rounded-full px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.16em] transition ${
                    activeCategory === String(cat.id)
                      ? "bg-ink text-white shadow-md scale-105"
                      : "glass text-ink/70 hover:text-ink hover:bg-white"
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

      {/* 6. 🛠️ 5-STEP POST-PRODUCTION EDITING PIPELINE */}
      <div id="pipeline">
        <ProcessTimeline />
      </div>

      {/* 7. Tools & Software Stack */}
      <div id="tools">
        <SoftwareTools data={data} />
      </div>

      {/* 8. About / Manifesto Section */}
      <div id="about">
        <About data={data} />
      </div>

      {/* 9. Services & Deliverables Packages */}
      <div id="services">
        <Services data={data} />
      </div>

      {/* 10. Contact & Project Enquiry Section */}
      <div id="contact">
        <ContactSection data={data} />
      </div>

      {/* 11. Footer */}
      <Footer data={data} />

      {/* 12. Interactive Project Video Player Modal */}
      {selectedProject && (
        <ProjectViewer
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}

      {/* 13. Live AI Studio Chat Widget */}
      <ChatWidget />
    </div>
  );
}
