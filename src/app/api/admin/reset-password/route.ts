import { createHash } from "crypto";
import { desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { admins, emailOtpChallenges } from "@/db/schema";
import { hashPassword, createSession, savePasswordToMemory, saveAdminToMemory } from "@/lib/auth";
import { ensureDatabase } from "@/lib/bootstrap";
import { badRequest, guard, ok, rateLimit, str } from "@/lib/http";
import { getNotificationSettings, sendEmail } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const OTP_PURPOSE = "admin_password_reset";

type MemoryResetChallenge = {
  identity: string;
  email: string;
  username: string;
  adminId?: number;
  otpHash: string;
  expiresAt: number;
  attempts: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __memoryAdminResetChallenges: Map<string, MemoryResetChallenge> | undefined;
}

if (!globalThis.__memoryAdminResetChallenges) {
  globalThis.__memoryAdminResetChallenges = new Map<string, MemoryResetChallenge>();
}

export async function POST(request: Request) {
  return guard(async () => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const identity = str(body.identity).trim().toLowerCase();
    const otp = str(body.otp).trim();
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : newPassword;

    if (!identity) {
      return badRequest("Please enter your admin email or username.");
    }

    // Rate limit
    if (!rateLimit(`admin-reset:${identity}`, 8, 15 * 60 * 1000)) {
      return badRequest("Too many password reset requests. Please wait a few minutes.");
    }

    let adminName = "Admin";
    let adminEmail = identity.includes("@") ? identity : "mohitbabariyaa@gmail.com";
    let adminUsername = identity.includes("@") ? identity.split("@")[0] : identity;
    let adminId: number | undefined = undefined;

    // 1. Try finding admin in DB if available
    try {
      await ensureDatabase();
      const existingAdmins = await db
        .select()
        .from(admins)
        .where(or(eq(admins.email, identity), eq(admins.username, identity)))
        .limit(1);

      if (existingAdmins[0]) {
        const a = existingAdmins[0];
        adminName = a.name;
        adminEmail = a.email;
        adminUsername = a.username;
        adminId = a.id;
      }
    } catch {}

    let ownerEmail = "mohitbabariyaa@gmail.com";
    try {
      const settings = await getNotificationSettings();
      if (settings.notificationEmail) {
        ownerEmail = settings.notificationEmail;
      }
    } catch {}

    // STEP 1: Request OTP
    if (!otp) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const otpHash = createHash("sha256").update(code).digest("hex");
      const expiresAt = Date.now() + 15 * 60 * 1000;

      // Save to memory
      globalThis.__memoryAdminResetChallenges!.set(identity, {
        identity,
        email: adminEmail,
        username: adminUsername,
        adminId,
        otpHash,
        expiresAt,
        attempts: 0,
      });

      // Save to DB if available
      try {
        await db.insert(emailOtpChallenges).values({
          email: adminEmail,
          purpose: OTP_PURPOSE,
          otpHash,
          expiresAt: new Date(expiresAt),
          attempts: 0,
        });
      } catch {}

      const emailHtml = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:500px;margin:0 auto;padding:28px 24px;border-radius:16px;background:#ffffff;border:1px solid #e5e5e5;color:#111111;">
          <div style="margin-bottom:20px;">
            <span style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#e0147f;">Mohit Babariya · Studio Security</span>
          </div>
          <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;line-height:1.3;color:#0b0b0c;">Admin Password Reset Request</h2>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:#444444;">
            A password reset was requested for the admin account: <strong>${adminName}</strong> (@${adminUsername}, ${adminEmail}).
          </p>
          <div style="background:#f7f5f2;border:1px dashed #d6d3ce;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#666666;text-transform:uppercase;letter-spacing:0.1em;">Master Security Reset OTP</p>
            <span style="font-family:'Courier New',Courier,monospace;font-size:36px;font-weight:700;letter-spacing:10px;color:#0b0b0c;display:inline-block;padding-left:10px;">${code}</span>
          </div>
          <p style="margin:0 0 12px;font-size:13px;color:#555555;">This OTP is valid for <strong>15 minutes</strong>.</p>
          <p style="margin:0;font-size:11px;color:#888888;">If you did not request this password reset, please ignore this email. The password will remain unchanged.</p>
        </div>
      `;

      // Send ONLY to Mohit's verified owner email
      const res = await sendEmail(
        ownerEmail,
        `🔐 ${code} is the Master Reset Code for Admin (${adminUsername})`,
        emailHtml,
      );

      if (!res.ok) {
        return badRequest(
          res.error ? `Failed to dispatch OTP: ${res.error}` : "Failed to send reset OTP email.",
        );
      }

      return ok({
        requiresOtp: true,
        email: adminEmail,
        username: adminUsername,
        message: `Security OTP has been dispatched directly to Mohit's email (${ownerEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3")}).`,
      });
    }

    // STEP 2: Verify OTP and update password
    if (!newPassword || newPassword.length < 8) {
      return badRequest("New password must be at least 8 characters long.");
    }
    if (newPassword !== confirmPassword) {
      return badRequest("Passwords do not match.");
    }

    let challenge: MemoryResetChallenge | null = null;
    if (globalThis.__memoryAdminResetChallenges?.has(identity)) {
      challenge = globalThis.__memoryAdminResetChallenges.get(identity)!;
    }

    if (!challenge) {
      try {
        const challengeRows = await db
          .select()
          .from(emailOtpChallenges)
          .where(eq(emailOtpChallenges.email, adminEmail))
          .orderBy(desc(emailOtpChallenges.createdAt))
          .limit(1);

        const r = challengeRows[0];
        if (r && r.purpose === OTP_PURPOSE) {
          challenge = {
            identity,
            email: r.email,
            username: adminUsername,
            adminId,
            otpHash: r.otpHash,
            expiresAt: r.expiresAt.getTime(),
            attempts: r.attempts,
          };
        }
      } catch {}
    }

    if (!challenge) {
      return badRequest("No active password reset request found. Please request a new OTP.");
    }

    if (challenge.expiresAt < Date.now()) {
      return badRequest("The OTP has expired. Please request a new OTP.");
    }

    if (challenge.attempts >= 5) {
      return badRequest("Too many incorrect attempts. Please request a new OTP.");
    }

    const providedOtpHash = createHash("sha256").update(otp).digest("hex");
    if (providedOtpHash !== challenge.otpHash) {
      challenge.attempts += 1;
      return badRequest("Incorrect OTP code. Please check the code received from Mohit and try again.");
    }

    const passwordHash = await hashPassword(newPassword);

    // Update password in DB if available
    try {
      if (challenge.adminId) {
        await db
          .update(admins)
          .set({ passwordHash, updatedAt: new Date() })
          .where(eq(admins.id, challenge.adminId));
      } else {
        await db
          .update(admins)
          .set({ passwordHash, updatedAt: new Date() })
          .where(or(eq(admins.email, challenge.email), eq(admins.username, challenge.username)));
      }
    } catch {}

    // Save to memory custom password store
    savePasswordToMemory(identity, passwordHash);
    savePasswordToMemory(challenge.username, passwordHash);
    savePasswordToMemory(challenge.email, passwordHash);

    const adminPayload = {
      id: challenge.adminId || 1,
      name: challenge.username || "Mohit",
      email: challenge.email || "mohitbabariyaa@gmail.com",
      username: challenge.username || "mohit",
      role: "owner",
    };

    // Automatically create session for seamless instant access
    await createSession(adminPayload.id, adminPayload);

    globalThis.__memoryAdminResetChallenges?.delete(identity);

    return ok({
      success: true,
      loggedIn: true,
      admin: adminPayload,
      message: "Password has been successfully updated and you are now signed in!",
    });
  });
}
