"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";

// ─── Data ─────────────────────────────────────────────────────────────────────

const ORBITERS = [
  { shortRole: "CEO", fullRole: "Генеральный директор",   color: "#7c3aed", glow: "rgba(124,58,237,0.7)", startDeg: 0   },
  { shortRole: "CFO", fullRole: "Финансовый директор",    color: "#3b82f6", glow: "rgba(59,130,246,0.7)",  startDeg: 72  },
  { shortRole: "CMO", fullRole: "Директор по маркетингу", color: "#10b981", glow: "rgba(16,185,129,0.7)", startDeg: 144 },
  { shortRole: "CTO", fullRole: "Технический директор",   color: "#ec4899", glow: "rgba(236,72,153,0.7)", startDeg: 216 },
  { shortRole: "COO", fullRole: "Операционный директор",  color: "#f59e0b", glow: "rgba(245,158,11,0.7)", startDeg: 288 },
];

const ORBIT_R    = 152; // capsule orbit radius px
const ORBIT_SEC  = 26;  // revolution duration

// ─── 20 converging agents ─────────────────────────────────────────────────────
// Muted enterprise palette, cycled across 20 nodes on a ring that connect to core.
const CONV_PALETTE = ["#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#22d3ee"];
const CONV_R = 172; // ring radius for the 20 nodes
const NODE_20 = Array.from({ length: 20 }, (_, i) => {
  const ang = (i / 20) * Math.PI * 2 - Math.PI / 2;
  return {
    color: CONV_PALETTE[i % CONV_PALETTE.length],
    x: 210 + Math.cos(ang) * CONV_R,
    y: 210 + Math.sin(ang) * CONV_R,
  };
});
// 6 key roles get readable labels (rest stay as glowing nodes → no clutter)
const LABELED = [
  { role: "CEO", full: "Генеральный директор",   color: "#8b5cf6", idx: 0  },
  { role: "CFO", full: "Финансовый директор",     color: "#3b82f6", idx: 3  },
  { role: "CMO", full: "Директор по маркетингу",  color: "#10b981", idx: 7  },
  { role: "CTO", full: "Технический директор",    color: "#ec4899", idx: 10 },
  { role: "COO", full: "Операционный директор",   color: "#f59e0b", idx: 13 },
  { role: "BA",  full: "Бизнес-аналитик",         color: "#06b6d4", idx: 17 },
].map(l => {
  const ang = (l.idx / 20) * Math.PI * 2 - Math.PI / 2;
  return { ...l, x: 210 + Math.cos(ang) * CONV_R, y: 210 + Math.sin(ang) * CONV_R };
});

// Deterministic micro-particles (sin/cos of evenly spaced angles × varying radii)
const PARTICLES = Array.from({ length: 22 }, (_, i) => {
  const a = (i / 22) * Math.PI * 2;
  const r = 68 + (i % 4) * 26;
  return {
    cx: Math.cos(a) * r,
    cy: Math.sin(a) * r * 0.52,   // flatten for 3D depth illusion
    r:  i % 3 === 0 ? 1.8 : 1.1,
    o:  0.10 + (i % 5) * 0.05,
    d:  (i % 5) * 0.7,
  };
});

// ─── Motion config ────────────────────────────────────────────────────────────

const cont: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.11 } } };
const it: Variants   = { hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } } };

// ─── Orb sub-components ───────────────────────────────────────────────────────

