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

const DEFAULT_TOOLS_LIST: ToolItem[] = [
  { id: 1, name: "Premiere Pro", category: "Video Editing", proficiency: 98, description: "Adobe Premiere Pro" },
  { id: 2, name: "After Effects", category: "Motion Graphics", proficiency: 96, description: "Adobe After Effects" },
  { id: 3, name: "DaVinci Resolve", category: "Color & Finishing", proficiency: 95, description: "DaVinci Resolve Studio" },
  { id: 4, name: "CapCut Pro", category: "Short-Form / Reels", proficiency: 99, description: "CapCut Pro" },
  { id: 5, name: "Photoshop", category: "Graphic Design", proficiency: 98, description: "Adobe Photoshop" },
  { id: 6, name: "Illustrator", category: "Graphic Design", proficiency: 94, description: "Adobe Illustrator" },
  { id: 7, name: "Canva Pro", category: "Graphic Design", proficiency: 96, description: "Canva Pro" },
  { id: 8, name: "Blender", category: "3D Design", proficiency: 92, description: "Blender 3D" },
  { id: 9, name: "Autodesk Maya", category: "3D Design", proficiency: 90, description: "Autodesk Maya" },
  { id: 10, name: "AI Image Creation", category: "AI Creation", proficiency: 98, description: "Midjourney & Diffusion" },
  { id: 11, name: "AI Video Creation", category: "AI Creation", proficiency: 97, description: "Runway, Kling & Luma" },
  { id: 12, name: "Color & Sound VFX", category: "Post-Production", proficiency: 95, description: "Sound Design & VFX" },
];

export default function Tools({ tools = [] }: ToolsProps) {
  const displayTools = tools.length > 0 ? tools : DEFAULT_TOOLS_LIST;

  return (
    <section id="tools" className="py-24 border-b border-[var(--border-glass)] relative">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="space-y-3">
          <span className="font-mono text-xs tracking-[0.2em] text-[var(--accent)] uppercase font-bold">
            05 // SOFTWARE & TOOLS
          </span>
          <h2 className="font-serif font-bold text-4xl sm:text-6xl tracking-tight text-[var(--text-primary)]">
            Production Tools.
          </h2>
          <p className="text-sm text-[var(--text-secondary)] font-light max-w-xl leading-relaxed">
            Industry-standard software stack powering video post-production, motion design, 3D visualization, and AI workflows.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayTools.map((tool) => (
            <div
              key={tool.id}
              className="glass-panel p-6 space-y-3 hover:border-[var(--accent)] transition-all rounded-xl text-left flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-[var(--accent)] uppercase tracking-widest font-bold">
                  {tool.category || "SOFTWARE"}
                </span>
                <span className="font-mono text-[10px] text-emerald-400 font-bold">
                  {tool.proficiency}%
                </span>
              </div>

              <div className="font-serif font-bold text-xl tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                {tool.name}
              </div>

              <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-600 to-[var(--accent)] h-full rounded-full transition-all duration-1000"
                  style={{ width: `${tool.proficiency}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
