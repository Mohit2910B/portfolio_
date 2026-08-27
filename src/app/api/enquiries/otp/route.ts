import { createHash } from "crypto";
import { cookies } from "next/headers";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { emailOtpChallenges } from "@/db/schema";
import { guard, badRequest, ok } from "@/lib/http";
import { sendEnquiryOtpEmail } from "@/lib/notifications";
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

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = createHash("sha256").update(otp).digest("hex");

    await db.insert(emailOtpChallenges).values({
      email,
      purpose: "enquiry",
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    const sent = await sendEnquiryOtpEmail(email, otp);
    if (!sent) {
      return badRequest("Email OTP could not be sent. Check RESEND_API_KEY and EMAIL_FROM in .env.local.");
    }

    return ok({ otpSent: true, message: `OTP sent to ${email}.` });
  });
}

export async function PUT(request: Request) {
  return guard(async () => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const email = String(body.email || "").trim().toLowerCase();
    const otp = String(body.otp || "");

    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
      return badRequest("Enter a valid email address.");
    }
    if (!/^\d{6}$/.test(otp)) {
      return badRequest("Enter the 6-digit OTP.");
    }

    const challenge = (
      await db
        .select()
        .from(emailOtpChallenges)
        .where(eq(emailOtpChallenges.email, email))
        .orderBy(desc(emailOtpChallenges.createdAt))
        .limit(1)
    )[0];

    if (!challenge) return badRequest("No active OTP request.");
    if (challenge.expiresAt.getTime() < Date.now()) return badRequest("OTP expired. Please request a new OTP.");
    if (challenge.attempts >= 5) return badRequest("Too many incorrect attempts. Please request a new OTP.");

    const hash = createHash("sha256").update(otp).digest("hex");
    if (hash !== challenge.otpHash) {
      await db
        .update(emailOtpChallenges)
        .set({ attempts: challenge.attempts + 1 })
        .where(eq(emailOtpChallenges.id, challenge.id));
      return badRequest("Incorrect OTP.");
    }

    await db
      .update(emailOtpChallenges)
      .set({ verifiedAt: new Date() })
      .where(eq(emailOtpChallenges.id, challenge.id));

    const jar = await cookies();
    jar.set("enquiry_otp_verified", String(challenge.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 30,
    });

    return ok({ verified: true });
  });
}
