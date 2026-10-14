"use client";

import { useEffect, useState } from "react";

interface Skill {
  id: number;
  name: string;
  category: string;
  description: string;
  level: number;
}

export default function AdminSkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Skill> | null>(null);

  const fetchSkills = async () => {
    try {
      const res = await fetch("/api/skills");
      const data = await res.json();
      if (data.skills) setSkills(data.skills);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.name) return;

    try {
      const method = editing.id ? "PUT" : "POST";
      const res = await fetch("/api/skills", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });

      if (res.ok) {
        setEditing(null);
        await fetchSkills();
      }
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete skill?")) return;
    try {
      const res = await fetch(`/api/skills?id=${id}`, { method: "DELETE" });
      if (res.ok) setSkills(skills.filter((s) => s.id !== id));
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
            SKILLS & CAPABILITIES ({skills.length})
          </h1>
        </div>

        <button
          onClick={() => setEditing({ name: "", category: "POST-PRODUCTION", level: 90, description: "" })}
          className="px-5 py-2.5 bg-[#C7A56A] text-[#080808] font-mono text-xs font-bold tracking-widest uppercase hover:bg-[#D8B77C]"
        >
          + ADD SKILL
        </button>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="border border-[rgba(243,240,232,0.2)] bg-[#111111] p-6 space-y-4 font-mono text-xs">
          <h2 className="font-display font-bold text-lg text-[#F3F0E8] uppercase">
            {editing.id ? "EDIT SKILL" : "NEW SKILL"}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">SKILL NAME *</label>
              <input
                type="text"
                required
                placeholder="Cinematic Video Editing"
                value={editing.name || ""}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-sm text-[#F3F0E8]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">CATEGORY</label>
              <input
                type="text"
                placeholder="POST-PRODUCTION / COLOR / 3D"
                value={editing.category || ""}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[#8A8A8A]">LEVEL PERCENTAGE (1 - 100%)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={editing.level || 90}
              onChange={(e) => setEditing({ ...editing, level: Number(e.target.value) })}
              className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[#8A8A8A]">DESCRIPTION</label>
            <textarea
              rows={2}
              value={editing.description || ""}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
            />
          </div>
          <div className="flex justify-end space-x-4 pt-2">
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border border-[rgba(243,240,232,0.2)]">
              CANCEL
            </button>
            <button type="submit" className="px-5 py-2 bg-[#C7A56A] text-[#080808] font-bold">
              SAVE SKILL
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-12 text-center font-mono text-xs text-[#8A8A8A]">LOADING SKILLS...</div>
      ) : (
        <div className="border border-[rgba(243,240,232,0.12)] bg-[#111111] overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[rgba(243,240,232,0.12)] text-[#8A8A8A] uppercase bg-[#080808]">
                <th className="p-4">SKILL NAME</th>
                <th className="p-4">CATEGORY</th>
                <th className="p-4">LEVEL</th>
                <th className="p-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(243,240,232,0.08)]">
              {skills.map((s) => (
                <tr key={s.id} className="hover:bg-[#161616]">
                  <td className="p-4 font-bold text-[#F3F0E8]">{s.name}</td>
                  <td className="p-4 text-[#8A8A8A]">{s.category}</td>
                  <td className="p-4 text-[#C7A56A] font-bold">{s.level}%</td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => setEditing(s)} className="px-2.5 py-1 bg-[#1A1A1A] text-[#F3F0E8]">
                      EDIT
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="px-2.5 py-1 bg-rose-950/60 text-rose-300">
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
