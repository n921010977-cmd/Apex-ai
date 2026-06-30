"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const EXECUTIVES = [
  { role: "CEO", color: "#7c3aed", delay: 0 },
  { role: "CFO", color: "#3b82f6", delay: 0.15 },
  { role: "CMO", color: "#10b981", delay: 0.3 },
  { role: "COO", color: "#f59e0b", delay: 0.45 },
  { role: "CTO", color: "#ec4899", delay: 0.6 },
];

function ExecutiveOrbit({ role, color, delay, angle }: { role: string; color: string; delay: number; angle: number }) {
  const rad = (angle * Math.PI) / 180;
  const r = 160;
  const x = Math.cos(rad) * r;
  const y = Math.sin(rad) * r;
  return (
    <motion.div
      className="absolute size-14 rounded-2xl flex flex-col items-center justify-center border border-white/10 animate-float"
      style={{
        left: `calc(50% + ${x}px - 28px)`,
        top: `calc(50% + ${y}px - 28px)`,
        background: `${color}18`,
        backdropFilter: "blur(12px)",
        animationDelay: `${delay}s`,
        boxShadow: `0 0 20px ${color}30`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.8 + delay, type: "spring" }}
    >
      <span className="text-xs font-bold" style={{ color }}>{role}</span>
    </motion.div>
  );
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="grid-pattern opacity-40" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-violet-600/8 blur-[120px]" />
      <div className="absolute bottom-1/4 left-1/4 size-[400px] rounded-full bg-blue-600/6 blur-[100px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 flex flex-col lg:flex-row items-center gap-20">
        <motion.div
          className="flex-1 text-center lg:text-left"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 mb-8">
            <span className="size-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs text-violet-300 font-medium tracking-wide">AI Executive Board — Now Available</span>
          </motion.div>

          <motion.h1 variants={item} className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6 tracking-tight">
            <span className="text-white">Your Business.</span><br />
            <span className="gradient-text-blue">Expert Strategy.</span><br />
            <span className="text-white/60">Instant Execution.</span>
          </motion.h1>

          <motion.p variants={item} className="text-lg text-white/45 max-w-xl mb-10 leading-relaxed">
            Replace a $50,000/month consulting team with an AI Executive Board.
            Get a complete business strategy — CEO, CFO, CMO, COO, CTO and more — working together for your idea in minutes.
          </motion.p>

          <motion.div variants={item} className="flex flex-wrap gap-8 mb-10 justify-center lg:justify-start">
            {[
              { value: "10,000+", label: "Strategies Built" },
              { value: "< 5 min", label: "Complete Analysis" },
              { value: "8 Experts", label: "AI Executives" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-white/35 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          <motion.div variants={item} className="flex flex-wrap gap-4 justify-center lg:justify-start">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2.5 h-14 px-8 text-base font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-2xl hover:from-violet-500 hover:to-blue-500 transition-all duration-200 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5"
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Launch Your Strategy
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2.5 h-14 px-8 text-base font-medium glass rounded-2xl text-white/70 hover:text-white border border-white/[0.08] hover:border-white/[0.15] transition-all duration-200"
            >
              Start Free →
            </Link>
          </motion.div>

          <motion.div variants={item} className="mt-8 flex items-center gap-3 justify-center lg:justify-start">
            <div className="flex -space-x-2">
              {["#7c3aed","#3b82f6","#10b981","#f59e0b","#ec4899"].map((c, i) => (
                <div key={i} className="size-8 rounded-full border-2 border-[#080808] flex items-center justify-center text-xs font-bold text-white" style={{ background: c }}>
                  {["A","S","M","J","R"][i]}
                </div>
              ))}
            </div>
            <div className="text-sm text-white/35">
              <span className="text-white/60 font-medium">4.9/5</span> from 2,300+ founders
            </div>
          </motion.div>
        </motion.div>

        {/* Orbit visual */}
        <motion.div
          className="flex-1 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          <div className="relative size-80 sm:size-96">
            <div className="absolute inset-0 rounded-full border border-white/[0.04] animate-spin-slow" />
            <div className="absolute inset-8 rounded-full border border-violet-500/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="size-28 rounded-3xl bg-gradient-to-br from-violet-600 to-blue-600 flex flex-col items-center justify-center shadow-2xl shadow-violet-500/40 glow-purple">
                  <svg className="size-10 text-white mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span className="text-white/80 text-xs font-semibold tracking-wider">BCC</span>
                </div>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-600 to-blue-600 blur-2xl opacity-40" />
              </div>
            </div>
            {EXECUTIVES.map((exec, i) => (
              <ExecutiveOrbit key={exec.role} role={exec.role} color={exec.color} delay={exec.delay} angle={(i * 360) / EXECUTIVES.length - 90} />
            ))}
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#05060A] to-transparent" />
    </section>
  );
}
