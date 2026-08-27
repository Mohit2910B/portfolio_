import { eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { ensureDatabase } from "@/lib/bootstrap";
import { createSession, verifyPassword } from "@/lib/auth";
import {
  badRequest,
  clientIp,
  conflict,
  guard,
  ok,
  rateLimit,
  str,
  unauthorized,
} from "@/lib/http";

export const dynamic = "force-dynamic";

/** Admin login with email OR username. */
export async function POST(request: Request) {
  return guard(async () => {
    await ensureDatabase();
    const ip = clientIp(request);
    if (!rateLimit(`login:${ip}`, 10, 5 * 60 * 1000)) {
      return badRequest("Too many login attempts. Please wait a few minutes.");
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const identity = str(body.identity ?? body.email ?? body.username).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";

    if (!identity || !password) {
      return badRequest("Enter your email/username and password.", {
        identity: identity ? "" : "Required",
        password: password ? "" : "Required",
      });
    }

    const rows = await db
      .select()
      .from(admins)
      .where(or(eq(admins.email, identity), eq(admins.username, identity)))
      .limit(1);

    const admin = rows[0];
    if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
      return unauthorized("Incorrect credentials. Please try again.");
    }

    await createSession(admin.id);
    await db.update(admins).set({ lastLoginAt: sql`now()` }).where(eq(admins.id, admin.id));

    return ok({
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    });
  });
}

/** Conflict guard helper kept explicit so 409 is used meaningfully. */
export async function PUT() {
  return guard(async () => {
    await ensureDatabase();
    const existing = await db.select({ id: admins.id }).from(admins).limit(1);
    if (existing.length > 0) {
      return conflict("An admin already exists. Sign in instead.");
    }
    return ok({ setupRequired: true });
  });
}
