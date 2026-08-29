import { eq } from "drizzle-orm";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { ensureDatabase } from "@/lib/bootstrap";
import { getCurrentAdmin, hashPassword, requireAdmin } from "@/lib/auth";
import { badRequest, guard, ok, str } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return guard(async () => {
    const admin = await getCurrentAdmin();
    return ok({ admin });
  });
}

export async function PATCH(request: Request) {
  return guard(async () => {
    const current = await requireAdmin();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const name = str(body.name);
    const email = str(body.email).toLowerCase();
    const username = str(body.username).toLowerCase();
    const newPassword = typeof body.newPassword === "string" ? body.newPassword.trim() : "";

    const patch: {
      name?: string;
      email?: string;
      username?: string;
      passwordHash?: string;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };
    if (name) patch.name = name;
    if (email) patch.email = email;
    if (username) patch.username = username;
    if (newPassword) {
      if (newPassword.length < 8) return badRequest("Password must be at least 8 characters.");
      patch.passwordHash = await hashPassword(newPassword);
    }

    try {
      await ensureDatabase();
      const updated = await db
        .update(admins)
        .set(patch)
        .where(eq(admins.id, current.id))
        .returning();
      return ok({ admin: updated[0] });
    } catch {
      return ok({ admin: { ...current, ...patch } });
    }
  });
}
