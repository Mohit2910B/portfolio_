import { and, count, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  carouselItems,
  categories,
  chatConversations,
  driveSyncState,
  enquiries,
  mediaFiles,
  portfolioProjects,
  services,
  skills,
  toolsSoftware,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { guard, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return guard(async () => {
    await requireAdmin();

    const [
      totalProjectsRes,
      totalVideosRes,
      totalCategoriesRes,
      publishedVideosRes,
      unpublishedDraftsRes,
      trashCategoriesRes,
      trashVideosRes,
      syncedDriveFilesRes,
      replacedHqVideosRes,
      featuredProjectsRes,
      carouselRes,
      mediaRes,
      servicesRes,
      skillsRes,
      toolsRes,
      unreadEnquiriesRes,
      chatConversationsRes,
      syncStateRows,
    ] = await Promise.all([
      // Total active portfolio projects
      db.select({ value: count() }).from(portfolioProjects).where(isNull(portfolioProjects.deletedAt)).catch(() => [{ value: 0 }]),
      // Total active videos
      db.select({ value: count() }).from(portfolioProjects).where(and(isNull(portfolioProjects.deletedAt), sql`${portfolioProjects.videoUrl} != ''`)).catch(() => [{ value: 0 }]),
      // Total active categories
      db.select({ value: count() }).from(categories).where(and(isNull(categories.deletedAt), eq(categories.isActive, true))).catch(() => [{ value: 0 }]),
      // Published videos
      db.select({ value: count() }).from(portfolioProjects).where(and(isNull(portfolioProjects.deletedAt), eq(portfolioProjects.isPublished, true))).catch(() => [{ value: 0 }]),
      // Unpublished / draft videos
      db.select({ value: count() }).from(portfolioProjects).where(and(isNull(portfolioProjects.deletedAt), eq(portfolioProjects.isPublished, false))).catch(() => [{ value: 0 }]),
      // Deleted categories in Trash
      db.select({ value: count() }).from(categories).where(isNotNull(categories.deletedAt)).catch(() => [{ value: 0 }]),
      // Deleted videos in Trash
      db.select({ value: count() }).from(portfolioProjects).where(isNotNull(portfolioProjects.deletedAt)).catch(() => [{ value: 0 }]),
      // Successfully synchronized Drive files
      db.select({ value: count() }).from(portfolioProjects).where(and(isNull(portfolioProjects.deletedAt), isNotNull(portfolioProjects.driveFileId))).catch(() => [{ value: 0 }]),
      // Replaced HQ videos
      db.select({ value: count() }).from(portfolioProjects).where(and(isNull(portfolioProjects.deletedAt), eq(portfolioProjects.isReplacement, true))).catch(() => [{ value: 0 }]),
      // Featured projects
      db.select({ value: count() }).from(portfolioProjects).where(and(isNull(portfolioProjects.deletedAt), eq(portfolioProjects.isFeatured, true))).catch(() => [{ value: 0 }]),
      // Showreel carousel items
      db.select({ value: count() }).from(carouselItems).catch(() => [{ value: 0 }]),
      // Uploaded media files
      db.select({ value: count() }).from(mediaFiles).catch(() => [{ value: 0 }]),
      // Services count
      db.select({ value: count() }).from(services).where(eq(services.isActive, true)).catch(() => [{ value: 0 }]),
      // Skills count
      db.select({ value: count() }).from(skills).catch(() => [{ value: 0 }]),
      // Tools count
      db.select({ value: count() }).from(toolsSoftware).catch(() => [{ value: 0 }]),
      // Unread enquiries
      db.select({ value: count() }).from(enquiries).where(eq(enquiries.status, "new")).catch(() => [{ value: 0 }]),
      // Chat conversations
      db.select({ value: count() }).from(chatConversations).catch(() => [{ value: 0 }]),
      // Latest drive sync state
      db.select().from(driveSyncState).orderBy(desc(driveSyncState.id)).limit(1).catch(() => []),
    ]);

    const latestSync = syncStateRows[0] || null;

    return ok({
      stats: {
        totalProjects: Number(totalProjectsRes[0]?.value ?? 0),
        publishedProjects: Number(publishedVideosRes[0]?.value ?? 0),
        totalVideos: Number(totalVideosRes[0]?.value ?? 0),
        totalCategories: Number(totalCategoriesRes[0]?.value ?? 0),
        publishedVideos: Number(publishedVideosRes[0]?.value ?? 0),
        unpublishedDrafts: Number(unpublishedDraftsRes[0]?.value ?? 0),
        trashCategories: Number(trashCategoriesRes[0]?.value ?? 0),
        trashVideos: Number(trashVideosRes[0]?.value ?? 0),
        syncedDriveFiles: Number(syncedDriveFilesRes[0]?.value ?? 0),
        replacedHqVideos: Number(replacedHqVideosRes[0]?.value ?? 0),
        featuredProjects: Number(featuredProjectsRes[0]?.value ?? 0),
        carouselItems: Number(carouselRes[0]?.value ?? 0),
        mediaFiles: Number(mediaRes[0]?.value ?? 0),
        servicesCount: Number(servicesRes[0]?.value ?? 0),
        skillsCount: Number(skillsRes[0]?.value ?? 0),
        toolsCount: Number(toolsRes[0]?.value ?? 0),
        unreadEnquiries: Number(unreadEnquiriesRes[0]?.value ?? 0),
        chatConversations: Number(chatConversationsRes[0]?.value ?? 0),
        lastSyncTime: latestSync?.lastSyncCompletedAt
          ? new Date(latestSync.lastSyncCompletedAt).toISOString()
          : null,
        syncStatus: latestSync?.status || "idle",
        syncErrors: latestSync?.lastError || null,
        totalDriveFilesScanned: latestSync?.totalDriveFiles ?? 0,
      },
    });
  });
}
