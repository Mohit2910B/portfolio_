"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardAdmin, { type Stats } from "./DashboardAdmin";
import { MediaAdmin, PortfolioAdmin } from "./PortfolioAdmin";
import {
  CategoriesAdmin,
  ServicesAdmin,
  SkillsAdmin,
  SoftwareToolsAdmin,
  WorkOptionsAdmin,
} from "./CmsAdmin";
import {
  BackupAdmin,
  ContactSettingsAdmin,
  NotificationSettingsAdmin,
  HomepageAdmin,
  LayoutAdmin,
  RegisterAdmin,
  ThemeAdmin,
} from "./SettingsAdmin";
import { ChatAdmin, EnquiriesAdmin } from "./InboxAdmin";
import { CarouselAdmin } from "./CarouselAdmin";
import { Button, api } from "./ui";

const EMPTY_STATS: Stats = {
  projects: { total: 0, published: 0, drafts: 0, featured: 0, demo: 0 },
  mediaFiles: 0,
  enquiries: { total: 0, unread: 0 },
  chat: { total: 0, unread: 0 },
  categories: 0,
  skills: 0,
  services: 0,
};

const NAV: { key: string; label: string; icon: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: "◧" },
  { key: "portfolio", label: "Portfolio", icon: "▶" },
  { key: "carousel", label: "Carousel Manager", icon: "▭" },
  { key: "media", label: "Media Library", icon: "▣" },
  { key: "enquiries", label: "Enquiries", icon: "✉" },
  { key: "categories", label: "Categories", icon: "⌗" },
  { key: "services", label: "Services", icon: "✦" },
  { key: "software", label: "Tools & Software", icon: "◌" },
  { key: "skills", label: "Skills", icon: "◈" },
  { key: "homepage", label: "Homepage", icon: "☰" },
  { key: "content", label: "Content Studio", icon: "✎" },
  { key: "chat", label: "Live Chat", icon: "◍" },
  { key: "layout", label: "Layout Order", icon: "≡" },
  { key: "theme", label: "Theme Studio", icon: "◐" },
  { key: "contact", label: "Contact Settings", icon: "☎" },
  { key: "notifications", label: "Email Notifications", icon: "✉" },
  { key: "backup", label: "Backup & Restore", icon: "⇩" },
];

