"use client";

import type { SiteData } from "@/lib/data";
import WorkCarousel from "@/components/site/WorkCarousel";
import ContactSection from "@/components/site/ContactSection";
import SoftwareTools from "@/components/site/SoftwareTools";
import ChatWidget from "@/components/site/ChatWidget";

export default function Theme03Cinematic({ data }: { data: SiteData }) {
  const { homepage, services, projects = [], carouselItems = [] } = data;
  const hasCarousel = carouselItems.length > 0 || projects.length > 0;

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
            {hasCarousel && (
              <a href="#work" className="hover:text-white transition">
                Showcase
              </a>
            )}
            <a href="#services" className="hover:text-white transition">
              Capabilities
            </a>
            <a href="#tools" className="hover:text-white transition">
              Suite
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
              href="#services"
              className="rounded-full bg-white px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-black shadow-[0_0_25px_rgba(255,255,255,0.3)] transition hover:bg-[#f59e0b] hover:text-black"
            >
              Explore Capabilities ▶
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

      {hasCarousel && (
        <div id="work">
          <WorkCarousel data={data} />
        </div>
      )}

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

      <div id="tools">
        <SoftwareTools data={data} />
      </div>

      <div id="contact">
        <ContactSection data={data} />
      </div>

      <footer className="border-t border-white/10 py-10 bg-black text-center text-xs text-white/40">
        <p>© {new Date().getFullYear()} Mohit Babariya. Cinematic Film Edition.</p>
      </footer>

      <ChatWidget />
    </div>
  );
}
