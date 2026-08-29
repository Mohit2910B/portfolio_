import type { PublicProject } from "@/lib/data";

export type CarouselConfig = {
  slots: number;
  centerSize: string;
  sideSize: string;
  autoFill: boolean;
  projectIds: number[];
};

export type CarouselSettingRow = {
  categoryId: number | null;
  slots: number;
  centerSize: string;
  sideSize: string;
  autoFill: boolean;
  projectIds: string;
  isActive: boolean;
  sortOrder: number;
};

export const DEFAULT_CAROUSEL: CarouselConfig = {
  slots: 5,
  centerSize: "large",
  sideSize: "small",
  autoFill: true,
  projectIds: [],
};

export function parseIds(raw: string): number[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.map((v) => Number(v)).filter((v) => Number.isFinite(v));
  } catch {
    return [];
  }
}

export function configForCategory(
  settings: CarouselSettingRow[],
  categoryId: number | null,
): CarouselConfig {
  const match = settings.find((s) => s.isActive && s.categoryId === categoryId);
  if (!match) return { ...DEFAULT_CAROUSEL, ...(categoryId === null ? {} : {}) };
  return {
    slots: Math.min(Math.max(match.slots ?? 5, 1), 24),
    centerSize: match.centerSize || "large",
    sideSize: match.sideSize || "small",
    autoFill: match.autoFill,
    projectIds: parseIds(match.projectIds),
  };
}

/**
 * Builds the ordered carousel list for a category.
 * Pinned projects (from Carousel Manager) come first, then auto-filled
 * featured projects, then the remaining published projects.
 */
export function buildCarousel(
  projects: PublicProject[],
  categoryId: number | null,
  config: CarouselConfig,
): PublicProject[] {
  const inCategory = projects.filter(
    (p) => categoryId === null || p.categoryId === categoryId,
  );

  const pinned = config.projectIds
    .map((id) => inCategory.find((p) => p.id === id))
    .filter((p): p is PublicProject => Boolean(p));

  const rest = inCategory.filter((p) => !pinned.includes(p));
  const featured = rest.filter((p) => p.featured);
  const others = rest.filter((p) => !p.featured);

  const ordered = [...pinned, ...featured, ...others];
  if (config.slots > 0) return ordered.slice(0, config.slots);
  return ordered;
}

/** Size ramp: [small, medium, LARGE CENTER, medium, small] */
export function sizeRamp(index: number, total: number, config: CarouselConfig) {
  const distance = Math.abs(index - total / 2 + 0.5);
  if (distance < 0.6) return config.centerSize || "large";
  if (distance < 1.6) return config.sideSize === "small" ? "medium" : "medium";
  return "small";
}

export function aspectPadding(ratio: string): string {
  const [w, h] = ratio.split(":").map((n) => Number(n));
  if (!w || !h) return "56.25%";
  return `${(h / w) * 100}%`;
}

export function formatDuration(seconds?: number | null): string {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
