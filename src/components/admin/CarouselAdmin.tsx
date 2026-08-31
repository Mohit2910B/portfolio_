"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseMediaUrl } from "@/lib/media-urls";
import type { CarouselItem, CarouselGlobalSettings } from "@/lib/constants";
import { DEFAULT_CAROUSEL_ITEMS } from "@/lib/constants";
import {
  Button,
  Card,
  Field,
  Notice,
  SectionTitle,
  Select,
  TextArea,
  TextInput,
  Toggle,
  Uploader,
  api,
  uploadBlob,
} from "./ui";
import { VideoAssetManager } from "./VideoAssetManager";

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

type ItemFormState = {
  title: string;
  category: string;
  description: string;
  duration: string;
  videoUrl: string;
  videoSource: string;
  thumbnailUrl: string;
  aspectRatio: string;
  isActive: boolean;
};

const EMPTY_FORM: ItemFormState = {
  title: "",
  category: "Video Edit",
  description: "",
  duration: "0:30",
  videoUrl: "",
  videoSource: "upload",
  thumbnailUrl: "",
  aspectRatio: "9:16",
  isActive: true,
};

const CATEGORY_PRESETS = [
  "Real Estate",
  "Product Video",
  "Commercial",
  "Social Reel",
  "Motion Graphics",
  "Brand Film",
  "Music & Event",
  "AI Video",
];

