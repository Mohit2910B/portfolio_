"use client";

import { useEffect, useState } from "react";

const CLIPS_V1 = [
  { left: 2, width: 17, tone: "rgba(255,255,255,0.9)" },
  { left: 21, width: 11, tone: "rgba(255,255,255,0.62)" },
  { left: 34, width: 23, tone: "rgba(255,255,255,0.82)" },
  { left: 59, width: 13, tone: "rgba(255,255,255,0.55)" },
  { left: 74, width: 24, tone: "rgba(255,255,255,0.75)" },
];

const CLIPS_V2 = [
  { left: 12, width: 9, tone: "rgba(224,20,127,0.85)" },
  { left: 45, width: 14, tone: "rgba(224,20,127,0.55)" },
  { left: 68, width: 8, tone: "rgba(255,255,255,0.45)" },
];

const CLIPS_A1 = [
  { left: 4, width: 28, tone: "rgba(255,255,255,0.34)" },
  { left: 36, width: 32, tone: "rgba(255,255,255,0.26)" },
  { left: 72, width: 24, tone: "rgba(255,255,255,0.32)" },
];

function timecode(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  const f = Math.floor((seconds % 1) * 24)
    .toString()
    .padStart(2, "0");
  return `00:${m}:${s}:${f}`;
}

