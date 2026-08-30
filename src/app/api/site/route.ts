import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { workOptions } from "@/db/schema";
import { getSiteData } from "@/lib/data";
import { guard, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Public aggregate payload used by the website and live previews. */
export async function GET() {
  return guard(async () => {
    const data = await getSiteData();
    return ok({
      homepage: data.homepage,
      contact: data.contact,
      theme: data.theme,
      categories: data.categories,
      projects: data.projects,
      services: data.services,
      softwareTools: data.softwareTools,
      workOptions: data.workOptions,
      sections: data.sections,
      carouselSettings: data.carouselSettings,
      carouselGlobalSettings: data.carouselGlobalSettings,
    });
  });
}

/** Public list of enquiry work-type options (used by the contact form). */
export async function POST() {
  return guard(async () => {
    const rows = await db
      .select()
      .from(workOptions)
      .where(eq(workOptions.isActive, true))
      .orderBy(asc(workOptions.sortOrder));
    return ok({ workOptions: rows });
  });
}
