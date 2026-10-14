"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Skip layout on login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.push("/admin/login");
  };

  const navLinks = [
    { href: "/admin/dashboard", label: "DASHBOARD", icon: "📊" },
    { href: "/admin/portfolio", label: "PORTFOLIO PROJECTS", icon: "🎞️" },
    { href: "/admin/carousel", label: "SHOWREEL CAROUSEL", icon: "🎬" },
    { href: "/admin/media", label: "MEDIA LIBRARY", icon: "📁" },
    { href: "/admin/categories", label: "CATEGORIES", icon: "🏷️" },
    { href: "/admin/services", label: "SERVICES", icon: "🛠️" },
    { href: "/admin/skills", label: "SKILLS", icon: "⚡" },
    { href: "/admin/tools", label: "TOOLS & SOFTWARE", icon: "🖥️" },
    { href: "/admin/experience", label: "EXPERIENCE", icon: "💼" },
    { href: "/admin/content", label: "HOMEPAGE STUDIO", icon: "✍️" },
    { href: "/admin/themes", label: "THEME STUDIO (5 THEMES)", icon: "🎨" },
    { href: "/admin/layout", label: "LAYOUT ORDER", icon: "🔀" },
    { href: "/admin/enquiries", label: "ENQUIRIES INBOX", icon: "📥" },
    { href: "/admin/chat", label: "LIVE CHAT INBOX", icon: "💬" },
    { href: "/admin/settings", label: "SETTINGS & USERS", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F0E8] flex font-sans">
      {/* Mobile Top Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#111111] border-b border-[rgba(243,240,232,0.15)] px-4 py-3 flex items-center justify-between">
        <span className="font-display font-extrabold text-sm uppercase tracking-widest text-[#C7A56A]">
          MOHIT CMS
        </span>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-xs font-mono border border-[rgba(243,240,232,0.2)] px-3 py-1"
        >
          {sidebarOpen ? "CLOSE" : "MENU"}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0B0B0B] border-r border-[rgba(243,240,232,0.12)] flex flex-col justify-between transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } lg:static`}
      >
        <div className="p-6 space-y-8 overflow-y-auto">
          {/* Logo / Header */}
          <div className="border-b border-[rgba(243,240,232,0.12)] pb-6">
            <Link
              href="/admin/dashboard"
              className="font-display font-black text-xl tracking-wider uppercase text-[#F3F0E8]"
            >
              MOHIT BABARIYA
            </Link>
            <div className="font-mono text-[10px] text-[#C7A56A] tracking-widest uppercase mt-1">
              CREATIVE PORTFOLIO CMS
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 font-mono text-xs tracking-wider uppercase">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded transition-all ${
                    active
                      ? "bg-[#C7A56A] text-[#080808] font-bold"
                      : "text-[#8A8A8A] hover:bg-[#161616] hover:text-[#F3F0E8]"
                  }`}
                >
                  <span className="text-sm">{link.icon}</span>
                  <span className="truncate">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-[rgba(243,240,232,0.12)] space-y-3 font-mono text-xs">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="block text-center py-2 border border-[rgba(243,240,232,0.2)] text-[#F3F0E8] hover:border-[#C7A56A] transition-colors"
          >
            VIEW LIVE WEBSITE ↗
          </a>
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-rose-950/40 text-rose-300 border border-rose-800/40 hover:bg-rose-900/60 transition-colors uppercase font-bold"
          >
            LOGOUT ↵
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 p-6 lg:p-10 pt-20 lg:pt-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
