"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface Conversation {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  lastMessage: string;
  adminUnread: number;
  updatedAt: string;
}

interface Message {
  id: number;
  conversationId: number;
  senderType: "customer" | "admin";
  message: string;
  createdAt: string;
}

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const url = activeConvId ? `/api/admin/chat?id=${activeConvId}` : "/api/admin/chat";
      const res = await fetch(url);
      const data = await res.json();
      if (data.conversations) setConversations(data.conversations);
      if (data.messages && activeConvId) setMessages(data.messages);
    } catch {} finally {
      setLoading(false);
    }
  }, [activeConvId]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 4000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId || !replyText.trim() || sending) return;

    const msg = replyText.trim();
    setReplyText("");
    setSending(true);

    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeConvId, message: msg }),
      });

      if (res.ok) {
        await fetchConversations();
      }
    } catch {} finally {
      setSending(false);
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="border-b border-[rgba(243,240,232,0.12)] pb-6">
        <div className="font-mono text-xs text-[#C7A56A] uppercase tracking-widest">
          REAL-TIME SUPPORT
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl uppercase tracking-tight">
          LIVE CHAT INBOX ({conversations.length})
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px] border border-[rgba(243,240,232,0.12)] bg-[#111111] overflow-hidden">
        {/* Left Conversations List */}
        <div className="lg:col-span-4 border-r border-[rgba(243,240,232,0.12)] overflow-y-auto divide-y divide-[rgba(243,240,232,0.08)] bg-[#080808]">
          {loading ? (
            <div className="p-6 text-center font-mono text-xs text-[#8A8A8A]">
              LOADING CHAT THREADS...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center font-mono text-xs text-[#8A8A8A]">
              NO CHAT CONVERSATIONS YET.
            </div>
          ) : (
            conversations.map((c) => {
              const selected = c.id === activeConvId;
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveConvId(c.id)}
                  className={`p-4 cursor-pointer transition-all ${
                    selected
                      ? "bg-[#161616] border-l-4 border-[#C7A56A]"
                      : "hover:bg-[#0D0D0D]"
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-xs">
                    <div className="font-display font-bold text-sm uppercase text-[#F3F0E8] truncate max-w-[180px]">
                      {c.name}
                    </div>
                    {c.adminUnread > 0 && (
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px] font-bold">
                        {c.adminUnread}
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[10px] text-[#8A8A8A] mt-1 truncate">
                    {c.lastMessage || "No messages yet"}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Active Message Thread */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-[#111111]">
          {!activeConvId ? (
            <div className="flex-1 flex items-center justify-center font-mono text-xs text-[#8A8A8A]">
              SELECT A CONVERSATION ON THE LEFT TO VIEW THREAD & REPLY.
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-[rgba(243,240,232,0.12)] bg-[#080808] flex items-center justify-between font-mono text-xs">
                <div>
                  <div className="font-display font-bold text-base text-[#F3F0E8] uppercase">
                    {activeConv?.name}
                  </div>
                  <div className="text-[10px] text-[#8A8A8A]">
                    {activeConv?.email || "No Email Provided"} • {activeConv?.phone || "No Phone"}
                  </div>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 font-sans text-xs">
                {messages.map((m) => {
                  const isAdmin = m.senderType === "admin";
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                    >
                      <span className="font-mono text-[9px] text-[#8A8A8A] mb-1 uppercase">
                        {isAdmin ? "MOHIT (YOU)" : activeConv?.name}
                      </span>
                      <div
                        className={`max-w-[75%] p-3 text-xs leading-relaxed ${
                          isAdmin
                            ? "bg-[#C7A56A] text-[#080808] font-semibold"
                            : "bg-[#1A1A1A] text-[#F3F0E8] border border-[rgba(243,240,232,0.12)]"
                        }`}
                      >
                        {m.message}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input Form */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-[rgba(243,240,232,0.12)] bg-[#080808] flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Type your reply to customer..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-[#111111] border border-[rgba(243,240,232,0.2)] px-4 py-3 text-xs text-[#F3F0E8] focus:border-[#C7A56A] focus:outline-none font-mono"
                />
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="px-6 py-3 bg-[#C7A56A] text-[#080808] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#D8B77C] disabled:opacity-40"
                >
                  SEND REPLY ↗
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
