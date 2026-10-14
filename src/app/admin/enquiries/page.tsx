"use client";

import { useEffect, useState, useCallback } from "react";

interface Enquiry {
  id: number;
  name: string;
  email: string;
  countryCode: string;
  phone: string;
  company: string;
  projectType: string;
  description: string;
  budget: string;
  deadline: string;
  status: string;
  createdAt: string;
}

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);

  const fetchEnquiries = useCallback(async () => {
    try {
      const url = `/api/enquiries?status=${statusFilter}&q=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.enquiries) setEnquiries(data.enquiries);
    } catch {} finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch("/api/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        await fetchEnquiries();
        if (selectedEnquiry && selectedEnquiry.id === id) {
          setSelectedEnquiry({ ...selectedEnquiry, status });
        }
      }
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete enquiry entry permanently?")) return;
    try {
      const res = await fetch(`/api/enquiries?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setEnquiries(enquiries.filter((e) => e.id !== id));
        if (selectedEnquiry?.id === id) setSelectedEnquiry(null);
      }
    } catch {}
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(243,240,232,0.12)] pb-6">
        <div>
          <div className="font-mono text-xs text-[#C7A56A] uppercase tracking-widest">
            CLIENT LEADS & INBOX
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl uppercase tracking-tight">
            ENQUIRIES INBOX ({enquiries.length})
          </h1>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <input
            type="text"
            placeholder="Search name, email, brief..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#111111] border border-[rgba(243,240,232,0.2)] px-3 py-2 text-xs text-[#F3F0E8] focus:border-[#C7A56A] focus:outline-none w-48 sm:w-64"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#111111] border border-[rgba(243,240,232,0.2)] px-3 py-2 text-xs text-[#F3F0E8] focus:border-[#C7A56A] focus:outline-none"
          >
            <option value="all">ALL ENQUIRIES</option>
            <option value="new">NEW (UNREAD)</option>
            <option value="read">READ</option>
            <option value="archived">ARCHIVED</option>
          </select>
        </div>
      </div>

      {/* Selected Detail Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[rgba(243,240,232,0.2)] p-8 w-full max-w-2xl space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[rgba(243,240,232,0.12)] pb-4">
              <div>
                <span className="text-[#C7A56A] font-bold uppercase">{selectedEnquiry.projectType || "PROJECT ENQUIRY"}</span>
                <h2 className="font-display font-bold text-2xl text-[#F3F0E8] uppercase mt-1">
                  {selectedEnquiry.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="text-[#8A8A8A] hover:text-[#F3F0E8]"
              >
                CLOSE [ESC]
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[#8A8A8A]">
              <div>
                <span className="text-[#F3F0E8] block">EMAIL:</span> {selectedEnquiry.email}
              </div>
              <div>
                <span className="text-[#F3F0E8] block">PHONE:</span> {selectedEnquiry.phone || "N/A"}
              </div>
              <div>
                <span className="text-[#F3F0E8] block">COMPANY:</span> {selectedEnquiry.company || "N/A"}
              </div>
              <div>
                <span className="text-[#F3F0E8] block">BUDGET / DEADLINE:</span> {selectedEnquiry.budget} ({selectedEnquiry.deadline})
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[#C7A56A] font-bold block uppercase">PROJECT BRIEF / MESSAGE:</span>
              <div className="p-4 bg-[#080808] border border-[rgba(243,240,232,0.12)] text-[#F3F0E8] text-sm leading-relaxed whitespace-pre-wrap">
                {selectedEnquiry.description}
              </div>
            </div>

            <div className="pt-4 border-t border-[rgba(243,240,232,0.12)] flex items-center justify-between">
              <div className="space-x-2">
                <button
                  onClick={() => handleUpdateStatus(selectedEnquiry.id, "read")}
                  className="px-3 py-1.5 bg-[#1A1A1A] text-[#F3F0E8] hover:text-[#C7A56A]"
                >
                  MARK READ
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedEnquiry.id, "archived")}
                  className="px-3 py-1.5 bg-[#1A1A1A] text-[#8A8A8A] hover:text-[#F3F0E8]"
                >
                  ARCHIVE
                </button>
              </div>

              <button
                onClick={() => handleDelete(selectedEnquiry.id)}
                className="px-3 py-1.5 bg-rose-950/60 text-rose-300 hover:bg-rose-900/80"
              >
                DELETE ENQUIRY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List Table */}
      {loading ? (
        <div className="py-12 text-center font-mono text-xs text-[#8A8A8A] border border-[rgba(243,240,232,0.12)]">
          LOADING ENQUIRIES...
        </div>
      ) : enquiries.length === 0 ? (
        <div className="py-12 text-center font-mono text-xs text-[#8A8A8A] border border-[rgba(243,240,232,0.12)]">
          NO ENQUIRIES FOUND IN DATABASE. SUBMISSIONS FROM PUBLIC WEBSITE WILL DISPLAY HERE.
        </div>
      ) : (
        <div className="border border-[rgba(243,240,232,0.12)] bg-[#111111] overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[rgba(243,240,232,0.12)] text-[#8A8A8A] uppercase bg-[#080808]">
                <th className="p-4">STATUS</th>
                <th className="p-4">NAME & EMAIL</th>
                <th className="p-4">PROJECT TYPE</th>
                <th className="p-4">BUDGET</th>
                <th className="p-4">DATE</th>
                <th className="p-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(243,240,232,0.08)]">
              {enquiries.map((e) => {
                const isNew = e.status === "new";
                return (
                  <tr key={e.id} className={`hover:bg-[#161616] ${isNew ? "bg-[rgba(199,165,106,0.05)]" : ""}`}>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          isNew
                            ? "bg-amber-950 text-amber-400"
                            : e.status === "archived"
                            ? "bg-[#1A1A1A] text-[#8A8A8A]"
                            : "bg-emerald-950 text-emerald-400"
                        }`}
                      >
                        {e.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-display font-bold text-sm uppercase text-[#F3F0E8]">{e.name}</div>
                      <div className="text-[10px] text-[#8A8A8A]">{e.email}</div>
                    </td>
                    <td className="p-4 text-[#C7A56A]">{e.projectType || "General"}</td>
                    <td className="p-4 text-[#8A8A8A]">{e.budget || "N/A"}</td>
                    <td className="p-4 text-[#8A8A8A]">
                      {new Date(e.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedEnquiry(e);
                          if (e.status === "new") handleUpdateStatus(e.id, "read");
                        }}
                        className="px-2.5 py-1 bg-[#1A1A1A] text-[#F3F0E8] hover:text-[#C7A56A]"
                      >
                        VIEW BRIEF ↗
                      </button>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="px-2.5 py-1 bg-rose-950/60 text-rose-300"
                      >
                        DELETE
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
