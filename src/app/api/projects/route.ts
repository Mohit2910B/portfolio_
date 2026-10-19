import { and, asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { categories, portfolioProjects } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { badRequest, guard, notFound, ok } from "@/lib/http";
import { DEFAULT_PROJECTS } from "@/lib/defaultPortfolioData";

export async function GET(req: Request) {
  return guard(async () => {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("category");
    const featuredOnly = searchParams.get("featured") === "true";
    const publishedOnly = searchParams.get("all") !== "true"; // Default to published for public
    const trashOnly = searchParams.get("trash") === "true";

    const conditions = [];

    if (trashOnly) {
      conditions.push(isNotNull(portfolioProjects.deletedAt));
    } else {
      conditions.push(isNull(portfolioProjects.deletedAt));
      if (publishedOnly) {
        conditions.push(eq(portfolioProjects.isPublished, true));
      }
    }

    if (featuredOnly) {
      conditions.push(eq(portfolioProjects.isFeatured, true));
    }

    if (categorySlug && categorySlug !== "all") {
      const catRows = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, categorySlug))
        .limit(1);

      if (catRows.length > 0) {
        conditions.push(eq(portfolioProjects.categoryId, catRows[0].id));
      }
    }

    let projects: any[] = [];
    try {
      projects = await db
        .select({
          id: portfolioProjects.id,
          title: portfolioProjects.title,
          description: portfolioProjects.description,
          categoryId: portfolioProjects.categoryId,
          categoryLabel: portfolioProjects.categoryLabel,
          year: portfolioProjects.year,
          software: portfolioProjects.software,
          tags: portfolioProjects.tags,
          externalUrl: portfolioProjects.externalUrl,
          videoUrl: portfolioProjects.videoUrl,
          thumbnailUrl: portfolioProjects.thumbnailUrl,
          aspectRatio: portfolioProjects.aspectRatio,
          displaySize: portfolioProjects.displaySize,
          isFeatured: portfolioProjects.isFeatured,
          isPublished: portfolioProjects.isPublished,
          sortOrder: portfolioProjects.sortOrder,
          driveFileId: portfolioProjects.driveFileId,
          driveFolderId: portfolioProjects.driveFolderId,
          isReplacement: portfolioProjects.isReplacement,
          fileSize: portfolioProjects.fileSize,
          mimeType: portfolioProjects.mimeType,
          deletedAt: portfolioProjects.deletedAt,
          lastSyncedAt: portfolioProjects.lastSyncedAt,
          createdAt: portfolioProjects.createdAt,
          updatedAt: portfolioProjects.updatedAt,
        })
        .from(portfolioProjects)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(portfolioProjects.sortOrder), desc(portfolioProjects.id));
    } catch {
      projects = [];
    }

    if (projects.length === 0 && !trashOnly) {
      let fallback = DEFAULT_PROJECTS;
      if (categorySlug && categorySlug !== "all") {
        fallback = fallback.filter(
          (p) =>
            (p.categoryLabel || p.category || "").toLowerCase() === categorySlug.toLowerCase() ||
            (p.categoryLabel || p.category || "").toLowerCase().replace(/\s+/g, "-") === categorySlug.toLowerCase()
        );
      }
      return ok({ projects: fallback });
    }

    return ok({ projects });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));

    // Handle Restoration of Deleted Project
    if (body.action === "restore") {
      const id = Number(body.id);
      if (!id) return badRequest("Project ID is required to restore.");

      const updated = await db
        .update(portfolioProjects)
        .set({ deletedAt: null, updatedAt: new Date() })
        .where(eq(portfolioProjects.id, id))
        .returning();

      if (!updated.length) return notFound("Project not found in Trash.");

      revalidatePath("/");
      revalidatePath("/admin/portfolio");
      return ok({ success: true, message: "Project restored successfully", project: updated[0] });
    }

    const title = (body.title || "").toString().trim();
    if (!title) {
      return badRequest("Title is required.");
    }

    // Get max sort_order
    const existing = await db
      .select({ sortOrder: portfolioProjects.sortOrder })
      .from(portfolioProjects)
      .orderBy(desc(portfolioProjects.sortOrder))
      .limit(1);

    const nextSortOrder = (existing[0]?.sortOrder ?? 0) + 1;

    // Determine categoryLabel if categoryId given
    let categoryLabel = (body.categoryLabel || "").toString();
    if (body.categoryId && !categoryLabel) {
      const cat = await db.select({ name: categories.name }).from(categories).where(eq(categories.id, Number(body.categoryId))).limit(1);
      if (cat.length > 0) categoryLabel = cat[0].name;
    }

    const inserted = await db
      .insert(portfolioProjects)
      .values({
        title,
        description: (body.description || "").toString(),
        categoryId: body.categoryId ? Number(body.categoryId) : null,
        categoryLabel,
        year: body.year ? Number(body.year) : 2026,
        software: (body.software || "").toString(),
        tags: (body.tags || "").toString(),
        externalUrl: (body.externalUrl || "").toString(),
        videoUrl: (body.videoUrl || "").toString(),
        thumbnailUrl: (body.thumbnailUrl || "").toString(),
        aspectRatio: (body.aspectRatio || "9:16").toString(),
        displaySize: (body.displaySize || "medium").toString(),
        isFeatured: Boolean(body.isFeatured),
        isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : true,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : nextSortOrder,
        driveFileId: body.driveFileId || null,
        driveFolderId: body.driveFolderId || null,
        isReplacement: Boolean(body.isReplacement),
        fileSize: body.fileSize ? Number(body.fileSize) : 0,
        mimeType: body.mimeType || "video/mp4",
        deletedAt: null,
      })
      .returning();

    revalidatePath("/");
    revalidatePath("/admin/portfolio");
    return ok({ project: inserted[0] });
  });
}

