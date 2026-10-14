import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { layoutOrder } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { badRequest, guard, ok } from "@/lib/http";

export async function GET() {
  return guard(async () => {
    const list = await db
      .select()
      .from(layoutOrder)
      .orderBy(asc(layoutOrder.sortOrder), asc(layoutOrder.id));

    return ok({ sections: list });
  });
}

export async function PUT(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));

    const sections = body.sections;
    if (!Array.isArray(sections)) {
      return badRequest("Expected 'sections' array of { sectionKey, label, sortOrder, isVisible }.");
    }

    for (const sec of sections) {
      if (sec.sectionKey) {
        await db
          .insert(layoutOrder)
          .values({
            sectionKey: sec.sectionKey,
            label: (sec.label || sec.sectionKey).toString(),
            sortOrder: Number(sec.sortOrder ?? 0),
            isVisible: sec.isVisible !== undefined ? Boolean(sec.isVisible) : true,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: layoutOrder.sectionKey,
            set: {
              label: (sec.label || sec.sectionKey).toString(),
              sortOrder: Number(sec.sortOrder ?? 0),
              isVisible: sec.isVisible !== undefined ? Boolean(sec.isVisible) : true,
              updatedAt: new Date(),
            },
          });
      }
    }

    const updatedList = await db
      .select()
      .from(layoutOrder)
      .orderBy(asc(layoutOrder.sortOrder));

    return ok({ success: true, sections: updatedList });
  });
}
