import { db, getDatabaseResolution } from "@/db";
import { sql } from "drizzle-orm";
import { ensureDatabase } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";

export async function GET() {
  const resolution = getDatabaseResolution();
  const hasResend = Boolean(process.env.RESEND_API_KEY?.trim());

  let dbStatus: "connected" | "error" = "error";
  let dbError: string | null = null;
  let counts: Record<string, number> = {};

  try {
    await ensureDatabase();
    const res = await db.execute(sql`SELECT 1 AS ok`);
    if (res) dbStatus = "connected";

    // Fetch counts from real tables
    const countQuery = await db.execute(sql`
      SELECT 
        (SELECT count(*)::int FROM projects) AS projects,
        (SELECT count(*)::int FROM categories) AS categories,
        (SELECT count(*)::int FROM services) AS services,
        (SELECT count(*)::int FROM chat_conversations) AS chats,
        (SELECT count(*)::int FROM inquiries) AS enquiries
    `);
    const rawCounts = (countQuery as { rows?: Record<string, number>[] }).rows?.[0] || {};
    counts = {
      projects: Number(rawCounts.projects ?? 0),
      categories: Number(rawCounts.categories ?? 0),
      services: Number(rawCounts.services ?? 0),
      chats: Number(rawCounts.chats ?? 0),
      enquiries: Number(rawCounts.enquiries ?? 0),
    };
  } catch (err) {
    dbStatus = "error";
    dbError = err instanceof Error ? err.message : String(err);
  }

  const emailStatus: "configured" | "not_configured" = hasResend
    ? "configured"
    : "not_configured";

  const isHealthy = dbStatus === "connected" && emailStatus === "configured";

  return Response.json(
    {
      status: isHealthy ? "ok" : "degraded",
      database: dbStatus,
      databaseResolution: resolution.type,
      databaseError: dbError,
      tableRecords: counts,
      email: emailStatus,
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}


