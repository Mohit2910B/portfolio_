"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseMediaUrl } from "@/lib/media-urls";
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

export type AdminProject = {
  id: number;
  title: string;
  description: string;
  categoryId: number | null;
  categoryName: string;
  categoryLabel: string;
  aiLabType: string;
  year: number | null;
  sortOrder: number;
  software: string;
  tags: string;
  externalLink: string;
  videoSource: string;
  videoUrl: string;
  thumbnailUrl: string;
  aspectRatio: string;
  displaySize: string;
  displayWidth: number | null;
  displayHeight: number | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  featured: boolean;
  published: boolean;
  demoStatus: string;
};

export type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  projectCount: number;
};

type FormState = {
  title: string;
  description: string;
  categoryId: string;
  aiLabType: string;
  year: string;
  sortOrder: string;
  software: string;
  tags: string;
  externalLink: string;
  videoSource: string;
  videoUrl: string;
  thumbnailUrl: string;
  aspectRatio: string;
  displaySize: string;
  displayWidth: string;
  displayHeight: string;
  width: string;
  height: string;
  durationSeconds: string;
  featured: boolean;
  published: boolean;
  demoStatus: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  categoryId: "",
  aiLabType: "",
  year: String(new Date().getFullYear()),
  sortOrder: "",
  software: "",
  tags: "",
  externalLink: "",
  videoSource: "url",
  videoUrl: "",
  thumbnailUrl: "",
  aspectRatio: "16:9",
  displaySize: "medium",
  displayWidth: "",
  displayHeight: "",
  width: "",
  height: "",
  durationSeconds: "",
  featured: false,
  published: true,
  demoStatus: "none",
};

const RATIOS = ["16:9", "9:16", "1:1", "4:5", "4:3", "21:9"];
const SIZES = ["small", "medium", "large"];

import { DEFAULT_PROJECTS, DEFAULT_CATEGORIES } from "@/lib/constants";

