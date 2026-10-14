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
  const heading = content?.aboutHeading || "CREATIVITY MEETS TECHNOLOGY";
  const years =
    content?.aboutExperienceYears === "6+"
      ? "2+"
      : content?.aboutExperienceYears || "2+";
  const projects = content?.aboutProjectsCompleted || "500+";
  const clients = content?.aboutClientsCount || "100+";

  return (
    <section id="about" className="py-24 border-b border-[var(--border-glass)] relative">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6">
          <span className="font-mono text-xs tracking-[0.2em] text-[var(--accent)] uppercase font-bold">
            02 // ABOUT ME
          </span>
          <h2 className="font-serif font-bold text-4xl sm:text-6xl tracking-tight text-[var(--text-primary)] uppercase leading-[1.1]">
            {heading}
          </h2>
          <div className="font-mono text-xs tracking-[0.2em] text-[var(--accent)] uppercase font-semibold">
            Video Editor | Graphic Designer | 3D Artist | AI Creator
          </div>

          <div className="space-y-4 text-base sm:text-lg text-[var(--text-secondary)] font-light leading-relaxed">
            <p>
              I'm <strong className="text-[var(--text-primary)] font-semibold">Mohit Babariya</strong>, a passionate Video Editor, Graphic Designer, 3D Artist, and AI Creator with over 2 years of experience in visual content creation.
            </p>
            <p>
              My work combines creative storytelling, modern aesthetics, and cutting-edge digital tools to produce high-quality visual content that captures attention.
            </p>
            <p>
              Whether it's editing dynamic videos, designing brand visuals, creating 3D product models, or generating AI-driven media, I focus on delivering impactful results that align with brand goals.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap gap-3 font-mono text-xs text-[var(--text-secondary)]">
            <span className="px-3.5 py-1.5 rounded-full glass-panel border border-[var(--accent)]/30 text-[var(--accent)] font-bold">
              ✓ Creative Storytelling
            </span>
            <span className="px-3.5 py-1.5 rounded-full glass-panel border border-white/10 text-white font-medium">
              ✓ Fast Turnaround
            </span>
            <span className="px-3.5 py-1.5 rounded-full glass-panel border border-white/10 text-white font-medium">
              ✓ Global Remote Workflow
            </span>
          </div>
        </div>

        {/* Right Column: Floating Glass Stats Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel-strong p-8 space-y-8 rounded-2xl">
            <div className="border-b border-[var(--border-glass)] pb-6 flex items-baseline justify-between">
              <div>
                <div className="font-serif font-bold text-5xl text-[var(--accent)]">
                  {years}
                </div>
                <div className="font-mono text-xs tracking-widest uppercase text-[var(--text-secondary)] mt-1 font-bold">
                  CREATIVE EXPERIENCE
                </div>
              </div>
              <span className="font-mono text-[10px] text-[var(--text-secondary)]">2024 — PRESENT</span>
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
              <span className="font-mono text-[10px] text-[var(--accent)] font-bold">WORLDWIDE</span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <div className="font-serif font-bold text-5xl text-[var(--accent)]">
                  {clients}
                </div>
                <div className="font-mono text-xs tracking-widest uppercase text-[var(--text-secondary)] mt-1 font-bold">
                  SATISFIED CLIENTS
                </div>
              </div>
              <span className="font-mono text-[10px] text-emerald-400 font-bold">99% RETENTION</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