function OrbCore() {
  return (
    <div className="relative flex items-center justify-center size-full">
      {/* Deep ambient glow under the orb */}
      <div
        className="absolute rounded-full"
        style={{
          width: 260, height: 260,
          background: "radial-gradient(circle, rgba(124,58,237,0.28) 0%, rgba(59,130,246,0.12) 50%, transparent 75%)",
          filter: "blur(32px)",
        }}
      />

      {/* Outer decorative ring — thin, slow spin */}
      <div
        className="absolute rounded-full"
        style={{
          width: 340, height: 340,
          border: "1px solid rgba(124,58,237,0.12)",
          animation: "spin-slow 40s linear infinite",
        }}
      />
      {/* Dashed techy ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: 310, height: 310,
          border: "1px dashed rgba(59,130,246,0.08)",
          animation: "spin-slow 30s linear infinite reverse",
        }}
      />

      {/* SVG rings — ellipses that look 3D ──────────────────────────────── */}
      <svg
        viewBox="0 0 400 400"
        className="absolute"
        style={{ width: 400, height: 400, overflow: "visible" }}
      >
        <defs>
          <radialGradient id="rg1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="rg2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </radialGradient>
          <filter id="fg1" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>

        {/* Outer orbit ellipse (wide, shallow — looks like orbital plane tilted ~65°) */}
        <ellipse cx="200" cy="200" rx="185" ry="68"
          fill="none" stroke="rgba(124,58,237,0.18)" strokeWidth="1"
          transform="rotate(-18 200 200)"
        />
        {/* Second ellipse — different tilt */}
        <ellipse cx="200" cy="200" rx="152" ry="55"
          fill="none" stroke="rgba(59,130,246,0.14)" strokeWidth="0.8"
          transform="rotate(22 200 200)"
        />
        {/* Inner ellipse */}
        <ellipse cx="200" cy="200" rx="108" ry="40"
          fill="none" stroke="rgba(6,182,212,0.12)" strokeWidth="0.7"
          transform="rotate(-5 200 200)"
        />
        {/* Techy arc segment on outer ring */}
        <path
          d="M 24 200 A 176 176 0 0 1 106 42"
          fill="none" stroke="rgba(124,58,237,0.45)" strokeWidth="1.5"
          strokeLinecap="round"
          filter="url(#fg1)"
        />
        <path
          d="M 362 232 A 176 176 0 0 1 340 318"
          fill="none" stroke="rgba(6,182,212,0.4)" strokeWidth="1.5"
          strokeLinecap="round"
          filter="url(#fg1)"
        />

        {/* Micro-particles scattered on the elliptical plane */}
        {PARTICLES.map((p, i) => (
          <circle
            key={i}
            cx={200 + p.cx} cy={200 + p.cy}
            r={p.r}
            fill="white"
            opacity={p.o}
          >
            <animate attributeName="opacity"
              values={`${p.o};${p.o * 3};${p.o}`}
              dur={`${2.5 + p.d}s`}
              begin={`${p.d}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}

        {/* Small glowing dots on the outer ring arc */}
        {[0, 72, 144, 216, 288].map((deg, i) => {
          const rad = (deg - 90) * Math.PI / 180;
          const x = 200 + Math.cos(rad) * 185;
          const y = 200 + Math.sin(rad) * 68;
          return (
            <circle key={i} cx={x} cy={y} r="3" fill={ORBITERS[i].color} opacity="0.5">
              <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
            </circle>
          );
        })}
      </svg>

      {/* Central glassmorphism core ──────────────────────────────────────── */}
      <motion.div
        className="relative z-10 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 1.25, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {/* Core glow pulse */}
        <div
          className="absolute rounded-3xl"
          style={{
            inset: -20,
            background: "radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)",
            filter: "blur(20px)",
            animation: "pulse-glow 3s ease-in-out infinite",
          }}
        />
        {/* Outer glass ring */}
        <div
          className="absolute rounded-3xl"
          style={{
            inset: -12,
            background: "linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(59,130,246,0.04) 100%)",
            border: "1px solid rgba(124,58,237,0.2)",
            backdropFilter: "blur(4px)",
          }}
        />
        {/* Core glass body */}
        <div
          className="relative size-28 rounded-3xl flex flex-col items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.22) 0%, rgba(59,130,246,0.14) 50%, rgba(6,182,212,0.08) 100%)",
            border: "1px solid rgba(255,255,255,0.14)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 0 40px rgba(124,58,237,0.3), 0 0 80px rgba(124,58,237,0.12), inset 0 1px 0 rgba(255,255,255,0.16)",
          }}
        >
          {/* Top shimmer */}
          <div className="absolute inset-x-0 top-0 h-px rounded-t-3xl" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)" }} />
          {/* Star icon */}
          <svg viewBox="0 0 24 24" className="size-11 mb-1.5" fill="none" stroke="url(#star-grad)" strokeWidth="1.4">
            <defs>
              <linearGradient id="star-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span
            className="text-[10px] font-bold tracking-[0.18em]"
            style={{
              background: "linear-gradient(90deg, #a78bfa, #38bdf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            APEX AI
          </span>
        </div>
      </motion.div>

      {/* ── Convergence layer: 20 agents connect into the core ─────────────── */}
      <svg viewBox="0 0 420 420" className="absolute" style={{ width: 420, height: 420, overflow: "visible" }} aria-hidden>
        {/* Connecting lines + inward energy pulses + node dots */}
        {NODE_20.map((n, i) => {
          const drawBegin = `${0.3 + i * 0.05}s`;
          const pulseBegin = `${1.3 + i * 0.05}s`;
          return (
            <g key={i}>
              {/* line draws from node toward center */}
              <line
                x1={n.x} y1={n.y} x2={210} y2={210}
                stroke={n.color} strokeWidth="1" strokeOpacity="0.22"
                strokeDasharray={CONV_R} strokeDashoffset={CONV_R}
              >
                <animate attributeName="stroke-dashoffset" from={CONV_R} to="0" dur="0.85s" begin={drawBegin} fill="freeze" />
              </line>
              {/* energy pulse travelling inward (loops) */}
              <circle cx={n.x} cy={n.y} r="2" fill={n.color} opacity="0">
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur="1.9s" begin={pulseBegin} repeatCount="indefinite" />
                <animate attributeName="cx" from={n.x} to="210" dur="1.9s" begin={pulseBegin} repeatCount="indefinite" />
                <animate attributeName="cy" from={n.y} to="210" dur="1.9s" begin={pulseBegin} repeatCount="indefinite" />
              </circle>
              {/* node halo */}
              <circle cx={n.x} cy={n.y} r="7" fill={n.color} opacity="0">
                <animate attributeName="opacity" values="0;0.16;0.07" dur="0.6s" begin={drawBegin} fill="freeze" />
              </circle>
              {/* node dot */}
              <circle cx={n.x} cy={n.y} r="0" fill={n.color}>
                <animate attributeName="r" values="0;3.6;3" dur="0.5s" begin={drawBegin} fill="freeze" />
                <animate attributeName="opacity" values="0.55;1;0.55" dur="3s" begin={drawBegin} repeatCount="indefinite" />
              </circle>
            </g>
          );
        })}
        {/* Ignition flash when the core is born */}
        <circle cx="210" cy="210" r="8" fill="none" stroke="#a78bfa" strokeWidth="2" opacity="0">
          <animate attributeName="r" values="8;130" dur="0.9s" begin="1.28s" fill="freeze" />
          <animate attributeName="opacity" values="0.55;0" dur="0.9s" begin="1.28s" fill="freeze" />
        </circle>
        <circle cx="210" cy="210" r="8" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0">
          <animate attributeName="r" values="8;95" dur="0.75s" begin="1.34s" fill="freeze" />
          <animate attributeName="opacity" values="0.45;0" dur="0.75s" begin="1.34s" fill="freeze" />
        </circle>
      </svg>

      {/* ── 6 labeled role capsules on the ring (fade in after ignition) ───── */}
      {LABELED.map((l, i) => (
        <motion.div
          key={l.role}
          className="absolute"
          style={{ left: l.x, top: l.y, transform: "translate(-50%, -50%)" }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.55 + i * 0.09, ease: [0.34, 1.4, 0.64, 1] }}
        >
          <div
            className="relative flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-lg whitespace-nowrap"
            style={{
              background: `linear-gradient(135deg, ${l.color}1f 0%, rgba(9,10,16,0.92) 100%)`,
              border: `1px solid ${l.color}40`,
              backdropFilter: "blur(12px)",
              boxShadow: "0 4px 18px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)",
              animation: `hero-cap-float 5s ease-in-out ${i * 0.4}s infinite`,
            }}
          >
            <span className="size-1.5 rounded-full flex-shrink-0" style={{ background: l.color, boxShadow: `0 0 5px ${l.color}` }} />
            <span className="text-[10px] font-bold" style={{ color: l.color }}>{l.role}</span>
            <span className="text-[8.5px] text-white/35 font-medium">{l.full}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Main Hero ────────────────────────────────────────────────────────────────

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* ── CSS keyframes (orbit trick) ── */}
      <style>{`
        @keyframes hero-orbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes hero-unspin {
          from { transform: translateX(${ORBIT_R}px) translateY(-50%) rotate(0deg); }
          to   { transform: translateX(${ORBIT_R}px) translateY(-50%) rotate(-360deg); }
        }
        @keyframes hero-particle-pulse {
          0%, 100% { opacity: 0.12; transform: scale(1); }
          50%       { opacity: 0.45; transform: scale(1.6); }
        }
        @keyframes hero-badge-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(124,58,237,0.12); }
          50%       { box-shadow: 0 0 16px rgba(124,58,237,0.24); }
        }
        @keyframes hero-cap-float {
          0%, 100% { transform: translate(-50%, -50%); }
          50%       { transform: translate(-50%, calc(-50% - 6px)); }
        }
        @media (prefers-reduced-motion: reduce) {
          svg animate { animation-duration: 0.001s !important; }
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

        {/* ─── Right: 3D Orb visual ────────────────────────────────────── */}
        <motion.div
          className="flex-1 flex items-center justify-center lg:justify-end"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="relative"
            style={{ width: 420, height: 420 }}
          >
            <OrbCore />
          </div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-36 pointer-events-none" style={{ background: "linear-gradient(to top, #05060a, transparent)" }} />
    </section>
  );
}
