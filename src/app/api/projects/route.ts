import { and, asc, desc, eq } from "drizzle-orm";
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

    const conditions = [];

    if (publishedOnly) {
      conditions.push(eq(portfolioProjects.isPublished, true));
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
          createdAt: portfolioProjects.createdAt,
          updatedAt: portfolioProjects.updatedAt,
        })
        .from(portfolioProjects)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(portfolioProjects.sortOrder), desc(portfolioProjects.id));
    } catch {
      projects = [];
    }

    if (projects.length === 0) {
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

    const inserted = await db
      .insert(portfolioProjects)
      .values({
        title,
        description: (body.description || "").toString(),
        categoryId: body.categoryId ? Number(body.categoryId) : null,
        categoryLabel: (body.categoryLabel || "").toString(),
        year: body.year ? Number(body.year) : 2026,
        software: (body.software || "").toString(),
        tags: (body.tags || "").toString(),
        externalUrl: (body.externalUrl || "").toString(),
        videoUrl: (body.videoUrl || "").toString(),
        thumbnailUrl: (body.thumbnailUrl || "").toString(),
        aspectRatio: (body.aspectRatio || "16:9").toString(),
        displaySize: (body.displaySize || "medium").toString(),
        isFeatured: Boolean(body.isFeatured),
        isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : true,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : nextSortOrder,
      })
      .returning();

    revalidatePath("/");
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

    const updated = await db
      .update(portfolioProjects)
      .set({
        title,
        description: (body.description || "").toString(),
        categoryId: body.categoryId ? Number(body.categoryId) : null,
        categoryLabel: (body.categoryLabel || "").toString(),
        year: body.year ? Number(body.year) : 2026,
        software: (body.software || "").toString(),
        tags: (body.tags || "").toString(),
        externalUrl: (body.externalUrl || "").toString(),
        videoUrl: (body.videoUrl || "").toString(),
        thumbnailUrl: (body.thumbnailUrl || "").toString(),
        aspectRatio: (body.aspectRatio || "16:9").toString(),
        displaySize: (body.displaySize || "medium").toString(),
        isFeatured: Boolean(body.isFeatured),
        isPublished: Boolean(body.isPublished),
        sortOrder: Number(body.sortOrder ?? 0),
        updatedAt: new Date(),
      })
      .where(eq(portfolioProjects.id, id))
      .returning();

    if (!updated.length) return notFound("Project not found.");

    revalidatePath("/");
    return ok({ project: updated[0] });
  });
}

export async function DELETE(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id) return badRequest("Project ID is required.");

    const deleted = await db
      .delete(portfolioProjects)
      .where(eq(portfolioProjects.id, id))
      .returning();

    if (!deleted.length) return notFound("Project not found.");

    revalidatePath("/");
    return ok({ success: true, deleted: deleted[0] });
  });
}
