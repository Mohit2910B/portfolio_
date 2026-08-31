export type CategoryItem = {
  id: number;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
};

export type ServiceItem = {
  id: number;
  title: string;
  description: string;
  deliverables: string;
  icon: string;
  priceFrom: string;
  sortOrder: number;
  isActive: boolean;
};

export type ToolItem = {
  id: number;
  name: string;
  category: string;
  icon: string;
  level: number;
  sortOrder: number;
  isActive: boolean;
};

export type WorkOptionItem = {
  id: number;
  label: string;
  value: string;
  sortOrder: number;
  isActive: boolean;
};

export type SectionItem = {
  id: number;
  sectionKey: string;
  label: string;
  sortOrder: number;
  isVisible: boolean;
};

export const HOME_FALLBACK = {
  ownerName: "Mohit Babariya",
  heroName: "MOHIT BABARIYA",
  heroTitle: "MAKE\nVISUALS\nMOVE.",
  heroSubtitle: "Video Editor · Motion Designer · Visual Storyteller",
  heroDescription:
    "High-impact visual narratives, rhythm-driven editing, and cinematic aesthetics crafted for top-tier creators, global brands, and disruptive agencies.",
  availabilityLabel: "Available for Q3/Q4 Commissions & Retainers",
  ctaPrimaryLabel: "Watch Showreel",
  ctaSecondaryLabel: "Start a Project",
  reelUrl: "",
  aboutIntro:
    "With 2+ years of specialized experience in video editing, motion design, and visual storytelling, I transform raw ideas and footage into captivating cinematic experiences.",
  aboutExperience:
    "2+ Years of hands-on post-production, commercial reels, dynamic pacing, and sound design.",
  aboutFocus:
    "Rhythm, pacing, color grading, kinetic typography, dynamic soundscapes, and visual retention.",
  aboutWorkflow:
    "Concept & Storyboarding → Assembly Cut → Dynamic Pacing → Color Grade → Sound Design → Final Master.",
  aboutTools:
    "Adobe Premiere Pro, After Effects, DaVinci Resolve, Photoshop, Illustrator, Blender.",
  aboutStrengths:
    "High-retention social reels, commercial storytelling, speed ramping, audio design, and delivery agility.",
  footerNote: "© 2026 Mohit Babariya. All visual rights reserved.",
};

export const CONTACT_FALLBACK = {
  email: "mohitbabariyaa@gmail.com",
  countryCode: "+91",
  phone: "8128362624",
  whatsapp: "8128362624",
  location: "Surat, Gujarat, India (Available Worldwide)",
  instagram: "https://instagram.com/mohitbabariya",
  youtube: "https://youtube.com/@mohitbabariya",
  linkedin: "https://linkedin.com/in/mohitbabariya",
  responseTime: "Within 4 Hours (Mon – Sat)",
};

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 1, name: "Reels & Shorts", slug: "reels-and-shorts", description: "Vertical high-retention social content.", sortOrder: 0, isActive: true },
  { id: 2, name: "Commercials", slug: "commercials", description: "Brand films and product advertisements.", sortOrder: 1, isActive: true },
  { id: 3, name: "Motion Graphics", slug: "motion-graphics", description: "Kinetic typography, titles, and VFX.", sortOrder: 2, isActive: true },
  { id: 4, name: "YouTube Long-form", slug: "youtube-long-form", description: "Paced storytelling and documentary edits.", sortOrder: 3, isActive: true },
  { id: 5, name: "Music & Events", slug: "music-and-events", description: "Concerts, recaps, and music videos.", sortOrder: 4, isActive: true },
];

export const DEFAULT_SERVICES: ServiceItem[] = [
  { id: 1, title: "High-Retention Short-Form Editing", description: "Viral TikTok, Reels & Shorts editing crafted for maximum hook retention and watch time.", deliverables: '["Hook Optimization", "Kinetic Captions", "Sound Design", "Color Grading"]', icon: "cut", priceFrom: "", sortOrder: 0, isActive: true },
  { id: 2, title: "Commercial & Brand Film Post-Production", description: "Broadcast-quality commercial editing with meticulous pacing, grade, and delivery masters.", deliverables: '["Assembly & Rough Cuts", "VFX Cleanups", "Film Emulation", "Multi-Ratio Masters"]', icon: "film", priceFrom: "", sortOrder: 1, isActive: true },
  { id: 3, title: "Motion Graphics & Kinetic Typography", description: "2D/3D kinetic titles, custom HUD elements, lower thirds, and animated overlays.", deliverables: '["Custom Title Packs", "Logo Reveals", "Infographics", "Transition Kits"]', icon: "sparkles", priceFrom: "", sortOrder: 2, isActive: true },
];

export const DEFAULT_SOFTWARE_TOOLS: ToolItem[] = [
  { id: 1, name: "Adobe Premiere Pro", category: "Video Editing", icon: "pr", level: 98, sortOrder: 0, isActive: true },
  { id: 2, name: "Adobe After Effects", category: "Motion Graphics & VFX", icon: "ae", level: 95, sortOrder: 1, isActive: true },
  { id: 3, name: "DaVinci Resolve", category: "Color Grading", icon: "dv", level: 90, sortOrder: 2, isActive: true },
  { id: 4, name: "Adobe Photoshop", category: "Graphic Design", icon: "ps", level: 92, sortOrder: 3, isActive: true },
  { id: 5, name: "Adobe Illustrator", category: "Vector Graphics", icon: "ai", level: 88, sortOrder: 4, isActive: true },
];

export const DEFAULT_WORK_OPTIONS: WorkOptionItem[] = [
  { id: 1, label: "Reels / TikTok / Shorts Package", value: "reels-tiktok-shorts", sortOrder: 0, isActive: true },
  { id: 2, label: "Commercial / Brand Film", value: "commercial-brand-film", sortOrder: 1, isActive: true },
  { id: 3, label: "Motion Graphics & VFX", value: "motion-graphics-vfx", sortOrder: 2, isActive: true },
  { id: 4, label: "YouTube Long-form Video", value: "youtube-long-form", sortOrder: 3, isActive: true },
  { id: 5, label: "Monthly Editing Retainer", value: "monthly-retainer", sortOrder: 4, isActive: true },
];

export const DEFAULT_SECTIONS: SectionItem[] = [
  { id: 1, sectionKey: "hero", label: "Hero & Showreel", sortOrder: 0, isVisible: true },
  { id: 2, sectionKey: "grading", label: "Color Grading", sortOrder: 1, isVisible: true },
  { id: 3, sectionKey: "pipeline", label: "Pipeline", sortOrder: 2, isVisible: true },
  { id: 4, sectionKey: "about", label: "About & Philosophy", sortOrder: 3, isVisible: true },
  { id: 5, sectionKey: "services", label: "Services & Deliverables", sortOrder: 4, isVisible: true },
  { id: 6, sectionKey: "software", label: "Tools & Software", sortOrder: 5, isVisible: true },
  { id: 7, sectionKey: "contact", label: "Contact & Booking", sortOrder: 6, isVisible: true },
];
