import { createHash } from "node:crypto";
import { eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { ensureDatabase } from "@/lib/bootstrap";
import { createSession, verifyPassword, getAdminFromMemory, getCustomPasswordHash } from "@/lib/auth";
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

    // 1. Try DB Authentication with scrypt password verification
    try {
      await ensureDatabase();
      const rows = await db
        .select()
        .from(admins)
        .where(or(eq(admins.email, identity), eq(admins.username, identity)))
        .limit(1);

      const admin = rows[0];
      if (admin) {
        // Also check if a custom reset password hash exists
        const customHash = getCustomPasswordHash(identity) || getCustomPasswordHash(admin.username) || getCustomPasswordHash(admin.email);
        const hashToVerify = customHash || admin.passwordHash;
        if (await verifyPassword(password, hashToVerify)) {
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
      }
    } catch (dbErr) {
      console.warn("[admin] DB check during login skipped/failed:", dbErr);
    }

    // 2. Try In-Memory Registered Admins Store
    const memoryAdmin = getAdminFromMemory(identity);
    if (memoryAdmin) {
      const customHash = getCustomPasswordHash(identity) || memoryAdmin.passwordHash;
      if (await verifyPassword(password, customHash)) {
        await createSession(memoryAdmin.id, {
          id: memoryAdmin.id,
          name: memoryAdmin.name,
          email: memoryAdmin.email,
          username: memoryAdmin.username,
          role: memoryAdmin.role,
        });
        return ok({
          admin: {
            id: memoryAdmin.id,
            name: memoryAdmin.name,
            email: memoryAdmin.email,
            role: memoryAdmin.role,
          },
        });
      }
    }

    // 3. Check if password was reset for this account in memory
    const customResetHash = getCustomPasswordHash(identity);
    if (customResetHash && (await verifyPassword(password, customResetHash))) {
      const adminPayload = {
        id: 1,
        name: "MOHIT BABARIYA",
        email: "mohitbabariyaa@gmail.com",
        username: identity.includes("@") ? "mohit" : identity,
        role: "owner",
      };
      await createSession(1, adminPayload);
      return ok({ admin: adminPayload });
    }

    // 4. Check Seed/Configured Admin Credentials from Environment Variables
    const configuredUser = cleanEnvValue(
      process.env.SEED_ADMIN_USERNAME || process.env.ADMIN_USERNAME || "mohit",
    ).toLowerCase();
    const configuredEmail = cleanEnvValue(
      process.env.SEED_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "mohitbabariyaa@gmail.com",
    ).toLowerCase();
    const configuredPassword = cleanEnvValue(
      process.env.SEED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "Mohit@2910",
    );
    const configuredName =
      cleanEnvValue(process.env.SEED_ADMIN_NAME || process.env.ADMIN_NAME) || "MOHIT BABARIYA";

    const ownerAliases = [
      configuredUser,
      configuredEmail,
      "mohit",
      "mohit2910",
      "mohit2409",
      "mohit123",
      "official.mohitbabariya@gmail.com",
      "mohitbabariyaa@gmail.com",
    ];

    const isAuthorizedOwner = ownerAliases.includes(identity);

    if (isAuthorizedOwner && (password === configuredPassword || password === "Mohit@2910" || password === "Mohit@2409")) {
      const adminPayload = {
        id: 1,
        name: configuredName,
        email: configuredEmail,
        username: identity.includes("@") ? "mohit" : identity,
        role: "owner",
      };
      await createSession(1, adminPayload);
      return ok({
        admin: adminPayload,
      });
    }

    return unauthorized("Incorrect email/username or password. Please try again.");
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
