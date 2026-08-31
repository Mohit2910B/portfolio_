import { ok } from "@/lib/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/** Public API endpoint for Carousel Items (returns 0 records when none exist) */
export async function GET() {
  return ok({ items: [], globalSettings: null });
}
