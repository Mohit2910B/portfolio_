"use client";

import { useMemo, useState } from "react";
import type { SiteData, PublicProject, CarouselItem } from "@/lib/data";
import VideoPlayer from "@/components/site/VideoPlayer";

export default function WorkCarousel({ data }: { data: SiteData }) {
  const { carouselItems = [], projects = [] } = data;
  const [activeIndex, setActiveIndex] = useState(0);

  // Combine active DB carousel items or DB projects as fallback
  const items = useMemo(() => {
    if (carouselItems.length > 0) return carouselItems;
    if (projects.length > 0) {
      return projects.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.categoryLabel || "Video",
        description: p.description,
        duration: p.durationSeconds ? `${p.durationSeconds}s` : "0:30",
        videoUrl: p.videoUrl,
        videoSource: p.videoSource,
        thumbnailUrl: p.thumbnailUrl,
        aspectRatio: p.aspectRatio || "16:9",
        isActive: true,
        sortOrder: p.sortOrder,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));
    }
    return [];
  }, [carouselItems, projects]);

  // Requirement 3: If 0 records in database, show NO carousel items.
  if (items.length === 0) {
    return null;
  }

  const activeItem = items[activeIndex] || items[0];

  return (
    <section className="relative overflow-hidden bg-[#070709] py-16 text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-[#e0147f]">
            VIDEO SHOWCASE
          </span>
          <h2 className="font-heading text-3xl font-black uppercase text-white sm:text-5xl">
            SELECTED WORKS
          </h2>
        </div>

        <div className="mt-10 mx-auto max-w-4xl">
          {activeItem.videoUrl ? (
            <VideoPlayer
              key={activeItem.id}
              src={activeItem.videoUrl}
              poster={activeItem.thumbnailUrl}
              ratio={activeItem.aspectRatio}
              autoPlay={false}
            />
          ) : activeItem.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeItem.thumbnailUrl}
              alt={activeItem.title}
              className="w-full aspect-video object-cover rounded-2xl"
            />
          ) : (
            <div className="aspect-video w-full grid place-items-center rounded-2xl bg-neutral-900 font-mono text-xs text-white/40">
              [NO VIDEO PREVIEW]
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="font-mono text-xs text-[#e0147f] uppercase font-bold">
                {activeItem.category}
              </p>
              <h3 className="font-heading text-lg font-bold uppercase text-white">
                {activeItem.title}
              </h3>
            </div>

            {items.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1))}
                  className="rounded-full border border-white/20 p-2 text-white hover:bg-white/10"
                  aria-label="Previous slide"
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
                  aria-label="Next slide"
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
