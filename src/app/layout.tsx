import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans, Space_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-serif",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

const SITE_URL = "https://mohitbabariya.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mohit Babariya — Video Editor, Motion Designer & 3D Artist",
    template: "%s | Mohit Babariya",
  },
  description:
    "Official portfolio of Mohit Babariya — Professional Video Editor, Motion Graphics Designer, 3D Artist & AI Creator. Crafting commercial brand edits, cinematic real estate films, high-retention short-form reels, and visual effects worldwide.",
  keywords: [
    "Mohit Babariya",
    "Mohit Babariya Video Editor",
    "Video Editor Portfolio",
    "Motion Graphics Designer",
    "3D Artist",
    "AI Video Creator",
    "Real Estate Video Editor",
    "Instagram Reels Editor",
    "YouTube Video Editor",
    "Premiere Pro Editor",
    "After Effects Artist",
    "DaVinci Resolve Colorist",
    "Freelance Video Editor India",
    "Commercial Video Editing",
  ],
  authors: [{ name: "Mohit Babariya", url: SITE_URL }],
  creator: "Mohit Babariya",
  publisher: "Mohit Babariya",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Mohit Babariya — Creative Video & Motion Portfolio",
    title: "Mohit Babariya — Video Editor, Motion Designer & 3D Artist",
    description:
      "Crafting high-impact video edits, motion graphics, 3D animation, and AI video workflows that captivate audiences.",
    images: [
      {
        url: "/icon.svg",
        width: 1200,
        height: 630,
        alt: "Mohit Babariya Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mohit Babariya — Video Editor · Motion Designer · 3D Artist",
    description: "Crafting high-impact video edits, motion graphics, and AI video workflows.",
    images: ["/icon.svg"],
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  category: "creative",
};

export const viewport: Viewport = {
  themeColor: "#08090B",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "Mohit Babariya",
      jobTitle: "Video Editor, Motion Designer & 3D Artist",
      url: SITE_URL,
      image: `${SITE_URL}/icon.svg`,
      sameAs: [
        "https://instagram.com/mohitbabariya",
        "https://youtube.com/@mohitbabariya",
        "https://linkedin.com/in/mohitbabariya",
      ],
      knowsAbout: [
        "Video Editing",
        "Motion Graphics",
        "3D Animation",
        "AI Video Generation",
        "Color Grading",
        "Sound Design",
        "Adobe Premiere Pro",
        "Adobe After Effects",
        "DaVinci Resolve",
        "Blender",
      ],
    },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${cormorant.variable} ${plusJakarta.variable} ${spaceMono.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@500;700;800&display=swap"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="antialiased font-sans bg-[#08090B] text-[#F5F3EE] selection:bg-[#C9A66B]/30 selection:text-[#F5F3EE]"
      >
        {children}
      </body>
    </html>
  );
}
