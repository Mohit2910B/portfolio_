import { cookies } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { chatConversations, chatMessages } from "@/db/schema";
import { ensureDatabase } from "@/lib/bootstrap";
import { CHAT_COOKIE, getCustomerConversation, signConversation } from "@/lib/chat";
import { badRequest, clientIp, created, guard, ok, rateLimit, str } from "@/lib/http";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/** Public: register chat details and create the conversation. */
export async function POST(request: Request) {
  return guard(async () => {
    await ensureDatabase();
    if (!rateLimit(`chat-start:${clientIp(request)}`, 6, 10 * 60 * 1000)) {
      return badRequest("Too many attempts. Please try again shortly.");
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const name = str(body.name);
    const email = str(body.email).toLowerCase();
    const countryCode = str(body.countryCode, "+91") || "+91";
    const phoneRaw = str(body.phone).replace(/[\s-()]/g, "");

    const errors: Record<string, string> = {};
    if (name.length < 2) errors.name = "Please enter your name.";
    if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
    if (!/^\+?[0-9]{1,4}$/.test(countryCode)) errors.countryCode = "Select a country code.";
    if (!/^[0-9]{5,15}$/.test(phoneRaw)) errors.phone = "Enter a valid mobile number.";
    if (Object.keys(errors).length > 0) {
      return badRequest("Please complete the highlighted fields.", errors);
    }

    const rows = await db
      .insert(chatConversations)
      .values({ name, email, countryCode, phone: phoneRaw, status: "open" })
      .returning();

    const conversation = rows[0];
    await db.insert(chatMessages).values({
      conversationId: conversation.id,
      senderType: "system",
      message: `Chat started with ${conversation.name}. Mohit will reply here shortly.`,
      isRead: true,
    });

    const jar = await cookies();
    jar.set(CHAT_COOKIE, signConversation(conversation.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return created({ conversation });
  });
}

/** Public: restore an existing conversation for this browser + clear unread. */
export async function GET() {
  return guard(async () => {
    await ensureDatabase();
    const conversation = await getCustomerConversation();
    if (!conversation) return ok({ conversation: null });
    await db
      .update(chatConversations)
      .set({ customerUnread: 0, customerSeenAt: sql`now()` })
      .where(eq(chatConversations.id, conversation.id));
    return ok({ conversation });
  });
}

/** Public: end / close the conversation for this browser. */
export async function DELETE() {
  return guard(async () => {
    const jar = await cookies();
    jar.delete(CHAT_COOKIE);
    return ok({ ok: true });
  });
}
