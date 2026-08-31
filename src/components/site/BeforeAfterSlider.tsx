"use client";

import { useState, useRef, useCallback } from "react";
import Reveal from "@/components/site/Reveal";

type GradePreset = {
  id: string;
  name: string;
  badge: string;
  description: string;
  flatColor: string;
  gradedColor: string;
};

const PRESETS: GradePreset[] = [
  {
    id: "cinema-film",
    name: "Kodak 2383 35mm Film Print",
    badge: "CINEMATIC EMULSION",
    description: "Flat S-Log3 transformed into rich contrast, film halation, and golden skin tones.",
    flatColor: "linear-gradient(135deg, #4a4d52 0%, #6b7077 50%, #3e4146 100%)",
    gradedColor: "linear-gradient(135deg, #1e3c72 0%, #2a5298 35%, #f39c12 80%, #e0147f 100%)",
  },
  {
    id: "luxury-real-estate",
    name: "Architectural Interior & Sunset Grade",
    badge: "LUXURY PROPERTY",
    description: "Balancing exterior window highlights with warm, inviting interior ambience.",
    flatColor: "linear-gradient(135deg, #575a61 0%, #767b85 50%, #484b52 100%)",
    gradedColor: "linear-gradient(135deg, #0f2027 0%, #203a43 40%, #2c5364 70%, #ffb347 100%)",
  },
  {
    id: "commercial-vivid",
    name: "Commercial Brand & High-Contrast Commercial",
    badge: "COMMERCIAL AD",
    description: "Vibrant saturated punch engineered for maximum thumb-stopping retention on social feeds.",
    flatColor: "linear-gradient(135deg, #52555a 0%, #6c7179 50%, #43464a 100%)",
    gradedColor: "linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)",
  },
];

export default function BeforeAfterSlider() {
  const [activePreset, setActivePreset] = useState<GradePreset>(PRESETS[0]);
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging || e.buttons === 1) {
      handleMove(e.clientX);
    }
  };

  return (
    <section className="relative overflow-hidden py-24 sm:py-32 bg-neutral-950 text-white">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-[var(--accent,#e0147f)]/10 blur-[150px]" />

      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-12 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--accent,#e0147f)] animate-pulse" />
              <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-[var(--accent,#e0147f)]">
                Color Science &amp; Grading
              </p>
            </div>
            <h2 className="display mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              RAW LOG <span className="text-white/40">VS.</span> FINAL GRADE
            </h2>
            <p className="mt-3 max-w-xl text-sm sm:text-base leading-relaxed text-white/60">
              Drag the interactive slider to experience the transformation from flat camera sensor footage to color-accurate, cinema-grade masters.
            </p>
          </div>

          {/* Preset Switcher Pills */}
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setActivePreset(preset)}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition duration-300 ${
                  activePreset.id === preset.id
                    ? "bg-white text-neutral-950 shadow-lg scale-105"
                    : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                }`}
              >
                {preset.name.split(" ")[0]} {preset.name.split(" ")[1] || ""}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Split-Screen Comparison Viewport */}
        <Reveal>
          <div className="mt-10 rounded-[32px] border border-white/15 bg-neutral-900/80 p-3 sm:p-4 shadow-2xl backdrop-blur-xl">
            <div
              ref={containerRef}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
              className="relative aspect-video max-h-[500px] w-full cursor-ew-resize select-none overflow-hidden rounded-[24px] bg-black"
            >
              {/* After / Graded Layer */}
              <div
                className="absolute inset-0 flex items-center justify-center p-8 transition-all duration-500"
                style={{ background: activePreset.gradedColor }}
              >
                <div className="text-center">
                  <div className="inline-block rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold tracking-widest text-white backdrop-blur-md uppercase">
                    ★ {activePreset.name}
                  </div>
                  <p className="mt-4 max-w-md text-sm font-medium text-white/90">
                    Full Color Space Conversion · Rec.709 Target · Custom Lut &amp; Curves Applied
                  </p>
                </div>
              </div>

              {/* Before / Flat Log Layer */}
              <div
                style={{ width: `${sliderPos}%` }}
                className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-white/90 shadow-[5px_0_30px_rgba(0,0,0,0.8)] transition-[width] duration-75 ease-out"
              >
                <div
                  className="flex h-full w-full items-center justify-center p-8 filter desaturate-100 contrast-75 brightness-90"
                  style={{
                    background: activePreset.flatColor,
                    width: containerRef.current ? `${containerRef.current.clientWidth}px` : "100%",
                    maxWidth: "none",
                  }}
                >
                  <div className="text-center">
                    <div className="inline-block rounded-full bg-black/40 px-4 py-1.5 font-mono text-xs font-bold tracking-widest text-white/80 backdrop-blur-md uppercase">
                      RAW S-LOG3 / UNGRADED
                    </div>
                    <p className="mt-4 max-w-md text-sm font-medium text-white/60">
                      Unprocessed Sensor Dynamic Range · Flat Gamma Curve
                    </p>
                  </div>
                </div>

                {/* Left Label */}
                <div className="absolute top-4 left-4 rounded-lg bg-black/80 px-3 py-1.5 backdrop-blur-md">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                      Raw Flat Log (Before)
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Label */}
              <div className="absolute top-4 right-4 rounded-lg bg-[var(--accent,#e0147f)]/90 px-3 py-1.5 backdrop-blur-md shadow-lg">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                    Master Grade (After)
                  </span>
                </div>
              </div>

              {/* Interactive Handle */}
              <div
                style={{ left: `${sliderPos}%` }}
                className="pointer-events-none absolute inset-y-0 -ml-5 flex items-center justify-center transition-[left] duration-75 ease-out"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-black/90 text-white shadow-2xl backdrop-blur-md transition hover:scale-110">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m9 18-6-6 6-6" />
                    <path d="m15 6 6 6-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-2 py-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-white/10 px-2.5 py-1 font-mono text-[11px] font-bold text-[var(--accent,#e0147f)]">
                  {activePreset.badge}
                </span>
                <span className="font-semibold text-white/90">
                  {activePreset.name}
                </span>
              </div>
              <p className="text-white/50 text-[11px] leading-relaxed max-w-md">
                {activePreset.description}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
