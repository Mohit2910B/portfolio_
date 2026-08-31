"use client";

import { useMemo, useState } from "react";
import type { CarouselItem, PublicProject } from "@/lib/data";

type Props = {
  carouselItems?: CarouselItem[];
  projects?: PublicProject[];
  onSelectProject?: (p: PublicProject) => void;
};

export default function SpotlightReelCarousel({
  carouselItems = [],
  projects = [],
  onSelectProject,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  const items = useMemo(() => {
    if (carouselItems.length > 0) return carouselItems;
    if (projects.length > 0) {
      return projects.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.categoryLabel || "Reel",
        description: p.description,
        duration: p.durationSeconds ? `${p.durationSeconds}s` : "0:30",
        videoUrl: p.videoUrl,
        videoSource: p.videoSource,
        thumbnailUrl: p.thumbnailUrl,
        aspectRatio: p.aspectRatio || "9:16",
        isActive: true,
        sortOrder: p.sortOrder,
        rawProject: p,
      }));
    }
    return [];
  }, [carouselItems, projects]);

  if (items.length === 0) {
    return null;
  }

  const current = items[activeIndex] || items[0];

  return (
    <div className="relative mx-auto max-w-5xl py-8">
      <div className="relative aspect-video w-full overflow-hidden rounded-3xl bg-neutral-900 border border-white/10 p-6 flex flex-col justify-between">
        {current.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.thumbnailUrl}
            alt={current.title}
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
        ) : null}

        <div className="relative z-10 flex justify-between items-start">
          <span className="rounded-full bg-[#e0147f] px-3 py-1 font-mono text-[10px] uppercase font-bold text-white">
            ★ {current.category}
          </span>
          <span className="font-mono text-xs text-white/70">{current.duration}</span>
        </div>

        <div className="relative z-10 space-y-2">
          <h3 className="font-heading text-2xl font-bold uppercase text-white">
            {current.title}
          </h3>
          <p className="text-xs text-white/70 max-w-lg leading-relaxed">
            {current.description}
          </p>

          {(current as unknown as { rawProject?: PublicProject }).rawProject && onSelectProject && (
            <button
              type="button"
              onClick={() => onSelectProject((current as unknown as { rawProject: PublicProject }).rawProject)}
              className="btn btn-accent btn-sm mt-3"
            >
              Watch Video Modal ▶
            </button>
          )}
        </div>
      </div>

      {items.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1))}
            className="rounded-full border border-white/20 p-2 text-white hover:bg-white/10"
          >
            ←
          </button>
          <span className="font-mono text-xs text-white/60">
            {activeIndex + 1} / {items.length}
          </span>
          <button
            type="button"
            onClick={() => setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0))}
            className="rounded-full border border-white/20 p-2 text-white hover:bg-white/10"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
