import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { creativeProcess } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { badRequest, guard, notFound, ok } from "@/lib/http";

export async function GET() {
  return guard(async () => {
    const list = await db
      .select()
      .from(creativeProcess)
      .orderBy(asc(creativeProcess.sortOrder), asc(creativeProcess.id));

    return ok({ steps: list });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));

    const title = (body.title || "").toString().trim();
    const stepNumber = (body.stepNumber || "01").toString().trim();
    if (!title) return badRequest("Step Title is required.");

    const inserted = await db
      .insert(creativeProcess)
      .values({
        stepNumber,
        title,
        description: (body.description || "").toString(),
        sortOrder: body.sortOrder ? Number(body.sortOrder) : 0,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      })
      .returning();

    return ok({ step: inserted[0] });
  });
}

export async function PUT(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));

    const id = Number(body.id);
    if (!id) return badRequest("Step ID is required.");

    const title = (body.title || "").toString().trim();
    if (!title) return badRequest("Step Title is required.");

    const updated = await db
      .update(creativeProcess)
      .set({
        stepNumber: (body.stepNumber || "01").toString(),
        title,
        description: (body.description || "").toString(),
        sortOrder: Number(body.sortOrder ?? 0),
        isActive: Boolean(body.isActive),
        updatedAt: new Date(),
      })
      .where(eq(creativeProcess.id, id))
      .returning();

    if (!updated.length) return notFound("Step not found.");

    return ok({ step: updated[0] });
  });
}

export async function DELETE(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id) return badRequest("Step ID is required.");

    const deleted = await db
      .delete(creativeProcess)
      .where(eq(creativeProcess.id, id))
      .returning();

    if (!deleted.length) return notFound("Step not found.");

    return ok({ success: true, deleted: deleted[0] });
  });
}
