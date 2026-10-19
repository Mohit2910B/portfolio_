import { and, asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { carouselItems } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { badRequest, guard, notFound, ok } from "@/lib/http";

import { portfolioProjects } from "@/db/schema";
import { isNull } from "drizzle-orm";

export async function GET(req: Request) {
  return guard(async () => {
    const { searchParams } = new URL(req.url);
    const publishedOnly = searchParams.get("all") !== "true";

    let items = await db
      .select()
      .from(carouselItems)
      .where(publishedOnly ? eq(carouselItems.isPublished, true) : undefined)
      .orderBy(asc(carouselItems.sortOrder), desc(carouselItems.id))
      .catch(() => []);

    // If carousel table is empty in DB, auto-populate from active portfolio projects
    if (items.length === 0) {
      try {
        const projects = await db
          .select()
          .from(portfolioProjects)
          .where(and(eq(portfolioProjects.isPublished, true), isNull(portfolioProjects.deletedAt)))
          .orderBy(asc(portfolioProjects.sortOrder), desc(portfolioProjects.id))
          .catch(() => []);

        if (projects.length > 0) {
          const toInsert = projects.map((p, idx) => ({
            projectId: p.id,
            title: p.title,
            category: p.categoryLabel || "Selected Work",
            badge: p.isFeatured ? "FEATURED REEL" : "CINEMATIC 4K",
            videoUrl: p.videoUrl || "",
            thumbnailUrl: p.thumbnailUrl || "",
            duration: "01:00",
            aspectRatio: p.aspectRatio || "16:9",
            description: p.description || "",
            sortOrder: idx + 1,
            isPublished: true,
          }));

          const inserted = await db.insert(carouselItems).values(toInsert).returning().catch(() => []);
          if (inserted.length > 0) {
            items = inserted as any;
          }
        }
      } catch (e) {
        console.warn("[carousel auto-populate error]:", e);
      }
    }

    return ok({ items });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));

    const title = (body.title || "").toString().trim();
    if (!title) return badRequest("Title is required.");

    const existing = await db
      .select({ sortOrder: carouselItems.sortOrder })
      .from(carouselItems)
      .orderBy(desc(carouselItems.sortOrder))
      .limit(1);

    const nextSortOrder = (existing[0]?.sortOrder ?? 0) + 1;

    const inserted = await db
      .insert(carouselItems)
      .values({
        projectId: body.projectId ? Number(body.projectId) : null,
        title,
        category: (body.category || "").toString(),
        badge: (body.badge || "").toString(),
        videoUrl: (body.videoUrl || "").toString(),
        thumbnailUrl: (body.thumbnailUrl || "").toString(),
        duration: (body.duration || "").toString(),
        aspectRatio: (body.aspectRatio || "16:9").toString(),
        description: (body.description || "").toString(),
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : nextSortOrder,
        isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : true,
      })
      .returning();

    revalidatePath("/");
    return ok({ item: inserted[0] });
  });
}

export async function PUT(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));

    const id = Number(body.id);
    if (!id) return badRequest("Carousel Item ID is required.");

    const title = (body.title || "").toString().trim();
    if (!title) return badRequest("Title is required.");

    const updated = await db
      .update(carouselItems)
      .set({
        projectId: body.projectId ? Number(body.projectId) : null,
        title,
        category: (body.category || "").toString(),
        badge: (body.badge || "").toString(),
        videoUrl: (body.videoUrl || "").toString(),
        thumbnailUrl: (body.thumbnailUrl || "").toString(),
        duration: (body.duration || "").toString(),
        aspectRatio: (body.aspectRatio || "16:9").toString(),
        description: (body.description || "").toString(),
        sortOrder: Number(body.sortOrder ?? 0),
        isPublished: Boolean(body.isPublished),
        updatedAt: new Date(),
      })
      .where(eq(carouselItems.id, id))
      .returning();

    if (!updated.length) return notFound("Carousel item not found.");

    revalidatePath("/");
    return ok({ item: updated[0] });
  });
}

export async function DELETE(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id) return badRequest("Carousel Item ID is required.");

    const deleted = await db
      .delete(carouselItems)
      .where(eq(carouselItems.id, id))
      .returning();

    if (!deleted.length) return notFound("Carousel item not found.");

    revalidatePath("/");
    return ok({ success: true, deleted: deleted[0] });
  });
}
