"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";

// ─── Data ─────────────────────────────────────────────────────────────────────

// The 20 AI directors — same roster used across the landing page and app.
// Only the first 9 render as chips in the mockup card ("+11 more" covers the rest).
const ROLES_20: [string, string][] = [
  ["CEO", "#D946EF"], ["CFO", "#7C3AED"], ["CMO", "#3b82f6"], ["CTO", "#10b981"],
  ["Growth", "#ec4899"], ["Legal", "#f59e0b"], ["Data", "#22d3ee"], ["Research", "#06b6d4"],
  ["Brand", "#a78bfa"],
];

// Illustrative sample analysis — same example ideas used in the live-demo
// widget below the fold. Framed explicitly as "a sample idea" (see label in
// the card), not a real customer's data or an aggregate product claim.
const SAMPLE_IDEA = "Subscription coffee shop for developers";
const SAMPLE_SCORES: [string, number][] = [
  ["Market", 82], ["Demand", 91], ["Competition", 64], ["Risk", 38],
];
const ACTION_PLAN = ["Market validation", "Financial model", "Growth strategy", "Risk management"];

// ─── Motion config ────────────────────────────────────────────────────────────

const cont: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.11 } } };
const it: Variants   = { hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } } };

// ─── Dashboard mockup (right side of hero) ────────────────────────────────────
// Recreates the "product in action" preview: a central analysis card plus two
// floating detail cards. All figures are one illustrative example idea run
// through the board (same idea used in the live demo below the fold) — never
// presented as an aggregate claim about the product or its customers.

