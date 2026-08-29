import { createHash } from "node:crypto";
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

function cleanEnvValue(value?: string): string {
  if (!value) return "";
  let v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'")) ||
    (v.startsWith("`") && v.endsWith("`"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

/** Admin login with email OR username. */
export async function POST(request: Request) {
  return guard(async () => {
    const ip = clientIp(request);
    if (!rateLimit(`login:${ip}`, 10, 5 * 60 * 1000)) {
      return badRequest("Too many login attempts. Please wait a few minutes.");
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const identity = str(body.identity ?? body.email ?? body.username).toLowerCase().trim();
    const password = typeof body.password === "string" ? body.password.trim() : "";

    if (!identity || !password) {
      return badRequest("Enter your email/username and password.", {
        identity: identity ? "" : "Required",
        password: password ? "" : "Required",
      });
    }

    // 1. Try DB Authentication
    try {
      await ensureDatabase();
      const rows = await db
        .select()
        .from(admins)
        .where(or(eq(admins.email, identity), eq(admins.username, identity)))
        .limit(1);

      const admin = rows[0];
      if (admin && (await verifyPassword(password, admin.passwordHash))) {
        await createSession(admin.id, {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          username: admin.username,
          role: admin.role,
        });
        try {
          await db.update(admins).set({ lastLoginAt: sql`now()` }).where(eq(admins.id, admin.id));
        } catch {}

        return ok({
          admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
        });
      }
    } catch (dbErr) {
      console.warn("[admin] DB check skipped during login, checking master credentials:", dbErr);
    }

    // 2. Check Master / Seed Admin Credentials with constant-time hash
    const seedUser = cleanEnvValue(process.env.SEED_ADMIN_USERNAME || "mohit").toLowerCase();
    const seedEmail = cleanEnvValue(process.env.SEED_ADMIN_EMAIL || "mohitbabariyaa@gmail.com").toLowerCase();
    const seedPassword = cleanEnvValue(process.env.SEED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD);
    const seedName = cleanEnvValue(process.env.SEED_ADMIN_NAME) || "MOHIT BABARIYA";

    const passHash = createHash("sha256").update(password).digest("hex");
    const isMasterPassword =
      passHash === "4d5c235445ef8f25f87738c5c9931a4e7d4b8ae0c75cb7ed841a8b36330ecbd0" || // Mohit@2910
      passHash === "9039f50124f315a08e56a08bdd3402a84eac72decd5e6b6783981e2a8f5a560d" || // Mohit@2026
      (Boolean(seedPassword) && password === seedPassword);

    const isAuthorizedIdentity =
      identity === seedUser ||
      identity === seedEmail ||
      identity === "mohit" ||
      identity === "mohitbabariyaa@gmail.com" ||
      identity === "admin@mohitbabariya.studio";

    if (isAuthorizedIdentity && isMasterPassword) {
      const adminPayload = {
        id: 1,
        name: seedName,
        email: seedEmail,
        username: seedUser,
        role: "owner",
      };
      await createSession(1, adminPayload);
      return ok({
        admin: adminPayload,
      });
    }

    return unauthorized("Incorrect credentials. Please try again.");
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
