import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { badRequest, guard, notFound, ok, slugify } from "@/lib/http";
import { DEFAULT_CATEGORIES } from "@/lib/defaultPortfolioData";
import {
  getDeletedCategories,
  isCategoryDeleted,
  markCategoryDeleted,
  restoreCategory,
} from "@/lib/categoryManager";
import { clearDriveMemoryCache } from "@/lib/driveSync";

export const dynamic = "force-dynamic";

export async function GET() {
  return guard(async () => {
    let list: any[] = [];
    try {
      list = await db
        .select()
        .from(categories)
        .where(eq(categories.isActive, true))
        .orderBy(asc(categories.sortOrder), asc(categories.id));
    } catch {
      list = [];
    }

    if (list.length === 0) {
      list = DEFAULT_CATEGORIES;
    }

    // Filter out any category marked as deleted
    const activeCategories = list.filter(
      (c) => !isCategoryDeleted({ id: c.id, slug: c.slug, name: c.name })
    );

    return ok({
      categories: activeCategories,
      deletedCategories: getDeletedCategories(),
    });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));

    // Handle Restoration of Deleted Categories
    if (body.action === "restore") {
      const target = body.slug || body.id || body.name;
      if (!target) return badRequest("Category slug or ID required to restore.");
      restoreCategory(target);
      clearDriveMemoryCache();

      // Also reactivate in database
      try {
        if (body.id && !isNaN(Number(body.id))) {
          await db
            .update(categories)
            .set({ isActive: true, updatedAt: new Date() })
            .where(eq(categories.id, Number(body.id)))
            .catch(() => {});
        }
        if (body.slug) {
          await db
            .update(categories)
            .set({ isActive: true, updatedAt: new Date() })
            .where(eq(categories.slug, body.slug))
            .catch(() => {});
        }
      } catch {}

      return ok({ success: true, message: "Category restored successfully" });
    }

    const name = (body.name || "").toString().trim();
    if (!name) return badRequest("Category name is required.");

    const slug = (body.slug || slugify(name)).toString().trim();

    // If previously deleted, un-delete it
    restoreCategory(slug);
    clearDriveMemoryCache();

    let insertedRow = null;
    try {
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
      insertedRow = inserted[0];
    } catch {
      insertedRow = {
        id: Date.now(),
        name,
        slug,
        description: body.description || "",
        sortOrder: 0,
        isActive: true,
      };
    }

    return ok({ category: insertedRow });
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

    const slug = (body.slug || slugify(name)).toString();

    let updatedRow = null;
    try {
      const updated = await db
        .update(categories)
        .set({
          name,
          slug,
          description: (body.description || "").toString(),
          sortOrder: Number(body.sortOrder ?? 0),
          isActive: Boolean(body.isActive),
          updatedAt: new Date(),
        })
        .where(eq(categories.id, id))
        .returning();
      updatedRow = updated[0];
    } catch {}

    clearDriveMemoryCache();
    return ok({ category: updatedRow || { id, name, slug } });
  });
}

export async function DELETE(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const { searchParams } = new URL(req.url);

    let id = searchParams.get("id");
    let slug = searchParams.get("slug");
    let name = searchParams.get("name");
    let driveFolderId = searchParams.get("driveFolderId");

    // Also parse JSON body if provided in DELETE request
    if (!slug && !id) {
      try {
        const body = await req.json().catch(() => ({}));
        if (body.id) id = String(body.id);
        if (body.slug) slug = body.slug;
        if (body.name) name = body.name;
        if (body.driveFolderId) driveFolderId = body.driveFolderId;
      } catch {}
    }

    if (!id && !slug && !name && !driveFolderId) {
      return badRequest("Category ID, slug, or name is required for deletion.");
    }

    // 1. Mark as persistently deleted in categoryManager (works across Drive Sync & local store)
    const deletedInfo = markCategoryDeleted({
      id: id || undefined,
      slug: slug || "",
      name: name || undefined,
      driveFolderId: driveFolderId || undefined,
    });

    // 2. Clear Drive cache immediately so the next request refreshes without this category
    clearDriveMemoryCache();

    // 3. Attempt DB soft delete or hard delete if database table exists
    try {
      if (id && !isNaN(Number(id))) {
        await db
          .update(categories)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(categories.id, Number(id)))
          .catch(() => {});
      }
      if (slug) {
        await db
          .update(categories)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(categories.slug, slug))
          .catch(() => {});
      }
    } catch {}

    return ok({
      success: true,
      message: `Category "${deletedInfo.name || deletedInfo.slug}" deleted successfully.`,
      deleted: deletedInfo,
    });
  });
}
