import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, portfolioProjects } from "@/db/schema";
import { revalidatePath } from "next/cache";

export interface CategoryInfo {
  id: number;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  driveFolderId?: string | null;
  deletedAt?: Date | string | null;
  videoCount?: number;
}

/**
 * Returns all active categories (not soft-deleted).
 */
export async function getActiveCategories(): Promise<CategoryInfo[]> {
  try {
    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        sortOrder: categories.sortOrder,
        isActive: categories.isActive,
        driveFolderId: categories.driveFolderId,
        deletedAt: categories.deletedAt,
      })
      .from(categories)
      .where(and(eq(categories.isActive, true), isNull(categories.deletedAt)))
      .orderBy(categories.sortOrder, categories.id);

    return rows;
  } catch (err) {
    console.warn("[categoryManager] Error getting active categories:", err);
    return [];
  }
}

/**
 * Returns all soft-deleted categories currently in the Trash.
 */
export async function getTrashCategories(): Promise<CategoryInfo[]> {
  try {
    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        sortOrder: categories.sortOrder,
        isActive: categories.isActive,
        driveFolderId: categories.driveFolderId,
        deletedAt: categories.deletedAt,
      })
      .from(categories)
      .where(isNotNull(categories.deletedAt))
      .orderBy(sql`${categories.deletedAt} DESC`);

    return rows;
  } catch (err) {
    console.warn("[categoryManager] Error getting trash categories:", err);
    return [];
  }
}

/**
 * Soft-deletes a category, moving it to Trash.
 * Its videos are preserved so they can be restored later.
 */
export async function softDeleteCategory(idOrSlug: number | string): Promise<{ success: boolean; category?: any }> {
  const now = new Date();
  try {
    let condition;
    if (typeof idOrSlug === "number" || !isNaN(Number(idOrSlug))) {
      condition = eq(categories.id, Number(idOrSlug));
    } else {
      condition = eq(categories.slug, String(idOrSlug));
    }

    const updated = await db
      .update(categories)
      .set({
        isActive: false,
        deletedAt: now,
        updatedAt: now,
      })
      .where(condition)
      .returning();

    if (updated.length > 0) {
      const cat = updated[0];

      // Also soft-delete associated projects so they immediately disappear from public website
      await db
        .update(portfolioProjects)
        .set({
          deletedAt: now,
          updatedAt: now,
        })
        .where(and(eq(portfolioProjects.categoryId, cat.id), isNull(portfolioProjects.deletedAt)));

      revalidatePath("/");
      revalidatePath("/admin/categories");
      return { success: true, category: cat };
    }

    return { success: false };
  } catch (err) {
    console.error("[categoryManager] Soft delete failed:", err);
    throw err;
  }
}

/**
 * Restores a soft-deleted category and its associated projects.
 */
export async function restoreCategoryFromTrash(idOrSlug: number | string): Promise<{ success: boolean; category?: any }> {
  const now = new Date();
  try {
    let condition;
    if (typeof idOrSlug === "number" || !isNaN(Number(idOrSlug))) {
      condition = eq(categories.id, Number(idOrSlug));
    } else {
      condition = eq(categories.slug, String(idOrSlug));
    }

    const updated = await db
      .update(categories)
      .set({
        isActive: true,
        deletedAt: null,
        updatedAt: now,
      })
      .where(condition)
      .returning();

    if (updated.length > 0) {
      const cat = updated[0];

      // Restore associated projects
      await db
        .update(portfolioProjects)
        .set({
          deletedAt: null,
          updatedAt: now,
        })
        .where(eq(portfolioProjects.categoryId, cat.id));

      revalidatePath("/");
      revalidatePath("/admin/categories");
      return { success: true, category: cat };
    }

    return { success: false };
  } catch (err) {
    console.error("[categoryManager] Restore failed:", err);
    throw err;
  }
}

/**
 * Permanently deletes a category from the database (explicit action).
 */
export async function permanentlyDeleteCategory(id: number): Promise<{ success: boolean }> {
  try {
    // Unlink projects from this category before deleting to prevent orphan errors
    await db
      .update(portfolioProjects)
      .set({ categoryId: null, categoryLabel: "Uncategorized" })
      .where(eq(portfolioProjects.categoryId, id));

    const deleted = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();

    revalidatePath("/");
    revalidatePath("/admin/categories");
    return { success: deleted.length > 0 };
  } catch (err) {
    console.error("[categoryManager] Permanent delete failed:", err);
    throw err;
  }
}
