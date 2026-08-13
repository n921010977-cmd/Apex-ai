"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { label: "Продукт", href: "#product" },
  { label: "AI команда", href: "#executives" },
  { label: "Возможности", href: "/features" },
  { label: "Тарифы", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "py-2.5" : "py-4"
      }`}
      style={
        scrolled
          ? {
              background: "rgba(5,6,10,0.82)",
              backdropFilter: "blur(20px) saturate(150%)",
              WebkitBackdropFilter: "blur(20px) saturate(150%)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }
          : { background: "transparent" }
      }
    >
      <nav aria-label="Главная навигация" className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Brand — terminal wordmark */}
        <Link href="/" className="flex items-center gap-2.5 group rounded-lg" aria-label="Vertlix Command Center — на главную">
          <div
            className="size-9 flex items-center justify-center flex-shrink-0 transition-shadow duration-300 group-hover:shadow-[0_4px_20px_rgba(99,102,241,0.35)]"
            style={{
              borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              boxShadow: "0 2px 12px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.18)",
            }}
          >
            <svg className="size-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div className="hidden sm:flex items-baseline gap-2 term-mono">
            <span className="text-sm font-bold text-white tracking-tight">VERTLIX</span>
            <span className="text-white/20">//</span>
            <span className="text-[11px] text-white/40 tracking-[0.18em] uppercase">Command&nbsp;Center</span>
          </div>
        </Link>

        {/* Desktop nav — mono uppercase */}
        <div className="hidden md:flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="term-mono px-3 py-2 rounded-md text-[11px] tracking-[0.08em] uppercase text-white/40 hover:text-white hover:bg-white/[0.05] transition-colors duration-200"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          {/* live status readout */}
          <div className="hidden lg:flex items-center gap-2 term-mono px-3 h-9 rounded-lg" style={{ border: "1px solid rgba(16,185,129,0.18)", background: "rgba(16,185,129,0.05)" }}>
            <span className="size-1.5 rounded-full bg-emerald-400 term-blink" />
            <span className="text-[10.5px] tracking-[0.12em] text-emerald-400/90">20 AGENTS ONLINE</span>
          </div>
          <Link
            href="/login"
            className="term-mono hidden md:inline-flex items-center h-9 px-4 text-[11px] tracking-[0.1em] uppercase text-white/55 rounded-lg border border-white/[0.09] hover:text-white hover:border-white/[0.18] transition-all duration-200"
          >
            Войти
          </Link>
          <Link
            href="/register"
            className="term-mono inline-flex items-center gap-2 h-9 px-5 text-[11px] tracking-[0.08em] uppercase font-semibold text-white rounded-lg transition-all duration-200 hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(99,102,241,0.35)]"
            style={{
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              boxShadow: "0 4px 16px rgba(99,102,241,0.28), inset 0 1px 0 rgba(255,255,255,0.16)",
            }}
          >
            Начать бесплатно
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            className="md:hidden inline-flex items-center justify-center size-9 rounded-xl border border-white/[0.09] text-white/70 hover:text-white hover:border-white/[0.18] transition-colors"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {open ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="7" x2="21" y2="7" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="17" x2="21" y2="17" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden"
            style={{
              background: "rgba(5,6,10,0.96)",
              backdropFilter: "blur(24px)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="px-6 py-4 flex flex-col gap-1">
              {NAV_ITEMS.map((item, i) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.25 }}
                  className="px-4 py-3 rounded-xl text-[15px] font-medium text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  {item.label}
                </motion.a>
              ))}
              <div className="h-px my-2" style={{ background: "rgba(255,255,255,0.06)" }} />
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-xl text-[15px] font-medium text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                Войти в аккаунт
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
