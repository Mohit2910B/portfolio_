"use client";

import { useCallback, useEffect, useState } from "react";
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
  api,
} from "./ui";
import type { AdminCategory } from "./PortfolioAdmin";

type Skill = {
  id: number;
  name: string;
  category: string;
  description: string;
  level: number | null;
  sortOrder: number;
  isActive: boolean;
};

type Service = {
  id: number;
  title: string;
  description: string;
  deliverables: string;
  icon: string;
  priceFrom: string;
  sortOrder: number;
  isActive: boolean;
};

type WorkOption = { id: number; label: string; value: string; sortOrder: number; isActive: boolean };

type CarouselRow = {
  id: number;
  categoryId: number | null;
  categoryName: string;
  slots: number;
  centerSize: string;
  sideSize: string;
  autoFill: boolean;
  projectIds: string;
  sortOrder: number;
  isActive: boolean;
};

function useCollection<T>(path: string) {
  const [rows, setRows] = useState<T[]>([]);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const payload = await api<{ [key: string]: T[] }>(path);
      const firstKey = Object.keys(payload)[0];
      setRows((payload[firstKey] ?? []) as T[]);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load data.");
    }
  }, [path]);
  useEffect(() => {
    void load();
  }, [load]);
  return { rows, error, setError, load };
}

/* ---------------------------- CATEGORIES ---------------------------- */