function HeroDashboardMock() {
  return (
    <div className="relative" style={{ width: 420, maxWidth: "100%" }}>
      {/* Ambient glow behind the whole mockup */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: "10% -10%",
          background: "radial-gradient(ellipse, rgba(124,58,237,0.22) 0%, rgba(59,130,246,0.1) 45%, transparent 75%)",
          filter: "blur(36px)",
        }}
      />

      {/* Floating card — 90-day action plan (top-right) */}
      <motion.div
        className="hidden sm:block absolute z-20"
        style={{ top: -64, right: -64, width: 168, animation: "hero-metric-float 6s ease-in-out infinite" }}
        initial={{ opacity: 0, y: 14, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="rounded-2xl p-3.5"
          style={{
            background: "rgba(9,10,16,0.92)",
            border: "1px solid rgba(124,58,237,0.22)",
            boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
            backdropFilter: "blur(16px)",
          }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[9.5px] font-bold tracking-[0.1em] uppercase" style={{ color: "#a78bfa" }}>
              90-Day Action Plan
            </span>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#a78bfa" strokeWidth="2.2" strokeLinecap="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </div>
          <div className="flex flex-col gap-1.5">
            {ACTION_PLAN.map((step) => (
              <div key={step} className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-[10.5px] text-white/70 leading-none">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Floating card — competitor snapshot (bottom-left) */}
      <motion.div
        className="hidden sm:block absolute z-20"
        style={{ bottom: -80, left: -68, width: 176, animation: "hero-metric-float 7s ease-in-out infinite 0.6s" }}
        initial={{ opacity: 0, y: 14, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.9, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="rounded-2xl p-3.5"
          style={{
            background: "rgba(9,10,16,0.92)",
            border: "1px solid rgba(6,182,212,0.2)",
            boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
            backdropFilter: "blur(16px)",
          }}
        >
          <span className="text-[9.5px] font-bold tracking-[0.1em] uppercase block mb-2.5" style={{ color: "#22d3ee" }}>
            Competitor Snapshot
          </span>
          <div className="flex flex-col gap-1.5">
            {[["Your idea", 82, "#22d3ee"], ["Competitor A", 61, "rgba(255,255,255,0.25)"], ["Competitor B", 48, "rgba(255,255,255,0.25)"]].map(([label, val, color]) => (
              <div key={label as string} className="flex items-center gap-2">
                <span className="text-[9.5px] text-white/45 w-[62px] flex-shrink-0 truncate">{label}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full" style={{ width: `${val}%`, background: color as string }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Main card — idea analysis */}
      <motion.div
        className="relative z-10 rounded-[22px] overflow-hidden"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: "rgba(9,10,16,0.9)",
          border: "1px solid rgba(124,58,237,0.25)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.5), 0 0 60px rgba(124,58,237,0.08)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="url(#hero-star-grad)" strokeWidth="1.6">
              <defs>
                <linearGradient id="hero-star-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="term-mono text-[11px] font-bold text-white tracking-[0.06em]">VERTLIX</span>
          </div>
          <span className="flex items-center gap-1.5 text-[9.5px] tracking-[0.08em] uppercase px-2 py-1 rounded-full" style={{ color: "#34d399", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <span className="size-1.5 rounded-full bg-emerald-400 term-blink" /> Analysis complete
          </span>
        </div>

        <div className="p-4">
          {/* Idea analysis */}
          <div className="text-[9px] font-bold tracking-[0.12em] uppercase text-white/35 mb-2">Idea analysis · sample run</div>
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <span aria-hidden>💡</span>
            <span className="text-[12px] text-white/75 truncate">{SAMPLE_IDEA}</span>
          </div>
          <div className="flex flex-col gap-2 mb-4">
            {SAMPLE_SCORES.map(([label, val]) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-[11px] text-white/45 w-[92px] flex-shrink-0">{label}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full" style={{ width: `${val}%`, background: "linear-gradient(90deg, #7C3AED, #22d3ee)" }} />
                </div>
                <span className="text-[11px] font-semibold text-white/80 w-8 text-right flex-shrink-0">{val}%</span>
              </div>
            ))}
          </div>

          {/* Agent roster */}
          <div className="text-[9px] font-bold tracking-[0.12em] uppercase text-white/35 mb-2">20 AI directors on this review</div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {ROLES_20.map(([short, color]) => (
              <span
                key={short}
                className="text-[10px] font-semibold px-2 py-1 rounded-lg"
                style={{ color, background: `${color}18`, border: `1px solid ${color}33` }}
              >
                {short}
              </span>
            ))}
            <span className="text-[10px] px-2 py-1 rounded-lg text-white/35" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              +11 more
            </span>
          </div>

          {/* Strategic outlook */}
          <div className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.18)" }}>
            <div className="flex items-center gap-2.5 min-w-0">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#34d399" strokeWidth="2.2" strokeLinecap="round" className="flex-shrink-0">
                <path d="M5 12l5 5L20 6" />
              </svg>
              <span className="text-[12px] font-semibold text-emerald-300 truncate">Strong potential</span>
            </div>
            <Link href="/register" className="text-[10.5px] font-semibold text-white/70 hover:text-white flex items-center gap-1 flex-shrink-0">
              Full strategy <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Hero ────────────────────────────────────────────────────────────────

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* ── CSS keyframes ── */}
      <style>{`
        @keyframes hero-badge-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(124,58,237,0.12); }
          50%       { box-shadow: 0 0 16px rgba(124,58,237,0.24); }
        }
        @keyframes hero-metric-float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-6px); }
        }

        /* Mockup column — give it more of the row so the card breathes */
        .hero-mock-col { flex: 1.15; }

        @media (prefers-reduced-motion: reduce) {
          [style*="hero-metric-float"] { animation: none !important; }
        }
      `}</style>

      {/* ── Background layers ── */}
      <div className="grid-pattern opacity-30" />
      {/* Digital noise texture for tactile matte feel */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.35,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`,
          mixBlendMode: "overlay",
        }}
      />
      {/* Primary violet bloom */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          top: "-10%", left: "50%", transform: "translateX(-50%)",
          width: 900, height: 600,
          background: "radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 65%)",
          filter: "blur(40px)",
        }}
      />
      {/* Cyan bloom bottom-left */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          bottom: "-5%", left: "-10%",
          width: 600, height: 400,
          background: "radial-gradient(ellipse, rgba(6,182,212,0.09) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
      />
      {/* Blue accent right */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          top: "30%", right: "-5%",
          width: 500, height: 500,
          background: "radial-gradient(ellipse, rgba(59,130,246,0.07) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 flex flex-col lg:flex-row items-center gap-16 xl:gap-24">

        {/* ─── Left: Text ─────────────────────────────────────────────── */}
        <motion.div
          className="flex-1 text-center lg:text-left max-w-xl xl:max-w-2xl"
          variants={cont}
          initial="hidden"
          animate="show"
        >
          {/* Top badge */}
          <motion.div variants={it} className="inline-flex items-center gap-2 mb-8">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
              style={{
                background: "rgba(124,58,237,0.06)",
                border: "1px solid rgba(124,58,237,0.22)",
                animation: "hero-badge-glow 3s ease-in-out infinite",
              }}
            >
              <span className="size-1.5 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-violet-300/90 tracking-wide">
                20 AI directors will review your idea
              </span>
            </div>
          </motion.div>

          {/* H1 — concrete benefit headline */}
          <motion.h1
            variants={it}
            className="text-5xl sm:text-6xl xl:text-[64px] font-bold leading-[1.08] mb-6 tracking-tight"
          >
            <span className="text-white">Find out if your idea will fly —</span>
            <br />
            <span style={{ color: "#818cf8" }}>in 5 minutes,</span>{" "}
            <span className="text-white/45">not a year and your savings.</span>
          </motion.h1>

          {/* Description */}
          <motion.p variants={it} className="text-[16px] text-white/40 leading-[1.75] mb-10 max-w-lg">
            20 AI directors — CEO, CFO, CMO, lawyer, analyst and&nbsp;more — will examine
            your idea from every angle, run the numbers, surface the risks and&nbsp;hand you
            an action plan for the first 90&nbsp;days. Honest, with numbers, no&nbsp;fluff.
          </motion.p>

          {/* Metric readout — terminal style */}
          <motion.div variants={it} className="mb-10 max-w-md mx-auto lg:mx-0 rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
            <div className="term-mono flex items-center justify-between px-3.5 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-[10px] tracking-[0.16em] uppercase text-white/35">// LIVE&nbsp;METRICS</span>
              <span className="flex items-center gap-1.5 text-[10px] tracking-[0.12em] text-emerald-400/90">
                <span className="size-1.5 rounded-full bg-emerald-400 term-blink" /> ONLINE
              </span>
            </div>
            <div className="grid grid-cols-3">
              {[
                { val: "10 000+", label: "STRATEGIES" },
                { val: "< 5 MIN",  label: "FULL ANALYSIS" },
                { val: "20",       label: "AI DIRECTORS" },
              ].map((m, i) => (
                <div key={m.label} className="px-3.5 py-3" style={{ borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                  <div className="term-value text-[19px] font-bold text-white leading-none flex items-center gap-1">
                    <span className="text-indigo-400/80">▸</span>{m.val}
                  </div>
                  <div className="term-label mt-1.5" style={{ fontSize: 8.5, letterSpacing: "0.14em" }}>{m.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA row */}
          <motion.div variants={it} className="flex flex-wrap gap-3 justify-center lg:justify-start">
            {/* Primary */}
            <Link
              href="/register"
              className="relative inline-flex items-center gap-2.5 h-13 px-8 text-[15px] font-semibold text-white rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.04] hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                boxShadow: "0 4px 18px rgba(124,58,237,0.3), inset 0 1px 0 rgba(255,255,255,0.16)",
                height: 52,
              }}
            >
              <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }} />
              <svg viewBox="0 0 24 24" className="size-4.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Check my idea — free
            </Link>

            {/* Secondary glass */}
            <a
              href="#how-agents"
              className="inline-flex items-center gap-2 px-7 text-[14px] font-medium text-white/60 rounded-2xl transition-all duration-200 hover:text-white hover:border-white/15"
              style={{
                height: 52,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.09)",
                backdropFilter: "blur(12px)",
              }}
            >
              How it works ↓
            </a>
          </motion.div>

          {/* Условия входа — только проверяемые факты о бесплатном тарифе.
              Раньше здесь стояли «2 300+ основателей» и «4.9/5», которых у
              продукта нет: выдуманное социальное доказательство убрано. */}
          <motion.div variants={it} className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 justify-center lg:justify-start">
            {[
              "Free: 20 AI messages",
              "No card required",
              "First review in a couple of minutes",
            ].map((t) => (
              <span key={t} className="flex items-center gap-2 text-[12.5px] text-white/40">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {t}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* ─── Right: product preview mockup ──────────────────────────── */}
        <motion.div
          className="hero-mock-col flex items-center justify-center"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <HeroDashboardMock />
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-36 pointer-events-none" style={{ background: "linear-gradient(to top, #05060a, transparent)" }} />
    </section>
  );
}
