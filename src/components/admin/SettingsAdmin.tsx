"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Field,
  Notice,
  SectionTitle,
  TextArea,
  TextInput,
  Toggle,
  api,
} from "./ui";

type HomeSettings = {
  ownerName: string;
  heroName: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  availabilityLabel: string;
  ctaPrimaryLabel: string;
  ctaSecondaryLabel: string;
  reelUrl: string;
  aboutIntro: string;
  aboutExperience: string;
  aboutFocus: string;
  aboutWorkflow: string;
  aboutTools: string;
  aboutStrengths: string;
  footerNote: string;
};

const HOME_FIELDS: { key: keyof HomeSettings; label: string; long?: boolean; hint?: string }[] = [
  { key: "ownerName", label: "Owner name" },
  { key: "heroName", label: "Hero name" },
  { key: "heroTitle", label: "Hero title", long: true, hint: "One line per row. Use line breaks." },
  { key: "heroSubtitle", label: "Hero roles", hint: "Separate with ·" },
  { key: "heroDescription", label: "Hero description", long: true },
  { key: "availabilityLabel", label: "Availability label" },
  { key: "ctaPrimaryLabel", label: "Primary CTA label" },
  { key: "ctaSecondaryLabel", label: "Secondary CTA label" },
  { key: "reelUrl", label: "Showreel video URL" },
  { key: "aboutIntro", label: "About introduction", long: true },
  { key: "aboutExperience", label: "Experience", long: true },
  { key: "aboutFocus", label: "Creative focus", long: true },
  { key: "aboutWorkflow", label: "Workflow", long: true },
  { key: "aboutTools", label: "Tools", long: true },
  { key: "aboutStrengths", label: "Strengths", long: true },
  { key: "footerNote", label: "Footer note" },
];

