import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contactSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { guard, ok } from "@/lib/http";

export async function GET() {
  return guard(async () => {
    const rows = await db
      .select()
      .from(contactSettings)
      .where(eq(contactSettings.id, 1))
      .limit(1);

    const settings = rows[0] || {
      id: 1,
      email: "mohitbabariyaa@gmail.com",
      countryCode: "+91",
      phone: "+91 98765 43210",
      whatsapp: "+91 98765 43210",
      location: "Mumbai, India / Remote Worldwide",
      instagram: "https://instagram.com/mohitbabariya",
      youtube: "https://youtube.com/@mohitbabariya",
      linkedin: "https://linkedin.com/in/mohitbabariya",
      responseTime: "Within 24 Hours",
      notificationEmail: "mohitbabariyaa@gmail.com",
      isEmailEnabled: true,
    };

    return ok({ settings });
  });
}

export async function PUT(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));

    const data = {
      email: (body.email || "mohitbabariyaa@gmail.com").toString(),
      countryCode: (body.countryCode || "+91").toString(),
      phone: (body.phone || "").toString(),
      whatsapp: (body.whatsapp || "").toString(),
      location: (body.location || "").toString(),
      instagram: (body.instagram || "").toString(),
      youtube: (body.youtube || "").toString(),
      linkedin: (body.linkedin || "").toString(),
      responseTime: (body.responseTime || "Within 24 Hours").toString(),
      notificationEmail: (body.notificationEmail || "mohitbabariyaa@gmail.com").toString(),
      isEmailEnabled: body.isEmailEnabled !== undefined ? Boolean(body.isEmailEnabled) : true,
      updatedAt: new Date(),
    };

    const updated = await db
      .insert(contactSettings)
      .values({ id: 1, ...data })
      .onConflictDoUpdate({
        target: contactSettings.id,
        set: data,
      })
      .returning();

    return ok({ settings: updated[0] });
  });
}
