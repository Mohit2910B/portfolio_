"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Notice, SectionTitle, TextArea, api } from "./ui";

type Enquiry = {
  id: number;
  name: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  company: string;
  selectedWork: string;
  description: string;
  referenceUrl: string;
  deadline: string;
  source: string;
  status: string;
  createdAt: string;
};

function workList(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function EnquiriesAdmin({ onChanged }: { onChanged: () => void }) {
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const payload = await api<{ enquiries: Enquiry[] }>("/api/admin/enquiries");
      setRows(payload.enquiries);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load enquiries.");
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(load, 20000);
    return () => window.clearInterval(timer);
  }, [load]);

  const run = async (fn: () => Promise<void>, message?: string) => {
    try {
      await fn();
      await load();
      onChanged();
      if (message) {
        setNotice(message);
        window.setTimeout(() => setNotice(""), 2600);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Action failed.");
    }
  };

  const filtered = useMemo(() => {
    if (!filter) return rows;
    return rows.filter((row) => row.status === filter);
  }, [rows, filter]);

  const unread = rows.filter((row) => row.status === "new").length;

  return (
    <div>
      <SectionTitle
        title="Enquiries"
        subtitle={`${rows.length} total · ${unread} unread`}
        action={
          <div className="flex flex-wrap gap-2">
            {[
              { value: "", label: "All" },
              { value: "new", label: "Unread" },
              { value: "read", label: "Read" },
              { value: "archived", label: "Archived" },
            ].map((option) => (
              <Button
                key={option.label}
                variant={filter === option.value ? "dark" : "ghost"}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        }
      />
      {error && <Notice tone="error">{error}</Notice>}
      {notice && (
        <div className="mt-3">
          <Notice tone="success">{notice}</Notice>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {filtered.length === 0 && (
          <Card className="p-8 text-center text-sm text-ink/50">
            No enquiries here yet. Submissions from the contact form appear instantly.
          </Card>
        )}

        {filtered.map((enquiry) => {
          const open = openId === enquiry.id;
          return (
            <Card key={enquiry.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setOpenId(open ? null : enquiry.id);
                    if (!open && enquiry.status === "new") {
                      void run(
                        () =>
                          api(`/api/admin/enquiries/${enquiry.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ status: "read" }),
                          }),
                        undefined,
                      );
                    }
                  }}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{enquiry.name}</p>
                    {enquiry.status === "new" && (
                      <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.12em] text-white">
                        New
                      </span>
                    )}
                    {enquiry.status === "archived" && (
                      <span className="rounded-full border border-ink/15 px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.12em] text-ink/50">
                        Archived
                      </span>
                    )}
                  </div>
                  <p className="mono mt-1 text-[0.65rem] text-ink/45">
                    {enquiry.email} · {enquiry.countryCode} {enquiry.phoneNumber}
                    {enquiry.company ? ` · ${enquiry.company}` : ""}
                  </p>
                  <p className="mt-2 line-clamp-1 text-[0.78rem] text-ink/60">{enquiry.description}</p>
                </button>

                <div className="flex flex-wrap gap-1.5">
                  <Button
                    variant="ghost"
                    onClick={() =>
                      run(
                        () =>
                          api(`/api/admin/enquiries/${enquiry.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({
                              status: enquiry.status === "read" ? "new" : "read",
                            }),
                          }),
                        enquiry.status === "read" ? "Marked as unread." : "Marked as read.",
                      )
                    }
                  >
                    {enquiry.status === "read" ? "Mark unread" : "Mark read"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      run(
                        () =>
                          api(`/api/admin/enquiries/${enquiry.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({
                              status: enquiry.status === "archived" ? "read" : "archived",
                            }),
                          }),
                        enquiry.status === "archived" ? "Restored." : "Archived.",
                      )
                    }
                  >
                    {enquiry.status === "archived" ? "Restore" : "Archive"}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      if (!window.confirm(`Delete the enquiry from ${enquiry.name}?`)) return;
                      void run(
                        () => api(`/api/admin/enquiries/${enquiry.id}`, { method: "DELETE" }),
                        "Enquiry deleted.",
                      );
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {open && (
                <div className="fade-in mt-4 grid gap-4 border-t border-ink/8 pt-4 sm:grid-cols-2">
                  <div>
                    <p className="label">Selected work</p>
                    <div className="flex flex-wrap gap-1.5">
                      {workList(enquiry.selectedWork).map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-ink/12 px-3 py-1 text-[0.6rem] uppercase tracking-[0.12em] text-ink/60"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                    <p className="label mt-4">Project description</p>
                    <p className="text-[0.8rem] leading-relaxed text-ink/70">{enquiry.description}</p>
                  </div>
                  <dl className="grid gap-2 text-[0.75rem]">
                    <Row label="Deadline" value={enquiry.deadline || "—"} />
                    <Row label="Reference" value={enquiry.referenceUrl || "—"} />
                    <Row label="Source" value={enquiry.source || "—"} />
                    <Row label="Received" value={new Date(enquiry.createdAt).toLocaleString()} />
                    {enquiry.referenceUrl && enquiry.referenceUrl.startsWith("http") && (
                      <div>
                        <dt className="label">Open reference</dt>
                        <dd>
                          <a
                            href={enquiry.referenceUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="link-underline text-[var(--accent)]"
                          >
                            View reference
                          </a>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-ink/8 pb-1.5">
      <dt className="text-ink/40">{label}</dt>
      <dd className="text-right text-ink/75">{value}</dd>
    </div>
  );
}

/* ------------------------------ LIVE CHAT ---------------------------- */

type Conversation = {
  id: number;
  name: string;
  email: string;
  countryCode: string;
  phone: string;
  status: string;
  lastMessage: string;
  adminUnread: number;
  customerUnread: number;
  online: boolean;
  updatedAt: string;
};

type Message = {
  id: number;
  conversationId: number;
  senderType: string;
  message: string;
  createdAt: string;
};

export function ChatAdmin({ onChanged }: { onChanged: () => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const loadConversations = useCallback(async () => {
    try {
      const payload = await api<{ conversations: Conversation[] }>("/api/admin/chat/conversations");
      setConversations(payload.conversations);
      setActiveId((current) => current ?? payload.conversations[0]?.id ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load conversations.");
    }
  }, []);

  const loadMessages = useCallback(async (id: number) => {
    try {
      const payload = await api<{ messages: Message[] }>(`/api/admin/chat/conversations/${id}`);
      setMessages(payload.messages);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load messages.");
    }
  }, []);

  useEffect(() => {
    void loadConversations();
    const timer = window.setInterval(loadConversations, 6000);
    return () => window.clearInterval(timer);
  }, [loadConversations]);

  useEffect(() => {
    if (!activeId) return;
    void loadMessages(activeId);
    const timer = window.setInterval(() => void loadMessages(activeId), 4000);
    return () => window.clearInterval(timer);
  }, [activeId, loadMessages]);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeId || !draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    try {
      await api(`/api/admin/chat/conversations/${activeId}/reply`, {
        method: "POST",
        body: JSON.stringify({ message: text }),
      });
      await loadMessages(activeId);
      await loadConversations();
      onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Reply failed.");
      setDraft(text);
    }
  };

  return (
    <div>
      <SectionTitle
        title="Live Chat"
        subtitle="Conversations created from the public chat widget. Replies appear to the customer instantly via polling."
        action={
          <Button variant="light" onClick={() => void loadConversations()}>
            Refresh
          </Button>
        }
      />
      {error && <Notice tone="error">{error}</Notice>}

      <div className="mt-5 grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card className="p-3">
          <p className="px-2 pb-2 text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-ink/45">
            Inbox ({conversations.length})
          </p>
          <ul className="max-h-[60vh] space-y-1 overflow-y-auto">
            {conversations.length === 0 && (
              <li className="px-3 py-6 text-center text-[0.75rem] text-ink/45">
                No conversations yet.
              </li>
            )}
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(conversation.id)}
                  className={`w-full rounded-2xl px-3 py-3 text-left transition-colors ${
                    activeId === conversation.id ? "bg-ink text-white" : "hover:bg-ink/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[0.8rem] font-semibold">{conversation.name}</p>
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        conversation.online ? "bg-emerald-500" : "bg-ink/25"
                      }`}
                      title={conversation.online ? "Online" : "Offline"}
                    />
                  </div>
                  <p
                    className={`mt-1 truncate text-[0.68rem] ${
                      activeId === conversation.id ? "text-white/60" : "text-ink/45"
                    }`}
                  >
                    {conversation.lastMessage || "No messages yet"}
                  </p>
                  <div
                    className={`mt-1.5 flex items-center justify-between text-[0.6rem] ${
                      activeId === conversation.id ? "text-white/45" : "text-ink/35"
                    }`}
                  >
                    <span>{new Date(conversation.updatedAt).toLocaleString()}</span>
                    {conversation.adminUnread > 0 && (
                      <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-white">
                        {conversation.adminUnread}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="flex min-h-[60vh] flex-col p-0">
          {!active ? (
            <div className="grid flex-1 place-items-center text-sm text-ink/45">
              Select a conversation to read and reply.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/8 p-4">
                <div>
                  <p className="text-sm font-semibold text-ink">{active.name}</p>
                  <p className="mono mt-1 text-[0.62rem] text-ink/45">
                    {active.email} · {active.countryCode} {active.phone} ·{" "}
                    {active.status === "closed" ? "closed" : "open"}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      void (async () => {
                        await api(`/api/admin/chat/conversations/${active.id}`, {
                          method: "PATCH",
                          body: JSON.stringify({
                            status: active.status === "closed" ? "open" : "closed",
                          }),
                        });
                        await loadConversations();
                      })();
                    }}
                  >
                    {active.status === "closed" ? "Reopen" : "Close"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      void (async () => {
                        await api(`/api/admin/chat/conversations/${active.id}`, {
                          method: "PATCH",
                          body: JSON.stringify({ markRead: true }),
                        });
                        await loadConversations();
                        onChanged();
                      })();
                    }}
                  >
                    Mark read
                  </Button>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((message) => {
                  const admin = message.senderType === "admin";
                  return (
                    <div key={message.id} className={`flex ${admin ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[0.78rem] leading-relaxed ${
                          admin
                            ? "bg-ink text-white"
                            : message.senderType === "system"
                              ? "border border-ink/10 bg-white/60 text-ink/50"
                              : "border border-ink/10 bg-white/75 text-ink/85"
                        }`}
                      >
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
                {messages.length === 0 && (
                  <p className="py-8 text-center text-[0.75rem] text-ink/40">No messages yet.</p>
                )}
              </div>

              <form onSubmit={send} className="flex items-end gap-2 border-t border-ink/8 p-3">
                <div className="flex-1">
                  <TextArea value={draft} onChange={setDraft} rows={2} placeholder="Reply to the customer…" />
                </div>
                <Button variant="accent" type="submit">
                  Send
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
