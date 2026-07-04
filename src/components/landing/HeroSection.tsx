"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { HeroCinematic } from "./HeroCinematic";

// ─── Motion config ────────────────────────────────────────────────────────────

const cont: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.11 } } };
const it: Variants   = { hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } } };

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
                AI Executive Board · Доступно сейчас
              </span>
            </div>
          </motion.div>

          {/* H1 — three-line premium headline */}
          <motion.h1
            variants={it}
            className="text-5xl sm:text-6xl xl:text-[68px] font-bold leading-[1.06] mb-6 tracking-tight"
          >
            <span className="text-white">Твой бизнес.</span>
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #a78bfa 0%, #818cf8 40%, #38bdf8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Экспертная стратегия.
            </span>
            <br />
            <span className="text-white/50">Мгновенная реализация.</span>
          </motion.h1>

          {/* Description */}
          <motion.p variants={it} className="text-[16px] text-white/40 leading-[1.75] mb-10 max-w-lg">
            Замените консалтинговую команду за&nbsp;$50&thinsp;000 в&nbsp;месяц
            на&nbsp;AI-совет директоров. Полная бизнес-стратегия — CEO, CFO, CMO, COO,
            CTO и&nbsp;ещё трое экспертов — работают вместе над вашей идеей за&nbsp;минуты.
          </motion.p>

          {/* Metric chips */}
          <motion.div variants={it} className="flex flex-wrap gap-3 mb-10 justify-center lg:justify-start">
            {[
              { val: "10 000+", label: "Стратегий запущено", spark: [3, 5, 4, 7, 6, 9, 11], color: "#a78bfa" },
              { val: "< 5 минут", label: "Полный анализ", spark: [10, 8, 9, 6, 5, 4, 3], color: "#38bdf8" },
              { val: "8 Экспертов", label: "AI-директоров", spark: [4, 6, 5, 8, 7, 9, 10], color: "#34d399" },
            ].map((m) => (
              <div
                key={m.val}
                className="relative px-4 py-2.5 rounded-2xl overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
              >
                {/* micro-sparkline in the corner */}
                <svg
                  aria-hidden
                  viewBox="0 0 60 24"
                  className="absolute bottom-1.5 right-2 pointer-events-none"
                  style={{ width: 44, height: 18, opacity: 0.5 }}
                >
                  <polyline
                    points={m.spark.map((v, i) => `${(i / (m.spark.length - 1)) * 58 + 1},${22 - (v / 12) * 20}`).join(" ")}
                    fill="none"
                    stroke={m.color}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx={59}
                    cy={22 - (m.spark[m.spark.length - 1] / 12) * 20}
                    r="1.8"
                    fill={m.color}
                  />
                </svg>
                {/* shimmer */}
                <div
                  className="text-[22px] font-bold font-mono leading-tight"
                  style={{
                    background: "linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.7) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {m.val}
                </div>
                <div className="text-[10px] text-white/30 mt-0.5 font-medium tracking-wide">{m.label}</div>
              </div>
            ))}
          </motion.div>

          {/* CTA row */}
          <motion.div variants={it} className="flex flex-wrap gap-3 justify-center lg:justify-start">
            {/* Primary */}
            <Link
              href="/dashboard"
              className="relative inline-flex items-center gap-2.5 h-13 px-8 text-[15px] font-semibold text-white rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.04] hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #3b82f6 100%)",
                boxShadow: "0 8px 30px rgba(124,58,237,0.45), 0 2px 8px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.18)",
                height: 52,
              }}
            >
              <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }} />
              <svg viewBox="0 0 24 24" className="size-4.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Запускайте свою стратегию
            </Link>

            {/* Secondary glass */}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-7 text-[14px] font-medium text-white/60 rounded-2xl transition-all duration-200 hover:text-white hover:border-white/15"
              style={{
                height: 52,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.09)",
                backdropFilter: "blur(12px)",
              }}
            >
              Начать бесплатно →
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div variants={it} className="mt-8 flex items-center gap-3 justify-center lg:justify-start">
            <div className="flex -space-x-2">
              {(["#7c3aed","#3b82f6","#10b981","#f59e0b","#ec4899"] as const).map((c, i) => (
                <div
                  key={i}
                  className="size-8 rounded-full border-2 border-[#06060c] flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: c }}
                >
                  {["А","С","М","Д","Р"][i]}
                </div>
              ))}
            </div>
            <div className="text-[12px] text-white/30">
              <span className="text-white/55 font-semibold">4.9/5</span>
              {" "}от 2 300+ основателей
            </div>
          </motion.div>
        </motion.div>

        {/* ─── Right: cinematic convergence → APEXAI ───────────────────── */}
        <motion.div
          className="flex-1 flex items-center justify-center lg:justify-end w-full"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <HeroCinematic />
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-36 pointer-events-none" style={{ background: "linear-gradient(to top, #05060a, transparent)" }} />
    </section>
  );
}
