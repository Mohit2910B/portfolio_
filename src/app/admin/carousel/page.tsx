"use client";

import { useEffect, useState } from "react";

interface CarouselItem {
  id: number;
  title: string;
  category: string;
  badge: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;
  aspectRatio: string;
  description: string;
  sortOrder: number;
  isPublished: boolean;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function AdminCarouselPage() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Partial<CarouselItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const fetchItems = async () => {
    try {
      const [resI, resC] = await Promise.all([
        fetch("/api/carousel?all=true"),
        fetch("/api/categories"),
      ]);
      const dataI = await resI.json();
      const dataC = await resC.json();
      if (dataI.items) setItems(dataI.items);
      if (dataC.categories) setCategories(dataC.categories);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleVideoUrlChange = (val: string) => {
    if (!editingItem) return;
    const matchFile = val.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/);
    const matchId = val.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
    const driveId = matchFile ? matchFile[1] : matchId ? matchId[1] : null;

    if (driveId) {
      const streamUrl = `https://drive.google.com/uc?id=${driveId}&export=download`;
      const thumbUrl = `https://drive.google.com/thumbnail?id=${driveId}&sz=w1200`;
      setEditingItem({
        ...editingItem,
        videoUrl: streamUrl,
        thumbnailUrl: editingItem.thumbnailUrl || thumbUrl,
      });
    } else {
      setEditingItem({ ...editingItem, videoUrl: val });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.title) return;
    setSaving(true);
    setMessage("");

    try {
      const method = editingItem.id ? "PUT" : "POST";
      const res = await fetch("/api/carousel", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingItem),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed.");
      }

      setMessage("Carousel reel saved successfully!");
      setEditingItem(null);
      await fetchItems();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this carousel video?")) return;
    try {
      const res = await fetch(`/api/carousel?id=${id}`, { method: "DELETE" });
      if (res.ok) setItems(items.filter((x) => x.id !== id));
    } catch {}
  };

  const handleDuplicate = async (item: CarouselItem) => {
    const copy = { ...item, id: undefined, title: `${item.title} (COPY)` };
    try {
      const res = await fetch("/api/carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(copy),
      });
      if (res.ok) await fetchItems();
    } catch {}
  };

  const moveItem = async (index: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= items.length) return;

    const list = [...items];
    const temp = list[index];
    list[index] = list[newIdx];
    list[newIdx] = temp;

    const updatedList = list.map((x, idx) => ({ ...x, sortOrder: idx + 1 }));
    setItems(updatedList);

