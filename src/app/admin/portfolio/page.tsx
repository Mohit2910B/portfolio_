"use client";

import { useEffect, useState } from "react";
import MediaPickerModal from "@/components/admin/MediaPickerModal";

interface Project {
  id: number;
  title: string;
  description: string;
  categoryId?: number | null;
  categoryLabel?: string;
  year?: number;
  software?: string;
  tags?: string;
  externalUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  aspectRatio?: string;
  displaySize?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  sortOrder?: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function AdminPortfolioPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<"video" | "thumbnail">("video");

  const openMediaPicker = (target: "video" | "thumbnail") => {
    setPickerTarget(target);
    setPickerOpen(true);
  };

  const handleMediaSelect = (url: string) => {
    if (!editingProject) return;
    if (pickerTarget === "video") {
      setEditingProject({ ...editingProject, videoUrl: url });
    } else {
      setEditingProject({ ...editingProject, thumbnailUrl: url });
    }
  };

  const handleVideoUrlChange = (val: string) => {
    if (!editingProject) return;
    const matchFile = val.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/);
    const matchId = val.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
    const driveId = matchFile ? matchFile[1] : matchId ? matchId[1] : null;

    if (driveId) {
      const directUrl = `https://drive.google.com/uc?id=${driveId}&export=download`;
      const thumbUrl = `https://drive.google.com/thumbnail?id=${driveId}&sz=w1200`;
      const external = `https://drive.google.com/file/d/${driveId}/view`;
      setEditingProject({
        ...editingProject,
        videoUrl: directUrl,
        thumbnailUrl: editingProject.thumbnailUrl || thumbUrl,
        externalUrl: editingProject.externalUrl || external,
      });
    } else {
      setEditingProject({ ...editingProject, videoUrl: val });
    }
  };

  const fetchProjects = async () => {
    try {
      const [resP, resC] = await Promise.all([
        fetch("/api/projects?all=true"),
        fetch("/api/categories"),
      ]);
      const dataP = await resP.json();
      const dataC = await resC.json();
      if (dataP.projects) setProjects(dataP.projects);
      if (dataC.categories) setCategories(dataC.categories);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject?.title) return;
    setSaving(true);
    setMessage("");

    try {
      const method = editingProject.id ? "PUT" : "POST";
      const res = await fetch("/api/projects", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingProject),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed.");
      }

      setMessage("Project saved successfully!");
      setEditingProject(null);
      await fetchProjects();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      const res = await fetch(`/api/projects?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects(projects.filter((p) => p.id !== id));
      }
    } catch {}
  };

  const handleDuplicate = async (p: Project) => {
    const copy = {
      ...p,
      id: undefined,
      title: `${p.title} (COPY)`,
      sortOrder: (p.sortOrder || 0) + 1,
    };
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(copy),
      });
      if (res.ok) await fetchProjects();
    } catch {}
  };

  const handleTogglePublish = async (p: Project) => {
    try {
      const res = await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...p, isPublished: !p.isPublished }),
      });
      if (res.ok) await fetchProjects();
    } catch {}
  };

  const handleToggleFeature = async (p: Project) => {
    try {
      const res = await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...p, isFeatured: !p.isFeatured }),
      });
      if (res.ok) await fetchProjects();
    } catch {}
  };

  // Persistent Reordering
  const moveProject = async (index: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= projects.length) return;

    const list = [...projects];
    const temp = list[index];
    list[index] = list[newIdx];
    list[newIdx] = temp;

    // Update sortOrder values
    const updatedList = list.map((item, idx) => ({ ...item, sortOrder: idx + 1 }));
    setProjects(updatedList);

    try {
      await fetch("/api/projects/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: updatedList.map((x) => ({ id: x.id, sortOrder: x.sortOrder })),
        }),
      });
    } catch {}
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(243,240,232,0.12)] pb-6">
        <div>
          <div className="font-mono text-xs text-[#C7A56A] uppercase tracking-widest">
            CMS MODULE
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl uppercase tracking-tight">
            PORTFOLIO PROJECTS ({projects.length})
          </h1>
        </div>

        <button
          onClick={() =>
            setEditingProject({
              title: "",
              description: "",
              year: 2026,
              software: "Premiere Pro, After Effects",
              tags: "Commercial",
              aspectRatio: "16:9",
              displaySize: "medium",
              isFeatured: false,
              isPublished: true,
            })
          }
          className="px-5 py-2.5 bg-[#C7A56A] text-[#080808] font-mono text-xs font-bold tracking-widest uppercase hover:bg-[#D8B77C] transition-all self-start"
        >
          + CREATE NEW PROJECT
        </button>
      </div>

      {message && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono text-xs uppercase tracking-widest">
          {message}
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111111] border border-[rgba(243,240,232,0.2)] p-8 w-full max-w-2xl space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-[rgba(243,240,232,0.12)] pb-4">
              <h2 className="font-display font-bold text-xl uppercase tracking-tight text-[#F3F0E8]">
                {editingProject.id ? "EDIT PROJECT" : "CREATE NEW PROJECT"}
              </h2>
              <button
                onClick={() => setEditingProject(null)}
                className="text-[#8A8A8A] hover:text-[#F3F0E8] font-mono text-xs"
              >
                CLOSE [ESC]
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-[#8A8A8A] uppercase">TITLE *</label>
                <input
                  type="text"
                  required
                  placeholder="CYBERPUNK NEON — BRAND COMMERCIAL"
                  value={editingProject.title || ""}
                  onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                  className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] px-4 py-2.5 text-sm text-[#F3F0E8] focus:border-[#C7A56A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#8A8A8A] uppercase">CATEGORY</label>
                  <select
                    value={editingProject.categoryId || ""}
                    onChange={(e) => {
                      const selectedId = Number(e.target.value) || null;
                      const catObj = categories.find((c) => c.id === selectedId);
                      setEditingProject({
                        ...editingProject,
                        categoryId: selectedId,
                        categoryLabel: catObj ? catObj.name : "",
                      });
                    }}
                    className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] px-4 py-2.5 text-xs text-[#F3F0E8] focus:border-[#C7A56A] focus:outline-none"
                  >
                    <option value="">-- SELECT CATEGORY --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[#8A8A8A] uppercase">RELEASE YEAR</label>
                  <input
                    type="number"
                    value={editingProject.year || 2026}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, year: Number(e.target.value) })
                    }
                    className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] px-4 py-2.5 text-xs text-[#F3F0E8] focus:border-[#C7A56A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[#8A8A8A] uppercase">VIDEO URL (DIRECT MP4 OR GOOGLE DRIVE)</label>
                  <span className="text-[10px] text-[#C7A56A] font-bold">AUTO-DETECTS DRIVE</span>
                </div>
                <input
                  type="text"
                  placeholder="https://...mp4 or paste Google Drive link..."
                  value={editingProject.videoUrl || ""}
                  onChange={(e) => handleVideoUrlChange(e.target.value)}
                  className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] px-4 py-2.5 text-xs text-[#F3F0E8] focus:border-[#C7A56A] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[#8A8A8A] uppercase">THUMBNAIL URL (IMAGE)</label>
                  <button
                    type="button"
                    onClick={() => openMediaPicker("thumbnail")}
                    className="text-[#C7A56A] hover:underline text-[10px] font-bold uppercase tracking-wider"
                  >
                    📁 SELECT FROM MEDIA LIBRARY
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="https://...jpg or /uploads/..."
                  value={editingProject.thumbnailUrl || ""}
                  onChange={(e) => setEditingProject({ ...editingProject, thumbnailUrl: e.target.value })}
                  className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] px-4 py-2.5 text-xs text-[#F3F0E8] focus:border-[#C7A56A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#8A8A8A] uppercase">SOFTWARE USED</label>
                  <input
                    type="text"
                    placeholder="Premiere Pro, After Effects, DaVinci"
                    value={editingProject.software || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, software: e.target.value })}
                    className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] px-4 py-2.5 text-xs text-[#F3F0E8] focus:border-[#C7A56A] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#8A8A8A] uppercase">TAGS</label>
                  <input
                    type="text"
                    placeholder="Commercial, 3D, VFX"
                    value={editingProject.tags || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, tags: e.target.value })}
                    className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] px-4 py-2.5 text-xs text-[#F3F0E8] focus:border-[#C7A56A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#8A8A8A] uppercase">ASPECT RATIO</label>
                  <select
                    value={editingProject.aspectRatio || "16:9"}
                    onChange={(e) => setEditingProject({ ...editingProject, aspectRatio: e.target.value })}
                    className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] px-4 py-2.5 text-xs text-[#F3F0E8] focus:border-[#C7A56A] focus:outline-none"
                  >
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="9:16">9:16 (Vertical Reel)</option>
                    <option value="1:1">1:1 (Square)</option>
                    <option value="4:5">4:5 (Portrait)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[#8A8A8A] uppercase">DISPLAY SIZE</label>
                  <select
                    value={editingProject.displaySize || "medium"}
                    onChange={(e) => setEditingProject({ ...editingProject, displaySize: e.target.value })}
                    className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] px-4 py-2.5 text-xs text-[#F3F0E8] focus:border-[#C7A56A] focus:outline-none"
                  >
                    <option value="large">Full-Width Large</option>
                    <option value="medium">Half Grid Medium</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#8A8A8A] uppercase">EXTERNAL URL</label>
                <input
                  type="text"
                  placeholder="https://youtube.com/..."
                  value={editingProject.externalUrl || ""}
                  onChange={(e) => setEditingProject({ ...editingProject, externalUrl: e.target.value })}
                  className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] px-4 py-2.5 text-xs text-[#F3F0E8] focus:border-[#C7A56A] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#8A8A8A] uppercase">DESCRIPTION</label>
                <textarea
                  rows={4}
                  placeholder="Project overview & narrative details..."
                  value={editingProject.description || ""}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-3 text-xs text-[#F3F0E8] focus:border-[#C7A56A] focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProject.isPublished ?? true}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, isPublished: e.target.checked })
                    }
                    className="accent-[#C7A56A]"
                  />
                  <span>PUBLISHED</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProject.isFeatured ?? false}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, isFeatured: e.target.checked })
                    }
                    className="accent-[#C7A56A]"
                  />
                  <span>FEATURED PROJECT</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-5 py-2.5 border border-[rgba(243,240,232,0.2)] text-[#8A8A8A] hover:text-[#F3F0E8]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#C7A56A] text-[#080808] font-bold uppercase tracking-wider hover:bg-[#D8B77C]"
                >
                  {saving ? "SAVING..." : "SAVE PROJECT"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Projects List Table & Reordering */}
      {loading ? (
        <div className="py-12 text-center font-mono text-xs text-[#8A8A8A] border border-[rgba(243,240,232,0.12)]">
          LOADING PORTFOLIO PROJECTS...
        </div>
      ) : projects.length === 0 ? (
        <div className="py-12 text-center font-mono text-xs text-[#8A8A8A] border border-[rgba(243,240,232,0.12)]">
          NO PROJECTS IN DATABASE. CLICK "+ CREATE NEW PROJECT" ABOVE TO ADD ONE.
        </div>
      ) : (
        <div className="border border-[rgba(243,240,232,0.12)] bg-[#111111] overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[rgba(243,240,232,0.12)] text-[#8A8A8A] uppercase bg-[#080808]">
                <th className="p-4 w-16">ORDER</th>
                <th className="p-4">PROJECT TITLE</th>
                <th className="p-4">CATEGORY</th>
                <th className="p-4">STATUS</th>
                <th className="p-4">FEATURED</th>
                <th className="p-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(243,240,232,0.08)]">
              {projects.map((p, idx) => (
                <tr key={p.id} className="hover:bg-[#161616] transition-colors">
                  <td className="p-4 text-center font-bold text-[#C7A56A]">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => moveProject(idx, "up")}
                        disabled={idx === 0}
                        className="p-1 hover:text-[#F3F0E8] disabled:opacity-20"
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveProject(idx, "down")}
                        disabled={idx === projects.length - 1}
                        className="p-1 hover:text-[#F3F0E8] disabled:opacity-20"
                        title="Move Down"
                      >
                        ▼
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      {p.thumbnailUrl ? (() => {
                        const match = p.thumbnailUrl.match(/[?&]id=([a-zA-Z0-9_-]{20,})/) || p.thumbnailUrl.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/);
                        const thumbSrc = match ? `/api/media/drive-thumb?id=${match[1]}` : p.thumbnailUrl;
                        return (
                          <img
                            src={thumbSrc}
                            referrerPolicy="no-referrer"
                            alt=""
                            className="w-10 h-14 object-cover rounded border border-[rgba(243,240,232,0.15)] bg-black shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = p.thumbnailUrl || "";
                            }}
                          />
                        );
                      })() : (
                        <div className="w-10 h-14 rounded border border-[rgba(243,240,232,0.1)] bg-[#0a0a0a] flex items-center justify-center text-[8px] text-[#8A8A8A] shrink-0">
                          NO IMG
                        </div>
                      )}
                      <div>
                        <div className="font-display font-bold text-sm uppercase text-[#F3F0E8]">
                          {p.title}
                        </div>
                        <div className="text-[10px] text-[#8A8A8A] truncate max-w-xs">{p.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-[#8A8A8A]">
                    {categories.find((c) => c.id === p.categoryId)?.name || p.categoryLabel || "UNASSIGNED"}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleTogglePublish(p)}
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        p.isPublished ? "bg-emerald-950 text-emerald-400" : "bg-rose-950 text-rose-400"
                      }`}
                    >
                      {p.isPublished ? "PUBLISHED" : "DRAFT"}
                    </button>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleFeature(p)}
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        p.isFeatured ? "bg-amber-950 text-amber-400" : "bg-[#1A1A1A] text-[#8A8A8A]"
                      }`}
                    >
                      {p.isFeatured ? "★ FEATURED" : "NORMAL"}
                    </button>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => setEditingProject(p)}
                      className="px-2.5 py-1 bg-[#1A1A1A] text-[#F3F0E8] hover:text-[#C7A56A]"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => handleDuplicate(p)}
                      className="px-2.5 py-1 bg-[#1A1A1A] text-[#F3F0E8] hover:text-[#C7A56A]"
                    >
                      COPY
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="px-2.5 py-1 bg-rose-950/60 text-rose-300 hover:bg-rose-900/80"
                    >
                      DELETE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <MediaPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleMediaSelect}
        filterKind={pickerTarget === "video" ? "video" : "image"}
      />
    </div>
  );
}
