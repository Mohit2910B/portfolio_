import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatConversations, chatMessages } from "@/db/schema";
import { badRequest, guard, ok } from "@/lib/http";
import crypto from "node:crypto";

export async function GET(req: Request) {
  return guard(async () => {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) return ok({ conversation: null, messages: [] });

    const convRows = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.customerToken, token))
      .limit(1);

    if (!convRows.length) return ok({ conversation: null, messages: [] });

    const conversation = convRows[0];

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversation.id))
      .orderBy(asc(chatMessages.createdAt));

    // Clear customer unread count when fetched by customer
    if (conversation.customerUnread > 0) {
      await db
        .update(chatConversations)
        .set({ customerUnread: 0 })
        .where(eq(chatConversations.id, conversation.id));
    }

    return ok({ conversation, messages });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    const body = await req.json().catch(() => ({}));
    let token = (body.token || "").toString().trim();
    const name = (body.name || "Website Visitor").toString().trim();
    const email = (body.email || "").toString().trim();
    const phone = (body.phone || "").toString().trim();
    const message = (body.message || "").toString().trim();

    if (!message) return badRequest("Message is required.");

    if (!token) {
      token = `cust_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
    }

    let convRows = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.customerToken, token))
      .limit(1);

    let conversation = convRows[0];

    if (!conversation) {
      const created = await db
        .insert(chatConversations)
        .values({
          name,
          email,
          phone,
          customerToken: token,
          status: "open",
          lastMessage: message,
          adminUnread: 1,
          customerUnread: 0,
        })
        .returning();
      conversation = created[0];
    } else {
      await db
        .update(chatConversations)
        .set({
          name: name !== "Website Visitor" ? name : conversation.name,
          email: email || conversation.email,
          phone: phone || conversation.phone,
          lastMessage: message,
          adminUnread: conversation.adminUnread + 1,
          updatedAt: new Date(),
        })
        .where(eq(chatConversations.id, conversation.id));
    }

    const insertedMsg = await db
      .insert(chatMessages)
      .values({
        conversationId: conversation.id,
        senderType: "customer",
        message,
        isRead: false,
      })
      .returning();

    return ok({
      success: true,
      token,
      conversationId: conversation.id,
      message: insertedMsg[0],
    });
  });
}
