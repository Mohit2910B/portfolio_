"use client";

import { useCallback, useEffect, useState } from "react";
import SpotlightReelCarousel from "@/components/site/SpotlightReelCarousel";
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
export type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  projectCount: number;
};

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



import {
  DEFAULT_CATEGORIES,
  DEFAULT_SERVICES,
  DEFAULT_SOFTWARE_TOOLS,
  DEFAULT_WORK_OPTIONS,
} from "@/lib/constants";

function useCollection<T>(path: string, initialFallback?: T[]) {
  const [rows, setRows] = useState<T[]>(initialFallback || []);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const payload = await api<{ [key: string]: T[] }>(path);
      const firstKey = Object.keys(payload)[0];
      if (Array.isArray(payload[firstKey]) && payload[firstKey].length > 0) {
        setRows(payload[firstKey] as T[]);
      } else if (initialFallback && initialFallback.length > 0) {
        setRows(initialFallback);
      }
      setError("");
    } catch (caught) {
      if (initialFallback && initialFallback.length > 0) {
        setRows(initialFallback);
      }
      setError(caught instanceof Error ? caught.message : "Could not load data.");
    }
  }, [path, initialFallback]);
  useEffect(() => {
    void load();
  }, [load]);
  return { rows, error, setError, load };
}

/* ---------------------------- CATEGORIES ---------------------------- */

