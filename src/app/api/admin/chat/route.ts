import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatConversations, chatMessages } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { badRequest, guard, notFound, ok } from "@/lib/http";

export async function GET(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("id") ? Number(searchParams.get("id")) : null;

    const conversations = await db
      .select()
      .from(chatConversations)
      .orderBy(desc(chatConversations.updatedAt));

    let activeMessages: (typeof chatMessages.$inferSelect)[] = [];
    if (conversationId) {
      activeMessages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, conversationId))
        .orderBy(asc(chatMessages.createdAt));

      // Clear admin unread badge for this conversation
      await db
        .update(chatConversations)
        .set({ adminUnread: 0 })
        .where(eq(chatConversations.id, conversationId));
    }

    return ok({ conversations, messages: activeMessages });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));

    const conversationId = Number(body.conversationId);
    const message = (body.message || "").toString().trim();

    if (!conversationId || !message) {
      return badRequest("conversationId and message are required.");
    }

    const convRows = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.id, conversationId))
      .limit(1);

    if (!convRows.length) return notFound("Conversation not found.");

    const conversation = convRows[0];

    const insertedMsg = await db
      .insert(chatMessages)
      .values({
        conversationId,
        senderType: "admin",
        message,
        isRead: false,
      })
      .returning();

    await db
      .update(chatConversations)
      .set({
        lastMessage: `Mohit: ${message}`,
        customerUnread: conversation.customerUnread + 1,
        adminUnread: 0,
        updatedAt: new Date(),
      })
      .where(eq(chatConversations.id, conversationId));

    return ok({ success: true, message: insertedMsg[0] });
  });
}
