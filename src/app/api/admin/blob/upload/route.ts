import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { mediaFiles, projects } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json().catch(() => ({}))) as HandleUploadBody & {
    registerOnly?: boolean;
    url?: string;
    filename?: string;
    size?: number;
    kind?: string;
    projectId?: number;
  };

  // 1. Manual registration endpoint after direct blob upload
  if (body.registerOnly && body.url && body.filename) {
    try {
      await requireAdmin();
      const mime = body.kind === "video" ? "video/mp4" : "image/jpeg";
      const rows = await db
        .insert(mediaFiles)
        .values({
          filename: body.filename,
          originalName: body.filename,
          mimeType: mime,
          kind: body.kind || "image",
          size: body.size || 0,
          url: body.url,
        })
        .returning();

      const media = rows[0];
      if (body.projectId) {
        if (body.kind === "video") {
          await db
            .update(projects)
            .set({ videoUrl: body.url, videoSource: "url" })
            .where(eq(projects.id, body.projectId));
        } else {
          await db
            .update(projects)
            .set({ thumbnailUrl: body.url })
            .where(eq(projects.id, body.projectId));
        }
      }

      return NextResponse.json({ url: body.url, kind: body.kind || "image", media });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to register media." },
        { status: 500 },
      );
    }
  }

  // 2. Vercel Blob client-upload token generator
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const admin = await requireAdmin();
        if (!admin) {
          throw new Error("Unauthorized");
        }
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "image/svg+xml",
            "video/mp4",
            "video/webm",
            "video/quicktime",
            "video/x-matroska",
          ],
          maximumSizeInBytes: 300 * 1024 * 1024, // 300MB
        };
      },
      onUploadCompleted: async ({ blob }) => {
        try {
          const isVideo =
            blob.contentType.startsWith("video/") ||
            blob.pathname.match(/\.(mp4|webm|mov|mkv)$/i);
          await db
            .insert(mediaFiles)
            .values({
              filename: blob.pathname,
              originalName: blob.pathname.split("/").pop() || blob.pathname,
              mimeType: blob.contentType || (isVideo ? "video/mp4" : "image/jpeg"),
              kind: isVideo ? "video" : "image",
              size: 0,
              url: blob.url,
            })
            .onConflictDoNothing();
        } catch (error) {
          console.warn("[blob] onUploadCompleted error:", error);
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
