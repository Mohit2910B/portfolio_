import { eq, or, desc } from "drizzle-orm";
import { createHash } from "crypto";
import { db } from "@/db";
import { admins, adminOtpChallenges } from "@/db/schema";
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
    const otp = str(body.otp);
    const errors: Record<string, string> = {};
    if (name.length < 2) errors.name = "Enter the admin name.";
    if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
    if (username.length < 3) errors.username = "Username must be at least 3 characters.";
    if (password.length < 8) errors.password = "Password must be at least 8 characters.";
    if (password !== confirm) errors.confirmPassword = "Passwords do not match.";
    if (Object.keys(errors).length > 0) return badRequest("Please fix the highlighted fields.", errors);
    const existing = await db.select({ id: admins.id }).from(admins).where(or(eq(admins.email, email), eq(admins.username, username))).limit(1);
    if (existing[0]) return conflict("An admin with that email or username already exists.");

    const passwordHash = await hashPassword(password);
    if (!otp) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const otpHash = createHash("sha256").update(code).digest("hex");
      await db.insert(adminOtpChallenges).values({ name, email, username, passwordHash, role: str(body.role, "admin") || "admin", otpHash, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
      const { sendOtpEmail } = await import("@/lib/notifications");
      const result = await sendOtpEmail(email, code, "Admin registration");
      if (!result.ok) {
        return badRequest(
          result.error ? `OTP email error: ${result.error}` : "OTP email could not be sent. Check RESEND_API_KEY and EMAIL_FROM.",
        );
      }
      return ok({ requiresOtp: true, message: "OTP sent to the admin email address." });
    }

    const challenge = (await db.select().from(adminOtpChallenges).where(eq(adminOtpChallenges.email, email)).orderBy(desc(adminOtpChallenges.createdAt)).limit(1))[0];
    if (!challenge) return badRequest("No active OTP request. Please request a new OTP.");
    if (challenge.expiresAt.getTime() < Date.now()) return badRequest("OTP expired. Please request a new OTP.");
    if (challenge.attempts >= 5) return badRequest("Too many incorrect OTP attempts. Please request a new OTP.");
    const otpHash = createHash("sha256").update(otp).digest("hex");
    if (otpHash !== challenge.otpHash) {
      await db.update(adminOtpChallenges).set({ attempts: challenge.attempts + 1 }).where(eq(adminOtpChallenges.id, challenge.id));
      return badRequest("Incorrect OTP.");
    }
    const inserted = await db.insert(admins).values({ name: challenge.name, email: challenge.email, username: challenge.username, passwordHash: challenge.passwordHash, role: challenge.role }).returning({ id: admins.id, name: admins.name, email: admins.email, username: admins.username, role: admins.role });
    return created({ admin: inserted[0], createdBy: current.email, verified: true });
  });
}
