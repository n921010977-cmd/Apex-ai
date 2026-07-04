import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";

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
  maximumScale: 1,
  userScalable: false,
  themeColor: "#05060A",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Apex AI — Your AI Executive Board",
    template: "%s | Apex AI",
  },
  description:
    "Замените консалтинговую команду AI-советом директоров. CEO, CFO, CMO, COO и ещё 16 агентов — работают вместе над вашей бизнес-стратегией.",
  keywords: ["business strategy", "AI executive", "startup", "entrepreneur", "бизнес план", "AI советник"],
  authors: [{ name: "Apex AI" }],
  creator: "Apex AI",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Apex AI",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Apex AI — Your AI Executive Board",
    description: "Замените консалтинг AI-советом директоров. McKinsey meets AI.",
    type: "website",
    locale: "ru_RU",
  },
  twitter: {
    card: "summary_large_image",
    title: "Apex AI — AI Executive Board",
    description: "Замените консалтинг AI-советом директоров.",
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
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-[#05060A] text-white min-h-screen overscroll-none">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
