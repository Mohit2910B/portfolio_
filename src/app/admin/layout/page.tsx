"use client";

import { useEffect, useState } from "react";

interface SectionOrder {
  id?: number;
  sectionKey: string;
  label: string;
  sortOrder: number;
  isVisible: boolean;
}

export default function AdminLayoutOrderPage() {
  const [sections, setSections] = useState<SectionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchLayout = async () => {
    try {
      const res = await fetch("/api/layout-order");
      const data = await res.json();
      if (data.sections && data.sections.length > 0) {
        setSections(data.sections);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLayout();
  }, []);

  const moveSection = (index: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;

    const list = [...sections];
    const temp = list[index];
    list[index] = list[newIdx];
    list[newIdx] = temp;

    const updated = list.map((s, idx) => ({ ...s, sortOrder: idx + 1 }));
    setSections(updated);
  };

  const toggleVisibility = (index: number) => {
    const list = [...sections];
    list[index].isVisible = !list[index].isVisible;
    setSections(list);
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/layout-order", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      });

      if (res.ok) {
        setMessage("Homepage layout section order saved & persisted in PostgreSQL!");
      }
    } catch {} finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(243,240,232,0.12)] pb-6">
        <div>
          <div className="font-mono text-xs text-[#C7A56A] uppercase tracking-widest">
            CMS LAYOUT CONTROL
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl uppercase tracking-tight">
            HOMEPAGE SECTION ORDER STUDIO
          </h1>
          <p className="text-xs text-[#8A8A8A] font-mono mt-1">
            Reorder or toggle visibility of sections. Public homepage follows this saved PostgreSQL order.
          </p>
        </div>

        <button
          onClick={handleSaveOrder}
          disabled={saving}
          className="px-6 py-3 bg-[#C7A56A] text-[#080808] font-mono text-xs font-bold tracking-widest uppercase hover:bg-[#D8B77C] transition-all self-start"
        >
          {saving ? "PERSISTING ORDER..." : "SAVE SECTION ORDER ↗"}
        </button>
      </div>

      {message && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono text-xs uppercase tracking-widest">
          ✓ {message}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center font-mono text-xs text-[#8A8A8A]">
          LOADING LAYOUT CONFIGURATION...
        </div>
      ) : (
        <div className="border border-[rgba(243,240,232,0.12)] bg-[#111111] divide-y divide-[rgba(243,240,232,0.08)]">
          {sections.map((sec, idx) => (
            <div
              key={sec.sectionKey}
              className="p-5 flex items-center justify-between font-mono text-xs hover:bg-[#161616] transition-colors"
            >
              <div className="flex items-center space-x-4">
                <span className="font-bold text-[#C7A56A] w-6">{idx + 1}.</span>
                <div>
                  <div className="font-display font-bold text-sm uppercase text-[#F3F0E8]">
                    {sec.label || sec.sectionKey}
                  </div>
                  <div className="text-[10px] text-[#8A8A8A]">KEY: #{sec.sectionKey}</div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Visibility Toggle */}
                <button
                  onClick={() => toggleVisibility(idx)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase rounded ${
                    sec.isVisible ? "bg-emerald-950 text-emerald-400" : "bg-rose-950 text-rose-400"
                  }`}
                >
                  {sec.isVisible ? "VISIBLE" : "HIDDEN"}
                </button>

                {/* Move Up / Down */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => moveSection(idx, "up")}
                    disabled={idx === 0}
                    className="p-1.5 border border-[rgba(243,240,232,0.15)] hover:border-[#C7A56A] disabled:opacity-20"
                    title="Move Up"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveSection(idx, "down")}
                    disabled={idx === sections.length - 1}
                    className="p-1.5 border border-[rgba(243,240,232,0.15)] hover:border-[#C7A56A] disabled:opacity-20"
                    title="Move Down"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
