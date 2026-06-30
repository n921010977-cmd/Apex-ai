import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Business Command Center — Your AI Executive Board",
  description:
    "Replace your consulting team with an AI Executive Board. CEO, CFO, CMO, COO, and more — working together to build your complete business strategy.",
  keywords: ["business strategy", "AI executive", "startup", "entrepreneur", "business plan"],
  openGraph: {
    title: "Business Command Center",
    description: "Your AI Executive Board — McKinsey meets AI",
    type: "website",
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
      <body className="bg-[#080808] text-white min-h-screen">
          <SessionProvider>{children}</SessionProvider>
        </body>
    </html>
  );
}
