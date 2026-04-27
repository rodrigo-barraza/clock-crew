import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const SITE_URL = "https://clock-crew.com";
const SITE_NAME = "Clock Crew";
const SITE_DESCRIPTION =
  "The Clock Crew — the legendary Newgrounds Flash animation collective born in 2002. Home of StrawberryClock, the king of the portal, and the iconic clock characters that defined early internet culture.";

export const metadata = {
  // ── Core ──────────────────────────────────────────────────────
  title: {
    default: "Clock Crew — Newgrounds Flash Animation Collective",
    template: "%s | Clock Crew",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Clock Crew",
    "Newgrounds",
    "Flash animation",
    "StrawberryClock",
    "clock characters",
    "Newgrounds portal",
    "Flash cartoons",
    "early 2000s internet",
    "Newgrounds community",
    "Flash culture",
    "internet animation",
    "B",
    "clock day",
    "Newgrounds Clock Crew",
    "SWF animations",
    "Flash movies",
    "Macromedia Flash",
    "Adobe Flash",
    "Newgrounds BBS",
    "portal awards",
    "Turd of the Week",
    "Daily Feature",
    "Tom Fulp",
    "NG community",
    "Flash collective",
    "internet nostalgia",
    "web animation history",
    "2000s Newgrounds",
    "clock lock war",
    "B movie",
  ],

  // ── Canonical & Alternates ───────────────────────────────────
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },

  // ── Open Graph ───────────────────────────────────────────────
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Clock Crew — Newgrounds Flash Animation Collective",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Clock Crew — Newgrounds Flash Animation Community",
        type: "image/png",
      },
    ],
  },

  // ── Twitter Card ─────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "Clock Crew — Newgrounds Flash Animation Collective",
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },

  // ── Icons ────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },

  // ── Robots ───────────────────────────────────────────────────
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

  // ── Other ────────────────────────────────────────────────────
  category: "entertainment",
  creator: "Clock Crew",
  publisher: "Clock Crew",
  applicationName: SITE_NAME,
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
};

// ── JSON-LD Structured Data ──────────────────────────────────────
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Clock Crew",
  alternateName: ["CC", "The Clock Crew", "Newgrounds Clock Crew"],
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512.png`,
  description: SITE_DESCRIPTION,
  foundingDate: "2002",
  sameAs: [
    "https://www.newgrounds.com/collection/clockcrew",
    "https://en.wikipedia.org/wiki/Clock_Crew",
    "https://clockcrew.fandom.com/wiki/Clock_Crew_Wiki",
  ],
  knowsAbout: [
    "Flash Animation",
    "Newgrounds",
    "Internet Culture",
    "Web Animation",
    "Early 2000s Internet",
  ],
};

export const viewport = {
  themeColor: "#0f0f0f",
  colorScheme: "dark",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
