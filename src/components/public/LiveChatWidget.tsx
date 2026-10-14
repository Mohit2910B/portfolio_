"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Message {
  id: number;
  senderType: "customer" | "admin";
  message: string;
  createdAt: string;
}

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [customerToken, setCustomerToken] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [unreadBadge, setUnreadBadge] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let token = localStorage.getItem("mb_chat_token");
    if (!token) {
      token = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("mb_chat_token", token);
    }
    setCustomerToken(token);
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!customerToken) return;
    try {
      const res = await fetch(`/api/chat?token=${customerToken}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        if (data.conversation?.customerUnread > 0 && !isOpen) {
          setUnreadBadge(data.conversation.customerUnread);
        }
      }
    } catch {}
  }, [customerToken, isOpen]);

  useEffect(() => {
    if (customerToken) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 4000);
      return () => clearInterval(interval);
    }
  }, [customerToken, fetchMessages]);

  useEffect(() => {
    if (isOpen) {
      setUnreadBadge(0);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages]);

  const sendDirectMessage = async (msg: string) => {
    if (!msg.trim() || loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: customerToken,
          name: name.trim() || "Website Visitor",
          email: email.trim(),
          message: msg,
        }),
      });

      if (res.ok) {
        await fetchMessages();
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const msg = inputText.trim();
    setInputText("");
    sendDirectMessage(msg);
  };

  const quickQuestions = [
    "What is your turnaround time for Reels?",
    "How can I book a project with you?",
    "Can you share your portfolio reel?",
    "Do you handle color grading & sound SFX?",
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Glass Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative px-6 py-3.5 glass-panel-strong text-[var(--text-primary)] font-mono text-xs font-bold tracking-widest uppercase shadow-2xl flex items-center space-x-3 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all transform hover:-translate-y-1 rounded-full"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>CHAT WITH MOHIT 💬</span>
          {unreadBadge > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px] font-bold">
              {unreadBadge}
            </span>
          )}
        </button>
      )}

      {/* Glass Chat Panel */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] glass-panel-strong rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-fade-in border border-[var(--border-glass-strong)]">
          {/* Header */}
          <div className="p-4 bg-black/70 border-b border-[var(--border-glass)] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <div>
                <div className="font-serif font-bold text-base uppercase text-[var(--text-primary)]">
                  MOHIT BABARIYA
                </div>
                <div className="font-mono text-[9px] text-[var(--accent)] uppercase tracking-wider">
                  ONLINE // LIVE ASSISTANT
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-mono text-base px-2"
            >
              ✕
            </button>
          </div>

          {/* Messages Thread */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-xs">
            {messages.length === 0 ? (
              <div className="space-y-4 py-4">
                <div className="text-center text-[var(--text-secondary)] font-mono text-xs leading-relaxed">
                  👋 Hello! Welcome to Mohit Babariya's Studio. Click a quick question below or type your project message.
                </div>
                <div className="space-y-2">
                  <div className="font-mono text-[10px] text-[var(--accent)] uppercase tracking-wider text-center">
                    QUICK QUESTIONS:
                  </div>
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendDirectMessage(q)}
                      className="w-full p-2.5 rounded-xl border border-[var(--border-glass)] glass-panel text-left font-sans text-xs text-[var(--text-primary)] hover:border-[var(--accent)] transition-all"
                    >
                      💡 {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const isCustomer = m.senderType === "customer";
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isCustomer ? "items-end" : "items-start"}`}
                  >
                    <span className="font-mono text-[9px] text-[var(--text-secondary)] mb-1 uppercase">
                      {isCustomer ? "YOU" : "MOHIT"}
                    </span>
                    <div
                      className={`max-w-[80%] p-3 text-xs leading-relaxed rounded-2xl ${
                        isCustomer
                          ? "bg-[var(--accent)] text-[var(--bg-main)] font-semibold rounded-br-none"
                          : "glass-panel text-[var(--text-primary)] rounded-bl-none"
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-black/70 border-t border-[var(--border-glass)] flex items-center space-x-2">
            <input
              type="text"
              placeholder="Type your message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-black/50 border border-[var(--border-glass)] px-3 py-2.5 text-xs text-[var(--text-primary)] rounded-xl focus:outline-none font-mono"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="px-4 py-2.5 bg-[var(--accent)] text-[var(--bg-main)] font-mono text-xs font-bold uppercase rounded-xl disabled:opacity-40"
            >
              SEND
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
