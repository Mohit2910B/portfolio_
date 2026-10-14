import { eq } from "drizzle-orm";
import { db } from "@/db";
import { portfolioProjects } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { badRequest, guard, ok } from "@/lib/http";

export async function POST(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));

    // Expects array of { id: number, sortOrder: number }
    const items = body.items;
    if (!Array.isArray(items)) {
      return badRequest("Expected 'items' array of { id, sortOrder }.");
    }

    for (const item of items) {
      if (item.id && typeof item.sortOrder === "number") {
        await db
          .update(portfolioProjects)
          .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
          .where(eq(portfolioProjects.id, Number(item.id)));
      }
    }

    return ok({ success: true, count: items.length });
  });
}
