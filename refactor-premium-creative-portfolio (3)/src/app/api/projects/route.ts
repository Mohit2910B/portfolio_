import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, projects } from "@/db/schema";
import { ensureDatabase } from "@/lib/bootstrap";
import { guard, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Public portfolio feed. Never exposes drafts. */
export async function GET(request: Request) {
  return guard(async () => {
    await ensureDatabase();
    const url = new URL(request.url);
    const categorySlug = url.searchParams.get("category");
    const featuredOnly = url.searchParams.get("featured") === "1";
    const limit = Number(url.searchParams.get("limit") ?? 0);

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
    return ok({ projects: rows, count: rows.length });
  });
}
