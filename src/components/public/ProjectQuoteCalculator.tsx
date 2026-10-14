"use client";

import { useState } from "react";

interface ProjectQuoteCalculatorProps {
  onOpenEnquiry?: (prefillMessage: string) => void;
}

export default function ProjectQuoteCalculator({ onOpenEnquiry }: ProjectQuoteCalculatorProps) {
  const [projectType, setProjectType] = useState<"reel" | "youtube" | "realestate" | "commercial" | "motion">("reel");
  const [duration, setDuration] = useState<number>(30); // in seconds or minutes
  const [turnaround, setTurnaround] = useState<"express" | "standard" | "relaxed">("standard");
  const [additions, setAdditions] = useState<{
    colorGrading: boolean;
    soundDesign: boolean;
    subtitles: boolean;
    motionGraphics: boolean;
  }>({
    colorGrading: true,
    soundDesign: true,
    subtitles: true,
    motionGraphics: false,
  });

  // Base pricing logic (in USD / INR equivalent display)
  const basePrices = {
    reel: 80,
    youtube: 150,
    realestate: 200,
    commercial: 350,
    motion: 250,
  };

  const projectNames = {
    reel: "Short-Form Reel / TikTok / Shorts",
    youtube: "Full YouTube Video Editing",
    realestate: "Cinematic Real Estate Showcase",
    commercial: "Brand Commercial & Ad Film",
    motion: "Custom Motion Graphics & 3D Intro",
  };

  let total = basePrices[projectType];

  // Addons
  if (additions.colorGrading) total += 30;
  if (additions.soundDesign) total += 25;
  if (additions.subtitles) total += 20;
  if (additions.motionGraphics) total += 60;

  // Turnaround multiplier
  if (turnaround === "express") total *= 1.35;
  if (turnaround === "relaxed") total *= 0.9;

  const finalEstimateUSD = Math.round(total);
  const finalEstimateINR = Math.round(total * 85); // approximate INR conversion

  const handleBookNow = () => {
    const summary = `Hi Mohit! I would like to get an estimate for:
• Project: ${projectNames[projectType]}
• Duration: ${duration} seconds
• Turnaround: ${turnaround.toUpperCase()}
• Addons: ${Object.entries(additions).filter(([, v]) => v).map(([k]) => k).join(", ")}
• Estimated Cost: $${finalEstimateUSD} (~₹${finalEstimateINR.toLocaleString()})`;

    if (onOpenEnquiry) {
      onOpenEnquiry(summary);
    } else {
      const target = document.getElementById("contact");
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <section id="quote-calculator" className="py-24 relative overflow-hidden border-b border-[var(--border-glass)]">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent)]/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 glass-panel text-[var(--accent)] font-mono text-[11px] tracking-[0.2em] uppercase font-bold">
            <span>⚡ Instant Cost Calculator</span>
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-[var(--text-primary)]">
            Estimate Your Project in Seconds
          </h2>
          <p className="text-[var(--text-secondary)] text-sm sm:text-base font-light">
            Select your requirements below to get a transparent estimate for your next editing project.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Options Panel */}
          <div className="lg:col-span-7 glass-panel p-6 sm:p-8 space-y-8">
            {/* 1. Project Type */}
            <div className="space-y-3">
              <label className="font-mono text-xs tracking-wider uppercase font-semibold text-[var(--text-secondary)]">
                1. Select Project Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(
                  [
                    { id: "reel", label: "Reel / Shorts", icon: "🎬" },
                    { id: "youtube", label: "YouTube Edit", icon: "📹" },
                    { id: "realestate", label: "Real Estate Film", icon: "🏠" },
                    { id: "commercial", label: "Commercial Ad", icon: "📺" },
                    { id: "motion", label: "Motion Graphics", icon: "✨" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setProjectType(item.id)}
                    className={`p-4 rounded-xl text-left border transition-all flex items-center space-x-3 ${
                      projectType === item.id
                        ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--text-primary)] shadow-lg"
                        : "glass-panel border-[var(--border-glass)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50"
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-sans font-medium text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Turnaround Speed */}
            <div className="space-y-3">
              <label className="font-mono text-xs tracking-wider uppercase font-semibold text-[var(--text-secondary)]">
                2. Delivery Timeline
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "express", label: "Express (24-48h)", badge: "+35%" },
                  { id: "standard", label: "Standard (3-5d)", badge: "Best Value" },
                  { id: "relaxed", label: "Flexible (7+d)", badge: "-10%" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTurnaround(item.id as any)}
                    className={`p-3 rounded-xl text-center border transition-all space-y-1 ${
                      turnaround === item.id
                        ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--text-primary)] font-semibold"
                        : "glass-panel border-[var(--border-glass)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50"
                    }`}
                  >
                    <div className="font-sans text-xs">{item.label}</div>
                    <div className="font-mono text-[10px] text-[var(--accent)]">{item.badge}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Included Features */}
            <div className="space-y-3">
              <label className="font-mono text-xs tracking-wider uppercase font-semibold text-[var(--text-secondary)]">
                3. Additional Enhancements
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "colorGrading", label: "Cinematic Color Grading", price: "+$30" },
                  { id: "soundDesign", label: "Pro Sound Design & SFX", price: "+$25" },
                  { id: "subtitles", label: "Animated Subtitles & Captions", price: "+$20" },
                  { id: "motionGraphics", label: "Complex 3D / VFX Motion", price: "+$60" },
                ].map((item) => {
                  const key = item.id as keyof typeof additions;
                  const isChecked = additions[key];
                  return (
                    <button
                      key={item.id}
                      onClick={() => setAdditions((prev) => ({ ...prev, [key]: !prev[key] }))}
                      className={`p-3.5 rounded-xl border text-left transition-all flex justify-between items-center ${
                        isChecked
                          ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--text-primary)]"
                          : "glass-panel border-[var(--border-glass)] text-[var(--text-secondary)]"
                      }`}
                    >
                      <span className="font-sans text-xs font-medium">{item.label}</span>
                      <span className="font-mono text-[11px] text-[var(--accent)] font-bold">{item.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Estimate Display Card */}
          <div className="lg:col-span-5 glass-panel-strong p-8 space-y-6 lg:sticky lg:top-28">
            <div className="border-b border-[var(--border-glass)] pb-6 space-y-2">
              <div className="font-mono text-xs text-[var(--accent)] uppercase tracking-widest font-semibold">
                ESTIMATED INVESTMENT
              </div>
              <div className="flex items-baseline space-x-3">
                <span className="font-serif text-5xl font-extrabold text-[var(--text-primary)]">
                  ${finalEstimateUSD}
                </span>
                <span className="font-mono text-sm text-[var(--text-secondary)]">
                  (~₹{finalEstimateINR.toLocaleString()})
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] pt-1">
                Includes unlimited revisions until complete satisfaction.
              </p>
            </div>

            {/* Selected Summary */}
            <div className="space-y-3 font-mono text-xs text-[var(--text-secondary)]">
              <div className="flex justify-between">
                <span>Selected Type:</span>
                <span className="text-[var(--text-primary)] font-sans font-medium">{projectNames[projectType]}</span>
              </div>
              <div className="flex justify-between">
                <span>Speed:</span>
                <span className="text-[var(--text-primary)] font-sans capitalize">{turnaround}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Addons:</span>
                <span className="text-[var(--accent)] font-sans">
                  {Object.values(additions).filter(Boolean).length} Selected
                </span>
              </div>
            </div>

            <button
              onClick={handleBookNow}
              className="w-full py-4 bg-[var(--accent)] text-[var(--bg-main)] font-mono text-xs font-bold tracking-[0.2em] uppercase rounded-full hover:bg-[var(--accent-hover)] transition-all shadow-xl transform hover:-translate-y-0.5"
            >
              BOOK THIS ESTIMATE 🚀
            </button>

            <p className="text-center font-mono text-[10px] text-[var(--text-secondary)]">
              🔒 No upfront payment required to discuss details.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
