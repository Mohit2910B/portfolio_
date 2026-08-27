import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { adminSessions, admins } from "@/db/schema";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

export const ADMIN_COOKIE = "mb_admin_session";
const SESSION_DAYS = 7;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const derived = await scrypt(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(derived, expected);
}

export function newSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(adminId: number): Promise<string> {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(adminSessions).values({ token, adminId, expiresAt });
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export type SessionAdmin = {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
};

export async function getCurrentAdmin(): Promise<SessionAdmin | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    const rows = await db
      .select({
        id: admins.id,
        name: admins.name,
        email: admins.email,
        username: admins.username,
        role: admins.role,
      })
      .from(adminSessions)
      .innerJoin(admins, eq(admins.id, adminSessions.adminId))
      .where(and(eq(adminSessions.token, token), gt(adminSessions.expiresAt, new Date())))
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (token) {
    await db.delete(adminSessions).where(eq(adminSessions.token, token));
  }
  jar.delete(ADMIN_COOKIE);
}

/** Throws a Response when unauthenticated — used inside guard(). */
export class AuthRequiredError extends Error {
  response: Response;
  constructor(response: Response) {
    super("unauthorized");
    this.response = response;
  }
}

export async function requireAdmin(): Promise<SessionAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    throw new AuthRequiredError(
      new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    );
  }
  return admin;
}
