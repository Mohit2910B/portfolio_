import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { homepageContent } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { guard, ok } from "@/lib/http";

export async function GET() {
  return guard(async () => {
    const rows = await db
      .select()
      .from(homepageContent)
      .where(eq(homepageContent.id, 1))
      .limit(1);

    const content = rows[0] || {
      id: 1,
      heroEyebrow: "VIDEO EDITOR / MOTION DESIGNER",
      heroHeading: "MOHIT BABARIYA",
      heroSubtitle: "Professional Video Editor & Motion Designer",
      heroDescription: "Crafting high-converting short-form reels, cinematic real estate films, YouTube edits, and commercial motion graphics worldwide.",
      heroCtaPrimary: "VIEW MY WORK",
      heroCtaSecondary: "LET'S WORK TOGETHER",
      heroMediaUrl: "",
      aboutHeading: "THE PERSON BEHIND THE WORK",
      aboutSubheading: "Passionate Storyteller & Visual Craftsman",
      aboutDescription: "I specialize in transforming raw footage into compelling visual narratives.",
      aboutExperienceYears: "2+",
      aboutProjectsCompleted: "150+",
      aboutClientsCount: "50+",
      servicesIntro: "Tailored video editing, motion graphics, and post-production solutions.",
      portfolioIntro: "Selected commercial, narrative, and motion graphics projects.",
      processIntro: "A proven, collaborative workflow...",
      contactIntro: "Have an upcoming video project? Let's create something exceptional together.",
      footerTagline: "CRAFTING VISUAL EXCELLENCE WORLDWIDE",
      footerCopyright: "© 2026 MOHIT BABARIYA. ALL RIGHTS RESERVED.",
    };

    return ok({ content });
  });
}

export async function PUT(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));

    const data = {
      heroEyebrow: (body.heroEyebrow || "VIDEO EDITOR / MOTION DESIGNER").toString(),
      heroHeading: (body.heroHeading || "MOHIT BABARIYA").toString(),
      heroSubtitle: (body.heroSubtitle || "").toString(),
      heroDescription: (body.heroDescription || "").toString(),
      heroCtaPrimary: (body.heroCtaPrimary || "VIEW MY WORK").toString(),
      heroCtaSecondary: (body.heroCtaSecondary || "LET'S WORK TOGETHER").toString(),
      heroMediaUrl: (body.heroMediaUrl || "").toString(),
      aboutHeading: (body.aboutHeading || "THE PERSON BEHIND THE WORK").toString(),
      aboutSubheading: (body.aboutSubheading || "").toString(),
      aboutDescription: (body.aboutDescription || "").toString(),
      aboutExperienceYears: (body.aboutExperienceYears || "2+").toString(),
      aboutProjectsCompleted: (body.aboutProjectsCompleted || "150+").toString(),
      aboutClientsCount: (body.aboutClientsCount || "50+").toString(),
      servicesIntro: (body.servicesIntro || "").toString(),
      portfolioIntro: (body.portfolioIntro || "").toString(),
      processIntro: (body.processIntro || "").toString(),
      contactIntro: (body.contactIntro || "").toString(),
      footerTagline: (body.footerTagline || "").toString(),
      footerCopyright: (body.footerCopyright || "").toString(),
      updatedAt: new Date(),
    };

    const updated = await db
      .insert(homepageContent)
      .values({ id: 1, ...data })
      .onConflictDoUpdate({
        target: homepageContent.id,
        set: data,
      })
      .returning();

    revalidatePath("/");
    return ok({ content: updated[0] });
  });
}
