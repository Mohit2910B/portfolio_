"use client";

export interface ServiceItem {
  id: number;
  title: string;
  description: string;
  deliverables?: string;
  icon?: string;
}

interface ServicesProps {
  services?: ServiceItem[];
  introText?: string;
}

const DEFAULT_SERVICES_LIST: ServiceItem[] = [
  {
    id: 1,
    title: "Video Editing",
    description: "Professional editing for social media reels, commercial advertisements, promotional videos, brand films, and digital campaigns.",
    deliverables: "Reels, Commercials, Promotional Videos, Brand Films",
  },
  {
    id: 2,
    title: "Graphic Design",
    description: "Creative posters, advertising banners, thumbnails, marketing creatives, and visually engaging brand collateral.",
    deliverables: "Posters, Advertising Banners, Thumbnails, Marketing Creatives",
  },
  {
    id: 3,
    title: "Motion Graphics & VFX",
    description: "Dynamic animations, visual effects compositing, animated typography, seamless transitions, and motion-driven narratives.",
    deliverables: "Animations, Visual Effects, Animated Typography, Transitions",
  },
  {
    id: 4,
    title: "3D Design & Visualization",
    description: "Creative 3D modeling, product visualization, photorealistic renders, and immersive visual presentations.",
    deliverables: "3D Modeling, Product Visualization, Realistic Renders",
  },
  {
    id: 5,
    title: "AI-Powered Content Creation",
    description: "AI-generated images, synthetic video clips, virtual models/characters, and innovative digital creative concepts.",
    deliverables: "AI Images, AI Videos, Virtual Models, Creative Concepts",
  },
  {
    id: 6,
    title: "Social Media Content",
    description: "Platform-optimized video edits, promotional creatives, and viral visual content designed for high retention and engagement.",
    deliverables: "Platform-Ready Edits, Promotional Creatives, High-Retention Formats",
  },
];

export default function Services({ services = [], introText }: ServicesProps) {
  const displayServices = services.length > 0 ? services : DEFAULT_SERVICES_LIST;

  return (
    <section id="services" className="py-24 border-b border-[var(--border-glass)] relative">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <span className="font-mono text-xs tracking-[0.2em] text-[var(--accent)] uppercase font-bold">
              04 // MY SERVICES
            </span>
            <h2 className="font-serif font-bold text-4xl sm:text-6xl tracking-tight text-[var(--text-primary)]">
              Creative Services.
            </h2>
            <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed">
              {introText || "Professional creative services tailored for brands, businesses, creators, and agencies worldwide."}
            </p>
          </div>
        </div>

        {/* Floating Glass Editorial Rows */}
        <div className="space-y-4">
          {displayServices.map((service, idx) => (
            <div
              key={service.id || idx}
              className="glass-panel p-8 group hover:border-[var(--accent)]/60 transition-all duration-300 grid grid-cols-1 md:grid-cols-12 gap-6 items-center rounded-2xl"
            >
              <div className="md:col-span-1 font-mono text-sm text-[var(--accent)] font-bold">
                0{idx + 1}
              </div>

              <div className="md:col-span-4 font-serif font-bold text-2xl tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                {service.title}
              </div>

              <div className="md:col-span-5 space-y-2">
                <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed">
                  {service.description}
                </p>
                {service.deliverables && (
                  <div className="font-mono text-xs text-[var(--text-primary)] tracking-wide">
                    <span className="text-[var(--accent)]">DELIVERABLES:</span> {service.deliverables}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 flex flex-col md:items-end justify-center">
                <a
                  href="#contact"
                  className="inline-block px-5 py-2.5 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.16)] font-mono text-[10px] text-[var(--text-primary)] hover:bg-[var(--accent)] hover:text-[var(--bg-main)] hover:border-[var(--accent)] transition-all uppercase tracking-widest font-bold shadow-lg"
                >
                  DISCUSS PROJECT →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