export default function AdminShell({
  admin,
}: {
  admin: { id: number; name: string; email: string; role: string };
}) {
  const [section, setSection] = useState("dashboard");
  const [drawer, setDrawer] = useState(false);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const payload = await api<Stats>("/api/admin/stats");
      setStats({
        projects: payload.projects ?? EMPTY_STATS.projects,
        mediaFiles: payload.mediaFiles ?? 0,
        enquiries: payload.enquiries ?? EMPTY_STATS.enquiries,
        chat: payload.chat ?? EMPTY_STATS.chat,
        categories: payload.categories ?? 0,
        skills: payload.skills ?? 0,
        services: payload.services ?? 0,
      });
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load stats.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const url = new URL(window.location.href);
    const initial = url.searchParams.get("section");
    if (initial && NAV.some((item) => item.key === initial)) setSection(initial);
  }, [refresh]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("section", section);
    window.history.replaceState({}, "", url.toString());
  }, [section]);

  useEffect(() => {
    if (section !== "dashboard") {
      const timer = window.setInterval(refresh, 20000);
      return () => window.clearInterval(timer);
    }
  }, [section, refresh]);

  const navigate = (next: string) => {
    setSection(next);
    setDrawer(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const logout = async () => {
    await api("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    window.location.href = "/admin/login";
  };

  const badgeFor = (key: string) => {
    if (key === "enquiries" && stats.enquiries.unread > 0) return stats.enquiries.unread;
    if (key === "chat" && stats.chat.unread > 0) return stats.chat.unread;
    return null;
  };

  return (
    <div className="min-h-screen bg-paper">
      {/* top bar */}
      <div className="glass sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDrawer((v) => !v)}
            aria-label="Toggle admin menu"
            aria-expanded={drawer}
            className="grid h-9 w-9 place-items-center rounded-full border border-ink/15 lg:hidden"
          >
            <span className="space-y-1">
              <span className="block h-px w-4 bg-ink" />
              <span className="block h-px w-4 bg-ink" />
              <span className="block h-px w-4 bg-ink" />
            </span>
          </button>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-[0.7rem] font-bold text-white">
            MB
          </span>
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em]">Studio CMS</p>
            <p className="text-[0.6rem] text-ink/45">{admin.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => window.open("/", "_blank")}>
            View website
          </Button>
          <Button variant="dark" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-6 sm:px-6">
        {/* sidebar */}
        <aside
          className={`${
            drawer ? "fixed inset-y-0 left-0 z-50 w-[280px] overflow-y-auto p-4" : "hidden"
          } lg:sticky lg:top-24 lg:z-0 lg:block lg:h-[calc(100vh-8rem)] lg:w-[260px] lg:shrink-0 lg:p-0`}
        >
          <nav className="glass h-full rounded-3xl p-3" aria-label="Admin sections">
            {drawer && (
              <button
                type="button"
                onClick={() => setDrawer(false)}
                className="btn btn-xs mb-2 w-full lg:hidden"
              >
                Close menu
              </button>
            )}
            <ul className="space-y-1">
              {NAV.map((item) => {
                const active = section === item.key;
                const badge = badgeFor(item.key);
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => navigate(item.key)}
                      aria-current={active ? "page" : undefined}
                      className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-left text-[0.72rem] font-semibold uppercase tracking-[0.12em] transition-colors ${
                        active ? "bg-ink text-white" : "text-ink/55 hover:bg-ink/5 hover:text-ink"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={active ? "text-[var(--accent)]" : "text-ink/30"}>
                          {item.icon}
                        </span>
                        {item.label}
                      </span>
                      {badge ? (
                        <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[0.55rem] text-white">
                          {badge}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="hairline mt-4 space-y-1 pt-4">
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl px-4 py-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-ink/55 hover:bg-ink/5"
              >
                View website
              </a>
              <button
                type="button"
                onClick={() => navigate("register")}
                className="block w-full rounded-2xl px-4 py-2.5 text-left text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-ink/55 hover:bg-ink/5"
              >
                Register admin
              </button>
              <button
                type="button"
                onClick={logout}
                className="block w-full rounded-2xl px-4 py-2.5 text-left text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-ink/55 hover:bg-ink/5"
              >
                Logout
              </button>
            </div>
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          {section === "dashboard" && (
            <DashboardAdmin
              stats={stats}
              loading={loading}
              error={error}
              onNavigate={navigate}
              onRefresh={refresh}
            />
          )}
          {section === "portfolio" && <PortfolioAdmin onChanged={refresh} />}
          {section === "carousel" && <CarouselAdmin onChanged={refresh} />}
          {section === "media" && <MediaAdmin onChanged={refresh} />}
          {section === "enquiries" && <EnquiriesAdmin onChanged={refresh} />}
          {section === "categories" && <CategoriesAdmin onChanged={refresh} />}
          {section === "services" && <ServicesAdmin onChanged={refresh} />}
          {section === "software" && <SoftwareToolsAdmin onChanged={refresh} />}
          {section === "skills" && <SkillsAdmin onChanged={refresh} />}
          {section === "homepage" && <HomepageAdmin onChanged={refresh} />}
          {section === "content" && <WorkOptionsAdmin onChanged={refresh} />}
          {section === "chat" && <ChatAdmin onChanged={refresh} />}
          {section === "layout" && <LayoutAdmin onChanged={refresh} />}
          {section === "theme" && <ThemeAdmin onChanged={refresh} />}
          {section === "contact" && <ContactSettingsAdmin onChanged={refresh} />}
          {section === "notifications" && <NotificationSettingsAdmin onChanged={refresh} />}
          {section === "backup" && <BackupAdmin onChanged={refresh} />}
          {section === "register" && <RegisterAdmin onChanged={refresh} />}
        </main>
      </div>
    </div>
  );
}
