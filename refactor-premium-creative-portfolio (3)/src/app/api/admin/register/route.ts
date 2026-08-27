import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { ensureDatabase } from "@/lib/bootstrap";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { badRequest, conflict, created, guard, ok, str } from "@/lib/http";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/** GET — list existing admins (authenticated admins only). */
export async function GET() {
  return guard(async () => {
    await requireAdmin();
    await ensureDatabase();
    const rows = await db
      .select({
        id: admins.id,
        name: admins.name,
        email: admins.email,
        username: admins.username,
        role: admins.role,
        lastLoginAt: admins.lastLoginAt,
        createdAt: admins.createdAt,
      })
      .from(admins);
    return ok({ admins: rows });
  });
}

/** POST — only an authenticated admin may register another admin. */
export async function POST(request: Request) {
  return guard(async () => {
    const current = await requireAdmin();
    await ensureDatabase();

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const name = str(body.name);
    const email = str(body.email).toLowerCase();
    const username = str(body.username).toLowerCase() || email.split("@")[0];
    const password = typeof body.password === "string" ? body.password : "";
    const confirm = typeof body.confirmPassword === "string" ? body.confirmPassword : password;

    const errors: Record<string, string> = {};
    if (name.length < 2) errors.name = "Enter the admin name.";
    if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
    if (username.length < 3) errors.username = "Username must be at least 3 characters.";
    if (password.length < 8) errors.password = "Password must be at least 8 characters.";
    if (password !== confirm) errors.confirmPassword = "Passwords do not match.";
    if (Object.keys(errors).length > 0) return badRequest("Please fix the highlighted fields.", errors);

    const existing = await db
      .select({ id: admins.id })
      .from(admins)
      .where(or(eq(admins.email, email), eq(admins.username, username)))
      .limit(1);
    if (existing[0]) return conflict("An admin with that email or username already exists.");

    const inserted = await db
      .insert(admins)
      .values({
        name,
        email,
        username,
        passwordHash: await hashPassword(password),
        role: str(body.role, "admin") || "admin",
      })
      .returning({
        id: admins.id,
        name: admins.name,
        email: admins.email,
        username: admins.username,
        role: admins.role,
      });

    return created({ admin: inserted[0], createdBy: current.email });
  });
}
