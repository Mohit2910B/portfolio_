import { Suspense } from "react";
import ThemeDispatcher from "@/components/site/themes/ThemeDispatcher";
import { getSiteData } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function HomePage() {
  const data = await getSiteData();
  const theme = data?.theme || {
    id: 1,
    activeTheme: "theme01",
    accent: "#e0147f",
    fontPairing: "default",
    borderRadius: "rounded",
    animationSpeed: "normal",
    cursorEffect: true,
    glassOpacity: 45,
    glassBlur: 20,
    grain: true,
    updatedAt: new Date(),
  };

  const themeStyle = {
    "--accent": theme.accent || "#e0147f",
    "--glass-alpha": String((theme.glassOpacity ?? 45) / 100),
    "--glass-blur": `${theme.glassBlur ?? 20}px`,
  } as React.CSSProperties;

  return (
    <div style={themeStyle} className={theme.grain ? "grain relative" : "relative"}>
      <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
        <ThemeDispatcher data={data} />
      </Suspense>
    </div>
  );
}
