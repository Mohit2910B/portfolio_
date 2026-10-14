"use client";

interface AboutProps {
  content?: {
    aboutHeading?: string;
    aboutSubheading?: string;
    aboutDescription?: string;
    aboutExperienceYears?: string;
    aboutProjectsCompleted?: string;
    aboutClientsCount?: string;
  };
}

export default function About({ content }: AboutProps) {
  const heading = content?.aboutHeading || "I EDIT. I DESIGN. I CREATE MOTION.";
  const subheading = content?.aboutSubheading || "Passionate Storyteller & Visual Craftsman";
  const description =
    content?.aboutDescription ||
    "I specialize in transforming raw footage into compelling visual narratives. With experience in video editing, motion design, 3D compositing, and AI workflows, I help brands and creators hold audience attention worldwide.";
  const years = content?.aboutExperienceYears || "2+";
  const projects = content?.aboutProjectsCompleted || "450+";
  const clients = content?.aboutClientsCount || "120+";

  return (
    <section id="about" className="py-24 border-b border-[var(--border-glass)] relative">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6">
          <span className="font-mono text-xs tracking-[0.2em] text-[var(--accent)] uppercase font-bold">
            03 // ABOUT MOHIT BABARIYA
          </span>
          <h2 className="font-serif font-bold text-4xl sm:text-6xl tracking-tight text-[var(--text-primary)] uppercase leading-[1.1]">
            {heading}
          </h2>
          <div className="font-mono text-xs tracking-[0.2em] text-[var(--accent)] uppercase font-semibold">
            {subheading}
          </div>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] font-light leading-relaxed">
            {description}
          </p>
        </div>

        {/* Right Column: Floating Glass Stats Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel-strong p-8 space-y-8">
            <div className="border-b border-[var(--border-glass)] pb-6 flex items-baseline justify-between">
              <div>
                <div className="font-serif font-bold text-5xl text-[var(--accent)]">
                  {years}
                </div>
                <div className="font-mono text-xs tracking-widest uppercase text-[var(--text-secondary)] mt-1 font-bold">
                  YEARS OF EXPERIENCE
                </div>
              </div>
              <span className="font-mono text-[10px] text-[var(--text-secondary)]">2024 — 2026</span>
            </div>

            <div className="border-b border-[var(--border-glass)] pb-6 flex items-baseline justify-between">
              <div>
                <div className="font-serif font-bold text-5xl text-[var(--text-primary)]">
                  {projects}
                </div>
                <div className="font-mono text-xs tracking-widest uppercase text-[var(--text-secondary)] mt-1 font-bold">
                  PROJECTS DELIVERED
                </div>
              </div>
              <span className="font-mono text-[10px] text-[var(--text-secondary)] font-bold text-[var(--accent)]">GLOBAL BRANDS</span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <div className="font-serif font-bold text-5xl text-[var(--accent)]">
                  {clients}
                </div>
                <div className="font-mono text-xs tracking-widest uppercase text-[var(--text-secondary)] mt-1 font-bold">
                  CLIENTS WORLDWIDE
                </div>
              </div>
              <span className="font-mono text-[10px] text-[var(--text-secondary)] font-bold">100% RETENTION</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
