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
import { ensureDatabase } from "@/lib/bootstrap";

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
  reelUrl: "",
  aboutIntro: "",
  aboutExperience: "",
  aboutFocus: "",
  aboutWorkflow: "",
  aboutTools: "",
  aboutStrengths: "",
  footerNote: "",
};

export const CONTACT_FALLBACK = {
  email: "",
  countryCode: "+91",
  phone: "",
  whatsapp: "",
  location: "",
  instagram: "",
  youtube: "",
  linkedin: "",
  responseTime: "",
};

export async function getSiteData() {
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

  const publicProjects: PublicProject[] = projectRows.map((p) => ({
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

  return {
    homepage,
    contact,
    theme,
    categories: categoryRows.filter((c) => c.isActive),
    allCategories: categoryRows,
    projects: publicProjects,
    services: serviceRows,
    softwareTools: softwareToolRows,
    workOptions: workRows,
    sections: sectionRows.filter((section) => section.sectionKey !== "capabilities"),
    carouselSettings: carouselRows,
  };
}

export async function getPublishedProject(id: number) {
  await ensureDatabase();
  const rows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.published, true)))
    .limit(1);
  return rows[0] ?? null;
}
