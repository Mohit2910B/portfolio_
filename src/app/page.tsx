import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  carouselItems,
  categories,
  contactSettings,
  creativeProcess,
  experience,
  homepageContent,
  layoutOrder,
  portfolioProjects,
  services,
  skills,
  themeSettings,
  toolsSoftware,
} from "@/db/schema";

import PublicPageClient from "@/components/public/PublicPageClient";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PROJECTS,
  DEFAULT_CONTENT,
  DEFAULT_SERVICES,
  DEFAULT_EXPERIENCE,
  DEFAULT_TOOLS,
  DEFAULT_PROCESS,
  DEFAULT_CONTACT,
} from "@/lib/defaultPortfolioData";
import { syncGoogleDriveFolders } from "@/lib/driveSync";

export const revalidate = 0; // Dynamic database data
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // 1. Fetch content, theme settings, and live Google Drive folders
  const [
    contentRows,
    contactRows,
    themeRows,
    layoutRows,
    projectRows,
    carouselRows,
    categoryRows,
    serviceRows,
    skillRows,
    toolRows,
    experienceRows,
    processRows,
    driveData,
  ] = await Promise.all([
    db.select().from(homepageContent).where(eq(homepageContent.id, 1)).limit(1).catch(() => []),
    db.select().from(contactSettings).where(eq(contactSettings.id, 1)).limit(1).catch(() => []),
    db.select().from(themeSettings).where(eq(themeSettings.id, 1)).limit(1).catch(() => []),
    db.select().from(layoutOrder).orderBy(asc(layoutOrder.sortOrder)).catch(() => []),
    db.select().from(portfolioProjects).where(eq(portfolioProjects.isPublished, true)).orderBy(asc(portfolioProjects.sortOrder), desc(portfolioProjects.id)).catch(() => []),
    db.select().from(carouselItems).where(eq(carouselItems.isPublished, true)).orderBy(asc(carouselItems.sortOrder), desc(carouselItems.id)).catch(() => []),
    db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder)).catch(() => []),
    db.select().from(services).where(eq(services.isActive, true)).orderBy(asc(services.sortOrder)).catch(() => []),
    db.select().from(skills).where(eq(skills.isActive, true)).orderBy(asc(skills.sortOrder)).catch(() => []),
    db.select().from(toolsSoftware).where(eq(toolsSoftware.isActive, true)).orderBy(asc(toolsSoftware.sortOrder)).catch(() => []),
    db.select().from(experience).where(eq(experience.isActive, true)).orderBy(asc(experience.sortOrder)).catch(() => []),
    db.select().from(creativeProcess).where(eq(creativeProcess.isActive, true)).orderBy(asc(creativeProcess.sortOrder)).catch(() => []),
    syncGoogleDriveFolders().catch(() => null),
  ]);

  const content = contentRows[0] || (DEFAULT_CONTENT as unknown as typeof contentRows[0]);
  const contact = contactRows[0] || undefined;
  const theme = themeRows[0] || { activeTheme: 1, accentColor: "#C8A66A", customConfigJson: "{}" };
  const sections = layoutRows.length > 0 ? layoutRows : [
    { sectionKey: "hero", label: "Hero", sortOrder: 1, isVisible: true },
    { sectionKey: "showreel", label: "Showreel", sortOrder: 2, isVisible: true },
    { sectionKey: "work", label: "Work", sortOrder: 3, isVisible: true },
    { sectionKey: "about", label: "About", sortOrder: 4, isVisible: true },
    { sectionKey: "experience", label: "Experience", sortOrder: 5, isVisible: true },
    { sectionKey: "services", label: "Services", sortOrder: 6, isVisible: true },
    { sectionKey: "skills", label: "Skills", sortOrder: 7, isVisible: true },
    { sectionKey: "tools", label: "Tools", sortOrder: 8, isVisible: true },
    { sectionKey: "process", label: "Process", sortOrder: 9, isVisible: true },
    { sectionKey: "contact", label: "Contact", sortOrder: 10, isVisible: true },
  ];

  let customConfig = {};
  try {
    if (theme.customConfigJson) {
      customConfig = JSON.parse(theme.customConfigJson);
    }
  } catch {}

  // Google Drive folders & videos automatically populate categories & portfolio!
  const activeCategories = (driveData && driveData.categories.length > 0)
    ? (driveData.categories as unknown as typeof categoryRows)
    : (categoryRows.length > 0 ? categoryRows : (DEFAULT_CATEGORIES as unknown as typeof categoryRows));

  const activeProjects = (driveData && driveData.projects.length > 0)
    ? (driveData.projects as unknown as typeof projectRows)
    : (projectRows.length > 0 ? projectRows : (DEFAULT_PROJECTS as unknown as typeof projectRows));

  const activeServices = serviceRows.length > 0 ? serviceRows : (DEFAULT_SERVICES as unknown as typeof serviceRows);
  const activeExperience = experienceRows.length > 0 ? experienceRows : (DEFAULT_EXPERIENCE as unknown as typeof experienceRows);
  const activeTools = toolRows.length > 0 ? toolRows : (DEFAULT_TOOLS as unknown as typeof toolRows);
  const activeProcess = processRows.length > 0 ? processRows : (DEFAULT_PROCESS as unknown as typeof processRows);
  const activeContact = contactRows[0] || (DEFAULT_CONTACT as unknown as typeof contactRows[0]);

  return (
    <PublicPageClient
      content={content}
      contact={activeContact}
      activeTheme={theme.activeTheme || 1}
      customThemeConfig={customConfig}
      layoutOrder={sections}
      projects={activeProjects}
      carouselItems={carouselRows.length > 0 ? carouselRows : activeProjects}
      categories={activeCategories}
      services={activeServices}
      skills={skillRows}
      tools={activeTools}
      experience={activeExperience}
      creativeProcess={activeProcess}
    />
  );
}