export function CarouselAdmin({ onChanged }: { onChanged?: () => void }) {
  const [globalSettings, setGlobalSettings] = useState<CarouselGlobalSettings>(DEFAULT_GLOBAL);
  const [items, setItems] = useState<CarouselItem[]>(DEFAULT_CAROUSEL_ITEMS);
  const [loading, setLoading] = useState(false);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // Filters & Search
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden">("all");

  // Item Modal (Create / Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ItemFormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [savingItem, setSavingItem] = useState(false);
  const [grabbingFrame, setGrabbingFrame] = useState(false);

  // Delete Confirmation Modal
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Drag-and-Drop state
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api<{
        globalSettings?: CarouselGlobalSettings;
        items?: CarouselItem[];
      }>("/api/admin/carousel");

      if (res.globalSettings) setGlobalSettings(res.globalSettings);
      if (Array.isArray(res.items)) setItems(res.items);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load carousel data.");
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
      const res = await api<{ globalSettings: CarouselGlobalSettings }>(
        "/api/admin/carousel/settings",
        {
          method: "PATCH",
          body: JSON.stringify(globalSettings),
        },
      );
      if (res.globalSettings) setGlobalSettings(res.globalSettings);
      showToast("Global showcase settings saved.");
      onChanged?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save settings.");
    } finally {
      setSavingGlobal(false);
    }
  };

  // 2. Open Create Modal
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setModalOpen(true);
  };

  // 3. Open Edit Modal
  const openEdit = (item: CarouselItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      category: item.category,
      description: item.description || "",
      duration: item.duration || "0:30",
      videoUrl: item.videoUrl || "",
      videoSource: item.videoSource || "upload",
      thumbnailUrl: item.thumbnailUrl || "",
      aspectRatio: item.aspectRatio || "9:16",
      isActive: item.isActive !== false,
    });
    setFieldErrors({});
    setModalOpen(true);
  };

  // 4. Save Carousel Item (Create / Edit)
  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = "Card title is required.";
    if (!form.category.trim()) errors.category = "Category is required.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSavingItem(true);
    setError("");
    try {
      if (editingId) {
        // Edit
        await api(`/api/admin/carousel/item/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });
        showToast(`Updated "${form.title}".`);
      } else {
        // Create
        await api("/api/admin/carousel", {
          method: "POST",
          body: JSON.stringify({
            ...form,
            sortOrder: items.length,
          }),
        });
        showToast(`Created "${form.title}".`);
      }
      setModalOpen(false);
      await load();
      onChanged?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save carousel card.");
    } finally {
      setSavingItem(false);
    }
  };

  // 5. Delete Item
  const deleteItem = async (id: number) => {
    setDeletingId(null);
    try {
      await api(`/api/admin/carousel/${id}`, { method: "DELETE" });
      showToast("Carousel card deleted.");
      await load();
      onChanged?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to delete carousel card.");
    }
  };

  // 6. Toggle Active / Hidden
  const toggleActive = async (item: CarouselItem) => {
    const nextActive = !item.isActive;
    const updated = items.map((i) => (i.id === item.id ? { ...i, isActive: nextActive } : i));
    setItems(updated);

    try {
      await api(`/api/admin/carousel/item/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: nextActive }),
      });
      showToast(nextActive ? `"${item.title}" enabled.` : `"${item.title}" hidden.`);
      onChanged?.();
    } catch {
      setItems(items);
      setError("Failed to update status.");
    }
  };

  // 7. Move Up / Down
  const moveItem = async (id: number, direction: "up" | "down") => {
    const list = [...items];
    const index = list.findIndex((i) => i.id === id);
    if (index === -1) return;
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= list.length) return;

    const temp = list[index];
    list[index] = list[target];
    list[target] = temp;

    const ordered = list.map((item, idx) => ({ ...item, sortOrder: idx }));
    setItems(ordered);

    try {
      await api("/api/admin/carousel/reorder", {
        method: "POST",
        body: JSON.stringify({
          items: ordered.map((i) => ({ id: i.id, sortOrder: i.sortOrder, isActive: i.isActive })),
        }),
      });
      showToast("Order updated.");
      onChanged?.();
    } catch {
      setError("Failed to save reordered cards.");
    }
  };

  // 8. Drag and Drop Reordering
  const handleDragStart = (id: number) => {
    setDraggedItemId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    if (dragOverItemId !== id) setDragOverItemId(id);
  };

  const handleDrop = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    if (draggedItemId === null || draggedItemId === targetId) {
      setDraggedItemId(null);
      setDragOverItemId(null);
      return;
    }

    const list = [...items];
    const srcIndex = list.findIndex((i) => i.id === draggedItemId);
    const destIndex = list.findIndex((i) => i.id === targetId);
    if (srcIndex === -1 || destIndex === -1) return;

    const [dragged] = list.splice(srcIndex, 1);
    list.splice(destIndex, 0, dragged);

    const ordered = list.map((item, idx) => ({ ...item, sortOrder: idx }));
    setItems(ordered);
    setDraggedItemId(null);
    setDragOverItemId(null);

    try {
      await api("/api/admin/carousel/reorder", {
        method: "POST",
        body: JSON.stringify({
          items: ordered.map((i) => ({ id: i.id, sortOrder: i.sortOrder, isActive: i.isActive })),
        }),
      });
      showToast("Order updated via drag-and-drop.");
      onChanged?.();
    } catch {
      setError("Failed to save reordered cards.");
    }
  };

  // Auto-Detect Duration from video stream or file
  const autoDetectDuration = (videoUrl: string) => {
    if (!videoUrl) return;
    try {
      const media = parseMediaUrl(videoUrl);
      const src = media.streamUrl || videoUrl;
      const v = document.createElement("video");
      v.preload = "metadata";
      v.src = src;
      v.onloadedmetadata = () => {
        if (v.duration && !isNaN(v.duration) && isFinite(v.duration)) {
          const sec = Math.round(v.duration);
          const m = Math.floor(sec / 60);
          const s = sec % 60;
          const formatted = `${m}:${s.toString().padStart(2, "0")}`;
          setForm((prev) => ({ ...prev, duration: formatted }));
          showToast(`⚡ Auto-grabbed duration: ${formatted}`);
        }
      };
    } catch {}
  };

  // 9. Frame Grabber from HTML5 Video
  const grabFrame = async (videoSrc?: string) => {
    const url = videoSrc || form.videoUrl;
    if (!url) {
      setError("Attach or paste a video URL first before grabbing a frame.");
      return;
    }
    setGrabbingFrame(true);
    setError("");
    try {
      const media = parseMediaUrl(url);
      const targetSrc = media.streamUrl || url;

      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.src = targetSrc;

      await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(() => resolve(), 5000);
        video.onloadeddata = () => {
          window.clearTimeout(timer);
          resolve();
        };
        video.onerror = () => {
          window.clearTimeout(timer);
          reject(new Error("Could not load direct video stream. Upload a thumbnail image below."));
        };
      });

      video.currentTime = Math.min(1.0, (video.duration || 3) / 3);
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
        window.setTimeout(resolve, 2000);
      });

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1080;
      canvas.height = video.videoHeight || 1920;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is not supported in this browser.");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85),
      );

      if (blob) {
        const uploaded = await uploadBlob(blob, "image", `thumb-frame-${Date.now()}.jpg`);
        if (uploaded?.url) {
          setForm((prev) => ({ ...prev, thumbnailUrl: uploaded.url }));
          showToast("Extracted and saved high-res thumbnail frame from video.");
        }
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Frame grabber failed. Upload an image.");
    } finally {
      setGrabbingFrame(false);
    }
  };

  // Categories list for filter
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.category) set.add(item.category);
    }
    return Array.from(set);
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchCat = item.category?.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchCat && !matchDesc) return false;
      }
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (statusFilter === "active" && !item.isActive) return false;
      if (statusFilter === "hidden" && item.isActive) return false;
      return true;
    });
  }, [items, search, categoryFilter, statusFilter]);

  const activeCount = useMemo(() => items.filter((i) => i.isActive).length, [items]);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <SectionTitle
          title="CAROUSEL MANAGER"
          subtitle="Manage the reference-style horizontal video showcase cards, drag to reorder, and configure playback settings."
          action={
            <Button variant="dark" onClick={openCreate} className="text-xs uppercase tracking-wider">
              + Add Video Card
            </Button>
          }
        />
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink/60">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 font-medium text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            {activeCount} active in carousel
          </span>
          <span className="text-ink/40">Total showcase items: {items.length}</span>
        </div>
      </div>

      {notice && <Notice tone="success">{notice}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      {/* ----------------- GLOBAL SETTINGS CARD ----------------- */}
      <Card className="p-6 md:p-8">
        <div className="flex items-center justify-between border-b border-black/5 pb-4">
          <div>
            <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-ink">
              Global Showcase Settings
            </h3>
            <p className="text-xs text-ink/60">
              Configure titles, autoplay timing, and navigation behavior.
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

            <Field label="Section Badge Tag" hint="Small pill badge above title (e.g. VIDEO SHOWCASE)">
              <TextInput
                value={globalSettings.sectionBadge || ""}
                onChange={(val) => setGlobalSettings({ ...globalSettings, sectionBadge: val })}
                placeholder="VIDEO SHOWCASE"
              />
            </Field>

            <Field label="Section Title" hint="Heading above the video cards (e.g. SELECTED WORKS)">
              <TextInput
                value={globalSettings.sectionTitle}
                onChange={(val) => setGlobalSettings({ ...globalSettings, sectionTitle: val })}
                placeholder="SELECTED WORKS"
              />
            </Field>

            <Field label="Section Subtitle" hint="Supporting tagline below the title">
              <TextArea
                rows={2}
                value={globalSettings.sectionSubtitle}
                onChange={(val) => setGlobalSettings({ ...globalSettings, sectionSubtitle: val })}
                placeholder="A curated showcase of video editing, motion design, and visual storytelling."
              />
            </Field>

            <Field label="Section Text Color" hint="Select typography tone">
              <Select
                value={globalSettings.textColor || "black"}
                onChange={(val) => setGlobalSettings({ ...globalSettings, textColor: val })}
                options={[
                  { value: "black", label: "Black / Dark (Recommended for Clean Look)" },
                  { value: "white", label: "White / Light" },
                ]}
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
                hint="Seconds before advancing to next card"
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

      {/* ----------------- CAROUSEL ITEMS LIST ----------------- */}
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-ink">
              Showcase Video Cards ({filteredItems.length})
            </h3>
            <p className="text-xs text-ink/60">
              Drag cards to reorder sequence or click edit to update video & thumbnail assets.
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-48">
              <TextInput
                value={search}
                onChange={(val) => setSearch(val)}
                placeholder="Search cards…"
              />
            </div>

            <div className="w-36">
              <Select
                value={categoryFilter}
                onChange={(val) => setCategoryFilter(val)}
                options={[
                  { value: "all", label: "All Categories" },
                  ...categoriesList.map((c) => ({ value: c, label: c })),
                ]}
              />
            </div>

            <div className="w-36">
              <Select
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as typeof statusFilter)}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "active", label: "Active Only" },
                  { value: "hidden", label: "Hidden Only" },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex h-48 items-center justify-center rounded-3xl border border-dashed border-black/10">
            <p className="text-sm font-medium text-ink/40">Loading carousel cards…</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredItems.length === 0 && (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-black/5 text-2xl">
              🎬
            </div>
            <h4 className="font-heading text-base font-bold text-ink">No carousel cards found</h4>
            <p className="mt-1 max-w-sm text-xs text-ink/60">
              Click &ldquo;+ Add Video Card&rdquo; above to create your first showcase item.
            </p>
            <Button variant="dark" onClick={openCreate} className="mt-4 text-xs">
              + Add Video Card
            </Button>
          </Card>
        )}

        {/* Cards Drag-and-Drop List */}
        {!loading && filteredItems.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredItems.map((item, index) => {
              const isFirst = index === 0;
              const isLast = index === filteredItems.length - 1;
              const isDragging = draggedItemId === item.id;
              const isOver = dragOverItemId === item.id;

              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item.id)}
                  onDragOver={(e) => handleDragOver(e, item.id)}
                  onDrop={(e) => void handleDrop(e, item.id)}
                  className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white p-3 shadow-sm transition-all duration-200 ${
                    isDragging
                      ? "opacity-30 scale-95 border-brand"
                      : isOver
                        ? "border-brand ring-2 ring-brand/30 shadow-lg"
                        : item.isActive
                          ? "border-black/10 hover:border-black/25 hover:shadow-md"
                          : "border-black/5 bg-black/[0.02] opacity-60"
                  }`}
                >
                  {/* Top: Drag Handle + Order Badge + Status */}
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="cursor-grab text-xs text-ink/30 hover:text-ink">⋮⋮</span>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/5 font-mono text-[10px] font-bold text-ink/60">
                        {index + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="rounded-md bg-black/5 px-2 py-0.5 text-[10px] font-medium text-ink/60">
                        {item.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => void toggleActive(item)}
                        title={item.isActive ? "Hide from carousel" : "Show in carousel"}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition ${
                          item.isActive
                            ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25"
                            : "bg-black/5 text-ink/40 hover:bg-black/10"
                        }`}
                      >
                        {item.isActive ? "Active" : "Hidden"}
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail / Video Box */}
                  <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-black/10">
                    {item.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-neutral-900 text-white/40">
                        <span className="text-2xl">🎬</span>
                        <span className="mt-1 text-[10px] uppercase tracking-wider">No Poster</span>
                      </div>
                    )}

                    {/* Center Play Icon Overlay */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/30 text-white backdrop-blur-md">
                        ▶
                      </div>
                    </div>

                    {/* Duration badge */}
                    {item.duration && (
                      <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-white">
                        {item.duration}
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="mt-2.5 min-w-0 flex-1">
                    <h4 className="truncate font-heading text-xs font-bold text-ink">{item.title}</h4>
                    {item.description && (
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-ink/50">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-2.5">
                    {/* Move Up / Down */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => void moveItem(item.id, "up")}
                        title="Move Left / Earlier"
                        className="rounded-lg p-1 text-xs text-ink/50 hover:bg-black/5 hover:text-ink disabled:opacity-20"
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => void moveItem(item.id, "down")}
                        title="Move Right / Later"
                        className="rounded-lg p-1 text-xs text-ink/50 hover:bg-black/5 hover:text-ink disabled:opacity-20"
                      >
                        ▶
                      </button>
                    </div>

                    {/* Edit & Delete */}
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="light"
                        onClick={() => openEdit(item)}
                        className="!px-2.5 !py-1 text-[10px] font-semibold"
                      >
                        Edit
                      </Button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(item.id)}
                        title="Delete Card"
                        className="rounded-lg p-1 text-xs text-ink/40 hover:bg-rose-500/10 hover:text-rose-600"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ----------------- CREATE / EDIT MODAL ----------------- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <div>
                <h3 className="font-heading text-lg font-bold text-ink">
                  {editingId ? "Edit Showcase Video Card" : "Add New Showcase Video Card"}
                </h3>
                <p className="text-xs text-ink/60">
                  Provide video file/URL and custom thumbnail for the horizontal carousel.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full p-2 text-ink/40 hover:bg-black/5 hover:text-ink"
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => void saveItem(e)} className="mt-6 space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Card Title" error={fieldErrors.title} hint="e.g. Modern Dining Experience">
                  <TextInput
                    value={form.title}
                    onChange={(val) => setForm({ ...form, title: val })}
                    placeholder="Enter title…"
                    required
                  />
                </Field>

                <Field label="Category" error={fieldErrors.category} hint="Select or type custom">
                  <TextInput
                    value={form.category}
                    onChange={(val) => setForm({ ...form, category: val })}
                    placeholder="e.g. Real Estate, Commercial, Social Reel"
                    required
                  />
                </Field>
              </div>

              {/* Category Presets Chips */}
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_PRESETS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat })}
                    className={`rounded-lg px-2.5 py-1 text-[10px] font-medium transition ${
                      form.category === cat
                        ? "bg-ink text-white"
                        : "bg-black/5 text-ink/60 hover:bg-black/10"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <Field label="Short Description (Optional)" hint="1-2 sentences for overlay or modal preview">
                <TextArea
                  rows={2}
                  value={form.description}
                  onChange={(val) => setForm({ ...form, description: val })}
                  placeholder="Describe the cut, pacing, or client project…"
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label={
                    <div className="flex items-center justify-between">
                      <span>Duration</span>
                      {form.videoUrl && (
                        <button
                          type="button"
                          onClick={() => autoDetectDuration(form.videoUrl)}
                          className="text-[10px] font-bold text-[var(--accent)] hover:underline"
                        >
                          ⚡ Grab from Video
                        </button>
                      )}
                    </div>
                  }
                  hint="Auto-grabbed on upload, e.g. 0:30, 0:45, 1:00"
                >
                  <TextInput
                    value={form.duration}
                    onChange={(val) => setForm({ ...form, duration: val })}
                    placeholder="0:30"
                  />
                </Field>

                <Field label="Aspect Ratio" hint="Vertical 9:16 matches reference">
                  <Select
                    value={form.aspectRatio}
                    onChange={(val) => setForm({ ...form, aspectRatio: val })}
                    options={[
                      { value: "9:16", label: "9:16 (Vertical / Reel / Short)" },
                      { value: "4:5", label: "4:5 (Portrait Feed)" },
                      { value: "16:9", label: "16:9 (Landscape)" },
                      { value: "1:1", label: "1:1 (Square)" },
                    ]}
                  />
                </Field>
              </div>

              {/* ---------------- UNIFIED VIDEO & POSTER ASSET MANAGER ---------------- */}
              <VideoAssetManager
                videoUrl={form.videoUrl}
                videoSource={form.videoSource === "url" ? "url" : "upload"}
                thumbnailUrl={form.thumbnailUrl}
                duration={form.duration}
                aspectRatio={form.aspectRatio}
                onVideoChange={(url, source, meta) => {
                  setForm((prev) => ({
                    ...prev,
                    videoUrl: url,
                    videoSource: source,
                    duration: meta?.durationFormatted || prev.duration,
                    aspectRatio: meta?.aspectRatio || prev.aspectRatio,
                  }));
                }}
                onThumbnailChange={(url) => {
                  setForm((prev) => ({ ...prev, thumbnailUrl: url }));
                }}
                onDurationChange={(formatted) => {
                  setForm((prev) => ({ ...prev, duration: formatted }));
                }}
                onAspectRatioChange={(ratio) => {
                  setForm((prev) => ({ ...prev, aspectRatio: ratio }));
                }}
              />

              <Toggle
                label="Published / Visible in Carousel"
                checked={form.isActive}
                onChange={(val) => setForm({ ...form, isActive: val })}
              />

              <div className="flex justify-end gap-3 border-t border-black/5 pt-4">
                <Button variant="light" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="dark" type="submit" disabled={savingItem}>
                  {savingItem ? "Saving Card…" : editingId ? "Update Card" : "Create Card"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ----------------- DELETE CONFIRMATION MODAL ----------------- */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 shadow-2xl">
            <h4 className="font-heading text-lg font-bold text-ink">Delete Showcase Card?</h4>
            <p className="mt-2 text-xs leading-relaxed text-ink/70">
              Are you sure you want to permanently delete this video card from the showcase
              carousel? Associated uploaded media will also be cleaned up.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="light" onClick={() => setDeletingId(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => void deleteItem(deletingId)}>
                Delete Permanently
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
