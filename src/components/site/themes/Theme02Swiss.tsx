"use client";

import { useMemo, useState } from "react";
import type { SiteData, PublicProject } from "@/lib/data";
import WorkCarousel from "@/components/site/WorkCarousel";
import ContactSection from "@/components/site/ContactSection";
import SoftwareTools from "@/components/site/SoftwareTools";
import ChatWidget from "@/components/site/ChatWidget";
import ProjectViewer from "@/components/site/ProjectViewer";

export default function Theme02Swiss({ data }: { data: SiteData }) {
  const { homepage, services, projects = [], carouselItems = [], categories = [] } = data;
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
    <div className="min-h-screen bg-[#070707] text-[#e5e5e5] font-sans antialiased selection:bg-[#2563eb] selection:text-white">
      <div className="border-b border-white/[0.08] bg-[#070707] px-6 py-2 font-mono text-[10px] text-white/40 uppercase tracking-widest flex items-center justify-between">
        <span>[SYS.VER: 2026.08]</span>
        <span>SWISS EDITORIAL SYSTEM / MOHIT BABARIYA</span>
        <span>LAT: 20.5937° N · LNG: 78.9629° E</span>
      </div>

      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#070707]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#" className="font-mono text-sm font-bold uppercase tracking-widest text-white">
            MOHIT BABARIYA <span className="text-[#3b82f6]">/ STUDIO</span>
          </a>

          <nav className="hidden md:flex items-center gap-6 font-mono text-[11px] uppercase tracking-wider text-white/60">
            {hasCarousel && <a href="#work" className="hover:text-white transition">01. Showcase</a>}
            {publishedProjects.length > 0 && <a href="#portfolio" className="hover:text-white transition">02. Archive</a>}
            <a href="#about" className="hover:text-white transition">03. Profile</a>
            <a href="#services" className="hover:text-white transition">04. Capabilities</a>
            <a href="#contact" className="hover:text-white transition">05. Contact</a>
          </nav>

          <a
            href="#contact"
            className="rounded border border-white/20 bg-white/5 px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-white transition hover:border-[#3b82f6] hover:bg-[#3b82f6] hover:text-white"
          >
            [ Inquire ]
          </a>
        </div>
      </header>

      <section className="border-b border-white/[0.08] py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 border border-white/[0.08] p-8 md:p-12 bg-white/[0.01]">
            <div className="md:col-span-8 space-y-6">
              <div className="inline-flex items-center gap-2 font-mono text-[11px] text-[#3b82f6] uppercase tracking-widest">
                <span className="h-2 w-2 rounded-none bg-[#3b82f6]" />
                Independent Video Editor &amp; Motion Specialist
              </div>
              <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl font-bold uppercase tracking-tight text-white leading-none">
                {homepage.ownerName || "MOHIT BABARIYA"}
              </h1>
              <p className="max-w-2xl text-sm md:text-base leading-relaxed text-white/70">
                {homepage.heroDescription ||
                  "Precision video editing, motion design systems, and visual pacing for contemporary brands and editorial films."}
              </p>
            </div>

            <div className="md:col-span-4 flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/[0.08] pt-6 md:pt-0 md:pl-8 space-y-6">
              <div className="space-y-3 font-mono text-xs text-white/60">
                <div className="flex justify-between border-b border-white/[0.06] pb-2">
                  <span>DISCIPLINE</span>
                  <span className="text-white">Video / Motion</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.06] pb-2">
                  <span>RECORD COUNT</span>
                  <span className="text-white">{publishedProjects.length} Projects</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.06] pb-2">
                  <span>STATUS</span>
                  <span className="text-emerald-400">Available</span>
                </div>
              </div>

              <a
                href="#contact"
                className="block text-center rounded border border-white/20 bg-white/10 py-3 font-mono text-xs uppercase tracking-widest text-white hover:bg-white hover:text-black transition"
              >
                Start Project ↓
              </a>
            </div>
          </div>
        </div>
      </section>

      {hasCarousel && (
        <div id="work">
          <WorkCarousel data={data} />
        </div>
      )}

      {publishedProjects.length > 0 && (
        <section id="portfolio" className="border-t border-white/[0.08] py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-[#3b82f6]">
                  ARCHIVE / DATABASE
                </span>
                <h2 className="font-heading text-2xl md:text-3xl font-bold uppercase text-white">
                  Project Index ({publishedProjects.length})
                </h2>
              </div>

              {categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveCategory("all")}
                    className={`rounded px-3 py-1 font-mono text-[11px] uppercase transition ${
                      activeCategory === "all" ? "bg-[#3b82f6] text-white" : "border border-white/10 text-white/60"
                    }`}
                  >
                    All [{publishedProjects.length}]
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveCategory(String(c.id))}
                      className={`rounded px-3 py-1 font-mono text-[11px] uppercase transition ${
                        activeCategory === String(c.id) ? "bg-[#3b82f6] text-white" : "border border-white/10 text-white/60"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className="group cursor-pointer border border-white/[0.08] bg-[#0c0c0c] p-3 hover:border-[#3b82f6]/50 transition"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-black/40">
                    {project.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={project.thumbnailUrl}
                        alt={project.title}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-mono text-xs text-white/30">
                        [PREVIEW]
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-start justify-between">
                    <div>
                      <h3 className="font-heading text-sm font-bold uppercase text-white group-hover:text-[#3b82f6] transition">
                        {project.title}
                      </h3>
                      <p className="mt-0.5 font-mono text-[10px] text-white/50">
                        {project.categoryLabel || "Video Edit"}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] text-white/30">
                      #{String(project.id).padStart(3, "0")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="about" className="border-t border-white/[0.08] py-24 bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5 space-y-6">
              <span className="font-mono text-xs uppercase tracking-widest text-[#3b82f6]">
                SECTION 03 / PROFILE
              </span>
              <h2 className="font-heading text-3xl font-bold uppercase tracking-tight text-white">
                Structure &amp; Workflow
              </h2>
              <p className="text-sm leading-relaxed text-white/70">
                {homepage.aboutIntro ||
                  "I work as an independent video editor, collaborating directly with brands, creators and studios on edits that need to ship fast without losing craft."}
              </p>
            </div>

            <div className="lg:col-span-7 space-y-8" id="services">
              <span className="font-mono text-xs uppercase tracking-widest text-[#3b82f6]">
                SECTION 04 / CAPABILITIES &amp; DELIVERABLES
              </span>
              <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
                {services.map((service, idx) => (
                  <div key={service.id} className="py-4 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[11px] text-white/40 mr-3">
                        [{String(idx + 1).padStart(2, "0")}]
                      </span>
                      <span className="font-heading text-base font-bold uppercase text-white">
                        {service.title}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-[#3b82f6]">
                      {service.deliverables || "Turnkey Delivery"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div id="tools">
        <SoftwareTools data={data} />
      </div>

      <div id="contact">
        <ContactSection data={data} />
      </div>

      <footer className="border-t border-white/[0.08] py-8 bg-[#070707] font-mono text-xs text-white/40">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} MOHIT BABARIYA. SWISS SYSTEM.</div>
          <div className="text-[10px] text-white/20">ALL ASSETS REGISTERED</div>
        </div>
      </footer>

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