export function CategoriesAdmin({ onChanged }: { onChanged: () => void }) {
  const { rows, error, setError, load } = useCollection<AdminCategory>(
    "/api/admin/categories",
    DEFAULT_CATEGORIES.map((c) => ({ ...c, projectCount: 0 })),
  );
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
  const { rows, error, setError, load } = useCollection<Service>(
    "/api/admin/services",
    DEFAULT_SERVICES.map((s) => ({
      ...s,
      deliverables: typeof s.deliverables === "string" ? s.deliverables : JSON.stringify(s.deliverables || []),
      priceFrom: "",
    })),
  );
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
  const { rows, error, setError, load } = useCollection<WorkOption>(
    "/api/admin/work-options",
    DEFAULT_WORK_OPTIONS.map((w) => ({
      ...w,
      isActive: Boolean(w.isActive),
    })),
  );
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

/* ----------------------------- PROJECTS ----------------------------- */

export type AdminProject = {
  id: number;
  title: string;
  description: string;
  categoryId: number | null;
  categoryLabel: string;
  videoUrl: string;
  thumbnailUrl: string;
  aspectRatio: string;
  durationSeconds: number;
  published: boolean;
  sortOrder: number;
};

export function ProjectsAdmin({ onChanged }: { onChanged: () => void }) {
  const { rows, error, setError, load } = useCollection<AdminProject>("/api/admin/projects");
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    categoryLabel: "Video Edit",
    videoUrl: "",
    thumbnailUrl: "",
    aspectRatio: "16:9",
    durationSeconds: "30",
  });
  const [editing, setEditing] = useState<AdminProject | null>(null);
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
    setDraft({
      title: "",
      description: "",
      categoryLabel: "Video Edit",
      videoUrl: "",
      thumbnailUrl: "",
      aspectRatio: "16:9",
      durationSeconds: "30",
    });
    setEditing(null);
  };

  return (
    <div>
      <SectionTitle
        title="Portfolio Projects"
        subtitle="Manage live database projects for Selected Works and portfolio grids."
      />
      {error && <Notice tone="error">{error}</Notice>}
      {notice && (
        <div className="mt-3">
          <Notice tone="success">{notice}</Notice>
        </div>
      )}

      <Card className="mt-5 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Project Title">
            <TextInput
              value={draft.title}
              onChange={(val) => setDraft({ ...draft, title: val })}
              placeholder="e.g. Kinetic Typography Reel"
            />
          </Field>
          <Field label="Category / Badge">
            <TextInput
              value={draft.categoryLabel}
              onChange={(val) => setDraft({ ...draft, categoryLabel: val })}
              placeholder="e.g. Commercial / Motion / Reel"
            />
          </Field>
          <Field label="Video URL (Direct MP4 / Cloud Storage)" className="sm:col-span-2">
            <TextInput
              value={draft.videoUrl}
              onChange={(val) => setDraft({ ...draft, videoUrl: val })}
              placeholder="https://..."
            />
          </Field>
          <Field label="Thumbnail Image URL" className="sm:col-span-2">
            <TextInput
              value={draft.thumbnailUrl}
              onChange={(val) => setDraft({ ...draft, thumbnailUrl: val })}
              placeholder="https://..."
            />
          </Field>
          <Field label="Aspect Ratio">
            <Select
              value={draft.aspectRatio}
              onChange={(val) => setDraft({ ...draft, aspectRatio: val })}
              options={[
                { value: "16:9", label: "16:9 Widescreen" },
                { value: "9:16", label: "9:16 Vertical Reel" },
                { value: "4:5", label: "4:5 Social Feed" },
                { value: "1:1", label: "1:1 Square" },
              ]}
            />
          </Field>
          <Field label="Duration (Seconds)">
            <TextInput
              value={draft.durationSeconds}
              onChange={(val) => setDraft({ ...draft, durationSeconds: val })}
              type="number"
            />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <TextArea
              value={draft.description}
              onChange={(val) => setDraft({ ...draft, description: val })}
              rows={2}
            />
          </Field>
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            variant="dark"
            onClick={() => {
              if (!draft.title.trim()) {
                setError("Project title is required.");
                return;
              }
              const body = {
                title: draft.title,
                description: draft.description,
                categoryLabel: draft.categoryLabel,
                videoUrl: draft.videoUrl,
                thumbnailUrl: draft.thumbnailUrl,
                aspectRatio: draft.aspectRatio,
                durationSeconds: Number(draft.durationSeconds) || 30,
              };
              void run(async () => {
                if (editing) {
                  await api(`/api/admin/projects/${editing.id}`, {
                    method: "PATCH",
                    body: JSON.stringify(body),
                  });
                } else {
                  await api("/api/admin/projects", {
                    method: "POST",
                    body: JSON.stringify(body),
                  });
                }
                reset();
              }, editing ? "Project updated." : "Project created.");
            }}
          >
            {editing ? "Save Project" : "Add Project"}
          </Button>
          {editing && (
            <Button variant="ghost" onClick={reset}>
              Cancel
            </Button>
          )}
        </div>
      </Card>

      <div className="mt-5 space-y-3">
        {rows.map((project) => (
          <Card key={project.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <p className="text-sm font-semibold text-ink">{project.title}</p>
              <p className="mono text-[0.62rem] text-ink/45">
                {project.categoryLabel} · {project.aspectRatio} · {project.durationSeconds}s
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button
                variant="ghost"
                onClick={() => {
                  setEditing(project);
                  setDraft({
                    title: project.title,
                    description: project.description || "",
                    categoryLabel: project.categoryLabel || "Video Edit",
                    videoUrl: project.videoUrl || "",
                    thumbnailUrl: project.thumbnailUrl || "",
                    aspectRatio: project.aspectRatio || "16:9",
                    durationSeconds: String(project.durationSeconds || 30),
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
                      api(`/api/admin/projects/${project.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ published: !project.published }),
                      }),
                    project.published ? "Project un-published." : "Project published.",
                  )
                }
              >
                {project.published ? "Unpublish" : "Publish"}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (!window.confirm(`Delete project ${project.title}?`)) return;
                  void run(() => api(`/api/admin/projects/${project.id}`, { method: "DELETE" }), "Project deleted.");
                }}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
        {rows.length === 0 && (
          <p className="mono p-6 text-center text-xs text-ink/40">
            0 projects in database. Add a project above to feature it on the website.
          </p>
        )}
      </div>
    </div>
  );
}

/* ----------------------------- CAROUSEL ----------------------------- */

export type AdminCarouselItem = {
  id: number;
  title: string;
  category: string;
  description: string;
  duration: string;
  videoUrl: string;
  videoSource?: string;
  thumbnailUrl: string;
  aspectRatio: string;
  isActive: boolean;
  featured?: boolean;
  sortOrder: number;
  projectId?: number | null;
};

export function CarouselAdmin({ onChanged }: { onChanged: () => void }) {
  const { rows, error, setError, load } = useCollection<AdminCarouselItem>("/api/admin/carousel");
  const { rows: categoriesList } = useCollection<AdminCategory>("/api/admin/categories");
  const { rows: projectsList } = useCollection<AdminProject>("/api/admin/projects");
  const { rows: mediaList } = useCollection<AdminMediaFile>("/api/admin/media");

  const [draft, setDraft] = useState({
    title: "",
    category: "Real Estate",
    description: "",
    duration: "0:30",
    videoUrl: "",
    thumbnailUrl: "",
    aspectRatio: "9:16",
    projectId: "",
    featured: true,
  });
  const [editing, setEditing] = useState<AdminCarouselItem | null>(null);
  const [notice, setNotice] = useState("");
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<"video" | "thumbnail" | null>(null);

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
    setDraft({
      title: "",
      category: categoriesList[0]?.name || "Real Estate",
      description: "",
      duration: "0:30",
      videoUrl: "",
      thumbnailUrl: "",
      aspectRatio: "9:16",
      projectId: "",
      featured: true,
    });
    setEditing(null);
  };

  // Helper to handle selecting a portfolio project to auto-fill fields
  const handleSelectProject = (projIdStr: string) => {
    if (!projIdStr) return;
    const proj = projectsList.find((p) => String(p.id) === projIdStr);
    if (!proj) return;
    setDraft((prev) => ({
      ...prev,
      projectId: String(proj.id),
      title: proj.title,
      description: proj.description || "",
      category: proj.categoryLabel || categoriesList[0]?.name || "Reel",
      videoUrl: proj.videoUrl || "",
      thumbnailUrl: proj.thumbnailUrl || "",
      aspectRatio: proj.aspectRatio || "9:16",
      duration: proj.durationSeconds ? `${proj.durationSeconds}s` : "0:30",
    }));
  };

  return (
    <div>
      <SectionTitle
        title="Carousel Manager"
        subtitle="Manage dynamic 3D Spotlight Showcase items. Empty database displays zero slides."
        action={
          <div className="flex gap-2">
            <Button
              variant={showLivePreview ? "accent" : "dark"}
              onClick={() => setShowLivePreview((v) => !v)}
            >
              {showLivePreview ? "✕ Close Preview" : "👁 PREVIEW 3D CAROUSEL"}
            </Button>
          </div>
        }
      />

      {error && <Notice tone="error">{error}</Notice>}
      {notice && (
        <div className="mt-3">
          <Notice tone="success">{notice}</Notice>
        </div>
      )}

      {/* Live 3D Carousel Preview Overlay */}
      {showLivePreview && (
        <Card className="mt-5 p-6 bg-[#070709] border-[#e0147f]/40">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#e0147f]">
                LIVE 3D SPOTLIGHT PREVIEW
              </p>
              <p className="text-xs text-white/50">
                This shows exact public rendering based on active database records.
              </p>
            </div>
            <Button variant="ghost" onClick={() => setShowLivePreview(false)}>
              Close
            </Button>
          </div>

          <SpotlightReelCarousel
            carouselItems={rows.map((r) => ({
              ...r,
              videoSource: r.videoSource || "upload",
              createdAt: new Date(),
              updatedAt: new Date(),
            }))}
            showEmptyNotice={true}
          />
        </Card>
      )}

      {/* Media Picker Modal */}
      {mediaPickerTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-white/20 bg-neutral-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase text-white">
                Select {mediaPickerTarget === "video" ? "Video File" : "Thumbnail Image"} from Media Library
              </h3>
              <Button variant="ghost" onClick={() => setMediaPickerTarget(null)}>
                ✕ Close
              </Button>
            </div>

            <div className="max-h-80 overflow-y-auto grid gap-2 sm:grid-cols-2">
              {mediaList
                .filter((m) => (mediaPickerTarget === "video" ? m.kind === "video" : m.kind === "image"))
                .map((media) => (
                  <button
                    key={media.id}
                    type="button"
                    onClick={() => {
                      if (mediaPickerTarget === "video") {
                        setDraft((prev) => ({ ...prev, videoUrl: media.url }));
                      } else {
                        setDraft((prev) => ({ ...prev, thumbnailUrl: media.url }));
                      }
                      setMediaPickerTarget(null);
                    }}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-white/5 text-left hover:border-[#e0147f] hover:bg-white/10 transition-colors"
                  >
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-black overflow-hidden flex items-center justify-center">
                      {media.kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={media.url} alt={media.filename} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs">🎬</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{media.filename}</p>
                      <p className="mono text-[0.6rem] text-white/40 truncate">{media.url}</p>
                    </div>
                  </button>
                ))}

              {mediaList.length === 0 && (
                <p className="mono col-span-full p-4 text-center text-xs text-white/40">
                  No uploaded media files in library. Go to Media Library to register URLs.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create Form Card */}
      <Card className="mt-5 p-5">
        <div className="flex items-center justify-between border-b border-ink/10 pb-3 mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-ink">
            {editing ? `Editing Item #${editing.id}` : "+ Add New Carousel Item"}
          </p>
          {editing && (
            <span className="rounded-full bg-[#e0147f]/10 px-3 py-1 font-mono text-[10px] font-bold text-[#e0147f]">
              EDIT MODE
            </span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Project Pre-Fill Dropdown */}
          <Field label="Import from Portfolio Project (Optional)" hint="Auto-fills title, description, category, video & thumbnail URLs.">
            <Select
              value={draft.projectId}
              onChange={(val) => handleSelectProject(val)}
              options={[
                { value: "", label: "— Select existing project or enter custom —" },
                ...projectsList.map((p) => ({ value: String(p.id), label: `${p.title} (${p.categoryLabel || "Project"})` })),
              ]}
            />
          </Field>

          {/* Dynamic Category Selector */}
          <Field label="Category" hint="Select from live Categories CMS.">
            <Select
              value={draft.category}
              onChange={(val) => setDraft({ ...draft, category: val })}
              options={
                categoriesList.length > 0
                  ? categoriesList.map((c) => ({ value: c.name, label: c.name }))
                  : [
                      { value: "Real Estate", label: "Real Estate" },
                      { value: "Reel", label: "Reel" },
                      { value: "Motion Graphics", label: "Motion Graphics" },
                    ]
              }
            />
          </Field>

          <Field label="Carousel Title">
            <TextInput
              value={draft.title}
              onChange={(val) => setDraft({ ...draft, title: val })}
              placeholder="e.g. Luxury Villa Tour"
            />
          </Field>

          <Field label="Duration String">
            <TextInput
              value={draft.duration}
              onChange={(val) => setDraft({ ...draft, duration: val })}
              placeholder="e.g. 0:30 or 1:15"
            />
          </Field>

          {/* Video URL + Media Picker */}
          <Field
            label="Video URL (MP4 / Direct Storage)"
            hint="Playback file URL for the video showcase."
            className="sm:col-span-2"
          >
            <div className="flex gap-2">
              <TextInput
                value={draft.videoUrl}
                onChange={(val) => setDraft({ ...draft, videoUrl: val })}
                placeholder="https://..."
              />
              <Button variant="ghost" onClick={() => setMediaPickerTarget("video")}>
                Pick Media
              </Button>
            </div>
          </Field>

          {/* Thumbnail Image URL + Media Picker */}
          <Field
            label="Thumbnail / Poster Image URL (Required for Card Display)"
            hint="Poster image displayed on 3D card prior to playback."
            className="sm:col-span-2"
          >
            <div className="flex gap-2">
              <TextInput
                value={draft.thumbnailUrl}
                onChange={(val) => setDraft({ ...draft, thumbnailUrl: val })}
                placeholder="https://..."
              />
              <Button variant="ghost" onClick={() => setMediaPickerTarget("thumbnail")}>
                Pick Media
              </Button>
            </div>
          </Field>

          <Field label="Aspect Ratio">
            <Select
              value={draft.aspectRatio}
              onChange={(val) => setDraft({ ...draft, aspectRatio: val })}
              options={[
                { value: "9:16", label: "9:16 Vertical Reel" },
                { value: "16:9", label: "16:9 Widescreen" },
                { value: "4:5", label: "4:5 Social Feed" },
                { value: "1:1", label: "1:1 Square" },
              ]}
            />
          </Field>

          <Field label="Short Description" className="sm:col-span-2">
            <TextArea
              value={draft.description}
              onChange={(val) => setDraft({ ...draft, description: val })}
              rows={2}
              placeholder="Short description displayed on center carousel card"
            />
          </Field>
        </div>

        {/* Thumbnail Preview Image */}
        {draft.thumbnailUrl ? (
          <div className="mt-4 flex items-center gap-4 rounded-2xl border border-ink/10 bg-ink/5 p-3">
            <div className="h-16 w-12 overflow-hidden rounded-xl bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={draft.thumbnailUrl} alt="Thumbnail preview" className="h-full w-full object-cover" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-ink">Poster Image Preview</p>
              <p className="mono text-[0.6rem] text-ink/50 truncate max-w-xs">{draft.thumbnailUrl}</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-700">
            ⚠ Missing Poster Thumbnail — Upload or select an image URL above so the 3D card renders properly on the public website.
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <Button
            variant="dark"
            onClick={() => {
              if (!draft.title.trim()) {
                setError("Carousel item title is required.");
                return;
              }
              const body = {
                title: draft.title,
                category: draft.category || "Reel",
                description: draft.description,
                duration: draft.duration || "0:30",
                videoUrl: draft.videoUrl,
                thumbnailUrl: draft.thumbnailUrl,
                aspectRatio: draft.aspectRatio || "9:16",
                projectId: draft.projectId ? Number(draft.projectId) : null,
                featured: draft.featured !== false,
              };
              void run(async () => {
                if (editing) {
                  await api(`/api/admin/carousel/${editing.id}`, {
                    method: "PATCH",
                    body: JSON.stringify(body),
                  });
                } else {
                  await api("/api/admin/carousel", {
                    method: "POST",
                    body: JSON.stringify(body),
                  });
                }
                reset();
              }, editing ? "Carousel item updated." : "Carousel item added.");
            }}
          >
            {editing ? "Save Changes" : "+ Add Carousel Item"}
          </Button>
          {editing && (
            <Button variant="ghost" onClick={reset}>
              Cancel
            </Button>
          )}
        </div>
      </Card>

      {/* Visual Admin Cards Section */}
      <div className="mt-6 space-y-4">
        <p className="mono text-xs font-bold uppercase tracking-wider text-ink/50">
          Database Carousel Items ({rows.length})
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((item) => {
            const missingThumbnail = !item.thumbnailUrl;
            const missingVideo = !item.videoUrl;
            const missingCategory = !item.category;

            return (
              <Card key={item.id} className="overflow-hidden p-4 flex flex-col justify-between">
                <div>
                  {/* Poster Thumbnail Box */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-neutral-900 border border-ink/10 mb-3">
                    {item.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.thumbnailUrl} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center font-mono text-[10px] text-ink/40 bg-neutral-900">
                        [NO THUMBNAIL]
                      </div>
                    )}

                    <div className="absolute top-2 left-2 right-2 flex justify-between items-center">
                      <span className="rounded-full bg-[#e0147f] px-2 py-0.5 font-mono text-[9px] uppercase font-bold text-white">
                        {item.category || "REEL"}
                      </span>
                      <span className="rounded-full bg-black/70 px-2 py-0.5 font-mono text-[9px] text-white">
                        #{item.sortOrder}
                      </span>
                    </div>
                  </div>

                  {/* Info Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-ink leading-tight">{item.title}</h4>
                      <p className="mono text-[0.62rem] text-ink/45 mt-0.5">
                        {item.aspectRatio} · {item.duration}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        item.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                      }`}
                    >
                      {item.isActive ? "Published" : "Disabled"}
                    </span>
                  </div>

                  {item.description && (
                    <p className="mt-2 text-xs text-ink/60 line-clamp-2">{item.description}</p>
                  )}

                  {/* Warning Indicators */}
                  {(missingThumbnail || missingVideo || missingCategory) && (
                    <div className="mt-3 space-y-1 rounded-xl bg-amber-500/10 border border-amber-500/20 p-2 text-[10px] font-mono text-amber-700">
                      {missingThumbnail && <p>⚠ Missing Poster Thumbnail</p>}
                      {missingVideo && <p>⚠ Missing Video File / URL</p>}
                      {missingCategory && <p>⚠ Missing Category</p>}
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="mt-4 pt-3 border-t border-ink/10 flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditing(item);
                        setDraft({
                          title: item.title,
                          category: item.category || "Real Estate",
                          description: item.description || "",
                          duration: item.duration || "0:30",
                          videoUrl: item.videoUrl || "",
                          thumbnailUrl: item.thumbnailUrl || "",
                          aspectRatio: item.aspectRatio || "9:16",
                          projectId: item.projectId ? String(item.projectId) : "",
                          featured: item.featured !== false,
                        });
                        window.scrollTo({ top: 300, behavior: "smooth" });
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        run(
                          () =>
                            api(`/api/admin/carousel/${item.id}`, {
                              method: "PATCH",
                              body: JSON.stringify({ isActive: !item.isActive }),
                            }),
                          item.isActive ? "Slide disabled." : "Slide published.",
                        )
                      }
                    >
                      {item.isActive ? "Disable" : "Enable"}
                    </Button>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      onClick={() =>
                        run(
                          () =>
                            api("/api/admin/carousel/reorder", {
                              method: "POST",
                              body: JSON.stringify({ id: item.id, direction: "up" }),
                            }),
                          "Order updated.",
                        )
                      }
                      title="Move Up"
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        run(
                          () =>
                            api("/api/admin/carousel/reorder", {
                              method: "POST",
                              body: JSON.stringify({ id: item.id, direction: "down" }),
                            }),
                          "Order updated.",
                        )
                      }
                      title="Move Down"
                    >
                      ↓
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        if (!window.confirm(`Delete ${item.title}?`)) return;
                        void run(
                          () => api(`/api/admin/carousel/${item.id}`, { method: "DELETE" }),
                          "Carousel slide deleted.",
                        );
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {rows.length === 0 && (
          <Card className="p-8 text-center">
            <p className="font-mono text-xs text-ink/40">
              0 Carousel items in database.
            </p>
            <p className="mt-1 text-xs text-ink/50">
              Use the form above to add a carousel slide, or import a Portfolio project.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ MEDIA ------------------------------ */

export type AdminMediaFile = {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  kind: string;
  size: number;
  url: string;
};

export function MediaAdmin({ onChanged }: { onChanged: () => void }) {
  const { rows, error, setError, load } = useCollection<AdminMediaFile>("/api/admin/media");
  const [draft, setDraft] = useState({ filename: "", url: "", kind: "image" });
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
      <SectionTitle title="Media Library" subtitle="Database media records and cloud storage URLs." />
      {error && <Notice tone="error">{error}</Notice>}
      {notice && (
        <div className="mt-3">
          <Notice tone="success">{notice}</Notice>
        </div>
      )}

      <Card className="mt-5 p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Media Name">
            <TextInput
              value={draft.filename}
              onChange={(v) => setDraft({ ...draft, filename: v })}
              placeholder="e.g. hero-thumbnail.jpg"
            />
          </Field>
          <Field label="Media URL">
            <TextInput
              value={draft.url}
              onChange={(v) => setDraft({ ...draft, url: v })}
              placeholder="https://..."
            />
          </Field>
          <Field label="Kind">
            <Select
              value={draft.kind}
              onChange={(v) => setDraft({ ...draft, kind: v })}
              options={[
                { value: "image", label: "Image" },
                { value: "video", label: "Video" },
              ]}
            />
          </Field>
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            variant="dark"
            onClick={() => {
              if (!draft.filename.trim() || !draft.url.trim()) {
                setError("Filename and URL are required.");
                return;
              }
              void run(async () => {
                await api("/api/admin/media", { method: "POST", body: JSON.stringify(draft) });
                setDraft({ filename: "", url: "", kind: "image" });
              }, "Media record registered.");
            }}
          >
            Register Media
          </Button>
        </div>
      </Card>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((file) => (
          <Card key={file.id} className="p-3">
            <p className="text-xs font-semibold text-ink truncate">{file.filename}</p>
            <p className="mono text-[0.6rem] text-ink/40 truncate mt-0.5">{file.url}</p>
            <div className="mt-3 flex justify-between items-center">
              <span className="mono text-[0.55rem] uppercase text-ink/30">{file.kind}</span>
              <Button
                variant="danger"
                onClick={() => {
                  if (!window.confirm(`Delete ${file.filename}?`)) return;
                  void run(() => api(`/api/admin/media/${file.id}`, { method: "DELETE" }), "Media file record deleted.");
                }}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
        {rows.length === 0 && (
          <p className="mono col-span-full p-6 text-center text-xs text-ink/40">
            0 media file records in database.
          </p>
        )}
      </div>
    </div>
  );
}

