"use client";

import { useEffect, useState } from "react";

interface Service {
  id: number;
  title: string;
  description: string;
  deliverables?: string;
  priceFrom?: string;
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Service> | null>(null);

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/services");
      const data = await res.json();
      if (data.services) setServices(data.services);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.title) return;

    try {
      const method = editing.id ? "PUT" : "POST";
      const res = await fetch("/api/services", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });

      if (res.ok) {
        setEditing(null);
        await fetchServices();
      }
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete service?")) return;
    try {
      const res = await fetch(`/api/services?id=${id}`, { method: "DELETE" });
      if (res.ok) setServices(services.filter((s) => s.id !== id));
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
            SERVICES ({services.length})
          </h1>
        </div>

        <button
          onClick={() => setEditing({ title: "", description: "", deliverables: "", priceFrom: "$500+" })}
          className="px-5 py-2.5 bg-[#C7A56A] text-[#080808] font-mono text-xs font-bold tracking-widest uppercase hover:bg-[#D8B77C]"
        >
          + ADD SERVICE
        </button>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="border border-[rgba(243,240,232,0.2)] bg-[#111111] p-6 space-y-4 font-mono text-xs">
          <h2 className="font-display font-bold text-lg text-[#F3F0E8] uppercase">
            {editing.id ? "EDIT SERVICE" : "NEW SERVICE"}
          </h2>
          <div className="space-y-1">
            <label className="text-[#8A8A8A]">TITLE *</label>
            <input
              type="text"
              required
              placeholder="01 / Video Editing"
              value={editing.title || ""}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-sm text-[#F3F0E8]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[#8A8A8A]">DESCRIPTION</label>
            <textarea
              rows={3}
              value={editing.description || ""}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">DELIVERABLES</label>
              <input
                type="text"
                placeholder="4K Export, Color Correction, Multi-cam"
                value={editing.deliverables || ""}
                onChange={(e) => setEditing({ ...editing, deliverables: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">PRICE FROM</label>
              <input
                type="text"
                placeholder="$500+"
                value={editing.priceFrom || ""}
                onChange={(e) => setEditing({ ...editing, priceFrom: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-4 pt-2">
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border border-[rgba(243,240,232,0.2)]">
              CANCEL
            </button>
            <button type="submit" className="px-5 py-2 bg-[#C7A56A] text-[#080808] font-bold">
              SAVE SERVICE
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-12 text-center font-mono text-xs text-[#8A8A8A]">LOADING SERVICES...</div>
      ) : (
        <div className="border border-[rgba(243,240,232,0.12)] bg-[#111111] overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[rgba(243,240,232,0.12)] text-[#8A8A8A] uppercase bg-[#080808]">
                <th className="p-4">SERVICE TITLE</th>
                <th className="p-4">DELIVERABLES</th>
                <th className="p-4">PRICE</th>
                <th className="p-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(243,240,232,0.08)]">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-[#161616]">
                  <td className="p-4 font-bold text-[#F3F0E8]">{s.title}</td>
                  <td className="p-4 text-[#8A8A8A]">{s.deliverables || "N/A"}</td>
                  <td className="p-4 text-[#C7A56A] font-bold">{s.priceFrom}</td>
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
