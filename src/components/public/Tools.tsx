"use client";

export interface ToolItem {
  id: number;
  name: string;
  category: string;
  description: string;
  proficiency: number;
  iconUrl?: string;
}

interface ToolsProps {
  tools?: ToolItem[];
}

export default function Tools({ tools = [] }: ToolsProps) {
  if (!tools.length) return null;

  return (
    <section id="tools" className="py-24 border-b border-[var(--border-glass)]">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="space-y-3">
          <span className="font-mono text-xs tracking-[0.2em] text-[var(--accent)] uppercase font-bold">
            07 // SOFTWARE & HARDWARE
          </span>
          <h2 className="font-serif font-bold text-4xl sm:text-6xl tracking-tight text-[var(--text-primary)]">
            Tools I Work With.
          </h2>
        </div>

        {/* Horizontal Glass Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {tools.map((tool) => (
            <div
              key={tool.id}
              data-cursor-button
              className="glass-panel p-5 space-y-3 hover:border-[var(--accent)] transition-all text-center flex flex-col justify-between group"
            >
              <div className="font-mono text-[9px] text-[var(--accent)] uppercase tracking-widest font-bold">
                {tool.category || "SOFTWARE"}
              </div>

              <div className="font-serif font-bold text-lg tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                {tool.name}
              </div>

              <div className="font-mono text-[10px] text-[var(--text-secondary)]">
                {tool.proficiency}% EXPERT
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
