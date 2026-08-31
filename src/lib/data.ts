import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  carouselGlobalSettings,
  carouselItems,
  contactSettings,
  homepageSettings,
  layoutSections,
  projects,
  services,
  softwareTools,
  themeSettings,
  workOptions,
} from "@/db/schema";
import {
  CATEGORY_SEED,
  SECTION_SEED,
  SERVICE_SEED,
  SOFTWARE_TOOL_SEED,
  WORK_OPTION_SEED,
  ensureDatabase,
} from "@/lib/bootstrap";

export type CategoryItem = {
  id: number;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  createdAt: Date;
  updatedAt: Date;
};

export type SkillItem = {
  id: number;
  name: string;
  category: string;
  description: string;
  level: number | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ToolItem = {
  id: number;
  name: string;
  category: string;
  icon: string;
  proficiency: number | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type WorkOptionItem = {
  id: number;
  label: string;
  value: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type SectionItem = {
  id: number;
  sectionKey: string;
  label: string;
  sortOrder: number;
  isVisible: boolean;
  updatedAt: Date;
};

export type PublicProject = {
  id: number;
  title: string;
  description: string;
  categoryId: number | null;
  categoryLabel: string;
  aiLabType: string;
  year: number;
  software: string;
  tags: string;
  externalLink: string;
  videoSource: string;
  videoUrl: string;
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
  sortOrder: number;
  demoStatus: string;
  carouselEnabled: boolean;
  carouselPinned: boolean;
  carouselOrder: number;
  createdAt: Date;
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
  featured?: boolean;
  sortOrder: number;
  projectId?: number | null;
  createdAt: Date;
  updatedAt: Date;
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

export type SiteData = {
  homepage: typeof HOME_FALLBACK & { id?: number; [key: string]: unknown };
  contact: typeof CONTACT_FALLBACK & { id?: number; [key: string]: unknown };
  theme: {
    id: number;
    activeTheme: string;
    accent: string;
    fontPairing: string;
    borderRadius: string;
    animationSpeed: string;
    cursorEffect: boolean;
    glassOpacity: number;
    glassBlur: number;
    grain: boolean;
    updatedAt: Date;
  };
  categories: CategoryItem[];
  allCategories: CategoryItem[];
  services: ServiceItem[];
  softwareTools: ToolItem[];
  workOptions: WorkOptionItem[];
  sections: SectionItem[];
  projects: PublicProject[];
  carouselItems: CarouselItem[];
  carouselGlobalSettings: CarouselGlobalSettings | null;
};

export const HOME_FALLBACK = {
  ownerName: "Mohit Babariya",
  heroName: "MOHIT BABARIYA",
  heroTitle: "MAKE\nVISUALS\nMOVE.",
  heroSubtitle: "VIDEO EDITOR · MOTION GRAPHICS · GRAPHIC DESIGN · AI VIDEO",
  heroDescription:
    "I edit films, reels and motion pieces that hold attention — clean cuts, considered pacing and a finish that feels intentional.",
  availabilityLabel: "Available for freelance projects",
  ctaPrimaryLabel: "WATCH REEL",
  ctaSecondaryLabel: "START PROJECT",
  reelUrl: "",
  aboutIntro:
    "I am Mohit Babariya, a video editor and motion designer working across editorial, social and brand content. My work sits between structure and feel — the timeline has to make sense, and it also has to move someone.",
  aboutExperience:
    "I work as an independent video editor, motion graphics artist and graphic designer, collaborating directly with brands, creators and studios on edits that need to ship fast without losing craft.",
  aboutFocus:
    "Short-form social editing, real-estate films, product videos, motion graphics systems and AI-assisted video workflows.",
  aboutWorkflow:
    "Brief and references → footage review and selects → assembly and pacing → motion graphics and grade → sound design and mix → delivery in every required ratio.",
  aboutTools: "Premiere Pro, After Effects, DaVinci Resolve, Photoshop, Illustrator, AI video tools.",
  aboutStrengths:
    "Clean storytelling, fast turnarounds, consistent colour, precise typography and reliable communication.",
  footerNote: "Video editor · motion graphics · graphic design · AI video",
};

export const CONTACT_FALLBACK = {
  email: "hello@mohitbabariya.studio",
  countryCode: "+91",
  phone: "",
  whatsapp: "",
  location: "India · working worldwide",
  instagram: "",
  youtube: "",
  linkedin: "",
  responseTime: "Replies within 24 hours",
};

export const DEFAULT_CATEGORIES: CategoryItem[] = CATEGORY_SEED.map(([name, description], index) => ({
  id: index + 1,
  name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  description,
  sortOrder: index,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

export const DEFAULT_SERVICES: ServiceItem[] = SERVICE_SEED.map((s, index) => ({
  id: index + 1,
  title: s.title,
  description: s.description,
  deliverables: s.deliverables,
  icon: s.icon,
  priceFrom: "",
  sortOrder: index,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

export const DEFAULT_SOFTWARE_TOOLS: ToolItem[] = SOFTWARE_TOOL_SEED.map(
  ([name, category, icon, proficiency], index) => ({
    id: index + 1,
    name,
    category,
    icon,
    proficiency,
    sortOrder: index,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
);

export const DEFAULT_WORK_OPTIONS: WorkOptionItem[] = WORK_OPTION_SEED.map((label, index) => ({
  id: index + 1,
  label,
  value: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  sortOrder: index,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

export const DEFAULT_SECTIONS: SectionItem[] = SECTION_SEED.map(([sectionKey, label], index) => ({
  id: index + 1,
  sectionKey,
  label,
  sortOrder: index,
  isVisible: true,
  updatedAt: new Date(),
}));

function getFallbackSiteData(): SiteData {
  return {
    homepage: HOME_FALLBACK,
    contact: CONTACT_FALLBACK,
    theme: {
      id: 1,
      activeTheme: "theme01",
      accent: "#e0147f",
      fontPairing: "default",
      borderRadius: "rounded",
      animationSpeed: "normal",
      cursorEffect: true,
      glassOpacity: 45,
      glassBlur: 20,
      grain: true,
      updatedAt: new Date(),
    },
    categories: [],
    allCategories: [],
    services: [],
    softwareTools: [],
    workOptions: [],
    sections: [],
    projects: [],
    carouselItems: [],
    carouselGlobalSettings: null,
  };
}

/**
 * Reads live site data DIRECTLY from PostgreSQL database.
 * No in-memory process caches or silent fallback array replacements.
 */
export async function getSiteData(): Promise<SiteData> {
  try {
    await ensureDatabase();

    const [
      homeRows,
      contactRows,
      themeRows,
      categoryRows,
      serviceRows,
      softwareToolRows,
      workRows,
      sectionRows,
      projectRows,
      carouselItemRows,
      carouselGlobalRows,
    ] = await Promise.all([
      db.select().from(homepageSettings).limit(1),
      db.select().from(contactSettings).limit(1),
      db.select().from(themeSettings).limit(1),
      db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
      db
        .select()
        .from(services)
        .where(eq(services.isActive, true))
        .orderBy(asc(services.sortOrder), asc(services.id)),
      db
        .select()
        .from(softwareTools)
        .where(eq(softwareTools.isActive, true))
        .orderBy(asc(softwareTools.sortOrder), asc(softwareTools.id)),
      db
        .select()
        .from(workOptions)
        .where(eq(workOptions.isActive, true))
        .orderBy(asc(workOptions.sortOrder), asc(workOptions.id)),
      db
        .select()
        .from(layoutSections)
        .orderBy(asc(layoutSections.sortOrder), asc(layoutSections.id)),
      db
        .select()
        .from(projects)
        .where(eq(projects.published, true))
        .orderBy(asc(projects.sortOrder), desc(projects.id)),
      db
        .select()
        .from(carouselItems)
        .where(eq(carouselItems.isActive, true))
        .orderBy(asc(carouselItems.sortOrder), asc(carouselItems.id)),
      db
        .select()
        .from(carouselGlobalSettings)
        .limit(1),
    ]);

    const homepage = { ...HOME_FALLBACK, ...(homeRows[0] ?? {}) };
    const contact = { ...CONTACT_FALLBACK, ...(contactRows[0] ?? {}) };
    const theme = themeRows[0]
      ? {
          id: themeRows[0].id,
          activeTheme: themeRows[0].activeTheme || "theme01",
          accent: themeRows[0].accent || "#e0147f",
          fontPairing: themeRows[0].fontPairing || "default",
          borderRadius: themeRows[0].borderRadius || "rounded",
          animationSpeed: themeRows[0].animationSpeed || "normal",
          cursorEffect: themeRows[0].cursorEffect !== false,
          glassOpacity: themeRows[0].glassOpacity ?? 45,
          glassBlur: themeRows[0].glassBlur ?? 20,
          grain: themeRows[0].grain !== false,
          updatedAt: themeRows[0].updatedAt || new Date(),
        }
      : {
          id: 1,
          activeTheme: "theme01",
          accent: "#e0147f",
          fontPairing: "default",
          borderRadius: "rounded",
          animationSpeed: "normal",
          cursorEffect: true,
          glassOpacity: 45,
          glassBlur: 20,
          grain: true,
          updatedAt: new Date(),
        };

    return {
      homepage,
      contact,
      theme,
      categories: categoryRows.filter((c) => c.isActive),
      allCategories: categoryRows,
      services: serviceRows,
      softwareTools: softwareToolRows,
      workOptions: workRows,
      sections: sectionRows.filter((section) => (section.sectionKey as string) !== "capabilities"),
      projects: projectRows as PublicProject[],
      carouselItems: carouselItemRows as CarouselItem[],
      carouselGlobalSettings: (carouselGlobalRows[0] as CarouselGlobalSettings) ?? null,
    };
  } catch (error) {
    console.error("[getSiteData] Database fetch error:", error);
    return getFallbackSiteData();
  }
}
