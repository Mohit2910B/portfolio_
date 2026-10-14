import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  carouselItems,
  chatConversations,
  enquiries,
  mediaFiles,
  portfolioProjects,
  services,
  skills,
  toolsSoftware,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { guard, ok } from "@/lib/http";

export async function GET() {
  return guard(async () => {
    await requireAdmin();

    const [
      totalProjectsRes,
      publishedProjectsRes,
      featuredProjectsRes,
      carouselRes,
      mediaRes,
      servicesRes,
      skillsRes,
      toolsRes,
      unreadEnquiriesRes,
      chatConversationsRes,
    ] = await Promise.all([
      db.select({ value: count() }).from(portfolioProjects),
      db.select({ value: count() }).from(portfolioProjects).where(eq(portfolioProjects.isPublished, true)),
      db.select({ value: count() }).from(portfolioProjects).where(eq(portfolioProjects.isFeatured, true)),
      db.select({ value: count() }).from(carouselItems),
      db.select({ value: count() }).from(mediaFiles),
      db.select({ value: count() }).from(services),
      db.select({ value: count() }).from(skills),
      db.select({ value: count() }).from(toolsSoftware),
      db.select({ value: count() }).from(enquiries).where(eq(enquiries.status, "new")),
      db.select({ value: count() }).from(chatConversations),
    ]);

    return ok({
      stats: {
        totalProjects: Number(totalProjectsRes[0]?.value ?? 0),
        publishedProjects: Number(publishedProjectsRes[0]?.value ?? 0),
        featuredProjects: Number(featuredProjectsRes[0]?.value ?? 0),
        carouselItems: Number(carouselRes[0]?.value ?? 0),
        mediaFiles: Number(mediaRes[0]?.value ?? 0),
        servicesCount: Number(servicesRes[0]?.value ?? 0),
        skillsCount: Number(skillsRes[0]?.value ?? 0),
        toolsCount: Number(toolsRes[0]?.value ?? 0),
        unreadEnquiries: Number(unreadEnquiriesRes[0]?.value ?? 0),
        chatConversations: Number(chatConversationsRes[0]?.value ?? 0),
      },
    });
  });
}
