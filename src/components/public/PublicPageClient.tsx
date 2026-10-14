"use client";

import { useState } from "react";
import { CustomThemeConfig, themeConfigToCssVars } from "@/lib/themeConfig";
import CustomCursor from "./CustomCursor";
import Header from "./Header";
import Hero from "./Hero";
import SingleVerticalPortfolio from "./SingleVerticalPortfolio";
import SelectedWork from "./SelectedWork";
import About from "./About";
import Experience, { ExperienceItem } from "./Experience";
import Services, { ServiceItem } from "./Services";
import Skills, { SkillItem } from "./Skills";
import Tools, { ToolItem } from "./Tools";
import CreativeProcess, { ProcessItem } from "./CreativeProcess";
import ContactSection from "./ContactSection";
import Footer from "./Footer";
import VideoModal from "./VideoModal";

interface PublicPageClientProps {
  content?: {
    heroEyebrow?: string;
    heroHeading?: string;
    heroSubtitle?: string;
    heroDescription?: string;
    heroCtaPrimary?: string;
    heroCtaSecondary?: string;
    heroMediaUrl?: string;
    aboutHeading?: string;
    aboutSubheading?: string;
    aboutDescription?: string;
    aboutExperienceYears?: string;
    aboutProjectsCompleted?: string;
    aboutClientsCount?: string;
    servicesIntro?: string;
    portfolioIntro?: string;
    processIntro?: string;
    contactIntro?: string;
    footerTagline?: string;
    footerCopyright?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    location?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
    responseTime?: string;
  };
  activeTheme?: number;
  customThemeConfig?: Partial<CustomThemeConfig>;
  layoutOrder?: Array<{ sectionKey: string; label: string; sortOrder: number; isVisible: boolean }>;
  projects?: any[];
  carouselItems?: any[];
  categories?: any[];
  services?: ServiceItem[];
  skills?: SkillItem[];
  tools?: ToolItem[];
  experience?: ExperienceItem[];
  creativeProcess?: ProcessItem[];
}

export default function PublicPageClient({
  content,
  contact,
  activeTheme = 1,
  customThemeConfig,
  layoutOrder = [],
  projects = [],
  carouselItems = [],
  categories = [],
  services = [],
  skills = [],
  tools = [],
  experience = [],
  creativeProcess = [],
}: PublicPageClientProps) {
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activeVideoTitle, setActiveVideoTitle] = useState<string>("");
  const [currentTheme, setCurrentTheme] = useState<number>(activeTheme);

  const handleOpenVideo = (url: string, title: string) => {
    setActiveVideoUrl(url);
    setActiveVideoTitle(title);
  };

  const handlePrefillEnquiry = (msg: string) => {
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const visibleSections = layoutOrder.filter((s) => s.isVisible);
  let portfolioRendered = false;

  const cssVars = themeConfigToCssVars(customThemeConfig) as React.CSSProperties;

  return (
    <div
      data-theme={currentTheme}
      style={cssVars}
      className="min-h-screen relative bg-[var(--bg-main)] text-[var(--text-primary)] font-sans transition-colors duration-500"
    >
      <CustomCursor />

      <Header
        ownerName={content?.heroHeading || "MOHIT BABARIYA"}
        activeTheme={currentTheme}
        onThemeChange={(t) => setCurrentTheme(t)}
      />

      <main className="relative z-10">
        {visibleSections.map((sec) => {
          switch (sec.sectionKey) {
            case "hero":
              return (
                <Hero
                  key="hero"
                  content={content}
                  onOpenVideo={handleOpenVideo}
                />
              );
            case "showreel":
            case "work":
              if (portfolioRendered) return null;
              portfolioRendered = true;
              return (
                <SingleVerticalPortfolio
                  key="single-portfolio"
                  projects={projects}
                  carouselItems={carouselItems}
                  categories={categories}
                  introText={content?.portfolioIntro}
                  onOpenVideo={handleOpenVideo}
                />
              );
            case "about":
              return <About key="about" content={content} />;
            case "experience":
              return <Experience key="experience" items={experience} />;
            case "services":
              return (
                <Services
                  key="services"
                  services={services}
                  introText={content?.servicesIntro}
                />
              );
            case "skills":
              return <Skills key="skills" skills={skills} />;
            case "tools":
              return <Tools key="tools" tools={tools} />;
            case "process":
              return (
                <CreativeProcess
                  key="process"
                  steps={creativeProcess}
                  introText={content?.processIntro}
                />
              );
            case "contact":
              return (
                <ContactSection
                  key="contact"
                  settings={contact}
                  introText={content?.contactIntro}
                />
              );
            default:
              return null;
          }
        })}
      </main>

      <Footer
        ownerName={content?.heroHeading || "MOHIT BABARIYA"}
        tagline={content?.footerTagline}
        copyright={content?.footerCopyright}
      />

      <VideoModal
        videoUrl={activeVideoUrl}
        title={activeVideoTitle}
        onClose={() => setActiveVideoUrl(null)}
      />
    </div>
  );
}
