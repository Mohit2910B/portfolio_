"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Field,
  Notice,
  SectionTitle,
  Toggle,
  api,
} from "./ui";
import type { CarouselGlobalSettings } from "@/lib/constants";

const DEFAULT_GLOBAL: CarouselGlobalSettings = {
  id: 1,
  enabled: true,
  sectionBadge: "VIDEO SHOWCASE",
  sectionTitle: "SELECTED WORKS",
  sectionSubtitle:
    "A curated showcase of video editing, motion design, and visual storytelling.",
  textColor: "black",
  autoplay: true,
  autoplaySpeed: 5,
  infiniteLoop: true,
  showArrows: true,
  showDots: true,
  updatedAt: new Date(),
};

type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  projectCount: number;
  thumbnail?: string;
};

export function CarouselAdmin({ onChanged }: { onChanged?: () => void }) {
  const [globalSettings, setGlobalSettings] = useState<CarouselGlobalSettings>(DEFAULT_GLOBAL);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const showToast = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [carouselRes, categoryRes] = await Promise.all([
        api<{ globalSettings?: CarouselGlobalSettings }>("/api/admin/carousel"),
        api<{ categories: CategoryRow[] }>("/api/admin/categories"),
      ]);
      if (carouselRes.globalSettings) setGlobalSettings(carouselRes.globalSettings);
      if (Array.isArray(categoryRes.categories)) setCategories(categoryRes.categories);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load carousel data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveGlobal = async () => {
    setSavingGlobal(true);
    setError("");
    try {
      const res = await api<{ globalSettings: CarouselGlobalSettings }>(
        "/api/admin/carousel/settings",
        {
          method: "PATCH",
          body: JSON.stringify(globalSettings),
        },
      );
      if (res.globalSettings) setGlobalSettings(res.globalSettings);
      showToast("Carousel settings saved.");
      onChanged?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save settings.");
    } finally {
      setSavingGlobal(false);
    }
  };

  const toggleCategoryActive = async (cat: CategoryRow) => {
    const nextActive = !cat.isActive;
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, isActive: nextActive } : c)),
    );
    try {
      await api(`/api/admin/categories/${cat.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: nextActive, id: cat.id }),
      });
      showToast(
        nextActive
          ? `"${cat.name}" is now visible in the carousel.`
          : `"${cat.name}" is now hidden from the carousel.`,
      );
      onChanged?.();
    } catch {
      await load();
      setError("Failed to update category visibility.");
    }
  };

  // Categories that appear in carousel = active + have projects
  const carouselCategories = categories.filter((c) => c.isActive && c.projectCount > 0);
  const hiddenCategories = categories.filter((c) => !c.isActive || c.projectCount === 0);

  return (
    <div>
      <SectionTitle
        title="Carousel Manager"
        subtitle="The carousel is automatically built from your active categories. Each active category with at least one published project becomes a carousel slide."
        action={
          <div className="flex flex-wrap gap-2">
            <a
              href="/admin?section=categories"
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-ink/5 px-4 py-2 text-xs font-semibold tracking-wide text-ink/70 transition hover:bg-ink/10"
            >
              🏷️ Manage Categories
            </a>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-ink/5 px-4 py-2 text-xs font-semibold tracking-wide text-ink/70 transition hover:bg-ink/10"
            >
              🔗 View Website
            </a>
          </div>
        }
      />

      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      {notice && (
        <div className="mb-4">
          <Notice tone="success">{notice}</Notice>
        </div>
      )}

      {/* Info Banner */}
      <div className="mb-6 rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">🎬</span>
          <div>
            <p className="text-sm font-semibold text-ink">Category-Driven Dynamic Carousel</p>
            <p className="mt-1 text-xs leading-relaxed text-ink/60">
              Your website carousel is automatically generated from active categories.{" "}
              <strong>Add a category → it instantly appears in the carousel.</strong>{" "}
              Delete or disable a category → it disappears automatically.
              No manual carousel item records needed.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-black text-[var(--accent)]">{carouselCategories.length}</p>
          <p className="mt-1 text-[0.6rem] font-semibold uppercase tracking-widest text-ink/50">
            Active Slides
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-black text-ink/70">{categories.length}</p>
          <p className="mt-1 text-[0.6rem] font-semibold uppercase tracking-widest text-ink/50">
            Total Categories
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-black text-ink/70">
            {categories.reduce((sum, c) => sum + (c.projectCount ?? 0), 0)}
          </p>
          <p className="mt-1 text-[0.6rem] font-semibold uppercase tracking-widest text-ink/50">
            Total Projects
          </p>
        </Card>
      </div>

      {/* CAROUSEL PREVIEW — Active Categories */}
      <Card className="mb-6 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="display text-base font-semibold">
              Carousel Slides ({carouselCategories.length})
            </h3>
            <p className="mt-0.5 text-xs text-ink/50">
              These categories appear as slides on the public website carousel.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-ink/40">Loading categories…</p>
        ) : carouselCategories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/20 py-12 text-center">
            <p className="text-2xl">🎞️</p>
            <p className="mt-2 text-sm font-semibold text-ink/60">No carousel slides yet</p>
            <p className="mt-1 text-xs text-ink/40">
              Add categories with published projects to populate the carousel.
            </p>
            <a
              href="/admin?section=categories"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white"
            >
              + Add Category
            </a>
          </div>
        ) : (
          <div className="grid gap-3">
            {carouselCategories.map((cat, idx) => (
              <div
                key={cat.id}
                className="flex items-center gap-4 rounded-2xl border border-ink/8 bg-paper/50 p-3 transition hover:border-ink/20"
              >
                {/* Order Number */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/8 text-xs font-black text-ink/50">
                  {String(idx + 1).padStart(2, "0")}
                </div>

                {/* Thumbnail */}
                <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-ink/8">
                  {cat.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cat.thumbnail}
                      alt={cat.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-base">🎬</div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold uppercase tracking-wide text-ink">
                    {cat.name}
                  </p>
                  <p className="text-[0.65rem] text-ink/45">
                    {cat.projectCount} project{cat.projectCount !== 1 ? "s" : ""}
                    {cat.description ? ` · ${cat.description.slice(0, 40)}` : ""}
                  </p>
                </div>

                {/* Status Badge */}
                <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-widest text-emerald-700">
                  ● Active
                </span>

                {/* Hide Button */}
                <button
                  type="button"
                  onClick={() => void toggleCategoryActive(cat)}
                  className="shrink-0 rounded-lg border border-ink/15 px-3 py-1.5 text-[0.65rem] font-semibold text-ink/60 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
                >
                  Hide
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Hidden / Empty Categories */}
      {hiddenCategories.length > 0 && (
        <Card className="mb-6 p-5">
          <h3 className="display mb-3 text-base font-semibold text-ink/60">
            Hidden / Empty Categories ({hiddenCategories.length})
          </h3>
          <p className="mb-4 text-xs text-ink/40">
            These categories are hidden from the carousel — either disabled or have no published projects.
          </p>
          <div className="grid gap-2">
            {hiddenCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-4 rounded-xl border border-ink/6 bg-ink/3 p-3 opacity-60"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/6 text-xs font-black text-ink/30">
                  —
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink/60">{cat.name}</p>
                  <p className="text-[0.65rem] text-ink/35">
                    {cat.projectCount === 0
                      ? "No published projects"
                      : "Category is hidden"}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-amber-500/10 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-widest text-amber-700">
                  {cat.projectCount === 0 ? "Empty" : "Hidden"}
                </span>
                {!cat.isActive && (
                  <button
                    type="button"
                    onClick={() => void toggleCategoryActive(cat)}
                    className="shrink-0 rounded-lg border border-ink/15 px-3 py-1.5 text-[0.65rem] font-semibold text-ink/60 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    Show
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Global Settings */}
      <Card className="p-5">
        <h3 className="display mb-4 text-base font-semibold">Carousel Display Settings</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Carousel Section Badge">
            <input
              type="text"
              value={globalSettings.sectionBadge}
              onChange={(e) => setGlobalSettings((s) => ({ ...s, sectionBadge: e.target.value }))}
              className="w-full rounded-xl border border-ink/15 bg-paper px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20"
              placeholder="VIDEO SHOWCASE"
            />
          </Field>
          <Field label="Section Title">
            <input
              type="text"
              value={globalSettings.sectionTitle}
              onChange={(e) => setGlobalSettings((s) => ({ ...s, sectionTitle: e.target.value }))}
              className="w-full rounded-xl border border-ink/15 bg-paper px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20"
              placeholder="SELECTED WORKS"
            />
          </Field>
          <Field label="Section Subtitle" className="sm:col-span-2">
            <input
              type="text"
              value={globalSettings.sectionSubtitle}
              onChange={(e) => setGlobalSettings((s) => ({ ...s, sectionSubtitle: e.target.value }))}
              className="w-full rounded-xl border border-ink/15 bg-paper px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20"
              placeholder="A curated showcase…"
            />
          </Field>
          <Field label="Autoplay Speed (seconds)">
            <input
              type="number"
              min={2}
              max={30}
              value={globalSettings.autoplaySpeed}
              onChange={(e) => setGlobalSettings((s) => ({ ...s, autoplaySpeed: Number(e.target.value) }))}
              className="w-full rounded-xl border border-ink/15 bg-paper px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20"
            />
          </Field>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Toggle
            label="Autoplay"
            description="Automatically cycle through carousel slides"
            checked={globalSettings.autoplay}
            onChange={(v) => setGlobalSettings((s) => ({ ...s, autoplay: v }))}
          />
          <Toggle
            label="Show Navigation Arrows"
            description="Display left/right navigation arrows"
            checked={globalSettings.showArrows}
            onChange={(v) => setGlobalSettings((s) => ({ ...s, showArrows: v }))}
          />
          <Toggle
            label="Show Dots"
            description="Display slide indicator dots"
            checked={globalSettings.showDots}
            onChange={(v) => setGlobalSettings((s) => ({ ...s, showDots: v }))}
          />
          <Toggle
            label="Infinite Loop"
            description="Loop carousel back to start"
            checked={globalSettings.infiniteLoop}
            onChange={(v) => setGlobalSettings((s) => ({ ...s, infiniteLoop: v }))}
          />
          <Toggle
            label="Carousel Enabled"
            description="Show/hide the entire carousel section"
            checked={globalSettings.enabled}
            onChange={(v) => setGlobalSettings((s) => ({ ...s, enabled: v }))}
          />
        </div>

        <div className="mt-5 flex justify-end">
          <Button variant="dark" onClick={saveGlobal} disabled={savingGlobal}>
            {savingGlobal ? "Saving…" : "Save Carousel Settings"}
          </Button>
        </div>
      </Card>

      {/* Help */}
      <div className="mt-4 rounded-2xl border border-ink/8 bg-ink/3 p-4">
        <p className="text-xs font-semibold text-ink/60 mb-2">How the Carousel Works</p>
        <ul className="space-y-1 text-xs text-ink/45">
          <li>✅ Add a <strong>Category</strong> → it automatically appears as a carousel slide</li>
          <li>✅ Add <strong>Projects</strong> to that category → their video/thumbnail powers the slide</li>
          <li>✅ Reorder categories → carousel order changes automatically</li>
          <li>✅ Disable a category → hidden from carousel instantly</li>
          <li>✅ Empty categories (no published projects) are hidden automatically</li>
        </ul>
        <a
          href="/admin?section=categories"
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white"
        >
          🏷️ Manage Categories →
        </a>
      </div>
    </div>
  );
}
