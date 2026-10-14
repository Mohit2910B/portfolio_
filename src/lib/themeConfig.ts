export interface CustomThemeConfig {
  // 1-21 Color Controls
  backgroundColor: string;
  secondaryBackgroundColor: string;
  textColor: string;
  secondaryTextColor: string;
  headingColor: string;
  accentColor: string;
  linkColor: string;
  borderColor: string;
  glassBackground: string;
  glassBorderColor: string;
  glassHighlightColor: string;
  buttonBackground: string;
  buttonText: string;
  buttonBorder: string;
  buttonHoverBackground: string;
  buttonHoverText: string;
  inputBackground: string;
  inputText: string;
  inputBorder: string;
  successColor: string;
  errorColor: string;

  // Typography Controls
  displayFont: string;
  headingFont: string;
  bodyFont: string;
  monoFont: string;
  headingScale: number;
  bodyScale: number;
  headingLineHeight: number;
  bodyLineHeight: number;

  // Button Controls
  buttonRadius: number;
  buttonPaddingX: number;
  buttonPaddingY: number;
  buttonBorderWidth: number;

  // Glassmorphism Controls
  glassBlur: number;
  glassOpacity: number;
  glassSaturate: number;
  glassBorderOpacity: number;

  // Border Radius Controls
  globalRadius: number;
  cardRadius: number;
  mediaRadius: number;
  inputRadius: number;
  navigationRadius: number;

  // Spacing Controls
  sectionSpacing: number;
  containerWidth: number;

  // Background Controls
  bgGradientEnabled: boolean;
  bgGradientColor1: string;
  bgGradientColor2: string;
}

export const DEFAULT_THEME_CONFIG: CustomThemeConfig = {
  backgroundColor: "#08090B",
  secondaryBackgroundColor: "#0D0F12",
  textColor: "#F5F3EE",
  secondaryTextColor: "#A5A5A5",
  headingColor: "#F5F3EE",
  accentColor: "#C8A66A",
  linkColor: "#C8A66A",
  borderColor: "rgba(255, 255, 255, 0.14)",
  glassBackground: "rgba(255, 255, 255, 0.07)",
  glassBorderColor: "rgba(255, 255, 255, 0.16)",
  glassHighlightColor: "rgba(255, 255, 255, 0.12)",
  buttonBackground: "#C8A66A",
  buttonText: "#08090B",
  buttonBorder: "#C8A66A",
  buttonHoverBackground: "#D9B77B",
  buttonHoverText: "#08090B",
  inputBackground: "rgba(0, 0, 0, 0.4)",
  inputText: "#F5F3EE",
  inputBorder: "rgba(255, 255, 255, 0.14)",
  successColor: "#10B981",
  errorColor: "#F43F5E",

  displayFont: "var(--font-serif), Cormorant Garamond, serif",
  headingFont: "var(--font-serif), Cormorant Garamond, serif",
  bodyFont: "var(--font-sans), Plus Jakarta Sans, sans-serif",
  monoFont: "var(--font-mono), Space Mono, monospace",
  headingScale: 1.0,
  bodyScale: 1.0,
  headingLineHeight: 1.0,
  bodyLineHeight: 1.6,

  buttonRadius: 999,
  buttonPaddingX: 24,
  buttonPaddingY: 12,
  buttonBorderWidth: 1,

  glassBlur: 20,
  glassOpacity: 0.07,
  glassSaturate: 130,
  glassBorderOpacity: 0.16,

  globalRadius: 24,
  cardRadius: 28,
  mediaRadius: 24,
  inputRadius: 16,
  navigationRadius: 999,

  sectionSpacing: 96,
  containerWidth: 1280,

  bgGradientEnabled: true,
  bgGradientColor1: "rgba(200, 166, 106, 0.10)",
  bgGradientColor2: "rgba(142, 162, 184, 0.10)",
};

