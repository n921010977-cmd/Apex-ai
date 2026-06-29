"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? "py-3 glass border-b border-white/[0.06]"
          : "py-5 bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="size-9 rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <svg className="size-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-300" />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-tight">Business Command Center</div>
            <div className="text-[10px] text-white/35 tracking-widest uppercase">AI Executive Board</div>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Product", href: "#product" },
            { label: "Executives", href: "#executives" },
            { label: "Pricing", href: "#pricing" },
            { label: "About", href: "#about" },
          ].map((item) => (
            <a key={item.label} href={item.href} className="text-sm text-white/45 hover:text-white transition-colors duration-200">
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-white/45 hover:text-white transition-colors duration-200 hidden sm:block">
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 h-9 px-5 text-sm font-medium bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-500 hover:to-blue-500 transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/25"
          >
            Get Started Free
          </Link>
        </div>
      </nav>
    </header>
  );
}
