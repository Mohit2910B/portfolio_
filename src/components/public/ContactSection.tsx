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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

export default function ContactSection({ settings, introText }: ContactSectionProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    countryCode: "+91",
    phone: "",
    company: "",
    projectType: "Video Editing",
    description: "",
    budget: "$1,000 - $3,000",
    deadline: "Within 2 Weeks",
  });

  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const email = settings?.email || "Mohitbabariyaa@gmail.com";
  const phone = settings?.phone || "+91 9033828412";
  const location = settings?.location || "Working Worldwide 🌍";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setErrorMsg("");

    // 1. Frontend validation
    const cleanName = formData.name.trim();
    if (!cleanName || cleanName.length < 2) {
      setErrorMsg("Please enter your name (minimum 2 characters).");
      return;
    }

    const cleanEmail = formData.email.trim();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setErrorMsg("Please enter a valid email address (e.g. name@company.com).");
      return;
    }

    const cleanDesc = formData.description.trim();
    if (!cleanDesc || cleanDesc.length < 5) {
      setErrorMsg("Please describe your project details or requirements (minimum 5 characters).");
      return;
    }

    // 2. Honeypot check
    if (honeypot) {
      // Quiet rejection for bot scripts
      setErrorMsg("Submission could not be processed.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          name: cleanName,
          email: cleanEmail,
          description: cleanDesc,
          _hp: honeypot,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit project brief. Please try again.");
      }

      // Success confirmed by service
      setSuccess(true);
      // Reset form fields only on genuine success
      setFormData({
        name: "",
        email: "",
        countryCode: "+91",
        phone: "",
        company: "",
        projectType: "Video Editing",
        description: "",
        budget: "$1,000 - $3,000",
        deadline: "Within 2 Weeks",
      });
      setHoneypot("");
    } catch (err: unknown) {
      // On failure, preserve all user-entered form data in state!
      setErrorMsg(err instanceof Error ? err.message : "Submission failed. Your data is preserved below.");
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
            07 // GET IN TOUCH
          </span>

          <div className="space-y-2">
            <h2 className="font-serif font-bold text-4xl sm:text-6xl tracking-tight text-[var(--text-primary)] leading-[1.05]">
              Have a Project in Mind?
            </h2>
            <div className="font-serif italic font-light text-2xl sm:text-3xl text-[var(--accent)]">
              Let's turn ideas into visual experiences.
            </div>
          </div>

          <p className="text-sm sm:text-base text-[var(--text-secondary)] font-light leading-relaxed">
            {introText ||
              "Looking for professional video editing, graphic design, motion graphics, 3D visuals, or AI-powered content? I'm available to collaborate with businesses, brands, agencies, and individuals worldwide. Let's turn your ideas into powerful visual experiences."}
          </p>

          {/* Quick Contact Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={`https://wa.me/919033828412?text=${encodeURIComponent("Hi Mohit, I came across your portfolio and would like to discuss a project!")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold tracking-wider uppercase rounded-full shadow-lg transition-all flex items-center space-x-2"
            >
              <span>💬</span>
              <span>CHAT ON WHATSAPP</span>
            </a>

            <a
              href={`mailto:${email}?subject=${encodeURIComponent("New Project Inquiry // Mohit Babariya")}`}
              className="px-6 py-3 bg-[#1c1c1c] hover:bg-[#2a2a2a] border border-[var(--border-glass)] text-white font-mono text-xs font-bold tracking-wider uppercase rounded-full transition-all flex items-center space-x-2"
            >
              <span>✉</span>
              <span>DIRECT EMAIL</span>
            </a>
          </div>

          <div className="space-y-5 pt-6 font-mono text-xs text-[var(--text-secondary)] border-t border-[var(--border-glass)]">
            <div>
              <div className="text-[var(--accent)] uppercase mb-1 font-bold">CREATOR</div>
              <div className="text-lg text-[var(--text-primary)] font-serif font-bold">
                Mohit Babariya
              </div>
            </div>

            <div>
              <div className="text-[var(--accent)] uppercase mb-1 font-bold">DIRECT EMAIL</div>
              <a
                href={`mailto:${email}`}
                className="text-base text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors font-sans"
              >
                {email}
              </a>
            </div>

            <div>
              <div className="text-[var(--accent)] uppercase mb-1 font-bold">PHONE & WHATSAPP</div>
              <a
                href="tel:+919033828412"
                className="text-base text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors font-sans"
              >
                {phone}
              </a>
            </div>

            <div>
              <div className="text-[var(--accent)] uppercase mb-1 font-bold">LOCATION / AVAILABILITY</div>
              <div className="text-sm text-[var(--text-primary)] font-sans">
                {location}
              </div>
            </div>
          </div>
        </div>

        {/* Right Contact Form Panel */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="glass-panel-strong p-8 space-y-6 rounded-3xl relative"
            noValidate
          >
            {/* Honeypot anti-spam field (hidden from view) */}
            <div className="absolute opacity-0 pointer-events-none -left-[9999px]" aria-hidden="true">
              <label htmlFor="website_hp">Ignore this input</label>
              <input
                id="website_hp"
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {success && (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 text-xs font-mono uppercase tracking-widest rounded-xl flex items-start space-x-3 shadow-lg">
                <span className="text-emerald-400 font-bold text-sm">✓</span>
                <div className="space-y-1">
                  <div className="font-bold">THANK YOU! YOUR PROJECT BRIEF HAS BEEN DELIVERED.</div>
                  <div className="text-[11px] text-emerald-400/80 normal-case font-sans">
                    Mohit has received your details and will get back to you promptly.
                  </div>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 bg-rose-950/60 border border-rose-500/60 text-rose-300 text-xs font-mono uppercase tracking-widest rounded-xl space-y-2 shadow-lg">
                <div className="flex items-start space-x-2">
                  <span className="text-rose-400 font-bold text-sm">⚠</span>
                  <div className="leading-relaxed">{errorMsg}</div>
                </div>
                {/* Fallback direct action buttons */}
                <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-sans normal-case">
                  <a
                    href={`mailto:${email}?subject=${encodeURIComponent(`Project Brief from ${formData.name || "Client"}`)}&body=${encodeURIComponent(
                      `Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nCompany: ${formData.company}\nCategory: ${formData.projectType}\nTimeline: ${formData.deadline}\n\nProject Details:\n${formData.description}`
                    )}`}
                    className="inline-flex items-center px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded-md border border-rose-700/50 transition-colors"
                  >
                    ✉ Send directly via Email app
                  </a>
                  <a
                    href={`https://wa.me/919033828412?text=${encodeURIComponent(
                      `Hi Mohit, here is my project brief:\n\nName: ${formData.name}\nEmail: ${formData.email}\nCategory: ${formData.projectType}\nDetails: ${formData.description}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 rounded-md border border-emerald-700/50 transition-colors"
                  >
                    💬 Send directly on WhatsApp
                  </a>
                </div>
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
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black/40 border border-[var(--border-glass)] px-4 py-3 text-sm text-[var(--text-primary)] rounded-xl focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
                  EMAIL ADDRESS *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-black/40 border border-[var(--border-glass)] px-4 py-3 text-sm text-[var(--text-primary)] rounded-xl focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
                  PHONE / WHATSAPP NUMBER
                </label>
                <input
                  type="tel"
                  placeholder="+91 90338 28412"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-black/40 border border-[var(--border-glass)] px-4 py-3 text-sm text-[var(--text-primary)] rounded-xl focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
                  COMPANY / BRAND NAME
                </label>
                <input
                  type="text"
                  placeholder="Brand / Channel Name"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full bg-black/40 border border-[var(--border-glass)] px-4 py-3 text-sm text-[var(--text-primary)] rounded-xl focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
                  PROJECT CATEGORY
                </label>
                <select
                  value={formData.projectType}
                  onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                  className="w-full bg-black/40 border border-[var(--border-glass)] px-4 py-3 text-xs text-[var(--text-primary)] rounded-xl focus:border-[var(--accent)] focus:outline-none transition-colors"
                >
                  <option value="Video Editing">Video Editing (Reels, Commercials)</option>
                  <option value="Graphic Design">Graphic Design (Posters, Ads)</option>
                  <option value="Motion Graphics & VFX">Motion Graphics & VFX</option>
                  <option value="3D Design & Visualization">3D Design & Visualization</option>
                  <option value="AI Content Creation">AI-Powered Content Creation</option>
                  <option value="Social Media Content">Social Media Campaigns</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
                  ESTIMATED TIMELINE
                </label>
                <select
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full bg-black/40 border border-[var(--border-glass)] px-4 py-3 text-xs text-[var(--text-primary)] rounded-xl focus:border-[var(--accent)] focus:outline-none transition-colors"
                >
                  <option value="Urgent (1-3 Days)">Urgent (1-3 Days)</option>
                  <option value="Within 1 Week">Within 1 Week</option>
                  <option value="Within 2-3 Weeks">Within 2-3 Weeks</option>
                  <option value="Ongoing Monthly Retainer">Ongoing Monthly Retainer</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
                PROJECT DETAILS & REQUIREMENTS *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Share your video vision, style references, number of videos needed, or project brief..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-black/40 border border-[var(--border-glass)] p-4 text-sm text-[var(--text-primary)] rounded-xl focus:border-[var(--accent)] focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-amber-600 to-[var(--accent)] text-[var(--bg-main)] font-mono text-xs font-bold tracking-[0.2em] uppercase rounded-full hover:brightness-110 transition-all disabled:opacity-50 shadow-xl cursor-pointer flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[var(--bg-main)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>SENDING PROJECT BRIEF...</span>
                </>
              ) : (
                <span>SUBMIT PROJECT BRIEF ↗</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
