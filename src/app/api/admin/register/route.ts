import { createHash } from "crypto";
import { desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { admins, adminOtpChallenges } from "@/db/schema";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { ensureDatabase } from "@/lib/bootstrap";
import { badRequest, conflict, created, guard, ok, rateLimit, str } from "@/lib/http";
import { getNotificationSettings, sendEmail } from "@/lib/notifications";

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

/**
 * POST — Register new admin.
 * Security Guardrail:
 * All registration requests send the Master Verification OTP directly and EXCLUSIVELY
 * to Mohit's verified owner email (mohitbabariyaa@gmail.com).
 * No admin account can be created without Mohit's direct OTP authorization.
 */
export async function POST(request: Request) {
  return guard(async () => {
    await ensureDatabase();

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const name = str(body.name).trim();
    const email = str(body.email).toLowerCase().trim();
    const username = str(body.username).toLowerCase().trim() || email.split("@")[0];
    const role = str(body.role, "editor").trim() || "editor";
    const password = typeof body.password === "string" ? body.password : "";
    const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : password;
    const otp = str(body.otp).trim();

    // Rate limiting
    if (!rateLimit(`admin-register:${email || username}`, 8, 15 * 60 * 1000)) {
      return badRequest("Too many registration attempts. Please wait a few minutes.");
    }

    const errors: Record<string, string> = {};
    if (name.length < 2) errors.name = "Full name must be at least 2 characters.";
    if (!EMAIL_RE.test(email)) errors.email = "Please enter a valid email address.";
    if (username.length < 3) errors.username = "Username must be at least 3 characters.";
    if (password.length < 8) errors.password = "Password must be at least 8 characters.";
    if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match.";

    if (Object.keys(errors).length > 0) {
      return badRequest("Please fix the highlighted fields.", errors);
    }

    // Check if username or email is already taken
    const existing = await db
      .select({ id: admins.id })
      .from(admins)
      .where(or(eq(admins.email, email), eq(admins.username, username)))
      .limit(1);

    if (existing[0]) {
      return conflict("An admin account with that email or username already exists.");
    }

    const settings = await getNotificationSettings();
    const ownerEmail = settings.notificationEmail || "mohitbabariyaa@gmail.com";

    // STEP 1: Generate OTP and send ONLY to Mohit's Owner Email
    if (!otp) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const otpHash = createHash("sha256").update(code).digest("hex");
      const passwordHash = await hashPassword(password);

      await db.insert(adminOtpChallenges).values({
        name,
        email,
        username,
        passwordHash,
        role,
        otpHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        attempts: 0,
      });

      const emailHtml = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px 24px;border-radius:16px;background:#ffffff;border:1px solid #e5e5e5;color:#111111;">
          <div style="margin-bottom:20px;">
            <span style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#e0147f;">Mohit Babariya · Studio Security</span>
          </div>
          <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;line-height:1.3;color:#0b0b0c;">New Admin Account Authorization</h2>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:#444444;">
            A new team member has requested an Admin Account on your website CMS:
          </p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">
            <tr style="border-bottom:1px solid #eeeeee;"><td style="padding:8px 0;color:#777777;">Name:</td><td style="padding:8px 0;font-weight:600;color:#111111;">${name}</td></tr>
            <tr style="border-bottom:1px solid #eeeeee;"><td style="padding:8px 0;color:#777777;">Username:</td><td style="padding:8px 0;font-weight:600;color:#111111;">@${username}</td></tr>
            <tr style="border-bottom:1px solid #eeeeee;"><td style="padding:8px 0;color:#777777;">Email:</td><td style="padding:8px 0;font-weight:600;color:#111111;">${email}</td></tr>
            <tr style="border-bottom:1px solid #eeeeee;"><td style="padding:8px 0;color:#777777;">Role:</td><td style="padding:8px 0;font-weight:600;color:#e0147f;text-transform:uppercase;">${role}</td></tr>
          </table>
          <p style="margin:0 0 12px;font-size:14px;color:#333333;">
            If you approve this person, give them this <strong>Master Authorization Code</strong> to complete their signup:
          </p>
          <div style="background:#f7f5f2;border:1px dashed #d6d3ce;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#777777;text-transform:uppercase;letter-spacing:0.1em;">Master Authorization OTP</p>
            <span style="font-family:'Courier New',Courier,monospace;font-size:36px;font-weight:700;letter-spacing:10px;color:#0b0b0c;display:inline-block;padding-left:10px;">${code}</span>
          </div>
          <p style="margin:0 0 10px;font-size:12px;color:#666666;">This code is valid for <strong>15 minutes</strong>.</p>
          <p style="margin:0;font-size:11px;color:#999999;">⚠️ <strong>Security Notice:</strong> If you did not authorize this request, ignore this email. No admin account will be created without your code.</p>
        </div>
      `;

      const sendRes = await sendEmail(
        ownerEmail,
        `🔐 [Authorization Required] New Admin Account: ${name} (@${username})`,
        emailHtml,
      );

      if (!sendRes.ok) {
        return badRequest(
          sendRes.error
            ? `Failed to send authorization email: ${sendRes.error}`
            : "Authorization email could not be sent to Mohit.",
        );
      }

      return ok({
        requiresOtp: true,
        message: "Authorization request sent! The 6-digit Master Security Code has been sent directly to Mohit's email for approval.",
      });
    }

    // STEP 2: Verify Master OTP and create admin
    const challengeRows = await db
      .select()
      .from(adminOtpChallenges)
      .where(eq(adminOtpChallenges.email, email))
      .orderBy(desc(adminOtpChallenges.createdAt))
      .limit(1);

    const challenge = challengeRows[0];
    if (!challenge) {
      return badRequest("No active registration request found. Please submit your details first.");
    }

    if (challenge.expiresAt.getTime() < Date.now()) {
      return badRequest("The authorization code has expired. Please submit a new request.");
    }

    if (challenge.attempts >= 5) {
      return badRequest("Too many incorrect code attempts. Please submit a new request.");
    }

    const providedOtpHash = createHash("sha256").update(otp).digest("hex");
    if (providedOtpHash !== challenge.otpHash) {
      await db
        .update(adminOtpChallenges)
        .set({ attempts: challenge.attempts + 1 })
        .where(eq(adminOtpChallenges.id, challenge.id));
      return badRequest("Incorrect authorization code. Please verify the code received from Mohit.");
    }

    // Create admin record
    const inserted = await db
      .insert(admins)
      .values({
        name: challenge.name,
        email: challenge.email,
        username: challenge.username,
        passwordHash: challenge.passwordHash,
        role: challenge.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({
        id: admins.id,
        name: admins.name,
        email: admins.email,
        username: admins.username,
        role: admins.role,
      });

    return created({
      success: true,
      admin: inserted[0],
      message: "Admin account successfully created and authorized! You can now sign in.",
    });
  });
}
