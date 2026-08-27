import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { chatConversations } from "@/db/schema";

export const CHAT_COOKIE = "mb_chat";

function secret(): string {
  return process.env.CHAT_SECRET || process.env.DATABASE_URL || "mohit-babariya-portfolio";
}

export function signConversation(id: number): string {
  const mac = createHmac("sha256", secret()).update(String(id)).digest("hex").slice(0, 32);
  return `${id}.${mac}`;
}

export function verifySigned(value: string | undefined): number | null {
  if (!value) return null;
  const [id, mac] = value.split(".");
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || !mac) return null;
  const expected = createHmac("sha256", secret()).update(String(numeric)).digest("hex").slice(0, 32);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
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
