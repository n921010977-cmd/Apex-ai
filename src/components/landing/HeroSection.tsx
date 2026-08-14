"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform, type Variants } from "framer-motion";

// ellipse → SVG path (so pulses can travel along the orbit)
const ellipsePath = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${cx - rx},${cy} a ${rx},${ry} 0 1,0 ${2 * rx},0 a ${rx},${ry} 0 1,0 ${-2 * rx},0`;

// ─── Data ─────────────────────────────────────────────────────────────────────

// 3 orbital rings so all 20 agents distribute without clutter
const RINGS = [
  { r: 188, dur: 42, dir: 1  as 1 | -1 },
  { r: 142, dur: 32, dir: -1 as 1 | -1 },
  { r: 98,  dur: 24, dir: 1  as 1 | -1 },
];

const ROLES_20: [string, string][] = [
  ["CEO", "#8b5cf6"], ["CFO", "#6366f1"], ["CMO", "#3b82f6"], ["COO", "#06b6d4"],
  ["CTO", "#10b981"], ["PM", "#f59e0b"], ["Growth", "#ec4899"], ["Data", "#22d3ee"],
  ["Legal", "#8b5cf6"], ["HR", "#6366f1"], ["Sales", "#3b82f6"], ["Brand", "#06b6d4"],
  ["UX", "#10b981"], ["SEO", "#f59e0b"], ["Research", "#ec4899"], ["Finance", "#22d3ee"],
  ["Ops", "#8b5cf6"], ["CS", "#6366f1"], ["DevOps", "#3b82f6"], ["AI", "#06b6d4"],
];

// distribute 20 across rings: 8 / 7 / 5
const ORBITERS = ROLES_20.map(([short, color], i) => {
  let ring: number, idxInRing: number, countInRing: number;
  if (i < 8)       { ring = 0; idxInRing = i;      countInRing = 8; }
  else if (i < 15) { ring = 1; idxInRing = i - 8;  countInRing = 7; }
  else             { ring = 2; idxInRing = i - 15; countInRing = 5; }
  return { short, color, ring, startDeg: (idxInRing / countInRing) * 360 };
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
  // ── pointer parallax (subtle 3D depth) ──
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 120, damping: 18, mass: 0.4 };
  const rotX = useSpring(useTransform(py, [-0.5, 0.5], [7, -7]), spring);
  const rotY = useSpring(useTransform(px, [-0.5, 0.5], [-7, 7]), spring);
  // deeper layers shift more than the plane → parallax separation
  const coreX = useSpring(useTransform(px, [-0.5, 0.5], [-14, 14]), spring);
  const coreY = useSpring(useTransform(py, [-0.5, 0.5], [-14, 14]), spring);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { px.set(0); py.set(0); };

  return (
    <div
      className="relative size-full"
      style={{ perspective: 1000 }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
    <motion.div
      className="relative flex items-center justify-center size-full"
      style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
    >
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

        {/* Energy pulses flowing along each orbit (data in motion) */}
        {[
          { rx: 185, ry: 68, tilt: -18, color: "#a78bfa", dur: 7,   delay: 0   },
          { rx: 152, ry: 55, tilt: 22,  color: "#38bdf8", dur: 5.6, delay: 1.4 },
          { rx: 108, ry: 40, tilt: -5,  color: "#5eead4", dur: 4.4, delay: 0.7 },
        ].map((o, i) => (
          <g key={i} transform={`rotate(${o.tilt} 200 200)`}>
            <path id={`orbit-${i}`} d={ellipsePath(200, 200, o.rx, o.ry)} fill="none" stroke="none" />
            <circle r={i === 0 ? 3 : 2.4} fill={o.color} filter="url(#fg1)">
              <animateMotion dur={`${o.dur}s`} begin={`${o.delay}s`} repeatCount="indefinite" rotate="auto">
                <mpath href={`#orbit-${i}`} />
              </animateMotion>
              <animate attributeName="opacity" values="0.2;1;0.2" dur={`${o.dur}s`} begin={`${o.delay}s`} repeatCount="indefinite" />
            </circle>
          </g>
        ))}

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
            <circle key={i} cx={x} cy={y} r="3" fill={ORBITERS[i]?.color ?? "#8b5cf6"} opacity="0.5">
              <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
            </circle>
          );
        })}
      </svg>

      {/* Central glassmorphism core ──────────────────────────────────────── */}
      <motion.div
        className="relative z-10 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ x: coreX, y: coreY }}
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
            animation: "hero-core-breathe 5s ease-in-out infinite",
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
            VERTLIX AI
          </span>
        </div>
      </motion.div>

      {/* Orbital capsules — all 20 agents across 3 rings ──────────────────── */}
      {ORBITERS.map((o, i) => {
        const ring = RINGS[o.ring];
        const dir = ring.dir === -1 ? "reverse" : "normal";
        return (
          <motion.div
            key={o.short}
            className="absolute"
            style={{ top: "50%", left: "50%", width: 0, height: 0 }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 + i * 0.05, type: "spring", stiffness: 240, damping: 18 }}
          >
            <div
              style={{
                position: "absolute",
                top: 0, left: 0, width: 0, height: 0,
                transformOrigin: "0 0",
                animation: `hero-orbit ${ring.dur}s linear infinite`,
                animationDirection: dir,
                animationDelay: `-${(o.startDeg / 360) * ring.dur}s`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0, top: 0,
                  ["--orbit-r" as string]: `${ring.r}px`,
                  animation: `hero-unspin ${ring.dur}s linear infinite`,
                  animationDirection: dir,
                  animationDelay: `-${(o.startDeg / 360) * ring.dur}s`,
                } as React.CSSProperties}
              >
                {/* Compact capsule (dot + short role) */}
                <div
                  className="relative flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-lg whitespace-nowrap"
                  style={{
                    transform: "translate(-50%, -50%)",
                    background: `linear-gradient(135deg, ${o.color}22 0%, rgba(9,10,16,0.92) 100%)`,
                    border: `1px solid ${o.color}3d`,
                    boxShadow: `0 4px 14px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.06)`,
                  }}
                >
                  <span className="size-1.5 rounded-full flex-shrink-0" style={{ background: o.color, boxShadow: `0 0 5px ${o.color}` }} />
                  <span className="text-[10px] font-bold" style={{ color: o.color }}>{o.short}</span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
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
          from { transform: translateX(var(--orbit-r)) translateY(-50%) rotate(0deg); }
          to   { transform: translateX(var(--orbit-r)) translateY(-50%) rotate(-360deg); }
        }
        @keyframes hero-particle-pulse {
          0%, 100% { opacity: 0.12; transform: scale(1); }
          50%       { opacity: 0.45; transform: scale(1.6); }
        }
        @keyframes hero-badge-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(124,58,237,0.12); }
          50%       { box-shadow: 0 0 16px rgba(124,58,237,0.24); }
        }
        @keyframes hero-core-breathe {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.035); }
        }
        @keyframes hero-metric-float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-2px); }
        }

        /* Orb column — give it more of the row and let the orb breathe */
        .hero-orb-col { flex: 1.15; }
        .hero-orb-stage { width: 420px; height: 420px; }
        .hero-orb-scale { transform: scale(1); transform-origin: center; will-change: transform; }

        @media (min-width: 1024px) {
          .hero-orb-stage { width: 520px; height: 520px; }
          .hero-orb-scale { transform: scale(1.32); }
        }
        @media (min-width: 1280px) {
          .hero-orb-stage { width: 580px; height: 580px; }
          .hero-orb-scale { transform: scale(1.48); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-orb-scale { will-change: auto; }
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
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                boxShadow: "0 4px 18px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.16)",
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

        {/* ─── Right: 3D Orb visual ────────────────────────────────────── */}
        <motion.div
          className="hero-orb-col flex items-center justify-center"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="hero-orb-stage relative flex items-center justify-center">
            <div className="hero-orb-scale">
              <OrbCore />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-36 pointer-events-none" style={{ background: "linear-gradient(to top, #05060a, transparent)" }} />
    </section>
  );
}
