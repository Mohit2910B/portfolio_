import { createHash } from "crypto";
import { desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { admins, emailOtpChallenges } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { ensureDatabase } from "@/lib/bootstrap";
import { badRequest, guard, ok, rateLimit, str } from "@/lib/http";
import { getNotificationSettings, sendEmail } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const OTP_PURPOSE = "admin_password_reset";

export async function POST(request: Request) {
  return guard(async () => {
    await ensureDatabase();

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const identity = str(body.identity).trim().toLowerCase();
    const otp = str(body.otp).trim();
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : newPassword;

    if (!identity) {
      return badRequest("Please enter your admin email or username.");
    }

    // Rate limit
    if (!rateLimit(`admin-reset:${identity}`, 6, 15 * 60 * 1000)) {
      return badRequest("Too many password reset requests. Please wait a few minutes.");
    }

    // 1. Find admin account
    const existingAdmins = await db
      .select()
      .from(admins)
      .where(or(eq(admins.email, identity), eq(admins.username, identity)))
      .limit(1);

    const admin = existingAdmins[0];
    if (!admin) {
      return badRequest("No admin account found with that email or username.");
    }

    const settings = await getNotificationSettings();
    const ownerEmail = settings.notificationEmail || "mohitbabariyaa@gmail.com";

    // STEP 1: Request OTP
    if (!otp) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const otpHash = createHash("sha256").update(code).digest("hex");

      await db.insert(emailOtpChallenges).values({
        email: admin.email,
        purpose: OTP_PURPOSE,
        otpHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0,
      });

      const emailHtml = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:500px;margin:0 auto;padding:28px 24px;border-radius:16px;background:#ffffff;border:1px solid #e5e5e5;color:#111111;">
          <div style="margin-bottom:20px;">
            <span style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#e0147f;">Mohit Babariya · Studio Security</span>
          </div>
          <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;line-height:1.3;color:#0b0b0c;">Admin Password Reset Request</h2>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:#444444;">
            A password reset was requested for the admin account: <strong>${admin.name}</strong> (@${admin.username}, ${admin.email}).
          </p>
          <div style="background:#f7f5f2;border:1px dashed #d6d3ce;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#666666;text-transform:uppercase;letter-spacing:0.1em;">Master Security Reset OTP</p>
            <span style="font-family:'Courier New',Courier,monospace;font-size:36px;font-weight:700;letter-spacing:10px;color:#0b0b0c;display:inline-block;padding-left:10px;">${code}</span>
          </div>
          <p style="margin:0 0 12px;font-size:13px;color:#555555;">This OTP is valid for <strong>10 minutes</strong>.</p>
          <p style="margin:0;font-size:11px;color:#888888;">If you did not request this password reset, please ignore this email. The password will remain unchanged.</p>
        </div>
      `;

      // Send ONLY to Mohit's verified owner email
      const res = await sendEmail(
        ownerEmail,
        `🔐 ${code} is the Master Reset Code for Admin (${admin.username})`,
        emailHtml,
      );

      if (!res.ok) {
        return badRequest(
          res.error ? `Failed to send OTP: ${res.error}` : "Failed to send reset OTP email.",
        );
      }

      return ok({
        requiresOtp: true,
        email: admin.email,
        username: admin.username,
        message: `Security OTP has been sent to the owner email (${ownerEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3")}).`,
      });
    }

    // STEP 2: Verify OTP and update password
    if (!newPassword || newPassword.length < 8) {
      return badRequest("New password must be at least 8 characters long.");
    }
    if (newPassword !== confirmPassword) {
      return badRequest("Passwords do not match.");
    }

    const challengeRows = await db
      .select()
      .from(emailOtpChallenges)
      .where(
        eq(emailOtpChallenges.email, admin.email),
      )
      .orderBy(desc(emailOtpChallenges.createdAt))
      .limit(1);

    const challenge = challengeRows[0];
    if (!challenge || challenge.purpose !== OTP_PURPOSE) {
      return badRequest("No active password reset request found. Please request a new OTP.");
    }

    if (challenge.expiresAt.getTime() < Date.now()) {
      return badRequest("The OTP has expired. Please request a new OTP.");
    }

    if (challenge.attempts >= 5) {
      return badRequest("Too many incorrect attempts. Please request a new OTP.");
    }

    const providedOtpHash = createHash("sha256").update(otp).digest("hex");
    if (providedOtpHash !== challenge.otpHash) {
      await db
        .update(emailOtpChallenges)
        .set({ attempts: challenge.attempts + 1 })
        .where(eq(emailOtpChallenges.id, challenge.id));
      return badRequest("Incorrect OTP code. Please check the code and try again.");
    }

    // Update password
    const passwordHash = await hashPassword(newPassword);
    await db
      .update(admins)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(admins.id, admin.id));

    // Mark challenge verified
    await db
      .update(emailOtpChallenges)
      .set({ verifiedAt: new Date() })
      .where(eq(emailOtpChallenges.id, challenge.id));

    return ok({
      success: true,
      message: "Password has been successfully updated! You can now sign in with your new password.",
    });
  });
}
