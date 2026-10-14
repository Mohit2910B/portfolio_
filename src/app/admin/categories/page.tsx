"use client";

import { useEffect, useState } from "react";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCat, setEditingCat] = useState<Partial<Category> | null>(null);

  const fetchCats = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat?.name) return;

    try {
      const method = editingCat.id ? "PUT" : "POST";
      const res = await fetch("/api/categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCat),
      });

      if (res.ok) {
        setEditingCat(null);
        await fetchCats();
      }
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete category?")) return;
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      if (res.ok) setCategories(categories.filter((c) => c.id !== id));
    } catch {}
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(243,240,232,0.12)] pb-6">
        <div>
          <div className="font-mono text-xs text-[#C7A56A] uppercase tracking-widest">
            CMS MODULE
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl uppercase tracking-tight">
            CATEGORIES ({categories.length})
          </h1>
        </div>

        <button
          onClick={() => setEditingCat({ name: "", slug: "", description: "" })}
          className="px-5 py-2.5 bg-[#C7A56A] text-[#080808] font-mono text-xs font-bold tracking-widest uppercase hover:bg-[#D8B77C]"
        >
          + ADD CATEGORY
        </button>
      </div>

      {editingCat && (
        <form onSubmit={handleSave} className="border border-[rgba(243,240,232,0.2)] bg-[#111111] p-6 space-y-4 font-mono text-xs">
          <h2 className="font-display font-bold text-lg text-[#F3F0E8] uppercase">
            {editingCat.id ? "EDIT CATEGORY" : "NEW CATEGORY"}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">NAME *</label>
              <input
                type="text"
                required
                placeholder="e.g. Commercial"
                value={editingCat.name || ""}
                onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-sm text-[#F3F0E8]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">SLUG</label>
              <input
                type="text"
                placeholder="commercial"
                value={editingCat.slug || ""}
                onChange={(e) => setEditingCat({ ...editingCat, slug: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-4 pt-2">
            <button type="button" onClick={() => setEditingCat(null)} className="px-4 py-2 border border-[rgba(243,240,232,0.2)]">
              CANCEL
            </button>
            <button type="submit" className="px-5 py-2 bg-[#C7A56A] text-[#080808] font-bold">
              SAVE CATEGORY
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-12 text-center font-mono text-xs text-[#8A8A8A]">LOADING CATEGORIES...</div>
      ) : (
        <div className="border border-[rgba(243,240,232,0.12)] bg-[#111111] overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[rgba(243,240,232,0.12)] text-[#8A8A8A] uppercase bg-[#080808]">
                <th className="p-4">CATEGORY NAME</th>
                <th className="p-4">SLUG</th>
                <th className="p-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(243,240,232,0.08)]">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-[#161616]">
                  <td className="p-4 font-bold text-[#F3F0E8]">{c.name}</td>
                  <td className="p-4 text-[#C7A56A]">{c.slug}</td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => setEditingCat(c)} className="px-2.5 py-1 bg-[#1A1A1A] text-[#F3F0E8]">
                      EDIT
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="px-2.5 py-1 bg-rose-950/60 text-rose-300">
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
