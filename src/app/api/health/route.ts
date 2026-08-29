import { db, getDatabaseResolution } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const resolution = getDatabaseResolution();
  const hasResend = Boolean(process.env.RESEND_API_KEY?.trim());

  let dbStatus: "connected" | "error" = "error";
  try {
    await db.execute(sql`select 1`);
    dbStatus = "connected";
  } catch {
    dbStatus = "error";
  }

  const emailStatus: "configured" | "not_configured" = hasResend
    ? "configured"
    : "not_configured";

  const isHealthy = dbStatus === "connected" && emailStatus === "configured";

  return Response.json(
    {
      status: isHealthy ? "ok" : "degraded",
      database: dbStatus,
      email: emailStatus,
      resolution: resolution.type,
    },
    { status: 200 },
  );
}


