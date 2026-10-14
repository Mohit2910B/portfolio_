"use client";

export interface ServiceItem {
  id: number;
  title: string;
  description: string;
  deliverables?: string;
  icon?: string;
}

interface ServicesProps {
  services?: ServiceItem[];
  introText?: string;
}

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 101,
    title: "Short-Form Reel & TikTok Editing",
    description: "High-retention vertical edits with engaging hook captions, dynamic sound effects, B-roll transitions, and visual pop-ups.",
    deliverables: "Vertical 9:16 Video, Custom Subtitles, Sound Design, Color Grading",
  },
  {
    id: 102,
    title: "Cinematic Real Estate Showcase",
    description: "Smooth architectural walkthroughs featuring ultra-clean speed ramps, sky replacements, color correction, and ambient acoustic mixing.",
    deliverables: "4K Master File, Social Cutdowns, Drone Stabilization, Color Grading",
  },
  {
    id: 103,
    title: "YouTube Long-Form & Documentary Edits",
    description: "Paced storytelling for talking head, tech, travel, and documentary content with graphic callouts, maps, and kinetic titles.",
    deliverables: "Full HD/4K Render, Custom Thumbnail Graphic, Chapter Markers",
  },
  {
    id: 104,
    title: "Commercial Ad Films & Motion FX",
    description: "High-impact promo videos with 3D product callouts, custom logo intros, VFX tracking, and broadcast-ready audio mixing.",
    deliverables: "3D Product Intros, Kinetic Motion Titles, Commercial License SFX",
  },
];

export default function Services({ services = [], introText }: ServicesProps) {
  const displayServices = services.length > 0 ? services : DEFAULT_SERVICES;

  return (
    <section id="services" className="py-24 border-b border-[var(--border-glass)] relative">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <span className="font-mono text-xs tracking-[0.2em] text-[var(--accent)] uppercase font-bold">
              03 // WHAT I DO
            </span>
            <h2 className="font-serif font-bold text-4xl sm:text-6xl tracking-tight text-[var(--text-primary)]">
              Creative Services.
            </h2>
            <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed">
              {introText || "Tailored video editing, motion graphics, and post-production solutions for creators, brands, and agencies worldwide."}
            </p>
          </div>
        </div>

        {/* Floating Glass Editorial Rows */}
        <div className="space-y-4">
          {displayServices.map((service, idx) => (
            <div
              key={service.id}
              className="glass-panel p-8 group hover:border-[var(--accent)]/60 transition-all duration-300 grid grid-cols-1 md:grid-cols-12 gap-6 items-center"
            >
              <div className="md:col-span-1 font-mono text-sm text-[var(--accent)] font-bold">
                0{idx + 1}
              </div>

              <div className="md:col-span-4 font-serif font-bold text-2xl tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                {service.title}
              </div>

              <div className="md:col-span-5 space-y-2">
                <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed">
                  {service.description}
                </p>
                {service.deliverables && (
                  <div className="font-mono text-xs text-[var(--text-primary)] tracking-wide">
                    <span className="text-[var(--accent)]">DELIVERABLES:</span> {service.deliverables}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 flex flex-col md:items-end justify-center">
                <a
                  href="#contact"
                  className="inline-block px-5 py-2.5 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.16)] font-mono text-[10px] text-[var(--text-primary)] hover:bg-[var(--accent)] hover:text-[var(--bg-main)] hover:border-[var(--accent)] transition-all uppercase tracking-widest font-bold shadow-lg"
                >
                  DISCUSS PROJECT →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
