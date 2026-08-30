"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ProjectViewer from "./ProjectViewer";
import { SectionHeading } from "./Sections";
import { aspectPadding, buildCarousel, configForCategory, formatDuration } from "@/lib/carousel";
import type { PublicProject, SiteData } from "@/lib/data";

type Category = { id: number; name: string; slug: string };

export default function WorkCarousel({ data }: { data: SiteData }) {
  const projects = data.projects;
  const categories: Category[] = data.categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
  }));

  const [activeCategory, setActiveCategory] = useState<number | null>(() => {
    const realEstate = categories.find((category) => category.name.toLowerCase() === "real estate");
    return realEstate?.id ?? null;
  });
  const [index, setIndex] = useState(0);
  const [viewer, setViewer] = useState<PublicProject | null>(null);
  const [vw, setVw] = useState(1280);
  const [drag, setDrag] = useState(0);
  const dragState = useRef<{ startX: number; active: boolean }>({ startX: 0, active: false });
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    const frame = requestAnimationFrame(onResize);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const config = useMemo(
    () => configForCategory(data.carouselSettings, activeCategory),
    [data.carouselSettings, activeCategory],
  );

  const items = useMemo(
    () => buildCarousel(projects, activeCategory, config),
    [projects, activeCategory, config],
  );

  useEffect(() => {
    setIndex(0);
  }, [activeCategory]);

  const gap = vw >= 1024 ? 28 : vw >= 640 ? 20 : 14;
  const dims = useMemo(() => {
    if (vw >= 1024)
      return { large: [660, 470], medium: [420, 330], small: [270, 225] } as const;
    if (vw >= 640) return { large: [480, 380], medium: [330, 275], small: [215, 190] } as const;
    return { large: [315, 300], medium: [235, 235], small: [155, 165] } as const;
  }, [vw]);

  const sizeOf = useCallback(
    (size: string) => {
      const key = (size === "large" || size === "medium" || size === "small" ? size : "medium") as
        | "large"
        | "medium"
        | "small";
      const [baseW, maxH] = dims[key];
      return { baseW, maxH };
    },
    [dims],
  );

  const measured = useMemo(() => {
    const boxes = items.map((project) => {
      const { baseW, maxH } = sizeOf(project.displaySize || "medium");
      const [rw, rh] = (project.aspectRatio || "16:9").split(":").map(Number);
      const ratio = rw && rh ? rw / rh : 16 / 9;
      const width = Math.round(Math.min(baseW, maxH * ratio));
      return { width, height: Math.round(width / ratio) };
    });
    return boxes.map((box, index) => ({
      ...box,
      offset: boxes.slice(0, index).reduce((sum, item) => sum + item.width + gap, 0),
    }));
  }, [items, sizeOf, gap]);

  const containerWidth = vw < 1024 ? vw - 32 : Math.min(vw * 0.92, 1400);
  const centerOffset = measured[index] ? measured[index].offset + measured[index].width / 2 : 0;
  const translate = containerWidth / 2 - centerOffset + drag;

  const goTo = useCallback(
    (next: number) => {
      if (items.length === 0) return;
      setIndex(((next % items.length) + items.length) % items.length);
    },
    [items.length],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (viewer) return;
      const node = containerRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.8 && rect.bottom > window.innerHeight * 0.2;
      if (!inView) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(index + 1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(index - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, index, viewer]);

  const onPointerDown = (event: React.PointerEvent) => {
    dragState.current = { startX: event.clientX, active: true };
  };
  const onPointerMove = (event: React.PointerEvent) => {
    if (!dragState.current.active) return;
    setDrag(event.clientX - dragState.current.startX);
  };
  const onPointerUp = () => {
    if (!dragState.current.active) return;
    const delta = drag;
    dragState.current.active = false;
    setDrag(0);
    if (Math.abs(delta) > 70) {
      goTo(delta < 0 ? index + 1 : index - 1);
    }
  };

  const counts = useMemo(() => {
    const map = new Map<number, number>();
    projects.forEach((p) => {
      if (p.categoryId) map.set(p.categoryId, (map.get(p.categoryId) ?? 0) + 1);
    });
    return map;
  }, [projects]);

  return (
    <section id="work" className="relative px-0 py-20 lg:py-28">
      <div className="px-4 sm:px-6">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Selected work"
            title="The Portfolio"
            description="Edits, motion pieces and design work — filter by category and open a project to play it full frame."
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Previous project"
              className="grid h-11 w-11 place-items-center rounded-full border border-ink/15 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Next project"
              className="grid h-11 w-11 place-items-center rounded-full border border-ink/15 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* filters */}
        <div className="mx-auto mt-10 max-w-[1400px]">
          <div
            role="tablist"
            aria-label="Portfolio categories"
            className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
          >
            <FilterChip
              label="All"
              count={projects.length}
              active={activeCategory === null}
              onClick={() => setActiveCategory(null)}
            />
            {categories.map((category) => (
              <FilterChip
                key={category.id}
                label={category.name}
                count={counts.get(category.id) ?? 0}
                active={activeCategory === category.id}
                onClick={() => setActiveCategory(category.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* carousel */}
      <div
        ref={containerRef}
        className="relative mt-10 select-none overflow-hidden py-6"
        style={{ cursor: drag !== 0 ? "grabbing" : "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        aria-roledescription="carousel"
        aria-label="Portfolio carousel"
        tabIndex={0}
      >
        {items.length === 0 ? (
          <div className="glass mx-auto max-w-md rounded-3xl p-10 text-center">
            <p className="text-sm text-ink/60">
              No published projects in this category yet. Check back soon or view all work.
            </p>
            <button type="button" onClick={() => setActiveCategory(null)} className="btn btn-ghost btn-xs mt-5">
              View all work
            </button>
          </div>
        ) : (
          <div
            className={`car-track ${drag !== 0 ? "dragging" : ""}`}
            style={{ transform: `translate3d(${translate}px, 0, 0)`, gap: `${gap}px` }}
          >
            {items.map((project, i) => {
              const box = measured[i];
              const isCenter = i === index;
              const distance = Math.abs(i - index);
              return (
                <article
                  key={project.id}
                  className={`car-item ${isCenter ? "z-10" : "z-0"}`}
                  style={{
                    width: box.width,
                    opacity: distance > 2 ? 0.35 : 1,
                    filter: isCenter ? "none" : "saturate(0.35) brightness(1.02)",
                  }}
                  aria-hidden={distance > 2}
                >
                  <button
                    type="button"
                    onClick={() => (isCenter ? setViewer(project) : setIndex(i))}
                    aria-label={`Open project ${project.title}`}
                    className="group relative block w-full overflow-hidden rounded-[22px] bg-ink text-left shadow-[0_30px_80px_-50px_rgba(11,11,12,0.85)]"
                    style={{ height: box.height }}
                  >
                    <span
                      className="absolute inset-0 block"
                      style={{ paddingBottom: aspectPadding(project.aspectRatio) }}
                    />
                    {project.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={project.thumbnailUrl}
                        alt={project.title}
                        loading={distance <= 1 ? "eager" : "lazy"}
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.04]"
                      />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center bg-gradient-to-br from-ink-2 to-black text-[0.7rem] uppercase tracking-[0.2em] text-white/40">
                        No thumbnail
                      </span>
                    )}

                    <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    <span className="absolute left-3 top-3 flex items-center gap-2">
                      <span className="rounded-md border border-white/20 bg-black/45 px-2 py-1 text-[0.5rem] font-semibold uppercase tracking-[0.16em] text-white/85 backdrop-blur-md">
                        {project.aspectRatio}
                      </span>
                      {project.durationSeconds ? (
                        <span className="rounded-md border border-white/20 bg-black/45 px-2 py-1 text-[0.5rem] font-semibold tracking-[0.1em] text-white/85 backdrop-blur-md">
                          {formatDuration(project.durationSeconds)}
                        </span>
                      ) : null}
                      {project.featured ? (
                        <span className="rounded-md bg-[var(--accent)] px-2 py-1 text-[0.5rem] font-semibold uppercase tracking-[0.16em] text-white">
                          Featured
                        </span>
                      ) : null}
                    </span>

                    <span
                      className={`absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/35 bg-white/12 backdrop-blur-md transition-all duration-500 ${
                        isCenter ? "h-14 w-14 opacity-100" : "h-10 w-10 opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>

                    <span className="absolute inset-x-3 bottom-3">
                      <span className="block text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-white/60">
                        {project.categoryLabel}
                        {project.year ? ` · ${project.year}` : ""}
                      </span>
                      <span
                        className={`display mt-1.5 block text-white ${
                          isCenter ? "text-base sm:text-lg" : "text-[0.8rem]"
                        }`}
                      >
                        {project.title}
                      </span>
                      {isCenter && project.description && (
                        <span className="mt-2 line-clamp-2 hidden text-[0.72rem] leading-relaxed text-white/65 sm:block">
                          {project.description}
                        </span>
                      )}
                    </span>
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* pagination */}
      {items.length > 0 && (
        <div className="mx-auto mt-6 flex max-w-[1400px] flex-col items-center gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            {items.map((project, i) => (
              <button
                key={`dot-${project.id}`}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to ${project.title}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === index ? "w-8 bg-[var(--accent)]" : "w-1.5 bg-ink/20 hover:bg-ink/40"
                }`}
              />
            ))}
          </div>
          <p className="mono text-[0.6rem] uppercase tracking-[0.2em] text-ink/40">
            {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")} · drag or use ← →
          </p>
        </div>
      )}

      <ProjectViewer project={viewer} onClose={() => setViewer(null)} />
    </section>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] transition-all duration-300 ${
        active
          ? "border-ink bg-ink text-white"
          : "border-ink/12 bg-white/50 text-ink/60 hover:border-ink/35 hover:text-ink"
      }`}
    >
      {label}
      <span className={`mono text-[0.55rem] ${active ? "text-white/60" : "text-ink/30"}`}>
        {count}
      </span>
    </button>
  );
}
