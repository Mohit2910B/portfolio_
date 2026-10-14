import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { badRequest, guard, notFound, ok, slugify } from "@/lib/http";

import { DEFAULT_CATEGORIES } from "@/lib/defaultPortfolioData";

export async function GET() {
  return guard(async () => {
    let list: any[] = [];
    try {
      list = await db
        .select()
        .from(categories)
        .orderBy(asc(categories.sortOrder), asc(categories.id));
    } catch {
      list = [];
    }

    if (list.length === 0) {
      return ok({ categories: DEFAULT_CATEGORIES });
    }

    return ok({ categories: list });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));

    const name = (body.name || "").toString().trim();
    if (!name) return badRequest("Category name is required.");

    const slug = (body.slug || slugify(name)).toString().trim();

    const inserted = await db
      .insert(categories)
      .values({
        name,
        slug,
        description: (body.description || "").toString(),
        sortOrder: body.sortOrder ? Number(body.sortOrder) : 0,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      })
      .returning();

    return ok({ category: inserted[0] });
  });
}

export async function PUT(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));

    const id = Number(body.id);
    if (!id) return badRequest("Category ID is required.");

    const name = (body.name || "").toString().trim();
    if (!name) return badRequest("Name is required.");

    const updated = await db
      .update(categories)
      .set({
        name,
        slug: (body.slug || slugify(name)).toString(),
        description: (body.description || "").toString(),
        sortOrder: Number(body.sortOrder ?? 0),
        isActive: Boolean(body.isActive),
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();

    if (!updated.length) return notFound("Category not found.");

    return ok({ category: updated[0] });
  });
}

export async function DELETE(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id) return badRequest("Category ID is required.");

    const deleted = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();

    if (!deleted.length) return notFound("Category not found.");

    return ok({ success: true, deleted: deleted[0] });
  });
}
