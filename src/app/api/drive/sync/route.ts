import { NextResponse } from "next/server";
import { syncGoogleDriveFolders, DEFAULT_ROOT_FOLDER_ID } from "@/lib/driveSync";
import { db } from "@/db";
import { categories, portfolioProjects } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId") || DEFAULT_ROOT_FOLDER_ID;
  const force = searchParams.get("force") === "true";

  try {
    const result = await syncGoogleDriveFolders(folderId, force);
    return NextResponse.json({
      success: true,
      folderId: result.folderId,
      source: result.source,
      lastSyncedAt: new Date(result.lastSyncedAt).toISOString(),
      categoriesCount: result.categories.length,
      projectsCount: result.projects.length,
      categories: result.categories,
      projects: result.projects,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Sync error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const folderId = body.folderId || DEFAULT_ROOT_FOLDER_ID;

    // Force live fetch from Drive
    const result = await syncGoogleDriveFolders(folderId, true);

    // If database is available, update database tables
    try {
      for (const cat of result.categories) {
        await db
          .insert(categories)
          .values({
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            sortOrder: cat.sortOrder,
            isActive: true,
          })
          .onConflictDoUpdate({
            target: categories.slug,
            set: {
              name: cat.name,
              description: cat.description,
              sortOrder: cat.sortOrder,
              isActive: true,
            },
          })
          .catch(() => {});
      }
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${result.categories.length} Google Drive folders & ${result.projects.length} videos!`,
      folderId: result.folderId,
      source: result.source,
      lastSyncedAt: new Date(result.lastSyncedAt).toISOString(),
      categoriesCount: result.categories.length,
      projectsCount: result.projects.length,
      categories: result.categories,
      projects: result.projects,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Sync failed",
      },
      { status: 500 }
    );
  }
}
