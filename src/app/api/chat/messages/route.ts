import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { chatConversations, chatMessages } from "@/db/schema";
import { ensureDatabase } from "@/lib/bootstrap";
import { getCustomerConversation } from "@/lib/chat";
import { badRequest, guard, ok, rateLimit, str } from "@/lib/http";
import { sendAdminNotification } from "@/lib/notifications";
import { runChatAssistant } from "@/lib/ai";


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

    const chatSubject = `💬 Live Chat Message from ${conversation.name || "Website Visitor"}`;
    const chatHtml = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;border-radius:14px;background:#ffffff;border:1px solid #e5e5e5;color:#111111;">
        <span style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#e0147f;">NEW LIVE CHAT MESSAGE</span>
        <h2 style="margin:8px 0 4px;font-size:18px;color:#0b0b0c;">${conversation.name || "Website Visitor"}</h2>
        ${conversation.email ? `<p style="margin:0 0 16px;font-size:13px;color:#666666;">${conversation.email}</p>` : ""}
        <div style="background:#f7f5f2;border-radius:10px;padding:16px;font-size:14px;line-height:1.5;color:#111111;margin-bottom:18px;">${message}</div>
        <div style="text-align:center;">
          <a href="https://mohitbabariya.in/admin?section=chat" style="display:inline-block;background:#0b0b0c;color:#ffffff;text-decoration:none;padding:10px 22px;border-radius:999px;font-size:12px;font-weight:600;">Reply in Live Chat</a>
        </div>
      </div>
    `;

    try {
      await sendAdminNotification(chatSubject, chatHtml);
    } catch (notifyErr) {
      console.warn("[chat] Error dispatching admin chat notification email:", notifyErr);
    }

    void runChatAssistant(conversation.id, message);
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
