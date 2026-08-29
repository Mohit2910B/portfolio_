import { and, desc, eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { enquiries } from "@/db/schema";
import { ensureDatabase } from "@/lib/bootstrap";
import { getCurrentAdmin } from "@/lib/auth";
import {
  badRequest,
  clientIp,
  created,
  guard,
  ok,
  rateLimit,
  serverError,
  str,
} from "@/lib/http";
import { sendAdminNotification } from "@/lib/notifications";
import { verifyVerifiedSession } from "@/lib/otp";
import { validatePhone } from "@/lib/phone";
import { emailOtpChallenges } from "@/db/schema";

export const dynamic = "force-dynamic";

type Payload = {
  name?: unknown;
  email?: unknown;
  countryCode?: unknown;
  phoneNumber?: unknown;
  company?: unknown;
  selectedWork?: unknown;
  description?: unknown;
  referenceUrl?: unknown;
  deadline?: unknown;
  source?: unknown;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function validateEnquiry(payload: Payload) {
  const errors: Record<string, string> = {};
  const name = str(payload.name);
  const email = str(payload.email).toLowerCase();
  const countryCode = str(payload.countryCode, "+91") || "+91";
  const phoneRaw = str(payload.phoneNumber).replace(/[\s-()]/g, "");
  const description = str(payload.description);
  const work = Array.isArray(payload.selectedWork)
    ? payload.selectedWork.map((w) => str(w)).filter(Boolean)
    : [];

  if (name.length < 2) errors.name = "Please enter your full name.";
  if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
  if (!/^\+?[0-9]{1,4}$/.test(countryCode)) errors.countryCode = "Select a country code.";
  const phoneError = validatePhone(countryCode, phoneRaw);
  if (phoneError) errors.phoneNumber = phoneError;
  if (work.length === 0) errors.selectedWork = "Select at least one type of work.";
  if (description.length < 15) errors.description = "Tell me a little more (min. 15 characters).";

  return {
    errors,
    values: {
      name,
      email,
      countryCode,
      phoneNumber: phoneRaw,
      company: str(payload.company),
      selectedWork: JSON.stringify(work),
      description,
      referenceUrl: str(payload.referenceUrl),
      deadline: str(payload.deadline),
      source: str(payload.source),
    },
  };
}

/** Public: submit an enquiry. */
export async function POST(request: Request) {
  return guard(async () => {
    if (!rateLimit(`enquiry:${clientIp(request)}`, 8, 10 * 60 * 1000)) {
      return badRequest("Too many submissions. Please try again in a few minutes.");
    }

    let payload: Payload;
    try {
      payload = (await request.json()) as Payload;
    } catch {
      return badRequest("Invalid request body.");
    }

    const { errors, values } = validateEnquiry(payload);
    if (Object.keys(errors).length > 0) {
      return badRequest("Please fix the highlighted fields.", errors);
    }

    const jar = await cookies();
    const verifiedValue = jar.get("enquiry_otp_verified")?.value || "";
    const verifiedToken = jar.get("enquiry_otp_verified_token")?.value || "";

    let isVerified = false;

    // Check signed cryptographic session token
    if (
      verifyVerifiedSession(verifiedValue, values.email) ||
      verifyVerifiedSession(verifiedToken, values.email)
    ) {
      isVerified = true;
    }

    // Also check database challenge record if numeric ID
    const verifiedId = Number(verifiedValue);
    if (!isVerified && Number.isInteger(verifiedId) && verifiedId > 0) {
      try {
        await ensureDatabase();
        const verified = await db
          .select({
            id: emailOtpChallenges.id,
            email: emailOtpChallenges.email,
            verifiedAt: emailOtpChallenges.verifiedAt,
          })
          .from(emailOtpChallenges)
          .where(eq(emailOtpChallenges.id, verifiedId))
          .limit(1);
        if (verified[0]?.verifiedAt && verified[0].email === values.email) {
          isVerified = true;
        }
      } catch {
        // DB check skipped
      }
    }

    if (!isVerified) {
      return badRequest("Please verify your email address with OTP first.", {
        email: "Email OTP verification is required.",
      });
    }

    let insertedRecord = null;
    try {
      await ensureDatabase();
      const inserted = await db.insert(enquiries).values(values).returning();
      insertedRecord = inserted[0];
    } catch (err) {
      console.warn("[enquiries] Database save failed, sending email notification:", err);
    }

    void sendAdminNotification(
      "New project enquiry",
      `<h2>New project enquiry</h2><p><b>${values.name}</b> submitted an enquiry.</p><p>Email: ${values.email}</p><p>Phone: ${values.countryCode} ${values.phoneNumber}</p><p>Work: ${values.selectedWork}</p><p>${values.description}</p>`,
    );

    return created({
      enquiry: insertedRecord || { id: Date.now(), ...values },
      message: "Enquiry received. I will reply shortly.",
    });
  });
}

/** Admin-only listing (guarded here so the public API stays closed). */
export async function GET() {
  return guard(async () => {
    const admin = await getCurrentAdmin();
    if (!admin) return serverError("Authentication required");
    const rows = await db.select().from(enquiries).orderBy(desc(enquiries.createdAt));
    const unread = rows.filter((r) => r.status === "new").length;
    return ok({ enquiries: rows, unread });
  });
}

/** Admin-only status updates. */
export async function PATCH(request: Request) {
  return guard(async () => {
    const admin = await getCurrentAdmin();
    if (!admin) return serverError("Authentication required");
    const body = (await request.json()) as { id?: unknown; status?: unknown };
    const id = Number(body.id);
    const status = str(body.status);
    if (!Number.isInteger(id)) return badRequest("Invalid enquiry id.");
    if (!["new", "read", "archived"].includes(status)) return badRequest("Invalid status.");
    const updated = await db
      .update(enquiries)
      .set({ status })
      .where(and(eq(enquiries.id, id), sql`true`))
      .returning();
    if (!updated[0]) return badRequest("Enquiry not found.");
    return ok({ enquiry: updated[0] });
  });
}
