import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  carouselGlobalSettings,
  carouselItems,
  carouselSettings,
  categories,
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
  PROJECT_SEED,
  SECTION_SEED,
  SERVICE_SEED,
  SKILL_SEED,
  SOFTWARE_TOOL_SEED,
  WORK_OPTION_SEED,
  ensureDatabase,
} from "@/lib/bootstrap";

export type PublicProject = {
  id: number;
  title: string;
  description: string;
  categoryId: number | null;
  categoryLabel: string;
  aiLabType: string;
  year: number | null;
  software: string;
  tags: string;
  externalLink: string;
  videoSource: string;
  videoUrl: string;
  thumbnailUrl: string;
  aspectRatio: string;
  displaySize: string;
  displayWidth: number | null;
  displayHeight: number | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  featured: boolean;
  published: boolean;
  demoStatus: string;
  sortOrder: number;
  carouselEnabled: boolean;
  carouselPinned: boolean;
  carouselOrder: number;
};

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

export const DEFAULT_CAROUSEL_ITEMS: CarouselItem[] = [];

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
  projects: PublicProject[];
  services: ServiceItem[];
  softwareTools: ToolItem[];
  workOptions: WorkOptionItem[];
  sections: SectionItem[];
  carouselSettings: CarouselSettingItem[];
  carouselGlobalSettings: CarouselGlobalSettings;
  carouselItems: CarouselItem[];
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
  reelUrl: "https://videos.pexels.com/video-files/39105109/16638114_3840_2160_30fps.mp4",
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

export const DEFAULT_PROJECTS: PublicProject[] = PROJECT_SEED.map((p, index) => ({
  id: index + 1,
  title: p.title,
  description: p.description,
  categoryId: index + 1,
  categoryLabel: p.category,
  aiLabType: "",
  year: p.year,
  software: p.software,
  tags: p.tags,
  externalLink: "",
  videoUrl: p.videoUrl,
  videoSource: "url",
  thumbnailUrl: p.thumbnailUrl,
  aspectRatio: p.aspectRatio,
  displaySize: p.displaySize,
  displayWidth: p.aspectRatio === "9:16" ? 540 : 1200,
  displayHeight: p.aspectRatio === "9:16" ? 960 : 675,
  width: p.width,
  height: p.height,
  durationSeconds: p.durationSeconds,
  featured: p.featured,
  published: true,
  demoStatus: p.demoStatus,
  sortOrder: index,
  carouselEnabled: true,
  carouselPinned: false,
  carouselOrder: index,
}));

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

