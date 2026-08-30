export type PublicProject = {
  id: number;
  title: string;
  description: string;
  categoryId: number;
  categoryLabel: string;
  aiLabType: string;
  year: number;
  software: string;
  tags: string;
  externalLink: string;
  videoUrl: string;
  videoSource: string;
  thumbnailUrl: string;
  aspectRatio: string;
  displaySize: string;
  displayWidth: number;
  displayHeight: number;
  width: number;
  height: number;
  durationSeconds: number;
  featured: boolean;
  published: boolean;
  demoStatus: string;
  sortOrder: number;
  carouselEnabled: boolean;
};

export type CategoryItem = {
  id: number;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  projectCount?: number;
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

export type CarouselSettingItem = {
  id: number;
  categoryId: number | null;
  slots: number;
  centerSize: string;
  sideSize: string;
  autoFill: boolean;
  projectIds: string;
  sortOrder: number;
  isActive: boolean;
};

export type CarouselGlobalSettings = {
  id: number;
  enabled: boolean;
  sectionBadge: string;
  sectionTitle: string;
  sectionSubtitle: string;
  textColor: string;
  autoplay: boolean;
  autoplaySpeed: number;
  infiniteLoop: boolean;
  showArrows: boolean;
  showDots: boolean;
  updatedAt: Date;
};

export type CarouselItem = {
  id: number;
  title: string;
  category: string;
  description: string;
  duration: string;
  videoUrl: string;
  videoSource: string;
  thumbnailUrl: string;
  aspectRatio: string;
  isActive: boolean;
  sortOrder: number;
  projectId?: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export const HOME_FALLBACK = {
  ownerName: "Mohit Babariya",
  heroName: "MOHIT BABARIYA",
  heroTitle: "MAKE\nVISUALS\nMOVE.",
  heroSubtitle: "Video Editor · Motion Designer · Visual Storyteller",
  heroDescription:
    "High-impact visual narratives, rhythm-driven editing, and cinematic aesthetics crafted for top-tier creators, global brands, and disruptive agencies.",
  availabilityLabel: "Available for Q3/Q4 Commissions & Retainers",
  ctaPrimaryLabel: "Explore Selected Works",
  ctaSecondaryLabel: "Start a Project",
  reelUrl: "https://videos.pexels.com/video-files/3843433/3843433-uhd_2560_1440_25fps.mp4",
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

export const DEFAULT_CAROUSEL_GLOBAL_SETTINGS: CarouselGlobalSettings = {
  id: 1,
  enabled: true,
  sectionBadge: "VIDEO SHOWCASE",
  sectionTitle: "SELECTED WORKS",
  sectionSubtitle: "A curated showcase of video editing, motion design, and visual storytelling.",
  textColor: "black",
  autoplay: true,
  autoplaySpeed: 5,
  infiniteLoop: true,
  showArrows: true,
  showDots: true,
  updatedAt: new Date(),
};

export const DEFAULT_CAROUSEL_ITEMS: CarouselItem[] = [
  {
    id: 1,
    title: "Luxury Real Estate Cinematic Tour",
    category: "Real Estate",
    description: "Architectural speed ramps, warm golden hour tones, and sound design.",
    duration: "0:45",
    videoUrl: "https://videos.pexels.com/video-files/7578544/7578544-uhd_1440_2732_25fps.mp4",
    videoSource: "upload",
    thumbnailUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    aspectRatio: "9:16",
    isActive: true,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    title: "Cyberpunk Kinetic Typography Reel",
    category: "Motion Graphics",
    description: "Glitch transitions, neon displacement maps, and bass-boosted sound design.",
    duration: "0:30",
    videoUrl: "https://videos.pexels.com/video-files/3129671/3129671-hd_1080_1920_30fps.mp4",
    videoSource: "upload",
    thumbnailUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
    aspectRatio: "9:16",
    isActive: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    title: "Minimalist Sneaker Brand Commercial",
    category: "Commercial",
    description: "Macro texture cuts, dynamic freeze frames, and rhythm-synced beats.",
    duration: "0:20",
    videoUrl: "https://videos.pexels.com/video-files/5532766/5532766-hd_1080_1920_25fps.mp4",
    videoSource: "upload",
    thumbnailUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    aspectRatio: "9:16",
    isActive: true,
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 4,
    title: "Modern Dining Experience",
    category: "Social Reel",
    description: "Atmospheric lifestyle dining, ambient cuts, and fast-paced sound design.",
    duration: "0:35",
    videoUrl: "https://videos.pexels.com/video-files/4440854/4440854-hd_1080_1920_25fps.mp4",
    videoSource: "upload",
    thumbnailUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    aspectRatio: "9:16",
    isActive: true,
    sortOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 5,
    title: "Urban Highway Midnight Cut",
    category: "Motion Graphics",
    description: "Night motorcycle speed tracking, kinetic text tracking, and neon grade.",
    duration: "0:25",
    videoUrl: "https://videos.pexels.com/video-files/2887463/2887463-hd_1080_1920_30fps.mp4",
    videoSource: "upload",
    thumbnailUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&q=80",
    aspectRatio: "9:16",
    isActive: true,
    sortOrder: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 6,
    title: "Artisan Fresh Brew",
    category: "Brand Film",
    description: "Warm cafe aesthetic, pour-over coffee ritual, and organic depth of field.",
    duration: "0:30",
    videoUrl: "https://videos.pexels.com/video-files/3015510/3015510-hd_1080_1920_24fps.mp4",
    videoSource: "upload",
    thumbnailUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80",
    aspectRatio: "9:16",
    isActive: true,
    sortOrder: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 7,
    title: "Festival Stage Light Show",
    category: "Music & Event",
    description: "Hyper-synced strobe cutting, camera shakes, and sub-bass impact drops.",
    duration: "0:40",
    videoUrl: "https://videos.pexels.com/video-files/3015486/3015486-hd_1080_1920_24fps.mp4",
    videoSource: "upload",
    thumbnailUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80",
    aspectRatio: "9:16",
    isActive: true,
    sortOrder: 6,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 1, name: "Reels & Shorts", slug: "reels-and-shorts", description: "Vertical high-retention social content.", sortOrder: 0, isActive: true },
  { id: 2, name: "Commercials", slug: "commercials", description: "Brand films and product advertisements.", sortOrder: 1, isActive: true },
  { id: 3, name: "Motion Graphics", slug: "motion-graphics", description: "Kinetic typography, titles, and VFX.", sortOrder: 2, isActive: true },
  { id: 4, name: "YouTube Long-form", slug: "youtube-long-form", description: "Paced storytelling and documentary edits.", sortOrder: 3, isActive: true },
  { id: 5, name: "Music & Events", slug: "music-and-events", description: "Concerts, recaps, and music videos.", sortOrder: 4, isActive: true },
];

export const DEFAULT_PROJECTS: PublicProject[] = [
  {
    id: 1,
    title: "Luxury Real Estate Cinematic Tour",
    description: "Architectural speed ramps, warm golden hour tones, and sound design.",
    categoryId: 1,
    categoryLabel: "Reels & Shorts",
    aiLabType: "",
    year: 2026,
    software: "Premiere Pro, DaVinci Resolve",
    tags: "Real Estate, Speed Ramp, Color Grade",
    externalLink: "",
    videoUrl: "https://videos.pexels.com/video-files/7578544/7578544-uhd_1440_2732_25fps.mp4",
    videoSource: "upload",
    thumbnailUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    aspectRatio: "9:16",
    displaySize: "medium",
    displayWidth: 540,
    displayHeight: 960,
    width: 1440,
    height: 2732,
    durationSeconds: 45,
    featured: true,
    published: true,
    demoStatus: "verified",
    sortOrder: 0,
    carouselEnabled: true,
  },
  {
    id: 2,
    title: "Cyberpunk Kinetic Typography",
    description: "Glitch transitions, neon displacement maps, and bass-boosted sound design.",
    categoryId: 3,
    categoryLabel: "Motion Graphics",
    aiLabType: "",
    year: 2026,
    software: "After Effects, Premiere Pro",
    tags: "Kinetic Type, Glitch, Sound Design",
    externalLink: "",
    videoUrl: "https://videos.pexels.com/video-files/3129671/3129671-hd_1080_1920_30fps.mp4",
    videoSource: "upload",
    thumbnailUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
    aspectRatio: "9:16",
    displaySize: "medium",
    displayWidth: 540,
    displayHeight: 960,
    width: 1080,
    height: 1920,
    durationSeconds: 30,
    featured: true,
    published: true,
    demoStatus: "verified",
    sortOrder: 1,
    carouselEnabled: true,
  },
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
  { id: 2, sectionKey: "work", label: "Selected Works", sortOrder: 1, isVisible: true },
  { id: 3, sectionKey: "about", label: "About & Philosophy", sortOrder: 2, isVisible: true },
  { id: 4, sectionKey: "services", label: "Services & Retainers", sortOrder: 3, isVisible: true },
  { id: 5, sectionKey: "software", label: "Tools & Software", sortOrder: 4, isVisible: true },
  { id: 6, sectionKey: "contact", label: "Contact & Booking", sortOrder: 5, isVisible: true },
];
