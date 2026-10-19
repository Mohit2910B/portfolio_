import { and, asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { categories, portfolioProjects } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { badRequest, guard, notFound, ok, slugify } from "@/lib/http";
import {
  getActiveCategories,
  getTrashCategories,
  permanentlyDeleteCategory,
  restoreCategoryFromTrash,
  softDeleteCategory,
} from "@/lib/categoryManager";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return guard(async () => {
    const { searchParams } = new URL(req.url);
    const includeTrash = searchParams.get("includeTrash") === "true" || searchParams.get("trash") === "true";

    // 1. Fetch active categories
    const activeList = await getActiveCategories();

    // 2. Compute live video counts for each category
    const videoCounts = await db
      .select({
        categoryId: portfolioProjects.categoryId,
        count: sql<number>`count(*)`,
      })
      .from(portfolioProjects)
      .where(and(isNull(portfolioProjects.deletedAt), eq(portfolioProjects.isPublished, true)))
      .groupBy(portfolioProjects.categoryId)
      .catch(() => []);

    const countMap: Record<number, number> = {};
    for (const vc of videoCounts) {
      if (vc.categoryId) {
        countMap[vc.categoryId] = Number(vc.count);
      }
    }

    const categoriesWithCount = activeList.map((cat) => ({
      ...cat,
      videoCount: countMap[cat.id] || 0,
    }));

    // 3. Fetch trash categories if requested
    let trashList: any[] = [];
    if (includeTrash) {
      trashList = await getTrashCategories();
    }

    return ok({
      categories: categoriesWithCount,
      deletedCategories: trashList,
      totalActive: categoriesWithCount.length,
      totalTrash: trashList.length,
    });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));

    // Handle Restoration of Deleted Categories
    if (body.action === "restore") {
      const target = body.id || body.slug;
      if (!target) return badRequest("Category ID or slug is required to restore.");

      const result = await restoreCategoryFromTrash(target);
      if (!result.success) {
        return notFound("Category not found in Trash or already active.");
      }

      revalidatePath("/");
      revalidatePath("/admin/categories");
      return ok({ success: true, message: "Category restored successfully", category: result.category });
    }

    const name = (body.name || "").toString().trim();
    if (!name) return badRequest("Category name is required.");

    const slug = (body.slug || slugify(name)).toString().trim();

    // Check if category with this slug already exists
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      const existingCat = existing[0];
      // If it's in Trash, restore it with the new name!
      if (existingCat.deletedAt) {
        await restoreCategoryFromTrash(existingCat.id);
        const updated = await db
          .update(categories)
          .set({ name, description: (body.description || "").toString(), updatedAt: new Date() })
          .where(eq(categories.id, existingCat.id))
          .returning();

        revalidatePath("/");
        revalidatePath("/admin/categories");
        return ok({ category: updated[0], restoredFromTrash: true });
      }

      return badRequest(`A category with slug "${slug}" already exists.`);
    }

    // Get max sortOrder
    const maxSort = await db
      .select({ max: sql<number>`COALESCE(MAX(${categories.sortOrder}), 0)` })
      .from(categories);
    const nextSort = Number(maxSort[0]?.max ?? 0) + 1;

    const inserted = await db
      .insert(categories)
      .values({
        name,
        slug,
        description: (body.description || "").toString(),
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : nextSort,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        driveFolderId: body.driveFolderId || null,
        deletedAt: null,
      })
      .returning();

    revalidatePath("/");
    revalidatePath("/admin/categories");
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

    const slug = (body.slug || slugify(name)).toString().trim();

    // Check slug collision with another category
    const existingSlug = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.slug, slug), sql`${categories.id} != ${id}`))
      .limit(1);

    if (existingSlug.length > 0) {
      return badRequest(`Slug "${slug}" is already used by another category.`);
    }

    const updated = await db
      .update(categories)
      .set({
        name,
        slug,
        description: (body.description || "").toString(),
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();

    if (!updated.length) return notFound("Category not found.");

    // Update categoryLabel on associated projects
    await db
      .update(portfolioProjects)
      .set({ categoryLabel: name })
      .where(eq(portfolioProjects.categoryId, id));

    revalidatePath("/");
    revalidatePath("/admin/categories");
    return ok({ category: updated[0] });
  });
}

export async function DELETE(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const { searchParams } = new URL(req.url);

    let id = searchParams.get("id");
    let slug = searchParams.get("slug");
    const isPermanent = searchParams.get("permanent") === "true";

    // Also parse JSON body if provided
    if (!id && !slug) {
      try {
        const body = await req.json().catch(() => ({}));
        if (body.id) id = String(body.id);
        if (body.slug) slug = body.slug;
      } catch {}
    }

    if (!id && !slug) {
      return badRequest("Category ID or slug is required for deletion.");
    }

    // 1. Explicit Permanent Delete
    if (isPermanent && id) {
      const result = await permanentlyDeleteCategory(Number(id));
      if (!result.success) return notFound("Category not found.");
      return ok({
        success: true,
        permanent: true,
        message: "Category permanently deleted from database.",
      });
    }

    // 2. Soft-delete (Move to Trash)
    const result = await softDeleteCategory(id ? Number(id) : slug!);
    if (!result.success) {
      return notFound("Category not found or already in Trash.");
    }

    return ok({
      success: true,
      softDeleted: true,
      message: `Category moved to Trash. You can restore it anytime.`,
      category: result.category,
    });
  });
}
