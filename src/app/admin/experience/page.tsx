"use client";

import { useEffect, useState } from "react";

interface Experience {
  id: number;
  company: string;
  role: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
}

export default function AdminExperiencePage() {
  const [items, setItems] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Experience> | null>(null);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/experience");
      const data = await res.json();
      if (data.experience) setItems(data.experience);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.company || !editing?.role) return;

    try {
      const method = editing.id ? "PUT" : "POST";
      const res = await fetch("/api/experience", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });

      if (res.ok) {
        setEditing(null);
        await fetchItems();
      }
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete experience item?")) return;
    try {
      const res = await fetch(`/api/experience?id=${id}`, { method: "DELETE" });
      if (res.ok) setItems(items.filter((x) => x.id !== id));
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
            CAREER EXPERIENCE ({items.length})
          </h1>
        </div>

        <button
          onClick={() =>
            setEditing({
              company: "",
              role: "",
              description: "",
              startDate: "2024",
              endDate: "PRESENT",
              location: "Remote",
            })
          }
          className="px-5 py-2.5 bg-[#C7A56A] text-[#080808] font-mono text-xs font-bold tracking-widest uppercase hover:bg-[#D8B77C]"
        >
          + ADD EXPERIENCE
        </button>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="border border-[rgba(243,240,232,0.2)] bg-[#111111] p-6 space-y-4 font-mono text-xs">
          <h2 className="font-display font-bold text-lg text-[#F3F0E8] uppercase">
            {editing.id ? "EDIT EXPERIENCE" : "NEW EXPERIENCE"}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">COMPANY / AGENCY *</label>
              <input
                type="text"
                required
                placeholder="FREELANCE CREATIVE DIRECTOR"
                value={editing.company || ""}
                onChange={(e) => setEditing({ ...editing, company: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-sm text-[#F3F0E8]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">ROLE *</label>
              <input
                type="text"
                required
                placeholder="Lead Video Editor"
                value={editing.role || ""}
                onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">START DATE</label>
              <input
                type="text"
                placeholder="2021"
                value={editing.startDate || ""}
                onChange={(e) => setEditing({ ...editing, startDate: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">END DATE</label>
              <input
                type="text"
                placeholder="PRESENT"
                value={editing.endDate || ""}
                onChange={(e) => setEditing({ ...editing, endDate: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">LOCATION</label>
              <input
                type="text"
                placeholder="Mumbai / Remote"
                value={editing.location || ""}
                onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[#8A8A8A]">DESCRIPTION</label>
            <textarea
              rows={3}
              placeholder="Responsibilities & achievements..."
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
              SAVE EXPERIENCE
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-12 text-center font-mono text-xs text-[#8A8A8A]">LOADING EXPERIENCE...</div>
      ) : (
        <div className="border border-[rgba(243,240,232,0.12)] bg-[#111111] overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[rgba(243,240,232,0.12)] text-[#8A8A8A] uppercase bg-[#080808]">
                <th className="p-4">COMPANY</th>
                <th className="p-4">ROLE</th>
                <th className="p-4">TIMELINE</th>
                <th className="p-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(243,240,232,0.08)]">
              {items.map((x) => (
                <tr key={x.id} className="hover:bg-[#161616]">
                  <td className="p-4 font-bold text-[#F3F0E8]">{x.company}</td>
                  <td className="p-4 text-[#C7A56A] font-bold">{x.role}</td>
                  <td className="p-4 text-[#8A8A8A]">{x.startDate} — {x.endDate}</td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => setEditing(x)} className="px-2.5 py-1 bg-[#1A1A1A] text-[#F3F0E8]">
                      EDIT
                    </button>
                    <button onClick={() => handleDelete(x.id)} className="px-2.5 py-1 bg-rose-950/60 text-rose-300">
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
