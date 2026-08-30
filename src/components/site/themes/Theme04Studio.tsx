"use client";

import { useState } from "react";
import type { SiteData, PublicProject } from "@/lib/data";
import WorkCarousel from "@/components/site/WorkCarousel";
import ContactSection from "@/components/site/ContactSection";
import SoftwareTools from "@/components/site/SoftwareTools";
import ChatWidget from "@/components/site/ChatWidget";

export default function Theme04Studio({ data }: { data: SiteData }) {
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
    <div className="min-h-screen bg-[#0e0e12] text-[#f1f5f9] font-sans antialiased selection:bg-[#a855f7] selection:text-white">
      {/* Studio Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0e0e12]/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="#" className="font-heading text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
            <span className="rounded-lg bg-[#8b5cf6] px-2 py-0.5 text-xs text-black font-black">MB</span>
            STUDIO <span className="text-[#a855f7]">/ 04</span>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-white/70">
            <a href="#showcase" className="hover:text-[#a855f7] transition">
              Showcase
            </a>
            <a href="#archive" className="hover:text-[#a855f7] transition">
              Archive
            </a>
            <a href="#studio" className="hover:text-[#a855f7] transition">
              Studio
            </a>
            <a href="#services" className="hover:text-[#a855f7] transition">
              Capabilities
            </a>
            <a href="#contact" className="hover:text-[#a855f7] transition">
              Contact
            </a>
          </nav>

          <a
            href="#contact"
            className="rounded-xl border border-[#a855f7]/40 bg-[#8b5cf6]/10 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#8b5cf6] hover:text-black"
          >
            Start Project →
          </a>
        </div>
      </header>

      {/* Studio Hero with Bold Numerals & Badges */}
      <section className="relative border-b border-white/10 py-24 md:py-36">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-8 space-y-6">
              <div className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-mono uppercase tracking-wider text-[#a855f7]">
                <span className="h-2 w-2 rounded-full bg-[#a855f7]" />
                [ CREATIVE AGENCY ARCHETYPE ]
              </div>

              <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white leading-none">
                ART DIRECTION &amp; MOTION CUTS.
              </h1>

              <p className="max-w-2xl text-base md:text-lg leading-relaxed text-white/70">
                {homepage.heroDescription ||
                  "Collaborating with bold creators and forward-thinking brands on modular video campaigns, motion systems, and high-impact social edits."}
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <a
                  href="#showcase"
                  className="rounded-xl bg-[#8b5cf6] px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-black shadow-lg hover:bg-white transition"
                >
                  Explore Reel Showcase
                </a>
                <a
                  href="#contact"
                  className="rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition"
                >
                  Contact Studio
                </a>
              </div>
            </div>

            <div className="lg:col-span-4 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-[#16161e] p-6 space-y-2">
                <span className="font-mono text-xs text-[#a855f7]">#01 EXP</span>
                <div className="text-3xl font-black text-white">2+ YRS</div>
                <p className="text-[11px] text-white/50">Production Track Record</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#16161e] p-6 space-y-2">
                <span className="font-mono text-xs text-[#a855f7]">#02 ASSETS</span>
                <div className="text-3xl font-black text-white">100+</div>
                <p className="text-[11px] text-white/50">Finished Video Cuts</p>
              </div>
              <div className="col-span-2 rounded-2xl border border-white/10 bg-[#16161e] p-6 space-y-2">
                <span className="font-mono text-xs text-[#a855f7]">#03 FOCUS</span>
                <div className="text-xl font-bold text-white uppercase">REELS · COMMERCIALS · 3D</div>
                <p className="text-[11px] text-white/50">Multi-Ratio Master Delivery</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Carousel */}
      <div id="showcase">
        <WorkCarousel data={data} />
      </div>

      {/* Studio Layered Archive */}
      <section id="archive" className="border-t border-white/10 py-24 md:py-36">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-white/10">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-[#a855f7]">
                PROJECT REPOSITORIES
              </span>
              <h2 className="mt-2 font-heading text-3xl md:text-5xl font-black uppercase text-white">
                Studio Projects
              </h2>
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                  activeCategory === "all"
                    ? "bg-[#8b5cf6] text-black"
                    : "border border-white/10 bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                All Works ({projects.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCategory(String(c.id))}
                  className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                    activeCategory === String(c.id)
                      ? "bg-[#8b5cf6] text-black"
                      : "border border-white/10 bg-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Layered Studio Grid with Oversized Numbers */}
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project, idx) => (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-[#16161e] p-4 transition-all duration-300 hover:border-[#a855f7]/60 hover:shadow-xl"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-black">
                  {project.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={project.thumbnailUrl}
                      alt={project.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white/30 text-2xl">
                      🎬
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 rounded-lg bg-black/80 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                    {project.categoryLabel || "Video"}
                  </div>
                </div>

                <div className="mt-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-base font-bold uppercase text-white group-hover:text-[#a855f7] transition">
                      {project.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-white/50 line-clamp-1">
                      {project.description || "Digital Studio Production"}
                    </p>
                  </div>
                  <span className="font-mono text-lg font-black text-white/20 group-hover:text-[#a855f7]/60 transition">
                    #{String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services & Capabilities */}
      <section id="services" className="border-t border-white/10 py-24 bg-[#121218]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-xl space-y-4">
            <span className="font-mono text-xs uppercase tracking-widest text-[#a855f7]">
              DELIVERY SUITE
            </span>
            <h2 className="font-heading text-3xl md:text-5xl font-black uppercase text-white">
              Studio Deliverables
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, idx) => (
              <div
                key={service.id}
                className="rounded-3xl border border-white/10 bg-[#181822] p-8 space-y-4 hover:border-[#a855f7]/50 transition"
              >
                <span className="font-mono text-xs font-bold text-[#a855f7]">
                  [ 0{idx + 1} ]
                </span>
                <h3 className="font-heading text-xl font-bold uppercase text-white">
                  {service.title}
                </h3>
                <p className="text-xs leading-relaxed text-white/60">{service.description}</p>
                <div className="pt-4 border-t border-white/10 font-mono text-[11px] text-white/70">
                  {service.deliverables || "Turnkey Video & Motion Production"}
                </div>
              </div>
            ))}
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

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 bg-[#0a0a0d] text-center text-xs text-white/40">
        <p>© {new Date().getFullYear()} Mohit Babariya. Digital Studio Edition.</p>
      </footer>

      {/* Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-4xl rounded-3xl border border-white/20 bg-[#121218] p-6">
            <button
              type="button"
              onClick={() => setSelectedProject(null)}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              ✕
            </button>
            <h3 className="font-heading text-xl font-bold uppercase text-white">
              {selectedProject.title}
            </h3>
            <div className="mt-4 aspect-video w-full rounded-2xl overflow-hidden bg-black">
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