export async function PUT(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));

    const id = Number(body.id);
    if (!id) return badRequest("Project ID is required.");

    const title = (body.title || "").toString().trim();
    if (!title) return badRequest("Title is required.");

    // Look up existing project to preserve fields not explicitly edited
    const existing = await db
      .select()
      .from(portfolioProjects)
      .where(eq(portfolioProjects.id, id))
      .limit(1);

    if (!existing.length) return notFound("Project not found.");
    const prev = existing[0];

    // Determine categoryLabel
    let categoryLabel = body.categoryLabel !== undefined ? String(body.categoryLabel) : prev.categoryLabel;
    if (body.categoryId && body.categoryId !== prev.categoryId && !body.categoryLabel) {
      const cat = await db.select({ name: categories.name }).from(categories).where(eq(categories.id, Number(body.categoryId))).limit(1);
      if (cat.length > 0) categoryLabel = cat[0].name;
    }

    const videoUrl = body.videoUrl !== undefined ? String(body.videoUrl).trim() : prev.videoUrl;
    const isReplacement = body.isReplacement !== undefined ? Boolean(body.isReplacement) : (videoUrl !== prev.videoUrl ? true : prev.isReplacement);

    const updated = await db
      .update(portfolioProjects)
      .set({
        title,
        description: body.description !== undefined ? String(body.description) : prev.description,
        categoryId: body.categoryId !== undefined ? (body.categoryId ? Number(body.categoryId) : null) : prev.categoryId,
        categoryLabel,
        year: body.year !== undefined ? Number(body.year) : prev.year,
        software: body.software !== undefined ? String(body.software) : prev.software,
        tags: body.tags !== undefined ? String(body.tags) : prev.tags,
        externalUrl: body.externalUrl !== undefined ? String(body.externalUrl) : prev.externalUrl,
        videoUrl,
        thumbnailUrl: body.thumbnailUrl !== undefined ? String(body.thumbnailUrl) : prev.thumbnailUrl,
        aspectRatio: body.aspectRatio !== undefined ? String(body.aspectRatio) : prev.aspectRatio,
        displaySize: body.displaySize !== undefined ? String(body.displaySize) : prev.displaySize,
        isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : prev.isFeatured,
        isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : prev.isPublished,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : prev.sortOrder,
        isReplacement,
        updatedAt: new Date(),
      })
      .where(eq(portfolioProjects.id, id))
      .returning();

    revalidatePath("/");
    revalidatePath("/admin/portfolio");
    return ok({ project: updated[0] });
  });
}

export async function DELETE(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    const isPermanent = searchParams.get("permanent") === "true";

    if (!id) return badRequest("Project ID is required.");

    if (isPermanent) {
      // Explicit permanent delete
      const deleted = await db
        .delete(portfolioProjects)
        .where(eq(portfolioProjects.id, id))
        .returning();

      if (!deleted.length) return notFound("Project not found.");

      revalidatePath("/");
      revalidatePath("/admin/portfolio");
      return ok({ success: true, permanent: true, deleted: deleted[0] });
    }

    // Soft delete (Move to Trash)
    const softDeleted = await db
      .update(portfolioProjects)
      .set({ deletedAt: new Date(), isPublished: false, updatedAt: new Date() })
      .where(eq(portfolioProjects.id, id))
      .returning();

    if (!softDeleted.length) return notFound("Project not found.");

    revalidatePath("/");
    revalidatePath("/admin/portfolio");
    return ok({ success: true, softDeleted: true, message: "Project moved to Trash.", project: softDeleted[0] });
  });
}
