"use client";

import { useCallback, useEffect, useState } from "react";
import { THEMES, type ThemeId, type ThemeMeta } from "@/components/site/themes/theme-constants";
import {
  Button,
  Card,
  Field,
  Notice,
  SectionTitle,
  Select,
  TextInput,
  Toggle,
  api,
} from "./ui";

interface ThemeSettingsState {
  activeTheme: ThemeId;
  accent: string;
  fontPairing: string;
  borderRadius: string;
  animationSpeed: string;
  cursorEffect: boolean;
  glassOpacity: number;
  glassBlur: number;
  grain: boolean;
}

const DEFAULT_THEME_SETTINGS: ThemeSettingsState = {
  activeTheme: "theme01",
  accent: "#e0147f",
  fontPairing: "default",
  borderRadius: "rounded",
  animationSpeed: "normal",
  cursorEffect: true,
  glassOpacity: 45,
  glassBlur: 20,
  grain: true,
};

const ACCENT_PRESETS = [
  { name: "Hot Pink (Editorial)", value: "#e0147f" },
  { name: "Electric Blue (Swiss)", value: "#3b82f6" },
  { name: "Amber Gold (Cinematic)", value: "#f59e0b" },
  { name: "Purple / Violet (Studio)", value: "#8b5cf6" },
  { name: "Cyan Matrix (Futuristic)", value: "#06b6d4" },
  { name: "Muted Gold (Gallery)", value: "#d97706" },
  { name: "Pure Monochrome", value: "#ffffff" },
];

