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
    { label: "Total projects", value: stats.projects.total, target: "portfolio" },
    { label: "Published", value: stats.projects.published, target: "portfolio" },
    { label: "Drafts", value: stats.projects.drafts, target: "portfolio" },
    { label: "Featured", value: stats.projects.featured, target: "carousel" },
    { label: "Demo projects", value: stats.projects.demo, target: "portfolio" },
    { label: "Media files", value: stats.mediaFiles, target: "media" },
    { label: "Enquiries", value: stats.enquiries.total, target: "enquiries" },
    { label: "Unread enquiries", value: stats.enquiries.unread, target: "enquiries" },
    { label: "Chat conversations", value: stats.chat.total, target: "chat" },
    { label: "Unread messages", value: stats.chat.unread, target: "chat" },
    { label: "Categories", value: stats.categories, target: "categories" },
    { label: "Skills / Services", value: `${stats.skills} / ${stats.services}`, target: "skills" },
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              {loading ? "—" : tile.value}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <p className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-ink/40">
            Quick actions
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {ACTIONS.map((action) => (
              <Button key={action.label} variant={action.variant} onClick={() => onNavigate(action.target)}>
                {action.label}
              </Button>
            ))}
            <Button variant="ghost" onClick={() => window.open("/", "_blank")}>
              View website
            </Button>
          </div>
          <div className="hairline mt-6 pt-5">
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-ink/40">
              System
            </p>
            <p className="mt-3 flex items-center gap-2 text-sm text-ink/70">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  ping === "ok" ? "bg-emerald-500" : ping === "fail" ? "bg-[#d11a4a]" : "bg-ink/30"
                }`}
              />
              {ping === "ok"
                ? "Database connection healthy"
                : ping === "fail"
                  ? "Database unreachable — check DATABASE_URL"
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
              "Tune the carousel in Carousel Manager.",
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
