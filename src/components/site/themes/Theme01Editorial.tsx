"use client";

import type { SiteData } from "@/lib/data";
import SiteNav from "@/components/site/SiteNav";
import Hero from "@/components/site/Hero";
import { Marquee, About, Services, Footer } from "@/components/site/Sections";
import SoftwareTools from "@/components/site/SoftwareTools";
import ContactSection from "@/components/site/ContactSection";
import ChatWidget from "@/components/site/ChatWidget";

export default function Theme01Editorial({ data }: { data: SiteData }) {
  const { homepage } = data;

  return (
    <div className="min-h-screen bg-[var(--paper,#f7f5f2)] text-[var(--ink,#0b0b0c)] font-sans antialiased selection:bg-black selection:text-white">
      {/* Primary Floating Navigation Bar */}
      <SiteNav
        name={homepage.ownerName || "MOHIT BABARIYA"}
        availability={homepage.availabilityLabel || "Available for select commissions"}
      />

      {/* Hero Section with Interactive NLE Video Editor Mockup */}
      <Hero data={data} />

      {/* Marquee Ticker Banner */}
      <Marquee text={typeof homepage.marqueeText === "string" ? homepage.marqueeText : undefined} />

      {/* About / Manifesto Section */}
      <About data={data} />

      {/* Tools & Software Stack */}
      <SoftwareTools data={data} />

      {/* Services & Capabilities Section */}
      <Services data={data} />

      {/* Contact & Project Enquiry Section */}
      <div id="contact">
        <ContactSection data={data} />
      </div>

      {/* Footer */}
      <Footer data={data} />

      {/* Live AI Studio Chat Widget */}
      <ChatWidget />
    </div>
  );
}
