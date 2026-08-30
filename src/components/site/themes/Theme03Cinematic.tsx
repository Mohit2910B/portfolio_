"use client";

import { useState } from "react";
import type { SiteData, PublicProject } from "@/lib/data";
import WorkCarousel from "@/components/site/WorkCarousel";
import ContactSection from "@/components/site/ContactSection";
import SoftwareTools from "@/components/site/SoftwareTools";
import ChatWidget from "@/components/site/ChatWidget";

export default function Theme03Cinematic({ data }: { data: SiteData }) {
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
    <div className="min-h-screen bg-[#050508] text-[#f8fafc] font-sans antialiased selection:bg-[#f59e0b] selection:text-black">
      {/* Floating Cinematic Capsule Nav */}
      <div className="fixed top-5 left-1/2 z-50 -translate-x-1/2 w-[92%] max-w-4xl">
        <header className="flex items-center justify-between rounded-full border border-white/10 bg-[#0c0c14]/80 px-6 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <a href="#" className="font-heading text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#f59e0b] shadow-[0_0_10px_#f59e0b]" />
            {homepage.ownerName || "MOHIT"} <span className="text-[#f59e0b]">FILMS</span>
          </a>

          <nav className="hidden sm:flex items-center gap-6 text-xs font-semibold uppercase tracking-widest text-white/60">
            <a href="#showcase" className="hover:text-white transition">
              Reels
            </a>
            <a href="#projects" className="hover:text-white transition">
              Films
            </a>
            <a href="#services" className="hover:text-white transition">
              Production
            </a>
            <a href="#contact" className="hover:text-white transition">
              Inquire
            </a>
          </nav>

          <a
            href="#contact"
            className="rounded-full bg-gradient-to-r from-[#f59e0b] to-[#d97706] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-black shadow-md transition hover:scale-105"
          >
            Hire Director
          </a>
        </header>
      </div>

      {/* Cinematic Theater Hero with Ambient Glow */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-28 pb-20">
        {/* Ambient video glow behind hero */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.15)_0%,transparent_70%)]" />

        <div className="mx-auto max-w-5xl px-6 text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-4 py-1 text-xs font-mono uppercase tracking-[0.2em] text-[#f59e0b]">
            ★ Cinematic Film &amp; Commercial Video Editing
          </div>

          <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white leading-none">
            {homepage.heroName || "MOHIT BABARIYA"}
          </h1>

          <p className="mx-auto max-w-2xl text-base md:text-lg leading-relaxed text-white/70">
            {homepage.heroDescription ||
              "High-impact visual pacing, color grading, sound architecture, and motion storytelling for commercial films and luxury brands."}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#showcase"
              className="rounded-full bg-white px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-black shadow-[0_0_25px_rgba(255,255,255,0.3)] transition hover:bg-[#f59e0b] hover:text-black"
            >
              Watch Video Showcase ▶
            </a>
            <a
              href="#contact"
              className="rounded-full border border-white/20 bg-white/5 px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md transition hover:bg-white/10"
            >
              Discuss Project
            </a>
          </div>
        </div>
      </section>

      {/* Panoramic Video Showcase Carousel */}
      <div id="showcase" className="border-y border-white/10 bg-[#08080f]/80">
        <WorkCarousel data={data} />
      </div>

      {/* Video-First Motion Project Gallery */}
      <section id="projects" className="py-24 md:py-36">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-white/10">
            <div>
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-[#f59e0b]">
                Motion Library
              </span>
              <h2 className="mt-2 font-heading text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
                Featured Edits &amp; Films
              </h2>
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                  activeCategory === "all"
                    ? "bg-[#f59e0b] text-black"
                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                All Projects ({projects.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCategory(String(c.id))}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                    activeCategory === String(c.id)
                      ? "bg-[#f59e0b] text-black"
                      : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Cinematic Large Video Cards */}
          <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-[#0f0f18] transition-all duration-500 hover:border-[#f59e0b]/60 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-black">
                  {project.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={project.thumbnailUrl}
                      alt={project.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white/30 text-3xl">
                      🎬
                    </div>
                  )}

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-xs transition duration-300 group-hover:opacity-100">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f59e0b] text-black text-xl font-bold shadow-lg">
                      ▶
                    </div>
                  </div>

                  <div className="absolute top-3 left-3 rounded-full bg-black/70 px-3 py-1 font-mono text-[9px] uppercase tracking-wider text-white backdrop-blur-md">
                    {project.categoryLabel || "Commercial"}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-white group-hover:text-[#f59e0b] transition">
                    {project.title}
                  </h3>
                  <p className="mt-1 text-xs text-white/60 line-clamp-2">
                    {project.description || "Cinematic video edit and motion storytelling."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cinematic Services / Post-Production Suite */}
      <section id="services" className="border-t border-white/10 py-24 bg-[#08080f]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-[#f59e0b]">
              Post-Production
            </span>
            <h2 className="font-heading text-3xl md:text-5xl font-black uppercase text-white">
              Creative Suite Capabilities
            </h2>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="rounded-3xl border border-white/10 bg-[#0f0f1a] p-8 space-y-4 hover:border-[#f59e0b]/40 transition"
              >
                <div className="text-2xl">🎬</div>
                <h3 className="font-heading text-xl font-bold uppercase text-white">
                  {service.title}
                </h3>
                <p className="text-xs leading-relaxed text-white/60">{service.description}</p>
                <div className="pt-4 border-t border-white/10 font-mono text-[11px] text-[#f59e0b]">
                  {service.deliverables || "4K Master Delivery"}
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
      <footer className="border-t border-white/10 py-10 bg-black text-center text-xs text-white/40">
        <p>© {new Date().getFullYear()} Mohit Babariya. Cinematic Film Edition.</p>
      </footer>

      {/* Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-xl">
          <div className="relative w-full max-w-4xl rounded-3xl border border-[#f59e0b]/30 bg-[#0c0c14] p-6">
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
