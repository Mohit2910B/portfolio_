"use client";

import { useSearchParams } from "next/navigation";
import type { SiteData } from "@/lib/data";
import Theme01Editorial from "./Theme01Editorial";
import Theme02Swiss from "./Theme02Swiss";
import Theme03Cinematic from "./Theme03Cinematic";
import Theme04Studio from "./Theme04Studio";
import Theme05Futuristic from "./Theme05Futuristic";
import Theme06Gallery from "./Theme06Gallery";
import type { ThemeId } from "./theme-constants";

export default function ThemeDispatcher({ data }: { data: SiteData }) {
  const searchParams = useSearchParams();
  const queryTheme = searchParams.get("theme") as ThemeId | null;

  // Active theme is determined by query param (for live previewing) or database setting
  const activeThemeId = (queryTheme || data.theme?.activeTheme || "theme01") as ThemeId;

  switch (activeThemeId) {
    case "theme02":
      return <Theme02Swiss data={data} />;
    case "theme03":
      return <Theme03Cinematic data={data} />;
    case "theme04":
      return <Theme04Studio data={data} />;
    case "theme05":
      return <Theme05Futuristic data={data} />;
    case "theme06":
      return <Theme06Gallery data={data} />;
    case "theme01":
    default:
      return <Theme01Editorial data={data} />;
  }
}
