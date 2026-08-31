"use client";

import type { SiteData } from "@/lib/data";
import SpotlightReelCarousel from "./SpotlightReelCarousel";

export default function WorkCarousel({ data }: { data: SiteData }) {
  const { carouselItems = [], projects = [] } = data;

  const activeCarousel = carouselItems.filter((i) => i.isActive !== false);
  const activeProjects = projects.filter((p) => p.published !== false);

  if (activeCarousel.length === 0 && activeProjects.length === 0) {
    return null;
  }

  return (
    <section className="relative bg-[#070709] py-8 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-[#e0147f]">
            VIDEO SHOWCASE
          </span>
          <h2 className="font-heading text-3xl font-black uppercase text-white sm:text-5xl">
            SELECTED WORKS
          </h2>
        </div>

        <SpotlightReelCarousel carouselItems={activeCarousel} projects={activeProjects} />
      </div>
    </section>
  );
}
