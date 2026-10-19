import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  getPortfolioSourceConfig,
  savePortfolioSourceConfig,
  parsePortfolioSource,
  runActiveSourceSync,
} from "@/lib/portfolioSource";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getPortfolioSourceConfig();
    const parsed = parsePortfolioSource(config.sourceUrl);

    return NextResponse.json({
      success: true,
      config,
      parsed,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Error reading source configuration" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const { sourceUrl, syncNow } = body;
    let saved = await getPortfolioSourceConfig();
    if (sourceUrl && typeof sourceUrl === "string" && sourceUrl.trim().length > 0) {
      saved = await savePortfolioSourceConfig(sourceUrl.trim());
    }

    let syncResult = null;
    if (syncNow !== false) {
      syncResult = await runActiveSourceSync(saved.sourceUrl);
    }

    revalidatePath("/");
    revalidatePath("/admin/categories");
    revalidatePath("/admin/portfolio");
    revalidatePath("/admin/dashboard");

    return NextResponse.json({
      success: true,
      config: saved,
      syncResult,
      message: syncResult
        ? syncResult.message
        : "Portfolio source configuration saved successfully!",
    });
  } catch (err: unknown) {
    console.error("[api/portfolio/source POST error]:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to update portfolio source",
      },
      { status: 500 }
    );
  }
}