export const DEFAULT_CAROUSEL_SETTINGS: CarouselSettingItem[] = DEFAULT_CATEGORIES.map((category, index) => ({
  id: index + 1,
  categoryId: category.id,
  slots: index === 0 ? 7 : 5,
  centerSize: "large",
  sideSize: "small",
  autoFill: true,
  projectIds: "[]",
  sortOrder: index,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

declare global {
  // eslint-disable-next-line no-var
  var __runtimeSiteDataOverrides:
    | (Partial<SiteData> & {
        notificationSettings?: {
          id: number;
          emailEnabled: boolean;
          notificationEmail: string;
          adminStatus: "online" | "offline";
          aiAutoReply: boolean;
        };
      })
    | undefined;
}

if (!globalThis.__runtimeSiteDataOverrides) {
  globalThis.__runtimeSiteDataOverrides = {};
}

export function setRuntimeOverride<K extends keyof SiteData>(key: K, value: SiteData[K]) {
  if (!globalThis.__runtimeSiteDataOverrides) globalThis.__runtimeSiteDataOverrides = {};
  globalThis.__runtimeSiteDataOverrides[key] = value;
  invalidateSiteDataCache();
}

export function getRuntimeOverride<K extends keyof SiteData>(key: K): SiteData[K] | undefined {
  return globalThis.__runtimeSiteDataOverrides?.[key] as SiteData[K] | undefined;
}

function getFallbackSiteData(): SiteData {
  const overrides = globalThis.__runtimeSiteDataOverrides || {};
  const theme = overrides.theme || {
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
    homepage: overrides.homepage || HOME_FALLBACK,
    contact: overrides.contact || CONTACT_FALLBACK,
    theme,
    categories: overrides.categories || DEFAULT_CATEGORIES.filter((c) => c.isActive),
    allCategories: overrides.allCategories || DEFAULT_CATEGORIES,
    projects: overrides.projects || DEFAULT_PROJECTS,
    services: overrides.services || DEFAULT_SERVICES,
    softwareTools: overrides.softwareTools || DEFAULT_SOFTWARE_TOOLS,
    workOptions: overrides.workOptions || DEFAULT_WORK_OPTIONS,
    sections:
      overrides.sections ||
      DEFAULT_SECTIONS.filter(
        (section) =>
          (section.sectionKey as string) !== "capabilities",
      ),
    carouselSettings: [],
    carouselGlobalSettings: overrides.carouselGlobalSettings || DEFAULT_CAROUSEL_GLOBAL_SETTINGS,
    carouselItems: overrides.carouselItems || DEFAULT_CAROUSEL_ITEMS,
  };
}

let cachedSiteData: { data: SiteData; expiresAt: number } | null = null;

export function invalidateSiteDataCache() {
  cachedSiteData = null;
}

export async function getSiteData(): Promise<SiteData> {
  try {
    await ensureDatabase();

    const [
      homeRows,
      contactRows,
      themeRows,
      categoryRows,
      projectRows,
      serviceRows,
      softwareToolRows,
      workRows,
      sectionRows,
      carouselRows,
      carouselGlobalRows,
      carouselItemRows,
    ] = await Promise.all([
      db.select().from(homepageSettings).limit(1),
      db.select().from(contactSettings).limit(1),
      db.select().from(themeSettings).limit(1),
      db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
      db
        .select()
        .from(projects)
        .where(eq(projects.published, true))
        .orderBy(asc(projects.sortOrder), desc(projects.id)),
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
      db.select().from(carouselSettings).orderBy(asc(carouselSettings.sortOrder), asc(carouselSettings.id)),
      db.select().from(carouselGlobalSettings).limit(1),
      db.select().from(carouselItems).orderBy(asc(carouselItems.sortOrder), asc(carouselItems.id)),
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

    const overrides = globalThis.__runtimeSiteDataOverrides || {};

    // Prioritize runtime overrides if modified by admin in this session
    const sourceProjects =
      overrides.projects && overrides.projects.length > 0
        ? overrides.projects
        : projectRows.length > 0
          ? projectRows
          : DEFAULT_PROJECTS;

    const publicProjects: PublicProject[] = sourceProjects
      .filter((p) => p.published !== false)
      .map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        categoryId: p.categoryId,
        categoryLabel: p.categoryLabel,
        aiLabType: p.aiLabType,
        year: p.year,
        software: p.software,
        tags: p.tags,
        externalLink: p.externalLink,
        videoUrl: p.videoUrl,
        videoSource: p.videoSource,
        thumbnailUrl: p.thumbnailUrl,
        aspectRatio: p.aspectRatio,
        displaySize: p.displaySize,
        displayWidth: p.displayWidth,
        displayHeight: p.displayHeight,
        width: p.width,
        height: p.height,
        durationSeconds: p.durationSeconds,
        featured: p.featured,
        published: p.published,
        demoStatus: p.demoStatus ?? "none",
        sortOrder: p.sortOrder,
        carouselEnabled: p.carouselEnabled !== false,
        carouselPinned: Boolean(p.carouselPinned),
        carouselOrder: p.carouselOrder ?? p.sortOrder,
      }));

    const finalCategories =
      overrides.allCategories ||
      (categoryRows.length > 0 ? categoryRows : DEFAULT_CATEGORIES);
    const finalServices =
      overrides.services ||
      (serviceRows.length > 0 ? serviceRows : DEFAULT_SERVICES);
    const finalTools =
      overrides.softwareTools ||
      (softwareToolRows.length > 0 ? softwareToolRows : DEFAULT_SOFTWARE_TOOLS);
    const finalWork =
      overrides.workOptions ||
      (workRows.length > 0 ? workRows : DEFAULT_WORK_OPTIONS);
    const finalSections =
      overrides.sections ||
      (sectionRows.length > 0 ? sectionRows : DEFAULT_SECTIONS);
    const finalCarousel =
      overrides.carouselSettings ||
      (carouselRows.length > 0 ? carouselRows : DEFAULT_CAROUSEL_SETTINGS);

    const finalCarouselGlobal: CarouselGlobalSettings =
      overrides.carouselGlobalSettings ||
      (carouselGlobalRows[0]
        ? {
            id: carouselGlobalRows[0].id,
            enabled: carouselGlobalRows[0].enabled !== false,
            sectionBadge: carouselGlobalRows[0].sectionBadge || "VIDEO SHOWCASE",
            sectionTitle: carouselGlobalRows[0].sectionTitle || "SELECTED WORKS",
            sectionSubtitle:
              carouselGlobalRows[0].sectionSubtitle ||
              "A curated showcase of video editing, motion design, and visual storytelling.",
            textColor: carouselGlobalRows[0].textColor || "black",
            autoplay: carouselGlobalRows[0].autoplay !== false,
            autoplaySpeed: carouselGlobalRows[0].autoplaySpeed || 5,
            infiniteLoop: carouselGlobalRows[0].infiniteLoop !== false,
            showArrows: carouselGlobalRows[0].showArrows !== false,
            showDots: carouselGlobalRows[0].showDots !== false,
            updatedAt: carouselGlobalRows[0].updatedAt || new Date(),
          }
        : DEFAULT_CAROUSEL_GLOBAL_SETTINGS);

    // ================================================================
    // BUILD CATEGORY-DRIVEN CAROUSEL
    // Each active category = one carousel slide, using project media
    // ================================================================
    const buildCarouselFromCategories = (
      cats: typeof finalCategories,
      pubs: PublicProject[],
    ): CarouselItem[] => {
      const activeCats = cats
        .filter((c) => c.isActive !== false)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

      const slides: CarouselItem[] = [];

      for (const cat of activeCats) {
        // Find all published projects in this category
        const catProjects = pubs.filter(
          (p) => p.published && (p.categoryId === cat.id || p.categoryLabel === cat.name),
        );

        if (catProjects.length === 0) {
          // Skip empty categories from the carousel
          continue;
        }

        // Pick best video: first project with a real video URL
        const projectWithVideo = catProjects.find((p) => p.videoUrl && p.videoUrl.trim());
        const videoUrl = projectWithVideo?.videoUrl ?? "";
        const videoSource = (projectWithVideo?.videoSource as "upload" | "url") ?? "url";
        const aspectRatio = (projectWithVideo?.aspectRatio as CarouselItem["aspectRatio"]) ?? "9:16";
        const dur = projectWithVideo?.durationSeconds
          ? `${Math.floor(projectWithVideo.durationSeconds / 60)}:${(projectWithVideo.durationSeconds % 60).toString().padStart(2, "0")}`
          : "0:30";

        // Pick best thumbnail: first project with thumbnail, else empty
        const thumbnailUrl =
          catProjects.find((p) => p.thumbnailUrl && p.thumbnailUrl.trim())?.thumbnailUrl ?? "";

        // Best description
        const description =
          cat.description ||
          catProjects.find((p) => p.description)?.description ||
          `${catProjects.length} project${catProjects.length !== 1 ? "s" : ""}`;

        slides.push({
          id: cat.id,
          title: cat.name.toUpperCase(),
          category: cat.name,
          description,
          duration: dur,
          videoUrl,
          videoSource,
          thumbnailUrl,
          aspectRatio,
          isActive: true,
          sortOrder: cat.sortOrder ?? slides.length,
          projectId: projectWithVideo?.id ?? null,
          createdAt: cat.createdAt,
          updatedAt: cat.updatedAt,
        });
      }

      return slides;
    };

    const finalCarouselItems = buildCarouselFromCategories(finalCategories, publicProjects);

    const result = {
      homepage,
      contact,
      theme,
      categories: finalCategories.filter((c) => c.isActive),
      allCategories: finalCategories,
      projects: publicProjects,
      services: finalServices,
      softwareTools: finalTools,
      workOptions: finalWork,
      sections: finalSections.filter((section) => (section.sectionKey as string) !== "capabilities"),
      carouselSettings: finalCarousel,
      carouselGlobalSettings: finalCarouselGlobal,
      carouselItems: finalCarouselItems,
    };

    return result;
  } catch (error) {
    console.error("[getSiteData] Database fetch notice, serving fallback site data:", error);
    return getFallbackSiteData();
  }
}

export async function getPublishedProject(id: number) {
  try {
    await ensureDatabase();
    const rows = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.published, true)))
      .limit(1);
    if (rows[0]) return rows[0];
  } catch (error) {
    console.error("[getPublishedProject] Error fetching project:", error);
  }

  const fallback = DEFAULT_PROJECTS.find((p) => p.id === id);
  return fallback ?? null;
}

