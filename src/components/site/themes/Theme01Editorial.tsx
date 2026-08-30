"use client";

import { useState } from "react";
import type { SiteData, PublicProject } from "@/lib/data";
import WorkCarousel from "@/components/site/WorkCarousel";
import ContactSection from "@/components/site/ContactSection";
import SoftwareTools from "@/components/site/SoftwareTools";
import ChatWidget from "@/components/site/ChatWidget";

export default function Theme01Editorial({ data }: { data: SiteData }) {
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
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] font-sans antialiased selection:bg-[#e0147f] selection:text-white">
      {/* Editorial Navigation */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="#" className="font-heading text-lg font-black uppercase tracking-tighter text-white">
            {homepage.ownerName || "MOHIT BABARIYA"}
            <span className="ml-1 text-[var(--accent,#e0147f)]">.</span>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
            <a href="#work" className="transition hover:text-white">
              Works
            </a>
            <a href="#about" className="transition hover:text-white">
              Manifesto
            </a>
            <a href="#services" className="transition hover:text-white">
              Services
            </a>
            <a href="#tools" className="transition hover:text-white">
              Stack
            </a>
            <a href="#contact" className="transition hover:text-white">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {homepage.availabilityLabel || "Available for Select Projects"}
            </div>
            <a
              href="#contact"
              className="rounded-full bg-white px-5 py-2 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[var(--accent,#e0147f)] hover:text-white"
            >
              Start Project
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section: Editorial Statement */}
      <section className="relative overflow-hidden border-b border-white/10 py-24 md:py-36">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-[var(--accent,#e0147f)]">
                Creative Direction &amp; Video Editing
              </span>
              <h1 className="mt-6 font-heading text-5xl font-black uppercase tracking-tighter text-white sm:text-7xl md:text-8xl lg:text-9xl leading-[0.9]">
                {homepage.heroTitle ? (
                  homepage.heroTitle.split("\n").map((line, idx) => (
                    <span key={idx} className="block">
                      {line}
                    </span>
                  ))
                ) : (
                  <>
                    MAKE
                    <br />
                    VISUALS
                    <br />
                    MOVE.
                  </>
                )}
              </h1>
            </div>

            <div className="lg:col-span-4 lg:pb-4 space-y-6">
              <p className="text-sm md:text-base leading-relaxed text-white/70">
                {homepage.heroDescription ||
                  "I edit films, reels and motion pieces that hold attention — clean cuts, considered pacing and a finish that feels intentional."}
              </p>
              <div className="flex items-center gap-4 pt-2">
                <a
                  href="#work"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:border-white hover:bg-white hover:text-black"
                >
                  View Showcase ↓
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee Banner */}
      <div className="overflow-hidden border-b border-white/10 bg-white/[0.02] py-4">
        <div className="flex animate-marquee whitespace-nowrap text-xs font-mono uppercase tracking-[0.3em] text-white/40">
          <span className="mx-8">VIDEO EDITING</span>•
          <span className="mx-8">MOTION GRAPHICS</span>•
          <span className="mx-8">COLOR GRADING</span>•
          <span className="mx-8">SOUND DESIGN</span>•
          <span className="mx-8">AI VIDEO WORKFLOWS</span>•
          <span className="mx-8">COMMERCIALS &amp; REELS</span>•
          <span className="mx-8">VIDEO EDITING</span>•
          <span className="mx-8">MOTION GRAPHICS</span>•
          <span className="mx-8">COLOR GRADING</span>•
        </div>
      </div>

      {/* Video Carousel Section */}
      <WorkCarousel data={data} />

      {/* Asymmetric Editorial Portfolio Grid */}
      <section className="border-t border-white/10 py-24 md:py-36">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-white/10">
            <div>
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-[var(--accent,#e0147f)]">
                Selected Archive
              </span>
              <h2 className="mt-2 font-heading text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
                Curated Works
              </h2>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                  activeCategory === "all"
                    ? "bg-white text-black"
                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                All Works ({projects.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(String(cat.id))}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                    activeCategory === String(cat.id)
                      ? "bg-white text-black"
                      : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Project List / Grid */}
          <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-2 lg:gap-16">
            {filteredProjects.map((project, index) => (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="group cursor-pointer space-y-4"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-neutral-900">
                  {project.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={project.thumbnailUrl}
                      alt={project.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-black/40 text-white/30">
                      🎬
                    </div>
                  )}

                  {/* Play badge */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 backdrop-blur-sm transition duration-300 group-hover:opacity-100">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black font-bold">
                      ▶
                    </div>
                  </div>

                  <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-white backdrop-blur-md">
                    {project.categoryLabel || "Film"}
                  </div>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-xl font-bold uppercase tracking-tight text-white group-hover:text-[var(--accent,#e0147f)] transition">
                      {project.title}
                    </h3>
                    <p className="mt-1 text-xs text-white/50 line-clamp-1">
                      {project.description}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-white/40">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Manifesto / About Section */}
      <section id="about" className="border-t border-white/10 py-24 md:py-36 bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-[var(--accent,#e0147f)]">
                About &amp; Experience
              </span>
              <h2 className="mt-2 font-heading text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                Crafting With Intent
              </h2>
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
                <div>
                  <div className="text-2xl font-black text-white">2+ Years</div>
                  <div className="text-xs text-white/50 uppercase tracking-wider">
                    Dedicated Professional Experience
                  </div>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <div className="text-2xl font-black text-white">100+</div>
                  <div className="text-xs text-white/50 uppercase tracking-wider">
                    Projects Delivered Worldwide
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-8 text-base md:text-lg leading-relaxed text-white/70">
              <p>
                {homepage.aboutIntro ||
                  "I am Mohit Babariya, a video editor and motion designer working across editorial, social and brand content. My work sits between structure and feel — the timeline has to make sense, and it also has to move someone."}
              </p>
              <p>
                {homepage.aboutExperience ||
                  "I work as an independent video editor, motion graphics artist and graphic designer, collaborating directly with brands, creators and studios on edits that need to ship fast without losing craft."}
              </p>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-6 border-t border-white/10">
                <div>
                  <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-white">
                    Focus Areas
                  </h4>
                  <p className="mt-2 text-xs leading-relaxed text-white/60">
                    {homepage.aboutFocus ||
                      "Short-form social editing, real-estate films, product videos, motion graphics systems and AI-assisted workflows."}
                  </p>
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-white">
                    Workflow
                  </h4>
                  <p className="mt-2 text-xs leading-relaxed text-white/60">
                    {homepage.aboutWorkflow ||
                      "Brief & references → selects & assembly → motion & grading → sound design → final delivery in all aspect ratios."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services List */}
      <section id="services" className="border-t border-white/10 py-24 md:py-36">
        <div className="mx-auto max-w-7xl px-6">
          <span className="text-xs font-mono uppercase tracking-[0.3em] text-[var(--accent,#e0147f)]">
            Capabilities
          </span>
          <h2 className="mt-2 font-heading text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
            Services &amp; Deliverables
          </h2>

          <div className="mt-12 divide-y divide-white/10">
            {services.map((service, idx) => (
              <div
                key={service.id}
                className="group py-8 transition duration-300 hover:bg-white/[0.02]"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-baseline">
                  <span className="font-mono text-sm text-white/40 md:col-span-1">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-heading text-2xl font-bold uppercase text-white group-hover:text-[var(--accent,#e0147f)] transition md:col-span-4">
                    {service.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-white/60 md:col-span-4">
                    {service.description}
                  </p>
                  <div className="text-right md:col-span-3">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-white/80">
                      {service.deliverables || "High-Res Deliverables"}
                    </span>
                  </div>
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

      {/* Contact & Enquiry Section */}
      <div id="contact">
        <ContactSection data={data} />
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 bg-black text-center text-xs text-white/40">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Mohit Babariya. All rights reserved.</p>
          <p className="font-mono text-[11px] uppercase tracking-widest text-white/30">
            Theme 01: Editorial / Creative Director
          </p>
        </div>
      </footer>

      {/* Project Video Modal (if opened) */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl">
          <div className="relative w-full max-w-4xl rounded-3xl border border-white/20 bg-neutral-950 p-6 overflow-hidden">
            <button
              type="button"
              onClick={() => setSelectedProject(null)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              ✕
            </button>
            <h3 className="font-heading text-xl font-bold uppercase text-white">
              {selectedProject.title}
            </h3>
            <p className="text-xs text-white/50 mt-1">{selectedProject.categoryLabel}</p>
            <div className="mt-4 aspect-video w-full overflow-hidden rounded-2xl bg-black">
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
            {selectedProject.description && (
              <p className="mt-4 text-xs leading-relaxed text-white/70">
                {selectedProject.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Live Chat Widget */}
      <ChatWidget />
    </div>
  );
}
