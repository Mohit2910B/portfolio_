"use client";

interface FooterProps {
  ownerName?: string;
  tagline?: string;
  copyright?: string;
}

export default function Footer({
  ownerName = "MOHIT BABARIYA",
  tagline = "Creative Solutions. Powerful Visual Stories. Worldwide Collaboration.",
  copyright = "© 2026 Mohit Babariya. All Rights Reserved.",
}: FooterProps) {
  return (
    <footer className="py-16 bg-[var(--bg-main)] text-[var(--text-primary)] border-t border-[var(--border-glass)]">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8 font-mono text-xs text-[var(--text-secondary)]">
        <div className="space-y-2 text-center md:text-left">
          <div className="font-serif font-bold text-2xl text-[var(--text-primary)] tracking-wider uppercase">
            {ownerName}
          </div>
          <div className="tracking-widest uppercase text-[var(--accent)] font-bold text-[10px]">
            {tagline}
          </div>
        </div>

        <div className="flex items-center space-x-8 tracking-widest uppercase font-mono text-[11px]">
          <a href="#work" className="hover:text-[var(--text-primary)] transition-colors">
            PORTFOLIO
          </a>
          <a href="#about" className="hover:text-[var(--text-primary)] transition-colors">
            ABOUT
          </a>
          <a href="#services" className="hover:text-[var(--text-primary)] transition-colors">
            SERVICES
          </a>
          <a href="#contact" className="hover:text-[var(--text-primary)] transition-colors">
            CONTACT
          </a>
          <a href="/admin/login" className="text-[var(--accent)] hover:underline font-bold">
            CMS PORTAL
          </a>
        </div>

        <div className="text-[10px] tracking-widest uppercase text-[var(--text-secondary)]">
          {copyright}
        </div>
      </div>
    </footer>
  );
}