export function PortfolioAdmin({ onChanged }: { onChanged: () => void }) {
  const [projects, setProjects] = useState<AdminProject[]>(
    DEFAULT_PROJECTS.map((p) => ({
      ...p,
      categoryName: p.categoryLabel,
      displayWidth: p.displayWidth ?? null,
      displayHeight: p.displayHeight ?? null,
      width: p.width ?? null,
      height: p.height ?? null,
      durationSeconds: p.durationSeconds ?? null,
    })),
  );
  const [categories, setCategories] = useState<AdminCategory[]>(
    DEFAULT_CATEGORIES.map((c) => ({
      ...c,
      projectCount: 0,
    })),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [replaceId, setReplaceId] = useState<number | null>(null);
  const [replaceUrl, setReplaceUrl] = useState("");
  const [grabbing, setGrabbing] = useState(false);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    try {
      const [projectPayload, categoryPayload] = await Promise.all([
        api<{ projects: AdminProject[] }>("/api/admin/projects"),
        api<{ categories: AdminCategory[] }>("/api/admin/categories"),
      ]);
      setProjects(projectPayload.projects);
      setCategories(categoryPayload.categories);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return projects.filter((project) => {
      if (categoryFilter && String(project.categoryId ?? "") !== categoryFilter) return false;
      if (statusFilter === "published" && !project.published) return false;
      if (statusFilter === "draft" && project.published) return false;
      if (!term) return true;
      return (
        project.title.toLowerCase().includes(term) ||
        project.categoryLabel.toLowerCase().includes(term) ||
        project.tags.toLowerCase().includes(term)
      );
    });
  }, [projects, categoryFilter, statusFilter, search]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFieldErrors({});
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEdit = (project: AdminProject) => {
    setForm({
      title: project.title,
      description: project.description,
      categoryId: project.categoryId ? String(project.categoryId) : "",
      aiLabType: project.aiLabType,
      year: project.year ? String(project.year) : "",
      sortOrder: String(project.sortOrder ?? ""),
      software: project.software,
      tags: project.tags,
      externalLink: project.externalLink,
      videoSource: project.videoSource || "url",
      videoUrl: project.videoUrl,
      thumbnailUrl: project.thumbnailUrl,
      aspectRatio: project.aspectRatio,
      displaySize: project.displaySize,
      displayWidth: project.displayWidth ? String(project.displayWidth) : "",
      displayHeight: project.displayHeight ? String(project.displayHeight) : "",
      width: project.width ? String(project.width) : "",
      height: project.height ? String(project.height) : "",
      durationSeconds: project.durationSeconds ? String(project.durationSeconds) : "",
      featured: project.featured,
      published: project.published,
      demoStatus: project.demoStatus,
    });
    setEditingId(project.id);
    setFieldErrors({});
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const patch = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = "Project title is required.";
    if (!form.categoryId) errors.categoryId = "Category is required.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const body = {
        ...form,
        categoryId: Number(form.categoryId),
        year: form.year ? Number(form.year) : null,
        sortOrder: form.sortOrder ? Number(form.sortOrder) : undefined,
        displayWidth: form.displayWidth ? Number(form.displayWidth) : null,
        displayHeight: form.displayHeight ? Number(form.displayHeight) : null,
        width: form.width ? Number(form.width) : null,
        height: form.height ? Number(form.height) : null,
        durationSeconds: form.durationSeconds ? Number(form.durationSeconds) : null,
      };
      if (editingId) {
        await api(`/api/admin/projects/${editingId}`, { method: "PATCH", body: JSON.stringify(body) });
        setNotice("Project updated — the website now shows the latest version.");
      } else {
        await api("/api/admin/projects", { method: "POST", body: JSON.stringify(body) });
        setNotice("Project created and published to the website.");
      }
      setFormOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      await load();
      onChanged();
    } catch (caught) {
      const err = caught as Error & { details?: Record<string, string> };
      setFieldErrors(err.details ?? {});
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const action = async (fn: () => Promise<void>, message?: string) => {
    try {
      await fn();
      if (message) {
        setNotice(message);
        window.setTimeout(() => setNotice(""), 3000);
      }
      await load();
      onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Action failed.");
    }
  };

  const move = (project: AdminProject, direction: "up" | "down") =>
    action(
      () =>
        api("/api/admin/projects/reorder", {
          method: "POST",
          body: JSON.stringify({ id: project.id, direction }),
        }),
      "Order updated.",
    );

  const togglePublished = (project: AdminProject) =>
    action(
      () =>
        api(`/api/admin/projects/${project.id}`, {
          method: "PATCH",
          body: JSON.stringify({ published: !project.published }),
        }),
      project.published ? "Project unpublished." : "Project published.",
    );

  const toggleFeatured = (project: AdminProject) =>
    action(
      () =>
        api(`/api/admin/projects/${project.id}`, {
          method: "PATCH",
          body: JSON.stringify({ featured: !project.featured }),
        }),
      project.featured ? "Project removed from featured." : "Project marked as featured.",
    );

  const toggleCategory = async (cat: AdminCategory) => {
    const nextActive = cat.isActive === false ? true : false;
    setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, isActive: nextActive } : c)));
    try {
      await api(`/api/admin/categories/${cat.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: nextActive }),
      });
      setNotice(nextActive ? `Category "${cat.name}" is now visible on website.` : `Category "${cat.name}" is now hidden from website.`);
      window.setTimeout(() => setNotice(""), 3500);
      onChanged();
    } catch {
      await load();
      setError("Failed to update category visibility.");
    }
  };

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
          patch("durationSeconds", String(sec));
          setNotice(`⚡ Auto-grabbed video duration: ${sec}s.`);
        }
      };
    } catch {}
  };

  const remove = (project: AdminProject) => {
    if (!window.confirm(`Delete “${project.title}”? This cannot be undone.`)) return;
    void action(
      () => api(`/api/admin/projects/${project.id}`, { method: "DELETE" }),
      "Project deleted.",
    );
  };

  const grabFrame = async (videoUrl: string) => {
    if (!videoUrl) {
      setError("Add a video URL or upload a video first.");
      return;
    }
    setGrabbing(true);
    try {
      const media = parseMediaUrl(videoUrl);

      // 1. YouTube & Drive thumbnail extraction
      if (media.thumbnailUrl) {
        patch("thumbnailUrl", media.thumbnailUrl);
        setNotice(`Thumbnail automatically generated from ${media.type === "youtube" ? "YouTube" : "Google Drive"}!`);
        return;
      }

      // 2. Instagram handling
      if (media.type === "instagram") {
        setNotice("Instagram Reel/Post recognized! Instagram displays its native thumbnail in the player. You can also upload a custom thumbnail below.");
        return;
      }

      // 3. Vimeo thumbnail extraction
      if (media.type === "vimeo" && media.id) {
        try {
          const vRes = await fetch(`https://vimeo.com/api/v2/video/${media.id}.json`);
          if (vRes.ok) {
            const vData = (await vRes.json()) as Array<{ thumbnail_large?: string }>;
            if (vData[0]?.thumbnail_large) {
              patch("thumbnailUrl", vData[0].thumbnail_large);
              setNotice("Vimeo thumbnail automatically attached.");
              return;
            }
          }
        } catch {
          /* continue to direct frame grab */
        }
      }

      // 4. Direct HTML5 video frame grab
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.src = media.streamUrl || videoUrl;

      await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(() => resolve(), 4000);
        video.onloadeddata = () => {
          window.clearTimeout(timer);
          resolve();
        };
        video.onerror = () => {
          window.clearTimeout(timer);
          reject(new Error("Could not load direct video stream. You can upload a thumbnail image below."));
        };
      });

      video.currentTime = Math.min(1.2, (video.duration || 3) / 3);
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
        window.setTimeout(resolve, 2000);
      });

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is not available in this browser.");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((result) => resolve(result), "image/jpeg", 0.85),
      );
      if (blob) {
        try {
          const uploaded = await uploadBlob(blob, "image", `thumb-${Date.now()}.jpg`);
          if (uploaded && uploaded.url && !uploaded.url.startsWith("/api/files/")) {
            patch("thumbnailUrl", uploaded.url);
          } else {
            patch("thumbnailUrl", dataUrl);
          }
        } catch {
          patch("thumbnailUrl", dataUrl);
        }
      } else {
        patch("thumbnailUrl", dataUrl);
      }
      setNotice("Thumbnail frame grabbed from the video!");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not grab a frame.");
    } finally {
      setGrabbing(false);
    }
  };

  return (
    <div>
      <SectionTitle
        title="Portfolio"
        subtitle="Every project on the website comes from this list. Publish to make it visible, unpublish to hide it."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="light" onClick={() => setView(view === "grid" ? "list" : "grid")}>
              {view === "grid" ? "List view" : "Grid view"}
            </Button>
            <Button variant="dark" onClick={openCreate}>
              Add project
            </Button>
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

      {formOpen && (
        <Card className="mb-6 p-6">
          <form onSubmit={save} className="grid gap-5">
            <div className="flex items-center justify-between">
              <h3 className="display text-lg">{editingId ? "Edit project" : "Add project"}</h3>
              <Button variant="ghost" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Project title *" error={fieldErrors.title}>
                <TextInput
                  value={form.title}
                  onChange={(v) => patch("title", v)}
                  placeholder="Project name"
                  invalid={Boolean(fieldErrors.title)}
                  required
                />
              </Field>
              <Field label="Category *" error={fieldErrors.categoryId}>
                <Select
                  value={form.categoryId}
                  onChange={(v) => patch("categoryId", v)}
                  placeholder="Select a category"
                  invalid={Boolean(fieldErrors.categoryId)}
                  options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
                />
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <TextArea
                  value={form.description}
                  onChange={(v) => patch("description", v)}
                  placeholder="What is the piece about? Style, deliverables, notes."
                  rows={3}
                />
              </Field>
              <Field label="AI lab type">
                <TextInput
                  value={form.aiLabType}
                  onChange={(v) => patch("aiLabType", v)}
                  placeholder="e.g. AI upscale, AI generation"
                />
              </Field>
              <Field label="Year">
                <TextInput value={form.year} onChange={(v) => patch("year", v)} type="number" />
              </Field>
              <Field label="Sort order" hint="Lower numbers appear first.">
                <TextInput value={form.sortOrder} onChange={(v) => patch("sortOrder", v)} type="number" />
              </Field>
              <Field label="Demo status">
                <Select
                  value={form.demoStatus}
                  onChange={(v) => patch("demoStatus", v)}
                  options={[
                    { value: "none", label: "Released" },
                    { value: "demo", label: "Demo" },
                    { value: "live", label: "Live" },
                  ]}
                />
              </Field>
              <Field label="Software used">
                <TextInput
                  value={form.software}
                  onChange={(v) => patch("software", v)}
                  placeholder="Premiere Pro, After Effects…"
                />
              </Field>
              <Field label="Tags" hint="Comma separated.">
                <TextInput value={form.tags} onChange={(v) => patch("tags", v)} placeholder="reel, colour, motion" />
              </Field>
              <Field label="External link" className="sm:col-span-2">
                <TextInput
                  value={form.externalLink}
                  onChange={(v) => patch("externalLink", v)}
                  placeholder="https://…"
                />
              </Field>
            </div>

            <div className="pt-2">
              <VideoAssetManager
                videoUrl={form.videoUrl}
                videoSource={form.videoSource === "url" ? "url" : "upload"}
                thumbnailUrl={form.thumbnailUrl}
                duration={form.durationSeconds}
                aspectRatio={form.aspectRatio}
                projectId={editingId ?? undefined}
                onVideoChange={(url, source, meta) => {
                  patch("videoUrl", url);
                  patch("videoSource", source);
                  if (meta?.durationSeconds) patch("durationSeconds", String(meta.durationSeconds));
                  if (meta?.aspectRatio) patch("aspectRatio", meta.aspectRatio);
                  if (meta?.width) patch("width", String(meta.width));
                  if (meta?.height) patch("height", String(meta.height));
                }}
                onThumbnailChange={(url) => {
                  patch("thumbnailUrl", url);
                }}
                onDurationChange={(_formatted, seconds) => {
                  patch("durationSeconds", String(seconds));
                }}
                onAspectRatioChange={(ratio) => {
                  patch("aspectRatio", ratio);
                }}
              />
            </div>

            <div className="hairline grid gap-5 pt-5 sm:grid-cols-3">
              <Field label="Aspect ratio">
                <Select
                  value={form.aspectRatio}
                  onChange={(v) => patch("aspectRatio", v)}
                  options={RATIOS.map((r) => ({ value: r, label: r }))}
                />
              </Field>
              <Field label="Display size">
                <Select
                  value={form.displaySize}
                  onChange={(v) => patch("displaySize", v)}
                  options={SIZES.map((s) => ({ value: s, label: s }))}
                />
              </Field>
              <Field
                label={
                  <div className="flex items-center justify-between">
                    <span>Duration (seconds)</span>
                    {form.videoUrl && (
                      <button
                        type="button"
                        onClick={() => autoDetectDuration(form.videoUrl)}
                        className="text-[10px] font-bold text-[var(--accent)] hover:underline"
                      >
                        ⚡ Auto-Grab
                      </button>
                    )}
                  </div>
                }
              >
                <TextInput
                  value={form.durationSeconds}
                  onChange={(v) => patch("durationSeconds", v)}
                  type="number"
                  min={0}
                  placeholder="e.g. 30"
                />
              </Field>
              <Field label="Display width">
                <TextInput
                  value={form.displayWidth}
                  onChange={(v) => patch("displayWidth", v)}
                  type="number"
                />
              </Field>
              <Field label="Display height">
                <TextInput
                  value={form.displayHeight}
                  onChange={(v) => patch("displayHeight", v)}
                  type="number"
                />
              </Field>
              <Field label="Source resolution" hint="e.g. 3840 × 2160">
                <div className="grid grid-cols-2 gap-2">
                  <TextInput value={form.width} onChange={(v) => patch("width", v)} type="number" placeholder="3840" />
                  <TextInput value={form.height} onChange={(v) => patch("height", v)} type="number" placeholder="2160" />
                </div>
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <Toggle checked={form.featured} onChange={(v) => patch("featured", v)} label="Featured" />
              <Toggle checked={form.published} onChange={(v) => patch("published", v)} label="Published" />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="accent" type="submit" disabled={saving}>
                {saving ? "Saving…" : editingId ? "Save project" : "Save project"}
              </Button>
              <Button variant="ghost" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-4 sm:p-6 space-y-6">
        {/* Category Visibility Manager */}
        <div className="rounded-2xl border border-black/8 bg-black/[0.02] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-black/5">
            <div>
              <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-ink">
                Category Visibility Manager (Hide / Show by Category)
              </h3>
              <p className="text-[11px] text-ink/55">
                Click any category button to hide or show that entire category from website filters and portfolio.
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2.5">
            {categories.map((cat) => {
              const isCatActive = cat.isActive !== false;
              return (
                <div
                  key={cat.id}
                  className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 transition ${
                    isCatActive
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-950"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-950 opacity-80"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isCatActive ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                    />
                    <span className="text-xs font-bold">{cat.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`rounded-lg px-2.5 py-1 text-[10px] font-bold shadow-sm transition ${
                      isCatActive
                        ? "bg-emerald-600 text-white hover:bg-amber-600"
                        : "bg-amber-600 text-white hover:bg-emerald-600"
                    }`}
                    title={isCatActive ? "Click to Hide this Category from website" : "Click to Show this Category on website"}
                  >
                    {isCatActive ? "👁️ Visible (Hide)" : "🚫 Hidden (Show)"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Search">
            <TextInput value={search} onChange={setSearch} placeholder="Title, category, tag…" />
          </Field>
          <Field label="Category">
            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              placeholder="All categories"
              options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
            />
          </Field>
          <Field label="Status">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All"
              options={[
                { value: "published", label: "Published" },
                { value: "draft", label: "Draft" },
              ]}
            />
          </Field>
          <Field label="Projects shown">
            <p className="mono pt-3 text-sm text-ink/60">
              {filtered.length} / {projects.length}
            </p>
          </Field>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-ink/45">Loading projects…</p>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-ink/55">No projects match these filters.</p>
            <Button variant="dark" className="mt-4" onClick={openCreate}>
              Add your first project
            </Button>
          </div>
        ) : (
          <div
            ref={listRef}
            className={`mt-6 grid gap-4 ${view === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : ""}`}
          >
            {filtered.map((project) => (
              <article
                key={project.id}
                className="glass-soft overflow-hidden rounded-3xl border border-ink/8"
              >
                <div className="relative aspect-video bg-ink/5">
                  {project.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={project.thumbnailUrl}
                      alt={project.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-[0.65rem] uppercase tracking-[0.2em] text-ink/35">
                      No thumbnail
                    </div>
                  )}
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    <span className="rounded-md bg-black/60 px-2 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.12em] text-white">
                      {project.aspectRatio}
                    </span>
                    {project.featured && (
                      <span className="rounded-md bg-[var(--accent)] px-2 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.12em] text-white">
                        Featured
                      </span>
                    )}
                    <span
                      className={`rounded-md px-2 py-1 text-[0.55rem] font-bold uppercase tracking-[0.12em] ${
                        project.published ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
                      }`}
                    >
                      {project.published ? "● Live (Visible)" : "🚫 Hidden"}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-ink/40">
                      {project.categoryName || project.categoryLabel || "Uncategorised"}
                      {project.year ? ` · ${project.year}` : ""}
                    </p>
                    <button
                      type="button"
                      onClick={() => togglePublished(project)}
                      className={`rounded-lg px-2 py-0.5 text-[10px] font-bold transition ${
                        project.published
                          ? "bg-emerald-500/10 text-emerald-600 hover:bg-amber-500/15 hover:text-amber-700"
                          : "bg-amber-500/15 text-amber-700 hover:bg-emerald-500/15 hover:text-emerald-600"
                      }`}
                      title={project.published ? "Click to Hide project from website" : "Click to Show project on website"}
                    >
                      {project.published ? "👁️ Visible" : "🚫 Hidden"}
                    </button>
                  </div>
                  <h3 className="mt-1.5 text-sm font-semibold text-ink">{project.title}</h3>
                  {view === "list" && project.description && (
                    <p className="mt-2 line-clamp-2 text-[0.75rem] text-ink/55">{project.description}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Button variant="dark" onClick={() => openEdit(project)}>
                      Edit
                    </Button>
                    <Button
                      variant={project.published ? "light" : "accent"}
                      onClick={() => togglePublished(project)}
                    >
                      {project.published ? "Hide" : "Unhide (Show)"}
                    </Button>
                    <Button variant="ghost" onClick={() => setPreviewId(project.id)}>
                      View
                    </Button>
                    <Button
                      variant="light"
                      onClick={() => openEdit(project)}
                    >
                      Replace video / edit
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        action(
                          () =>
                            api(`/api/admin/projects/${project.id}/duplicate`, { method: "POST" }),
                          "Project duplicated.",
                        )
                      }
                    >
                      Duplicate
                    </Button>
                    <Button variant="ghost" onClick={() => toggleFeatured(project)}>
                      {project.featured ? "Unfeature" : "Feature"}
                    </Button>
                    <Button variant="ghost" onClick={() => move(project, "up")} title="Move up">
                      ↑
                    </Button>
                    <Button variant="ghost" onClick={() => move(project, "down")} title="Move down">
                      ↓
                    </Button>
                    <Button variant="danger" onClick={() => remove(project)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>

      {previewId !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[90] grid place-items-center bg-black/75 p-4 backdrop-blur-md"
          onClick={() => setPreviewId(null)}
        >
          <div
            className="glass-dark w-full max-w-3xl rounded-3xl p-4"
            onClick={(event) => event.stopPropagation()}
          >
            {(() => {
              const project = projects.find((p) => p.id === previewId);
              if (!project) return null;
              return (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">{project.title}</p>
                    <Button variant="ghost" onClick={() => setPreviewId(null)}>
                      Close
                    </Button>
                  </div>
                  {project.videoUrl ? (
                    (() => {
                      const media = parseMediaUrl(project.videoUrl);
                      if (media.embedUrl) {
                        return (
                          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black aspect-video max-h-[70vh]">
                            <iframe
                              src={media.embedUrl}
                              title={project.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="h-full w-full border-0"
                            />
                          </div>
                        );
                      }
                      return (
                        <video
                          key={project.id}
                          src={media.streamUrl || project.videoUrl}
                          poster={project.thumbnailUrl || undefined}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full rounded-2xl bg-black max-h-[70vh]"
                        />
                      );
                    })()
                  ) : (
                    <p className="py-10 text-center text-sm text-white/60">No video attached.</p>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

type MediaRow = {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  kind: string;
  size: number;
  url: string;
  createdAt: string;
};

export function MediaAdmin({ onChanged }: { onChanged: () => void }) {
  const [media, setMedia] = useState<MediaRow[]>([]);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [urlName, setUrlName] = useState("");
  const [urlKind, setUrlKind] = useState<"video" | "image">("video");

  const load = useCallback(async () => {
    try {
      const [mediaPayload, projectPayload] = await Promise.all([
        api<{ media: MediaRow[] }>("/api/admin/media"),
        api<{ projects: AdminProject[] }>("/api/admin/projects"),
      ]);
      setMedia(mediaPayload.media);
      setProjects(projectPayload.projects);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load media.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = kindFilter ? media.filter((m) => m.kind === kindFilter) : media;

  const linkedProjects = (url: string) =>
    projects.filter((project) => project.videoUrl === url || project.thumbnailUrl === url);

  const bytes = (value: number) => {
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <SectionTitle
        title="Media Library"
        subtitle="Uploads are stored on the server and persist after refresh and restart."
        action={
          <Button variant="light" onClick={() => void load()}>
            Refresh
          </Button>
        }
      />

      {error && <Notice tone="error">{error}</Notice>}
      {notice && (
        <div className="mt-3">
          <Notice tone="success">{notice}</Notice>
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <p className="mb-3 text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-ink/45">
            Upload Video (MP4, WebM or MOV · max 300MB)
          </p>
          <Uploader
            kind="video"
            onUploaded={async () => {
              await load();
              onChanged();
            }}
          />
        </Card>
        <Card className="p-5">
          <p className="mb-3 text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-ink/45">
            Upload thumbnail / image
          </p>
          <Uploader
            kind="image"
            label="Drag & drop image here"
            hint="JPG, PNG or WEBP"
            onUploaded={async () => {
              await load();
              onChanged();
            }}
          />
        </Card>
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <p className="mb-3 text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-ink/45">
              Add direct media URL
            </p>
            <Field label="Media URL">
              <TextInput
                value={urlInput}
                onChange={setUrlInput}
                placeholder="https://..."
              />
            </Field>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Field label="Name">
                <TextInput value={urlName} onChange={setUrlName} placeholder="Asset name" />
              </Field>
              <Field label="Kind">
                <Select
                  value={urlKind}
                  onChange={(val) => setUrlKind(val as "video" | "image")}
                  options={[
                    { value: "video", label: "Video" },
                    { value: "image", label: "Image" },
                  ]}
                />
              </Field>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              variant="dark"
              disabled={!urlInput.trim()}
              onClick={async () => {
                try {
                  await api("/api/admin/media", {
                    method: "POST",
                    body: JSON.stringify({
                      url: urlInput.trim(),
                      originalName: urlName.trim() || "Web Media Asset",
                      kind: urlKind,
                    }),
                  });
                  setUrlInput("");
                  setUrlName("");
                  setNotice("Media URL added to library.");
                  window.setTimeout(() => setNotice(""), 3000);
                  await load();
                  onChanged();
                } catch (caught) {
                  setError(caught instanceof Error ? caught.message : "Failed to add media URL.");
                }
              }}
            >
              Add URL
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {[
          { value: "", label: "All" },
          { value: "video", label: "Videos" },
          { value: "image", label: "Images" },
        ].map((option) => (
          <Button
            key={option.label}
            variant={kindFilter === option.value ? "dark" : "ghost"}
            onClick={() => setKindFilter(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => (
          <Card key={item.id} className="overflow-hidden p-0">
            <div className="aspect-video bg-ink/5">
              {item.kind === "video" ? (
                <video src={item.url} preload="metadata" controls className="h-full w-full object-contain" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt={item.originalName} loading="lazy" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="p-4">
              <p className="truncate text-sm font-semibold text-ink">{item.originalName}</p>
              <p className="mono mt-1 text-[0.62rem] text-ink/45">
                {item.kind} · {bytes(item.size)} · {new Date(item.createdAt).toLocaleDateString()}
              </p>
              {linkedProjects(item.url).length > 0 ? (
                <p className="mt-2 text-[0.68rem] text-ink/55">
                  Linked to: {linkedProjects(item.url).map((project) => project.title).join(", ")}
                </p>
              ) : (
                <p className="mt-2 text-[0.68rem] text-ink/35">Not linked to a project yet.</p>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Button
                  variant="ghost"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(`${window.location.origin}${item.url}`)
                      .then(() => setNotice("URL copied to clipboard."))
                      .catch(() => setNotice(`URL: ${item.url}`));
                  }}
                >
                  Copy URL
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    setNotice(
                      "URL copied — paste it into a project's Video URL or Thumbnail URL field to use it.",
                    )
                  }
                  title="Copy URL to use in a project"
                >
                  Use in project
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (!window.confirm(`Delete ${item.originalName}?`)) return;
                    void (async () => {
                      try {
                        await api(`/api/admin/media/${item.id}`, { method: "DELETE" });
                        await load();
                        onChanged();
                      } catch (caught) {
                        setError(caught instanceof Error ? caught.message : "Delete failed.");
                      }
                    })();
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-ink/50">
          No media yet — upload a video or thumbnail above.
        </p>
      )}
    </div>
  );
}
