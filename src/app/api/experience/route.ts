import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { experience } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { badRequest, guard, notFound, ok } from "@/lib/http";

export async function GET() {
  return guard(async () => {
    const list = await db
      .select()
      .from(experience)
      .orderBy(asc(experience.sortOrder), asc(experience.id));

    return ok({ experience: list });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));

    const company = (body.company || "").toString().trim();
    const role = (body.role || "").toString().trim();
    if (!company || !role) return badRequest("Company and Role are required.");

    const inserted = await db
      .insert(experience)
      .values({
        company,
        role,
        description: (body.description || "").toString(),
        startDate: (body.startDate || "").toString(),
        endDate: (body.endDate || "").toString(),
        location: (body.location || "").toString(),
        sortOrder: body.sortOrder ? Number(body.sortOrder) : 0,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      })
      .returning();

    return ok({ item: inserted[0] });
  });
}

export async function PUT(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));

    const id = Number(body.id);
    if (!id) return badRequest("Experience ID is required.");

    const company = (body.company || "").toString().trim();
    const role = (body.role || "").toString().trim();
    if (!company || !role) return badRequest("Company and Role are required.");

    const updated = await db
      .update(experience)
      .set({
        company,
        role,
        description: (body.description || "").toString(),
        startDate: (body.startDate || "").toString(),
        endDate: (body.endDate || "").toString(),
        location: (body.location || "").toString(),
        sortOrder: Number(body.sortOrder ?? 0),
        isActive: Boolean(body.isActive),
        updatedAt: new Date(),
      })
      .where(eq(experience.id, id))
      .returning();

    if (!updated.length) return notFound("Experience not found.");

    return ok({ item: updated[0] });
  });
}

export async function DELETE(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id) return badRequest("Experience ID is required.");

    const deleted = await db
      .delete(experience)
      .where(eq(experience.id, id))
      .returning();

    if (!deleted.length) return notFound("Experience not found.");

    return ok({ success: true, deleted: deleted[0] });
  });
}
