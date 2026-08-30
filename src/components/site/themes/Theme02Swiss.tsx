"use client";

import { useState } from "react";
import type { SiteData, PublicProject } from "@/lib/data";
import WorkCarousel from "@/components/site/WorkCarousel";
import ContactSection from "@/components/site/ContactSection";
import SoftwareTools from "@/components/site/SoftwareTools";
import ChatWidget from "@/components/site/ChatWidget";

export default function Theme02Swiss({ data }: { data: SiteData }) {
  const { homepage, contact, services, softwareTools, projects, categories } = data;
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(null);

  const filteredProjects = projects.filter((p) => {
    if (activeCategory === "all") return true;
    return (
      String(p.categoryId) === activeCategory ||
      p.categoryLabel?.toLowerCase() === activeCategory.toLowerCase()
    );
  });

  return (
    <div className="min-h-screen bg-[#070707] text-[#e5e5e5] font-sans antialiased selection:bg-[#2563eb] selection:text-white">
      {/* Swiss Monospace Top Bar */}
      <div className="border-b border-white/[0.08] bg-[#070707] px-6 py-2 font-mono text-[10px] text-white/40 uppercase tracking-widest flex items-center justify-between">
        <span>[SYS.VER: 2026.08]</span>
        <span>INDEX / PORTFOLIO / MOHIT BABARIYA</span>
        <span>LAT: 20.5937° N · LNG: 78.9629° E</span>
      </div>

      {/* Swiss Clean Navigation */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#070707]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#" className="font-mono text-sm font-bold uppercase tracking-widest text-white">
            MOHIT BABARIYA <span className="text-[#3b82f6]">/ STUDIO</span>
          </a>

          <nav className="hidden md:flex items-center gap-6 font-mono text-[11px] uppercase tracking-wider text-white/60">
            <a href="#work" className="hover:text-white transition">
              01. Showcase
            </a>
            <a href="#portfolio" className="hover:text-white transition">
              02. Archive
            </a>
            <a href="#about" className="hover:text-white transition">
              03. Profile
            </a>
            <a href="#services" className="hover:text-white transition">
              04. Capabilities
            </a>
            <a href="#contact" className="hover:text-white transition">
              05. Contact
            </a>
          </nav>

          <a
            href="#contact"
            className="rounded border border-white/20 bg-white/5 px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-white transition hover:border-[#3b82f6] hover:bg-[#3b82f6] hover:text-white"
          >
            [ Inquire ]
          </a>
        </div>
      </header>

      {/* Swiss Grid Hero */}
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
                  <span>EXP. METRIC</span>
                  <span className="text-white">2+ Years</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.06] pb-2">
                  <span>STATUS</span>
                  <span className="text-emerald-400">Available</span>
                </div>
              </div>

              <a
                href="#work"
                className="block text-center rounded border border-white/20 bg-white/10 py-3 font-mono text-xs uppercase tracking-widest text-white hover:bg-white hover:text-black transition"
              >
                Inspect Works ↓
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Video Carousel */}
      <WorkCarousel data={data} />

      {/* Swiss Structured Archive */}
      <section id="portfolio" className="border-t border-white/[0.08] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-[#3b82f6]">
                SECTION 02 / ARCHIVE
              </span>
              <h2 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-tight text-white">
                Project Index
              </h2>
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={`rounded px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition ${
                  activeCategory === "all"
                    ? "bg-[#3b82f6] text-white"
                    : "border border-white/10 bg-white/[0.03] text-white/60 hover:text-white"
                }`}
              >
                All [{projects.length}]
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCategory(String(c.id))}
                  className={`rounded px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition ${
                    activeCategory === String(c.id)
                      ? "bg-[#3b82f6] text-white"
                      : "border border-white/10 bg-white/[0.03] text-white/60 hover:text-white"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* 3-Column Swiss Grid */}
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="group cursor-pointer border border-white/[0.08] bg-[#0c0c0c] p-3 transition duration-300 hover:border-[#3b82f6]/50"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-black/40">
                  {project.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={project.thumbnailUrl}
                      alt={project.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white/30 font-mono text-xs">
                      [NO PREVIEW]
                    </div>
                  )}
                  <div className="absolute top-2 left-2 rounded bg-black/80 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white">
                    {project.categoryLabel || "Video"}
                  </div>
                </div>

                <div className="mt-3 flex items-start justify-between">
                  <div className="min-w-0 pr-2">
                    <h3 className="truncate font-heading text-sm font-bold uppercase text-white group-hover:text-[#3b82f6] transition">
                      {project.title}
                    </h3>
                    <p className="mt-0.5 truncate font-mono text-[10px] text-white/50">
                      {project.description || "Video & Motion Deliverable"}
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

      {/* Swiss Profile & Capabilities Table */}
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
              <div className="rounded border border-white/[0.08] p-4 font-mono text-xs text-white/60 space-y-2">
                <div>• Timeline pacing &amp; narrative structure</div>
                <div>• DaVinci Resolve color consistency</div>
                <div>• Multi-ratio social delivery (9:16, 16:9, 1:1)</div>
              </div>
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

      {/* Software Tools */}
      <div id="tools">
        <SoftwareTools data={data} />
      </div>

      {/* Contact Section */}
      <div id="contact">
        <ContactSection data={data} />
      </div>

      {/* Swiss Footer */}
      <footer className="border-t border-white/[0.08] py-8 bg-[#070707] font-mono text-xs text-white/40">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} MOHIT BABARIYA. SWISS SYSTEM.</div>
          <div className="text-[10px] text-white/20">ALL ASSETS REGISTERED</div>
        </div>
      </footer>

      {/* Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-4xl border border-white/20 bg-[#0c0c0c] p-6">
            <button
              type="button"
              onClick={() => setSelectedProject(null)}
              className="absolute right-4 top-4 font-mono text-xs text-white/60 hover:text-white"
            >
              [ CLOSE ✕ ]
            </button>
            <h3 className="font-mono text-lg font-bold uppercase text-white">
              {selectedProject.title}
            </h3>
            <div className="mt-4 aspect-video w-full bg-black">
              {selectedProject.videoUrl ? (
                <video
                  src={selectedProject.videoUrl}
                  controls
                  autoPlay
                  className="h-full w-full object-contain"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedProject.thumbnailUrl}
                  alt={selectedProject.title}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          </div>
        </div>
      )}

      <ChatWidget />
    </div>
  );
}
