import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { chatConversations, chatMessages } from "@/db/schema";
import { ensureDatabase } from "@/lib/bootstrap";
import { cookies } from "next/headers";
import { getCustomerConversation, getRuntimeChatStore, CHAT_COOKIE, signConversation } from "@/lib/chat";
import { badRequest, guard, ok, rateLimit, str } from "@/lib/http";
import { getNotificationSettings, sendAdminNotification } from "@/lib/notifications";
import { runChatAssistant } from "@/lib/ai";

export const dynamic = "force-dynamic";

/** Public (customer): fetch my conversation messages and status. */
export async function GET(request: Request) {
  return guard(async () => {
    const [settings, conversation] = await Promise.all([
      getNotificationSettings().catch(() => ({ adminStatus: "offline" })),
      getCustomerConversation(request),
    ]);

    if (!conversation) {
      return ok({
        conversation: null,
        messages: [],
        adminOnline: settings.adminStatus === "online",
      });
    }

    let messages: {
      id: number;
      conversationId: number;
      senderType: string;
      message: string;
      isRead: boolean;
      createdAt: Date | string;
    }[] = [];

    try {
      const dbMessages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, conversation.id))
        .orderBy(asc(chatMessages.createdAt), asc(chatMessages.id));
      if (dbMessages.length > 0) messages = dbMessages;
    } catch {}

    if (messages.length === 0) {
      const store = getRuntimeChatStore();
      messages = store.messages.get(conversation.id) || [
        {
          id: Date.now(),
          conversationId: conversation.id,
          senderType: "assistant",
          message: `Hello ${conversation.name || "there"}! Welcome to Mohit Studio. How can I help you with your video editing or design project today?`,
          isRead: true,
          createdAt: new Date(),
        },
      ];
    }

    return ok({
      conversation,
      messages,
      adminOnline: settings.adminStatus === "online",
    });
  });
}

/** Public (customer): send a message. */
export async function POST(request: Request) {
  return guard(async () => {
    const body = (await request.json().catch(() => ({}))) as {
      message?: unknown;
      profile?: {
        name?: string;
        email?: string;
        phone?: string;
        countryCode?: string;
      };
    };
    const message = str(body.message);
    if (message.length < 1) return badRequest("Type a message first.");
    if (message.length > 2000) return badRequest("Message is too long (max 2000 characters).");

    let conversation = await getCustomerConversation(request);

    if (!conversation) {
      const prof = body.profile || {};
      const name = str(prof.name, "Website Visitor") || "Website Visitor";
      const email = str(prof.email, "visitor@mohitbabariya.in");
      const countryCode = str(prof.countryCode, "+91") || "+91";
      const phone = str(prof.phone, "");

      let createdId = Date.now();
      try {
        const rows = await db
          .insert(chatConversations)
          .values({ name, email, countryCode, phone, status: "open" })
          .returning();
        if (rows[0]) {
          conversation = rows[0];
          createdId = rows[0].id;
        }
      } catch {}

      if (!conversation) {
        conversation = {
          id: createdId,
          name,
          email,
          countryCode,
          phone,
          status: "open",
          customerUnread: 0,
          adminUnread: 0,
          lastMessage: message.slice(0, 240),
          customerSeenAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      const store = getRuntimeChatStore();
      store.conversations.set(conversation.id, conversation);

      try {
        const jar = await cookies();
        jar.set(CHAT_COOKIE, signConversation(conversation.id), {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        });
      } catch {}
    }

    if (conversation.status === "closed") return badRequest("This conversation is closed.");

    if (!rateLimit(`chat-msg:${conversation.id}`, 40, 60 * 1000)) {
      return badRequest("You are sending messages too quickly.");
    }

    const insertedMsg = {
      id: Date.now(),
      conversationId: conversation.id,
      senderType: "customer",
      message,
      isRead: false,
      createdAt: new Date(),
    };

    const store = getRuntimeChatStore();
    if (!store.messages.has(conversation.id)) store.messages.set(conversation.id, []);
    store.messages.get(conversation.id)?.push(insertedMsg);

    const convo = store.conversations.get(conversation.id);
    if (convo) {
      convo.lastMessage = message.slice(0, 240);
      convo.updatedAt = new Date();
    }

    try {
      await db
        .insert(chatMessages)
        .values({ conversationId: conversation.id, senderType: "customer", message, isRead: false });

      await db
        .update(chatConversations)
        .set({
          lastMessage: message.slice(0, 240),
          adminUnread: sql`${chatConversations.adminUnread} + 1`,
          updatedAt: sql`now()`,
        })
        .where(eq(chatConversations.id, conversation.id));
    } catch {}

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

    let aiReply = null;
    try {
      aiReply = await runChatAssistant(conversation.id, message);
    } catch (aiErr) {
      console.warn("[chat] AI assistant error:", aiErr);
    }

    return ok({ message: insertedMsg, reply: aiReply });
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
