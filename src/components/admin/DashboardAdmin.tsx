"use client";

import { useEffect, useState } from "react";
import { Button, Card, Notice, SectionTitle, api } from "./ui";

export type Stats = {
  projects: { total: number; published: number; drafts: number; featured: number; demo: number };
  mediaFiles: number;
  enquiries: { total: number; unread: number };
  chat: { total: number; unread: number };
  categories: number;
  skills: number;
  services: number;
};

const EMPTY: Stats = {
  projects: { total: 0, published: 0, drafts: 0, featured: 0, demo: 0 },
  mediaFiles: 0,
  enquiries: { total: 0, unread: 0 },
  chat: { total: 0, unread: 0 },
  categories: 0,
  skills: 0,
  services: 0,
};

const ACTIONS: { label: string; target: string; variant: "dark" | "ghost" | "accent" }[] = [
  { label: "Add project", target: "portfolio", variant: "dark" },
  { label: "Upload video", target: "media", variant: "ghost" },
  { label: "Add category", target: "categories", variant: "ghost" },
  { label: "Add service", target: "services", variant: "ghost" },
  { label: "Add software", target: "software", variant: "ghost" },
  { label: "Add skill", target: "skills", variant: "ghost" },
];

export default function DashboardAdmin({
  stats,
  loading,
  error,
  onNavigate,
  onRefresh,
}: {
  stats: Stats;
  loading: boolean;
  error: string;
  onNavigate: (section: string) => void;
  onRefresh: () => void;
}) {
  const [ping, setPing] = useState<"idle" | "ok" | "fail">("idle");

  useEffect(() => {
    let cancelled = false;
    api<{ ok: boolean }>("/api/health")
      .then(() => {
        if (!cancelled) setPing("ok");
      })
      .catch(() => {
        if (!cancelled) setPing("fail");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const tiles = [
    { label: "Total projects", value: loading ? "—" : stats.projects.total, target: "portfolio" },
    { label: "Published", value: loading ? "—" : stats.projects.published, target: "portfolio" },
    { label: "Drafts", value: loading ? "—" : stats.projects.drafts, target: "portfolio" },
    { label: "Featured", value: loading ? "—" : stats.projects.featured, target: "portfolio" },
    { label: "Demo projects", value: loading ? "—" : stats.projects.demo, target: "portfolio" },
    { label: "Media files", value: loading ? "—" : stats.mediaFiles, target: "media" },
    { label: "Enquiries", value: loading ? "—" : stats.enquiries.total, target: "enquiries" },
    { label: "Unread enquiries", value: loading ? "—" : stats.enquiries.unread, target: "enquiries" },
    { label: "Chat conversations", value: loading ? "—" : stats.chat.total, target: "chat" },
    { label: "Unread messages", value: loading ? "—" : stats.chat.unread, target: "chat" },
    { label: "Categories", value: loading ? "—" : stats.categories, target: "categories" },
    { label: "Skills / Services", value: loading ? "—" : `${stats.skills} / ${stats.services}`, target: "skills" },
  ];

  return (
    <div>
      <SectionTitle
        title="Dashboard"
        subtitle="Every number below is read live from the database and updates after each change."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="light" onClick={onRefresh}>
              Refresh
            </Button>
            <Button variant="ghost" onClick={() => window.open("/", "_blank")}>
              View website
            </Button>
          </div>
        }
      />

      {error && <Notice tone="error">{error}</Notice>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <button
            key={tile.label}
            type="button"
            onClick={() => onNavigate(tile.target)}
            className="glass rounded-3xl p-5 text-left transition-transform duration-300 hover:-translate-y-1"
          >
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-ink/40">
              {tile.label}
            </p>
            <p className="mono mt-3 text-3xl text-ink">
              {tile.value}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <p className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-ink/40">
            System status
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                ping === "ok"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : ping === "fail"
                    ? "bg-rose-500/10 text-rose-600"
                    : "bg-ink/5 text-ink/60"
              }`}
            >
              {ping === "ok"
                ? "Live & connected"
                : ping === "fail"
                  ? "Health check degraded"
                  : "Checking…"}
            </span>
            <p className="text-xs text-ink/60">
              {ping === "ok"
                ? "Database, API routes and serverless handlers operating normally."
                : ping === "fail"
                  ? "Database check returned a degraded status. Data may use fallback stores."
                  : "Checking database…"}
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-ink/40">
            Workflow
          </p>
          <ol className="mt-4 space-y-3 text-sm text-ink/70">
            {[
              "Add or upload a project in Portfolio.",
              "Attach a video (upload or URL) and a thumbnail.",
              "Publish it — the website updates immediately.",
              "Manage services, skills & tools in CMS studio.",
            ].map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="mono text-[0.65rem] text-[var(--accent)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
