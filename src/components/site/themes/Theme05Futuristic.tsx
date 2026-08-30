"use client";

import { useState } from "react";
import type { SiteData, PublicProject } from "@/lib/data";
import WorkCarousel from "@/components/site/WorkCarousel";
import ContactSection from "@/components/site/ContactSection";
import SoftwareTools from "@/components/site/SoftwareTools";
import ChatWidget from "@/components/site/ChatWidget";

export default function Theme05Futuristic({ data }: { data: SiteData }) {
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
    <div className="min-h-screen bg-[#030712] text-[#f0fdf4] font-sans antialiased selection:bg-[#06b6d4] selection:text-black">
      {/* Cybernetic HUD Navigation */}
      <header className="sticky top-0 z-40 border-b border-[#06b6d4]/20 bg-[#030712]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#" className="font-mono text-sm font-black uppercase tracking-widest text-[#06b6d4] flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#06b6d4] shadow-[0_0_12px_#06b6d4] animate-ping" />
            [ SYSTEM.MB // 05 ]
          </a>

          <nav className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-widest text-white/60">
            <a href="#showcase" className="hover:text-[#06b6d4] transition">
              // 01. SHOWCASE
            </a>
            <a href="#matrix" className="hover:text-[#06b6d4] transition">
              // 02. MATRIX
            </a>
            <a href="#specs" className="hover:text-[#06b6d4] transition">
              // 03. SPECS
            </a>
            <a href="#contact" className="hover:text-[#06b6d4] transition">
              // 04. TERMINAL
            </a>
          </nav>

          <a
            href="#contact"
            className="rounded-lg border border-[#06b6d4]/40 bg-[#06b6d4]/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#06b6d4] shadow-[0_0_15px_rgba(6,182,212,0.2)] transition hover:bg-[#06b6d4] hover:text-black"
          >
            INITIALIZE COMM →
          </a>
        </div>
      </header>

      {/* Futuristic HUD Hero */}
      <section className="relative overflow-hidden border-b border-[#06b6d4]/15 py-24 md:py-36">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#06b6d415_0%,transparent_60%)]" />

        <div className="mx-auto max-w-7xl px-6 space-y-8">
          <div className="inline-flex items-center gap-2 rounded-lg border border-[#06b6d4]/30 bg-[#06b6d4]/5 px-3 py-1 font-mono text-[11px] text-[#06b6d4]">
            <span>NODE STATUS: ACTIVE</span> · <span>AI-ASSISTED VIDEO ENGINE</span>
          </div>

          <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-white leading-none">
            {homepage.heroName || "MOHIT BABARIYA"}
          </h1>

          <p className="max-w-2xl text-base md:text-lg leading-relaxed text-[#94a3b8]">
            {homepage.heroDescription ||
              "Next-generation video editing, synthetic media workflows, kinetic motion graphics, and high-frequency visual pacing."}
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <a
              href="#showcase"
              className="rounded-lg bg-[#06b6d4] px-8 py-3 font-mono text-xs font-bold uppercase tracking-widest text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:bg-white transition"
            >
              LAUNCH REEL SYSTEM ▶
            </a>
            <a
              href="#contact"
              className="rounded-lg border border-white/20 bg-white/5 px-8 py-3 font-mono text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition"
            >
              ACCESS TERMINAL
            </a>
          </div>
        </div>
      </section>

      {/* Video Carousel */}
      <div id="showcase">
        <WorkCarousel data={data} />
      </div>

      {/* Cybernetic Matrix Archive */}
      <section id="matrix" className="border-t border-[#06b6d4]/15 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-[#06b6d4]/15">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-[#06b6d4]">
                ARCHIVE MATRIX //
              </span>
              <h2 className="mt-2 font-heading text-3xl md:text-5xl font-black uppercase text-white">
                PROJECT ASSETS
              </h2>
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={`rounded-lg px-4 py-1.5 font-mono text-xs uppercase tracking-wider transition ${
                  activeCategory === "all"
                    ? "bg-[#06b6d4] text-black font-bold"
                    : "border border-white/10 bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                ALL [{projects.length}]
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCategory(String(c.id))}
                  className={`rounded-lg px-4 py-1.5 font-mono text-xs uppercase tracking-wider transition ${
                    activeCategory === String(c.id)
                      ? "bg-[#06b6d4] text-black font-bold"
                      : "border border-white/10 bg-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Holographic Cards Grid */}
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="group cursor-pointer rounded-2xl border border-[#06b6d4]/20 bg-[#0b1322] p-4 transition duration-300 hover:border-[#06b6d4] hover:shadow-[0_0_25px_rgba(6,182,212,0.25)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-black">
                  {project.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={project.thumbnailUrl}
                      alt={project.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-mono text-xs text-[#06b6d4]/40">
                      [ STREAM READY ]
                    </div>
                  )}

                  <div className="absolute top-2 right-2 rounded bg-black/80 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#06b6d4]">
                    {project.categoryLabel || "Video"}
                  </div>
                </div>

                <div className="mt-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-sm font-bold uppercase text-white group-hover:text-[#06b6d4] transition">
                      {project.title}
                    </h3>
                    <p className="mt-0.5 font-mono text-[10px] text-[#94a3b8] line-clamp-1">
                      {project.description || "Video & Motion Spec"}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-[#06b6d4]/50">
                    ID:{String(project.id).padStart(3, "0")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Capabilities Suite */}
      <section id="specs" className="border-t border-[#06b6d4]/15 py-24 bg-[#050a16]">
        <div className="mx-auto max-w-7xl px-6">
          <span className="font-mono text-xs uppercase tracking-widest text-[#06b6d4]">
            SYSTEM CAPABILITIES //
          </span>
          <h2 className="mt-2 font-heading text-3xl md:text-4xl font-black uppercase text-white">
            PRODUCTION PROTOCOLS
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="rounded-2xl border border-[#06b6d4]/20 bg-[#091122] p-6 space-y-3"
              >
                <div className="font-mono text-xs text-[#06b6d4]">PROTOCOL: ACTIVE</div>
                <h3 className="font-heading text-lg font-bold uppercase text-white">
                  {service.title}
                </h3>
                <p className="text-xs leading-relaxed text-[#94a3b8]">{service.description}</p>
                <div className="pt-3 border-t border-white/10 font-mono text-[10px] text-[#06b6d4]">
                  {service.deliverables || "High-Bandwidth Master Delivery"}
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
      <footer className="border-t border-[#06b6d4]/15 py-8 bg-[#02050c] text-center font-mono text-xs text-[#06b6d4]/40">
        <p>© {new Date().getFullYear()} MOHIT BABARIYA // CYBERNETIC EDITION</p>
      </footer>

      {/* Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-4xl rounded-2xl border border-[#06b6d4]/40 bg-[#091122] p-6 shadow-[0_0_40px_rgba(6,182,212,0.3)]">
            <button
              type="button"
              onClick={() => setSelectedProject(null)}
              className="absolute right-4 top-4 font-mono text-xs text-[#06b6d4] hover:text-white"
            >
              [ TERMINATE ✕ ]
            </button>
            <h3 className="font-mono text-lg font-bold uppercase text-white">
              {selectedProject.title}
            </h3>
            <div className="mt-4 aspect-video w-full rounded-xl overflow-hidden bg-black">
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
