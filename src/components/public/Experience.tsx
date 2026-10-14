"use client";

export interface ExperienceItem {
  id: number;
  company: string;
  role: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
}

interface ExperienceProps {
  items?: ExperienceItem[];
}

export default function Experience({ items = [] }: ExperienceProps) {
  if (!items.length) return null;

  return (
    <section id="experience" className="py-24 border-b border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="space-y-3">
          <span className="font-mono text-xs tracking-[0.2em] text-[var(--accent)] uppercase">
            04 // PROFESSIONAL EXPERIENCE
          </span>
          <h2 className="font-display font-extrabold text-4xl sm:text-6xl uppercase tracking-tight text-[var(--text-primary)]">
            CAREER TIMELINE
          </h2>
        </div>

        <div className="space-y-6">
          {items.map((exp) => (
            <div
              key={exp.id}
              className="border border-[var(--border-color)] bg-[var(--bg-card)] p-8 hover:border-[var(--accent)]/50 transition-all duration-300 grid grid-cols-1 md:grid-cols-12 gap-6 items-start"
            >
              <div className="md:col-span-4 space-y-1 font-mono text-xs text-[var(--text-secondary)] tracking-widest uppercase">
                <div className="text-[var(--accent)] font-bold">
                  {exp.startDate} — {exp.endDate}
                </div>
                <div>{exp.location}</div>
              </div>

              <div className="md:col-span-8 space-y-3">
                <h3 className="font-display font-bold text-2xl uppercase tracking-tight text-[var(--text-primary)]">
                  {exp.role}
                </h3>
                <div className="font-mono text-xs tracking-widest text-[var(--accent)] uppercase">
                  {exp.company}
                </div>
                <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed">
                  {exp.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
