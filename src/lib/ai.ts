import { db } from "@/db";
import { chatConversations, chatMessages } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function runChatAssistant(conversationId: number, latest: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return;
  const history = await db.select({ senderType: chatMessages.senderType, message: chatMessages.message }).from(chatMessages).where(eq(chatMessages.conversationId, conversationId)).orderBy(asc(chatMessages.createdAt)).limit(20);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      input: [
        { role: "system", content: "You are Mohit Babariya's portfolio assistant. Be concise, professional and helpful. Explain video editing, motion graphics, graphic design and AI video services. Never invent pricing, availability or personal facts." },
        ...history.map((m) => ({ role: m.senderType === "customer" ? "user" : "assistant", content: m.message })),
        { role: "user", content: latest },
      ],
    }),
  });
  if (!response.ok) return;
  const data = await response.json() as { output_text?: string };
  const text = data.output_text?.trim();
  if (!text) return;
  await db.insert(chatMessages).values({ conversationId, senderType: "assistant", message: text, isRead: false });
  await db.update(chatConversations).set({ lastMessage: text.slice(0, 240), customerUnread: 1 }).where(eq(chatConversations.id, conversationId));
}
