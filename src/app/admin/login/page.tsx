"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameOrEmail, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed.");
      }

      router.push("/admin/dashboard");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Authentication error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F0E8] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-[#111111] border border-[rgba(243,240,232,0.15)] p-8 shadow-2xl space-y-8">
        <div className="text-center space-y-2">
          <div className="font-mono text-xs text-[#C7A56A] tracking-[0.25em] uppercase font-bold">
            MOHIT BABARIYA CMS
          </div>
          <h1 className="font-display font-extrabold text-2xl uppercase tracking-tight">
            ADMIN PORTAL LOGIN
          </h1>
          <p className="text-xs text-[#8A8A8A]">
            Authenticated access for portfolio content management.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono uppercase tracking-widest text-center">
            ⚠ {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block font-mono text-xs text-[#8A8A8A] uppercase tracking-widest">
              USERNAME / EMAIL
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mohit or mohitbabariyaa@gmail.com"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] px-4 py-3 text-sm text-[#F3F0E8] focus:border-[#C7A56A] focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block font-mono text-xs text-[#8A8A8A] uppercase tracking-widest">
              PASSWORD
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] px-4 py-3 text-sm text-[#F3F0E8] focus:border-[#C7A56A] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#C7A56A] text-[#080808] font-mono text-xs font-bold tracking-widest uppercase hover:bg-[#D8B77C] transition-all disabled:opacity-50"
          >
            {loading ? "AUTHENTICATING..." : "ENTER ADMIN DASHBOARD ↗"}
          </button>
        </form>

        <div className="text-center font-mono text-[10px] text-[#8A8A8A]">
          DEFAULT DEMO LOGIN: Mohit / Mohit@2910
        </div>
      </div>
    </div>
  );
}
