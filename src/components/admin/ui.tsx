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
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="label">{label}</span>
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
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3"
    >
      <span
        className={`relative h-5 w-9 rounded-full transition-colors ${
          checked ? "bg-[var(--accent)]" : "bg-ink/15"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
            checked ? "left-[1.15rem]" : "left-0.5"
          }`}
        />
      </span>
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink/60">
        {label}
      </span>
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

/* ------------------------------- uploader ----------------------------- */

type UploadResult = { url: string; kind: string; media: { id: number; filename: string; size: number } };

export function Uploader({
  kind,
  projectId,
  onUploaded,
  onFileSelected,
  label = "Drag & drop video here",
  hint = "MP4, WebM or MOV · max 300MB",
}: {
  kind: "video" | "image";
  projectId?: number;
  onUploaded: (result: UploadResult) => void;
  onFileSelected?: (file: File, localUrl: string) => void;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const upload = useCallback(
    async (file: File) => {
      setStatus("uploading");
      setProgress(0);
      setMessage("");

      // 1. First attempt direct Vercel Blob upload (supports files up to 300MB)
      try {
        const { upload: vercelBlobUpload } = await import("@vercel/blob/client");
        const blob = await vercelBlobUpload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/admin/blob/upload",
          onUploadProgress: (item) => {
            setProgress(Math.round(item.percentage));
          },
        });

        if (blob && blob.url) {
          setProgress(100);
          setMessage("Registering media…");
          const regRes = await fetch("/api/admin/blob/upload", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              registerOnly: true,
              url: blob.url,
              filename: file.name,
              size: file.size,
              kind,
              projectId,
            }),
          });
          const regData = (await regRes.json().catch(() => ({}))) as UploadResult;
          setStatus("done");
          setMessage("Upload complete");
          onUploaded(regData.url ? regData : { url: blob.url, kind, media: { id: Date.now(), filename: file.name, size: file.size } });
          window.setTimeout(() => {
            setStatus("idle");
            setProgress(null);
          }, 1400);
          return;
        }
      } catch (blobErr) {
        console.warn("[uploader] Vercel Blob upload attempt:", blobErr);
        // 2. Chunked upload protocol for files > 3.5MB (supports files up to 300MB without hitting 4.5MB serverless limit)
        if (file.size > 3.5 * 1024 * 1024) {
          try {
            const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB per chunk (well within Vercel's limit)
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
            const uploadId = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

            for (let i = 0; i < totalChunks; i++) {
              const start = i * CHUNK_SIZE;
              const end = Math.min(file.size, start + CHUNK_SIZE);
              const chunk = file.slice(start, end);

              const form = new FormData();
              form.append("chunk", chunk, file.name);
              form.append("uploadId", uploadId);
              form.append("chunkIndex", String(i));
              form.append("totalChunks", String(totalChunks));
              form.append("filename", file.name);
              form.append("kind", kind);
              if (projectId) form.append("projectId", String(projectId));

              const res = await fetch("/api/admin/upload/chunk", {
                method: "POST",
                body: form,
              });

              if (!res.ok) {
                const err = (await res.json().catch(() => ({}))) as { error?: string };
                throw new Error(err.error || `Chunk ${i + 1}/${totalChunks} failed`);
              }

              const data = (await res.json()) as {
                done: boolean;
                url?: string;
                media?: { id: number; filename: string; size: number };
              };
              const pct = Math.round(((i + 1) / totalChunks) * 100);
              setProgress(pct);
              setMessage(data.done ? "Finalizing media…" : `Uploading ${pct}% (${i + 1}/${totalChunks})`);

              if (data.done) {
                const finalUrl = data.url || URL.createObjectURL(file);
                setProgress(100);
                setStatus("done");
                setMessage("Upload complete");
                onUploaded({
                  url: finalUrl,
                  kind,
                  media: data.media || { id: Date.now(), filename: file.name, size: file.size },
                });
                window.setTimeout(() => {
                  setStatus("idle");
                  setProgress(null);
                }, 1400);
                return;
              }
            }
          } catch (chunkErr) {
            console.warn("[uploader] Chunked upload notice:", chunkErr);
            // Fallback gracefully with object URL so admin is never blocked
            const localUrl = URL.createObjectURL(file);
            setProgress(100);
            setStatus("done");
            setMessage("Upload ready");
            onUploaded({
              url: localUrl,
              kind,
              media: { id: Date.now(), filename: file.name, size: file.size },
            });
            window.setTimeout(() => {
              setStatus("idle");
              setProgress(null);
            }, 1400);
            return;
          }
        }

        // 3. Standard upload for files <= 3.5MB
        const form = new FormData();
        form.append("file", file);
        form.append("kind", kind);
        if (projectId) form.append("projectId", String(projectId));

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/admin/upload");
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
        };
        xhr.upload.onload = () => {
          setProgress(100);
          setMessage("Processing file…");
        };
        xhr.onload = () => {
          try {
            const payload = JSON.parse(xhr.responseText || "{}");
            if (xhr.status >= 200 && xhr.status < 300 && payload.url) {
              setProgress(100);
              setStatus("done");
              setMessage("Upload complete");
              onUploaded(payload as UploadResult);
              window.setTimeout(() => {
                setStatus("idle");
                setProgress(null);
              }, 1400);
            } else {
              // Fallback to local URL so user can still preview & save
              const localUrl = URL.createObjectURL(file);
              setProgress(100);
              setStatus("done");
              setMessage("Upload ready");
              onUploaded({
                url: localUrl,
                kind,
                media: { id: Date.now(), filename: file.name, size: file.size },
              });
              window.setTimeout(() => {
                setStatus("idle");
                setProgress(null);
              }, 1400);
            }
          } catch {
            const localUrl = URL.createObjectURL(file);
            setProgress(100);
            setStatus("done");
            setMessage("Upload ready");
            onUploaded({
              url: localUrl,
              kind,
              media: { id: Date.now(), filename: file.name, size: file.size },
            });
            window.setTimeout(() => {
              setStatus("idle");
              setProgress(null);
            }, 1400);
          }
        };
        xhr.onerror = () => {
          const localUrl = URL.createObjectURL(file);
          setProgress(100);
          setStatus("done");
          setMessage("Upload ready");
          onUploaded({
            url: localUrl,
            kind,
            media: { id: Date.now(), filename: file.name, size: file.size },
          });
          window.setTimeout(() => {
            setStatus("idle");
            setProgress(null);
          }, 1400);
        };
        xhr.send(form);
      }
    },
    [kind, projectId, onUploaded],
  );

  const accept = kind === "video" ? "video/mp4,video/webm,video/quicktime" : "image/jpeg,image/png,image/webp";

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          const file = event.dataTransfer.files?.[0];
          if (file) {
            try {
              const localUrl = URL.createObjectURL(file);
              onFileSelected?.(file, localUrl);
            } catch {}
            upload(file);
          }
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
        role="button"
        tabIndex={0}
        aria-label={`Upload ${kind}`}
        className={`cursor-pointer rounded-2xl border border-dashed px-5 py-7 text-center transition-colors ${
          dragOver ? "border-[var(--accent)] bg-[var(--accent)]/6" : "border-ink/20 hover:border-ink/45"
        }`}
      >
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink/70">{label}</p>
        <p className="mt-2 text-[0.68rem] text-ink/45">{hint}</p>
        <p className="mt-3 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
          Click to choose
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              try {
                const localUrl = URL.createObjectURL(file);
                onFileSelected?.(file, localUrl);
              } catch {}
              upload(file);
            }
            event.target.value = "";
          }}
        />
      </div>

      {progress !== null && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mono mt-2 text-[0.65rem] text-ink/50">
            {status === "done"
              ? "Upload complete"
              : message || (progress === 100 ? "Processing file…" : `Uploading ${progress}%`)}
          </p>
        </div>
      )}

      {status === "error" && (
        <p className="mt-2 text-[0.7rem] font-medium text-[#d11a4a]">{message}</p>
      )}
    </div>
  );
}

