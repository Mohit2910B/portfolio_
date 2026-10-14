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

const DEFAULT_PROCESS_STEPS: ProcessItem[] = [
  {
    id: 1,
    stepNumber: "01",
    title: "Discover",
    description: "Understand your goals, target audience, vision, and project requirements to set a clear creative roadmap.",
  },
  {
    id: 2,
    stepNumber: "02",
    title: "Conceptualize",
    description: "Develop creative ideas, visual directions, moodboards, pacing references, and a streamlined production plan.",
  },
  {
    id: 3,
    stepNumber: "03",
    title: "Create",
    description: "Bring concepts to life through professional editing, visual design, animation, 3D modeling, and cutting-edge AI tools.",
  },
  {
    id: 4,
    stepNumber: "04",
    title: "Refine & Deliver",
    description: "Polish every detail, perform precision color grading, mix acoustic audio, and deliver broadcast-quality master files.",
  },
];

const WHY_WORK_POINTS = [
  "Fast Turnaround Time",
  "High-Quality Output",
  "Creative & Modern Approach",
  "Attention to Detail",
  "Client-Centered Collaboration",
  "Multi-Disciplinary Skills (Video, 3D, Design, AI)",
];

export default function CreativeProcess({ steps = [], introText }: CreativeProcessProps) {
  const displaySteps = steps.length > 0 ? steps : DEFAULT_PROCESS_STEPS;

  return (
    <section id="process" className="py-24 border-b border-[var(--border-glass)] relative">
      <div className="max-w-7xl mx-auto px-6 space-y-16">
        <div className="space-y-3 max-w-xl">
          <span className="font-mono text-xs tracking-[0.2em] text-[var(--accent)] uppercase font-bold">
            06 // WORKFLOW & STANDARDS
          </span>
          <h2 className="font-serif font-bold text-4xl sm:text-6xl tracking-tight text-[var(--text-primary)]">
            My Creative Process.
          </h2>
          <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed">
            {introText || "A proven, systematic creative pipeline designed to take your video or digital project from raw concept to final high-impact delivery."}
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displaySteps.map((step) => (
            <div
              key={step.id || step.stepNumber}
              className="glass-panel p-8 space-y-4 hover:border-[var(--accent)]/60 transition-all duration-300 relative rounded-2xl group flex flex-col justify-between"
            >
              <div className="space-y-3">
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

              <div className="pt-4 border-t border-white/5 font-mono text-[10px] text-[var(--accent)] uppercase tracking-widest font-bold">
                STAGE {step.stepNumber} // COMPLETE
              </div>
            </div>
          ))}
        </div>

        {/* Why Work With Me Section */}
        <div className="glass-panel-strong p-8 sm:p-12 rounded-3xl space-y-8">
          <div className="space-y-2">
            <span className="font-mono text-xs tracking-widest text-[var(--accent)] uppercase font-bold">
              STANDARDS OF EXCELLENCE
            </span>
            <h3 className="font-serif font-bold text-3xl sm:text-4xl text-[var(--text-primary)]">
              Why Work With Me?
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WHY_WORK_POINTS.map((pt, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-center space-x-3 text-sm text-[var(--text-primary)] font-medium"
              >
                <span className="text-[var(--accent)] font-bold text-lg">✓</span>
                <span>{pt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
