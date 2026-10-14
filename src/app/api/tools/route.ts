import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { toolsSoftware } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { badRequest, guard, notFound, ok } from "@/lib/http";

export async function GET() {
  return guard(async () => {
    const list = await db
      .select()
      .from(toolsSoftware)
      .orderBy(asc(toolsSoftware.sortOrder), asc(toolsSoftware.id));

    return ok({ tools: list });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));

    const name = (body.name || "").toString().trim();
    if (!name) return badRequest("Tool name is required.");

    const inserted = await db
      .insert(toolsSoftware)
      .values({
        name,
        category: (body.category || "").toString(),
        description: (body.description || "").toString(),
        iconUrl: (body.iconUrl || "").toString(),
        proficiency: body.proficiency ? Number(body.proficiency) : 95,
        sortOrder: body.sortOrder ? Number(body.sortOrder) : 0,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      })
      .returning();

    return ok({ tool: inserted[0] });
  });
}

export async function PUT(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));

    const id = Number(body.id);
    if (!id) return badRequest("Tool ID is required.");

    const name = (body.name || "").toString().trim();
    if (!name) return badRequest("Tool name is required.");

    const updated = await db
      .update(toolsSoftware)
      .set({
        name,
        category: (body.category || "").toString(),
        description: (body.description || "").toString(),
        iconUrl: (body.iconUrl || "").toString(),
        proficiency: Number(body.proficiency ?? 95),
        sortOrder: Number(body.sortOrder ?? 0),
        isActive: Boolean(body.isActive),
        updatedAt: new Date(),
      })
      .where(eq(toolsSoftware.id, id))
      .returning();

    if (!updated.length) return notFound("Tool not found.");

    return ok({ tool: updated[0] });
  });
}

export async function DELETE(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id) return badRequest("Tool ID is required.");

    const deleted = await db
      .delete(toolsSoftware)
      .where(eq(toolsSoftware.id, id))
      .returning();

    if (!deleted.length) return notFound("Tool not found.");

    return ok({ success: true, deleted: deleted[0] });
  });
}
