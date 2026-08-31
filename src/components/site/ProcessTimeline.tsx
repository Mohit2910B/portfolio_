"use client";

import Reveal from "@/components/site/Reveal";

const STEPS = [
  {
    step: "01",
    title: "Ingestion & Storyboard Architecture",
    tagline: "Asset curation, proxy generation, and narrative mapping.",
    description: "Multi-cam sync, audio alignment, footage tagging, and crafting the pacing blueprint to guarantee high retention.",
    deliverable: "Rough cut structure & pacing map",
  },
  {
    step: "02",
    title: "Dynamic Cuts & Hook Optimization",
    tagline: "High-retention editing engineered for 3-second hook capture.",
    description: "Speed ramps, kinetic match cuts, typography callouts, micro-zooms, and seamless transitions tailored for social or cinema.",
    deliverable: "Fine cut & motion timing lock",
  },
  {
    step: "03",
    title: "Layered Sound Design & Foley",
    tagline: "Spatial soundscapes that bring visuals to life.",
    description: "Impact risers, bespoke whooshes, ambient room tones, dialogue isolation, and precise beat-synced music mixing.",
    deliverable: "Multi-track mixed master audio",
  },
  {
    step: "04",
    title: "Color Science & Cinematic Grading",
    tagline: "Transforming flat log sensors into rich visual poetry.",
    description: "ACES color management, custom LUT creation, skin tone fidelity, highlight roll-off, and film emulsion emulation.",
    deliverable: "Rec.709 / HDR color-graded grade",
  },
  {
    step: "05",
    title: "4K Master Delivery & Platform Encoding",
    tagline: "Zero-compression exports optimized for every screen.",
    description: "ProRes 422HQ cinema archives, H.265 vertical reels with zero bitrate banding, thumbnail frames, and clean SRT subtitles.",
    deliverable: "Final master files in all aspect ratios",
  },
];

export default function ProcessTimeline() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32 bg-neutral-950 text-white">
      {/* Subtle Background Glow */}
      <div className="pointer-events-none absolute bottom-0 right-10 h-[400px] w-[500px] rounded-full bg-[var(--accent,#e0147f)]/10 blur-[140px]" />

      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--accent,#e0147f)] animate-pulse" />
            <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-[var(--accent,#e0147f)]">
              Workflow & Pipeline
            </p>
          </div>
          <h2 className="display mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            THE EDITING <span className="text-white/40">PIPELINE</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-white/60">
            A battle-tested 5-phase post-production pipeline built to deliver thumb-stopping, high-converting video assets consistently.
          </p>
        </div>

        {/* 5-Step Cards Grid */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((item, index) => (
            <Reveal key={item.step} delay={index * 60}>
              <div className="group relative flex h-full flex-col justify-between rounded-[28px] border border-white/10 bg-neutral-900/60 p-6 backdrop-blur-xl transition duration-500 hover:-translate-y-2 hover:border-[var(--accent,#e0147f)]/50 hover:bg-neutral-900/90 hover:shadow-2xl">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-black text-white/30 group-hover:text-[var(--accent,#e0147f)] transition">
                      {item.step}
                    </span>
                    <span className="h-2 w-2 rounded-full bg-white/20 group-hover:bg-[var(--accent,#e0147f)] transition" />
                  </div>

                  <h3 className="mt-4 font-heading text-base font-bold text-white group-hover:text-white transition">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-xs font-medium text-white/80 leading-snug">
                    {item.tagline}
                  </p>

                  <p className="mt-3 text-[11px] leading-relaxed text-white/50">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 border-t border-white/10 pt-4">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--accent,#e0147f)]">
                    Phase Deliverable:
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-white/70">
                    {item.deliverable}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
