import { NextResponse } from "next/server";
import { AuthRequiredError } from "@/lib/auth";

export type ApiError = { error: string; details?: Record<string, string> };

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function badRequest(message: string, details?: Record<string, string>) {
  return NextResponse.json<ApiError>({ error: message, details }, { status: 400 });
}

export function unauthorized(message = "Authentication required") {
  return NextResponse.json<ApiError>({ error: message }, { status: 401 });
}

export function forbidden(message = "You do not have access to this resource") {
  return NextResponse.json<ApiError>({ error: message }, { status: 403 });
}

export function notFound(message = "Resource not found") {
  return NextResponse.json<ApiError>({ error: message }, { status: 404 });
}

export function conflict(message: string) {
  return NextResponse.json<ApiError>({ error: message }, { status: 409 });
}

export function serverError(message = "Something went wrong on the server") {
  return NextResponse.json<ApiError>({ error: message }, { status: 500 });
}

function extractErrorMessage(error: unknown): string {
  if (!error) return "";
  let msg = "";
  if (error instanceof Error) {
    msg = error.message;
    if (error.cause) {
      const causeMsg = error.cause instanceof Error ? error.cause.message : String(error.cause);
      msg += " " + causeMsg;
    }
  } else {
    msg = String(error);
  }
  return msg;
}

/** Wraps a route handler so API routes never leak HTML error pages or technical DB strings. */
export async function guard(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AuthRequiredError) return error.response;
    const message = extractErrorMessage(error);
    console.error("[api]", message);
    if (/duplicate key/i.test(message)) {
      return conflict("That record already exists.");
    }
    if (/relation .* does not exist|DatabaseNotConfiguredError|Production database is not configured|ECONNREFUSED|password authentication|ENOTFOUND|getaddrinfo/i.test(message)) {
      return serverError("Service temporarily unavailable. Please try again in a moment.");
    }
    return serverError("Unable to complete request right now. Please try again.");
  }
}

export function str(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
}

export function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

export function bool(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || `item-${Date.now().toString(36)}`
  );
}

/* ---------------------------- rate limiting ---------------------------- */

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

export function clientIp(request: Request): string {
  const header =
    request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "local";
  return header.split(",")[0]?.trim() || "local";
}
