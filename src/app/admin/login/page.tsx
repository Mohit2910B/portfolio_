"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identity, password }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Sign in failed.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 20% 10%, rgba(255,255,255,0.95), transparent 60%), radial-gradient(45% 45% at 85% 85%, rgba(224,20,127,0.12), transparent 65%)",
        }}
      />
      <div className="glass w-full max-w-md rounded-[28px] p-8">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-[0.7rem] font-bold text-white">
            MB
          </span>
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em]">Studio CMS</p>
            <p className="text-[0.62rem] text-ink/45">Mohit Babariya — admin access</p>
          </div>
        </div>

        <h1 className="display mt-7 text-3xl">Sign in</h1>
        <p className="mt-2 text-sm text-ink/55">
          Admin access only. There is no public registration — new admins are created by an
          authenticated admin.
        </p>

        <form onSubmit={submit} className="mt-7 grid gap-4" noValidate>
          <div>
            <label className="label" htmlFor="identity">
              Email or username
            </label>
            <input
              id="identity"
              className="field"
              value={identity}
              onChange={(event) => setIdentity(event.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="field"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-[#d11a4a]/8 px-3 py-2 text-[0.72rem] text-[#a3123a]">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-dark" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="hairline mt-6 pt-5">
          <p className="text-[0.6rem] uppercase tracking-[0.16em] text-ink/40">First run</p>
          <p className="mono mt-2 text-[0.68rem] leading-relaxed text-ink/55">
            admin@mohitbabariya.studio
            <br />
            Change the password after your first sign-in by registering a new admin and removing
            shared credentials.
          </p>
        </div>

        <Link href="/" className="link-underline mt-6 inline-block text-[0.7rem] uppercase tracking-[0.16em] text-ink/50">
          Back to website
        </Link>
      </div>
    </main>
  );
}
