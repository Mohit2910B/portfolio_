"use client";

import type { SiteData } from "@/lib/data";
import WorkCarousel from "@/components/site/WorkCarousel";
import ContactSection from "@/components/site/ContactSection";
import SoftwareTools from "@/components/site/SoftwareTools";
import ChatWidget from "@/components/site/ChatWidget";

export default function Theme04Studio({ data }: { data: SiteData }) {
  const { homepage, services, projects = [], carouselItems = [] } = data;
  const hasCarousel = carouselItems.length > 0 || projects.length > 0;

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
            {hasCarousel && (
              <a href="#work" className="hover:text-[#a855f7] transition">
                Showcase
              </a>
            )}
            <a href="#services" className="hover:text-[#a855f7] transition">
              Capabilities
            </a>
            <a href="#tools" className="hover:text-[#a855f7] transition">
              Stack
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
                  href="#services"
                  className="rounded-xl bg-[#8b5cf6] px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-black shadow-lg hover:bg-white transition"
                >
                  Explore Capabilities
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
                <span className="font-mono text-xs text-[#a855f7]">#02 SERVICES</span>
                <div className="text-3xl font-black text-white">{services.length}</div>
                <p className="text-[11px] text-white/50">Core Post Services</p>
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

      {hasCarousel && (
        <div id="work">
          <WorkCarousel data={data} />
        </div>
      )}

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

      <div id="tools">
        <SoftwareTools data={data} />
      </div>

      <div id="contact">
        <ContactSection data={data} />
      </div>

      <footer className="border-t border-white/10 py-8 bg-[#0a0a0d] text-center text-xs text-white/40">
        <p>© {new Date().getFullYear()} Mohit Babariya. Digital Studio Edition.</p>
      </footer>

      <ChatWidget />
    </div>
  );
}