export function CategoriesAdmin({ onChanged }: { onChanged: () => void }) {
  const { rows, error, setError, load } = useCollection<AdminCategory>("/api/admin/categories");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [notice, setNotice] = useState("");

  const run = async (fn: () => Promise<void>, message?: string) => {
    try {
      await fn();
      await load();
      onChanged();
      if (message) {
        setNotice(message);
        window.setTimeout(() => setNotice(""), 2600);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Action failed.");
    }
  };

  return (
    <div>
      <SectionTitle
        title="Categories"
        subtitle="These drive the public portfolio filter. Reordering here changes the filter order on the website."
      />
      {error && <Notice tone="error">{error}</Notice>}
      {notice && (
        <div className="mt-3">
          <Notice tone="success">{notice}</Notice>
        </div>
      )}

      <Card className="mt-5 p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
          <Field label={editing ? "Editing category" : "New category"}>
            <TextInput value={name} onChange={setName} placeholder="Category name" />
          </Field>
          <Field label="Description">
            <TextInput value={description} onChange={setDescription} placeholder="Short description" />
          </Field>
          <div className="flex gap-2">
            <Button
              variant="dark"
              onClick={() => {
                if (!name.trim()) {
                  setError("Category name is required.");
                  return;
                }
                void run(async () => {
                  if (editing) {
                    await api(`/api/admin/categories/${editing.id}`, {
                      method: "PATCH",
                      body: JSON.stringify({ name, description }),
                    });
                  } else {
                    await api("/api/admin/categories", {
                      method: "POST",
                      body: JSON.stringify({ name, description }),
                    });
                  }
                  setName("");
                  setDescription("");
                  setEditing(null);
                }, editing ? "Category updated." : "Category added.");
              }}
            >
              {editing ? "Save" : "Add category"}
            </Button>
            {editing && (
              <Button
                variant="ghost"
                onClick={() => {
                  setEditing(null);
                  setName("");
                  setDescription("");
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="mt-5 space-y-3">
        {rows.map((category) => (
          <Card key={category.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{category.name}</p>
              <p className="mono mt-1 text-[0.62rem] text-ink/45">
                /{category.slug} · {category.projectCount} project
                {category.projectCount === 1 ? "" : "s"} · order {category.sortOrder}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button
                variant="ghost"
                onClick={() => {
                  setEditing(category);
                  setName(category.name);
                  setDescription(category.description);
                }}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  run(
                    () =>
                      api(`/api/admin/categories/${category.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ isActive: !category.isActive }),
                      }),
                    category.isActive ? "Category disabled." : "Category enabled.",
                  )
                }
              >
                {category.isActive ? "Disable" : "Enable"}
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  run(
                    () =>
                      api("/api/admin/categories/reorder", {
                        method: "POST",
                        body: JSON.stringify({ id: category.id, direction: "up" }),
                      }),
                    "Order updated.",
                  )
                }
              >
                ↑
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  run(
                    () =>
                      api("/api/admin/categories/reorder", {
                        method: "POST",
                        body: JSON.stringify({ id: category.id, direction: "down" }),
                      }),
                    "Order updated.",
                  )
                }
              >
                ↓
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (!window.confirm(`Delete ${category.name}? Projects stay but lose this category.`)) return;
                  void run(() => api(`/api/admin/categories/${category.id}`, { method: "DELETE" }), "Category deleted.");
                }}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ SKILLS ------------------------------ */

export function SkillsAdmin({ onChanged }: { onChanged: () => void }) {
  const { rows, error, setError, load } = useCollection<Skill>("/api/admin/skills");
  const [draft, setDraft] = useState({ name: "", category: "", description: "", level: "" });
  const [editing, setEditing] = useState<Skill | null>(null);

  const run = async (fn: () => Promise<void>, message?: string) => {
    try {
      await fn();
      await load();
      onChanged();
      if (message) {
        setNotice(message);
        window.setTimeout(() => setNotice(""), 2600);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Action failed.");
    }
  };

  const [notice, setNotice] = useState("");

  return (
    <div>
      <SectionTitle
        title="Skills"
        subtitle="Manage the skills CMS records without displaying a public skills section."
      />
      {error && <Notice tone="error">{error}</Notice>}
      {notice && (
        <div className="mt-3">
          <Notice tone="success">{notice}</Notice>
        </div>
      )}

      <Card className="mt-5 p-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Skill name">
            <TextInput value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} placeholder="Colour grading" />
          </Field>
          <Field label="Group">
            <TextInput value={draft.category} onChange={(v) => setDraft({ ...draft, category: v })} placeholder="Craft / Tools" />
          </Field>
          <Field label="Description">
            <TextInput
              value={draft.description}
              onChange={(v) => setDraft({ ...draft, description: v })}
              placeholder="Short description"
            />
          </Field>
          <Field label="Level %" hint="Leave empty to avoid a fake percentage.">
            <TextInput value={draft.level} onChange={(v) => setDraft({ ...draft, level: v })} type="number" min={0} max={100} />
          </Field>
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            variant="dark"
            onClick={() => {
              if (!draft.name.trim()) {
                setError("Skill name is required.");
                return;
              }
              void run(async () => {
                const body = {
                  name: draft.name,
                  category: draft.category,
                  description: draft.description,
                  level: draft.level ? Number(draft.level) : null,
                };
                if (editing) {
                  await api(`/api/admin/skills/${editing.id}`, { method: "PATCH", body: JSON.stringify(body) });
                } else {
                  await api("/api/admin/skills", { method: "POST", body: JSON.stringify(body) });
                }
                setDraft({ name: "", category: "", description: "", level: "" });
                setEditing(null);
              }, editing ? "Skill updated." : "Skill added.");
            }}
          >
            {editing ? "Save skill" : "Add skill"}
          </Button>
          {editing && (
            <Button
              variant="ghost"
              onClick={() => {
                setEditing(null);
                setDraft({ name: "", category: "", description: "", level: "" });
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </Card>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {rows.map((skill) => (
          <Card key={skill.id} className="flex items-start justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="mono text-[0.6rem] uppercase tracking-[0.16em] text-ink/40">
                {skill.category || "Craft"} · {typeof skill.level === "number" ? `${skill.level}%` : "no %"}
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">{skill.name}</p>
              {skill.description && <p className="mt-1 text-[0.75rem] text-ink/55">{skill.description}</p>}
            </div>
            <div className="flex shrink-0 flex-wrap gap-1.5">
              <Button
                variant="ghost"
                onClick={() => {
                  setEditing(skill);
                  setDraft({
                    name: skill.name,
                    category: skill.category,
                    description: skill.description,
                    level: skill.level ? String(skill.level) : "",
                  });
                }}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  run(
                    () =>
                      api(`/api/admin/skills/${skill.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ isActive: !skill.isActive }),
                      }),
                    skill.isActive ? "Skill disabled." : "Skill enabled.",
                  )
                }
              >
                {skill.isActive ? "Disable" : "Enable"}
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  run(
                    () => api("/api/admin/skills/reorder", { method: "POST", body: JSON.stringify({ id: skill.id, direction: "up" }) }),
                    "Moved up.",
                  )
                }
              >
                ↑
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  run(
                    () => api("/api/admin/skills/reorder", { method: "POST", body: JSON.stringify({ id: skill.id, direction: "down" }) }),
                    "Moved down.",
                  )
                }
              >
                ↓
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (!window.confirm(`Delete ${skill.name}?`)) return;
                  void run(() => api(`/api/admin/skills/${skill.id}`, { method: "DELETE" }), "Skill deleted.");
                }}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- SERVICES ----------------------------- */

export function ServicesAdmin({ onChanged }: { onChanged: () => void }) {
  const { rows, error, setError, load } = useCollection<Service>("/api/admin/services");
  const [draft, setDraft] = useState({ title: "", description: "", deliverables: "", icon: "cut", priceFrom: "" });
  const [editing, setEditing] = useState<Service | null>(null);
  const [notice, setNotice] = useState("");

  const run = async (fn: () => Promise<void>, message?: string) => {
    try {
      await fn();
      await load();
      onChanged();
      if (message) {
        setNotice(message);
        window.setTimeout(() => setNotice(""), 2600);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Action failed.");
    }
  };

  return (
    <div>
      <SectionTitle title="Services" subtitle="The public Services section renders these cards in order." />
      {error && <Notice tone="error">{error}</Notice>}
      {notice && (
        <div className="mt-3">
          <Notice tone="success">{notice}</Notice>
        </div>
      )}

      <Card className="mt-5 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title">
            <TextInput value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} placeholder="Video editing" />
          </Field>
          <Field label="Icon">
            <Select
              value={draft.icon}
              onChange={(v) => setDraft({ ...draft, icon: v })}
              options={[
                { value: "cut", label: "Cut" },
                { value: "shape", label: "Shape" },
                { value: "frame", label: "Frame" },
                { value: "spark", label: "Spark" },
                { value: "dial", label: "Dial" },
                { value: "phone", label: "Phone" },
              ]}
            />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <TextArea value={draft.description} onChange={(v) => setDraft({ ...draft, description: v })} rows={2} />
          </Field>
          <Field label="Deliverables" hint="Separate with | e.g. Reels|Thumbnails|Grade">
            <TextInput value={draft.deliverables} onChange={(v) => setDraft({ ...draft, deliverables: v })} />
          </Field>
          <Field label="Price from">
            <TextInput value={draft.priceFrom} onChange={(v) => setDraft({ ...draft, priceFrom: v })} placeholder="Optional" />
          </Field>
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            variant="dark"
            onClick={() => {
              if (!draft.title.trim()) {
                setError("Service title is required.");
                return;
              }
              void run(async () => {
                if (editing) {
                  await api(`/api/admin/services/${editing.id}`, { method: "PATCH", body: JSON.stringify(draft) });
                } else {
                  await api("/api/admin/services", { method: "POST", body: JSON.stringify(draft) });
                }
                setDraft({ title: "", description: "", deliverables: "", icon: "cut", priceFrom: "" });
                setEditing(null);
              }, editing ? "Service updated." : "Service added.");
            }}
          >
            {editing ? "Save service" : "Add service"}
          </Button>
          {editing && (
            <Button
              variant="ghost"
              onClick={() => {
                setEditing(null);
                setDraft({ title: "", description: "", deliverables: "", icon: "cut", priceFrom: "" });
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </Card>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {rows.map((service) => (
          <Card key={service.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-ink">{service.title}</p>
                <p className="mt-1 text-[0.75rem] text-ink/55">{service.description}</p>
              </div>
              <span className="mono shrink-0 text-[0.6rem] text-ink/35">#{service.sortOrder}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Button
                variant="ghost"
                onClick={() => {
                  setEditing(service);
                  setDraft({
                    title: service.title,
                    description: service.description,
                    deliverables: service.deliverables,
                    icon: service.icon || "cut",
                    priceFrom: service.priceFrom,
                  });
                }}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  run(
                    () =>
                      api(`/api/admin/services/${service.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ isActive: !service.isActive }),
                      }),
                    service.isActive ? "Service disabled." : "Service enabled.",
                  )
                }
              >
                {service.isActive ? "Disable" : "Enable"}
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  run(
                    () => api("/api/admin/services/reorder", { method: "POST", body: JSON.stringify({ id: service.id, direction: "up" }) }),
                    "Moved up.",
                  )
                }
              >
                ↑
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  run(
                    () => api("/api/admin/services/reorder", { method: "POST", body: JSON.stringify({ id: service.id, direction: "down" }) }),
                    "Moved down.",
                  )
                }
              >
                ↓
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (!window.confirm(`Delete ${service.title}?`)) return;
                  void run(() => api(`/api/admin/services/${service.id}`, { method: "DELETE" }), "Service deleted.");
                }}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* --------------------------- WORK OPTIONS --------------------------- */

export function WorkOptionsAdmin({ onChanged }: { onChanged: () => void }) {
  const { rows, error, setError, load } = useCollection<WorkOption>("/api/admin/work-options");
  const [label, setLabel] = useState("");
  const [notice, setNotice] = useState("");

  const run = async (fn: () => Promise<void>, message?: string) => {
    try {
      await fn();
      await load();
      onChanged();
      if (message) {
        setNotice(message);
        window.setTimeout(() => setNotice(""), 2600);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Action failed.");
    }
  };

  return (
    <div>
      <SectionTitle
        title="Content Studio"
        subtitle="These are the “Select work” options shown on the public enquiry form."
      />
      {error && <Notice tone="error">{error}</Notice>}
      {notice && (
        <div className="mt-3">
          <Notice tone="success">{notice}</Notice>
        </div>
      )}

      <Card className="mt-5 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <Field label="New option">
              <TextInput value={label} onChange={setLabel} placeholder="e.g. AI UGC" />
            </Field>
          </div>
          <Button
            variant="dark"
            onClick={() => {
              if (!label.trim()) {
                setError("Label is required.");
                return;
              }
              void run(async () => {
                await api("/api/admin/work-options", { method: "POST", body: JSON.stringify({ label }) });
                setLabel("");
              }, "Option added.");
            }}
          >
            Add option
          </Button>
        </div>
      </Card>

      <div className="mt-5 flex flex-wrap gap-2">
        {rows.map((option) => (
          <div
            key={option.id}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] ${
              option.isActive ? "border-ink/15 bg-white/70 text-ink" : "border-ink/8 bg-ink/5 text-ink/40"
            }`}
          >
            {option.label}
            <button
              type="button"
              title={option.isActive ? "Disable" : "Enable"}
              onClick={() =>
                run(
                  () =>
                    api(`/api/admin/work-options/${option.id}`, {
                      method: "PATCH",
                      body: JSON.stringify({ isActive: !option.isActive }),
                    }),
                  option.isActive ? "Option disabled." : "Option enabled.",
                )
              }
              className="text-ink/40 hover:text-[var(--accent)]"
            >
              {option.isActive ? "○" : "●"}
            </button>
            <button
              type="button"
              title="Delete"
              onClick={() => {
                if (!window.confirm(`Delete ${option.label}?`)) return;
                void run(() => api(`/api/admin/work-options/${option.id}`, { method: "DELETE" }), "Option deleted.");
              }}
              className="text-ink/40 hover:text-[#d11a4a]"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------- CAROUSEL ------------------------------ */

type PortfolioAdminProject = {
  id: number;
  title: string;
  categoryId: number | null;
  categoryLabel: string;
  thumbnailUrl: string;
  videoUrl: string;
  aspectRatio: string;
  durationSeconds: number | null;
  published: boolean;
};

export function CarouselAdmin({ onChanged }: { onChanged: () => void }) {
  const { rows, error, setError, load } = useCollection<CarouselRow>("/api/admin/carousel");
  const [projects, setProjects] = useState<PortfolioAdminProject[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  const loadProjects = () => {
    api<{ projects: PortfolioAdminProject[] }>("/api/admin/projects")
      .then((payload) => setProjects(payload.projects || []))
      .catch(() => undefined);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const run = async (fn: () => Promise<void>, message?: string) => {
    try {
      await fn();
      await load();
      loadProjects();
      onChanged();
      if (message) {
        setNotice(message);
        window.setTimeout(() => setNotice(""), 2600);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Action failed.");
    }
  };

  const parseIds = (raw: string) => {
    try {
      const parsed = JSON.parse(raw || "[]");
      return Array.isArray(parsed) ? parsed.map(Number) : [];
    } catch {
      return [];
    }
  };

  // Set default selected category
  const activeRow = rows.find((r) => r.categoryId === selectedCategory) || rows[0];

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SectionTitle
          title="Carousel Showcase Manager"
          subtitle="Easily manage which video projects appear in the website's featured carousel for each category."
        />
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      {notice && (
        <div className="mt-3">
          <Notice tone="success">{notice}</Notice>
        </div>
      )}

      {/* Category Selection Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 rounded-2xl bg-ink/5 p-2">
        {rows.map((row) => {
          const isSelected = (activeRow?.id === row.id) || (selectedCategory === row.categoryId);
          const catProjects = projects.filter((p) => row.categoryId === null || p.categoryId === row.categoryId);
          const pinnedCount = parseIds(row.projectIds).length;

          return (
            <button
              key={row.id}
              type="button"
              onClick={() => setSelectedCategory(row.categoryId)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[0.72rem] font-bold transition-all ${
                isSelected
                  ? "bg-white text-ink shadow-md shadow-ink/10"
                  : "text-ink/60 hover:text-ink hover:bg-white/50"
              }`}
            >
              <span>{row.categoryName}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[0.6rem] font-extrabold ${
                  isSelected ? "bg-ink text-white" : "bg-ink/10 text-ink/70"
                }`}
              >
                {catProjects.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Category Carousel Control Panel */}
      {activeRow && (() => {
        const ids = parseIds(activeRow.projectIds);
        const available = projects.filter(
          (p) => activeRow.categoryId === null || p.categoryId === activeRow.categoryId
        );

        // Sort projects: pinned projects in order first, then remaining
        const orderedProjects = [
          ...ids.map((id) => available.find((p) => p.id === id)).filter((p): p is PortfolioAdminProject => Boolean(p)),
          ...available.filter((p) => !ids.includes(p.id)),
        ];

        return (
          <div className="mt-6 space-y-6">
            {/* Category Setting Header Card */}
            <Card className="p-5 border border-ink/10 bg-white/80 backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-ink">{activeRow.categoryName} Carousel</h3>
                    <span className="rounded-full bg-[var(--accent)]/10 text-[var(--accent)] px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider">
                      {ids.length > 0 ? `${ids.length} Pinned Custom Order` : "Showing All Available"}
                    </span>
                  </div>
                  <p className="mt-1 text-[0.72rem] text-ink/55">
                    Click any video card below to toggle it in/out of the carousel, and use the arrow buttons to arrange order.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Toggle
                    checked={activeRow.isActive}
                    onChange={(value) =>
                      run(
                        () =>
                          api(`/api/admin/carousel/${activeRow.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ isActive: value }),
                          }),
                        value ? "Carousel enabled for this category." : "Carousel disabled.",
                      )
                    }
                    label={activeRow.isActive ? "Category Enabled" : "Category Hidden"}
                  />
                </div>
              </div>
            </Card>

            {/* Visual Project Cards Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-ink/70">
                  Projects in {activeRow.categoryName} ({available.length})
                </p>
                <p className="text-[0.68rem] text-ink/50">
                  Click a card to toggle showcase visibility · Use arrows to re-order
                </p>
              </div>

              {orderedProjects.length === 0 ? (
                <Card className="p-10 text-center border-dashed border-2 border-ink/15">
                  <span className="text-3xl">🎬</span>
                  <p className="mt-2 text-sm font-semibold text-ink">No video projects in this category yet</p>
                  <p className="mt-1 text-xs text-ink/50">
                    Go to Portfolio Admin to upload new projects and assign them to {activeRow.categoryName}.
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {orderedProjects.map((project, idx) => {
                    const isPinned = ids.includes(project.id);
                    const isVertical = project.aspectRatio === "9:16";

                    const togglePin = () => {
                      const next = isPinned
                        ? ids.filter((id) => id !== project.id)
                        : [...ids, project.id];
                      void run(
                        () =>
                          api(`/api/admin/carousel/${activeRow.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ projectIds: next }),
                          }),
                        isPinned ? `Removed "${project.title}" from carousel.` : `Pinned "${project.title}" to carousel.`
                      );
                    };

                    const moveLeft = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      const currentIds = ids.length > 0 ? [...ids] : orderedProjects.map((p) => p.id);
                      const pos = currentIds.indexOf(project.id);
                      if (pos <= 0) return;
                      const temp = currentIds[pos - 1];
                      currentIds[pos - 1] = currentIds[pos];
                      currentIds[pos] = temp;
                      void run(
                        () =>
                          api(`/api/admin/carousel/${activeRow.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ projectIds: currentIds }),
                          }),
                        `Moved "${project.title}" earlier.`
                      );
                    };

                    const moveRight = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      const currentIds = ids.length > 0 ? [...ids] : orderedProjects.map((p) => p.id);
                      const pos = currentIds.indexOf(project.id);
                      if (pos < 0 || pos >= currentIds.length - 1) return;
                      const temp = currentIds[pos + 1];
                      currentIds[pos + 1] = currentIds[pos];
                      currentIds[pos] = temp;
                      void run(
                        () =>
                          api(`/api/admin/carousel/${activeRow.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ projectIds: currentIds }),
                          }),
                        `Moved "${project.title}" later.`
                      );
                    };

                    return (
                      <div
                        key={project.id}
                        onClick={togglePin}
                        className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-3.5 transition-all cursor-pointer shadow-sm hover:shadow-md ${
                          isPinned
                            ? "bg-white border-emerald-500/40 ring-2 ring-emerald-500/20"
                            : "bg-white/60 border-ink/10 hover:border-ink/20"
                        }`}
                      >
                        {/* Thumbnail & Aspect Badge */}
                        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-ink/5">
                          {project.thumbnailUrl ? (
                            <img
                              src={project.thumbnailUrl}
                              alt={project.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-ink/30 text-2xl">
                              🎬
                            </div>
                          )}

                          <span
                            className={`absolute top-2 left-2 rounded-full px-2.5 py-0.5 text-[0.6rem] font-bold text-white shadow ${
                              isVertical ? "bg-[var(--accent)]" : "bg-black/70 backdrop-blur-md"
                            }`}
                          >
                            {isVertical ? "9:16 Reel" : "16:9 4K"}
                          </span>

                          <span
                            className={`absolute top-2 right-2 rounded-full px-2.5 py-0.5 text-[0.62rem] font-bold shadow ${
                              isPinned
                                ? "bg-emerald-600 text-white"
                                : "bg-black/60 text-white/80"
                            }`}
                          >
                            {isPinned ? "✓ In Carousel" : "○ Auto"}
                          </span>
                        </div>

                        {/* Title and Category */}
                        <div className="mt-3">
                          <h4 className="text-sm font-bold text-ink line-clamp-1 group-hover:text-[var(--accent)] transition-colors">
                            {project.title}
                          </h4>
                          <p className="text-[0.68rem] text-ink/50 mt-0.5">
                            Position #{idx + 1}
                          </p>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="mt-3 flex items-center justify-between border-t border-ink/5 pt-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePin();
                            }}
                            className={`rounded-lg px-2.5 py-1 text-[0.65rem] font-bold transition-all ${
                              isPinned
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-ink/5 text-ink/65 hover:bg-ink/10"
                            }`}
                          >
                            {isPinned ? "✓ Visible" : "+ Show in Carousel"}
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={moveLeft}
                              disabled={idx === 0}
                              title="Move Left (Earlier in Carousel)"
                              className="grid h-7 w-7 place-items-center rounded-lg bg-ink/5 text-ink text-xs transition-colors hover:bg-ink hover:text-white disabled:opacity-30"
                            >
                              ←
                            </button>
                            <button
                              type="button"
                              onClick={moveRight}
                              disabled={idx === orderedProjects.length - 1}
                              title="Move Right (Later in Carousel)"
                              className="grid h-7 w-7 place-items-center rounded-lg bg-ink/5 text-ink text-xs transition-colors hover:bg-ink hover:text-white disabled:opacity-30"
                            >
                              →
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/* -------------------------- SOFTWARE TOOLS -------------------------- */

type SoftwareTool = {
  id: number;
  name: string;
  category: string;
  icon: string;
  proficiency: number | null;
  sortOrder: number;
  isActive: boolean;
};

const SOFTWARE_ICON_OPTIONS = [
  "premiere",
  "after-effects",
  "davinci",
  "photoshop",
  "illustrator",
  "blender",
  "capcut",
  "figma",
  "ai",
  "generic",
];

export function SoftwareToolsAdmin({ onChanged }: { onChanged: () => void }) {
  const { rows, error, setError, load } = useCollection<SoftwareTool>("/api/admin/software-tools");
  const [draft, setDraft] = useState({
    name: "",
    category: "",
    icon: "generic",
    proficiency: "",
  });
  const [editing, setEditing] = useState<SoftwareTool | null>(null);
  const [notice, setNotice] = useState("");

  const run = async (fn: () => Promise<void>, message?: string) => {
    try {
      await fn();
      await load();
      onChanged();
      if (message) {
        setNotice(message);
        window.setTimeout(() => setNotice(""), 2600);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Action failed.");
    }
  };

  const reset = () => {
    setDraft({ name: "", category: "", icon: "generic", proficiency: "" });
    setEditing(null);
  };

  return (
    <div>
      <SectionTitle
        title="Tools & Software"
        subtitle="Manage the public Tools & Software icon grid. Disabled tools are hidden from the website."
      />
      {error && <Notice tone="error">{error}</Notice>}
      {notice && (
        <div className="mt-3">
          <Notice tone="success">{notice}</Notice>
        </div>
      )}

      <Card className="mt-5 p-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Software name">
            <TextInput
              value={draft.name}
              onChange={(value) => setDraft({ ...draft, name: value })}
              placeholder="Adobe Premiere Pro"
            />
          </Field>
          <Field label="Category / type">
            <TextInput
              value={draft.category}
              onChange={(value) => setDraft({ ...draft, category: value })}
              placeholder="Editing / Motion / 3D"
            />
          </Field>
          <Field label="Icon">
            <Select
              value={draft.icon}
              onChange={(value) => setDraft({ ...draft, icon: value })}
              options={SOFTWARE_ICON_OPTIONS.map((icon) => ({ value: icon, label: icon }))}
            />
          </Field>
          <Field label="Proficiency %" hint="Optional. Leave blank for no progress indicator.">
            <TextInput
              value={draft.proficiency}
              onChange={(value) => setDraft({ ...draft, proficiency: value })}
              type="number"
              min={0}
              max={100}
              placeholder="95"
            />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="dark"
            onClick={() => {
              if (!draft.name.trim()) {
                setError("Software name is required.");
                return;
              }
              const body = {
                name: draft.name,
                category: draft.category,
                icon: draft.icon,
                proficiency: draft.proficiency ? Number(draft.proficiency) : null,
              };
              void run(async () => {
                if (editing) {
                  await api(`/api/admin/software-tools/${editing.id}`, {
                    method: "PATCH",
                    body: JSON.stringify(body),
                  });
                } else {
                  await api("/api/admin/software-tools", {
                    method: "POST",
                    body: JSON.stringify(body),
                  });
                }
                reset();
              }, editing ? "Software tool updated." : "Software tool added.");
            }}
          >
            {editing ? "Save software" : "Add software"}
          </Button>
          {editing && (
            <Button variant="ghost" onClick={reset}>
              Cancel
            </Button>
          )}
        </div>
      </Card>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {rows.map((tool) => (
          <Card key={tool.id} className="flex items-start justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="mono text-[0.6rem] uppercase tracking-[0.16em] text-ink/40">
                {tool.category || "Creative tool"} · {tool.icon} · {tool.proficiency ?? "no"}%
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">{tool.name}</p>
              <p className="mono mt-1 text-[0.62rem] text-ink/35">Order {tool.sortOrder}</p>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
              <Button
                variant="ghost"
                onClick={() => {
                  setEditing(tool);
                  setDraft({
                    name: tool.name,
                    category: tool.category,
                    icon: tool.icon || "generic",
                    proficiency: tool.proficiency ? String(tool.proficiency) : "",
                  });
                }}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  run(
                    () =>
                      api(`/api/admin/software-tools/${tool.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ isActive: !tool.isActive }),
                      }),
                    tool.isActive ? "Software hidden from website." : "Software visible on website.",
                  )
                }
              >
                {tool.isActive ? "Disable" : "Enable"}
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  run(
                    () =>
                      api("/api/admin/software-tools/reorder", {
                        method: "POST",
                        body: JSON.stringify({ id: tool.id, direction: "up" }),
                      }),
                    "Moved up.",
                  )
                }
              >
                ↑
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  run(
                    () =>
                      api("/api/admin/software-tools/reorder", {
                        method: "POST",
                        body: JSON.stringify({ id: tool.id, direction: "down" }),
                      }),
                    "Moved down.",
                  )
                }
              >
                ↓
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (!window.confirm(`Delete ${tool.name}?`)) return;
                  void run(
                    () => api(`/api/admin/software-tools/${tool.id}`, { method: "DELETE" }),
                    "Software tool deleted.",
                  );
                }}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
