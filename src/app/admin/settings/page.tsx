"use client";

import { useState } from "react";

export default function AdminSettingsPage() {
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
  });

  const [contactSettings, setContactSettings] = useState({
    email: "mohitbabariyaa@gmail.com",
    phone: "+91 98765 43210",
    location: "Mumbai, India / Remote Worldwide",
    instagram: "https://instagram.com/mohitbabariya",
    youtube: "https://youtube.com/@mohitbabariya",
    linkedin: "https://linkedin.com/in/mohitbabariya",
  });

  const [savingAdmin, setSavingAdmin] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [msgAdmin, setMsgAdmin] = useState("");
  const [msgContact, setMsgContact] = useState("");

  const handleRegisterAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAdmin(true);
    setMsgAdmin("");

    try {
      const res = await fetch("/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAdmin),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");

      setMsgAdmin(`✓ Admin account created successfully for ${data.admin.username}!`);
      setNewAdmin({ name: "", email: "", username: "", password: "" });
    } catch (err: unknown) {
      setMsgAdmin(err instanceof Error ? err.message : "Error creating admin.");
    } finally {
      setSavingAdmin(false);
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContact(true);
    setMsgContact("");

    try {
      const res = await fetch("/api/contact-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactSettings),
      });

      if (res.ok) {
        setMsgContact("✓ Contact settings updated & saved in PostgreSQL!");
      }
    } catch {} finally {
      setSavingContact(false);
    }
  };

  return (
    <div className="space-y-10 max-w-4xl font-mono text-xs">
      <div className="border-b border-[rgba(243,240,232,0.12)] pb-6">
        <div className="text-[#C7A56A] uppercase tracking-widest">
          ADMIN & SYSTEM SETTINGS
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl uppercase tracking-tight text-[#F3F0E8]">
          SETTINGS & ADMIN USER MANAGEMENT
        </h1>
      </div>

      {/* Register New Admin Account (Requirement 26) */}
      <div className="border border-[rgba(243,240,232,0.12)] bg-[#111111] p-6 space-y-6">
        <div>
          <h2 className="font-display font-bold text-lg text-[#C7A56A] uppercase">
            REGISTER NEW ADMIN USER
          </h2>
          <p className="text-[#8A8A8A] text-[11px] mt-1">
            Only authenticated admins can create additional admin accounts. Public registration is disabled.
          </p>
        </div>

        {msgAdmin && (
          <div className="p-3 bg-[#080808] border border-[rgba(243,240,232,0.2)] text-[#F3F0E8] uppercase">
            {msgAdmin}
          </div>
        )}

        <form onSubmit={handleRegisterAdmin} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">FULL NAME *</label>
              <input
                type="text"
                required
                placeholder="e.g. Mohit Babariya"
                value={newAdmin.name}
                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">EMAIL ADDRESS *</label>
              <input
                type="email"
                required
                placeholder="mohit@domain.com"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">USERNAME *</label>
              <input
                type="text"
                required
                placeholder="mohit_admin"
                value={newAdmin.username}
                onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">PASSWORD *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingAdmin}
            className="px-6 py-3 bg-[#C7A56A] text-[#080808] font-bold uppercase tracking-wider hover:bg-[#D8B77C]"
          >
            {savingAdmin ? "CREATING USER..." : "CREATE ADMIN ACCOUNT ↗"}
          </button>
        </form>
      </div>

      {/* Contact & Social Links Settings */}
      <div className="border border-[rgba(243,240,232,0.12)] bg-[#111111] p-6 space-y-6">
        <div>
          <h2 className="font-display font-bold text-lg text-[#C7A56A] uppercase">
            CONTACT & SOCIAL MEDIA LINKS
          </h2>
        </div>

        {msgContact && (
          <div className="p-3 bg-[#080808] border border-[rgba(243,240,232,0.2)] text-[#F3F0E8] uppercase">
            {msgContact}
          </div>
        )}

        <form onSubmit={handleSaveContact} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">PRIMARY EMAIL</label>
              <input
                type="email"
                value={contactSettings.email}
                onChange={(e) => setContactSettings({ ...contactSettings, email: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">PHONE / WHATSAPP</label>
              <input
                type="text"
                value={contactSettings.phone}
                onChange={(e) => setContactSettings({ ...contactSettings, phone: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">INSTAGRAM</label>
              <input
                type="text"
                value={contactSettings.instagram}
                onChange={(e) => setContactSettings({ ...contactSettings, instagram: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">YOUTUBE</label>
              <input
                type="text"
                value={contactSettings.youtube}
                onChange={(e) => setContactSettings({ ...contactSettings, youtube: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">LINKEDIN</label>
              <input
                type="text"
                value={contactSettings.linkedin}
                onChange={(e) => setContactSettings({ ...contactSettings, linkedin: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingContact}
            className="px-6 py-3 bg-[#C7A56A] text-[#080808] font-bold uppercase tracking-wider hover:bg-[#D8B77C]"
          >
            {savingContact ? "SAVING..." : "SAVE CONTACT SETTINGS ↗"}
          </button>
        </form>
      </div>
    </div>
  );
}