export function ThemeStudioAdmin({ onChanged }: { onChanged?: () => void }) {
  const [settings, setSettings] = useState<ThemeSettingsState>(DEFAULT_THEME_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // Modals & States
  const [previewTheme, setPreviewTheme] = useState<ThemeMeta | null>(null);
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [confirmApplyTheme, setConfirmApplyTheme] = useState<ThemeMeta | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const showToast = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api<{ settings?: Partial<ThemeSettingsState> }>("/api/admin/settings/theme");
      if (res.settings) {
        setSettings({
          ...DEFAULT_THEME_SETTINGS,
          ...res.settings,
          activeTheme: (res.settings.activeTheme as ThemeId) || "theme01",
        });
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load theme settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Apply Theme Handler
  const applyTheme = async (themeId: ThemeId) => {
    const selectedMeta = THEMES.find((t) => t.id === themeId);
    setSaving(true);
    setError("");
    setConfirmApplyTheme(null);
    setPreviewTheme(null);

    const nextSettings: ThemeSettingsState = {
      ...settings,
      activeTheme: themeId,
      accent: selectedMeta?.accentColor || settings.accent,
    };

    setSettings(nextSettings);

    try {
      await api("/api/admin/settings/theme", {
        method: "PATCH",
        body: JSON.stringify(nextSettings),
      });
      showToast(`Applied "${selectedMeta?.name || themeId}" live on website.`);
      onChanged?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to apply theme.");
      await load();
    } finally {
      setSaving(false);
    }
  };

  // Save Custom Settings Handler
  const saveCustomSettings = async () => {
    setSaving(true);
    setError("");
    try {
      await api("/api/admin/settings/theme", {
        method: "PATCH",
        body: JSON.stringify(settings),
      });
      showToast("Theme fine-tuning settings saved.");
      onChanged?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save theme settings.");
    } finally {
      setSaving(false);
    }
  };

  // Restore Default Theme (Theme 01)
  const restoreDefault = async () => {
    if (!window.confirm("Restore default Theme 01 (Editorial / Creative Director)? Content will be untouched.")) return;
    await applyTheme("theme01");
  };

  const activeThemeMeta = THEMES.find((t) => t.id === settings.activeTheme) || THEMES[0];

  return (
    <div className="space-y-10">
      {/* Header Banner */}
      <div>
        <SectionTitle
          title="THEME STUDIO"
          subtitle="Change the complete visual identity of the website without changing your content."
          action={
            <Button
              variant="light"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs uppercase tracking-wider"
            >
              {showAdvanced ? "Hide Fine-Tuning" : "⚙ Fine-Tuning Settings"}
            </Button>
          }
        />

        {/* Current Active Theme Highlight Pill */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className="h-4 w-4 rounded-full shadow-sm"
              style={{ backgroundColor: activeThemeMeta.accentColor }}
            />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">
                CURRENT LIVE THEME
              </span>
              <h4 className="font-heading text-base font-bold text-ink">
                {activeThemeMeta.name} ({activeThemeMeta.archetype})
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              ✓ LIVE ON WEBSITE
            </span>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-black/15 bg-black/5 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-black/10 transition"
            >
              Open Public Site ↗
            </a>
          </div>
        </div>
      </div>

      {notice && <Notice tone="success">{notice}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      {/* ---------------- 6 THEME PREVIEW CARDS ---------------- */}
      <div className="space-y-4">
        <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-ink">
          Available Design Systems (6 Complete Themes)
        </h3>
        <p className="text-xs text-ink/60">
          Click &ldquo;Preview&rdquo; to inspect any theme with live database data, or &ldquo;Apply Theme&rdquo; to transform the live website instantly.
        </p>

        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-3xl border border-dashed border-black/10">
            <p className="text-sm font-medium text-ink/40">Loading themes…</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {THEMES.map((theme) => {
              const isActive = theme.id === settings.activeTheme;

              return (
                <Card
                  key={theme.id}
                  className={`relative flex flex-col overflow-hidden rounded-3xl p-5 transition-all duration-300 ${
                    isActive
                      ? "ring-2 ring-brand shadow-lg bg-white"
                      : "hover:shadow-md hover:border-black/25 bg-white/80"
                  }`}
                >
                  {/* Active Indicator Badge */}
                  {isActive && (
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-0.5 font-mono text-[10px] font-black text-white shadow-md">
                      ✓ LIVE
                    </div>
                  )}

                  {/* Miniature Visual Representation */}
                  <div
                    onClick={() => setPreviewTheme(theme)}
                    className="group relative aspect-[16/10] w-full cursor-pointer overflow-hidden rounded-2xl border border-black/10 p-3 transition-transform duration-300 hover:scale-[1.02]"
                    style={{ backgroundColor: theme.visualPreview.bg }}
                  >
                    {/* Simulated Mini Site Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <div className="h-2 w-12 rounded-sm bg-white/80" />
                      <div className="flex gap-1">
                        <div className="h-1.5 w-6 rounded-xs bg-white/40" />
                        <div className="h-1.5 w-6 rounded-xs bg-white/40" />
                        <div className="h-1.5 w-6 rounded-xs bg-white/40" />
                      </div>
                    </div>

                    {/* Simulated Mini Hero Layout */}
                    <div className="mt-2 space-y-1">
                      <div
                        className="h-1.5 w-16 rounded-xs"
                        style={{ backgroundColor: theme.visualPreview.accent }}
                      />
                      <div className="h-4 w-3/4 rounded-xs bg-white font-black opacity-90" />
                      <div className="h-2 w-1/2 rounded-xs bg-white/30" />
                    </div>

                    {/* Simulated Mini Cards Grid */}
                    <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                      <div
                        className="aspect-[9/14] rounded-md border border-white/10"
                        style={{ backgroundColor: theme.visualPreview.cardBg }}
                      />
                      <div
                        className="aspect-[9/14] rounded-md border border-white/20 shadow-sm"
                        style={{
                          backgroundColor: theme.visualPreview.cardBg,
                          borderColor: theme.visualPreview.accent,
                        }}
                      />
                      <div
                        className="aspect-[9/14] rounded-md border border-white/10"
                        style={{ backgroundColor: theme.visualPreview.cardBg }}
                      />
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 backdrop-blur-xs transition duration-200 group-hover:opacity-100">
                      <span className="rounded-full bg-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-black shadow-md">
                        Preview Theme 🔍
                      </span>
                    </div>
                  </div>

                  {/* Theme Info */}
                  <div className="mt-4 flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: theme.accentColor }}
                      />
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink/50">
                        {theme.archetype}
                      </span>
                    </div>

                    <h4 className="font-heading text-base font-bold text-ink">{theme.name}</h4>

                    <p className="text-xs leading-relaxed text-ink/65 line-clamp-2">
                      {theme.tagline}
                    </p>

                    {/* Feature bullet tags */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {theme.features.slice(0, 2).map((feat, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-black/5 px-2 py-0.5 text-[10px] text-ink/70"
                        >
                          • {feat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex items-center gap-2 border-t border-black/5 pt-4">
                    <Button
                      variant="light"
                      onClick={() => setPreviewTheme(theme)}
                      className="flex-1 text-xs"
                    >
                      Preview
                    </Button>
                    <Button
                      variant={isActive ? "ghost" : "dark"}
                      disabled={isActive || saving}
                      onClick={() => setConfirmApplyTheme(theme)}
                      className="flex-1 text-xs uppercase tracking-wider"
                    >
                      {isActive ? "Active Theme" : "Apply Theme"}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ---------------- OPTIONAL ADVANCED FINE-TUNING DRAWER ---------------- */}
      {showAdvanced && (
        <Card className="p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-black/5 pb-4">
            <div>
              <h4 className="font-heading text-base font-bold text-ink">
                Optional Theme Fine-Tuning Settings
              </h4>
              <p className="text-xs text-ink/60">
                Adjust accent color, font pairing, or restore the default theme.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => void restoreDefault()} className="text-xs">
                Restore Default (Theme 01)
              </Button>
              <Button
                variant="dark"
                disabled={saving}
                onClick={() => void saveCustomSettings()}
                className="text-xs uppercase"
              >
                {saving ? "Saving…" : "Save Customization"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <Field label="Accent Color" hint="Primary highlight & indicator tone">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.accent}
                    onChange={(e) => setSettings({ ...settings, accent: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded-xl border border-black/15 bg-transparent"
                  />
                  <TextInput
                    value={settings.accent}
                    onChange={(val) => setSettings({ ...settings, accent: val })}
                  />
                </div>
              </Field>

              {/* Accent Color Presets */}
              <div className="flex flex-wrap gap-1.5">
                {ACCENT_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setSettings({ ...settings, accent: preset.value })}
                    className="flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-2.5 py-1 text-[11px] font-medium text-ink hover:bg-black/5"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: preset.value }} />
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl bg-black/[0.02] p-5">
              <Field label="Font Pairing Archetype">
                <Select
                  value={settings.fontPairing}
                  onChange={(val) => setSettings({ ...settings, fontPairing: val })}
                  options={[
                    { value: "default", label: "Theme Default (Recommended)" },
                    { value: "editorial", label: "Editorial Serif + Clean Sans" },
                    { value: "swiss", label: "Swiss Neo-Grotesque" },
                    { value: "futuristic", label: "Cyber Monospace + Kinetic Sans" },
                  ]}
                />
              </Field>

              <Field label="Border Radius Treatment">
                <Select
                  value={settings.borderRadius}
                  onChange={(val) => setSettings({ ...settings, borderRadius: val })}
                  options={[
                    { value: "rounded", label: "Curved / Rounded-3xl (Modern)" },
                    { value: "sharp", label: "Sharp / Architectural Box (Minimalist)" },
                    { value: "pill", label: "Pill Capsule (Futuristic)" },
                  ]}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <Toggle
                  label="Film Grain Effect"
                  checked={settings.grain}
                  onChange={(val) => setSettings({ ...settings, grain: val })}
                />
                <Toggle
                  label="Interactive Cursor"
                  checked={settings.cursorEffect}
                  onChange={(val) => setSettings({ ...settings, cursorEffect: val })}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ----------------- FULL-SCREEN INTERACTIVE PREVIEW MODAL ----------------- */}
      {previewTheme && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-xl">
          {/* Top Preview Control Bar */}
          <div className="flex items-center justify-between border-b border-white/15 bg-black/90 px-6 py-3">
            <div className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: previewTheme.accentColor }}
              />
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                  LIVE THEME PREVIEW
                </span>
                <h4 className="font-heading text-sm font-bold text-white">
                  {previewTheme.name} ({previewTheme.archetype})
                </h4>
              </div>
            </div>

            {/* Viewport device switcher */}
            <div className="flex rounded-lg border border-white/15 bg-white/5 p-0.5">
              <button
                type="button"
                onClick={() => setPreviewViewport("desktop")}
                className={`rounded px-3 py-1 font-mono text-[10px] uppercase font-bold transition ${
                  previewViewport === "desktop" ? "bg-white text-black" : "text-white/60 hover:text-white"
                }`}
              >
                🖥 Desktop (100%)
              </button>
              <button
                type="button"
                onClick={() => setPreviewViewport("tablet")}
                className={`rounded px-3 py-1 font-mono text-[10px] uppercase font-bold transition ${
                  previewViewport === "tablet" ? "bg-white text-black" : "text-white/60 hover:text-white"
                }`}
              >
                📱 Tablet (768px)
              </button>
              <button
                type="button"
                onClick={() => setPreviewViewport("mobile")}
                className={`rounded px-3 py-1 font-mono text-[10px] uppercase font-bold transition ${
                  previewViewport === "mobile" ? "bg-white text-black" : "text-white/60 hover:text-white"
                }`}
              >
                📱 Mobile (390px)
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="dark"
                onClick={() => void applyTheme(previewTheme.id)}
                className="!bg-emerald-500 hover:!bg-emerald-600 !text-white text-xs uppercase tracking-wider font-bold"
              >
                ✓ Apply This Theme
              </Button>
              <button
                type="button"
                onClick={() => setPreviewTheme(null)}
                className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Close Preview"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Iframe Viewport Container */}
          <div className="flex flex-1 items-center justify-center overflow-auto p-4 bg-neutral-950">
            <div
              className={`h-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition-all duration-300 ${
                previewViewport === "mobile"
                  ? "w-[390px] max-h-[844px]"
                  : previewViewport === "tablet"
                    ? "w-[768px] max-h-[1024px]"
                    : "w-full max-w-7xl"
              }`}
            >
              <iframe
                src={`/?theme=${previewTheme.id}`}
                title={`Preview ${previewTheme.name}`}
                className="h-full w-full border-0 bg-black"
              />
            </div>
          </div>
        </div>
      )}

      {/* ----------------- CONFIRM APPLY THEME MODAL ----------------- */}
      {confirmApplyTheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <Card className="w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: confirmApplyTheme.accentColor }}
              />
              <h4 className="font-heading text-lg font-bold text-ink">Apply Theme to Live Website?</h4>
            </div>

            <p className="text-xs leading-relaxed text-ink/70">
              This will immediately transform the complete public website to{" "}
              <strong>{confirmApplyTheme.name}</strong>.
            </p>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] text-emerald-800 space-y-1">
              <div>✓ All portfolio projects, media, and categories remain safe and untouched.</div>
              <div>✓ All enquiries, contact details, and settings remain preserved.</div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="light" onClick={() => setConfirmApplyTheme(null)}>
                Cancel
              </Button>
              <Button
                variant="dark"
                onClick={() => void applyTheme(confirmApplyTheme.id)}
                className="!bg-emerald-600 hover:!bg-emerald-700 !text-white text-xs uppercase"
              >
                Confirm &amp; Apply Theme
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
