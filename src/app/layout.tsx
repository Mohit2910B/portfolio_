import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const SITE_URL = "https://mohitbabariya.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mohit Babariya — Video Editor, Motion Graphics & AI Video Specialist",
    template: "%s | Mohit Babariya",
  },
  description:
    "Official portfolio of Mohit Babariya — Professional Video Editor, Motion Graphics Designer & AI Video Creator. Crafting high-converting short-form reels, cinematic real estate films, YouTube edits, and commercial motion graphics worldwide.",
  keywords: [
    "Mohit Babariya",
    "Mohit Babariya Video Editor",
    "Video Editor Portfolio",
    "Motion Graphics Designer",
    "AI Video Creator",
    "Real Estate Video Editor",
    "Instagram Reels Editor",
    "YouTube Video Editor",
    "Premiere Pro Editor",
    "After Effects Artist",
    "DaVinci Resolve Colorist",
    "Freelance Video Editor India",
    "Commercial Video Editing",
    "Creative Director",
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
    title: "Mohit Babariya — Video Editor, Motion Graphics & AI Video Specialist",
    description:
      "I edit films, reels and motion pieces that hold attention — clean cuts, considered pacing and visual storytelling.",
    images: [
      {
        url: "/icon.svg",
        width: 1200,
        height: 630,
        alt: "Mohit Babariya — Creative Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mohit Babariya — Video Editor · Motion Graphics · AI Video",
    description:
      "Crafting high-impact video edits, motion graphics, and AI video workflows that captivate audiences.",
    images: ["/icon.svg"],
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
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
      jobTitle: "Video Editor & Motion Graphics Designer",
      url: SITE_URL,
      image: `${SITE_URL}/icon.svg`,
      sameAs: [
        "https://www.instagram.com",
        "https://www.youtube.com",
        "https://www.linkedin.com",
      ],
      knowsAbout: [
        "Video Editing",
        "Motion Graphics",
        "AI Video Generation",
        "Color Grading",
        "Sound Design",
        "Adobe Premiere Pro",
        "Adobe After Effects",
        "DaVinci Resolve",
      ],
      description:
        "Professional Video Editor and Motion Graphics Specialist creating high-converting video content worldwide.",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Mohit Babariya Portfolio",
      publisher: { "@id": `${SITE_URL}/#person` },
      description:
        "Official Portfolio of Mohit Babariya — Video Editor, Motion Graphics Artist & AI Video Creator.",
      inLanguage: "en-US",
    },
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#service`,
      name: "Mohit Babariya Video Editing & Motion Studio",
      url: SITE_URL,
      founder: { "@id": `${SITE_URL}/#person` },
      areaServed: "Worldwide",
      priceRange: "$$",
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ],
          opens: "09:00",
          closes: "21:00",
        },
      ],
    },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://videos.pexels.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
