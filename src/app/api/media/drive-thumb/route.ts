export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id || !/^[a-zA-Z0-9_-]{20,}$/.test(id)) {
    return new Response("Invalid Drive File ID", { status: 400 });
  }

  try {
    const driveUrl = `https://drive.google.com/thumbnail?id=${id}&sz=w1200`;
    const response = await fetch(driveUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return new Response("Thumbnail fetch failed", { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const data = await response.arrayBuffer();

    return new Response(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, stale-while-revalidate=2592000",
      },
    });
  } catch (err: unknown) {
    return new Response(
      err instanceof Error ? err.message : "Error fetching thumbnail",
      { status: 500 }
    );
  }
}
