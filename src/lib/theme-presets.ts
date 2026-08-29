export type ThemePresetKey =
  | "apple-glass"
  | "neomorphism"
  | "glass-luxe"
  | "cyber-neon"
  | "obsidian-gold"
  | "midnight-nebula"
  | "swiss-slate"
  | "emerald-matrix"
  | "sunset-aurora"
  | "frost-ice";

export type ThemePreset = {
  key: ThemePresetKey;
  name: string;
  category: "GlassUI" | "Neomorphism" | "Futuristic" | "Minimal" | "Luxury";
  tagline: string;
  accent: string;
  paper: string;
  ink: string;
  glassAlpha: number;
  glassBlur: number;
  grain: boolean;
  boxShadow?: string;
  previewBg: string;
  previewCardBg: string;
  previewBorder: string;
  badge: string;
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    key: "apple-glass",
    name: "Apple Glass UI",
    category: "GlassUI",
    tagline: "Cupertino Luxury Frosted Crystal & Pure Obsidian",
    accent: "#3b82f6",
    paper: "#09090b",
    ink: "#f4f4f5",
    glassAlpha: 0.1,
    glassBlur: 28,
    grain: false,
    boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
    previewBg: "linear-gradient(135deg, #09090b 0%, #18181b 100%)",
    previewCardBg: "rgba(255, 255, 255, 0.07)",
    previewBorder: "rgba(255, 255, 255, 0.16)",
    badge: "Apple Glass",
  },
  {
    key: "neomorphism",
    name: "Neomorphism Dark",
    category: "Neomorphism",
    tagline: "Soft Embossed Dual-Shadow Depth & Velvety Clay",
    accent: "#8b5cf6",
    paper: "#121316",
    ink: "#e6e8ec",
    glassAlpha: 0.25,
    glassBlur: 0,
    grain: false,
    boxShadow: "8px 8px 18px #08090a, -8px -8px 18px #1c1d22",
    previewBg: "linear-gradient(135deg, #121316 0%, #17181c 100%)",
    previewCardBg: "#141519",
    previewBorder: "rgba(255, 255, 255, 0.05)",
    badge: "Neomorphism",
  },
  {
    key: "glass-luxe",
    name: "Glassmorphism Luxe",
    category: "GlassUI",
    tagline: "Signature Smoky Translucent Glass with Neon Magenta",
    accent: "#e0147f",
    paper: "#0b0b0c",
    ink: "#f7f5f2",
    glassAlpha: 0.45,
    glassBlur: 24,
    grain: true,
    previewBg: "linear-gradient(135deg, #0b0b0c 0%, #1a0b14 100%)",
    previewCardBg: "rgba(255, 255, 255, 0.05)",
    previewBorder: "rgba(224, 20, 127, 0.25)",
    badge: "GlassUI Signature",
  },
  {
    key: "cyber-neon",
    name: "Cyberpunk Neon Studio",
    category: "Futuristic",
    tagline: "High-Voltage Electric Cyan Glow & Deep Nightfall",
    accent: "#00f2fe",
    paper: "#04060a",
    ink: "#ecfeff",
    glassAlpha: 0.2,
    glassBlur: 20,
    grain: true,
    previewBg: "linear-gradient(135deg, #04060a 0%, #03141f 100%)",
    previewCardBg: "rgba(0, 242, 254, 0.04)",
    previewBorder: "rgba(0, 242, 254, 0.28)",
    badge: "Cyberpunk",
  },
  {
    key: "obsidian-gold",
    name: "Obsidian & Imperial Gold",
    category: "Luxury",
    tagline: "Cinematic Prestige Matte Black & Royal Champagne Gold",
    accent: "#eab308",
    paper: "#08080a",
    ink: "#fbf8f2",
    glassAlpha: 0.25,
    glassBlur: 22,
    grain: true,
    previewBg: "linear-gradient(135deg, #08080a 0%, #1c1808 100%)",
    previewCardBg: "rgba(234, 179, 8, 0.05)",
    previewBorder: "rgba(234, 179, 8, 0.24)",
    badge: "Luxury Gold",
  },
  {
    key: "midnight-nebula",
    name: "Deep Cosmic Nebula",
    category: "Futuristic",
    tagline: "Cosmic Midnight Indigo & Radiant Ultraviolet",
    accent: "#a855f7",
    paper: "#070913",
    ink: "#f1f5f9",
    glassAlpha: 0.3,
    glassBlur: 26,
    grain: true,
    previewBg: "linear-gradient(135deg, #070913 0%, #150d2a 100%)",
    previewCardBg: "rgba(168, 85, 247, 0.05)",
    previewBorder: "rgba(168, 85, 247, 0.2)",
    badge: "Nebula",
  },
  {
    key: "swiss-slate",
    name: "Swiss Minimal Titanium",
    category: "Minimal",
    tagline: "Brutalist Clean Architecture & Razor-Sharp Titanium",
    accent: "#ffffff",
    paper: "#000000",
    ink: "#ffffff",
    glassAlpha: 0.15,
    glassBlur: 16,
    grain: false,
    previewBg: "linear-gradient(135deg, #000000 0%, #141414 100%)",
    previewCardBg: "rgba(255, 255, 255, 0.04)",
    previewBorder: "rgba(255, 255, 255, 0.2)",
    badge: "Minimal Swiss",
  },
  {
    key: "emerald-matrix",
    name: "Emerald Cyber Matrix",
    category: "Futuristic",
    tagline: "High-Tech Matrix Obsidian & Electric Emerald Glow",
    accent: "#10b981",
    paper: "#040805",
    ink: "#ecfdf5",
    glassAlpha: 0.25,
    glassBlur: 20,
    grain: true,
    previewBg: "linear-gradient(135deg, #040805 0%, #031b0e 100%)",
    previewCardBg: "rgba(16, 185, 129, 0.05)",
    previewBorder: "rgba(16, 185, 129, 0.22)",
    badge: "Matrix Green",
  },
  {
    key: "sunset-aurora",
    name: "Sunset Horizon Synthwave",
    category: "Luxury",
    tagline: "Warm Twilight Plum & Sunset Coral Fire",
    accent: "#f43f5e",
    paper: "#0c0610",
    ink: "#fff1f2",
    glassAlpha: 0.3,
    glassBlur: 22,
    grain: true,
    previewBg: "linear-gradient(135deg, #0c0610 0%, #200818 100%)",
    previewCardBg: "rgba(244, 63, 94, 0.05)",
    previewBorder: "rgba(244, 63, 94, 0.22)",
    badge: "Sunset Glow",
  },
  {
    key: "frost-ice",
    name: "Frost Ice & Arctic Glass",
    category: "GlassUI",
    tagline: "Glacial Deep Teal & Polar Crystal Highlights",
    accent: "#38bdf8",
    paper: "#040c12",
    ink: "#f0f9ff",
    glassAlpha: 0.25,
    glassBlur: 24,
    grain: true,
    previewBg: "linear-gradient(135deg, #040c12 0%, #051a24 100%)",
    previewCardBg: "rgba(56, 189, 248, 0.05)",
    previewBorder: "rgba(56, 189, 248, 0.22)",
    badge: "Arctic Frost",
  },
];

export function getThemePreset(key?: string): ThemePreset {
  const found = THEME_PRESETS.find((p) => p.key === key);
  return found || THEME_PRESETS[2]; // Default to Glassmorphism Luxe
}

export function buildThemeCssVariables(theme: {
  preset?: string;
  accent?: string;
  glassOpacity?: number;
  glassBlur?: number;
}) {
  const preset = getThemePreset(theme.preset);
  const accent = theme.accent || preset.accent;
  const glassAlpha = theme.glassOpacity !== undefined ? theme.glassOpacity / 100 : preset.glassAlpha;
  const glassBlur = theme.glassBlur !== undefined ? `${theme.glassBlur}px` : `${preset.glassBlur}px`;

  return {
    "--accent": accent,
    "--paper": preset.paper,
    "--color-paper": preset.paper,
    "--ink": preset.ink,
    "--color-ink": preset.ink,
    "--glass-alpha": String(glassAlpha),
    "--glass-blur": glassBlur,
    ...(preset.boxShadow ? { "--theme-shadow": preset.boxShadow } : {}),
  } as React.CSSProperties;
}
