"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "login" | "register" | "reset";

export default function AdminLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");

  // Sign in state
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");

  // Register state
  const [regForm, setRegForm] = useState({
    name: "",
    username: "",
    email: "",
    role: "editor",
    password: "",
    confirmPassword: "",
    otp: "",
  });
  const [regStep, setRegStep] = useState<1 | 2>(1);

  // Reset state
  const [resetForm, setResetForm] = useState({
    identity: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [resetStep, setResetStep] = useState<1 | 2>(1);

  // Shared state
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setNotice("");
    setRegStep(1);
    setResetStep(1);
  };

  // 1. Handle Sign In
  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identity, password }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Sign in failed. Check your credentials.");
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

  // 2. Handle Register (Step 1: Request OTP -> Step 2: Verify & Create)
  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    if (regStep === 1) {
      if (regForm.password !== regForm.confirmPassword) {
        setError("Passwords do not match.");
        setBusy(false);
        return;
      }
      if (regForm.password.length < 8) {
        setError("Password must be at least 8 characters.");
        setBusy(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/admin/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(regForm),
      });
      const payload = (await response.json()) as {
        requiresOtp?: boolean;
        success?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Registration request failed.");
        return;
      }

      if (regStep === 1 && payload.requiresOtp) {
        setRegStep(2);
        setNotice(
          payload.message ??
            "Authorization code sent to Mohit's email. Please enter the OTP provided by Mohit.",
        );
      } else if (payload.success) {
        setNotice(payload.message ?? "Admin account created successfully! You can now sign in.");
        setMode("login");
        setIdentity(regForm.username || regForm.email);
        setPassword("");
        setRegForm({
          name: "",
          username: "",
          email: "",
          role: "editor",
          password: "",
          confirmPassword: "",
          otp: "",
        });
        setRegStep(1);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // 3. Handle Reset Password (Step 1: Request OTP -> Step 2: Verify & Reset)
  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    if (resetStep === 2) {
      if (resetForm.newPassword !== resetForm.confirmPassword) {
        setError("Passwords do not match.");
        setBusy(false);
        return;
      }
      if (resetForm.newPassword.length < 8) {
        setError("New password must be at least 8 characters.");
        setBusy(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(resetForm),
      });
      const payload = (await response.json()) as {
        requiresOtp?: boolean;
        success?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Password reset request failed.");
        return;
      }

      if (resetStep === 1 && payload.requiresOtp) {
        setResetStep(2);
        setNotice(payload.message ?? "Security OTP has been dispatched to Mohit's email.");
      } else if (payload.success) {
        setNotice(payload.message ?? "Password updated successfully! Please sign in.");
        setMode("login");
        setIdentity(resetForm.identity);
        setPassword("");
        setResetForm({ identity: "", otp: "", newPassword: "", confirmPassword: "" });
        setResetStep(1);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 20% 10%, rgba(255,255,255,0.95), transparent 60%), radial-gradient(45% 45% at 85% 85%, rgba(224,20,127,0.12), transparent 65%)",
        }}
      />

      <div className="glass w-full max-w-lg rounded-[32px] p-7 sm:p-9 shadow-2xl border border-white/40">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-[0.7rem] font-bold text-white shadow-md">
              MB
            </span>
            <div>
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-ink">Studio CMS</p>
              <p className="text-[0.62rem] text-ink/50">Mohit Babariya Portfolio Admin</p>
            </div>
          </div>
          <span className="rounded-full bg-ink/5 px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-wider text-ink/60">
            Secure Portal
          </span>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="mt-6 flex rounded-2xl bg-ink/5 p-1 text-[0.7rem] font-semibold">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`flex-1 rounded-xl py-2 transition-all ${
              mode === "login" ? "bg-white text-ink shadow-sm" : "text-ink/60 hover:text-ink"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={`flex-1 rounded-xl py-2 transition-all ${
              mode === "register" ? "bg-white text-ink shadow-sm" : "text-ink/60 hover:text-ink"
            }`}
          >
            Register Admin
          </button>
          <button
            type="button"
            onClick={() => switchMode("reset")}
            className={`flex-1 rounded-xl py-2 transition-all ${
              mode === "reset" ? "bg-white text-ink shadow-sm" : "text-ink/60 hover:text-ink"
            }`}
          >
            Reset Password
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div role="alert" className="mt-4 rounded-xl bg-[#d11a4a]/10 border border-[#d11a4a]/20 px-3.5 py-2.5 text-[0.72rem] text-[#a3123a]">
            {error}
          </div>
        )}
        {notice && (
          <div role="status" className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-[0.72rem] text-emerald-800">
            {notice}
          </div>
        )}

        {/* ===================== MODE 1: SIGN IN ===================== */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="mt-6 grid gap-4" noValidate>
            <div>
              <label className="label" htmlFor="identity">
                Email or username
              </label>
              <input
                id="identity"
                className="field"
                placeholder="mohit / name@example.com"
                value={identity}
                onChange={(event) => setIdentity(event.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="label" htmlFor="password">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => switchMode("reset")}
                  className="text-[0.62rem] font-medium text-[var(--accent)] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                className="field"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button type="submit" className="btn btn-dark mt-2" disabled={busy}>
              {busy ? "Signing in…" : "Sign in to CMS"}
            </button>
          </form>
        )}

        {/* ===================== MODE 2: REGISTER (OWNER OTP AUTHORIZED) ===================== */}
        {mode === "register" && (
          <form onSubmit={handleRegister} className="mt-6 grid gap-3.5" noValidate>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-[0.68rem] text-amber-900 leading-relaxed">
              <p className="font-bold flex items-center gap-1">
                <span>🔐</span> Owner Authorization Required
              </p>
              <p className="mt-0.5 text-amber-800">
                To prevent unauthorized accounts, registration OTP is sent <strong>exclusively to Mohit&apos;s email</strong>. Mohit must provide the code to complete registration.
              </p>
            </div>

            {regStep === 1 ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="reg-name">
                      Full Name *
                    </label>
                    <input
                      id="reg-name"
                      className="field"
                      placeholder="Alex Sharma"
                      value={regForm.name}
                      onChange={(e) => setRegForm((f) => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="reg-username">
                      Username *
                    </label>
                    <input
                      id="reg-username"
                      className="field"
                      placeholder="alex_editor"
                      value={regForm.username}
                      onChange={(e) => setRegForm((f) => ({ ...f, username: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="reg-email">
                      Email Address *
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      className="field"
                      placeholder="alex@studio.com"
                      value={regForm.email}
                      onChange={(e) => setRegForm((f) => ({ ...f, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="reg-role">
                      Admin Role
                    </label>
                    <select
                      id="reg-role"
                      className="field"
                      value={regForm.role}
                      onChange={(e) => setRegForm((f) => ({ ...f, role: e.target.value }))}
                    >
                      <option value="editor">Editor (Content & Video Access)</option>
                      <option value="assistant">Assistant (Chat & Enquiries)</option>
                      <option value="admin">Admin (Full Management)</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="reg-password">
                      Password * (Min 8 chars)
                    </label>
                    <input
                      id="reg-password"
                      type="password"
                      className="field"
                      placeholder="••••••••"
                      value={regForm.password}
                      onChange={(e) => setRegForm((f) => ({ ...f, password: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="reg-confirm">
                      Confirm Password *
                    </label>
                    <input
                      id="reg-confirm"
                      type="password"
                      className="field"
                      placeholder="••••••••"
                      value={regForm.confirmPassword}
                      onChange={(e) => setRegForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-accent mt-2" disabled={busy}>
                  {busy ? "Sending Authorization Request…" : "Request Account & Send OTP to Mohit"}
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-ink/10 bg-white/50 p-3 text-[0.7rem] text-ink/75">
                  <p>
                    Account for: <strong>{regForm.name}</strong> (@{regForm.username})
                  </p>
                  <p className="mt-0.5 text-ink/55">Email: {regForm.email}</p>
                </div>

                <div>
                  <label className="label" htmlFor="reg-otp">
                    6-Digit Master Authorization Code *
                  </label>
                  <input
                    id="reg-otp"
                    inputMode="numeric"
                    maxLength={6}
                    className="field text-center font-mono text-lg tracking-[0.4em]"
                    placeholder="123456"
                    value={regForm.otp}
                    onChange={(e) => setRegForm((f) => ({ ...f, otp: e.target.value.replace(/\D/g, "") }))}
                    required
                  />
                  <p className="mt-1 text-[0.6rem] text-ink/50">
                    Ask Mohit for the 6-digit authorization code received on his email.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="btn btn-accent flex-1" disabled={busy || regForm.otp.length < 6}>
                    {busy ? "Verifying…" : "Authorize & Create Admin"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegStep(1)}
                    className="btn btn-ghost text-ink/60"
                  >
                    Edit details
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        {/* ===================== MODE 3: RESET PASSWORD ===================== */}
        {mode === "reset" && (
          <form onSubmit={handleReset} className="mt-6 grid gap-3.5" noValidate>
            <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-3 text-[0.68rem] text-sky-950 leading-relaxed">
              <p className="font-bold flex items-center gap-1">
                <span>🛡️</span> Security Password Reset
              </p>
              <p className="mt-0.5 text-sky-800">
                To protect admin security, the master password reset code is delivered directly to Mohit&apos;s owner email.
              </p>
            </div>

            {resetStep === 1 ? (
              <>
                <div>
                  <label className="label" htmlFor="reset-identity">
                    Admin Email or Username *
                  </label>
                  <input
                    id="reset-identity"
                    className="field"
                    placeholder="mohit / your-admin-username"
                    value={resetForm.identity}
                    onChange={(e) => setResetForm((f) => ({ ...f, identity: e.target.value }))}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-dark mt-2" disabled={busy || !resetForm.identity}>
                  {busy ? "Sending Master OTP…" : "Send Reset Code to Owner"}
                </button>
              </>
            ) : (
              <div className="space-y-3.5">
                <div>
                  <label className="label" htmlFor="reset-otp">
                    6-Digit Master Reset Code *
                  </label>
                  <input
                    id="reset-otp"
                    inputMode="numeric"
                    maxLength={6}
                    className="field text-center font-mono text-lg tracking-[0.4em]"
                    placeholder="123456"
                    value={resetForm.otp}
                    onChange={(e) => setResetForm((f) => ({ ...f, otp: e.target.value.replace(/\D/g, "") }))}
                    required
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="reset-newpass">
                      New Password *
                    </label>
                    <input
                      id="reset-newpass"
                      type="password"
                      className="field"
                      placeholder="••••••••"
                      value={resetForm.newPassword}
                      onChange={(e) => setResetForm((f) => ({ ...f, newPassword: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="reset-confirm">
                      Confirm New Password *
                    </label>
                    <input
                      id="reset-confirm"
                      type="password"
                      className="field"
                      placeholder="••••••••"
                      value={resetForm.confirmPassword}
                      onChange={(e) => setResetForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="btn btn-dark flex-1"
                    disabled={busy || resetForm.otp.length < 6 || resetForm.newPassword.length < 8}
                  >
                    {busy ? "Updating Password…" : "Update Password"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="btn btn-ghost text-ink/60"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        {/* Footer info & website link */}
        <div className="hairline mt-6 pt-5 flex items-center justify-between">
          <p className="mono text-[0.62rem] text-ink/45">
            Protected by multi-factor master verification.
          </p>
          <Link
            href="/"
            className="link-underline text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink/60 hover:text-ink"
          >
            ← Back to website
          </Link>
        </div>
      </div>
    </main>
  );
}
