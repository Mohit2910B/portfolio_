export type ThemeId =
  | "theme01"
  | "theme02"
  | "theme03"
  | "theme04"
  | "theme05"
  | "theme06";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  archetype: string;
  tagline: string;
  description: string;
  features: string[];
  primaryTone: string;
  accentColor: string;
  visualPreview: {
    bg: string;
    cardBg: string;
    textColor: string;
    accent: string;
    layoutType: string;
  };
}

export const THEMES: ThemeMeta[] = [
  {
    id: "theme01",
    name: "Editorial / Creative Director",
    archetype: "Magazine High-Fashion Editorial",
    tagline: "Bold typography, asymmetric spreads, and cinematic high-fashion storytelling.",
    description:
      "A premium editorial portfolio inspired by luxury magazines and top creative directors. Features oversized typographic headlines, asymmetric spreads, thin structural dividers, and a magazine-inspired project index.",
    features: [
      "Oversized typographic manifesto",
      "Asymmetric editorial project spreads",
      "Thin luxury dividers and numbered index",
      "Minimal floating corner navigation",
      "Editorial storytelling lists for services",
    ],
    primaryTone: "Warm White Paper & Crisp Dark Typography",
    accentColor: "#e0147f",
    visualPreview: {
      bg: "#f7f5f2",
      cardBg: "#ffffff",
      textColor: "#0b0b0c",
      accent: "#e0147f",
      layoutType: "editorial",
    },
  },
  {
    id: "theme02",
    name: "Premium Minimal / Swiss",
    archetype: "Architectural Swiss Grid",
    tagline: "Strict mathematical grid, pristine neo-grotesque type, and generous whitespace.",
    description:
      "Ultra-clean modern portfolio built on strict Swiss graphic design principles. Features rigorous alignment, subtle hairline borders, modular data tables, and minimal pill filtering.",
    features: [
      "Strict Swiss modular grid system",
      "Architectural alignment & coordinates",
      "Minimalist pill filter tabs",
      "Data-table presentation for services & skills",
      "Restrained, elegant micro-animations",
    ],
    primaryTone: "Pure Black, Crisp White & Slate Accents",
    accentColor: "#2563eb",
    visualPreview: {
      bg: "#0a0a0a",
      cardBg: "#141414",
      textColor: "#f5f5f5",
      accent: "#3b82f6",
      layoutType: "swiss",
    },
  },
  {
    id: "theme03",
    name: "Cinematic / Motion Designer",
    archetype: "Dark Theater & Motion-First",
    tagline: "Full-bleed video showcases, glowing theater ambiance, and immersive motion previews.",
    description:
      "A visually immersive portfolio crafted specifically for motion graphics and film editing. Features a massive ambient video hero, letterboxed frames, live hover video previews, and duration badges.",
    features: [
      "Full-bleed ambient video reel hero",
      "Video-first cards with live hover playback",
      "Cinematic duration badges & aspect ratios",
      "Floating frosted glass navigation capsule",
      "Theater glow lighting & kinetic cards",
    ],
    primaryTone: "Deep Obsidian & Glowing Neon Accents",
    accentColor: "#f59e0b",
    visualPreview: {
      bg: "#050508",
      cardBg: "#0f0f18",
      textColor: "#ffffff",
      accent: "#f59e0b",
      layoutType: "cinematic",
    },
  },
  {
    id: "theme04",
    name: "Digital Studio / Art-Direction",
    archetype: "Modern Creative Agency",
    tagline: "Oversized numerals, layered cards, bold badges, and dynamic masonry.",
    description:
      "Modern creative agency style portfolio with high-contrast art direction. Features giant project numbers, floating category badges, layered card offsets, dynamic multi-column masonry, and interactive hover treatments.",
    features: [
      "Oversized numbered project index (01, 02, 03)",
      "Layered studio cards with diagonal tags",
      "Dynamic multi-column masonry layouts",
      "Interactive kinetic typography pairings",
      "Studio deliverable showcase blocks",
    ],
    primaryTone: "High-Contrast Charcoal & Bright Electric",
    accentColor: "#8b5cf6",
    visualPreview: {
      bg: "#0f0f12",
      cardBg: "#1a1a22",
      textColor: "#ffffff",
      accent: "#a855f7",
      layoutType: "studio",
    },
  },
  {
    id: "theme05",
    name: "Futuristic / Interactive",
    archetype: "Cyber-Luxe & HUD Interface",
    tagline: "Holographic glass panels, HUD data badges, glowing accents, and dynamic physics.",
    description:
      "A futuristic interactive portfolio featuring cyber-luxe aesthetics. Includes glowing glassmorphism panels, HUD tech specs, interactive cursor physics, terminal-style contact interface, and holographic cards.",
    features: [
      "HUD-styled data badges & system status",
      "Holographic glass cards with glowing rims",
      "Cybernetic navigation island",
      "Terminal-style interactive enquiry interface",
      "Performant glowing particle & grid matrix",
    ],
    primaryTone: "Matrix Dark, Cyan Glow & Neon Magenta",
    accentColor: "#06b6d4",
    visualPreview: {
      bg: "#030712",
      cardBg: "#0c1322",
      textColor: "#f0fdf4",
      accent: "#06b6d4",
      layoutType: "futuristic",
    },
  },
  {
    id: "theme06",
    name: "Luxury / Art Gallery",
    archetype: "Contemporary Exhibition & Salon",
    tagline: "Refined serif typography, expansive whitespace, and museum-style framed art presentation.",
    description:
      "A refined, elegant portfolio inspired by contemporary art galleries and luxury ateliers. Features delicate serif headings, very generous exhibition whitespace, framed artwork presentation, and museum placard captions.",
    features: [
      "Curator exhibition-style hero composition",
      "Museum placard project captions (Title, Year, Medium)",
      "Framed artwork presentation with fine borders",
      "Classical bespoke typography pairings",
      "Minimalist salon-style service showcase",
    ],
    primaryTone: "Warm Charcoal, Ivory & Muted Gold",
    accentColor: "#d97706",
    visualPreview: {
      bg: "#0c0a09",
      cardBg: "#1c1917",
      textColor: "#fafaf9",
      accent: "#d97706",
      layoutType: "gallery",
    },
  },
];
