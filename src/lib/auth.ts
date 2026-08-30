import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
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

const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  process.env.RESEND_API_KEY ||
  "portfolio-creative-admin-secret-2026";

function signAdminPayload(payloadObj: object): string {
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString("base64url");
  const signature = createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
  return `admin:${payload}.${signature}`;
}

function verifyAdminPayload<T>(token: string): T | null {
  try {
    if (!token.startsWith("admin:")) return null;
    const raw = token.slice("admin:".length);
    const parts = raw.split(".");
    if (parts.length !== 2) return null;
    const [payload, signature] = parts;
    const expected = createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
    if (signature !== expected) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}
export type StoredAdminRecord = {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
  passwordHash: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __registeredAdminsMap: Map<string, StoredAdminRecord> | undefined;
  // eslint-disable-next-line no-var
  var __customPasswordsMap: Map<string, string> | undefined;
}

if (!globalThis.__registeredAdminsMap) {
  globalThis.__registeredAdminsMap = new Map<string, StoredAdminRecord>();
}

if (!globalThis.__customPasswordsMap) {
  globalThis.__customPasswordsMap = new Map<string, string>();
}

export function saveAdminToMemory(admin: StoredAdminRecord) {
  globalThis.__registeredAdminsMap?.set(admin.username.toLowerCase(), admin);
  globalThis.__registeredAdminsMap?.set(admin.email.toLowerCase(), admin);
  if (admin.passwordHash) {
    globalThis.__customPasswordsMap?.set(admin.username.toLowerCase(), admin.passwordHash);
    globalThis.__customPasswordsMap?.set(admin.email.toLowerCase(), admin.passwordHash);
  }
}

export function getAdminFromMemory(identity: string): StoredAdminRecord | null {
  const clean = identity.toLowerCase().trim();
  return globalThis.__registeredAdminsMap?.get(clean) || null;
}

export function savePasswordToMemory(identity: string, passwordHash: string) {
  const clean = identity.toLowerCase().trim();
  globalThis.__customPasswordsMap?.set(clean, passwordHash);
}

export function getCustomPasswordHash(identity: string): string | null {
  const clean = identity.toLowerCase().trim();
  return globalThis.__customPasswordsMap?.get(clean) || null;
}

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

export async function createSession(
  adminId: number,
  adminData?: { id: number; name: string; email: string; username: string; role: string },
): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const token = adminData
    ? signAdminPayload({ ...adminData, expiresAt: expiresAt.getTime() })
    : newSessionToken();

  try {
    await db.insert(adminSessions).values({ token, adminId, expiresAt });
  } catch {
    // Database session insert skipped if DB is unconfigured
  }

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

  // 1. Try signed cryptographic admin token
  const signed = verifyAdminPayload<SessionAdmin & { expiresAt: number }>(token);
  if (signed && signed.expiresAt > Date.now()) {
    return {
      id: signed.id || 1,
      name: signed.name || "Mohit Babariya",
      email: signed.email || "mohitbabariyaa@gmail.com",
      username: signed.username || "mohit",
      role: signed.role || "owner",
    };
  }

  // 2. Try DB session lookup
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
    try {
      await db.delete(adminSessions).where(eq(adminSessions.token, token));
    } catch {}
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

