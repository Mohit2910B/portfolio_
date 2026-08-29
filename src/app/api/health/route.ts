import { db, getDatabaseResolution } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const resolution = getDatabaseResolution();
  const hasResend = Boolean(process.env.RESEND_API_KEY?.trim());

  try {
    await db.execute(sql`select 1`);
    return Response.json({
      status: "healthy",
      database: {
        connected: true,
        type: resolution.type,
      },
      email: {
        configured: hasResend,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return Response.json(
      {
        status: "unhealthy",
        database: {
          connected: false,
          type: resolution.type,
          error: msg.includes("Production database is not configured")
            ? "DATABASE_URL not configured with a remote PostgreSQL instance in Netlify environment variables"
            : "Database connection unreachable",
        },
        email: {
          configured: hasResend,
        },
      },
      { status: 503 },
    );
  }
}

