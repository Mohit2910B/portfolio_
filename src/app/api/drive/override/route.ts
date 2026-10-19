import { NextResponse } from "next/server";
import { eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { portfolioProjects } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db
      .select({
        id: portfolioProjects.id,
        driveFileId: portfolioProjects.driveFileId,
        title: portfolioProjects.title,
        videoUrl: portfolioProjects.videoUrl,
        thumbnailUrl: portfolioProjects.thumbnailUrl,
        isReplacement: portfolioProjects.isReplacement,
      })
      .from(portfolioProjects)
      .where(eq(portfolioProjects.isReplacement, true));

    const overrides: Record<string, any> = {};
    for (const r of rows) {
      if (r.driveFileId) {
        overrides[r.driveFileId] = r;
      }
      overrides[String(r.id)] = r;
    }

    return NextResponse.json({ success: true, overrides });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Error reading overrides" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const { key, driveFileId, projectTitle, projectId, videoUrl, thumbnailUrl, aspectRatio } = body;

    const lookupKey = driveFileId || key || (projectId ? String(projectId) : null);
    if (!lookupKey || !videoUrl) {
      return NextResponse.json(
        { success: false, error: "Missing video ID/key or replacement videoUrl" },
        { status: 400 }
      );
    }

    // Validate videoUrl format
    const trimmedUrl = String(videoUrl).trim();
    if (
      !trimmedUrl.startsWith("http://") &&
      !trimmedUrl.startsWith("https://") &&
      !trimmedUrl.startsWith("/uploads/") &&
      !trimmedUrl.startsWith("/")
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid video URL format. Must start with http://, https://, or /uploads/" },
        { status: 400 }
      );
    }

    // Find project by id or driveFileId or title
    let condition = driveFileId ? eq(portfolioProjects.driveFileId, driveFileId) : undefined;
    if (!condition && projectId && !isNaN(Number(projectId))) {
      condition = eq(portfolioProjects.id, Number(projectId));
    }
    if (!condition && key) {
      condition = or(
        eq(portfolioProjects.driveFileId, key),
        sql`LOWER(${portfolioProjects.title}) = LOWER(${key})`
      );
    }

    const now = new Date();
    const updateData: any = {
      videoUrl: trimmedUrl,
      isReplacement: true,
      updatedAt: now,
    };

    if (thumbnailUrl && String(thumbnailUrl).trim()) {
      updateData.thumbnailUrl = String(thumbnailUrl).trim();
    }
    if (aspectRatio) {
      updateData.aspectRatio = String(aspectRatio).trim();
    }

    let updatedRow: any = null;

    if (condition) {
      const updated = await db
        .update(portfolioProjects)
        .set(updateData)
        .where(condition)
        .returning();

      if (updated.length > 0) {
        updatedRow = updated[0];
      }
    }

    // If no existing project record matched, insert a new project record rather than dropping it
    if (!updatedRow) {
      const inserted = await db
        .insert(portfolioProjects)
        .values({
          title: projectTitle || key || "Portfolio Project",
          videoUrl: trimmedUrl,
          thumbnailUrl: thumbnailUrl || "",
          aspectRatio: aspectRatio || "9:16",
          driveFileId: driveFileId || (key && key.length > 15 ? key : null),
          isReplacement: true,
          isPublished: true,
          sortOrder: 1,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      updatedRow = inserted[0];
    }

    revalidatePath("/");
    revalidatePath("/admin/categories");
    revalidatePath("/admin/portfolio");

    return NextResponse.json({
      success: true,
      message: "High-quality video replaced successfully in database!",
      project: updatedRow,
    });
  } catch (err: unknown) {
    console.error("[drive/override POST error]:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Error saving replacement" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const id = searchParams.get("id");

    if (!key && !id) {
      return NextResponse.json({ success: false, error: "Missing key or id parameter" }, { status: 400 });
    }

    let condition = id ? eq(portfolioProjects.id, Number(id)) : undefined;
    if (!condition && key) {
      condition = or(
        eq(portfolioProjects.driveFileId, key),
        sql`LOWER(${portfolioProjects.title}) = LOWER(${key})`
      );
    }

    if (condition) {
      // Find the project to get its original driveFileId
      const found = await db.select().from(portfolioProjects).where(condition).limit(1);
      if (found.length > 0) {
        const proj = found[0];
        const originalDriveUrl = proj.driveFileId
          ? `https://drive.google.com/uc?id=${proj.driveFileId}&export=download`
          : proj.videoUrl;

        await db
          .update(portfolioProjects)
          .set({
            isReplacement: false,
            videoUrl: originalDriveUrl,
            updatedAt: new Date(),
          })
          .where(condition);
      }
    }

    revalidatePath("/");
    revalidatePath("/admin/categories");
    revalidatePath("/admin/portfolio");

    return NextResponse.json({
      success: true,
      message: "Reverted back to original Google Drive video.",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Error deleting override" },
      { status: 500 }
    );
  }
}
