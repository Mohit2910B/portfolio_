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

type SavedProfile = {
  name: string;
  email: string;
  countryCode: string;
  phone: string;
};

const COUNTRY_CODES = ["+91", "+1", "+44", "+971", "+61", "+65", "+49", "+33", "+81", "+880", "+94"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const PROFILE_KEY = "mb_chat_profile";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [details, setDetails] = useState<SavedProfile>({ name: "", email: "", countryCode: "+91", phone: "" });
  const [savedProfile, setSavedProfile] = useState<SavedProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [clearing, setClearing] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);

  // 1. Load saved client profile from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROFILE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SavedProfile;
        if (parsed?.name && parsed?.email) {
          setSavedProfile(parsed);
          setDetails(parsed);
        }
      }
    } catch {}
  }, []);

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
      .then((payload: { conversation: Conversation | null; messages?: Message[]; adminOnline?: boolean }) => {
        setConversation(payload.conversation);
        if (payload.adminOnline !== undefined) setAdminOnline(payload.adminOnline);
        if (payload.messages) setMessages(payload.messages);
        scrollToEnd();
      })
      .catch(() => undefined);
  }, [open, scrollToEnd]);

  const saveProfileLocally = (prof: SavedProfile) => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(prof));
      setSavedProfile(prof);
    } catch {}
  };

  const startChat = async (event?: React.FormEvent, customDetails?: SavedProfile) => {
    if (event) event.preventDefault();
    setError("");
    const prof = customDetails || details;
    const next: Record<string, string> = {};
    if (prof.name.trim().length < 2) next.name = "Please enter your name.";
    if (!EMAIL_RE.test(prof.email.trim())) next.email = "Enter a valid email.";
    if (prof.phone.replace(/[^0-9]/g, "").length < 5) next.phone = "Enter a valid number.";
    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      setEditingProfile(true);
      return null;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/chat/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(prof),
      });
      const payload = (await response.json()) as {
        conversation?: Conversation;
        error?: string;
        details?: Record<string, string>;
      };
      if (!response.ok || !payload.conversation) {
        setFieldErrors(payload.details ?? {});
        setError(payload.error ?? "Could not start the chat. Please try again.");
        return null;
      }
      saveProfileLocally(prof);
      setConversation(payload.conversation);
      setMessages([]);
      setFieldErrors({});
      setEditingProfile(false);
      void loadMessages();
      return payload.conversation;
    } catch {
      setError("Network error. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    // If no active conversation yet, but we have saved profile, auto-start conversation first
    let activeConvo = conversation;
    if (!activeConvo) {
      const profileToUse = savedProfile || details;
      if (profileToUse.name && profileToUse.email && profileToUse.phone) {
        activeConvo = await startChat(undefined, profileToUse);
        if (!activeConvo) return;
      } else {
        setEditingProfile(true);
        return;
      }
    }

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

  /** Clear conversation from web UI while keeping database and local profile intact */
  const clearConversation = async () => {
    if (clearing) return;
    setClearing(true);
    try {
      await fetch("/api/chat/start", { method: "DELETE" });
      setConversation(null);
      setMessages([]);
      setNotice("Chat cleared from this screen. Past messages remain saved in studio records.");
      window.setTimeout(() => setNotice(""), 3500);
    } catch {
      setError("Could not clear chat.");
    } finally {
      setClearing(false);
    }
  };

  const hasIdentity = Boolean(conversation || (savedProfile && savedProfile.name && savedProfile.email));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Chat with Mohit"
        className="glass fixed bottom-5 right-4 z-[70] flex items-center gap-3 rounded-full px-5 py-3.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] transition-transform duration-300 hover:-translate-y-0.5 sm:bottom-8 sm:right-8 shadow-2xl"
      >
        <span
          className={`h-2 w-2 rounded-full ${
            adminOnline ? "bg-emerald-400 animate-pulse" : "bg-[var(--accent)]"
          }`}
        />
        {conversation && conversation.customerUnread > 0
          ? `Chat · ${conversation.customerUnread}`
          : "Chat with Mohit"}
      </button>

      {open && (
        <div className="glass-dark fade-in fixed bottom-24 right-4 z-[71] flex h-[70vh] max-h-[580px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-[26px] sm:right-8 border border-white/15 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5 bg-black/30">
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    adminOnline ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                  }`}
                />
                <p className="truncate text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white">
                  {adminOnline ? "Mohit Babariya (Live)" : "Mohit Studio AI"}
                </p>
              </div>
              <p className="mt-0.5 truncate text-[0.58rem] text-white/60">
                {adminOnline
                  ? "Direct Live Chat · Online now"
                  : "AI Assistant · Instant replies on video editing & design"}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Clear Conversation Option */}
              {hasIdentity && (
                <button
                  type="button"
                  disabled={clearing}
                  onClick={() => void clearConversation()}
                  title="Clear conversation on this screen (saved in admin records)"
                  className="flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-1 text-[0.58rem] font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                  <span>Clear</span>
                </button>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="grid h-7 w-7 place-items-center rounded-full border border-white/20 hover:bg-white/10 transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.2" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </div>

          {notice && (
            <div className="bg-emerald-950/80 border-b border-emerald-500/30 px-4 py-2 text-[0.62rem] text-emerald-200 text-center animate-fade-in">
              {notice}
            </div>
          )}

          {/* Body: Form if first time / editing; Direct Chat otherwise */}
          {!hasIdentity || editingProfile ? (
            <form onSubmit={(e) => void startChat(e)} className="grid gap-3.5 overflow-y-auto p-5" noValidate>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-[0.68rem] text-white/70">
                <p className="font-semibold text-white">Enter your details once</p>
                <p className="mt-0.5 text-[0.6rem] text-white/50">
                  You will remain automatically logged in on this device.
                </p>
              </div>

              <div>
                <label className="label" htmlFor="chat-name">
                  Full Name *
                </label>
                <input
                  id="chat-name"
                  className={`field ${fieldErrors.name ? "field-error" : ""}`}
                  value={details.name}
                  placeholder="e.g. Alex Sharma"
                  onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))}
                  required
                />
                {fieldErrors.name && <p className="mt-1 text-[0.65rem] text-[#ff8098]">{fieldErrors.name}</p>}
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
                  placeholder="alex@company.com"
                  onChange={(e) => setDetails((d) => ({ ...d, email: e.target.value }))}
                  required
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-[0.65rem] text-[#ff8098]">{fieldErrors.email}</p>
                )}
              </div>

              <div className="grid grid-cols-[100px_1fr] gap-2.5">
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
                    placeholder="98765 43210"
                    onChange={(e) =>
                      setDetails((d) => ({ ...d, phone: e.target.value.replace(/[^0-9\s-]/g, "") }))
                    }
                    required
                  />
                  {fieldErrors.phone && (
                    <p className="mt-1 text-[0.65rem] text-[#ff8098]">{fieldErrors.phone}</p>
                  )}
                </div>
              </div>

              {error && <p className="text-[0.68rem] text-[#ff8098]">{error}</p>}

              <div className="flex items-center gap-2 pt-1">
                <button type="submit" className="btn btn-accent btn-xs flex-1" disabled={loading}>
                  {loading ? "Starting…" : "Start Conversation"}
                </button>
                {savedProfile && editingProfile && (
                  <button
                    type="button"
                    onClick={() => setEditingProfile(false)}
                    className="btn btn-ghost btn-xs text-white/70"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          ) : (
            <>
              {/* Messages Container */}
              <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3.5">
                {/* Greeting banner for remembered user */}
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-2.5 text-center">
                  <p className="text-[0.68rem] font-medium text-white/90">
                    Welcome, <span className="font-bold text-white">{savedProfile?.name || conversation?.name}</span>!
                  </p>
                  <p className="mt-0.5 text-[0.58rem] text-white/50">
                    Your details are remembered on this device.{" "}
                    <button
                      type="button"
                      onClick={() => setEditingProfile(true)}
                      className="text-[var(--accent)] underline hover:opacity-80 ml-1"
                    >
                      Edit profile
                    </button>
                  </p>
                </div>

                {messages.length === 0 && (
                  <div className="py-6 text-center text-[0.72rem] text-white/45 space-y-1">
                    <p className="font-medium text-white/70">Start your creative project discussion</p>
                    <p className="text-[0.62rem] text-white/40">
                      Ask about video editing, motion graphics, thumbnails, reels, or turnaround times.
                    </p>
                  </div>
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
                        className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 text-[0.78rem] leading-relaxed shadow-md ${
                          mine
                            ? "bg-[var(--accent)] text-white"
                            : isAssistant
                              ? "border border-amber-400/30 bg-amber-500/15 text-white/95"
                              : message.senderType === "system"
                                ? "border border-white/10 bg-white/5 text-white/50 text-[0.68rem]"
                                : "border border-white/12 bg-white/10 text-white/90"
                        }`}
                      >
                        {!mine && message.senderType !== "system" && (
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

              {error && <p className="px-4 pb-1 text-[0.68rem] text-[#ff8098]">{error}</p>}

              {/* Chat Input */}
              <form onSubmit={send} className="flex items-center gap-2 border-t border-white/10 p-3 bg-black/20">
                <label className="sr-only" htmlFor="chat-message">
                  Message
                </label>
                <input
                  id="chat-message"
                  className="field py-2 text-[0.8rem]"
                  placeholder="Type a message…"
                  value={draft}
                  maxLength={2000}
                  onChange={(e) => setDraft(e.target.value)}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
                  aria-label="Send message"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
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
