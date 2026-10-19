import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { enquiries } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { badRequest, clientIp, guard, notFound, ok, rateLimit } from "@/lib/http";
import { sendProjectInquiryEmail } from "@/lib/emailService";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const query = searchParams.get("q")?.trim();

    const conditions = [];

    if (status && status !== "all") {
      conditions.push(eq(enquiries.status, status));
    }

    if (query) {
      conditions.push(
        or(
          ilike(enquiries.name, `%${query}%`),
          ilike(enquiries.email, `%${query}%`),
          ilike(enquiries.company, `%${query}%`),
          ilike(enquiries.description, `%${query}%`)
        )
      );
    }

    const list = await db
      .select()
      .from(enquiries)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(enquiries.createdAt));

    return ok({ enquiries: list });
  });
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

export async function POST(req: Request) {
  return guard(async () => {
    const ip = clientIp(req);

    // 1. Rate Limiting: Max 5 submissions per 10 minutes per IP
    const allowed = rateLimit(`enquiries:${ip}`, 5, 10 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        {
          error: "Too many project briefs submitted. Please wait a few moments before trying again.",
          code: "RATE_LIMITED",
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));

    // 2. Spam Bot Protection: Check hidden honeypot fields
    if (body._hp || body.honeypot || body.website) {
      console.warn(`[enquiries] Spam submission blocked from IP ${ip} via honeypot.`);
      return badRequest("Submission rejected.");
    }

    // 3. Field Extraction & Sanitization
    const name = (body.name || "").toString().trim().slice(0, 100);
    const email = (body.email || "").toString().trim().toLowerCase().slice(0, 254);
    const phone = (body.phone || body.phoneNumber || "").toString().trim().slice(0, 40);
    const countryCode = (body.countryCode || "+91").toString().trim().slice(0, 10);
    const company = (body.company || "").toString().trim().slice(0, 150);
    const projectType = (body.projectType || body.category || "General Inquiry").toString().trim().slice(0, 100);
    const deadline = (body.deadline || body.timeline || "Flexible").toString().trim().slice(0, 80);
    const budget = (body.budget || "").toString().trim().slice(0, 80);
    const description = (body.description || body.message || "").toString().trim().slice(0, 5000);

    // 4. Server-Side Validation
    if (!name || name.length < 2) {
      return badRequest("Please enter your name (at least 2 characters).", { field: "name" });
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      return badRequest("Please enter a valid email address.", { field: "email" });
    }

    if (!description || description.length < 5) {
      return badRequest("Please provide your project details & requirements (at least 5 characters).", { field: "description" });
    }

    // 5. Resilient Database Storage
    // Saves to PostgreSQL if database is reachable; gracefully logs and proceeds if DB is unconfigured/down.
    let dbRecord = null;
    try {
      const inserted = await db
        .insert(enquiries)
        .values({
          name,
          email,
          countryCode,
          phone,
          company,
          projectType,
          description,
          budget,
          deadline,
          status: "new",
        })
        .returning();

      if (inserted && inserted[0]) {
        dbRecord = inserted[0];
        console.log(`[enquiries] Project inquiry #${dbRecord.id} saved in database.`);
      }
    } catch (dbErr) {
      console.warn(
        "[enquiries] Database save skipped or unavailable (continuing to email delivery):",
        dbErr instanceof Error ? dbErr.message : dbErr
      );
    }

    // 6. Reliable Email Delivery to Mohitbabariyaa@gmail.com
    const emailResult = await sendProjectInquiryEmail({
      name,
      email,
      phone,
      countryCode,
      company,
      projectType,
      deadline,
      budget,
      description,
      clientIp: ip,
    });

    // 7. Verify Genuine Acceptance
    if (emailResult.success) {
      return ok({
        success: true,
        message: "Thank you! Your project inquiry has been received. Mohit will get back to you promptly.",
        enquiryId: dbRecord?.id || null,
        delivered: true,
      });
    }

    // 8. If Email Delivery Failed or Email Provider is Unconfigured
    console.error(
      `[enquiries] Email delivery failed for inquiry from ${email}:`,
      emailResult.error || "Unknown error"
    );

    return NextResponse.json(
      {
        error: "Unable to dispatch your project brief at this moment. Please email Mohit directly at Mohitbabariyaa@gmail.com or message on WhatsApp at +91 90338 28412.",
        code: emailResult.unconfigured ? "EMAIL_SERVICE_UNCONFIGURED" : "EMAIL_DELIVERY_FAILED",
        delivered: false,
        savedLocally: Boolean(dbRecord),
      },
      { status: 503 }
    );
  });
}

export async function PATCH(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));

    const id = Number(body.id);
    const status = (body.status || "read").toString();

    if (!id) return badRequest("Enquiry ID is required.");

    const updated = await db
      .update(enquiries)
      .set({ status })
      .where(eq(enquiries.id, id))
      .returning();

    if (!updated.length) return notFound("Enquiry not found.");

    return ok({ enquiry: updated[0] });
  });
}

export async function DELETE(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id) return badRequest("Enquiry ID is required.");

    const deleted = await db
      .delete(enquiries)
      .where(eq(enquiries.id, id))
      .returning();

    if (!deleted.length) return notFound("Enquiry not found.");

    return ok({ success: true, deleted: deleted[0] });
  });
}
