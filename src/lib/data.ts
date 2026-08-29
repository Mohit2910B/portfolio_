import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
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
  videoUrl: string;
  videoSource: string;
  thumbnailUrl: string;
  aspectRatio: string;
  displaySize: string;
  displayWidth: number | null;
  displayHeight: number | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  featured: boolean;
  demoStatus: string;
  sortOrder: number;
};

export type SiteData = Awaited<ReturnType<typeof getSiteData>>;

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

export const DEFAULT_CATEGORIES = CATEGORY_SEED.map(([name, description], index) => ({
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
  demoStatus: p.demoStatus,
  sortOrder: index,
}));

export const DEFAULT_SERVICES = SERVICE_SEED.map((s, index) => ({
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

export const DEFAULT_SOFTWARE_TOOLS = SOFTWARE_TOOL_SEED.map(
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

export const DEFAULT_WORK_OPTIONS = WORK_OPTION_SEED.map((label, index) => ({
  id: index + 1,
  label,
  value: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  sortOrder: index,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

export const DEFAULT_SECTIONS = SECTION_SEED.map(([sectionKey, label], index) => ({
  id: index + 1,
  sectionKey,
  label,
  sortOrder: index,
  isVisible: true,
  updatedAt: new Date(),
}));

export const DEFAULT_CAROUSEL_SETTINGS = DEFAULT_CATEGORIES.map((category, index) => ({
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

function getFallbackSiteData() {
  const theme = {
    id: 1,
    accent: "#e0147f",
    glassOpacity: 45,
    glassBlur: 20,
    grain: true,
    updatedAt: new Date(),
  };

  return {
    homepage: HOME_FALLBACK,
    contact: CONTACT_FALLBACK,
    theme,
    categories: DEFAULT_CATEGORIES.filter((c) => c.isActive),
    allCategories: DEFAULT_CATEGORIES,
    projects: DEFAULT_PROJECTS,
    services: DEFAULT_SERVICES,
    softwareTools: DEFAULT_SOFTWARE_TOOLS,
    workOptions: DEFAULT_WORK_OPTIONS,
    sections: DEFAULT_SECTIONS.filter((section) => (section.sectionKey as string) !== "capabilities"),
    carouselSettings: DEFAULT_CAROUSEL_SETTINGS,
  };
}

export async function getSiteData() {
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
    ]);

    const homepage = { ...HOME_FALLBACK, ...(homeRows[0] ?? {}) };
    const contact = { ...CONTACT_FALLBACK, ...(contactRows[0] ?? {}) };
    const theme = themeRows[0] ?? {
      id: 1,
      accent: "#e0147f",
      glassOpacity: 45,
      glassBlur: 20,
      grain: true,
      updatedAt: new Date(),
    };

    const sourceProjects = projectRows.length > 0 ? projectRows : DEFAULT_PROJECTS;
    const publicProjects: PublicProject[] = sourceProjects.map((p) => ({
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
      demoStatus: p.demoStatus,
      sortOrder: p.sortOrder,
    }));

    const finalCategories = categoryRows.length > 0 ? categoryRows : DEFAULT_CATEGORIES;
    const finalServices = serviceRows.length > 0 ? serviceRows : DEFAULT_SERVICES;
    const finalTools = softwareToolRows.length > 0 ? softwareToolRows : DEFAULT_SOFTWARE_TOOLS;
    const finalWork = workRows.length > 0 ? workRows : DEFAULT_WORK_OPTIONS;
    const finalSections = sectionRows.length > 0 ? sectionRows : DEFAULT_SECTIONS;
    const finalCarousel = carouselRows.length > 0 ? carouselRows : DEFAULT_CAROUSEL_SETTINGS;

    return {
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
    };
  } catch (error) {
    console.error("[getSiteData] Database fetch failed, serving default site data:", error);
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