export const THEME_PRESETS: Record<number, { name: string; config: CustomThemeConfig }> = {
  1: {
    name: "Dark Glass Editorial",
    config: { ...DEFAULT_THEME_CONFIG },
  },
  2: {
    name: "Light Glass Editorial",
    config: {
      ...DEFAULT_THEME_CONFIG,
      backgroundColor: "#F7F5F0",
      secondaryBackgroundColor: "#EFECE6",
      textColor: "#121316",
      secondaryTextColor: "#555555",
      headingColor: "#08090B",
      accentColor: "#9E7B3B",
      linkColor: "#9E7B3B",
      borderColor: "rgba(0, 0, 0, 0.12)",
      glassBackground: "rgba(255, 255, 255, 0.65)",
      glassBorderColor: "rgba(0, 0, 0, 0.12)",
      glassHighlightColor: "rgba(255, 255, 255, 0.8)",
      buttonBackground: "#121316",
      buttonText: "#F7F5F0",
      buttonBorder: "#121316",
      buttonHoverBackground: "#9E7B3B",
      buttonHoverText: "#FFFFFF",
      inputBackground: "rgba(255, 255, 255, 0.8)",
      inputText: "#121316",
      inputBorder: "rgba(0, 0, 0, 0.15)",
    },
  },
  3: {
    name: "Cinematic Glass",
    config: {
      ...DEFAULT_THEME_CONFIG,
      backgroundColor: "#050608",
      secondaryBackgroundColor: "#0A0D12",
      textColor: "#ECEFF4",
      secondaryTextColor: "#8892B0",
      headingColor: "#FFFFFF",
      accentColor: "#64FFDA",
      linkColor: "#64FFDA",
      borderColor: "rgba(100, 255, 218, 0.2)",
      glassBackground: "rgba(10, 25, 47, 0.4)",
      glassBorderColor: "rgba(100, 255, 218, 0.2)",
      buttonBackground: "#64FFDA",
      buttonText: "#0A192F",
      buttonBorder: "#64FFDA",
      buttonHoverBackground: "#92FFE6",
      buttonHoverText: "#0A192F",
    },
  },
  4: {
    name: "Mono Glass",
    config: {
      ...DEFAULT_THEME_CONFIG,
      backgroundColor: "#000000",
      secondaryBackgroundColor: "#111111",
      textColor: "#FFFFFF",
      secondaryTextColor: "#888888",
      headingColor: "#FFFFFF",
      accentColor: "#FFFFFF",
      linkColor: "#FFFFFF",
      borderColor: "rgba(255, 255, 255, 0.2)",
      glassBackground: "rgba(255, 255, 255, 0.05)",
      glassBorderColor: "rgba(255, 255, 255, 0.25)",
      buttonBackground: "#FFFFFF",
      buttonText: "#000000",
      buttonBorder: "#FFFFFF",
      buttonHoverBackground: "#CCCCCC",
      buttonHoverText: "#000000",
    },
  },
  5: {
    name: "Creative Studio Glass",
    config: {
      ...DEFAULT_THEME_CONFIG,
      backgroundColor: "#0B0914",
      secondaryBackgroundColor: "#131024",
      textColor: "#F3F0FA",
      secondaryTextColor: "#9B93B8",
      headingColor: "#FFFFFF",
      accentColor: "#B57EDC",
      linkColor: "#B57EDC",
      borderColor: "rgba(181, 126, 220, 0.2)",
      glassBackground: "rgba(30, 24, 56, 0.35)",
      glassBorderColor: "rgba(181, 126, 220, 0.25)",
      buttonBackground: "#B57EDC",
      buttonText: "#0B0914",
      buttonBorder: "#B57EDC",
      buttonHoverBackground: "#C99AEA",
      buttonHoverText: "#0B0914",
    },
  },
};

/** Convert custom theme config object to dynamic CSS variables */
export function themeConfigToCssVars(config?: Partial<CustomThemeConfig>): Record<string, string> {
  const merged = { ...DEFAULT_THEME_CONFIG, ...(config || {}) };

  return {
    "--theme-bg": merged.backgroundColor,
    "--theme-bg-secondary": merged.secondaryBackgroundColor,
    "--theme-text": merged.textColor,
    "--theme-text-secondary": merged.secondaryTextColor,
    "--theme-heading": merged.headingColor,
    "--theme-accent": merged.accentColor,
    "--theme-link": merged.linkColor,
    "--theme-border": merged.borderColor,

    "--theme-glass-bg": merged.glassBackground,
    "--theme-glass-border": merged.glassBorderColor,
    "--theme-glass-highlight": merged.glassHighlightColor,
    "--theme-glass-blur": `${merged.glassBlur}px`,
    "--theme-glass-saturate": `${merged.glassSaturate}%`,

    "--theme-button-bg": merged.buttonBackground,
    "--theme-button-text": merged.buttonText,
    "--theme-button-border": merged.buttonBorder,
    "--theme-button-hover-bg": merged.buttonHoverBackground,
    "--theme-button-hover-text": merged.buttonHoverText,
    "--theme-button-radius": `${merged.buttonRadius}px`,
    "--theme-button-padding-x": `${merged.buttonPaddingX}px`,
    "--theme-button-padding-y": `${merged.buttonPaddingY}px`,
    "--theme-button-border-width": `${merged.buttonBorderWidth}px`,

    "--theme-input-bg": merged.inputBackground,
    "--theme-input-text": merged.inputText,
    "--theme-input-border": merged.inputBorder,
    "--theme-input-radius": `${merged.inputRadius}px`,

    "--theme-radius-global": `${merged.globalRadius}px`,
    "--theme-radius-card": `${merged.cardRadius}px`,
    "--theme-radius-media": `${merged.mediaRadius}px`,
    "--theme-radius-nav": `${merged.navigationRadius}px`,

    "--theme-font-display": merged.displayFont,
    "--theme-font-heading": merged.headingFont,
    "--theme-font-body": merged.bodyFont,
    "--theme-font-mono": merged.monoFont,

    "--theme-heading-scale": `${merged.headingScale}`,
    "--theme-body-scale": `${merged.bodyScale}`,
    "--theme-[#headingLineHeight]": `${merged.headingLineHeight}`,
    "--theme-[#bodyLineHeight]": `${merged.bodyLineHeight}`,

    "--theme-section-spacing": `${merged.sectionSpacing}px`,
    "--theme-container-width": `${merged.containerWidth}px`,

    "--theme-bg-gradient-1": merged.bgGradientColor1,
    "--theme-bg-gradient-2": merged.bgGradientColor2,
  };
}
