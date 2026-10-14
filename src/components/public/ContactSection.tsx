"use client";

import { useState } from "react";

interface ContactSectionProps {
  settings?: {
    email?: string;
    phone?: string;
    location?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
    responseTime?: string;
  };
  introText?: string;
}

export default function ContactSection({ settings, introText }: ContactSectionProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    countryCode: "+91",
    phone: "",
    company: "",
    projectType: "Commercial Edit",
    description: "",
    budget: "$1,000 - $3,000",
    deadline: "Within 2 Weeks",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setErrorMsg("");

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send message.");
      }

      setSuccess(true);
      setFormData({
        name: "",
        email: "",
        countryCode: "+91",
        phone: "",
        company: "",
        projectType: "Commercial Edit",
        description: "",
        budget: "$1,000 - $3,000",
        deadline: "Within 2 Weeks",
      });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-24 border-b border-[var(--border-glass)] relative">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column */}
        <div className="lg:col-span-5 space-y-8">
          <span className="font-mono text-xs tracking-[0.2em] text-[var(--accent)] uppercase font-bold">
            09 // INITIATE A PROJECT
          </span>

          <div className="space-y-1">
            <h2 className="font-serif font-bold text-4xl sm:text-6xl tracking-tight text-[var(--text-primary)] uppercase leading-[1.05]">
              Let's Make Something
            </h2>
            <h2 className="font-serif italic font-light text-4xl sm:text-6xl tracking-tight text-[var(--accent)]">
              Move.
            </h2>
          </div>

          <p className="text-sm sm:text-base text-[var(--text-secondary)] font-light leading-relaxed">
            {introText ||
              "Have an upcoming video, commercial, or motion graphics project? Send over your brief and let's craft something extraordinary together."}
          </p>

          <div className="space-y-6 pt-4 font-mono text-xs text-[var(--text-secondary)] border-t border-[var(--border-glass)]">
            <div>
              <div className="text-[var(--accent)] uppercase mb-1 font-bold">DIRECT EMAIL</div>
              <a
                href={`mailto:${settings?.email || "mohitbabariyaa@gmail.com"}`}
                className="text-base text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors font-sans"
              >
                {settings?.email || "mohitbabariyaa@gmail.com"}
              </a>
            </div>

            <div>
              <div className="text-[var(--accent)] uppercase mb-1 font-bold">PHONE / WHATSAPP</div>
              <div className="text-base text-[var(--text-primary)] font-sans">
                {settings?.phone || "+91 98765 43210"}
              </div>
            </div>

            <div>
              <div className="text-[var(--accent)] uppercase mb-1 font-bold">LOCATION</div>
              <div className="text-sm text-[var(--text-primary)] font-sans">
                {settings?.location || "Mumbai, India / Remote Worldwide"}
              </div>
            </div>

            <div className="pt-2 flex items-center space-x-6">
              {settings?.instagram && (
                <a
                  href={settings.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  INSTAGRAM ↗
                </a>
              )}
              {settings?.youtube && (
                <a
                  href={settings.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  YOUTUBE ↗
                </a>
              )}
              {settings?.linkedin && (
                <a
                  href={settings.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  LINKEDIN ↗
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right Glass Contact Panel */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="glass-panel-strong p-8 space-y-6"
          >
            {success && (
              <div className="p-4 bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs font-mono uppercase tracking-widest rounded-xl">
                ✓ THANK YOU! YOUR PROJECT BRIEF HAS BEEN RECEIVED. MOHIT WILL RESPOND SHORTLY.
              </div>
            )}

            {errorMsg && (
              <div className="p-4 bg-rose-950/50 border border-rose-500/50 text-rose-300 text-xs font-mono uppercase tracking-widest rounded-xl">
                ⚠ {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
                  YOUR NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Alex Morgan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black/40 border border-[var(--border-glass)] px-4 py-3 text-sm text-[var(--text-primary)] rounded-xl focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
                  EMAIL ADDRESS *
                </label>
                <input
                  type="email"
                  required
                  placeholder="alex@brand.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-black/40 border border-[var(--border-glass)] px-4 py-3 text-sm text-[var(--text-primary)] rounded-xl focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
                  PHONE NUMBER
                </label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-black/40 border border-[var(--border-glass)] px-4 py-3 text-sm text-[var(--text-primary)] rounded-xl focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
                  COMPANY / BRAND
                </label>
                <input
                  type="text"
                  placeholder="Apex Studios"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full bg-black/40 border border-[var(--border-glass)] px-4 py-3 text-sm text-[var(--text-primary)] rounded-xl focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
                  PROJECT TYPE
                </label>
                <select
                  value={formData.projectType}
                  onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                  className="w-full bg-black/40 border border-[var(--border-glass)] px-4 py-3 text-xs text-[var(--text-primary)] rounded-xl focus:border-[var(--accent)] focus:outline-none"
                >
                  <option value="Commercial Edit">Commercial Brand Edit</option>
                  <option value="Motion Graphics">Motion Graphics & 3D</option>
                  <option value="Social Media Reels">Social Media / Reels</option>
                  <option value="Real Estate Video">Real Estate Film</option>
                  <option value="YouTube Long-Form">YouTube Masterclass</option>
                  <option value="AI Video Workflow">AI Video & VFX</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
                  BUDGET RANGE
                </label>
                <select
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full bg-black/40 border border-[var(--border-glass)] px-4 py-3 text-xs text-[var(--text-primary)] rounded-xl focus:border-[var(--accent)] focus:outline-none"
                >
                  <option value="Under $1,000">Under $1,000</option>
                  <option value="$1,000 - $3,000">$1,000 - $3,000</option>
                  <option value="$3,000 - $5,000">$3,000 - $5,000</option>
                  <option value="$5,000+">$5,000+</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
                  DEADLINE
                </label>
                <select
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full bg-black/40 border border-[var(--border-glass)] px-4 py-3 text-xs text-[var(--text-primary)] rounded-xl focus:border-[var(--accent)] focus:outline-none"
                >
                  <option value="ASAP (Urgent)">ASAP (Urgent)</option>
                  <option value="Within 2 Weeks">Within 2 Weeks</option>
                  <option value="Within 1 Month">Within 1 Month</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
                PROJECT BRIEF / MESSAGE *
              </label>
              <textarea
                required
                rows={5}
                placeholder="Describe your project brief, visual aesthetic requirements..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-black/40 border border-[var(--border-glass)] p-4 text-sm text-[var(--text-primary)] rounded-xl focus:border-[var(--accent)] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              data-cursor-button
              className="w-full py-4 bg-[var(--accent)] text-[var(--bg-main)] font-mono text-xs font-bold tracking-[0.2em] uppercase rounded-full hover:bg-[var(--accent-hover)] transition-all disabled:opacity-50 shadow-xl"
            >
              {loading ? "SENDING BRIEF..." : "SUBMIT PROJECT BRIEF ↗"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
