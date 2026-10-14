import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { skills } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { badRequest, guard, notFound, ok } from "@/lib/http";

export async function GET() {
  return guard(async () => {
    const list = await db
      .select()
      .from(skills)
      .orderBy(asc(skills.sortOrder), asc(skills.id));

    return ok({ skills: list });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));

    const name = (body.name || "").toString().trim();
    if (!name) return badRequest("Skill name is required.");

    const inserted = await db
      .insert(skills)
      .values({
        name,
        category: (body.category || "").toString(),
        description: (body.description || "").toString(),
        level: body.level ? Number(body.level) : 90,
        sortOrder: body.sortOrder ? Number(body.sortOrder) : 0,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      })
      .returning();

    return ok({ skill: inserted[0] });
  });
}

export async function PUT(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));

    const id = Number(body.id);
    if (!id) return badRequest("Skill ID is required.");

    const name = (body.name || "").toString().trim();
    if (!name) return badRequest("Skill name is required.");

    const updated = await db
      .update(skills)
      .set({
        name,
        category: (body.category || "").toString(),
        description: (body.description || "").toString(),
        level: Number(body.level ?? 90),
        sortOrder: Number(body.sortOrder ?? 0),
        isActive: Boolean(body.isActive),
        updatedAt: new Date(),
      })
      .where(eq(skills.id, id))
      .returning();

    if (!updated.length) return notFound("Skill not found.");

    return ok({ skill: updated[0] });
  });
}

export async function DELETE(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id) return badRequest("Skill ID is required.");

    const deleted = await db
      .delete(skills)
      .where(eq(skills.id, id))
      .returning();

    if (!deleted.length) return notFound("Skill not found.");

    return ok({ success: true, deleted: deleted[0] });
  });
}
