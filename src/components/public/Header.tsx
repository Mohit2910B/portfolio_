"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface HeaderProps {
  ownerName?: string;
  activeTheme?: number;
  onThemeChange?: (themeId: number) => void;
}

export default function Header({ ownerName = "MOHIT BABARIYA", activeTheme = 1, onThemeChange }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(activeTheme);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSelectTheme = (id: number) => {
    setCurrentTheme(id);
    document.documentElement.setAttribute("data-theme", id.toString());
    if (onThemeChange) onThemeChange(id);
  };

  const themes = [
    { id: 1, name: "Gold", color: "#C8A66A" },
    { id: 3, name: "Cyber", color: "#64FFDA" },
    { id: 5, name: "Purple", color: "#B57EDC" },
    { id: 4, name: "Mono", color: "#FFFFFF" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-[#000000] border-b border-[rgba(243,240,232,0.12)] transition-all duration-300 ${
        scrolled ? "py-3 shadow-[0_10px_30px_rgba(0,0,0,0.9)]" : "py-4"
      }`}
      style={{ backgroundColor: "#000000" }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Left: Brand & Subtitle */}
        <Link href="/" className="flex flex-col group">
          <span className="font-serif font-bold tracking-wider text-lg sm:text-xl text-[#F5F3EE] group-hover:text-[var(--accent)] transition-colors">
            {ownerName.toUpperCase()}
          </span>
          <span className="font-mono text-[9px] tracking-[0.18em] text-[var(--accent)] uppercase font-semibold">
            Video Editor | Graphic Designer | 3D Artist | AI Creator
          </span>
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-7 font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--text-secondary)]">
          <a href="#work" className="hover:text-white transition-colors">
            PORTFOLIO
          </a>
          <a href="#about" className="hover:text-white transition-colors">
            ABOUT
          </a>
          <a href="#experience" className="hover:text-white transition-colors">
            EXPERIENCE
          </a>
          <a href="#services" className="hover:text-white transition-colors">
            SERVICES
          </a>
          <a href="#tools" className="hover:text-white transition-colors">
            TOOLS
          </a>
          <a href="#process" className="hover:text-white transition-colors">
            PROCESS
          </a>
          <a href="#contact" className="hover:text-white transition-colors">
            CONTACT
          </a>
        </nav>

        {/* Right: Theme Accent Dots & CTA */}
        <div className="hidden sm:flex items-center space-x-4">
          {/* Accent Color Palette Selector */}
          <div className="flex items-center space-x-1.5 p-1 bg-[#111111] rounded-full border border-white/10">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelectTheme(t.id)}
                title={`Switch to ${t.name} Theme`}
                className={`w-4 h-4 rounded-full transition-transform ${
                  currentTheme === t.id ? "scale-125 ring-2 ring-white/50" : "opacity-70 hover:opacity-100"
                }`}
                style={{ backgroundColor: t.color }}
              />
            ))}
          </div>

          <a
            href="#contact"
            className="px-5 py-2 font-mono text-xs tracking-widest uppercase rounded-full bg-[var(--accent)] text-black font-bold hover:brightness-110 transition-all shadow-md transform hover:scale-105"
          >
            LET'S TALK
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-white focus:outline-none"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer (Solid Pure Black) */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden w-full bg-[#000000] border-t border-[rgba(243,240,232,0.12)] px-6 py-6 animate-fade-in font-mono text-xs tracking-widest uppercase space-y-4 text-[var(--text-secondary)] shadow-2xl"
          style={{ backgroundColor: "#000000" }}
        >
          <a href="#work" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-white">
            PORTFOLIO
          </a>
          <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-white">
            ABOUT
          </a>
          <a href="#experience" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-white">
            EXPERIENCE
          </a>
          <a href="#services" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-white">
            SERVICES
          </a>
          <a href="#tools" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-white">
            TOOLS
          </a>
          <a href="#process" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-white">
            PROCESS
          </a>
          <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-white">
            CONTACT
          </a>
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-[var(--text-secondary)]">THEME:</span>
              <div className="flex space-x-1.5">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTheme(t.id)}
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                ))}
              </div>
            </div>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 bg-[var(--accent)] text-black font-bold rounded-full"
            >
              LET'S TALK
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
