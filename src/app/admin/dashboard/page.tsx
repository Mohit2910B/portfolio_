"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  totalProjects: number;
  totalVideos: number;
  totalCategories: number;
  publishedVideos: number;
  unpublishedDrafts: number;
  trashCategories: number;
  trashVideos: number;
  syncedDriveFiles: number;
  replacedHqVideos: number;
  featuredProjects: number;
  carouselItems: number;
  mediaFiles: number;
  servicesCount: number;
  unreadEnquiries: number;
  chatConversations: number;
  lastSyncTime: string | null;
  syncStatus: string;
  syncErrors: string | null;
  totalDriveFilesScanned: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string>("");

  const loadStats = () => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.stats) setStats(data.stats);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    setSyncFeedback("");
    try {
      const res = await fetch("/api/drive/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        setSyncFeedback(`✓ ${data.message || "Sync completed successfully!"}`);
        loadStats();
      } else {
        setSyncFeedback(`⚠ ${data.error || data.message || "Sync encountered an issue."}`);
      }
    } catch (err: unknown) {
      setSyncFeedback(`⚠ Sync error: ${err instanceof Error ? err.message : "Network error"}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-10 max-w-6xl pb-16">
      {/* Top Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(243,240,232,0.12)] pb-6">
        <div>
          <div className="font-mono text-xs text-[#C7A56A] uppercase tracking-widest font-bold">
            OVERVIEW & ANALYTICS // LIVE DATABASE
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl uppercase tracking-tight text-[#F3F0E8]">
            ADMIN DASHBOARD
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-mono text-xs font-bold tracking-widest uppercase hover:brightness-110 transition-all shadow-lg flex items-center space-x-2 disabled:opacity-50 rounded"
          >
            <span className={syncing ? "animate-spin" : ""}>🔄</span>
            <span>{syncing ? "SYNCING DRIVE..." : "SYNC NOW"}</span>
          </button>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 bg-[#C7A56A] text-[#080808] font-mono text-xs font-bold tracking-widest uppercase hover:bg-[#D8B77C] transition-all rounded"
          >
            PREVIEW WEBSITE ↗
          </a>
        </div>
      </div>

      {/* Sync Feedback Message */}
      {syncFeedback && (
        <div
          className={`p-4 border font-mono text-xs rounded-lg flex items-center justify-between ${
            syncFeedback.startsWith("✓")
              ? "bg-emerald-950/70 border-emerald-500/40 text-emerald-200"
              : "bg-amber-950/70 border-amber-500/40 text-amber-200"
          }`}
        >
          <span>{syncFeedback}</span>
          <button onClick={() => setSyncFeedback("")} className="ml-4 font-bold">✕</button>
        </div>
      )}

      {/* Quick Actions Bar */}
      <div className="space-y-3">
        <div className="font-mono text-xs text-[#8A8A8A] uppercase tracking-widest font-bold">
          QUICK ACTIONS
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 font-mono text-xs">
          <Link
            href="/admin/categories"
            className="p-4 bg-[#111111] border border-[rgba(243,240,232,0.12)] hover:border-[#C7A56A] text-center space-y-2 transition-all rounded-lg"
          >
            <div className="text-xl">📁</div>
            <div className="text-[#F3F0E8] font-bold">CATEGORIES</div>
          </Link>
          <Link
            href="/admin/portfolio"
            className="p-4 bg-[#111111] border border-[rgba(243,240,232,0.12)] hover:border-[#C7A56A] text-center space-y-2 transition-all rounded-lg"
          >
            <div className="text-xl">🎬</div>
            <div className="text-[#F3F0E8] font-bold">PROJECTS</div>
          </Link>
          <Link
            href="/admin/media"
            className="p-4 bg-[#111111] border border-[rgba(243,240,232,0.12)] hover:border-[#C7A56A] text-center space-y-2 transition-all rounded-lg"
          >
            <div className="text-xl">📤</div>
            <div className="text-[#F3F0E8] font-bold">UPLOAD MEDIA</div>
          </Link>
          <Link
            href="/admin/carousel"
            className="p-4 bg-[#111111] border border-[rgba(243,240,232,0.12)] hover:border-[#C7A56A] text-center space-y-2 transition-all rounded-lg"
          >
            <div className="text-xl">🎞️</div>
            <div className="text-[#F3F0E8] font-bold">SHOWREEL</div>
          </Link>
          <Link
            href="/admin/enquiries"
            className="p-4 bg-[#111111] border border-[rgba(243,240,232,0.12)] hover:border-[#C7A56A] text-center space-y-2 transition-all relative rounded-lg"
          >
            <div className="text-xl">📥</div>
            <div className="text-[#F3F0E8] font-bold">ENQUIRIES</div>
            {Boolean(stats?.unreadEnquiries) && (
              <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-amber-500 text-black font-bold text-[9px] rounded-full">
                {stats?.unreadEnquiries}
              </span>
            )}
          </Link>
          <Link
            href="/admin/chat"
            className="p-4 bg-[#111111] border border-[rgba(243,240,232,0.12)] hover:border-[#C7A56A] text-center space-y-2 transition-all rounded-lg"
          >
            <div className="text-xl">💬</div>
            <div className="text-[#F3F0E8] font-bold">LIVE CHAT</div>
          </Link>
        </div>
      </div>

      {/* CORE PORTFOLIO & VIDEO METRICS */}
      <div className="space-y-4">
        <div className="font-mono text-xs text-[#8A8A8A] uppercase tracking-widest font-bold">
          LIVE PORTFOLIO METRICS (DATABASE & GOOGLE DRIVE)
        </div>

        {loading ? (
          <div className="py-12 font-mono text-xs text-[#8A8A8A] text-center border border-[rgba(243,240,232,0.12)] rounded-xl">
            LOADING LIVE STATISTICS...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total Videos */}
              <div className="p-6 bg-[#111111] border border-[rgba(243,240,232,0.12)] space-y-2 rounded-xl">
                <div className="font-mono text-xs text-[#8A8A8A] uppercase">TOTAL VIDEOS</div>
                <div className="font-display font-black text-4xl text-[#C7A56A]">{stats?.totalVideos ?? 0}</div>
                <div className="font-mono text-[10px] text-[#8A8A8A]">
                  {stats?.syncedDriveFiles ?? 0} SYNCED DRIVE • {stats?.replacedHqVideos ?? 0} HQ REPLACEMENTS
                </div>
              </div>

              {/* Total Categories */}
              <div className="p-6 bg-[#111111] border border-[rgba(243,240,232,0.12)] space-y-2 rounded-xl">
                <div className="font-mono text-xs text-[#8A8A8A] uppercase">ACTIVE CATEGORIES</div>
                <div className="font-display font-black text-4xl text-[#F3F0E8]">{stats?.totalCategories ?? 0}</div>
                <div className="font-mono text-[10px] text-emerald-400">
                  ALL LIVE ON WEBSITE FILTERS
                </div>
              </div>

              {/* Published vs Draft Videos */}
              <div className="p-6 bg-[#111111] border border-[rgba(243,240,232,0.12)] space-y-2 rounded-xl">
                <div className="font-mono text-xs text-[#8A8A8A] uppercase">PUBLICATION STATUS</div>
                <div className="font-display font-black text-4xl text-emerald-400">{stats?.publishedVideos ?? 0}</div>
                <div className="font-mono text-[10px] text-[#8A8A8A]">
                  {stats?.publishedVideos ?? 0} PUBLISHED • {stats?.unpublishedDrafts ?? 0} DRAFTS
                </div>
              </div>

              {/* Trash & Deleted Items */}
              <div className="p-6 bg-[#111111] border border-[rgba(243,240,232,0.12)] space-y-2 rounded-xl">
                <div className="font-mono text-xs text-[#8A8A8A] uppercase flex items-center justify-between">
                  <span>TRASH / DELETED</span>
                  <Link href="/admin/categories" className="text-[#C7A56A] hover:underline text-[10px]">
                    VIEW TRASH →
                  </Link>
                </div>
                <div className="font-display font-black text-4xl text-rose-400">
                  {(stats?.trashCategories ?? 0) + (stats?.trashVideos ?? 0)}
                </div>
                <div className="font-mono text-[10px] text-[#8A8A8A]">
                  {stats?.trashCategories ?? 0} CATEGORIES • {stats?.trashVideos ?? 0} VIDEOS
                </div>
              </div>
            </div>

            {/* Google Drive Synchronization Health Panel */}
            <div className="p-6 bg-[#121212] border border-[rgba(243,240,232,0.15)] rounded-xl font-mono text-xs space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(243,240,232,0.08)] pb-3">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[#F3F0E8] font-bold uppercase tracking-wider">
                    GOOGLE DRIVE AUTOMATIC SYNCHRONIZATION
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[11px]">
                  <span className="text-[#8A8A8A]">STATUS:</span>
                  <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                    stats?.syncStatus === "syncing"
                      ? "bg-amber-950 text-amber-300 border border-amber-500/30"
                      : stats?.syncStatus === "error"
                      ? "bg-rose-950 text-rose-300 border border-rose-500/30"
                      : "bg-emerald-950 text-emerald-300 border border-emerald-500/30"
                  }`}>
                    {stats?.syncStatus || "IDLE"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-[#8A8A8A] text-[10px] uppercase">LAST SUCCESSFUL SYNC</div>
                  <div className="text-[#F3F0E8] font-bold text-sm mt-0.5">
                    {stats?.lastSyncTime
                      ? new Date(stats.lastSyncTime).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "Initialized / Ready to Sync"}
                  </div>
                </div>

                <div>
                  <div className="text-[#8A8A8A] text-[10px] uppercase">SYNCED DRIVE FILES</div>
                  <div className="text-emerald-400 font-bold text-sm mt-0.5">
                    {stats?.syncedDriveFiles ?? 0} Files Linked
                  </div>
                </div>

                <div>
                  <div className="text-[#8A8A8A] text-[10px] uppercase">SYNC HEALTH & ERRORS</div>
                  <div className="text-sm mt-0.5">
                    {stats?.syncErrors ? (
                      <span className="text-amber-400 font-bold truncate block" title={stats.syncErrors}>
                        ⚠ {stats.syncErrors}
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-bold">✓ All Synced Without Errors</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Secondary Content Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-4 bg-[#111111] border border-[rgba(243,240,232,0.08)] rounded-lg">
                <div className="text-[#8A8A8A] text-[10px] uppercase">SHOWREEL CAROUSEL</div>
                <div className="text-xl font-bold text-[#F3F0E8] mt-1">{stats?.carouselItems ?? 0}</div>
              </div>
              <div className="p-4 bg-[#111111] border border-[rgba(243,240,232,0.08)] rounded-lg">
                <div className="text-[#8A8A8A] text-[10px] uppercase">MEDIA UPLOADS</div>
                <div className="text-xl font-bold text-[#F3F0E8] mt-1">{stats?.mediaFiles ?? 0}</div>
              </div>
              <div className="p-4 bg-[#111111] border border-[rgba(243,240,232,0.08)] rounded-lg">
                <div className="text-[#8A8A8A] text-[10px] uppercase">CREATIVE SERVICES</div>
                <div className="text-xl font-bold text-[#F3F0E8] mt-1">{stats?.servicesCount ?? 0}</div>
              </div>
              <div className="p-4 bg-[#111111] border border-[rgba(243,240,232,0.08)] rounded-lg">
                <div className="text-[#8A8A8A] text-[10px] uppercase">CLIENT ENQUIRIES</div>
                <div className="text-xl font-bold text-amber-400 mt-1">{stats?.unreadEnquiries ?? 0} New</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