    try {
      await fetch("/api/carousel/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: updatedList.map((x) => ({ id: x.id, sortOrder: x.sortOrder })),
        }),
      });
    } catch {}
  };

  const filteredItems = items.filter((x) => {
    if (filterCategory === "all") return true;
    return (x.category || "").toLowerCase() === filterCategory.toLowerCase();
  });

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(243,240,232,0.12)] pb-6">
        <div>
          <div className="font-mono text-xs text-[#C7A56A] uppercase tracking-widest">
            CMS MODULE
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl uppercase tracking-tight">
            SHOWREEL CAROUSEL ({items.length})
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-[#111111] border border-[rgba(243,240,232,0.2)] px-3 py-2 text-xs font-mono text-[#F3F0E8] uppercase"
          >
            <option value="all">ALL CATEGORIES ({items.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={() =>
              setEditingItem({
                title: "",
                category: categories[0]?.name || "Bansari Resort",
                badge: "FEATURED REEL",
                duration: "01:00",
                aspectRatio: "16:9",
                description: "",
                isPublished: true,
              })
            }
            className="px-5 py-2.5 bg-[#C7A56A] text-[#080808] font-mono text-xs font-bold tracking-widest uppercase hover:bg-[#D8B77C] transition-all"
          >
            + ADD CAROUSEL REEL
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono text-xs uppercase tracking-widest">
          {message}
        </div>
      )}

      {/* Modal Form */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111111] border border-[rgba(243,240,232,0.2)] p-8 w-full max-w-xl space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-[rgba(243,240,232,0.12)] pb-4">
              <h2 className="font-display font-bold text-xl uppercase tracking-tight text-[#F3F0E8]">
                {editingItem.id ? "EDIT CAROUSEL REEL" : "ADD CAROUSEL REEL"}
              </h2>
              <button
                onClick={() => setEditingItem(null)}
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
                  placeholder="e.g. Bansari Resort 02"
                  value={editingItem.title || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] px-4 py-2.5 text-sm text-[#F3F0E8] focus:border-[#C7A56A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#8A8A8A] uppercase">CATEGORY</label>
                  <select
                    value={editingItem.category || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] px-4 py-2.5 text-xs text-[#F3F0E8] focus:border-[#C7A56A] focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[#8A8A8A] uppercase">BADGE</label>
                  <input
                    type="text"
                    placeholder="FEATURED REEL / 4K"
                    value={editingItem.badge || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, badge: e.target.value })}
                    className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] px-4 py-2.5 text-xs text-[#F3F0E8] focus:border-[#C7A56A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[#8A8A8A] uppercase">VIDEO URL (DIRECT MP4 OR GOOGLE DRIVE)</label>
                  <span className="text-[10px] text-[#C7A56A]">AUTO-DETECTS DRIVE</span>
                </div>
                <input
                  type="text"
                  placeholder="Paste direct .mp4 or Google Drive link..."
                  value={editingItem.videoUrl || ""}
                  onChange={(e) => handleVideoUrlChange(e.target.value)}
                  className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] px-4 py-2.5 text-xs text-[#F3F0E8] focus:border-[#C7A56A] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#8A8A8A] uppercase">THUMBNAIL POSTER URL</label>
                <input
                  type="text"
                  placeholder="Auto-filled from Drive or custom image URL..."
                  value={editingItem.thumbnailUrl || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, thumbnailUrl: e.target.value })}
                  className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] px-4 py-2.5 text-xs text-[#F3F0E8] focus:border-[#C7A56A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#8A8A8A] uppercase">DURATION</label>
                  <input
                    type="text"
                    placeholder="01:00"
                    value={editingItem.duration || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, duration: e.target.value })}
                    className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] px-4 py-2.5 text-xs text-[#F3F0E8] focus:border-[#C7A56A] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#8A8A8A] uppercase">ASPECT RATIO</label>
                  <select
                    value={editingItem.aspectRatio || "16:9"}
                    onChange={(e) => setEditingItem({ ...editingItem, aspectRatio: e.target.value })}
                    className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] px-4 py-2.5 text-xs text-[#F3F0E8] focus:border-[#C7A56A] focus:outline-none"
                  >
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="9:16">9:16 (Vertical Reel)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#8A8A8A] uppercase">DESCRIPTION</label>
                <textarea
                  rows={3}
                  placeholder="Short description of the edit..."
                  value={editingItem.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-3 text-xs text-[#F3F0E8] focus:border-[#C7A56A] focus:outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-5 py-2.5 border border-[rgba(243,240,232,0.2)] text-[#8A8A8A] hover:text-[#F3F0E8]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#C7A56A] text-[#080808] font-bold uppercase tracking-wider hover:bg-[#D8B77C]"
                >
                  {saving ? "SAVING..." : "SAVE CAROUSEL REEL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List Table */}
      {loading ? (
        <div className="py-12 text-center font-mono text-xs text-[#8A8A8A] border border-[rgba(243,240,232,0.12)]">
          LOADING CAROUSEL REELS...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-12 text-center font-mono text-xs text-[#8A8A8A] border border-[rgba(243,240,232,0.12)]">
          CAROUSEL IS EMPTY. CLICK "+ ADD CAROUSEL REEL" ABOVE TO ADD VIDEOS.
        </div>
      ) : (
        <div className="border border-[rgba(243,240,232,0.12)] bg-[#111111] overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[rgba(243,240,232,0.12)] text-[#8A8A8A] uppercase bg-[#080808]">
                <th className="p-4 w-16">ORDER</th>
                <th className="p-4">THUMB</th>
                <th className="p-4">TITLE</th>
                <th className="p-4">CATEGORY</th>
                <th className="p-4">RATIO</th>
                <th className="p-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(243,240,232,0.06)]">
              {filteredItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-[#161616] transition-colors">
                  <td className="p-4 text-[#8A8A8A]">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => moveItem(idx, "up")}
                        disabled={idx === 0}
                        className="hover:text-[#C7A56A] disabled:opacity-20"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveItem(idx, "down")}
                        disabled={idx === filteredItems.length - 1}
                        className="hover:text-[#C7A56A] disabled:opacity-20"
                      >
                        ▼
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    {item.thumbnailUrl ? (() => {
                      const match = item.thumbnailUrl.match(/[?&]id=([a-zA-Z0-9_-]{20,})/) || item.thumbnailUrl.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/);
                      const thumbSrc = match ? `/api/media/drive-thumb?id=${match[1]}` : item.thumbnailUrl;
                      return (
                        <img
                          src={thumbSrc}
                          referrerPolicy="no-referrer"
                          alt=""
                          className="w-12 h-16 object-cover rounded border border-[rgba(243,240,232,0.1)] bg-black"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = item.thumbnailUrl;
                          }}
                        />
                      );
                    })() : (
                      <div className="w-12 h-16 bg-black border border-[rgba(243,240,232,0.1)] flex items-center justify-center text-[10px] text-[#8A8A8A]">
                        NO THUMB
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-bold text-[#F3F0E8] max-w-xs truncate">
                    {item.title}
                  </td>
                  <td className="p-4 text-[#C7A56A]">{item.category}</td>
                  <td className="p-4 text-[#8A8A8A]">{item.aspectRatio}</td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#C7A56A] hover:text-[#080808] text-[#F3F0E8] transition-colors"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => handleDuplicate(item)}
                      className="px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#8A8A8A] hover:text-[#080808] text-[#8A8A8A] transition-colors"
                    >
                      COPY
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-2.5 py-1 bg-red-950/40 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
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
    </div>
  );
}
