"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Field,
  Notice,
  SectionTitle,
  Select,
  TextInput,
  TextArea,
  Toggle,
  api,
} from "./ui";

export type CarouselProject = {
  id: number;
  title: string;
  description: string;
  categoryId: number | null;
  categoryLabel?: string;
  categoryName?: string;
  videoUrl: string;
  videoSource: string;
  thumbnailUrl: string;
  aspectRatio: string;
  displaySize: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  carouselEnabled: boolean;
  carouselPinned: boolean;
  carouselOrder: number;
};

export type GlobalCarouselSettings = {
  id: number;
  enabled: boolean;
  sectionTitle: string;
  sectionSubtitle: string;
  autoplay: boolean;
  autoplaySpeed: number;
  infiniteLoop: boolean;
  showArrows: boolean;
  showDots: boolean;
};

const DEFAULT_GLOBAL: GlobalCarouselSettings = {
  id: 1,
  enabled: true,
  sectionTitle: "Selected Works",
  sectionSubtitle: "A curated showcase of video editing, motion design, and visual storytelling.",
  autoplay: true,
  autoplaySpeed: 5,
  infiniteLoop: true,
  showArrows: true,
  showDots: true,
};

export function CarouselAdmin({ onChanged }: { onChanged?: () => void }) {
  const [globalSettings, setGlobalSettings] = useState<GlobalCarouselSettings>(DEFAULT_GLOBAL);
  const [projects, setProjects] = useState<CarouselProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // Filters & Search
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "in-carousel" | "hidden">("all");
  const [pinnedFilter, setPinnedFilter] = useState<"all" | "pinned" | "unpinned">("all");

  // Remove confirmation modal
  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api<{
        globalSettings?: GlobalCarouselSettings;
        projects?: CarouselProject[];
      }>("/api/admin/carousel");

      if (res.globalSettings) {
        setGlobalSettings(res.globalSettings);
      }
      if (Array.isArray(res.projects)) {
        setProjects(res.projects);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load carousel data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const showToast = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3500);
  };

  // 1. Save Global Settings
  const saveGlobal = async () => {
    setSavingGlobal(true);
    setError("");
    try {
      const res = await api<{ globalSettings: GlobalCarouselSettings }>("/api/admin/carousel/settings", {
        method: "PATCH",
        body: JSON.stringify(globalSettings),
      });
      if (res.globalSettings) {
        setGlobalSettings(res.globalSettings);
      }
      showToast("Global carousel settings saved.");
      onChanged?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save settings.");
    } finally {
      setSavingGlobal(false);
    }
  };

  // 2. Toggle Pin
  const togglePin = async (id: number) => {
    const current = projects.find((p) => p.id === id);
    if (!current) return;
    const nextPinned = !current.carouselPinned;

    const updated = projects.map((p) => (p.id === id ? { ...p, carouselPinned: nextPinned } : p));
    setProjects(updated);

    try {
      await api(`/api/admin/carousel/project/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ carouselPinned: nextPinned }),
      });
      showToast(nextPinned ? `Pinned "${current.title}" to top of carousel.` : `Unpinned "${current.title}".`);
      onChanged?.();
    } catch {
      setProjects(projects);
      setError("Failed to update pin status.");
    }
  };

  // 3. Toggle In-Carousel (Enabled / Disabled)
  const toggleEnabled = async (id: number) => {
    const current = projects.find((p) => p.id === id);
    if (!current) return;
    const nextEnabled = !current.carouselEnabled;

    const updated = projects.map((p) => (p.id === id ? { ...p, carouselEnabled: nextEnabled } : p));
    setProjects(updated);

    try {
      await api(`/api/admin/carousel/project/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ carouselEnabled: nextEnabled }),
      });
      showToast(nextEnabled ? `"${current.title}" enabled in carousel.` : `"${current.title}" hidden from carousel.`);
      onChanged?.();
    } catch {
      setProjects(projects);
      setError("Failed to update carousel visibility.");
    }
  };

  // 4. Remove from carousel (explicit action)
  const removeFromCarousel = async (id: number) => {
    setConfirmRemoveId(null);
    const current = projects.find((p) => p.id === id);
    if (!current) return;

    const updated = projects.map((p) => (p.id === id ? { ...p, carouselEnabled: false, carouselPinned: false } : p));
    setProjects(updated);

    try {
      await api(`/api/admin/carousel/project/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ carouselEnabled: false, carouselPinned: false }),
      });
      showToast(`Removed "${current.title}" from carousel (preserved in Portfolio CMS).`);
      onChanged?.();
    } catch {
      setProjects(projects);
      setError("Failed to remove project from carousel.");
    }
  };

  // 5. Move Up / Down
  const moveProject = async (id: number, direction: "up" | "down") => {
    const list = [...projects];
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const ordered = list.map((item, idx) => ({ ...item, carouselOrder: idx }));
    setProjects(ordered);
    setSavingOrder(true);

    try {
      await api("/api/admin/carousel/reorder", {
        method: "PATCH",
        body: JSON.stringify({
          items: ordered.map((p) => ({
            id: p.id,
            carouselOrder: p.carouselOrder,
            carouselPinned: p.carouselPinned,
            carouselEnabled: p.carouselEnabled,
          })),
        }),
      });
      showToast("Carousel order updated.");
      onChanged?.();
    } catch {
      setError("Failed to save reordered list.");
    } finally {
      setSavingOrder(false);
    }
  };

  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) {
      const cat = p.categoryLabel || p.categoryName || "General";
      if (cat) set.add(cat);
    }
    return Array.from(set);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = p.title?.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q);
        const matchCat = (p.categoryLabel || p.categoryName || "").toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }
      if (categoryFilter !== "all") {
        const cat = p.categoryLabel || p.categoryName || "General";
        if (cat !== categoryFilter) return false;
      }
      if (visibilityFilter === "in-carousel" && !p.carouselEnabled) return false;
      if (visibilityFilter === "hidden" && p.carouselEnabled) return false;
      if (pinnedFilter === "pinned" && !p.carouselPinned) return false;
      if (pinnedFilter === "unpinned" && p.carouselPinned) return false;

      return true;
    });
  }, [projects, search, categoryFilter, visibilityFilter, pinnedFilter]);

  const activeInCarouselCount = useMemo(
    () => projects.filter((p) => p.carouselEnabled).length,
    [projects],
  );

  const pinnedCount = useMemo(
    () => projects.filter((p) => p.carouselPinned && p.carouselEnabled).length,
    [projects],
  );

  return (
    <div className="space-y-10">
      <div>
        <SectionTitle
          title="CAROUSEL MANAGER"
          subtitle="Control which projects appear in the homepage carousel, their order, visibility and presentation."
        />
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink/60">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 font-medium text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            {activeInCarouselCount} in carousel
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 font-medium text-amber-600">
            ★ {pinnedCount} pinned
          </span>
          <span className="text-ink/40">Total portfolio items: {projects.length}</span>
        </div>
      </div>

      {notice && <Notice tone="success">{notice}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      {/* ----------------- GLOBAL SETTINGS ----------------- */}
      <Card className="p-6 md:p-8">
        <div className="flex items-center justify-between border-b border-black/5 pb-4">
          <div>
            <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-ink">
              Global Showcase Settings
            </h3>
            <p className="text-xs text-ink/60">
              Configure homepage carousel behavior and display titles.
            </p>
          </div>
          <Button
            variant="dark"
            disabled={savingGlobal}
            onClick={saveGlobal}
            className="text-xs uppercase tracking-wider"
          >
            {savingGlobal ? "Saving…" : "Save Settings"}
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <Toggle
              label="Enable Carousel on Homepage"
              checked={globalSettings.enabled}
              onChange={(val) => setGlobalSettings({ ...globalSettings, enabled: val })}
            />

            <Field label="Section Title" hint="Primary heading above the showcase">
              <TextInput
                value={globalSettings.sectionTitle}
                onChange={(val) =>
                  setGlobalSettings({ ...globalSettings, sectionTitle: val })
                }
                placeholder="Selected Works"
              />
            </Field>

            <Field label="Section Subtitle" hint="Supporting tagline below the title">
              <TextArea
                rows={2}
                value={globalSettings.sectionSubtitle}
                onChange={(val) =>
                  setGlobalSettings({ ...globalSettings, sectionSubtitle: val })
                }
                placeholder="A curated showcase of video editing..."
              />
            </Field>
          </div>

          <div className="space-y-4 rounded-2xl bg-black/[0.02] p-5">
            <Toggle
              label="Autoplay Carousel"
              checked={globalSettings.autoplay}
              onChange={(val) => setGlobalSettings({ ...globalSettings, autoplay: val })}
            />

            {globalSettings.autoplay && (
              <Field
                label={`Autoplay Interval: ${globalSettings.autoplaySpeed}s`}
                hint="Seconds per project card transition"
              >
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={2}
                    max={12}
                    step={1}
                    value={globalSettings.autoplaySpeed}
                    onChange={(e) =>
                      setGlobalSettings({
                        ...globalSettings,
                        autoplaySpeed: Number(e.target.value),
                      })
                    }
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-black/15 accent-brand"
                  />
                  <span className="w-12 text-right font-mono text-sm font-semibold text-ink">
                    {globalSettings.autoplaySpeed}s
                  </span>
                </div>
              </Field>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2">
              <Toggle
                label="Infinite Loop"
                checked={globalSettings.infiniteLoop}
                onChange={(val) => setGlobalSettings({ ...globalSettings, infiniteLoop: val })}
              />

              <Toggle
                label="Navigation Arrows"
                checked={globalSettings.showArrows}
                onChange={(val) => setGlobalSettings({ ...globalSettings, showArrows: val })}
              />

              <Toggle
                label="Pagination Dots"
                checked={globalSettings.showDots}
                onChange={(val) => setGlobalSettings({ ...globalSettings, showDots: val })}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* ----------------- PROJECT MANAGEMENT ----------------- */}
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-ink">
              Showcase Projects ({filteredProjects.length})
            </h3>
            <p className="text-xs text-ink/60">
              Pin prioritized projects, toggle carousel visibility, or adjust sequence order.
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-48">
              <TextInput
                value={search}
                onChange={(val) => setSearch(val)}
                placeholder="Search projects…"
              />
            </div>

            <div className="w-36">
              <Select
                value={categoryFilter}
                onChange={(val) => setCategoryFilter(val)}
                options={[
                  { value: "all", label: "All Categories" },
                  ...categoriesList.map((cat) => ({ value: cat, label: cat })),
                ]}
              />
            </div>

            <div className="w-36">
              <Select
                value={visibilityFilter}
                onChange={(val) => setVisibilityFilter(val as typeof visibilityFilter)}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "in-carousel", label: "In Carousel" },
                  { value: "hidden", label: "Hidden" },
                ]}
              />
            </div>

            <div className="w-32">
              <Select
                value={pinnedFilter}
                onChange={(val) => setPinnedFilter(val as typeof pinnedFilter)}
                options={[
                  { value: "all", label: "All Items" },
                  { value: "pinned", label: "★ Pinned" },
                  { value: "unpinned", label: "Normal" },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex h-48 items-center justify-center rounded-3xl border border-dashed border-black/10">
            <p className="text-sm font-medium text-ink/40">Loading portfolio projects…</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredProjects.length === 0 && (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-black/5 text-2xl">
              📂
            </div>
            <h4 className="font-heading text-base font-bold text-ink">No projects match filters</h4>
            <p className="mt-1 max-w-sm text-xs text-ink/60">
              Try changing search query or category filters. You can create projects in the
              Portfolio section.
            </p>
            {(search || categoryFilter !== "all" || visibilityFilter !== "all" || pinnedFilter !== "all") && (
              <Button
                variant="light"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("all");
                  setVisibilityFilter("all");
                  setPinnedFilter("all");
                }}
                className="mt-4 text-xs"
              >
                Clear all filters
              </Button>
            )}
          </Card>
        )}

        {/* Project Cards List */}
        {!loading && filteredProjects.length > 0 && (
          <div className="space-y-3">
            {filteredProjects.map((project, index) => {
              const isFirst = index === 0;
              const isLast = index === filteredProjects.length - 1;
              const category = project.categoryLabel || project.categoryName || "General";

              return (
                <div
                  key={project.id}
                  className={`group relative flex flex-col gap-4 rounded-2xl border p-4 transition-all duration-200 md:flex-row md:items-center md:justify-between ${
                    project.carouselPinned
                      ? "border-amber-500/30 bg-amber-500/[0.03] shadow-sm"
                      : project.carouselEnabled
                        ? "border-black/10 bg-white/80 hover:border-black/20"
                        : "border-black/5 bg-black/[0.02] opacity-60"
                  }`}
                >
                  {/* Left: Thumbnail + Details */}
                  <div className="flex items-center gap-4">
                    {/* Position order number */}
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/5 font-mono text-xs font-bold text-ink/50">
                      {index + 1}
                    </div>

                    {/* Thumbnail preview */}
                    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-black/10">
                      {project.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={project.thumbnailUrl}
                          alt={project.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-ink/30">
                          No Poster
                        </div>
                      )}
                      {project.videoUrl && (
                        <div className="absolute bottom-1 right-1 rounded-md bg-black/70 px-1 py-0.5 text-[9px] font-bold text-white">
                          ▶ VIDEO
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="truncate font-heading text-sm font-bold text-ink">
                          {project.title}
                        </h4>
                        {project.carouselPinned && (
                          <span className="inline-flex items-center rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            ★ PINNED
                          </span>
                        )}
                        <span className="rounded-md bg-black/5 px-2 py-0.5 text-[10px] font-medium text-ink/60">
                          {category}
                        </span>
                        <span className="rounded-md bg-black/5 px-1.5 py-0.5 text-[10px] font-mono text-ink/40">
                          {project.aspectRatio || "16:9"}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-ink/50">
                        {project.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    {/* Pin button */}
                    <button
                      type="button"
                      onClick={() => togglePin(project.id)}
                      title={project.carouselPinned ? "Unpin project" : "Pin to top of carousel"}
                      className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                        project.carouselPinned
                          ? "bg-amber-500 text-white shadow-sm hover:bg-amber-600"
                          : "bg-black/5 text-ink/60 hover:bg-black/10 hover:text-ink"
                      }`}
                    >
                      {project.carouselPinned ? "★ Pinned" : "☆ Pin"}
                    </button>

                    {/* Enable / Disable toggle */}
                    <button
                      type="button"
                      onClick={() => toggleEnabled(project.id)}
                      title={project.carouselEnabled ? "Hide from carousel" : "Show in carousel"}
                      className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                        project.carouselEnabled
                          ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25"
                          : "bg-black/5 text-ink/40 hover:bg-black/10 hover:text-ink"
                      }`}
                    >
                      {project.carouselEnabled ? "✓ In Carousel" : "✕ Hidden"}
                    </button>

                    {/* Up / Down Reorder */}
                    <div className="flex items-center rounded-xl bg-black/5 p-0.5">
                      <button
                        type="button"
                        disabled={isFirst || savingOrder}
                        onClick={() => moveProject(project.id, "up")}
                        title="Move Up"
                        className="rounded-lg p-1.5 text-xs text-ink/60 transition hover:bg-white hover:text-ink disabled:opacity-20"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={isLast || savingOrder}
                        onClick={() => moveProject(project.id, "down")}
                        title="Move Down"
                        className="rounded-lg p-1.5 text-xs text-ink/60 transition hover:bg-white hover:text-ink disabled:opacity-20"
                      >
                        ▼
                      </button>
                    </div>

                    {/* Remove from Carousel button */}
                    {project.carouselEnabled && (
                      <button
                        type="button"
                        onClick={() => setConfirmRemoveId(project.id)}
                        title="Remove from Carousel (Keeps project in Portfolio CMS)"
                        className="rounded-xl p-2 text-xs text-ink/40 transition hover:bg-rose-500/10 hover:text-rose-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal: Remove from Carousel */}
      {confirmRemoveId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 shadow-2xl">
            <h4 className="font-heading text-lg font-bold text-ink">
              Remove from Carousel?
            </h4>
            <p className="mt-2 text-xs leading-relaxed text-ink/70">
              This will hide the project from the homepage showcase.{" "}
              <strong className="text-emerald-700">
                The project will remain completely safe in your Portfolio CMS.
              </strong>
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="light" onClick={() => setConfirmRemoveId(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => confirmRemoveId && removeFromCarousel(confirmRemoveId)}
              >
                Remove from Carousel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
