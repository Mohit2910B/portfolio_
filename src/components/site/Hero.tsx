"use client";

import { useState } from "react";
import EditorVisual from "./EditorVisual";
import VideoPlayer from "./VideoPlayer";
import Reveal from "./Reveal";
import type { SiteData } from "@/lib/data";

export default function Hero({ data }: { data: SiteData }) {
  const { homepage } = data;
  const [reelOpen, setReelOpen] = useState(false);
  const lines = (homepage?.heroTitle || "MAKE\nVISUALS\nMOVE.").split("\n").filter(Boolean);
  const roles = (homepage?.heroSubtitle || "VIDEO EDITOR · MOTION GRAPHICS · GRAPHIC DESIGN · AI VIDEO")
    .split("·")
    .map((r) => r.trim())
    .filter(Boolean);


  const scrollToContact = () =>
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section id="hero" className="relative overflow-hidden px-4 pb-16 pt-32 sm:px-6 sm:pt-40 lg:pb-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px]"
        style={{
          background:
            "radial-gradient(70% 50% at 12% 0%, rgba(255,255,255,0.95), transparent 60%), radial-gradient(45% 45% at 92% 12%, rgba(224,20,127,0.10), transparent 65%)",
        }}
      />

      <div className="mx-auto grid max-w-[1400px] items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div>
          <Reveal>
            <div className="flex flex-wrap items-center gap-3">
              <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em]">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                {homepage.availabilityLabel}
              </span>
              <span className="mono text-[0.6rem] tracking-[0.2em] text-ink/40">
                {homepage.ownerName}
              </span>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="display mt-7 text-[clamp(2.9rem,9vw,7rem)]">
              {lines.map((line, index) => (
                <span key={line} className="block overflow-hidden">
                  <span
                    className="block"
                    style={{
                      animation: `mb-fade-in 0.9s cubic-bezier(0.2,0.8,0.2,1) ${0.15 + index * 0.12}s both`,
                    }}
                  >
                    {line}
                  </span>
                </span>
              ))}
            </h1>
          </Reveal>

          <Reveal delay={140}>
            <p className="mono mt-6 text-[0.68rem] uppercase tracking-[0.24em] text-ink/55">
              {roles.map((role, index) => (
                <span key={role}>
                  {role}
                  {index < roles.length - 1 ? <span className="mx-2 text-[var(--accent)]">/</span> : null}
                </span>
              ))}
            </p>
          </Reveal>

          <Reveal delay={200}>
            <p className="editorial mt-6 max-w-xl text-lg leading-relaxed text-ink/70">
              {homepage.heroDescription}
            </p>
          </Reveal>

          <Reveal delay={260}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => (homepage.reelUrl ? setReelOpen(true) : scrollToContact())}
                className="btn btn-dark"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {homepage.ctaPrimaryLabel}
              </button>
              <button type="button" onClick={scrollToContact} className="btn btn-ghost">
                {homepage.ctaSecondaryLabel}
              </button>
            </div>
          </Reveal>

          <Reveal delay={320}>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4 hairline pt-6">
              <div>
                <dt className="text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-ink/40">
                  Capabilities
                </dt>
                <dd className="mono mt-2 text-sm text-ink/80">
                  {data.services.length > 0 ? `${data.services.length} services` : "6 services"}
                </dd>
              </div>
              <div>
                <dt className="text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-ink/40">
                  Software Stack
                </dt>
                <dd className="mono mt-2 text-sm text-ink/80">{data.softwareTools.length} tools</dd>
              </div>
              <div>
                <dt className="text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-ink/40">
                  Based in
                </dt>
                <dd className="mono mt-2 text-sm text-ink/80">{data.contact.location || "Remote"}</dd>
              </div>
            </dl>
          </Reveal>
        </div>

        <Reveal delay={120} className="lg:pl-6">
          <EditorVisual />
        </Reveal>
      </div>

      {reelOpen && homepage.reelUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Showreel"
          className="fixed inset-0 z-[80] grid place-items-center bg-black/75 p-4 backdrop-blur-md"
          onClick={() => setReelOpen(false)}
        >
          <div
            className="glass-dark fade-in w-full max-w-4xl rounded-[28px] p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.26em] text-white/70">
                Showreel — {homepage.ownerName}
              </p>
              <button
                type="button"
                onClick={() => setReelOpen(false)}
                aria-label="Close showreel"
                className="grid h-8 w-8 place-items-center rounded-full border border-white/20"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <VideoPlayer src={homepage.reelUrl} ratio="16:9" onClose={() => setReelOpen(false)} />
          </div>
        </div>
      )}
    </section>
  );
}
