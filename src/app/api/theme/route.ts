import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { themeSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { badRequest, guard, ok } from "@/lib/http";

export async function GET() {
  return guard(async () => {
    const rows = await db
      .select()
      .from(themeSettings)
      .where(eq(themeSettings.id, 1))
      .limit(1);

    const theme = rows[0] || {
      id: 1,
      activeTheme: 1,
      accentColor: "#C8A66A",
      customConfigJson: "{}",
    };
    return ok({ theme });
  });
}

export async function PUT(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));

    const activeTheme = Number(body.activeTheme || 1);
    const accentColor = (body.accentColor || "#C8A66A").toString();
    const customConfigJson = typeof body.customConfigJson === "string"
      ? body.customConfigJson
      : JSON.stringify(body.customConfigJson || {});

    const data = {
      activeTheme,
      accentColor,
      customConfigJson,
      updatedAt: new Date(),
    };

    const updated = await db
      .insert(themeSettings)
      .values({ id: 1, ...data })
      .onConflictDoUpdate({
        target: themeSettings.id,
        set: data,
      })
      .returning();

    revalidatePath("/");
    return ok({ theme: updated[0] });
  });
}
