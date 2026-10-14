"use client";

import { useEffect, useState } from "react";

export default function AdminContentStudioPage() {
  const [content, setContent] = useState({
    heroEyebrow: "VIDEO EDITOR / MOTION DESIGNER",
    heroHeading: "MOHIT BABARIYA",
    heroSubtitle: "Professional Video Editor & Motion Designer",
    heroDescription: "Crafting high-converting short-form reels, cinematic real estate films, YouTube edits, and commercial motion graphics worldwide.",
    heroCtaPrimary: "VIEW MY WORK",
    heroCtaSecondary: "LET'S WORK TOGETHER",
    heroMediaUrl: "",
    aboutHeading: "THE PERSON BEHIND THE WORK",
    aboutSubheading: "Passionate Storyteller & Visual Craftsman",
    aboutDescription: "I specialize in transforming raw footage into compelling visual narratives.",
    aboutExperienceYears: "6+",
    aboutProjectsCompleted: "450+",
    aboutClientsCount: "120+",
    servicesIntro: "Tailored video editing, motion graphics, and post-production solutions.",
    portfolioIntro: "Selected commercial, narrative, and motion graphics projects.",
    processIntro: "A proven, collaborative workflow...",
    contactIntro: "Have an upcoming video project? Let's create something exceptional together.",
    footerTagline: "CRAFTING VISUAL EXCELLENCE WORLDWIDE",
    footerCopyright: "© 2026 MOHIT BABARIYA. ALL RIGHTS RESERVED.",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/content")
      .then((res) => res.json())
      .then((data) => {
        if (data.content) setContent((prev) => ({ ...prev, ...data.content }));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });

      if (res.ok) {
        setMessage("Homepage Studio content updated & persisted in database!");
      }
    } catch {} finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="border-b border-[rgba(243,240,232,0.12)] pb-6">
        <div className="font-mono text-xs text-[#C7A56A] uppercase tracking-widest">
          CMS STUDIO
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl uppercase tracking-tight">
          HOMEPAGE CONTENT STUDIO
        </h1>
      </div>

      {message && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono text-xs uppercase tracking-widest">
          ✓ {message}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center font-mono text-xs text-[#8A8A8A]">
          LOADING CONTENT STUDIO...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8 font-mono text-xs">
          {/* HERO SECTION STUDIO */}
          <div className="border border-[rgba(243,240,232,0.12)] bg-[#111111] p-6 space-y-4">
            <h2 className="font-display font-bold text-lg text-[#C7A56A] uppercase">
              1. HERO SECTION CONTENT
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[#8A8A8A]">EYEBROW BADGE</label>
                <input
                  type="text"
                  value={content.heroEyebrow}
                  onChange={(e) => setContent({ ...content, heroEyebrow: e.target.value })}
                  className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#8A8A8A]">MAIN HEADLINE</label>
                <input
                  type="text"
                  value={content.heroHeading}
                  onChange={(e) => setContent({ ...content, heroHeading: e.target.value })}
                  className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[#8A8A8A]">SUBTITLE LINE</label>
              <input
                type="text"
                value={content.heroSubtitle}
                onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[#8A8A8A]">DESCRIPTION PARAGRAPH</label>
              <textarea
                rows={3}
                value={content.heroDescription}
                onChange={(e) => setContent({ ...content, heroDescription: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[#8A8A8A]">PRIMARY CTA LABEL</label>
                <input
                  type="text"
                  value={content.heroCtaPrimary}
                  onChange={(e) => setContent({ ...content, heroCtaPrimary: e.target.value })}
                  className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#8A8A8A]">SECONDARY CTA LABEL</label>
                <input
                  type="text"
                  value={content.heroCtaSecondary}
                  onChange={(e) => setContent({ ...content, heroCtaSecondary: e.target.value })}
                  className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[#8A8A8A]">HERO VIDEO / REEL PREVIEW URL</label>
              <input
                type="text"
                value={content.heroMediaUrl}
                onChange={(e) => setContent({ ...content, heroMediaUrl: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
              />
            </div>
          </div>

          {/* ABOUT SECTION STUDIO */}
          <div className="border border-[rgba(243,240,232,0.12)] bg-[#111111] p-6 space-y-4">
            <h2 className="font-display font-bold text-lg text-[#C7A56A] uppercase">
              2. ABOUT SECTION CONTENT & STATS
            </h2>
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">ABOUT HEADING</label>
              <input
                type="text"
                value={content.aboutHeading}
                onChange={(e) => setContent({ ...content, aboutHeading: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">ABOUT DESCRIPTION</label>
              <textarea
                rows={4}
                value={content.aboutDescription}
                onChange={(e) => setContent({ ...content, aboutDescription: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[#8A8A8A]">YEARS STAT</label>
                <input
                  type="text"
                  value={content.aboutExperienceYears}
                  onChange={(e) => setContent({ ...content, aboutExperienceYears: e.target.value })}
                  className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#8A8A8A]">PROJECTS STAT</label>
                <input
                  type="text"
                  value={content.aboutProjectsCompleted}
                  onChange={(e) => setContent({ ...content, aboutProjectsCompleted: e.target.value })}
                  className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#8A8A8A]">CLIENTS STAT</label>
                <input
                  type="text"
                  value={content.aboutClientsCount}
                  onChange={(e) => setContent({ ...content, aboutClientsCount: e.target.value })}
                  className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
                />
              </div>
            </div>
          </div>

          {/* FOOTER & SOCIAL */}
          <div className="border border-[rgba(243,240,232,0.12)] bg-[#111111] p-6 space-y-4">
            <h2 className="font-display font-bold text-lg text-[#C7A56A] uppercase">
              3. FOOTER & COPYRIGHT
            </h2>
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">FOOTER TAGLINE</label>
              <input
                type="text"
                value={content.footerTagline}
                onChange={(e) => setContent({ ...content, footerTagline: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">COPYRIGHT NOTICE</label>
              <input
                type="text"
                value={content.footerCopyright}
                onChange={(e) => setContent({ ...content, footerCopyright: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-[#C7A56A] text-[#080808] font-mono text-xs font-bold tracking-widest uppercase hover:bg-[#D8B77C]"
          >
            {saving ? "PERSISTING CHANGES..." : "PERSIST HOMEPAGE CONTENT ↗"}
          </button>
        </form>
      )}
    </div>
  );
}
