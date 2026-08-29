"use client";

import { useMemo, useState } from "react";
import Reveal from "./Reveal";
import { SectionHeading } from "./Sections";
import type { SiteData } from "@/lib/data";

const COUNTRY_CODES = [
  "+91 India",
  "+1 United States",
  "+44 United Kingdom",
  "+971 United Arab Emirates",
  "+61 Australia",
  "+65 Singapore",
  "+49 Germany",
  "+33 France",
  "+34 Spain",
  "+39 Italy",
  "+31 Netherlands",
  "+81 Japan",
  "+86 China",
  "+7 Russia",
  "+55 Brazil",
  "+27 South Africa",
  "+234 Nigeria",
  "+20 Egypt",
  "+880 Bangladesh",
  "+94 Sri Lanka",
  "+92 Pakistan",
  "+966 Saudi Arabia",
  "+974 Qatar",
  "+968 Oman",
];

const SOURCES = [
  "Instagram",
  "YouTube",
  "Google search",
  "Referral",
  "LinkedIn",
  "Behance",
  "Other",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

type FormState = {
  name: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  company: string;
  selectedWork: string[];
  description: string;
  referenceUrl: string;
  deadline: string;
  source: string;
};

const EMPTY: FormState = {
  name: "",
  email: "",
  countryCode: "+91 India",
  phoneNumber: "",
  company: "",
  selectedWork: [],
  description: "",
  referenceUrl: "",
  deadline: "",
  source: "",
};

export default function ContactSection({ data }: { data: SiteData }) {
  const options = useMemo(
    () => (data.workOptions.length > 0 ? data.workOptions.map((o) => o.label) : []),
    [data.workOptions],
  );

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [message, setMessage] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const toggleWork = (label: string) => {
    setForm((prev) => ({
      ...prev,
      selectedWork: prev.selectedWork.includes(label)
        ? prev.selectedWork.filter((w) => w !== label)
        : [...prev.selectedWork, label],
    }));
    setErrors((prev) => {
      if (!prev.selectedWork) return prev;
      const next = { ...prev };
      delete next.selectedWork;
      return next;
    });
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Please enter your full name.";
    if (!EMAIL_RE.test(form.email.trim())) next.email = "Enter a valid email address.";
    const digits = form.phoneNumber.replace(/[^0-9]/g, "");
    const countryCode = (form.countryCode || "+91").split(" ")[0] || "+91";
    const PHONE_LENGTHS: Record<string, { min: number; max: number }> = {
      "+91": { min: 10, max: 10 }, "+1": { min: 10, max: 10 }, "+44": { min: 9, max: 10 },
      "+971": { min: 9, max: 9 }, "+61": { min: 9, max: 9 }, "+65": { min: 8, max: 8 },
      "+49": { min: 10, max: 11 }, "+33": { min: 9, max: 9 }, "+34": { min: 9, max: 9 },
      "+39": { min: 9, max: 10 }, "+31": { min: 9, max: 9 }, "+81": { min: 9, max: 10 },
      "+86": { min: 11, max: 11 }, "+7": { min: 10, max: 10 }, "+55": { min: 10, max: 11 },
      "+27": { min: 9, max: 9 }, "+234": { min: 10, max: 10 }, "+20": { min: 10, max: 10 },
      "+880": { min: 10, max: 10 }, "+94": { min: 9, max: 9 }, "+92": { min: 10, max: 10 },
      "+966": { min: 9, max: 9 }, "+974": { min: 8, max: 8 }, "+968": { min: 8, max: 8 },
    };
    const phoneRule = PHONE_LENGTHS[countryCode] ?? { min: 7, max: 15 };
    if (digits.length < phoneRule.min || digits.length > phoneRule.max) {
      next.phoneNumber = `Enter a valid ${countryCode} mobile number (${phoneRule.min}${phoneRule.max !== phoneRule.min ? `–${phoneRule.max}` : ""} digits).`;
    }
    if (form.selectedWork.length === 0) next.selectedWork = "Select at least one type of work.";
    if (form.description.trim().length < 15)
      next.description = "Tell me a little more (min. 15 characters).";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const [verifiedToken, setVerifiedToken] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    if (!validate()) { setMessage("Please fix the highlighted fields."); return; }
    const countryCode = (form.countryCode || "+91").split(" ")[0] || "+91";
    let token = verifiedToken;

    if (!otpSent && !otpVerified) {
      setOtpBusy(true);
      try {
        const response = await fetch("/api/enquiries/otp", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: form.email, countryCode, phoneNumber: form.phoneNumber }),
        });
        const payload = (await response.json()) as {
          error?: string;
          message?: string;
          details?: Record<string, string>;
          autoVerified?: boolean;
          verifiedToken?: string;
        };
        if (!response.ok) {
          setErrors(payload.details ?? {});
          setMessage(payload.error ?? "Could not send OTP.");
          return;
        }

        if (payload.autoVerified && payload.verifiedToken) {
          token = payload.verifiedToken;
          setVerifiedToken(payload.verifiedToken);
          setOtpVerified(true);
        } else {
          setOtpSent(true);
          setMessage(payload.message ?? "OTP sent to your email.");
          return;
        }
      } catch {
        setMessage("Network error. Could not send OTP.");
        return;
      } finally {
        setOtpBusy(false);
      }
    }
    if (!otpVerified) {
      if (!/^\d{6}$/.test(otp)) { setMessage("Enter the 6-digit OTP."); return; }
      setOtpBusy(true);
      try {
        const response = await fetch("/api/enquiries/otp", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: form.email, otp }) });
        const payload = await response.json() as { error?: string; verifiedToken?: string };
        if (!response.ok) { setMessage(payload.error ?? "OTP verification failed."); return; }
        if (payload.verifiedToken) {
          token = payload.verifiedToken;
          setVerifiedToken(payload.verifiedToken);
        }
        setOtpVerified(true); setMessage("Email verified. Sending your enquiry…");
      } catch { setMessage("Network error. OTP verification failed."); return; } finally { setOtpBusy(false); }
    }
    setStatus("sending");
    try {
      const response = await fetch("/api/enquiries", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, countryCode, verifiedToken: token }) });
      const payload = await response.json() as { error?: string; details?: Record<string, string>; message?: string };
      if (!response.ok) { setErrors(payload.details ?? {}); setMessage(payload.error ?? "Submission failed. Please try again."); setStatus("idle"); return; }
      setStatus("sent"); setMessage(payload.message ?? "Enquiry received."); setForm(EMPTY); setOtp(""); setOtpSent(false); setOtpVerified(false); setVerifiedToken("");
    } catch { setStatus("idle"); setMessage("Network error. Please check your connection and try again."); }
    finally { setStatus((current) => current === "sending" ? "idle" : current); }
  };

  const { contact } = data;

  return (
    <section id="contact" className="px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-[1400px]">
        <SectionHeading
          eyebrow="Start a project"
          title="Tell me what needs to move."
          description="Share the brief, the deadline and the references — I reply with availability, a plan and a quote."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Reveal>
            <form onSubmit={submit} noValidate className="glass rounded-[28px] p-6 sm:p-8">
              {status === "sent" ? (
                <div className="fade-in py-10 text-center">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--accent)]/10">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" aria-hidden="true">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <h3 className="display mt-5 text-2xl">Enquiry sent</h3>
                  <p className="mx-auto mt-3 max-w-sm text-sm text-ink/60">{message}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setStatus("idle");
                      setMessage("");
                    }}
                    className="btn btn-ghost btn-xs mt-6"
                  >
                    Send another enquiry
                  </button>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Name *" error={errors.name} className="sm:col-span-1">
                    <input
                      className={`field ${errors.name ? "field-error" : ""}`}
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="Your full name"
                      autoComplete="name"
                      required
                    />
                  </Field>

                  <Field label="Email *" error={errors.email}>
                    <input
                      type="email"
                      className={`field ${errors.email ? "field-error" : ""}`}
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="you@studio.com"
                      autoComplete="email"
                      required
                    />
                  </Field>

                  <Field label="Country code *" error={errors.countryCode}>
                    <select
                      className={`field ${errors.countryCode ? "field-error" : ""}`}
                      value={form.countryCode}
                      onChange={(e) => update("countryCode", e.target.value)}
                    >
                      {COUNTRY_CODES.map((code) => (
                        <option key={code} value={code}>
                          {code}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="WhatsApp / Phone *" error={errors.phoneNumber}>
                    <input
                      inputMode="numeric"
                      className={`field ${errors.phoneNumber ? "field-error" : ""}`}
                      value={form.phoneNumber}
                      onChange={(e) => update("phoneNumber", e.target.value.replace(/[^0-9\s-]/g, ""))}
                      placeholder="98765 43210"
                      required
                    />
                  </Field>

                  {otpSent && (
                    <div className="sm:col-span-2 rounded-2xl border border-ink/10 bg-white/40 p-4">
                      <div className="flex flex-wrap items-end gap-3">
                        <Field label="Email OTP *" error={!otpVerified && message.includes("OTP") ? message : undefined} className="flex-1">
                          <input className="field" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="6-digit OTP" disabled={otpVerified} />
                        </Field>
                        <button type="button" className="btn btn-ghost btn-xs" disabled={otpBusy} onClick={() => { setOtpSent(false); setOtpVerified(false); setOtp(""); }}>Change email / details</button>
                      </div>
                      {otpVerified && <p className="mt-2 text-xs text-green-700">✓ Email verified</p>}
                    </div>
                  )}

                  <Field label="Company / Brand">
                    <input
                      className="field"
                      value={form.company}
                      onChange={(e) => update("company", e.target.value)}
                      placeholder="Studio, brand or channel"
                    />
                  </Field>

                  <Field label="Deadline">
                    <input
                      className="field"
                      value={form.deadline}
                      onChange={(e) => update("deadline", e.target.value)}
                      placeholder="e.g. 14 days / 30 Nov"
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <p className="label">Select work *</p>
                    <div className="flex flex-wrap gap-2">
                      {options.map((option) => {
                        const active = form.selectedWork.includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleWork(option)}
                            aria-pressed={active}
                            className={`rounded-full border px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] transition-all ${
                              active
                                ? "border-ink bg-ink text-white"
                                : "border-ink/12 bg-white/50 text-ink/60 hover:border-ink/40"
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                    {errors.selectedWork && <ErrorText text={errors.selectedWork} />}
                  </div>

                  <Field label="Project description *" error={errors.description} className="sm:col-span-2">
                    <textarea
                      className={`field min-h-32 resize-y ${errors.description ? "field-error" : ""}`}
                      value={form.description}
                      onChange={(e) => update("description", e.target.value)}
                      placeholder="What are we making? Footage volume, style references, deliverables…"
                      required
                    />
                  </Field>

                  <Field label="Reference URL">
                    <input
                      className="field"
                      value={form.referenceUrl}
                      onChange={(e) => update("referenceUrl", e.target.value)}
                      placeholder="Link to references or current cut"
                    />
                  </Field>

                  <Field label="How did you find me?">
                    <select
                      className="field"
                      value={form.source}
                      onChange={(e) => update("source", e.target.value)}
                    >
                      <option value="">Select an option</option>
                      {SOURCES.map((source) => (
                        <option key={source} value={source}>
                          {source}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <div className="sm:col-span-2">
                    {message && <ErrorText text={message} />}
                    <div className="mt-2 flex flex-wrap items-center gap-4">
                      <button type="submit" className="btn btn-dark" disabled={status === "sending"}>
                        {status === "sending" ? "Sending…" : otpVerified ? "Send enquiry" : otpSent ? "Verify OTP" : "Send OTP"}
                      </button>
                      <p className="text-[0.65rem] uppercase tracking-[0.16em] text-ink/40">
                        {contact.responseTime || "Replies within 24 hours"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </Reveal>

          <Reveal delay={100}>
            <div className="glass h-full rounded-[28px] p-6 sm:p-8">
              <p className="text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-ink/40">
                Direct contact
              </p>
              <div className="mt-5 space-y-4">
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="link-underline block text-sm text-ink/80">
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <p className="text-sm text-ink/70">
                    {contact.countryCode} {contact.phone}
                  </p>
                )}
                {contact.whatsapp && (
                  <a
                    href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="link-underline block text-sm text-ink/80"
                  >
                    WhatsApp chat
                  </a>
                )}
                {contact.location && <p className="text-sm text-ink/70">{contact.location}</p>}
                {!contact.email && !contact.phone && !contact.location && (
                  <p className="text-sm text-ink/50">
                    Use the enquiry form — it reaches me directly.
                  </p>
                )}
              </div>

              <div className="hairline mt-8 pt-6">
                <p className="text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-ink/40">
                  What happens next
                </p>
                <ol className="mt-4 space-y-3 text-sm text-ink/70">
                  {[
                    "I review the brief and references.",
                    "You get availability, timeline and quote.",
                    "We align on style with a short test cut.",
                    "Edit, review rounds, final delivery.",
                  ].map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span className="mono text-[0.65rem] text-[var(--accent)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  error,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {error && <ErrorText text={error} />}
    </div>
  );
}

function ErrorText({ text }: { text: string }) {
  return (
    <p role="alert" className="mt-2 text-[0.7rem] font-medium text-[#d11a4a]">
      {text}
    </p>
  );
}
