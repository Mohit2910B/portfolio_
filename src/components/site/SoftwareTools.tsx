import Reveal from "./Reveal";
import { SectionHeading } from "./Sections";
import type { SiteData } from "@/lib/data";

export default function SoftwareTools({ data }: { data: SiteData }) {
  if (data.softwareTools.length === 0) return null;

  return (
    <section id="tools" className="px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-[1400px]">
        <SectionHeading
          eyebrow="Tools & Software"
          title="TOOLS & SOFTWARE"
          description="The tools I use to turn ideas into polished visual experiences."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.softwareTools.map((tool, index) => (
            <Reveal key={tool.id} delay={index * 35}>
              <article className="glass group h-full rounded-3xl p-5 transition-transform duration-500 hover:-translate-y-1 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-ink/10 bg-white/55 text-ink shadow-[0_18px_40px_-30px_rgba(11,11,12,0.5)] transition-transform duration-500 group-hover:scale-105">
                    <ToolIcon icon={tool.icon} />
                  </span>
                  <span className="mono text-[0.58rem] text-ink/25">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="mt-5">
                  <p className="mono text-[0.58rem] uppercase tracking-[0.2em] text-ink/40">
                    {tool.category || "Creative tool"}
                  </p>
                  <h3 className="mt-2 text-base font-semibold tracking-tight text-ink">
                    {tool.name}
                  </h3>
                </div>

                {typeof tool.proficiency === "number" && (
                  <div className="mt-6">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
                      <span
                        className="block h-full rounded-full bg-ink transition-all duration-700 group-hover:bg-[var(--accent)]"
                        style={{ width: `${Math.min(Math.max(tool.proficiency, 0), 100)}%` }}
                      />
                    </div>
                    <p className="mono mt-2 text-[0.6rem] text-ink/45">
                      {tool.proficiency}% proficiency
                    </p>
                  </div>
                )}
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ToolIcon({ icon }: { icon: string }) {
  const label = icon.toLowerCase();
  const common = "text-[0.72rem] font-bold tracking-[-0.02em]";

  if (label.includes("premiere")) return <span className={`${common} text-[#7b61ff]`}>Pr</span>;
  if (label.includes("after")) return <span className={`${common} text-[#9b6dff]`}>Ae</span>;
  if (label.includes("photoshop")) return <span className={`${common} text-[#1478ff]`}>Ps</span>;
  if (label.includes("illustrator")) return <span className={`${common} text-[#ff7a00]`}>Ai</span>;
  if (label.includes("figma")) {
    return (
      <svg width="18" height="24" viewBox="0 0 18 24" aria-hidden="true">
        <circle cx="6" cy="6" r="4" fill="#f24e1e" />
        <circle cx="12" cy="6" r="4" fill="#ff7262" />
        <circle cx="6" cy="12" r="4" fill="#a259ff" />
        <circle cx="12" cy="12" r="4" fill="#1abcfe" />
        <circle cx="6" cy="18" r="4" fill="#0acf83" />
      </svg>
    );
  }
  if (label.includes("blender")) {
    return (
      <svg width="24" height="18" viewBox="0 0 24 18" fill="none" aria-hidden="true">
        <path d="M9 3h8l4 4-4 8H8L3 10l6-7Z" stroke="#ef7d00" strokeWidth="1.8" />
        <circle cx="14" cy="9" r="3" stroke="#ef7d00" strokeWidth="1.8" />
      </svg>
    );
  }
  if (label.includes("davinci")) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 4v8l6 6M12 12l-6 6" stroke="var(--accent)" strokeWidth="1.6" />
      </svg>
    );
  }
  if (label.includes("capcut")) {
    return (
      <svg width="24" height="18" viewBox="0 0 24 18" fill="none" aria-hidden="true">
        <path d="M4 3h16L4 15h16M5 15L19 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (label.includes("ai")) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Z" stroke="var(--accent)" strokeWidth="1.6" />
        <path d="M19 15l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 12h8M12 8v8" stroke="var(--accent)" strokeWidth="1.6" />
    </svg>
  );
}
