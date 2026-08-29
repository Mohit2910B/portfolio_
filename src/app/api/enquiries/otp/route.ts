import { cookies } from "next/headers";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { emailOtpChallenges } from "@/db/schema";
import { ensureDatabase } from "@/lib/bootstrap";
import { guard, badRequest, ok } from "@/lib/http";
import { sendEnquiryOtpEmail, sendOtpEmail } from "@/lib/notifications";
import {
  generate6DigitOtp,
  hashOtp,
  signChallenge,
  verifyChallengeToken,
  signVerifiedSession,
} from "@/lib/otp";
import { validatePhone, normalizePhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return guard(async () => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const email = String(body.email || "").trim().toLowerCase();
    const countryCode = String(body.countryCode || "+91");
    const phone = normalizePhone(countryCode, String(body.phoneNumber || ""));

    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
      return badRequest("Enter a valid email address.", { email: "Enter a valid email address." });
    }

    const error = validatePhone(countryCode, phone);
    if (error) return badRequest(error, { phoneNumber: error });

    const otp = generate6DigitOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = Date.now() + 10 * 60 * 1000;

    let dbChallengeId: number | null = null;
    try {
      await ensureDatabase();
      const inserted = await db
        .insert(emailOtpChallenges)
        .values({
          email,
          purpose: "enquiry",
          otpHash,
          expiresAt: new Date(expiresAt),
        })
        .returning({ id: emailOtpChallenges.id });
      if (inserted[0]) {
        dbChallengeId = inserted[0].id;
      }
    } catch (dbErr) {
      console.warn(
        "[otp] Database not active for OTP persistence, falling back to cryptographic session challenge:",
        dbErr instanceof Error ? dbErr.message : dbErr,
      );
    }

    const result = await sendEnquiryOtpEmail(email, otp);
    if (!result.ok) {
      console.warn(`[otp] Resend delivery note for ${email}: ${result.error}`);
    }

    const jar = await cookies();
    const challengeToken = signChallenge({
      email,
      otpHash,
      expiresAt,
      attempts: 0,
    });
    jar.set("enquiry_otp_challenge", challengeToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 15,
    });
    if (dbChallengeId) {
      jar.set("enquiry_otp_challenge_id", String(dbChallengeId), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 15,
      });
    }

    return ok({ otpSent: true, message: `OTP sent to ${email}.` });
  });
}

export async function PUT(request: Request) {
  return guard(async () => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const email = String(body.email || "").trim().toLowerCase();
    const otp = String(body.otp || "").trim();

    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
      return badRequest("Enter a valid email address.");
    }
    if (!/^\d{6}$/.test(otp)) {
      return badRequest("Enter the 6-digit OTP.");
    }

    const jar = await cookies();
    let verified = false;
    let dbChallengeId: number | null = null;

    // 1. Check Database challenge if database is reachable
    try {
      await ensureDatabase();
      const challenge = (
        await db
          .select()
          .from(emailOtpChallenges)
          .where(eq(emailOtpChallenges.email, email))
          .orderBy(desc(emailOtpChallenges.createdAt))
          .limit(1)
      )[0];

      if (challenge) {
        dbChallengeId = challenge.id;
        if (challenge.expiresAt.getTime() < Date.now()) {
          return badRequest("OTP expired. Please request a new OTP.");
        }
        if (challenge.attempts >= 5) {
          return badRequest("Too many incorrect attempts. Please request a new OTP.");
        }

        const hash = hashOtp(otp);
        if (hash !== challenge.otpHash) {
          await db
            .update(emailOtpChallenges)
            .set({ attempts: challenge.attempts + 1 })
            .where(eq(emailOtpChallenges.id, challenge.id));
          return badRequest("Incorrect OTP. Please check your email and try again.");
        }

        await db
          .update(emailOtpChallenges)
          .set({ verifiedAt: new Date() })
          .where(eq(emailOtpChallenges.id, challenge.id));

        verified = true;
      }
    } catch {
      // Database not reachable, fallback to cryptographic session token
    }

    // 2. If DB was not used or not reached, check cryptographic session challenge cookie
    if (!verified) {
      const challengeCookie = jar.get("enquiry_otp_challenge")?.value;
      if (!challengeCookie) {
        return badRequest("No active OTP request for this email. Please request an OTP first.");
      }
      const token = verifyChallengeToken(challengeCookie);
      if (!token || token.email !== email) {
        return badRequest("No active OTP request for this email. Please request an OTP first.");
      }
      if (Date.now() > token.expiresAt) {
        return badRequest("OTP expired. Please request a new OTP.");
      }
      if (token.attempts >= 5) {
        return badRequest("Too many incorrect attempts. Please request a new OTP.");
      }

      const hash = hashOtp(otp);
      if (hash !== token.otpHash) {
        token.attempts += 1;
        jar.set("enquiry_otp_challenge", signChallenge(token), {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 60 * 15,
        });
        return badRequest("Incorrect OTP. Please check your email and try again.");
      }

      verified = true;
    }

    if (!verified) {
      return badRequest("OTP verification failed. Please request a new OTP.");
    }

    const verifiedToken = signVerifiedSession(email);
    jar.set("enquiry_otp_verified", dbChallengeId ? String(dbChallengeId) : verifiedToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 30,
    });
    jar.set("enquiry_otp_verified_token", verifiedToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 30,
    });

    return ok({ verified: true, verifiedToken, message: "Email verified successfully." });
  });
}


