import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { themeSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { badRequest, guard, ok } from "@/lib/http";

export async function GET() {
  return guard(async () => {
    let theme = {
      id: 1,
      activeTheme: 1,
      accentColor: "#C8A66A",
      customConfigJson: "{}",
    };

    try {
      const rows = await db
        .select()
        .from(themeSettings)
        .where(eq(themeSettings.id, 1))
        .limit(1);

      if (rows[0]) {
        theme = rows[0];
      }
    } catch {
      // Use default theme
    }

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

    let updatedRow: any = null;
    try {
      const updated = await db
        .insert(themeSettings)
        .values({ id: 1, ...data })
        .onConflictDoUpdate({
          target: themeSettings.id,
          set: data,
        })
        .returning();
      updatedRow = updated[0];
    } catch (err) {
      console.warn("[api/theme PUT fallback]:", err);
      updatedRow = { id: 1, ...data };
    }

    revalidatePath("/");
    return ok({ theme: updatedRow });
  });
}
