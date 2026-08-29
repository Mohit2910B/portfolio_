import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, projects } from "@/db/schema";
import { DEFAULT_PROJECTS, DEFAULT_CATEGORIES } from "@/lib/data";
import { ensureDatabase } from "@/lib/bootstrap";
import { guard, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Public portfolio feed. Never exposes drafts. */
export async function GET(request: Request) {
  return guard(async () => {
    const url = new URL(request.url);
    const categorySlug = url.searchParams.get("category");
    const featuredOnly = url.searchParams.get("featured") === "1";
    const limit = Number(url.searchParams.get("limit") ?? 0);

    try {
      await ensureDatabase();

      const filters = [eq(projects.published, true)];
      if (featuredOnly) filters.push(eq(projects.featured, true));

      if (categorySlug && categorySlug !== "all") {
        const category = await db
          .select()
          .from(categories)
          .where(eq(categories.slug, categorySlug))
          .limit(1);
        if (category[0]) filters.push(eq(projects.categoryId, category[0].id));
      }

      let query = db
        .select()
        .from(projects)
        .where(and(...filters))
        .orderBy(asc(projects.sortOrder), desc(projects.id))
        .$dynamic();

      if (limit > 0) query = query.limit(limit);

      const rows = await query;
      if (rows.length > 0) {
        return ok({ projects: rows, count: rows.length });
      }
    } catch (error) {
      console.error("[api/projects] Database error, using fallback data:", error);
    }

    let filtered = DEFAULT_PROJECTS;
    if (featuredOnly) {
      filtered = filtered.filter((p) => p.featured);
    }
    if (categorySlug && categorySlug !== "all") {
      const matchCat = DEFAULT_CATEGORIES.find((c) => c.slug === categorySlug);
      if (matchCat) {
        filtered = filtered.filter((p) => p.categoryId === matchCat.id);
      }
    }
    if (limit > 0) {
      filtered = filtered.slice(0, limit);
    }
    return ok({ projects: filtered, count: filtered.length });
  });
}

