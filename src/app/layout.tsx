import { AcquisitionCapture } from "@/components/AcquisitionCapture";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SessionProvider } from "@/components/SessionProvider";
import { PostHogProvider } from "@/components/PostHogProvider";
import { CookieBanner } from "@/components/CookieBanner";
import { siteUrl, SITE_NAME } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-[#05060A] text-white min-h-screen overscroll-none">
        <SessionProvider>
          <PostHogProvider>{children}</PostHogProvider>
        </SessionProvider>
        <CookieBanner />
        <Analytics />
        <AcquisitionCapture />
      </body>
    </html>
  );
}
