"use client";

import { useEffect, useState } from "react";

interface Tool {
  id: number;
  name: string;
  category: string;
  proficiency: number;
}

export default function AdminToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Tool> | null>(null);

  const fetchTools = async () => {
    try {
      const res = await fetch("/api/tools");
      const data = await res.json();
      if (data.tools) setTools(data.tools);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.name) return;

    try {
      const method = editing.id ? "PUT" : "POST";
      const res = await fetch("/api/tools", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });

      if (res.ok) {
        setEditing(null);
        await fetchTools();
      }
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete tool?")) return;
    try {
      const res = await fetch(`/api/tools?id=${id}`, { method: "DELETE" });
      if (res.ok) setTools(tools.filter((t) => t.id !== id));
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
            TOOLS & SOFTWARE ({tools.length})
          </h1>
        </div>

        <button
          onClick={() => setEditing({ name: "", category: "Editing", proficiency: 95 })}
          className="px-5 py-2.5 bg-[#C7A56A] text-[#080808] font-mono text-xs font-bold tracking-widest uppercase hover:bg-[#D8B77C]"
        >
          + ADD TOOL
        </button>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="border border-[rgba(243,240,232,0.2)] bg-[#111111] p-6 space-y-4 font-mono text-xs">
          <h2 className="font-display font-bold text-lg text-[#F3F0E8] uppercase">
            {editing.id ? "EDIT TOOL" : "NEW TOOL"}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">TOOL NAME *</label>
              <input
                type="text"
                required
                placeholder="Adobe Premiere Pro"
                value={editing.name || ""}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-sm text-[#F3F0E8]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">CATEGORY</label>
              <input
                type="text"
                placeholder="Editing / Motion / 3D"
                value={editing.category || ""}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[#8A8A8A]">PROFICIENCY (1 - 100%)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={editing.proficiency || 95}
              onChange={(e) => setEditing({ ...editing, proficiency: Number(e.target.value) })}
              className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
            />
          </div>
          <div className="flex justify-end space-x-4 pt-2">
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border border-[rgba(243,240,232,0.2)]">
              CANCEL
            </button>
            <button type="submit" className="px-5 py-2 bg-[#C7A56A] text-[#080808] font-bold">
              SAVE TOOL
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-12 text-center font-mono text-xs text-[#8A8A8A]">LOADING TOOLS...</div>
      ) : (
        <div className="border border-[rgba(243,240,232,0.12)] bg-[#111111] overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[rgba(243,240,232,0.12)] text-[#8A8A8A] uppercase bg-[#080808]">
                <th className="p-4">SOFTWARE NAME</th>
                <th className="p-4">CATEGORY</th>
                <th className="p-4">PROFICIENCY</th>
                <th className="p-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(243,240,232,0.08)]">
              {tools.map((t) => (
                <tr key={t.id} className="hover:bg-[#161616]">
                  <td className="p-4 font-bold text-[#F3F0E8]">{t.name}</td>
                  <td className="p-4 text-[#8A8A8A]">{t.category}</td>
                  <td className="p-4 text-[#C7A56A] font-bold">{t.proficiency}%</td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => setEditing(t)} className="px-2.5 py-1 bg-[#1A1A1A] text-[#F3F0E8]">
                      EDIT
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="px-2.5 py-1 bg-rose-950/60 text-rose-300">
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
