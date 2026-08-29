import SiteNav from "@/components/site/SiteNav";
import Hero from "@/components/site/Hero";
import WorkCarousel from "@/components/site/WorkCarousel";
import ContactSection from "@/components/site/ContactSection";
import ChatWidget from "@/components/site/ChatWidget";
import SoftwareTools from "@/components/site/SoftwareTools";
import { About, Footer, Marquee, Services } from "@/components/site/Sections";
import { getSiteData, HOME_FALLBACK } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_ORDER = ["hero", "about", "tools", "services", "work", "contact"];

export default async function HomePage() {
  const data = await getSiteData();
  const visible = (data?.sections || [])
    .filter((s) => s.isVisible && (s.sectionKey as string) !== "capabilities")
    .map((s) => s.sectionKey);
  const order = visible.length > 0 ? visible : DEFAULT_ORDER;
  const theme = data?.theme || {
    id: 1,
    accent: "#e0147f",
    glassOpacity: 45,
    glassBlur: 20,
    grain: true,
    updatedAt: new Date(),
  };
  const homepage = data?.homepage || HOME_FALLBACK;

  const themeStyle = {
    "--accent": theme.accent || "#e0147f",
    "--glass-alpha": String((theme.glassOpacity ?? 45) / 100),
    "--glass-blur": `${theme.glassBlur ?? 20}px`,
  } as React.CSSProperties;

  const marqueeText =
    homepage.heroSubtitle || "VIDEO EDITOR · MOTION GRAPHICS · GRAPHIC DESIGN · AI VIDEO";

  const render = (key: string) => {
    switch (key) {
      case "hero":
        return <Hero key={key} data={data} />;
      case "about":
        return <About key={key} data={data} />;
      case "tools":
        return <SoftwareTools key={key} data={data} />;
      case "services":
        return <Services key={key} data={data} />;
      case "work":
        return <WorkCarousel key={key} data={data} />;
      case "contact":
        return <ContactSection key={key} data={data} />;
      default:
        return null;
    }
  };

  return (
    <div style={themeStyle} className={theme.grain ? "grain relative" : "relative"}>
      <SiteNav name={homepage.ownerName} availability={homepage.availabilityLabel} />
      <main>
        {order.map((key, index) => (
          <div key={key}>
            {render(key)}
            {key === "hero" && <Marquee text={marqueeText} />}
            {index === order.length - 1 && key !== "contact" && (
              <Marquee text={marqueeText} />
            )}
          </div>
        ))}
        {order.length === 0 && (
          <>
            <Hero data={data} />
            <Marquee text={marqueeText} />
            <WorkCarousel data={data} />
            <About data={data} />
            <SoftwareTools data={data} />
            <Services data={data} />
            <ContactSection data={data} />
          </>
        )}
      </main>
      <Footer data={data} />
      <ChatWidget />
    </div>
  );
}