export default function EditorVisual() {
  const [playhead, setPlayhead] = useState(28);
  const [clock, setClock] = useState(6.4);
  const [render, setRender] = useState(72);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClock((c) => (c > 41 ? 0 : c + 0.25));
      setPlayhead((p) => (p > 97 ? 2 : p + 2.3));
      setRender((r) => (r >= 99 ? 64 : r + 0.6));
    }, 220);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full">
      {/* halo */}
      <div
        aria-hidden="true"
        className="absolute -inset-8 -z-10 rounded-[48px] opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(60% 55% at 30% 20%, rgba(255,255,255,0.9), transparent 70%), radial-gradient(50% 50% at 80% 80%, rgba(224,20,127,0.18), transparent 70%)",
        }}
      />

      <div className="glass relative overflow-hidden rounded-[28px] p-3 sm:p-4">
        {/* window chrome */}
        <div className="flex items-center justify-between px-1 pb-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-ink/15" />
            <span className="h-2 w-2 rounded-full bg-ink/15" />
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
          </div>
          <p className="mono text-[0.6rem] tracking-[0.18em] text-ink/45">
            MOHIT_BABARIYA&nbsp;/&nbsp;SEQUENCE_01
          </p>
          <p className="mono text-[0.6rem] tracking-[0.18em] text-ink/45">24 FPS</p>
        </div>

        {/* preview */}
        <div className="relative overflow-hidden rounded-2xl bg-ink" style={{ paddingBottom: "52%" }}>
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 90% at 15% 10%, rgba(255,255,255,0.22), transparent 55%), radial-gradient(90% 80% at 85% 90%, rgba(224,20,127,0.35), transparent 60%), linear-gradient(160deg, #16161a, #050506 70%)",
            }}
          />
          {/* fake frame grid */}
          <div aria-hidden="true" className="absolute inset-0 opacity-[0.16]">
            <div className="absolute left-1/2 top-0 h-full w-px bg-white" />
            <div className="absolute left-0 top-1/2 h-px w-full bg-white" />
            <div className="absolute left-[12%] top-[14%] h-[72%] w-[30%] rounded-sm border border-white/70" />
            <div className="absolute right-[10%] top-[26%] h-[48%] w-[34%] rounded-sm border border-white/40" />
          </div>
          <div aria-hidden="true" className="scanline absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/12 to-transparent" />

          {/* play button */}
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause preview" : "Play preview"}
            className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-white/10 backdrop-blur-md transition-transform duration-300 hover:scale-110"
          >
            {playing ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* badges */}
          <div className="absolute left-3 top-3 flex items-center gap-2">
            <span className="rounded-md border border-white/20 bg-black/45 px-2 py-1 text-[0.55rem] font-semibold tracking-[0.16em] text-white/80 backdrop-blur-md">
              16:9
            </span>
            <span className="rounded-md border border-white/20 bg-black/45 px-2 py-1 text-[0.55rem] font-semibold tracking-[0.16em] text-white/80 backdrop-blur-md">
              3840 × 2160
            </span>
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <p className="mono text-[0.6rem] tracking-[0.14em] text-white/75">{timecode(clock)}</p>
            <div className="glass-dark flex items-center gap-2 rounded-full px-3 py-1.5">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              <span className="text-[0.55rem] font-semibold uppercase tracking-[0.18em] text-white/85">
                AI upscale
              </span>
              <span className="mono text-[0.55rem] text-white/60">{Math.round(render)}%</span>
            </div>
          </div>
        </div>

        {/* timeline */}
        <div className="mt-3 rounded-2xl border border-ink/8 bg-white/45 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-ink/45">
              Timeline · V1 V2 A1
            </p>
            <p className="mono text-[0.55rem] tracking-[0.14em] text-ink/40">00:00:12:08</p>
          </div>

          <div className="relative space-y-1.5">
            {/* ruler */}
            <div className="relative h-3">
              {Array.from({ length: 13 }).map((_, i) => (
                <span
                  key={i}
                  className="absolute top-0 h-1.5 w-px bg-ink/15"
                  style={{ left: `${(i / 12) * 100}%` }}
                />
              ))}
            </div>

            <Track clips={CLIPS_V1} label="V1" />
            <Track clips={CLIPS_V2} label="V2" accent />
            <Track clips={CLIPS_A1} label="A1" wave />

            {/* keyframes */}
            <div className="relative h-4">
              {[18, 34, 52, 68, 86].map((left, index) => (
                <span
                  key={left}
                  className="keyframe-float absolute top-1 h-2 w-2 rotate-45 border border-[var(--accent)] bg-white"
                  style={{ left: `${left}%`, animationDelay: `${index * 0.4}s` }}
                />
              ))}
            </div>

            {/* playhead */}
            <div
              className="pointer-events-none absolute -top-1 bottom-0 w-px bg-[var(--accent)]"
              style={{ left: `${playhead}%`, transition: "left 220ms linear" }}
            >
              <span className="absolute -left-1.5 -top-1 h-3 w-3 rounded-sm bg-[var(--accent)]" />
            </div>
          </div>
        </div>
      </div>

      {/* floating chips */}
      <div className="glass absolute -left-3 bottom-16 hidden rounded-2xl px-3 py-2 sm:block">
        <p className="text-[0.5rem] font-semibold uppercase tracking-[0.2em] text-ink/45">Colour</p>
        <p className="mono mt-1 text-[0.65rem] text-ink/80">Rec.709 · 3200K</p>
      </div>
      <div className="glass absolute -right-4 top-24 hidden rounded-2xl px-3 py-2 sm:block">
        <p className="text-[0.5rem] font-semibold uppercase tracking-[0.2em] text-ink/45">Cut</p>
        <p className="mono mt-1 text-[0.65rem] text-ink/80">J · L · Match</p>
      </div>
    </div>
  );
}

function Track({
  clips,
  label,
  accent = false,
  wave = false,
}: {
  clips: { left: number; width: number; tone: string }[];
  label: string;
  accent?: boolean;
  wave?: boolean;
}) {
  return (
    <div className="relative h-6 overflow-hidden rounded-md bg-ink/5">
      <span className="absolute left-1.5 top-1/2 z-10 -translate-y-1/2 text-[0.5rem] font-bold tracking-[0.1em] text-ink/35">
        {label}
      </span>
      {clips.map((clip, index) => (
        <span
          key={`${label}-${index}`}
          className="absolute top-1 h-4 rounded-[3px] border border-black/10"
          style={{
            left: `${clip.left}%`,
            width: `${clip.width}%`,
            background: wave
              ? `repeating-linear-gradient(90deg, ${clip.tone} 0 2px, transparent 2px 5px)`
              : `linear-gradient(180deg, ${clip.tone}, rgba(255,255,255,0.15))`,
          }}
        />
      ))}
      {accent && (
        <span className="absolute inset-y-0 right-1 z-10 my-auto h-2 w-2 rotate-45 self-center border border-[var(--accent)] bg-white" />
      )}
    </div>
  );
}
