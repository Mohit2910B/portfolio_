"use client";

export interface ProcessItem {
  id: number;
  stepNumber: string;
  title: string;
  description: string;
}

interface CreativeProcessProps {
  steps?: ProcessItem[];
  introText?: string;
}

export default function CreativeProcess({ steps = [], introText }: CreativeProcessProps) {
  if (!steps.length) return null;

  return (
    <section id="process" className="py-24 border-b border-[var(--border-glass)]">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="space-y-3 max-w-xl">
          <span className="font-mono text-xs tracking-[0.2em] text-[var(--accent)] uppercase font-bold">
            08 // WORKFLOW & METHODOLOGY
          </span>
          <h2 className="font-serif font-bold text-4xl sm:text-6xl tracking-tight text-[var(--text-primary)]">
            Creative Process.
          </h2>
          <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed">
            {introText || "A proven, collaborative workflow designed to take your video project from concept to polished final export."}
          </p>
        </div>

        {/* Horizontal Glass Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.id}
              data-cursor-button
              className="glass-panel p-8 space-y-4 hover:border-[var(--accent)]/60 transition-all duration-300 relative group"
            >
              <div className="font-serif font-bold text-5xl text-[var(--accent)] opacity-80 group-hover:opacity-100 transition-opacity">
                {step.stepNumber}
              </div>
              <h3 className="font-serif font-bold text-2xl tracking-tight text-[var(--text-primary)]">
                {step.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
