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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

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
        className="neo-tactile-btn fixed bottom-5 right-4 z-[70] flex items-center gap-3 rounded-full px-5 py-3.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink sm:bottom-8 sm:right-8 shadow-xl hover:scale-105 active:scale-95"
      >
        <span
          className={`h-2.5 w-2.5 rounded-full shadow-sm ${
            adminOnline ? "bg-emerald-500 animate-pulse" : "bg-[var(--accent)]"
          }`}
        />
        <span>
          {conversation && conversation.customerUnread > 0
            ? `Chat · ${conversation.customerUnread}`
            : "Chat with Mohit"}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[999] flex h-screen h-[100dvh] w-screen w-[100dvw] flex-col bg-[#07090e] text-white animate-fade-in overflow-hidden">
          {/* Full Screen Top Navigation / Header */}
          <div className="border-b border-white/10 bg-[#0c1018]/90 backdrop-blur-2xl px-4 py-3 sm:px-8 sm:py-4 shrink-0 shadow-md">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 pr-2">
                <div className="relative shrink-0">
                  <span className="grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-2xl bg-white/10 border border-white/15 text-white font-bold text-sm sm:text-base shadow-sm">
                    MB
                  </span>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#07090e] ${
                      adminOnline ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <p className="truncate text-sm sm:text-base font-bold uppercase tracking-[0.14em] text-white">
                      {adminOnline ? "Mohit Babariya (Live)" : "Mohit Studio Assistant"}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${
                        adminOnline ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {adminOnline ? "Online Now" : "AI Assistant"}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[0.68rem] sm:text-xs text-white/60">
                    {adminOnline
                      ? "Direct Live Chat with Mohit · Video Editing & Design Inquiries"
                      : "Instant Assistant · Ask anything about projects, ideas & services"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {/* Clear Conversation Option */}
                {hasIdentity && (
                  <button
                    type="button"
                    disabled={clearing}
                    onClick={() => void clearConversation()}
                    title="Clear conversation on this screen"
                    className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold text-white/80 hover:bg-white/15 hover:text-white transition-all cursor-pointer"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                )}

                {/* Prominent Close Button */}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close full-screen chat"
                  className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-white hover:bg-white hover:text-black transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none" aria-hidden="true">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                  <span>Close (Esc)</span>
                </button>
              </div>
            </div>
          </div>

          {notice && (
            <div className="bg-emerald-950/90 border-b border-emerald-500/30 px-4 py-2 text-xs text-emerald-200 text-center animate-fade-in font-medium">
              {notice}
            </div>
          )}

          {/* Body: Form if first time / editing; Direct Chat otherwise */}
          {!hasIdentity || editingProfile ? (
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center">
              <form onSubmit={(e) => void startChat(e)} className="w-full max-w-xl space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 shadow-2xl backdrop-blur-xl" noValidate>
                <div className="text-center pb-2">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)] mb-3">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-white">Start Conversation with Mohit</h3>
                  <p className="mt-1 text-xs text-white/60">
                    Enter your contact details to begin live messaging. You will stay remembered on this device.
                  </p>
                </div>

                <div>
                  <label className="label" htmlFor="chat-name">
                    Full Name *
                  </label>
                  <input
                    id="chat-name"
                    className={`field py-3 text-sm ${fieldErrors.name ? "field-error" : ""}`}
                    value={details.name}
                    placeholder="e.g. Alex Sharma"
                    onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))}
                    required
                  />
                  {fieldErrors.name && <p className="mt-1 text-xs text-[#ff8098]">{fieldErrors.name}</p>}
                </div>

                <div>
                  <label className="label" htmlFor="chat-email">
                    Email Address *
                  </label>
                  <input
                    id="chat-email"
                    type="email"
                    className={`field py-3 text-sm ${fieldErrors.email ? "field-error" : ""}`}
                    value={details.email}
                    placeholder="alex@company.com"
                    onChange={(e) => setDetails((d) => ({ ...d, email: e.target.value }))}
                    required
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs text-[#ff8098]">{fieldErrors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-[120px_1fr] gap-3">
                  <div>
                    <label className="label" htmlFor="chat-code">
                      Country
                    </label>
                    <select
                      id="chat-code"
                      className="field py-3 text-sm"
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
                      Mobile Number *
                    </label>
                    <input
                      id="chat-phone"
                      inputMode="numeric"
                      className={`field py-3 text-sm ${fieldErrors.phone ? "field-error" : ""}`}
                      value={details.phone}
                      placeholder="98765 43210"
                      onChange={(e) =>
                        setDetails((d) => ({ ...d, phone: e.target.value.replace(/[^0-9\s-]/g, "") }))
                      }
                      required
                    />
                    {fieldErrors.phone && (
                      <p className="mt-1 text-xs text-[#ff8098]">{fieldErrors.phone}</p>
                    )}
                  </div>
                </div>

                {error && <p className="text-xs text-[#ff8098] font-medium text-center">{error}</p>}

                <div className="flex items-center gap-3 pt-2">
                  <button type="submit" className="btn btn-accent flex-1 shadow-lg py-3 text-sm" disabled={loading}>
                    {loading ? "Connecting…" : "Start Conversation"}
                  </button>
                  {savedProfile && editingProfile && (
                    <button
                      type="button"
                      onClick={() => setEditingProfile(false)}
                      className="btn btn-ghost text-white/70"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Messages Container (Full Width / Max 5XL on PC) */}
              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6" ref={listRef}>
                <div className="mx-auto max-w-5xl space-y-4">
                  {/* Greeting banner for remembered user */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center flex items-center justify-between gap-4">
                    <p className="text-xs font-medium text-white/80 truncate">
                      Chatting as <span className="font-bold text-white">{savedProfile?.name || conversation?.name}</span> ({savedProfile?.email || conversation?.email})
                    </p>
                    <button
                      type="button"
                      onClick={() => setEditingProfile(true)}
                      className="text-xs text-[var(--accent)] underline hover:opacity-80 shrink-0 font-semibold cursor-pointer"
                    >
                      Edit profile
                    </button>
                  </div>

                  {messages.length === 0 && (
                    <div className="py-16 text-center text-white/50 space-y-2">
                      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/5 text-white/60 mb-3 border border-white/10 text-2xl">
                        💬
                      </span>
                      <p className="text-base font-bold text-white/90">Start your conversation with Mohit</p>
                      <p className="text-xs text-white/55 max-w-md mx-auto leading-relaxed">
                        Send any message, questions, project details, turnaround inquiries, or creative ideas.
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
                          className={`max-w-[85%] sm:max-w-[75%] rounded-3xl px-4 py-3 sm:px-5 sm:py-3.5 text-sm leading-relaxed shadow-lg ${
                            mine
                              ? "bg-[var(--accent)] text-white shadow-[0_4px_20px_var(--accent)]"
                              : isAssistant
                                ? "border border-amber-400/35 bg-amber-500/15 text-white/95 backdrop-blur-md"
                                : message.senderType === "system"
                                  ? "border border-white/10 bg-white/5 text-white/50 text-xs"
                                  : "border border-white/15 bg-white/10 text-white/90 backdrop-blur-md"
                          }`}
                        >
                          {!mine && message.senderType !== "system" && (
                            <div className="text-[0.62rem] font-bold uppercase tracking-wider text-white/60 mb-1 flex items-center gap-1.5">
                              {isAssistant ? "🤖 Mohit Studio Assistant" : "👤 Mohit Babariya"}
                            </div>
                          )}
                          <p className="whitespace-pre-wrap">{message.message}</p>
                          <span className="mono mt-1.5 block text-[0.6rem] opacity-60">
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
              </div>

              {error && <p className="px-6 pb-2 text-xs text-[#ff8098] font-medium text-center">{error}</p>}

              {/* Full Width Chat Input Bar at Bottom */}
              <div className="border-t border-white/10 bg-[#0c1018]/95 px-4 py-3 sm:px-8 sm:py-4 shrink-0 shadow-xl">
                <form onSubmit={send} className="mx-auto flex max-w-5xl items-center gap-3">
                  <label className="sr-only" htmlFor="chat-message">
                    Message
                  </label>
                  <input
                    id="chat-message"
                    className="field py-3 text-sm sm:text-base flex-1 bg-white/5 border-white/15 focus:border-[var(--accent)] rounded-2xl"
                    placeholder="Type your message or project question…"
                    value={draft}
                    maxLength={2000}
                    onChange={(e) => setDraft(e.target.value)}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    className="grid h-11 w-11 sm:h-12 sm:w-12 shrink-0 place-items-center rounded-2xl bg-[var(--accent)] text-white hover:brightness-110 active:scale-95 transition-all shadow-lg cursor-pointer"
                    aria-label="Send message"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                      <path d="M3 20l18-8L3 4v6l12 2-12 2z" />
                    </svg>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
