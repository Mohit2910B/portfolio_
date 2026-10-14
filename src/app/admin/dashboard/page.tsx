"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  totalProjects: number;
  publishedProjects: number;
  featuredProjects: number;
  carouselItems: number;
  mediaFiles: number;
  servicesCount: number;
  skillsCount: number;
  toolsCount: number;
  unreadEnquiries: number;
  chatConversations: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.stats) setStats(data.stats);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-10 max-w-6xl">
      {/* Top Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(243,240,232,0.12)] pb-6">
        <div>
          <div className="font-mono text-xs text-[#C7A56A] uppercase tracking-widest">
            OVERVIEW & ANALYTICS
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl uppercase tracking-tight">
            ADMIN DASHBOARD
          </h1>
        </div>

        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="px-5 py-2.5 bg-[#C7A56A] text-[#080808] font-mono text-xs font-bold tracking-widest uppercase hover:bg-[#D8B77C] transition-all self-start"
        >
          PREVIEW WEBSITE ↗
        </a>
      </div>

      {/* Quick Actions Bar */}
      <div className="space-y-4">
        <div className="font-mono text-xs text-[#8A8A8A] uppercase tracking-widest">
          QUICK ACTIONS
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 font-mono text-xs">
          <Link
            href="/admin/portfolio"
            className="p-4 bg-[#111111] border border-[rgba(243,240,232,0.12)] hover:border-[#C7A56A] text-center space-y-2 transition-all"
          >
            <div className="text-xl">➕</div>
            <div className="text-[#F3F0E8] font-bold">ADD PROJECT</div>
          </Link>
          <Link
            href="/admin/media"
            className="p-4 bg-[#111111] border border-[rgba(243,240,232,0.12)] hover:border-[#C7A56A] text-center space-y-2 transition-all"
          >
            <div className="text-xl">📤</div>
            <div className="text-[#F3F0E8] font-bold">UPLOAD MEDIA</div>
          </Link>
          <Link
            href="/admin/carousel"
            className="p-4 bg-[#111111] border border-[rgba(243,240,232,0.12)] hover:border-[#C7A56A] text-center space-y-2 transition-all"
          >
            <div className="text-xl">🎬</div>
            <div className="text-[#F3F0E8] font-bold">ADD REEL</div>
          </Link>
          <Link
            href="/admin/services"
            className="p-4 bg-[#111111] border border-[rgba(243,240,232,0.12)] hover:border-[#C7A56A] text-center space-y-2 transition-all"
          >
            <div className="text-xl">🛠️</div>
            <div className="text-[#F3F0E8] font-bold">ADD SERVICE</div>
          </Link>
          <Link
            href="/admin/enquiries"
            className="p-4 bg-[#111111] border border-[rgba(243,240,232,0.12)] hover:border-[#C7A56A] text-center space-y-2 transition-all relative"
          >
            <div className="text-xl">📥</div>
            <div className="text-[#F3F0E8] font-bold">ENQUIRIES</div>
          </Link>
          <Link
            href="/admin/chat"
            className="p-4 bg-[#111111] border border-[rgba(243,240,232,0.12)] hover:border-[#C7A56A] text-center space-y-2 transition-all"
          >
            <div className="text-xl">💬</div>
            <div className="text-[#F3F0E8] font-bold">LIVE CHAT</div>
          </Link>
        </div>
      </div>

      {/* Database Real-Time Statistics Grid */}
      <div className="space-y-4">
        <div className="font-mono text-xs text-[#8A8A8A] uppercase tracking-widest">
          DATABASE STATISTICS (LIVE FROM POSTGRESQL)
        </div>

        {loading ? (
          <div className="py-12 font-mono text-xs text-[#8A8A8A] text-center border border-[rgba(243,240,232,0.12)]">
            LOADING LIVE STATISTICS...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-6 bg-[#111111] border border-[rgba(243,240,232,0.12)] space-y-2">
              <div className="font-mono text-xs text-[#8A8A8A] uppercase">TOTAL PORTFOLIO PROJECTS</div>
              <div className="font-display font-black text-4xl text-[#C7A56A]">{stats?.totalProjects ?? 0}</div>
              <div className="font-mono text-[10px] text-[#8A8A8A]">
                {stats?.publishedProjects ?? 0} PUBLISHED • {stats?.featuredProjects ?? 0} FEATURED
              </div>
            </div>

            <div className="p-6 bg-[#111111] border border-[rgba(243,240,232,0.12)] space-y-2">
              <div className="font-mono text-xs text-[#8A8A8A] uppercase">SHOWREEL CAROUSEL ITEMS</div>
              <div className="font-display font-black text-4xl text-[#F3F0E8]">{stats?.carouselItems ?? 0}</div>
              <div className="font-mono text-[10px] text-[#8A8A8A]">ORDER PERSISTED IN DB</div>
            </div>

            <div className="p-6 bg-[#111111] border border-[rgba(243,240,232,0.12)] space-y-2">
              <div className="font-mono text-xs text-[#8A8A8A] uppercase">UNREAD ENQUIRIES</div>
              <div className="font-display font-black text-4xl text-amber-400">{stats?.unreadEnquiries ?? 0}</div>
              <div className="font-mono text-[10px] text-[#8A8A8A]">CLIENT FORM SUBMISSIONS</div>
            </div>

            <div className="p-6 bg-[#111111] border border-[rgba(243,240,232,0.12)] space-y-2">
              <div className="font-mono text-xs text-[#8A8A8A] uppercase">CHAT CONVERSATIONS</div>
              <div className="font-display font-black text-4xl text-emerald-400">{stats?.chatConversations ?? 0}</div>
              <div className="font-mono text-[10px] text-[#8A8A8A]">LIVE SUPPORT THREADS</div>
            </div>

            <div className="p-6 bg-[#111111] border border-[rgba(243,240,232,0.12)] space-y-2">
              <div className="font-mono text-xs text-[#8A8A8A] uppercase">UPLOADED MEDIA FILES</div>
              <div className="font-display font-black text-4xl text-[#F3F0E8]">{stats?.mediaFiles ?? 0}</div>
              <div className="font-mono text-[10px] text-[#8A8A8A]">IMAGES & VIDEOS</div>
            </div>

            <div className="p-6 bg-[#111111] border border-[rgba(243,240,232,0.12)] space-y-2">
              <div className="font-mono text-xs text-[#8A8A8A] uppercase">ACTIVE SERVICES</div>
              <div className="font-display font-black text-4xl text-[#C7A56A]">{stats?.servicesCount ?? 0}</div>
              <div className="font-mono text-[10px] text-[#8A8A8A]">EDITING & MOTION OFFERINGS</div>
            </div>

            <div className="p-6 bg-[#111111] border border-[rgba(243,240,232,0.12)] space-y-2">
              <div className="font-mono text-xs text-[#8A8A8A] uppercase">SKILLS COUNT</div>
              <div className="font-display font-black text-4xl text-[#F3F0E8]">{stats?.skillsCount ?? 0}</div>
              <div className="font-mono text-[10px] text-[#8A8A8A]">TECHNICAL CAPABILITIES</div>
            </div>

            <div className="p-6 bg-[#111111] border border-[rgba(243,240,232,0.12)] space-y-2">
              <div className="font-mono text-xs text-[#8A8A8A] uppercase">TOOLS & SOFTWARE</div>
              <div className="font-display font-black text-4xl text-[#F3F0E8]">{stats?.toolsCount ?? 0}</div>
              <div className="font-mono text-[10px] text-[#8A8A8A]">EDITING TOOLSTACK</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
