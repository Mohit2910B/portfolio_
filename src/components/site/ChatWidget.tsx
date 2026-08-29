"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Message = {
  id: number;
  conversationId: number;
  senderType: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type Conversation = {
  id: number;
  name: string;
  email: string;
  countryCode: string;
  phone: string;
  status: string;
  customerUnread: number;
};

const COUNTRY_CODES = ["+91", "+1", "+44", "+971", "+61", "+65", "+49", "+33", "+81", "+880", "+94"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [details, setDetails] = useState({ name: "", email: "", countryCode: "+91", phone: "" });
  const listRef = useRef<HTMLDivElement | null>(null);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  }, []);

  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/messages", { cache: "no-store" });
      const payload = (await response.json()) as {
        conversation: Conversation | null;
        messages?: Message[];
        adminOnline?: boolean;
        error?: string;
      };
      if (!response.ok) return;
      setConversation(payload.conversation);
      if (payload.adminOnline !== undefined) setAdminOnline(payload.adminOnline);
      if (payload.messages) setMessages(payload.messages);
      if (payload.conversation && payload.conversation.customerUnread > 0) {
        await fetch("/api/chat/messages", { method: "PATCH" });
      }
      scrollToEnd();
    } catch {
      /* polling errors are silent — the next tick retries */
    }
  }, [scrollToEnd]);

  useEffect(() => {
    if (!open || !conversation) return;
    void loadMessages();
    const timer = window.setInterval(loadMessages, 4000);
    return () => window.clearInterval(timer);
  }, [open, conversation, loadMessages]);

  useEffect(() => {
    if (!open) return;
    void fetch("/api/chat/messages", { cache: "no-store" })
      .then((r) => r.json())
      .then((payload: { conversation: Conversation | null; messages?: Message[] }) => {
        setConversation(payload.conversation);
        if (payload.messages) setMessages(payload.messages);
        scrollToEnd();
      })
      .catch(() => undefined);
  }, [open, scrollToEnd]);

  const startChat = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const next: Record<string, string> = {};
    if (details.name.trim().length < 2) next.name = "Please enter your name.";
    if (!EMAIL_RE.test(details.email.trim())) next.email = "Enter a valid email.";
    if (details.phone.replace(/[^0-9]/g, "").length < 5) next.phone = "Enter a valid number.";
    setFieldErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      const response = await fetch("/api/chat/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(details),
      });
      const payload = (await response.json()) as {
        conversation?: Conversation;
        error?: string;
        details?: Record<string, string>;
      };
      if (!response.ok || !payload.conversation) {
        setFieldErrors(payload.details ?? {});
        setError(payload.error ?? "Could not start the chat. Please try again.");
        return;
      }
      // The details form is discarded entirely — only the chat interface remains.
      setConversation(payload.conversation);
      setMessages([]);
      setDetails({ name: "", email: "", countryCode: "+91", phone: "" });
      setFieldErrors({});
      void loadMessages();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setError(payload.error ?? "Message failed to send.");
        setDraft(text);
        return;
      }
      setError("");
      await loadMessages();
    } catch {
      setError("Network error. Message not sent.");
      setDraft(text);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Chat with Mohit"
        className="glass fixed bottom-5 right-4 z-[70] flex items-center gap-3 rounded-full px-5 py-3.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] transition-transform duration-300 hover:-translate-y-0.5 sm:bottom-8 sm:right-8"
      >
        <span className="pulse-dot h-2 w-2 rounded-full bg-[var(--accent)]" />
        {conversation && conversation.customerUnread > 0
          ? `Chat · ${conversation.customerUnread}`
          : "Chat with Mohit"}
      </button>

      {open && (
        <div className="glass-dark fade-in fixed bottom-24 right-4 z-[71] flex h-[70vh] max-h-[560px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-[26px] sm:right-8">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-white">
                {adminOnline ? "Chat with Mohit (Live)" : "Mohit Studio AI Assistant"}
              </p>
              <p className="mt-1 flex items-center gap-2 text-[0.6rem] text-white/70">
                {adminOnline ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Mohit is online · Instant direct chat</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    <span>AI Assistant active · Instant replies on editing & design</span>
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/20 hover:bg-white/10 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {!conversation ? (
            <form onSubmit={startChat} className="grid gap-4 overflow-y-auto p-5" noValidate>
              <div>
                <label className="label" htmlFor="chat-name">
                  Name *
                </label>
                <input
                  id="chat-name"
                  className={`field ${fieldErrors.name ? "field-error" : ""}`}
                  value={details.name}
                  onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))}
                  required
                />
                {fieldErrors.name && <p className="mt-1 text-[0.68rem] text-[#ff8098]">{fieldErrors.name}</p>}
              </div>

              <div>
                <label className="label" htmlFor="chat-email">
                  Email *
                </label>
                <input
                  id="chat-email"
                  type="email"
                  className={`field ${fieldErrors.email ? "field-error" : ""}`}
                  value={details.email}
                  onChange={(e) => setDetails((d) => ({ ...d, email: e.target.value }))}
                  required
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-[0.68rem] text-[#ff8098]">{fieldErrors.email}</p>
                )}
              </div>

              <div className="grid grid-cols-[100px_1fr] gap-3">
                <div>
                  <label className="label" htmlFor="chat-code">
                    Code *
                  </label>
                  <select
                    id="chat-code"
                    className="field"
                    value={details.countryCode}
                    onChange={(e) => setDetails((d) => ({ ...d, countryCode: e.target.value }))}
                  >
                    {COUNTRY_CODES.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="chat-phone">
                    Mobile *
                  </label>
                  <input
                    id="chat-phone"
                    inputMode="numeric"
                    className={`field ${fieldErrors.phone ? "field-error" : ""}`}
                    value={details.phone}
                    onChange={(e) =>
                      setDetails((d) => ({ ...d, phone: e.target.value.replace(/[^0-9\s-]/g, "") }))
                    }
                    required
                  />
                  {fieldErrors.phone && (
                    <p className="mt-1 text-[0.68rem] text-[#ff8098]">{fieldErrors.phone}</p>
                  )}
                </div>
              </div>

              {error && <p className="text-[0.7rem] text-[#ff8098]">{error}</p>}

              <button type="submit" className="btn btn-accent btn-xs" disabled={loading}>
                {loading ? "Starting…" : "Start chat"}
              </button>
            </form>
          ) : (
            <>
              <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                {messages.length === 0 && (
                  <p className="text-center text-[0.7rem] text-white/40">
                    Say hello — tell me about your project.
                  </p>
                )}
                {messages.map((message) => {
                  const mine = message.senderType === "customer";
                  const isAssistant = message.senderType === "assistant";
                  return (
                    <div
                      key={message.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 text-[0.78rem] leading-relaxed ${
                          mine
                            ? "bg-[var(--accent)] text-white"
                            : isAssistant
                              ? "border border-amber-400/30 bg-amber-500/15 text-white/95"
                              : message.senderType === "system"
                                ? "border border-white/10 bg-white/5 text-white/50"
                                : "border border-white/12 bg-white/10 text-white/90"
                        }`}
                      >
                        {!mine && (
                          <div className="text-[0.58rem] font-bold uppercase tracking-wider text-white/50 mb-1 flex items-center gap-1">
                            {isAssistant ? "🤖 Mohit Studio AI" : "👤 Mohit Babariya"}
                          </div>
                        )}
                        {message.message}
                        <span className="mono mt-1 block text-[0.55rem] opacity-60">
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {error && <p className="px-5 pb-2 text-[0.68rem] text-[#ff8098]">{error}</p>}

              <form onSubmit={send} className="flex items-center gap-2 border-t border-white/10 p-3">
                <label className="sr-only" htmlFor="chat-message">
                  Message
                </label>
                <input
                  id="chat-message"
                  className="field"
                  placeholder="Type a message…"
                  value={draft}
                  maxLength={2000}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button
                  type="submit"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-white"
                  aria-label="Send message"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                    <path d="M3 20l18-8L3 4v6l12 2-12 2z" />
                  </svg>
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
