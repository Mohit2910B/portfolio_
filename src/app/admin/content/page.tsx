"use client";

import { useEffect, useState, useRef } from "react";

export default function AdminContentStudioPage() {
  const [content, setContent] = useState({
    heroEyebrow: "VIDEO EDITOR / MOTION DESIGNER",
    heroHeading: "MOHIT BABARIYA",
    heroSubtitle: "Professional Video Editor & Motion Designer",
    heroDescription: "Crafting high-converting short-form reels, cinematic real estate films, YouTube edits, and commercial motion graphics worldwide.",
    heroCtaPrimary: "VIEW MY WORK",
    heroCtaSecondary: "LET'S WORK TOGETHER",
    heroMediaUrl: "",
    heroImageUrl: "/images/mohit-vertical.png?v=7",
    heroImageAspect: "9:16",
    heroImageFit: "cover-top",
    heroImageWidth: "360px",
    heroImageFrame: "phone",
    heroBadgeTitle: "THE ART OF EDITING",
    heroBadgeSubtitle: "VIDEO EDITOR",
    heroBadgeVisible: true,
    aboutHeading: "THE PERSON BEHIND THE WORK",
    aboutSubheading: "Passionate Storyteller & Visual Craftsman",
    aboutDescription: "I specialize in transforming raw footage into compelling visual narratives.",
    aboutExperienceYears: "2+",
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadMsg, setImageUploadMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/content")
      .then((res) => res.json())
      .then((data) => {
        if (data.content) setContent((prev) => ({ ...prev, ...data.content }));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (.jpg, .png, .webp, .avif)");
      return;
    }

    setUploadingImage(true);
    setImageUploadMsg("Uploading new hero image...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      if (data.file?.url) {
        setContent((prev) => ({ ...prev, heroImageUrl: data.file.url }));
        setImageUploadMsg("✓ New Hero image uploaded successfully!");
      }
    } catch (err: unknown) {
      setImageUploadMsg(`⚠ Upload failed: ${err instanceof Error ? err.message : "Error"}`);
    } finally {
      setUploadingImage(false);
      setTimeout(() => setImageUploadMsg(""), 4000);
    }
  };

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

  const aspectRatios = [
    { id: "9:16", label: "📱 9:16 Phone Reel", sub: "1080x1920 (Recommended)" },
    { id: "3:4", label: "🖼 3:4 Editorial", sub: "Classic Portrait" },
    { id: "4:5", label: "📸 4:5 Instagram", sub: "Social Frame" },
    { id: "1:1", label: "⏹ 1:1 Square", sub: "Balanced Box" },
    { id: "16:9", label: "🖥 16:9 Cinema", sub: "Wide Banner" },
  ];

  const widthOptions = [
    { id: "300px", label: "Compact (300px)" },
    { id: "340px", label: "Small (340px)" },
    { id: "360px", label: "Standard (360px) ★" },
    { id: "400px", label: "Medium (400px)" },
    { id: "440px", label: "Prominent (440px)" },
    { id: "480px", label: "Expanded (480px)" },
  ];

  const fitOptions = [
    { id: "cover-top", label: "👤 Face / Top Focus", sub: "Best for portraits" },
    { id: "cover-center", label: "🎯 Center Focus", sub: "Equally balanced" },
    { id: "cover-bottom", label: "🧍 Bottom Focus", sub: "Torso focus" },
    { id: "contain", label: "🔍 Contain Entire Image", sub: "No cropping" },
  ];

  const frameOptions = [
    { id: "phone", label: "📱 Phone Device Frame", sub: "Rounded Bezel + Glass Glow" },
    { id: "glass", label: "✨ Luxury Glass Frame", sub: "Gold Accent Glow" },
    { id: "minimal", label: "⬛ Minimal Studio Frame", sub: "Clean Border" },
    { id: "borderless", label: "🖼 Borderless Cut", sub: "Direct Image Display" },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="border-b border-[rgba(243,240,232,0.12)] pb-6">
        <div className="font-mono text-xs text-[#C7A56A] uppercase tracking-widest font-bold">
          CMS STUDIO // HOMEPAGE & HERO MANAGER
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl uppercase tracking-tight text-[#F3F0E8]">
          HOMEPAGE CONTENT STUDIO
        </h1>
      </div>

      {message && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono text-xs uppercase tracking-widest flex items-center justify-between rounded-lg">
          <span>✓ {message}</span>
          <button onClick={() => setMessage("")} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center font-mono text-xs text-[#8A8A8A]">
          LOADING CONTENT STUDIO...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8 font-mono text-xs">
          {/* 1. HERO IMAGE & SIZING STUDIO */}
          <div className="border border-[rgba(243,240,232,0.15)] bg-[#111111] p-6 space-y-6 rounded-xl shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(243,240,232,0.1)] pb-4">
              <div>
                <div className="font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>HERO DISPLAY SETTINGS</span>
                </div>
                <h2 className="font-display font-bold text-lg text-[#C7A56A] uppercase tracking-wide">
                  HERO AVATAR IMAGE & MULTIPLE SIZING OPTIONS
                </h2>
              </div>
              <span className="text-[10px] text-[#8A8A8A] uppercase font-mono">
                Changes persist on Live Website
              </span>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
            />

            {/* Image Source & Upload Controls */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-8 space-y-4">
                <div className="space-y-1">
                  <label className="text-[#8A8A8A] uppercase font-bold flex items-center justify-between">
                    <span>HERO IMAGE URL</span>
                    <span className="text-[10px] text-[#C7A56A]">Direct link or Upload file</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={content.heroImageUrl}
                      onChange={(e) => setContent({ ...content, heroImageUrl: e.target.value })}
                      placeholder="/images/mohit-vertical.png or https://..."
                      className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8] rounded focus:border-[#C7A56A] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="px-4 py-2.5 bg-gradient-to-r from-[#C7A56A] to-[#E3C388] text-black font-bold uppercase text-[11px] tracking-wider shrink-0 rounded hover:brightness-110 active:scale-95 transition-all flex items-center space-x-1 shadow"
                    >
                      <span>📁</span>
                      <span>{uploadingImage ? "UPLOADING..." : "UPLOAD NEW"}</span>
                    </button>
                  </div>
                  {imageUploadMsg && (
                    <div className="text-[11px] font-bold text-emerald-400 animate-pulse pt-1">
                      {imageUploadMsg}
                    </div>
                  )}
                </div>

                {/* Aspect Ratio Options */}
                <div className="space-y-2">
                  <label className="text-[#8A8A8A] uppercase font-bold flex items-center space-x-1.5">
                    <span>FRAME ASPECT RATIO (MULTIPLE OPTIONS)</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {aspectRatios.map((ar) => {
                      const isSel = content.heroImageAspect === ar.id;
                      return (
                        <button
                          key={ar.id}
                          type="button"
                          onClick={() => setContent({ ...content, heroImageAspect: ar.id })}
                          className={`p-2.5 text-left rounded border transition-all ${
                            isSel
                              ? "bg-[#C7A56A]/20 border-[#C7A56A] text-white shadow-lg ring-1 ring-[#C7A56A]"
                              : "bg-[#080808] border-[rgba(243,240,232,0.15)] text-[#8A8A8A] hover:border-white/40 hover:text-white"
                          }`}
                        >
                          <div className={`font-bold text-xs ${isSel ? "text-[#C7A56A]" : ""}`}>
                            {ar.label}
                          </div>
                          <div className="text-[9px] text-[#777] mt-0.5">{ar.sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Width / Size Scale Options */}
                <div className="space-y-2">
                  <label className="text-[#8A8A8A] uppercase font-bold flex items-center justify-between">
                    <span>FRAME WIDTH & SCALE ON DESKTOP</span>
                    <span className="text-[#C7A56A] font-bold">{content.heroImageWidth}</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {widthOptions.map((w) => {
                      const isSel = content.heroImageWidth === w.id;
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => setContent({ ...content, heroImageWidth: w.id })}
                          className={`p-2 text-center rounded border transition-all text-[10px] font-bold ${
                            isSel
                              ? "bg-[#C7A56A] text-black border-[#C7A56A] shadow"
                              : "bg-[#080808] border-[rgba(243,240,232,0.15)] text-[#8A8A8A] hover:text-white"
                          }`}
                        >
                          {w.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Image Fit & Focus Options */}
                <div className="space-y-2">
                  <label className="text-[#8A8A8A] uppercase font-bold">
                    IMAGE FIT & CROPPING FOCUS
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {fitOptions.map((fit) => {
                      const isSel = content.heroImageFit === fit.id;
                      return (
                        <button
                          key={fit.id}
                          type="button"
                          onClick={() => setContent({ ...content, heroImageFit: fit.id })}
                          className={`p-2.5 text-left rounded border transition-all ${
                            isSel
                              ? "bg-[#C7A56A]/20 border-[#C7A56A] text-white ring-1 ring-[#C7A56A]"
                              : "bg-[#080808] border-[rgba(243,240,232,0.15)] text-[#8A8A8A] hover:border-white/30"
                          }`}
                        >
                          <div className={`font-bold text-xs ${isSel ? "text-[#C7A56A]" : ""}`}>
                            {fit.label}
                          </div>
                          <div className="text-[9px] text-[#777] mt-0.5">{fit.sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Frame Style Options */}
                <div className="space-y-2">
                  <label className="text-[#8A8A8A] uppercase font-bold">
                    FRAME DESIGN & STYLING
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {frameOptions.map((frm) => {
                      const isSel = content.heroImageFrame === frm.id;
                      return (
                        <button
                          key={frm.id}
                          type="button"
                          onClick={() => setContent({ ...content, heroImageFrame: frm.id })}
                          className={`p-2.5 text-left rounded border transition-all ${
                            isSel
                              ? "bg-[#C7A56A]/20 border-[#C7A56A] text-white ring-1 ring-[#C7A56A]"
                              : "bg-[#080808] border-[rgba(243,240,232,0.15)] text-[#8A8A8A] hover:border-white/30"
                          }`}
                        >
                          <div className={`font-bold text-xs ${isSel ? "text-[#C7A56A]" : ""}`}>
                            {frm.label}
                          </div>
                          <div className="text-[9px] text-[#777] mt-0.5">{frm.sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Floating Badge Customization */}
                <div className="p-4 bg-[#080808] border border-[rgba(243,240,232,0.1)] rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[#C7A56A] font-bold text-xs uppercase">
                      FLOATING BADGE ("THE ART OF EDITING")
                    </span>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={content.heroBadgeVisible}
                        onChange={(e) => setContent({ ...content, heroBadgeVisible: e.target.checked })}
                        className="rounded accent-[#C7A56A] w-4 h-4 cursor-pointer"
                      />
                      <span className="text-[10px] text-[#8A8A8A]">SHOW BADGE</span>
                    </label>
                  </div>
                  {content.heroBadgeVisible && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-[#8A8A8A] text-[10px]">BADGE TITLE</label>
                        <input
                          type="text"
                          value={content.heroBadgeTitle}
                          onChange={(e) => setContent({ ...content, heroBadgeTitle: e.target.value })}
                          className="w-full bg-[#111] border border-[rgba(243,240,232,0.2)] p-2 text-xs text-[#F3F0E8] rounded"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[#8A8A8A] text-[10px]">BADGE SUBTITLE</label>
                        <input
                          type="text"
                          value={content.heroBadgeSubtitle}
                          onChange={(e) => setContent({ ...content, heroBadgeSubtitle: e.target.value })}
                          className="w-full bg-[#111] border border-[rgba(243,240,232,0.2)] p-2 text-xs text-[#F3F0E8] rounded"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* LIVE INTERACTIVE VISUAL PREVIEW */}
              <div className="md:col-span-4 bg-[#080808] border border-[rgba(243,240,232,0.15)] p-4 rounded-xl flex flex-col items-center justify-center space-y-3">
                <div className="text-[10px] text-[#C7A56A] font-bold tracking-widest uppercase flex items-center space-x-1.5 self-start">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>LIVE FRAME PREVIEW</span>
                </div>

                <div
                  className={`relative overflow-hidden transition-all duration-300 w-full max-w-[240px] ${
                    content.heroImageFrame === "glass"
                      ? "p-2 rounded-[20px] border border-[#C7A56A]/50 bg-white/5 shadow-2xl"
                      : content.heroImageFrame === "minimal"
                      ? "p-1 rounded-[16px] border border-white/20 bg-black"
                      : content.heroImageFrame === "borderless"
                      ? "p-0 rounded-[14px]"
                      : "p-2 rounded-[22px] border-2 border-white/20 bg-[#0c0c0c] shadow-2xl"
                  }`}
                >
                  <div
                    className="relative w-full rounded-[16px] overflow-hidden bg-black border border-white/10"
                    style={{
                      aspectRatio:
                        content.heroImageAspect === "3:4"
                          ? "3 / 4"
                          : content.heroImageAspect === "4:5"
                          ? "4 / 5"
                          : content.heroImageAspect === "1:1"
                          ? "1 / 1"
                          : content.heroImageAspect === "16:9"
                          ? "16 / 9"
                          : "9 / 16",
                      minHeight: content.heroImageAspect === "16:9" ? "130px" : "280px",
                    }}
                  >
                    <img
                      src={content.heroImageUrl}
                      alt="Preview"
                      className={`w-full h-full ${
                        content.heroImageFit === "cover-center"
                          ? "object-cover object-center"
                          : content.heroImageFit === "cover-bottom"
                          ? "object-cover object-bottom"
                          : content.heroImageFit === "contain"
                          ? "object-contain object-center bg-black"
                          : "object-cover object-top"
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {content.heroBadgeVisible && (
                    <div className="mt-2 p-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-left shadow">
                      <div className="text-[8px] text-[#C7A56A] font-bold uppercase tracking-wider">
                        {content.heroBadgeSubtitle || "VIDEO EDITOR"}
                      </div>
                      <div className="text-[10px] text-white font-bold uppercase truncate">
                        {content.heroBadgeTitle || "THE ART OF EDITING"}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-[#777] text-center font-mono">
                  Width: <strong className="text-[#C7A56A]">{content.heroImageWidth}</strong> • Aspect: <strong className="text-[#C7A56A]">{content.heroImageAspect}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* 2. HERO SECTION TEXT & HEADLINES */}
          <div className="border border-[rgba(243,240,232,0.12)] bg-[#111111] p-6 space-y-4 rounded-xl">
            <h2 className="font-display font-bold text-lg text-[#C7A56A] uppercase">
              2. HERO SECTION HEADLINE & TEXT
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[#8A8A8A]">EYEBROW BADGE</label>
                <input
                  type="text"
                  value={content.heroEyebrow}
                  onChange={(e) => setContent({ ...content, heroEyebrow: e.target.value })}
                  className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8] rounded"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#8A8A8A]">MAIN HEADLINE</label>
                <input
                  type="text"
                  value={content.heroHeading}
                  onChange={(e) => setContent({ ...content, heroHeading: e.target.value })}
                  className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8] rounded"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[#8A8A8A]">SUBTITLE LINE</label>
              <input
                type="text"
                value={content.heroSubtitle}
                onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8] rounded"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[#8A8A8A]">DESCRIPTION PARAGRAPH</label>
              <textarea
                rows={3}
                value={content.heroDescription}
                onChange={(e) => setContent({ ...content, heroDescription: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8] rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[#8A8A8A]">PRIMARY CTA LABEL</label>
                <input
                  type="text"
                  value={content.heroCtaPrimary}
                  onChange={(e) => setContent({ ...content, heroCtaPrimary: e.target.value })}
                  className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8] rounded"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#8A8A8A]">SECONDARY CTA LABEL</label>
                <input
                  type="text"
                  value={content.heroCtaSecondary}
                  onChange={(e) => setContent({ ...content, heroCtaSecondary: e.target.value })}
                  className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8] rounded"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[#8A8A8A]">HERO VIDEO / REEL PREVIEW URL (ON CLICK)</label>
              <input
                type="text"
                value={content.heroMediaUrl}
                onChange={(e) => setContent({ ...content, heroMediaUrl: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8] rounded"
                placeholder="Google Drive, YouTube, or direct MP4 URL to play when user clicks hero frame"
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
