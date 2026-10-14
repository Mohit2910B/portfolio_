import { NextResponse } from "next/server";
import {
  getAllVideoOverrides,
  saveVideoOverride,
  deleteVideoOverride,
} from "@/lib/videoOverrides";
import { syncGoogleDriveFolders } from "@/lib/driveSync";

export const dynamic = "force-dynamic";

export async function GET() {
  const overrides = getAllVideoOverrides();
  return NextResponse.json({ success: true, overrides });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key, driveFileId, projectTitle, projectId, videoUrl, thumbnailUrl, aspectRatio } = body;

    const lookupKey = key || driveFileId || projectTitle || String(projectId);
    if (!lookupKey || !videoUrl) {
      return NextResponse.json(
        { success: false, error: "Missing video key or high-quality videoUrl" },
        { status: 400 }
      );
    }

    const saved = saveVideoOverride(lookupKey, {
      driveFileId: driveFileId || (key && key.length > 15 ? key : undefined),
      projectTitle,
      projectId,
      videoUrl,
      thumbnailUrl,
      aspectRatio: aspectRatio || "9:16",
    });

    // Invalidate Drive sync cache so live website sees changes immediately
    try {
      await syncGoogleDriveFolders(undefined, true);
    } catch {}

    return NextResponse.json({
      success: true,
      message: "High-quality video replaced successfully!",
      override: saved,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Error saving override" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    if (!key) {
      return NextResponse.json({ success: false, error: "Missing key parameter" }, { status: 400 });
    }

    const deleted = deleteVideoOverride(key);

    try {
      await syncGoogleDriveFolders(undefined, true);
    } catch {}

    return NextResponse.json({
      success: true,
      message: deleted ? "Reverted back to original Google Drive video." : "Override not found.",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Error deleting override" },
      { status: 500 }
    );
  }
}
