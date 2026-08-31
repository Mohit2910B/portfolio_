"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/* ----------------------------- API helper ----------------------------- */

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    cache: "no-store",
    headers:
      init?.body instanceof FormData
        ? init?.headers
        : { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new Error("Unexpected server response.");
  }
  if (!response.ok) {
    const record = (payload ?? {}) as { error?: string; details?: Record<string, string> };
    const error = new Error(record.error || `Request failed (${response.status})`) as Error & {
      details?: Record<string, string>;
      status?: number;
    };
    error.details = record.details;
    error.status = response.status;
    throw error;
  }
  return payload as T;
}

/* ------------------------------ primitives ---------------------------- */

export function Card({
  children,
  className = "",
  dark = false,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div className={`${dark ? "glass-dark" : "glass"} rounded-3xl ${className}`}>{children}</div>
  );
}

export function Button({
  children,
  onClick,
  variant = "ghost",
  disabled,
  type = "button",
  className = "",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "dark" | "light" | "ghost" | "accent" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
  title?: string;
}) {
  const styles: Record<string, string> = {
    dark: "bg-ink text-white hover:bg-black",
    light: "bg-white text-ink border border-ink/12 hover:border-ink/40",
    ghost: "border border-ink/15 text-ink/70 hover:border-ink/45 hover:text-ink",
    accent: "bg-[var(--accent)] text-white hover:brightness-110",
    danger: "border border-[#d11a4a]/35 text-[#d11a4a] hover:bg-[#d11a4a]/8",
  };
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-xs ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
  error,
  hint,
  className = "",
}: {
  label: ReactNode;
  children: ReactNode;
  error?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="label">{label}</div>
      {children}
      {hint && !error && <p className="mt-1.5 text-[0.65rem] text-ink/40">{hint}</p>}
      {error && <p className="mt-1.5 text-[0.68rem] font-medium text-[#d11a4a]">{error}</p>}
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  invalid,
  required,
  min,
  max,
}: {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  invalid?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type={type}
      value={value}
      min={min}
      max={max}
      required={required}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={`field ${invalid ? "field-error" : ""}`}
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="field resize-y"
    />
  );
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <select
      className={`field ${invalid ? "field-error" : ""}`}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 text-left"
    >
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-[var(--accent)]" : "bg-ink/15"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
            checked ? "left-[1.15rem]" : "left-0.5"
          }`}
        />
      </span>
      <div>
        <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink/75">
          {label}
        </span>
        {description && (
          <span className="block text-[0.65rem] text-ink/45 mt-0.5 font-normal">
            {description}
          </span>
        )}
      </div>
    </button>
  );
}

export function Notice({ tone, children }: { tone: "error" | "success" | "info"; children: ReactNode }) {
  const styles = {
    error: "border-[#d11a4a]/30 bg-[#d11a4a]/8 text-[#a3123a]",
    success: "border-emerald-600/25 bg-emerald-50 text-emerald-800",
    info: "border-ink/10 bg-white/60 text-ink/70",
  } as const;
  return (
    <div className={`fade-in rounded-2xl border px-4 py-3 text-[0.75rem] ${styles[tone]}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="display text-2xl text-ink sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-ink/55">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function useAsyncAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const run = useCallback(async (fn: () => Promise<void>, successMessage?: string) => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await fn();
      if (successMessage) {
        setSuccess(successMessage);
        window.setTimeout(() => setSuccess(""), 2600);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, error, success, setError, run, setSuccess };
}
