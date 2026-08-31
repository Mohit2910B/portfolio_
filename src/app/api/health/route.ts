import { getDatabaseResolution, getPool } from "@/db";
import { ensureDatabase } from "@/lib/bootstrap";
import { getResendApiKey } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  const resolution = getDatabaseResolution();
  const hasResend = Boolean(getResendApiKey());

  let dbStatus: "connected" | "error" = "error";
  let dbError: string | null = null;
  let counts: Record<string, number> = {};

  try {
    await ensureDatabase();
    const pool = getPool();
    await pool.query("SELECT 1 AS ok");
    dbStatus = "connected";

    // Fetch counts from real tables
    const countQuery = await pool.query(`
      SELECT 
        (SELECT count(*)::int FROM categories) AS categories,
        (SELECT count(*)::int FROM services) AS services,
        (SELECT count(*)::int FROM chat_conversations) AS chats,
        (SELECT count(*)::int FROM inquiries) AS enquiries
    `);
    const rawCounts = countQuery.rows?.[0] || {};
    counts = {
      categories: Number(rawCounts.categories ?? 0),
      services: Number(rawCounts.services ?? 0),
      chats: Number(rawCounts.chats ?? 0),
      enquiries: Number(rawCounts.enquiries ?? 0),
    };
  } catch (err) {
    dbStatus = "error";
    const causeMsg = (err as { cause?: { message?: string } })?.cause?.message;
    dbError = causeMsg
      ? `${err instanceof Error ? err.message : String(err)} [Cause: ${causeMsg}]`
      : err instanceof Error
        ? err.message
        : String(err);
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


