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
    projectType: "Video Editing",
    description: "",
    budget: "$1,000 - $3,000",
    deadline: "Within 2 Weeks",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const email = settings?.email || "Mohitbabariyaa@gmail.com";
  const phone = settings?.phone || "+91 9033828412";
  const location = settings?.location || "Working Worldwide 🌍";

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
        projectType: "Video Editing",
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
            className="glass-panel-strong p-8 space-y-6 rounded-3xl"
          >
            {success && (
              <div className="p-4 bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs font-mono uppercase tracking-widest rounded-xl">
                ✓ THANK YOU! YOUR PROJECT INQUIRY HAS BEEN RECEIVED. MOHIT WILL GET BACK TO YOU PROMPTLY.
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
                  placeholder="e.g. Rahul Sharma"
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
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-black/40 border border-[var(--border-glass)] px-4 py-3 text-sm text-[var(--text-primary)] rounded-xl focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
                  PHONE / WHATSAPP NUMBER
                </label>
                <input
                  type="text"
                  placeholder="+91 90338 28412"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-black/40 border border-[var(--border-glass)] px-4 py-3 text-sm text-[var(--text-primary)] rounded-xl focus:border-[var(--accent)] focus:outline-none"
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
                  className="w-full bg-black/40 border border-[var(--border-glass)] px-4 py-3 text-sm text-[var(--text-primary)] rounded-xl focus:border-[var(--accent)] focus:outline-none"
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
                  className="w-full bg-black/40 border border-[var(--border-glass)] px-4 py-3 text-xs text-[var(--text-primary)] rounded-xl focus:border-[var(--accent)] focus:outline-none"
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
                  className="w-full bg-black/40 border border-[var(--border-glass)] px-4 py-3 text-xs text-[var(--text-primary)] rounded-xl focus:border-[var(--accent)] focus:outline-none"
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
                className="w-full bg-black/40 border border-[var(--border-glass)] p-4 text-sm text-[var(--text-primary)] rounded-xl focus:border-[var(--accent)] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-amber-600 to-[var(--accent)] text-[var(--bg-main)] font-mono text-xs font-bold tracking-[0.2em] uppercase rounded-full hover:brightness-110 transition-all disabled:opacity-50 shadow-xl"
            >
              {loading ? "SENDING BRIEF..." : "SUBMIT PROJECT BRIEF ↗"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