function useSettings<T>(key: string) {
  const [settings, setSettings] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const payload = await api<{ settings: T | null }>(`/api/admin/settings/${key}`);
      setSettings(payload.settings);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load settings.");
    }
  }, [key]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (body: Partial<T>) => {
    setSaving(true);
    try {
      const payload = await api<{ settings: T }>(`/api/admin/settings/${key}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setSettings(payload.settings);
      setNotice("Saved — the public website now uses these values.");
      window.setTimeout(() => setNotice(""), 3200);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return { settings, setSettings, error, notice, saving, save };
}

function SettingsLoader({ title, error }: { title: string; error: string }) {
  return (
    <div>
      <SectionTitle title={title} />
      {error ? <Notice tone="error">{error}</Notice> : <p className="text-sm text-ink/45">Loading…</p>}
    </div>
  );
}

function SaveRow({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <div className="mt-5 flex justify-end">
      <Button variant="dark" disabled={saving} onClick={onClick}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}

export function HomepageAdmin({ onChanged }: { onChanged: () => void }) {
  const { settings, error, notice, saving, save } = useSettings<HomeSettings>("homepage");
  if (!settings) return <SettingsLoader title="Homepage" error={error} />;
  return (
    <div>
      <SectionTitle
        title="Homepage"
        subtitle="Nothing on the public homepage is hardcoded — it all comes from these fields."
      />
      {error && <Notice tone="error">{error}</Notice>}
      {notice && (
        <div className="mt-3">
          <Notice tone="success">{notice}</Notice>
        </div>
      )}
      <HomepageForm
        initial={settings}
        saving={saving}
        onSave={(draft) => {
          void save(draft);
          onChanged();
        }}
      />
    </div>
  );
}

function HomepageForm({
  initial,
  saving,
  onSave,
}: {
  initial: HomeSettings;
  saving: boolean;
  onSave: (draft: HomeSettings) => void;
}) {
  const [draft, setDraft] = useState<HomeSettings>(initial);
  return (
    <div>
      <Card className="mt-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {HOME_FIELDS.map((field) => (
            <Field
              key={field.key}
              label={field.label}
              hint={field.hint}
              className={field.long ? "sm:col-span-2" : ""}
            >
              {field.long ? (
                <TextArea
                  rows={field.key === "heroTitle" ? 4 : 3}
                  value={draft[field.key]}
                  onChange={(value) => setDraft({ ...draft, [field.key]: value })}
                />
              ) : (
                <TextInput
                  value={draft[field.key]}
                  onChange={(value) => setDraft({ ...draft, [field.key]: value })}
                />
              )}
            </Field>
          ))}
        </div>
      </Card>
      <SaveRow saving={saving} onClick={() => onSave(draft)} />
    </div>
  );
}

type ContactSettings = {
  email: string;
  countryCode: string;
  phone: string;
  whatsapp: string;
  location: string;
  instagram: string;
  youtube: string;
  linkedin: string;
  responseTime: string;
};

const CONTACT_FIELDS: [keyof ContactSettings, string][] = [
  ["email", "Email"],
  ["countryCode", "Country code"],
  ["phone", "Phone number"],
  ["whatsapp", "WhatsApp number"],
  ["location", "Location"],
  ["responseTime", "Response time"],
  ["instagram", "Instagram URL"],
  ["youtube", "YouTube URL"],
  ["linkedin", "LinkedIn URL"],
];

type NotificationSettings = { emailEnabled: boolean; notificationEmail: string };

export function NotificationSettingsAdmin({ onChanged }: { onChanged: () => void }) {
  const { settings, error, notice, saving, save } = useSettings<NotificationSettings>("notifications");
  const [draft, setDraft] = useState<NotificationSettings>({ emailEnabled: false, notificationEmail: "" });
  useEffect(() => { if (settings) setDraft(settings); }, [settings]);
  if (!settings) return <SettingsLoader title="Email Notifications" error={error} />;
  return (
    <div>
      <SectionTitle title="Email Notifications" subtitle="Control email alerts for new enquiries and customer chat messages." />
      {error && <Notice tone="error">{error}</Notice>}
      {notice && <div className="mt-3"><Notice tone="success">{notice}</Notice></div>}
      <Card className="mt-5 p-6">
        <div className="flex items-center justify-between gap-4">
          <div><p className="text-sm font-semibold">Customer email notifications</p><p className="mt-1 text-xs text-ink/50">Get an email whenever a new enquiry or chat message arrives.</p></div>
          <Toggle label="Email alerts" checked={draft.emailEnabled} onChange={(value) => setDraft({ ...draft, emailEnabled: value })} />
        </div>
        <div className="mt-5 max-w-xl">
          <Field label="Notification email">
            <TextInput type="email" value={draft.notificationEmail} onChange={(value) => setDraft({ ...draft, notificationEmail: value })} placeholder="you@example.com" />
          </Field>
        </div>
      </Card>
      <SaveRow saving={saving} onClick={() => { void save(draft); onChanged(); }} />
    </div>
  );
}

export function ContactSettingsAdmin({ onChanged }: { onChanged: () => void }) {
  const { settings, error, notice, saving, save } = useSettings<ContactSettings>("contact");
  if (!settings) return <SettingsLoader title="Contact Settings" error={error} />;
  return (
    <div>
      <SectionTitle title="Contact Settings" subtitle="Shown in the footer and the contact panel." />
      {error && <Notice tone="error">{error}</Notice>}
      {notice && (
        <div className="mt-3">
          <Notice tone="success">{notice}</Notice>
        </div>
      )}
      <ContactForm
        initial={settings}
        saving={saving}
        onSave={(draft) => {
          void save(draft);
          onChanged();
        }}
      />
    </div>
  );
}

function ContactForm({
  initial,
  saving,
  onSave,
}: {
  initial: ContactSettings;
  saving: boolean;
  onSave: (draft: ContactSettings) => void;
}) {
  const [draft, setDraft] = useState<ContactSettings>(initial);
  return (
    <div>
      <Card className="mt-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {CONTACT_FIELDS.map(([key, label]) => (
            <Field key={key} label={label}>
              <TextInput
                value={draft[key]}
                onChange={(value) => setDraft({ ...draft, [key]: value })}
              />
            </Field>
          ))}
        </div>
      </Card>
      <SaveRow saving={saving} onClick={() => onSave(draft)} />
    </div>
  );
}

type ThemeSettings = {
  preset?: string;
  accent: string;
  glassOpacity: number;
  glassBlur: number;
  grain: boolean;
};

const DEFAULT_THEME: ThemeSettings = {
  preset: "3d-neo",
  accent: "#e0147f",
  glassOpacity: 45,
  glassBlur: 20,
  grain: true,
};

export function ThemeAdmin({ onChanged }: { onChanged: () => void }) {
  const { settings, error, notice, saving, save } = useSettings<ThemeSettings>("theme");
  if (!settings) return <SettingsLoader title="Theme Studio" error={error} />;
  return (
    <div>
      <SectionTitle
        title="Theme Studio"
        subtitle="Customise your website's 3D UI depth, glassmorphism transparency, and blur strength."
      />
      {error && <Notice tone="error">{error}</Notice>}
      {notice && (
        <div className="mt-3">
          <Notice tone="success">{notice}</Notice>
        </div>
      )}
      <ThemeForm
        initial={settings}
        saving={saving}
        onSave={(draft) => {
          void save(draft);
          onChanged();
        }}
      />
    </div>
  );
}

function ThemeForm({
  initial,
  saving,
  onSave,
}: {
  initial: ThemeSettings;
  saving: boolean;
  onSave: (draft: ThemeSettings) => void;
}) {
  const [draft, setDraft] = useState<ThemeSettings>({
    preset: initial.preset || DEFAULT_THEME.preset,
    accent: initial.accent || DEFAULT_THEME.accent,
    glassOpacity: initial.glassOpacity ?? DEFAULT_THEME.glassOpacity,
    glassBlur: initial.glassBlur ?? DEFAULT_THEME.glassBlur,
    grain: initial.grain ?? DEFAULT_THEME.grain,
  });

  const is3dActive = draft.preset === "3d-neo" || draft.preset === "vision-clay" || !draft.preset;

  return (
    <div className="mt-5 space-y-6">
      {/* 3D UI Mode & Grain */}
      <Card className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-ink">3D UI (Tactile Neomorphic Depth)</h3>
            <p className="text-xs text-ink/55 mt-0.5 max-w-xl leading-relaxed">
              Enables 3D embossed cards, soft dual-shadows, inset tactile grooves, and elevated interactive buttons across your portfolio.
            </p>
          </div>
          <div className="shrink-0">
            <Toggle
              checked={is3dActive}
              onChange={(value) =>
                setDraft({
                  ...draft,
                  preset: value ? "3d-neo" : "glass-flat",
                })
              }
              label={is3dActive ? "3D UI Enabled" : "3D UI Disabled"}
            />
          </div>
        </div>
      </Card>

      {/* Glass Transparency & Blur */}
      <Card className="grid gap-6 p-6 sm:grid-cols-2">
        <Field
          label={`Glass Opacity — ${draft.glassOpacity}%`}
          hint="Controls the background opacity of frosted cards across the site (0% - 100%)."
        >
          <input
            type="range"
            min={0}
            max={100}
            value={draft.glassOpacity}
            onChange={(event) => setDraft({ ...draft, glassOpacity: Number(event.target.value) })}
            className="w-full accent-ink cursor-pointer"
          />
        </Field>

        <Field
          label={`Glass Blur Filter — ${draft.glassBlur}px`}
          hint="Controls the backdrop blur filter behind glass panels (0px - 40px)."
        >
          <input
            type="range"
            min={0}
            max={40}
            value={draft.glassBlur}
            onChange={(event) => setDraft({ ...draft, glassBlur: Number(event.target.value) })}
            className="w-full accent-ink cursor-pointer"
          />
        </Field>
      </Card>

      <SaveRow saving={saving} onClick={() => onSave(draft)} />
    </div>
  );
}

type LayoutSection = {
  id: number;
  sectionKey: string;
  label: string;
  sortOrder: number;
  isVisible: boolean;
};

export function LayoutAdmin({ onChanged }: { onChanged: () => void }) {
  const [sections, setSections] = useState<LayoutSection[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const payload = await api<{ sections: LayoutSection[] }>("/api/admin/layout");
      setSections(payload.sections);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load layout.");
    }
  }, []);

  useEffect(() => {
    void load();
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

  const move = (index: number, direction: "up" | "down") => {
    const swap = direction === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= sections.length) return;
    const next = [...sections];
    [next[index], next[swap]] = [next[swap], next[index]];
    void run(
      () => api("/api/admin/layout/reorder", { method: "POST", body: JSON.stringify({ ids: next.map((s) => s.id) }) }),
      "Section order saved.",
    );
  };

  return (
    <div>
      <SectionTitle
        title="Layout Order"
        subtitle="Reorder and hide public sections. Changes apply to the website instantly."
      />
      {error && <Notice tone="error">{error}</Notice>}
      {notice && (
        <div className="mt-3">
          <Notice tone="success">{notice}</Notice>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {sections.map((section, index) => (
          <Card key={section.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <p className="text-sm font-semibold text-ink">{section.label}</p>
              <p className="mono mt-1 text-[0.62rem] text-ink/45">
                #{index + 1} · {section.sectionKey}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button variant="ghost" onClick={() => move(index, "up")}>
                ↑
              </Button>
              <Button variant="ghost" onClick={() => move(index, "down")}>
                ↓
              </Button>
              <Button
                variant={section.isVisible ? "ghost" : "dark"}
                onClick={() =>
                  run(
                    () =>
                      api(`/api/admin/layout/${section.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ isVisible: !section.isVisible }),
                      }),
                    section.isVisible ? "Section hidden." : "Section visible.",
                  )
                }
              >
                {section.isVisible ? "Hide" : "Show"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

type BackupPayload = {
  generatedAt: string;
  data: Record<string, unknown[]>;
};

export function BackupAdmin({ onChanged }: { onChanged: () => void }) {
  const [media, setMedia] = useState<{ id: number; filename: string; kind: string; size: number; createdAt: string }[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    api<{ media: typeof media }>("/api/admin/media")
      .then((payload) => setMedia(payload.media))
      .catch(() => undefined);
  }, []);

  const exportDatabase = async () => {
    setBusy(true);
    try {
      const payload = await api<BackupPayload>("/api/admin/backup");
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setNotice("Database export downloaded.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Export failed.");
    } finally {
      setBusy(false);
    }
  };

  const restore = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as BackupPayload;
      const result = await api<{ restored: number }>("/api/admin/restore", {
        method: "POST",
        body: JSON.stringify({ data: parsed.data ?? parsed }),
      });
      setNotice(`Restore complete — ${result.restored} rows re-imported.`);
      onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Restore failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <SectionTitle
        title="Backup & Restore"
        subtitle="Export the full content database as JSON and restore projects, skills and services. Only authenticated admins can reach these endpoints."
      />
      {error && <Notice tone="error">{error}</Notice>}
      {notice && (
        <div className="mt-3">
          <Notice tone="success">{notice}</Notice>
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <p className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-ink/45">
            Database export
          </p>
          <p className="mt-3 text-sm text-ink/60">
            Downloads projects, categories, skills, services, carousel settings, CMS content, enquiries
            and chat history.
          </p>
          <Button variant="dark" className="mt-4" onClick={exportDatabase} disabled={busy}>
            {busy ? "Working…" : "Download export"}
          </Button>
        </Card>

        <Card className="p-6">
          <p className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-ink/45">
            Restore content
          </p>
          <p className="mt-3 text-sm text-ink/60">
            Restore projects, skills and services from a JSON export. Existing rows for those collections
            are replaced.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void restore(file);
              event.target.value = "";
            }}
          />
          <Button variant="ghost" className="mt-4" onClick={() => fileRef.current?.click()} disabled={busy}>
            Choose JSON file
          </Button>
        </Card>
      </div>

      <Card className="mt-5 p-6">
        <p className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-ink/45">
          Media metadata ({media.length} files)
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-[0.75rem]">
            <thead>
              <tr className="text-ink/40">
                <th className="pb-2 font-semibold uppercase tracking-[0.14em]">File</th>
                <th className="pb-2 font-semibold uppercase tracking-[0.14em]">Type</th>
                <th className="pb-2 font-semibold uppercase tracking-[0.14em]">Size</th>
                <th className="pb-2 font-semibold uppercase tracking-[0.14em]">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {media.map((item) => (
                <tr key={item.id} className="border-t border-ink/8">
                  <td className="py-2 pr-3 text-ink/80">{item.filename}</td>
                  <td className="py-2 pr-3 text-ink/55">{item.kind}</td>
                  <td className="py-2 pr-3 text-ink/55">{Math.round(item.size / 1024)} KB</td>
                  <td className="py-2 text-ink/55">{new Date(item.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

type AdminRow = {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
  lastLoginAt: string | null;
};

export function RegisterAdmin({ onChanged }: { onChanged: () => void }) {
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [draft, setDraft] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const load = useCallback(async () => {
    try {
      const payload = await api<{ admins: AdminRow[] }>("/api/admin/register");
      setRows(payload.admins);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load admins.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setErrors({});
    try {
      const payload = await api<{ requiresOtp?: boolean; message?: string; admin?: AdminRow }>("/api/admin/register", { method: "POST", body: JSON.stringify({ ...draft, ...(otp ? { otp } : {}) }) });
      if (payload.requiresOtp) { setOtpSent(true); setNotice(payload.message ?? "OTP sent to the admin email."); return; }
      setNotice(`Admin ${draft.email} created successfully.`);
      setDraft({ name: "", email: "", username: "", password: "", confirmPassword: "" });
      setOtp(""); setOtpSent(false);
      await load();
      onChanged();
    } catch (caught) {
      const err = caught as Error & { details?: Record<string, string> };
      setErrors(err.details ?? {});
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <SectionTitle
        title="Register Admin"
        subtitle="Only signed-in admins can create another admin. There is no public registration page."
      />
      {error && <Notice tone="error">{error}</Notice>}
      {notice && (
        <div className="mt-3">
          <Notice tone="success">{notice}</Notice>
        </div>
      )}

      <Card className="mt-5 p-6">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Name *" error={errors.name}>
            <TextInput value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} invalid={Boolean(errors.name)} required />
          </Field>
          <Field label="Email *" error={errors.email}>
            <TextInput value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} type="email" invalid={Boolean(errors.email)} required />
          </Field>
          <Field label="Username" hint="Defaults to the email prefix." error={errors.username}>
            <TextInput value={draft.username} onChange={(v) => setDraft({ ...draft, username: v })} invalid={Boolean(errors.username)} />
          </Field>
          <div />
          <Field label="Password *" error={errors.password} hint="Minimum 8 characters.">
            <TextInput value={draft.password} onChange={(v) => setDraft({ ...draft, password: v })} type="password" invalid={Boolean(errors.password)} required />
          </Field>
          <Field label="Confirm password *" error={errors.confirmPassword}>
            <TextInput
              value={draft.confirmPassword}
              onChange={(v) => setDraft({ ...draft, confirmPassword: v })}
              type="password"
              invalid={Boolean(errors.confirmPassword)}
              required
            />
          </Field>
          {otpSent && (
            <div className="sm:col-span-2 rounded-2xl border border-ink/10 bg-white/40 p-4">
              <Field label="Email OTP *" hint="Enter the 6-digit code sent to the admin email.">
                <TextInput value={otp} onChange={(v) => setOtp(v.replace(/\D/g, "").slice(0, 6))} placeholder="123456" />
              </Field>
              <button type="button" className="btn btn-ghost btn-xs mt-3" disabled={busy} onClick={() => { setOtp(""); void (async () => { try { await api("/api/admin/register", { method: "POST", body: JSON.stringify(draft) }); setNotice("A new OTP was sent."); } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not resend OTP."); } })(); }}>Resend OTP</button>
            </div>
          )}
          <div className="sm:col-span-2">
            <Button variant="accent" type="submit" disabled={busy || (otpSent && otp.length !== 6)}>
              {busy ? "Working…" : otpSent ? "Verify OTP & create admin" : "Send OTP"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="mt-5 p-6">
        <p className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-ink/45">
          Existing admins
        </p>
        <ul className="mt-4 divide-y divide-ink/8">
          {rows.map((admin) => (
            <li key={admin.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="text-sm font-semibold text-ink">{admin.name}</p>
                <p className="mono text-[0.65rem] text-ink/45">
                  {admin.email} · {admin.role}
                </p>
              </div>
              <p className="mono text-[0.62rem] text-ink/40">
                {admin.lastLoginAt
                  ? `Last login ${new Date(admin.lastLoginAt).toLocaleString()}`
                  : "Never signed in"}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
