"use client";

import { useEffect, useState } from "react";
import {
  CustomThemeConfig,
  DEFAULT_THEME_CONFIG,
  THEME_PRESETS,
  themeConfigToCssVars,
} from "@/lib/themeConfig";

export default function AdminThemesPage() {
  const [activeThemeId, setActiveThemeId] = useState<number>(1);
  const [themeConfig, setThemeConfig] = useState<CustomThemeConfig>({ ...DEFAULT_THEME_CONFIG });
  const [activeTab, setActiveTab] = useState<"colors" | "typography" | "buttons" | "glass" | "radius" | "spacing">("colors");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchThemeSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/theme");
      const data = await res.json();
      if (data.theme) {
        if (data.theme.activeTheme) setActiveThemeId(data.theme.activeTheme);
        if (data.theme.customConfigJson) {
          try {
            const parsed = JSON.parse(data.theme.customConfigJson);
            setThemeConfig((prev) => ({ ...prev, ...parsed }));
          } catch {}
        }
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThemeSettings();
  }, []);

  const handleApplyPreset = (presetId: number) => {
    const preset = THEME_PRESETS[presetId];
    if (preset) {
      setActiveThemeId(presetId);
      setThemeConfig({ ...preset.config });
      setMessage(`Loaded preset: ${preset.name}. Modify values below or click "SAVE THEME TO DATABASE".`);
    }
  };

  const handleSaveTheme = async () => {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeTheme: activeThemeId,
          accentColor: themeConfig.accentColor,
          customConfigJson: JSON.stringify(themeConfig),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed.");
      }

      setMessage("✓ CUSTOM THEME SAVED TO POSTGRESQL & PUBLISHED TO PUBLIC WEBSITE!");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const preset = THEME_PRESETS[activeThemeId] || THEME_PRESETS[1];
    setThemeConfig({ ...preset.config });
    setMessage("Reset to preset defaults.");
  };

  const cssVars = themeConfigToCssVars(themeConfig) as React.CSSProperties;

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Page Title & Preset Selectors */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.12)] pb-6">
        <div>
          <div className="font-mono text-xs text-[#C8A66A] uppercase tracking-widest font-bold">
            CMS THEME STUDIO & DYNAMIC DESIGN TOKENS
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl uppercase tracking-tight text-[#F5F3EE]">
            MANUAL THEME CUSTOMIZATION
          </h1>
          <p className="text-xs text-[#A5A5A5] font-mono mt-1">
            Fine-tune colors, 9:16 carousel framing, glassmorphism, radii, and typography. Database is the single source of truth.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2.5 border border-[rgba(255,255,255,0.16)] text-[#A5A5A5] hover:text-[#F5F3EE] font-mono text-xs uppercase tracking-wider rounded-full"
          >
            RESET
          </button>
          <button
            onClick={handleSaveTheme}
            disabled={saving}
            className="px-6 py-2.5 bg-[#C8A66A] text-[#08090B] font-mono text-xs font-bold tracking-widest uppercase hover:bg-[#D9B77B] transition-all rounded-full shadow-lg"
          >
            {saving ? "SAVING..." : "SAVE & PUBLISH THEME ↗"}
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono text-xs uppercase tracking-widest rounded-xl">
          {message}
        </div>
      )}

      {/* Starting Presets */}
      <div className="space-y-2">
        <label className="font-mono text-xs text-[#A5A5A5] uppercase tracking-widest font-bold">
          1. SELECT A STARTING THEME PRESET
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Object.entries(THEME_PRESETS).map(([idStr, p]) => {
            const pId = Number(idStr);
            const isSel = pId === activeThemeId;
            return (
              <button
                key={pId}
                onClick={() => handleApplyPreset(pId)}
                className={`p-3 rounded-xl border text-left font-mono text-xs transition-all ${
                  isSel
                    ? "bg-[#C8A66A]/15 border-[#C8A66A] text-[#C8A66A] font-bold"
                    : "bg-[#111111] border-[rgba(255,255,255,0.1)] text-[#A5A5A5] hover:border-[rgba(255,255,255,0.3)]"
                }`}
              >
                <div className="text-[10px] opacity-70">PRESET 0{pId}</div>
                <div className="truncate">{p.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center font-mono text-xs text-[#A5A5A5]">
          LOADING THEME STUDIO CONTROLS...
        </div>
      ) : (
        /* Split Studio Layout: Controls Left, Live Preview Right */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Panel */}
          <div className="lg:col-span-7 bg-[#111111] border border-[rgba(255,255,255,0.12)] rounded-2xl p-6 space-y-6">
            {/* Control Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-[rgba(255,255,255,0.1)] pb-4 font-mono text-xs">
              {(
                [
                  ["colors", "21 COLORS"],
                  ["typography", "TYPOGRAPHY"],
                  ["buttons", "BUTTONS"],
                  ["glass", "GLASSMORPHISM"],
                  ["radius", "BORDER RADIUS"],
                  ["spacing", "SPACING"],
                ] as const
              ).map(([tabKey, label]) => (
                <button
                  key={tabKey}
                  onClick={() => setActiveTab(tabKey)}
                  className={`px-3 py-1.5 rounded-lg uppercase tracking-widest font-bold transition-all ${
                    activeTab === tabKey
                      ? "bg-[#C8A66A] text-[#08090B]"
                      : "bg-[rgba(255,255,255,0.05)] text-[#A5A5A5] hover:text-[#F5F3EE]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* TAB 1: 21 COLOR CONTROLS */}
            {activeTab === "colors" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs max-h-[500px] overflow-y-auto pr-2">
                {[
                  ["Page Background", "backgroundColor"],
                  ["Secondary Background", "secondaryBackgroundColor"],
                  ["Primary Text", "textColor"],
                  ["Secondary Text", "secondaryTextColor"],
                  ["Heading Color", "headingColor"],
                  ["Accent Color", "accentColor"],
                  ["Link Color", "linkColor"],
                  ["Border Color", "borderColor"],
                  ["Glass Background", "glassBackground"],
                  ["Glass Border Color", "glassBorderColor"],
                  ["Glass Highlight", "glassHighlightColor"],
                  ["Button Background", "buttonBackground"],
                  ["Button Text", "buttonText"],
                  ["Button Border", "buttonBorder"],
                  ["Button Hover BG", "buttonHoverBackground"],
                  ["Button Hover Text", "buttonHoverText"],
                  ["Input Background", "inputBackground"],
                  ["Input Text", "inputText"],
                  ["Input Border", "inputBorder"],
                  ["Success Color", "successColor"],
                  ["Error Color", "errorColor"],
                ].map(([label, key]) => {
                  const val = (themeConfig as any)[key] || "#000000";
                  return (
                    <div key={key} className="space-y-1 bg-[#08090B] p-3 rounded-xl border border-[rgba(255,255,255,0.08)]">
                      <label className="text-[#A5A5A5] text-[10px] uppercase font-bold block">
                        {label}
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={val.startsWith("#") ? val : "#C8A66A"}
                          onChange={(e) => setThemeConfig({ ...themeConfig, [key]: e.target.value })}
                          className="w-7 h-7 rounded border border-white/20 cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => setThemeConfig({ ...themeConfig, [key]: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 px-2 py-1 text-xs text-[#F5F3EE] focus:border-[#C8A66A] focus:outline-none rounded"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: TYPOGRAPHY CONTROLS */}
            {activeTab === "typography" && (
              <div className="space-y-4 font-mono text-xs">
                <div className="space-y-1">
                  <label className="text-[#A5A5A5] uppercase font-bold">DISPLAY / HEADLINE FONT</label>
                  <select
                    value={themeConfig.displayFont}
                    onChange={(e) => setThemeConfig({ ...themeConfig, displayFont: e.target.value, headingFont: e.target.value })}
                    className="w-full bg-[#08090B] border border-white/15 px-4 py-2.5 text-xs text-[#F5F3EE] focus:border-[#C8A66A] focus:outline-none rounded-xl"
                  >
                    <option value="var(--font-serif), Cormorant Garamond, serif">Cormorant Garamond (Editorial Serif)</option>
                    <option value="DM Serif Display, serif">DM Serif Display</option>
                    <option value="Bodoni Moda, serif">Bodoni Moda</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[#A5A5A5] uppercase font-bold">BODY FONT</label>
                  <select
                    value={themeConfig.bodyFont}
                    onChange={(e) => setThemeConfig({ ...themeConfig, bodyFont: e.target.value })}
                    className="w-full bg-[#08090B] border border-white/15 px-4 py-2.5 text-xs text-[#F5F3EE] focus:border-[#C8A66A] focus:outline-none rounded-xl"
                  >
                    <option value="var(--font-sans), Plus Jakarta Sans, sans-serif">Plus Jakarta Sans</option>
                    <option value="Manrope, sans-serif">Manrope</option>
                    <option value="Sora, sans-serif">Sora</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[#A5A5A5] uppercase font-bold">METADATA / MONO FONT</label>
                  <select
                    value={themeConfig.monoFont}
                    onChange={(e) => setThemeConfig({ ...themeConfig, monoFont: e.target.value })}
                    className="w-full bg-[#08090B] border border-white/15 px-4 py-2.5 text-xs text-[#F5F3EE] focus:border-[#C8A66A] focus:outline-none rounded-xl"
                  >
                    <option value="var(--font-mono), Space Mono, monospace">Space Mono</option>
                    <option value="IBM Plex Mono, monospace">IBM Plex Mono</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-[#A5A5A5] uppercase">HEADING SCALE ({themeConfig.headingScale}x)</label>
                    <input
                      type="range"
                      min="0.8"
                      max="1.4"
                      step="0.05"
                      value={themeConfig.headingScale}
                      onChange={(e) => setThemeConfig({ ...themeConfig, headingScale: Number(e.target.value) })}
                      className="w-full accent-[#C8A66A]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[#A5A5A5] uppercase">BODY SCALE ({themeConfig.bodyScale}x)</label>
                    <input
                      type="range"
                      min="0.8"
                      max="1.3"
                      step="0.05"
                      value={themeConfig.bodyScale}
                      onChange={(e) => setThemeConfig({ ...themeConfig, bodyScale: Number(e.target.value) })}
                      className="w-full accent-[#C8A66A]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: BUTTON CONTROLS */}
            {activeTab === "buttons" && (
              <div className="space-y-4 font-mono text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-[#A5A5A5] uppercase font-bold">BUTTON BORDER RADIUS ({themeConfig.buttonRadius}px)</label>
                    <span className="text-[#C8A66A] font-bold">{themeConfig.buttonRadius >= 999 ? "PILL (999px)" : `${themeConfig.buttonRadius}px`}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="999"
                    step="4"
                    value={themeConfig.buttonRadius}
                    onChange={(e) => setThemeConfig({ ...themeConfig, buttonRadius: Number(e.target.value) })}
                    className="w-full accent-[#C8A66A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[#A5A5A5] uppercase">PADDING X ({themeConfig.buttonPaddingX}px)</label>
                    <input
                      type="range"
                      min="12"
                      max="48"
                      value={themeConfig.buttonPaddingX}
                      onChange={(e) => setThemeConfig({ ...themeConfig, buttonPaddingX: Number(e.target.value) })}
                      className="w-full accent-[#C8A66A]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[#A5A5A5] uppercase">PADDING Y ({themeConfig.buttonPaddingY}px)</label>
                    <input
                      type="range"
                      min="6"
                      max="24"
                      value={themeConfig.buttonPaddingY}
                      onChange={(e) => setThemeConfig({ ...themeConfig, buttonPaddingY: Number(e.target.value) })}
                      className="w-full accent-[#C8A66A]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[#A5A5A5] uppercase">BORDER WIDTH ({themeConfig.buttonBorderWidth}px)</label>
                  <input
                    type="range"
                    min="0"
                    max="4"
                    value={themeConfig.buttonBorderWidth}
                    onChange={(e) => setThemeConfig({ ...themeConfig, buttonBorderWidth: Number(e.target.value) })}
                    className="w-full accent-[#C8A66A]"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: GLASSMORPHISM CONTROLS */}
            {activeTab === "glass" && (
              <div className="space-y-4 font-mono text-xs">
                <div className="space-y-1">
                  <label className="text-[#A5A5A5] uppercase font-bold">GLASS BLUR INTENSITY ({themeConfig.glassBlur}px)</label>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={themeConfig.glassBlur}
                    onChange={(e) => setThemeConfig({ ...themeConfig, glassBlur: Number(e.target.value) })}
                    className="w-full accent-[#C8A66A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#A5A5A5] uppercase font-bold">GLASS OPACITY ({themeConfig.glassOpacity})</label>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.01"
                    value={themeConfig.glassOpacity}
                    onChange={(e) => setThemeConfig({ ...themeConfig, glassOpacity: Number(e.target.value) })}
                    className="w-full accent-[#C8A66A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#A5A5A5] uppercase font-bold">GLASS SATURATION ({themeConfig.glassSaturate}%)</label>
                  <input
                    type="range"
                    min="100"
                    max="200"
                    step="5"
                    value={themeConfig.glassSaturate}
                    onChange={(e) => setThemeConfig({ ...themeConfig, glassSaturate: Number(e.target.value) })}
                    className="w-full accent-[#C8A66A]"
                  />
                </div>
              </div>
            )}

            {/* TAB 5: BORDER RADIUS CONTROLS */}
            {activeTab === "radius" && (
              <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                <div className="space-y-1">
                  <label className="text-[#A5A5A5] uppercase">CARD RADIUS ({themeConfig.cardRadius}px)</label>
                  <input
                    type="range"
                    min="0"
                    max="48"
                    value={themeConfig.cardRadius}
                    onChange={(e) => setThemeConfig({ ...themeConfig, cardRadius: Number(e.target.value) })}
                    className="w-full accent-[#C8A66A]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#A5A5A5] uppercase font-bold">MEDIA RADIUS ({themeConfig.mediaRadius}px)</label>
                  <input
                    type="range"
                    min="0"
                    max="48"
                    value={themeConfig.mediaRadius}
                    onChange={(e) => setThemeConfig({ ...themeConfig, mediaRadius: Number(e.target.value) })}
                    className="w-full accent-[#C8A66A]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#A5A5A5] uppercase">INPUT RADIUS ({themeConfig.inputRadius}px)</label>
                  <input
                    type="range"
                    min="0"
                    max="48"
                    value={themeConfig.inputRadius}
                    onChange={(e) => setThemeConfig({ ...themeConfig, inputRadius: Number(e.target.value) })}
                    className="w-full accent-[#C8A66A]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#A5A5A5] uppercase">NAV RADIUS ({themeConfig.navigationRadius}px)</label>
                  <input
                    type="range"
                    min="0"
                    max="999"
                    step="8"
                    value={themeConfig.navigationRadius}
                    onChange={(e) => setThemeConfig({ ...themeConfig, navigationRadius: Number(e.target.value) })}
                    className="w-full accent-[#C8A66A]"
                  />
                </div>
              </div>
            )}

            {/* TAB 6: SPACING CONTROLS */}
            {activeTab === "spacing" && (
              <div className="space-y-4 font-mono text-xs">
                <div className="space-y-1">
                  <label className="text-[#A5A5A5] uppercase font-bold">SECTION SPACING ({themeConfig.sectionSpacing}px)</label>
                  <input
                    type="range"
                    min="48"
                    max="160"
                    step="8"
                    value={themeConfig.sectionSpacing}
                    onChange={(e) => setThemeConfig({ ...themeConfig, sectionSpacing: Number(e.target.value) })}
                    className="w-full accent-[#C8A66A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#A5A5A5] uppercase font-bold">CONTAINER MAX WIDTH ({themeConfig.containerWidth}px)</label>
                  <input
                    type="range"
                    min="1000"
                    max="1600"
                    step="20"
                    value={themeConfig.containerWidth}
                    onChange={(e) => setThemeConfig({ ...themeConfig, containerWidth: Number(e.target.value) })}
                    className="w-full accent-[#C8A66A]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: LIVE PREVIEW CONTAINER */}
          <div className="lg:col-span-5 space-y-4 sticky top-6">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-[#C8A66A] font-bold uppercase tracking-widest">REAL-TIME LIVE PREVIEW</span>
              <span className="text-[#A5A5A5] text-[10px]">DYNAMIC TOKENS INJECTED</span>
            </div>

            {/* Simulated Live Website Container */}
            <div
              style={cssVars}
              className="bg-[var(--theme-bg)] text-[var(--theme-text)] border border-[var(--theme-border)] rounded-2xl p-6 space-y-6 shadow-2xl transition-all duration-300 overflow-hidden"
            >
              {/* Header Pill */}
              <div
                style={{
                  backgroundColor: "var(--theme-glass-bg)",
                  borderColor: "var(--theme-glass-border)",
                  borderRadius: "var(--theme-radius-nav)",
                }}
                className="p-3 border backdrop-blur-md flex items-center justify-between font-mono text-[10px]"
              >
                <div className="font-bold text-[var(--theme-heading)]">MOHIT BABARIYA</div>
                <div
                  style={{
                    backgroundColor: "var(--theme-button-bg)",
                    color: "var(--theme-button-text)",
                    borderRadius: "var(--theme-button-radius)",
                  }}
                  className="px-3 py-1 font-bold uppercase"
                >
                  LET'S TALK
                </div>
              </div>

              {/* Editorial Headline */}
              <div className="space-y-1">
                <div className="font-mono text-[10px] text-[var(--theme-accent)] uppercase tracking-widest font-bold">
                  ● 2+ YEARS EXPERIENCE
                </div>
                <h3 className="font-serif font-bold text-3xl tracking-tight text-[var(--theme-heading)]">
                  Editing That Moves.
                </h3>
                <p className="text-xs text-[var(--theme-text-secondary)] font-sans">
                  Crafting high-converting short-form 9:16 reels and cinematic motion graphics.
                </p>
              </div>

              {/* 9:16 Vertical Video Container Preview */}
              <div
                style={{
                  aspectRatio: "9 / 16",
                  maxHeight: "260px",
                  borderRadius: "var(--theme-radius-card)",
                  borderColor: "var(--theme-glass-border)",
                }}
                className="w-full mx-auto bg-black border relative overflow-hidden flex flex-col justify-between p-4 shadow-xl"
              >
                <div className="font-mono text-[9px] text-[#C8A66A] font-bold bg-black/60 px-2.5 py-1 rounded-full w-fit">
                  9:16 PORTRAIT (1080×1920)
                </div>

                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md mx-auto flex items-center justify-center text-white">
                  ▶
                </div>

                <div className="space-y-2">
                  <div className="font-serif text-sm font-bold text-white">Commercial Motion Reel</div>
                  <button
                    style={{
                      backgroundColor: "var(--theme-button-bg)",
                      color: "var(--theme-button-text)",
                      borderRadius: "var(--theme-button-radius)",
                      paddingLeft: "var(--theme-button-padding-x)",
                      paddingRight: "var(--theme-button-padding-x)",
                      paddingTop: "var(--theme-button-padding-y)",
                      paddingBottom: "var(--theme-button-padding-y)",
                    }}
                    className="w-full text-[10px] font-mono font-bold uppercase tracking-widest"
                  >
                    WATCH 9:16 REEL →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
