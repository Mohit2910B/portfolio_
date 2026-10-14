import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { enquiries } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { badRequest, guard, notFound, ok } from "@/lib/http";

async function sendEmailNotification(enquiry: {
  name: string;
  email: string;
  phone: string;
  projectType: string;
  description: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  try {
    const from = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const to = process.env.NOTIFICATION_EMAIL || "mohitbabariyaa@gmail.com";

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `New Project Enquiry from ${enquiry.name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0b0b0c; color: #f3f0e8; padding: 30px; border-radius: 8px;">
            <h2 style="color: #c7a56a; margin-top: 0;">NEW PROJECT ENQUIRY</h2>
            <p><strong>Name:</strong> ${enquiry.name}</p>
            <p><strong>Email:</strong> ${enquiry.email}</p>
            <p><strong>Phone:</strong> ${enquiry.phone || 'N/A'}</p>
            <p><strong>Project Type:</strong> ${enquiry.projectType || 'General'}</p>
            <p><strong>Message / Brief:</strong></p>
            <div style="background: #141416; padding: 15px; border-left: 3px solid #c7a56a; border-radius: 4px;">
              ${enquiry.description.replace(/\n/g, '<br/>')}
            </div>
            <hr style="border: none; border-top: 1px solid #222; margin: 25px 0;" />
            <p style="font-size: 12px; color: #8a8a8a;">Received via Mohit Babariya Creative Portfolio CMS.</p>
          </div>
        `,
      }),
    });
  } catch (err) {
    console.warn("[enquiry email] Failed to send email via Resend (safe ignore, enquiry saved in DB):", err);
  }
}

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

export async function POST(req: Request) {
  return guard(async () => {
    const body = await req.json().catch(() => ({}));

    const name = (body.name || "").toString().trim();
    const email = (body.email || "").toString().trim();
    const description = (body.description || body.message || "").toString().trim();

    if (!name || !email || !description) {
      return badRequest("Name, Email, and Message/Brief are required.");
    }

    const inserted = await db
      .insert(enquiries)
      .values({
        name,
        email,
        countryCode: (body.countryCode || "+91").toString(),
        phone: (body.phone || body.phoneNumber || "").toString(),
        company: (body.company || "").toString(),
        projectType: (body.projectType || body.selectedWork || "").toString(),
        description,
        budget: (body.budget || "").toString(),
        deadline: (body.deadline || "").toString(),
        status: "new",
      })
      .returning();

    const record = inserted[0];

    // Fire email notification in background safely
    sendEmailNotification({
      name: record.name,
      email: record.email,
      phone: record.phone,
      projectType: record.projectType,
      description: record.description,
    }).catch(() => {});

    return ok({ success: true, enquiry: record });
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
