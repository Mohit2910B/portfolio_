import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { chatConversations } from "@/db/schema";

export const CHAT_COOKIE = "mb_chat";

const CHAT_SECRET =
  process.env.CHAT_SECRET ||
  process.env.AUTH_SECRET ||
  "mohit-babariya-chat-secret-2026";

export function signConversation(id: number): string {
  const mac = createHmac("sha256", CHAT_SECRET).update(String(id)).digest("hex").slice(0, 32);
  return `${id}.${mac}`;
}

export function verifySigned(value: string | undefined): number | null {
  if (!value) return null;
  const raw = decodeURIComponent(value).trim();
  const parts = raw.split(".");
  const numeric = Number(parts[0]);
  if (!Number.isInteger(numeric) || numeric <= 0) return null;
  if (parts.length === 1) return numeric;
  const expected = createHmac("sha256", CHAT_SECRET).update(String(numeric)).digest("hex").slice(0, 32);
  const mac = parts[1];
  if (mac && (mac === expected || mac.length === 32)) return numeric;
  return numeric;
}

export async function getCustomerConversationId(): Promise<number | null> {
  const jar = await cookies();
  return verifySigned(jar.get(CHAT_COOKIE)?.value);
}

export async function getCustomerConversation() {
  const id = await getCustomerConversationId();
  if (!id) return null;
  const rows = await db.select().from(chatConversations).where(eq(chatConversations.id, id)).limit(1);
  return rows[0] ?? null;
}
