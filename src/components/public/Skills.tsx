"use client";

export interface SkillItem {
  id: number;
  name: string;
  category: string;
  description: string;
  level: number;
}

interface SkillsProps {
  skills?: SkillItem[];
}

export default function Skills({ skills = [] }: SkillsProps) {
  if (!skills.length) return null;

  return (
    <section id="skills" className="py-24 border-b border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="space-y-3">
          <span className="font-mono text-xs tracking-[0.2em] text-[var(--accent)] uppercase">
            06 // TECHNICAL PROFICIENCY
          </span>
          <h2 className="font-display font-extrabold text-4xl sm:text-6xl uppercase tracking-tight text-[var(--text-primary)]">
            SKILLS & CAPABILITIES
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="border border-[var(--border-color)] bg-[var(--bg-card)] p-6 space-y-4 hover:border-[var(--accent)]/50 transition-all"
            >
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-[var(--accent)] tracking-widest uppercase font-bold">
                  {skill.category || "CAPABILITY"}
                </span>
                <span className="text-[var(--text-primary)] font-bold">{skill.level}%</span>
              </div>

              <h3 className="font-display font-bold text-xl uppercase tracking-tight text-[var(--text-primary)]">
                {skill.name}
              </h3>

              {/* Editorial Progress Bar */}
              <div className="w-full h-1.5 bg-[var(--bg-surface)] overflow-hidden">
                <div
                  className="h-full bg-[var(--accent)] transition-all duration-1000"
                  style={{ width: `${skill.level}%` }}
                />
              </div>

              {skill.description && (
                <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
                  {skill.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
