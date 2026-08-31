"use client";

import type { SiteData } from "@/lib/data";
import WorkCarousel from "@/components/site/WorkCarousel";
import ContactSection from "@/components/site/ContactSection";
import SoftwareTools from "@/components/site/SoftwareTools";
import ChatWidget from "@/components/site/ChatWidget";

export default function Theme06Gallery({ data }: { data: SiteData }) {
  const { homepage, services, projects = [], carouselItems = [] } = data;
  const hasCarousel = carouselItems.length > 0 || projects.length > 0;

  return (
    <div className="min-h-screen bg-[#0c0a09] text-[#fafaf9] font-serif antialiased selection:bg-[#d97706] selection:text-white">
      {/* Luxury Gallery Header */}
      <header className="sticky top-0 z-40 border-b border-stone-800 bg-[#0c0a09]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6">
          <a href="#" className="font-serif text-lg tracking-[0.2em] uppercase text-stone-200">
            {homepage.ownerName || "Mohit Babariya"}
          </a>

          <nav className="hidden md:flex items-center gap-10 font-sans text-[11px] uppercase tracking-[0.25em] text-stone-400">
            {hasCarousel && (
              <a href="#work" className="hover:text-stone-100 transition">
                Exhibition
              </a>
            )}
            <a href="#curator" className="hover:text-stone-100 transition">
              Biography
            </a>
            <a href="#salon" className="hover:text-stone-100 transition">
              Salon
            </a>
            <a href="#tools" className="hover:text-stone-100 transition">
              Tools
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
              href="#salon"
              className="inline-block border-b border-stone-400 pb-1 font-sans text-xs uppercase tracking-[0.25em] text-stone-300 hover:text-amber-500 hover:border-amber-500 transition"
            >
              Explore Salon Offerings ↓
            </a>
          </div>
        </div>
      </section>

      {hasCarousel && (
        <div id="work">
          <WorkCarousel data={data} />
        </div>
      )}

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

      <div id="tools">
        <SoftwareTools data={data} />
      </div>

      <div id="inquire">
        <ContactSection data={data} />
      </div>

      <footer className="border-t border-stone-800 py-10 bg-[#080706] text-center font-sans text-xs text-stone-500">
        <p>© {new Date().getFullYear()} Mohit Babariya. Gallery Edition.</p>
      </footer>

      <ChatWidget />
    </div>
  );
}
