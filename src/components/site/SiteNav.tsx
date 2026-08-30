"use client";

import { useEffect, useState } from "react";

const LINKS = [
  { id: "about", label: "About" },
  { id: "tools", label: "Tools" },
  { id: "services", label: "Services" },
  { id: "contact", label: "Contact" },
];

export default function SiteNav({ name, availability }: { name: string; availability: string }) {
  const [active, setActive] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = ["hero", ...LINKS.map((l) => l.id)];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const go = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <nav
        aria-label="Primary"
        className={`mx-auto flex max-w-[1400px] items-center justify-between gap-4 rounded-full px-4 py-3 transition-all duration-500 sm:px-6 ${
          scrolled ? "glass" : "border border-transparent"
        }`}
      >
        <button
          type="button"
          onClick={() => go("hero")}
          className="flex items-center gap-3 text-left"
          aria-label={`${name} — back to top`}
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-[0.7rem] font-bold tracking-tight text-white">
            MB
          </span>
          <span className="hidden text-[0.7rem] font-semibold uppercase tracking-[0.22em] sm:block">
            {name}
          </span>
        </button>

        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => {
            const isActive = active === link.id;
            return (
              <li key={link.id}>
                <button
                  type="button"
                  onClick={() => go(link.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={`relative rounded-full px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] transition-colors ${
                    isActive ? "text-[var(--accent)]" : "text-ink/60 hover:text-ink"
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute inset-x-4 -bottom-0.5 h-px bg-[var(--accent)] transition-transform duration-300 ${
                      isActive ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full border border-ink/10 px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-ink/70 md:flex">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            {availability}
          </span>
          <button
            type="button"
            onClick={() => go("contact")}
            className="btn btn-dark btn-xs hidden sm:inline-flex"
          >
            Start project
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle navigation menu"
            className="grid h-9 w-9 place-items-center rounded-full border border-ink/15 lg:hidden"
          >
            <span className="relative block h-2.5 w-4">
              <span
                className={`absolute left-0 h-px w-full bg-ink transition-transform duration-300 ${
                  open ? "top-1 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 h-px w-full bg-ink transition-transform duration-300 ${
                  open ? "top-1 -rotate-45" : "top-2"
                }`}
              />
            </span>
          </button>
        </div>
      </nav>

      {open && (
        <div className="glass fade-in mx-auto mt-2 max-w-[1400px] overflow-hidden rounded-3xl p-3 lg:hidden">
          <ul className="grid gap-1">
            {LINKS.map((link) => (
              <li key={link.id}>
                <button
                  type="button"
                  onClick={() => go(link.id)}
                  className={`w-full rounded-2xl px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.18em] ${
                    active === link.id ? "bg-ink text-white" : "text-ink/70"
                  }`}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
