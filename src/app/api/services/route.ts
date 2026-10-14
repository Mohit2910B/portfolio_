import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { services } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { badRequest, guard, notFound, ok } from "@/lib/http";

export async function GET() {
  return guard(async () => {
    const list = await db
      .select()
      .from(services)
      .orderBy(asc(services.sortOrder), asc(services.id));

    return ok({ services: list });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));

    const title = (body.title || "").toString().trim();
    if (!title) return badRequest("Service title is required.");

    const inserted = await db
      .insert(services)
      .values({
        title,
        description: (body.description || "").toString(),
        deliverables: (body.deliverables || "").toString(),
        icon: (body.icon || "").toString(),
        priceFrom: (body.priceFrom || "").toString(),
        sortOrder: body.sortOrder ? Number(body.sortOrder) : 0,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      })
      .returning();

    return ok({ service: inserted[0] });
  });
}

export async function PUT(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));

    const id = Number(body.id);
    if (!id) return badRequest("Service ID is required.");

    const title = (body.title || "").toString().trim();
    if (!title) return badRequest("Title is required.");

    const updated = await db
      .update(services)
      .set({
        title,
        description: (body.description || "").toString(),
        deliverables: (body.deliverables || "").toString(),
        icon: (body.icon || "").toString(),
        priceFrom: (body.priceFrom || "").toString(),
        sortOrder: Number(body.sortOrder ?? 0),
        isActive: Boolean(body.isActive),
        updatedAt: new Date(),
      })
      .where(eq(services.id, id))
      .returning();

    if (!updated.length) return notFound("Service not found.");

    return ok({ service: updated[0] });
  });
}

export async function DELETE(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id) return badRequest("Service ID is required.");

    const deleted = await db
      .delete(services)
      .where(eq(services.id, id))
      .returning();

    if (!deleted.length) return notFound("Service not found.");

    return ok({ success: true, deleted: deleted[0] });
  });
}
