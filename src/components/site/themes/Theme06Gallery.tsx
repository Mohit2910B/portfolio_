"use client";

import { useState } from "react";
import type { SiteData, PublicProject } from "@/lib/data";
import WorkCarousel from "@/components/site/WorkCarousel";
import ContactSection from "@/components/site/ContactSection";
import SoftwareTools from "@/components/site/SoftwareTools";
import ChatWidget from "@/components/site/ChatWidget";

export default function Theme06Gallery({ data }: { data: SiteData }) {
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
    <div className="min-h-screen bg-[#0c0a09] text-[#fafaf9] font-serif antialiased selection:bg-[#d97706] selection:text-white">
      {/* Luxury Gallery Header */}
      <header className="sticky top-0 z-40 border-b border-stone-800 bg-[#0c0a09]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6">
          <a href="#" className="font-serif text-lg tracking-[0.2em] uppercase text-stone-200">
            {homepage.ownerName || "Mohit Babariya"}
          </a>

          <nav className="hidden md:flex items-center gap-10 font-sans text-[11px] uppercase tracking-[0.25em] text-stone-400">
            <a href="#exhibition" className="hover:text-stone-100 transition">
              Exhibition
            </a>
            <a href="#archive" className="hover:text-stone-100 transition">
              Archive
            </a>
            <a href="#curator" className="hover:text-stone-100 transition">
              Biography
            </a>
            <a href="#salon" className="hover:text-stone-100 transition">
              Salon
            </a>
            <a href="#inquire" className="hover:text-stone-100 transition">
              Acquisition
            </a>
          </nav>

          <a
            href="#inquire"
            className="font-sans text-xs uppercase tracking-[0.2em] text-amber-500 hover:text-amber-400 transition"
          >
            Private Inquiry →
          </a>
        </div>
      </header>

      {/* Gallery Exhibition Hero */}
      <section className="border-b border-stone-800 py-28 md:py-40">
        <div className="mx-auto max-w-5xl px-8 text-center space-y-8">
          <div className="font-sans text-[11px] font-medium uppercase tracking-[0.3em] text-amber-500/80">
            Contemporary Visual Works &amp; Film Editing
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-stone-100 leading-tight italic">
            The Motion Atelier.
          </h1>

          <p className="mx-auto max-w-2xl font-sans text-sm md:text-base leading-relaxed text-stone-400">
            {homepage.heroDescription ||
              "Curating narrative films, tactile commercial cuts, and considered motion art for distinguished international creators."}
          </p>

          <div className="pt-6">
            <a
              href="#exhibition"
              className="inline-block border-b border-stone-400 pb-1 font-sans text-xs uppercase tracking-[0.25em] text-stone-300 hover:text-amber-500 hover:border-amber-500 transition"
            >
              Enter Exhibition Room ↓
            </a>
          </div>
        </div>
      </section>

      {/* Video Carousel Section */}
      <div id="exhibition">
        <WorkCarousel data={data} />
      </div>

      {/* Museum Framed Art Project Archive */}
      <section id="archive" className="border-t border-stone-800 py-28 md:py-36">
        <div className="mx-auto max-w-7xl px-8">
          <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-6 pb-12 border-b border-stone-800">
            <div>
              <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-amber-500">
                Permanent Collection
              </span>
              <h2 className="mt-2 font-serif text-3xl md:text-4xl italic text-stone-100">
                Catalog of Works
              </h2>
            </div>

            {/* Category selection */}
            <div className="flex flex-wrap gap-3 font-sans text-xs">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={`pb-1 uppercase tracking-widest transition ${
                  activeCategory === "all"
                    ? "border-b-2 border-amber-500 text-stone-100"
                    : "text-stone-500 hover:text-stone-300"
                }`}
              >
                All Works [{projects.length}]
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCategory(String(c.id))}
                  className={`pb-1 uppercase tracking-widest transition ${
                    activeCategory === String(c.id)
                      ? "border-b-2 border-amber-500 text-stone-100"
                      : "text-stone-500 hover:text-stone-300"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Framed Artwork Grid with Placard Captions */}
          <div className="mt-16 grid grid-cols-1 gap-16 md:grid-cols-2 lg:gap-20">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="group cursor-pointer space-y-6"
              >
                {/* Museum Framed Presentation */}
                <div className="relative aspect-[16/10] overflow-hidden rounded-sm border border-stone-700/60 bg-stone-900/60 p-3 shadow-2xl transition duration-700 group-hover:border-amber-500/40">
                  <div className="relative h-full w-full overflow-hidden bg-black">
                    {project.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={project.thumbnailUrl}
                        alt={project.title}
                        className="h-full w-full object-cover transition duration-1000 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-sans text-xs text-stone-600">
                        [ ARTWORK STUDY ]
                      </div>
                    )}
                  </div>
                </div>

                {/* Museum Placard Caption */}
                <div className="border-l-2 border-stone-800 pl-4 space-y-1 font-sans">
                  <div className="font-serif text-xl italic text-stone-100 group-hover:text-amber-400 transition">
                    {project.title}
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-stone-500">
                    {project.categoryLabel || "Film"} · {project.year || "2026"} · Motion &amp; Video Edit
                  </div>
                  {project.description && (
                    <p className="mt-1 text-xs text-stone-400 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Curator Biography */}
      <section id="curator" className="border-t border-stone-800 py-28 bg-[#100e0c]">
        <div className="mx-auto max-w-4xl px-8 space-y-8 text-center">
          <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-amber-500">
            Artist &amp; Curator Biography
          </span>
          <h2 className="font-serif text-3xl md:text-5xl italic text-stone-100">
            The Philosophy of Movement
          </h2>
          <p className="font-sans text-sm md:text-base leading-relaxed text-stone-300">
            {homepage.aboutIntro ||
              "I work as an independent video editor and motion designer, collaborating directly with brands, creators and studios on edits that need to ship fast without losing craft."}
          </p>
        </div>
      </section>

      {/* Salon Services */}
      <section id="salon" className="border-t border-stone-800 py-28">
        <div className="mx-auto max-w-7xl px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 pb-16">
            <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-amber-500">
              Salon Offerings
            </span>
            <h2 className="font-serif text-3xl md:text-4xl italic text-stone-100">
              Commissions &amp; Engagements
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="border border-stone-800 bg-[#12100e] p-8 space-y-4 rounded-sm"
              >
                <h3 className="font-serif text-xl italic text-stone-100">{service.title}</h3>
                <p className="font-sans text-xs leading-relaxed text-stone-400">
                  {service.description}
                </p>
                <div className="pt-4 border-t border-stone-800 font-sans text-[11px] uppercase tracking-wider text-amber-500">
                  {service.deliverables || "Master Archival Delivery"}
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
      <div id="inquire">
        <ContactSection data={data} />
      </div>

      {/* Footer */}
      <footer className="border-t border-stone-800 py-10 bg-[#080706] text-center font-sans text-xs text-stone-500">
        <p>© {new Date().getFullYear()} Mohit Babariya. Gallery Edition.</p>
      </footer>

      {/* Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-xl">
          <div className="relative w-full max-w-4xl border border-stone-700 bg-[#12100e] p-8">
            <button
              type="button"
              onClick={() => setSelectedProject(null)}
              className="absolute right-4 top-4 font-sans text-xs text-stone-400 hover:text-stone-200"
            >
              [ Close ✕ ]
            </button>
            <h3 className="font-serif text-2xl italic text-stone-100">
              {selectedProject.title}
            </h3>
            <div className="mt-4 aspect-video w-full overflow-hidden bg-black">
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
