import { AcquisitionCapture } from "@/components/AcquisitionCapture";
import type { Metadata, Viewport } from "next";
import { Manrope, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SessionProvider } from "@/components/SessionProvider";
import { PostHogProvider } from "@/components/PostHogProvider";
import { MotionProvider } from "@/components/MotionProvider";
import { CookieBanner } from "@/components/CookieBanner";
import { siteUrl, SITE_NAME } from "@/lib/site";

// Variable names kept as --font-geist-sans / --font-geist-mono (legacy) even
// though the fonts are now Inter/JetBrains Mono — hundreds of inline
// `fontFamily: "var(--font-geist-mono), ..."` references across the app pick
// up the new typefaces automatically without touching every call site.
// Cyrillic is requested alongside Latin on all three. It costs nothing up
// front: next/font emits one @font-face per subset with its unicode-range, so
// a browser only downloads the Cyrillic file if a Cyrillic glyph is actually
// painted. All three families cover base Cyrillic (U+0400-045F) — verified
// against the Google Fonts API, and the reason several otherwise-good
// candidates (Plus Jakarta Sans, DM Sans, Space Grotesk, Sora) were rejected.
const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
});

const geistMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
});

// Headings only (see globals.css h1–h6 rule). New variable, not a legacy alias.
// No `weight` array on purpose: naming weights pins next/font to static
// instances, which is why markup asking for 650/750/900 was silently rounded
// or synthesised. Omitting it ships the variable face, so the whole 200-800
// axis is real — and it is one file instead of three.
const manrope = Manrope({
  variable: "--font-heading",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Масштабирование НЕ блокируем: запрет зума ломает доступность для людей со
  // слабым зрением (WCAG 1.4.4).
  maximumScale: 5,
  userScalable: true,
  themeColor: "#05060A",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  // Базовый адрес — из него Next строит абсолютные canonical и og:url.
  metadataBase: new URL(siteUrl()),
  alternates: { canonical: "/" },
  applicationName: SITE_NAME,
  title: {
    default: "Vertlix AI — Your AI Executive Board",
    template: "%s | Vertlix AI",
  },
  description:
    "Replace a consulting team with an AI executive board. CEO, CFO, CMO, COO and 16 more agents working together on your business strategy.",
  keywords: ["business strategy", "AI executive", "startup", "entrepreneur", "business plan", "AI advisor"],
  authors: [{ name: "Vertlix AI" }],
  creator: "Vertlix AI",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vertlix AI",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Vertlix AI — Your AI Executive Board",
    description: "Replace consulting with an AI executive board. McKinsey meets AI.",
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "Vertlix AI — AI Executive Board",
    description: "Replace consulting with an AI executive board.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} antialiased`}
    >
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-[#05060A] text-white min-h-screen overscroll-none">
        <SessionProvider>
          <PostHogProvider>
            <MotionProvider>{children}</MotionProvider>
          </PostHogProvider>
        </SessionProvider>
        <CookieBanner />
        <Analytics />
        <AcquisitionCapture />
      </body>
    </html>
  );
}
