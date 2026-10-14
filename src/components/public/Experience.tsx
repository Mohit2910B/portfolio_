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

const DEFAULT_EXPERIENCE_ITEMS: ExperienceItem[] = [
  {
    id: 1,
    role: "Video Editing",
    company: "Reels, Commercials & Promotional Videos",
    description: "Delivering high-retention social media reels, corporate commercial campaigns, brand stories, and dynamic promotional videos.",
    startDate: "2024",
    endDate: "PRESENT",
    location: "Worldwide / Remote",
  },
  {
    id: 2,
    role: "Graphic Design",
    company: "Posters, Advertisements & Marketing Creatives",
    description: "Designing high-conversion visual marketing collateral, YouTube thumbnails, advertising banners, and eye-catching event posters.",
    startDate: "2024",
    endDate: "PRESENT",
    location: "Worldwide / Remote",
  },
  {
    id: 3,
    role: "Motion Graphics & VFX",
    company: "Animation, Visual Effects & Transitions",
    description: "Crafting custom kinetic typography, dynamic intro animations, clean visual effects compositing, and seamless camera tracking.",
    startDate: "2024",
    endDate: "PRESENT",
    location: "Worldwide / Remote",
  },
  {
    id: 4,
    role: "3D Art",
    company: "Product Visualization & 3D Design",
    description: "Building detailed 3D models, photorealistic product renders, and engaging spatial presentations using Blender & Maya.",
    startDate: "2024",
    endDate: "PRESENT",
    location: "Worldwide / Remote",
  },
  {
    id: 5,
    role: "AI Creation",
    company: "AI Images, Videos & Virtual Characters",
    description: "Leveraging cutting-edge generative AI models to create hyper-realistic visuals, AI character animations, and innovative digital art.",
    startDate: "2025",
    endDate: "PRESENT",
    location: "Worldwide / Remote",
  },
];

export default function Experience({ items = [] }: ExperienceProps) {
  const displayItems = items.length > 0 ? items : DEFAULT_EXPERIENCE_ITEMS;

  return (
    <section id="experience" className="py-24 border-b border-[var(--border-glass)] relative">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <span className="font-mono text-xs tracking-[0.2em] text-[var(--accent)] uppercase font-bold">
              03 // SKILLSET & BACKGROUND
            </span>
            <h2 className="font-serif font-bold text-4xl sm:text-6xl tracking-tight text-[var(--text-primary)] uppercase">
              EXPERIENCE & EXPERTISE
            </h2>
          </div>

          <div className="px-5 py-2.5 rounded-full glass-panel border border-[var(--accent)]/40 flex items-center space-x-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="font-mono text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
              2+ YEARS — CREATIVE EXPERIENCE
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {displayItems.map((exp, idx) => (
            <div
              key={exp.id || idx}
              className="glass-panel p-8 hover:border-[var(--accent)]/50 transition-all duration-300 grid grid-cols-1 md:grid-cols-12 gap-6 items-center rounded-2xl group"
            >
              <div className="md:col-span-1 font-mono text-sm text-[var(--accent)] font-bold">
                0{idx + 1}
              </div>

              <div className="md:col-span-4 space-y-1">
                <h3 className="font-serif font-bold text-2xl tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                  {exp.role}
                </h3>
                <div className="font-mono text-xs tracking-wider text-[var(--accent)] font-medium">
                  {exp.company}
                </div>
              </div>

              <div className="md:col-span-5">
                <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed">
                  {exp.description}
                </p>
              </div>

              <div className="md:col-span-2 md:text-right font-mono text-xs text-[var(--text-secondary)] space-y-1">
                <div className="text-[var(--text-primary)] font-bold">
                  {exp.startDate} — {exp.endDate}
                </div>
                <div className="text-[10px] text-[var(--accent)]">{exp.location}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
