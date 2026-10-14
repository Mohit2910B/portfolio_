"use client";

import { useState } from "react";

interface HeroProps {
  content?: {
    heroEyebrow?: string;
    heroHeading?: string;
    heroSubtitle?: string;
    heroDescription?: string;
    heroCtaPrimary?: string;
    heroCtaSecondary?: string;
    heroMediaUrl?: string;
  };
  onOpenVideo?: (videoUrl: string, title: string) => void;
}

export default function Hero({ content, onOpenVideo }: HeroProps) {
  const eyebrow = content?.heroEyebrow || "VIDEO EDITOR | GRAPHIC DESIGNER | 3D ARTIST | AI CREATOR";
  const subtitle = content?.heroSubtitle || "Video Editor | Graphic Designer | 3D Artist | AI Creator";
  const description =
    content?.heroDescription ||
    "With 2+ years of experience in creative production, I transform ideas into engaging videos, impactful graphics, stunning 3D visuals, and innovative AI-powered content. I help brands and businesses communicate their stories through creative visuals, professional editing, and modern digital content.";
  const ctaPrimary = content?.heroCtaPrimary || "EXPLORE MY WORK";
  const ctaSecondary = content?.heroCtaSecondary || "LET'S WORK TOGETHER";
  const videoUrl = content?.heroMediaUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

  const [isPlaying] = useState(true);

  return (
    <section className="relative min-h-screen pt-36 pb-24 flex items-center justify-center overflow-hidden border-b border-[var(--border-glass)]">
      {/* Background Atmosphere: Ambient Glow & Gradient Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[550px] h-[550px] bg-[var(--accent)]/12 rounded-full blur-[140px] animate-pulse-glow" />
        <div className="absolute bottom-1/3 right-1/4 w-[450px] h-[450px] bg-[var(--accent-cool)]/10 rounded-full blur-[120px] animate-pulse-glow" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Editorial Column */}
        <div className="lg:col-span-7 space-y-8">
          {/* Status Badge */}
          <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 glass-panel text-[var(--accent)] font-mono text-[11px] tracking-[0.2em] uppercase font-bold">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
            <span>MOHIT BABARIYA — CREATIVE PRODUCER</span>
          </div>

          {/* Display Headline */}
          <div className="space-y-2">
            <div className="font-mono text-xs tracking-[0.25em] text-[var(--accent)] uppercase font-bold">
              {subtitle}
            </div>
            <h1 className="font-serif font-bold text-5xl sm:text-6xl lg:text-7xl leading-[1.0] tracking-tight text-[var(--text-primary)]">
              Turning Ideas Into
            </h1>
            <h1 className="font-serif italic font-light text-5xl sm:text-6xl lg:text-7xl leading-[1.0] tracking-tight text-[var(--accent)]">
              Visual Experiences.
            </h1>
          </div>

          {/* Subtitle & Description */}
          <div className="space-y-3 pt-2 max-w-xl">
            <p className="text-sm sm:text-base text-[var(--text-secondary)] font-light leading-relaxed">
              {description}
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 pt-2 border-y border-[var(--border-glass)] py-4 max-w-lg">
            <div>
              <div className="font-serif text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">2+</div>
              <div className="font-mono text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Years Experience</div>
            </div>
            <div>
              <div className="font-serif text-2xl sm:text-3xl font-bold text-[var(--accent)]">500+</div>
              <div className="font-mono text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Projects Completed</div>
            </div>
            <div>
              <div className="font-serif text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">100%</div>
              <div className="font-mono text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Client Score</div>
            </div>
          </div>

          {/* CTAs */}
          <div className="pt-2 flex flex-wrap gap-4 items-center">
            <a
              href="#work"
              className="px-8 py-4 bg-[var(--accent)] text-[var(--bg-main)] font-mono text-xs font-bold tracking-[0.2em] uppercase rounded-full hover:bg-[var(--accent-hover)] transition-all shadow-xl transform hover:-translate-y-0.5"
            >
              {ctaPrimary}
            </a>
            <a
              href="#contact"
              className="px-8 py-4 glass-panel text-[var(--text-primary)] font-mono text-xs tracking-[0.2em] uppercase rounded-full hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
            >
              {ctaSecondary}
            </a>
          </div>
        </div>

        {/* Right Column: 9:16 Vertical Screen Frame */}
        <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
          <div className="absolute -inset-4 bg-gradient-to-r from-[var(--accent)]/15 to-[var(--accent-cool)]/10 rounded-[32px] blur-2xl opacity-50 pointer-events-none" />

          <div
            onClick={() => onOpenVideo && onOpenVideo(videoUrl, "MOHIT BABARIYA — REEL SHOWREEL")}
            className="relative glass-panel-strong p-3 space-y-3 cursor-pointer group transform hover:scale-[1.01] transition-transform duration-500 rounded-[28px] max-w-[340px] sm:max-w-[380px] w-full shadow-2xl"
          >
            {/* The 9:16 Vertical Reel Screen Frame */}
            <div className="relative aspect-[9/16] w-full rounded-[22px] overflow-hidden bg-black border border-white/10 shadow-inner">
              <img
                src="/images/mohit-vertical.png?v=5"
                alt="Mohit Babariya — Video Editor, 3D Artist & Creative Producer"
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                loading="eager"
              />

              {/* Bottom Subtle Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              {/* Play Showreel Overlay on Hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <button className="px-6 py-3 bg-[var(--accent)] text-[var(--bg-main)] font-mono text-xs font-bold tracking-widest uppercase rounded-full shadow-2xl flex items-center space-x-2">
                  <span>▶</span>
                  <span>PLAY SHOWREEL</span>
                </button>
              </div>
            </div>

            {/* Bottom Metadata Bar */}
            <div className="flex items-center justify-between px-2 font-mono text-[10px] text-[var(--text-secondary)] uppercase">
              <span>PREMIERE PRO / AFTER EFFECTS / DAVINCI</span>
              <span className="text-[var(--accent)] font-bold">4K 60FPS</span>
            </div>
          </div>

          {/* Floating Badge: 100% Solid Dark Charcoal, NOT Transparent, Zero Glassmorphism */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenVideo) onOpenVideo(videoUrl, "FEATURED SHOWREEL");
            }}
            className="absolute -bottom-5 -left-4 sm:-bottom-6 sm:-left-6 p-4 space-y-1 cursor-pointer animate-float hidden sm:block max-w-[220px] rounded-xl z-20 border border-[#2a2a2a] shadow-[0_20px_40px_rgba(0,0,0,0.95)]"
            style={{
              backgroundColor: "#141414",
              background: "#141414",
              backdropFilter: "none",
              WebkitBackdropFilter: "none",
              opacity: 1,
            }}
          >
            <div className="font-mono text-[9px] text-[var(--accent)] tracking-widest uppercase font-bold">
              FEATURED WORK
            </div>
            <div className="font-serif font-bold text-sm uppercase text-[var(--text-primary)]">
              COMMERCIAL SHOWREEL
            </div>
            <div className="font-mono text-[10px] text-[var(--text-secondary)] hover:text-[var(--accent)]">
              WATCH NOW →
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
