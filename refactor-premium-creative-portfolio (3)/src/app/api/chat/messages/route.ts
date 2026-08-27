import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { chatConversations, chatMessages } from "@/db/schema";
import { ensureDatabase } from "@/lib/bootstrap";
import { getCustomerConversation } from "@/lib/chat";
import { badRequest, guard, ok, rateLimit, str } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Public (customer): fetch my conversation messages. */
export async function GET() {
  return guard(async () => {
    await ensureDatabase();
    const conversation = await getCustomerConversation();
    if (!conversation) return ok({ conversation: null, messages: [] });
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversation.id))
      .orderBy(asc(chatMessages.createdAt), asc(chatMessages.id));
    return ok({ conversation, messages });
  });
}

/** Public (customer): send a message. */
export async function POST(request: Request) {
  return guard(async () => {
    await ensureDatabase();
    const conversation = await getCustomerConversation();
    if (!conversation) return badRequest("Start a chat first.");
    if (conversation.status === "closed") return badRequest("This conversation is closed.");

    const body = (await request.json().catch(() => ({}))) as { message?: unknown };
    const message = str(body.message);
    if (message.length < 1) return badRequest("Type a message first.");
    if (message.length > 2000) return badRequest("Message is too long (max 2000 characters).");
    if (!rateLimit(`chat-msg:${conversation.id}`, 30, 60 * 1000)) {
      return badRequest("You are sending messages too quickly.");
    }

    const inserted = await db
      .insert(chatMessages)
      .values({ conversationId: conversation.id, senderType: "customer", message, isRead: false })
      .returning();

    await db
      .update(chatConversations)
      .set({
        lastMessage: message.slice(0, 240),
        adminUnread: sql`${chatConversations.adminUnread} + 1`,
        updatedAt: sql`now()`,
      })
      .where(eq(chatConversations.id, conversation.id));

    return ok({ message: inserted[0] });
  });
}

/** Public (customer): mark admin replies as read. */
export async function PATCH() {
  return guard(async () => {
    const conversation = await getCustomerConversation();
    if (!conversation) return badRequest("No conversation in this browser.");
    await db
      .update(chatMessages)
      .set({ isRead: true })
      .where(
        sql`${chatMessages.conversationId} = ${conversation.id} and ${chatMessages.senderType} = 'admin' and ${chatMessages.isRead} = false`,
      );
    await db
      .update(chatConversations)
      .set({ customerUnread: 0, customerSeenAt: sql`now()` })
      .where(eq(chatConversations.id, conversation.id));
    return ok({ ok: true });
  });
}
