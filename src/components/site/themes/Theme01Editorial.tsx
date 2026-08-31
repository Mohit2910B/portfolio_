"use client";

import { useMemo, useState } from "react";
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
  const isVertical = project.aspectRatio === "9:16" || project.aspectRatio === "4:5";

  return (
    <article
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onSelect(); }}
      aria-label={`Open ${project.title}`}
      className="group relative cursor-pointer overflow-hidden rounded-[24px] bg-white shadow-[0_4px_30px_-8px_rgba(11,11,12,0.12)] border border-[rgba(11,11,12,0.07)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_-15px_rgba(11,11,12,0.22)]"
    >
      <div className={`relative overflow-hidden bg-neutral-100 ${isVertical ? "aspect-[9/16] max-h-[400px] mx-auto" : "aspect-video"}`}>
        {project.videoUrl ? (
          <video
            src={project.videoUrl}
            poster={project.thumbnailUrl || undefined}
            muted
            loop
            playsInline
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
          />
        ) : project.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.thumbnailUrl}
            alt={project.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full min-h-[200px] place-items-center bg-neutral-100 text-3xl opacity-30">
            🎬
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-50 group-hover:opacity-70 transition duration-300" />
        <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition duration-300">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-black shadow-2xl">
            ▶
          </div>
        </div>

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="rounded-md bg-black/70 px-2.5 py-1 font-mono text-[0.55rem] font-bold uppercase text-white backdrop-blur-sm">
            {project.aspectRatio || "16:9"}
          </span>
          {project.durationSeconds ? (
            <span className="rounded-md bg-black/70 px-2.5 py-1 font-mono text-[0.55rem] font-semibold text-white/90 backdrop-blur-sm">
              ⏱ {project.durationSeconds}s
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-5">
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-[#e0147f]">
          {project.categoryLabel || "Video Project"}
        </p>
        <h3 className="mt-2 text-base font-bold leading-tight text-neutral-900 group-hover:text-[#e0147f] transition">
          {project.title}
        </h3>
        {project.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-neutral-500">
            {project.description}
          </p>
        )}
      </div>
    </article>
  );
}

export default function Theme01Editorial({ data }: { data: SiteData }) {
  const { homepage, projects = [], carouselItems = [], categories = [] } = data;
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(null);

  const publishedProjects = useMemo(
    () => projects.filter((p) => p.published !== false),
    [projects],
  );

  const filteredProjects = useMemo(() => {
    if (activeCategory === "all") return publishedProjects;
    return publishedProjects.filter(
      (p) => String(p.categoryId) === activeCategory || p.categoryLabel?.toLowerCase() === activeCategory.toLowerCase(),
    );
  }, [publishedProjects, activeCategory]);

  const hasCarousel = carouselItems.length > 0 || publishedProjects.length > 0;

  return (
    <div className="min-h-screen bg-[#f7f5f2] text-[#0b0b0c] antialiased">
      <SiteNav
        name={homepage.ownerName || "MOHIT BABARIYA"}
        availability={homepage.availabilityLabel || "Available for select commissions"}
      />

      <Hero data={data} />

      <Marquee
        text={typeof homepage.marqueeText === "string" ? homepage.marqueeText : undefined}
      />

      {/* ── Spotlight Reel Carousel (Renders ONLY if DB has items) ── */}
      {hasCarousel && (
        <section id="reels" className="relative overflow-hidden bg-[#070709] py-16 sm:py-24">
          <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-[#e0147f]">
                3D Kinetic Showcase
              </p>
              <h2 className="display mt-2 text-3xl font-extrabold text-white sm:text-5xl">
                SPOTLIGHT <span className="text-white/25">SHOWREELS</span>
              </h2>
            </div>
            <div className="mt-10">
              <SpotlightReelCarousel
                carouselItems={carouselItems}
                projects={publishedProjects}
                onSelectProject={(p) => setSelectedProject(p)}
              />
            </div>
          </div>
        </section>
      )}

      <div id="grading">
        <BeforeAfterSlider />
      </div>

      {/* ── Portfolio Grid (Renders DB records or 0 items empty state) ── */}
      <section id="portfolio" className="bg-[#f7f5f2] px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow="Curated Films & Reels"
              title="SELECTED WORKS"
              description="A database-driven archive of commercial edits, social reels, motion graphics, and signature grades."
            />

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-1">
                <button
                  type="button"
                  onClick={() => setActiveCategory("all")}
                  className={`rounded-full px-4 py-2 text-[0.65rem] font-bold uppercase tracking-wider ${
                    activeCategory === "all" ? "bg-black text-white" : "bg-neutral-200 text-neutral-600"
                  }`}
                >
                  All ({publishedProjects.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(String(cat.id))}
                    className={`rounded-full px-4 py-2 text-[0.65rem] font-bold uppercase tracking-wider ${
                      activeCategory === String(cat.id) ? "bg-black text-white" : "bg-neutral-200 text-neutral-600"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filteredProjects.length > 0 ? (
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
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <span className="text-4xl opacity-25">🎬</span>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
                0 Portfolio Projects in Database
              </p>
              <p className="text-xs text-neutral-400">
                Add projects via the <a href="/admin" className="text-[#e0147f] underline">Admin Panel</a> to feature them here.
              </p>
            </div>
          )}
        </div>
      </section>

      <div id="pipeline">
        <ProcessTimeline />
      </div>

      <div id="tools">
        <SoftwareTools data={data} />
      </div>

      <div id="about">
        <About data={data} />
      </div>

      <div id="services">
        <Services data={data} />
      </div>

      <div id="contact">
        <ContactSection data={data} />
      </div>

      <Footer data={data} />

      {selectedProject && (
        <ProjectViewer
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}

      <ChatWidget />
    </div>
  );
}
