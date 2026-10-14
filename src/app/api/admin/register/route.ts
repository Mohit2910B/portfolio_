import { db } from "@/db";
import { admins } from "@/db/schema";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { badRequest, guard, ok } from "@/lib/http";
import { eq, or } from "drizzle-orm";

export async function POST(req: Request) {
  return guard(async () => {
    // Requires existing authenticated admin
    await requireAdmin();

    const body = await req.json().catch(() => ({}));
    const name = (body.name || "").toString().trim();
    const email = (body.email || "").toString().trim().toLowerCase();
    const username = (body.username || "").toString().trim();
    const password = (body.password || "").toString();

    if (!name || !email || !username || !password) {
      return badRequest("All fields (name, email, username, password) are required.");
    }

    if (password.length < 6) {
      return badRequest("Password must be at least 6 characters long.");
    }

    // Check if email or username already exists
    const existing = await db
      .select()
      .from(admins)
      .where(or(eq(admins.email, email), eq(admins.username, username)))
      .limit(1);

    if (existing.length > 0) {
      return badRequest("An admin with that email or username already exists.");
    }

    const passwordHash = await hashPassword(password);

    const inserted = await db
      .insert(admins)
      .values({
        name,
        email,
        username,
        passwordHash,
        role: "admin",
      })
      .returning({
        id: admins.id,
        name: admins.name,
        email: admins.email,
        username: admins.username,
        role: admins.role,
      });

    return ok({ success: true, admin: inserted[0] });
  });
}
