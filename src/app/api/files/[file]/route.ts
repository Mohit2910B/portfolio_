import fs from "node:fs";
import fsp from "node:fs/promises";
import { Readable } from "node:stream";
import { contentTypeFor, resolveStoredPath, ensureUploadDir } from "@/lib/storage";
import { guard, notFound } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * Serves uploaded media from the server storage folder.
 * Supports HTTP range requests so video seeking works properly.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  return guard(async () => {
    await ensureUploadDir();
    const { file } = await params;
    const target = resolveStoredPath(decodeURIComponent(file));
    if (!target) return notFound("Invalid file name.");

    let stat;
    try {
      stat = await fsp.stat(target);
    } catch {
      return notFound("File not found.");
    }
    if (!stat.isFile()) return notFound("File not found.");

    const type = contentTypeFor(target);
    const range = request.headers.get("range");

    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      const start = match && match[1] ? Number(match[1]) : 0;
      const end = match && match[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1;
      if (Number.isNaN(start) || start > end || start >= stat.size) {
        return new Response(null, {
          status: 416,
          headers: { "content-range": `bytes */${stat.size}` },
        });
      }
      const stream = Readable.toWeb(
        fs.createReadStream(target, { start, end }),
      ) as unknown as ReadableStream;
      return new Response(stream, {
        status: 206,
        headers: {
          "content-type": type,
          "content-length": String(end - start + 1),
          "content-range": `bytes ${start}-${end}/${stat.size}`,
          "accept-ranges": "bytes",
          "cache-control": "public, max-age=31536000, immutable",
        },
      });
    }

    const stream = Readable.toWeb(fs.createReadStream(target)) as unknown as ReadableStream;
    return new Response(stream, {
      status: 200,
      headers: {
        "content-type": type,
        "content-length": String(stat.size),
        "accept-ranges": "bytes",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  });
}