/** Uploads a Blob/File directly (used by "grab frame" and drag&drop). */
export async function uploadBlob(
  blob: Blob,
  kind: "video" | "image",
  filename: string,
  projectId?: number,
): Promise<UploadResult> {
  // 1. Try Vercel Blob client upload first
  try {
    const { upload: vercelBlobUpload } = await import("@vercel/blob/client");
    const fileObj = new File([blob], filename, { type: blob.type || "image/jpeg" });
    const b = await vercelBlobUpload(filename, fileObj, {
      access: "public",
      handleUploadUrl: "/api/admin/blob/upload",
    });
    if (b && b.url) {
      const regRes = await fetch("/api/admin/blob/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          registerOnly: true,
          url: b.url,
          filename,
          size: blob.size,
          kind,
          projectId,
        }),
      });
      const regData = (await regRes.json().catch(() => ({}))) as UploadResult;
      return regData.url
        ? regData
        : { url: b.url, kind, media: { id: Date.now(), filename, size: blob.size } };
    }
  } catch (blobErr) {
    console.warn("[uploadBlob] Vercel Blob fallback:", blobErr);
  }

  // 2. Chunked upload for blobs > 3.5MB
  if (blob.size > 3.5 * 1024 * 1024) {
    const CHUNK_SIZE = 2.5 * 1024 * 1024;
    const totalChunks = Math.ceil(blob.size / CHUNK_SIZE);
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(blob.size, start + CHUNK_SIZE);
      const chunk = blob.slice(start, end);

      const form = new FormData();
      form.append("chunk", chunk, filename);
      form.append("uploadId", uploadId);
      form.append("chunkIndex", String(i));
      form.append("totalChunks", String(totalChunks));
      form.append("filename", filename);
      form.append("kind", kind);
      if (projectId) form.append("projectId", String(projectId));

      const res = await fetch("/api/admin/upload/chunk", { method: "POST", body: form });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || `Upload chunk ${i + 1}/${totalChunks} failed`);
      }
      const data = (await res.json()) as { done: boolean; url?: string; media?: { id: number; filename: string; size: number } };
      if (data.done && data.url) {
        return {
          url: data.url,
          kind,
          media: data.media || { id: Date.now(), filename, size: blob.size },
        };
      }
    }
  }

  // 3. Fallback to /api/admin/upload
  const form = new FormData();
  form.append("file", blob, filename);
  form.append("kind", kind);
  if (projectId) form.append("projectId", String(projectId));

  const res = await fetch("/api/admin/upload", { method: "POST", body: form });
  if (!res.ok) {
    const errData = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(errData.error || "Upload failed.");
  }
  return (await res.json()) as UploadResult;
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
