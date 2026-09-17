"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Lightbulb, Sparkles, TrendingUp } from "lucide-react";
import { AGENT_CHIPS, C, SAMPLE_IDEA, SAMPLE_SCORES } from "./data";

const BAR_DELAY = 0.75;
const STATUS_SWITCH_MS = 2600;

const TONE: Record<string, string> = {
  good:    `linear-gradient(90deg, ${C.purple}, ${C.cyan})`,
  neutral: `linear-gradient(90deg, ${C.purple}, ${C.indigo})`,
  low:     `linear-gradient(90deg, ${C.indigo}, ${C.blue})`,
};

/** Counts 0 → target on an ease-out-cubic curve, so the digits track the bar. */
function useCountUp(target: number, delayMs: number, durationMs = 1200) {
  const [n, setN] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / durationMs);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    const timer = setTimeout(() => { raf.current = requestAnimationFrame(tick); }, delayMs);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf.current); };
  }, [target, delayMs, durationMs]);

  return n;
}

function ScoreRow({ label, value, tone, index }: { label: string; value: number; tone: string; index: number }) {
  const shown = useCountUp(value, (BAR_DELAY + index * 0.12) * 1000);

  return (
    <div className="flex items-center gap-3.5">
      <span className="text-[12px] text-white/45 w-[86px] flex-shrink-0">{label}</span>
      <span className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.055)" }}>
        <motion.span
          className="block h-full rounded-full"
          style={{ background: TONE[tone] }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ delay: BAR_DELAY + index * 0.12, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </span>
      <span
        className="text-[12.5px] font-semibold text-white/85 w-9 text-right flex-shrink-0"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {shown}%
      </span>
    </div>
  );
}

/** The product itself: one idea in, a structured read-out back. */
export function AnalysisDashboard({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), STATUS_SWITCH_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      className={`rounded-[20px] overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(180deg, rgba(17,19,32,0.92) 0%, rgba(8,9,16,0.95) 100%)`,
        border: `1px solid ${C.line}`,
        boxShadow: `0 1px 2px rgba(0,0,0,0.6), 0 40px 90px rgba(0,0,0,0.6), 0 0 70px rgba(124,58,237,0.07), inset 0 1px 0 rgba(255,255,255,0.055)`,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        ...style,
      }}
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── Panel header ── */}
      <div
        className="flex items-center justify-between gap-3 px-5 py-3.5"
        style={{ borderBottom: `1px solid ${C.lineSoft}`, background: "rgba(255,255,255,0.016)" }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="flex items-center justify-center size-7 rounded-lg flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${C.purple}, ${C.indigo})`,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22)",
            }}
          >
            <Sparkles size={14} strokeWidth={2.2} className="text-white" aria-hidden />
          </span>
          <span className="term-mono text-[12px] font-bold text-white tracking-[0.06em]">VERTLIX</span>
        </div>

        <span
          className="term-mono flex items-center gap-1.5 text-[9px] uppercase tracking-[0.1em] px-2.5 py-1 rounded-full flex-shrink-0 transition-colors duration-500"
          style={{
            color: done ? C.mint : C.purpleLight,
            background: done ? "rgba(52,211,153,0.09)" : "rgba(124,58,237,0.1)",
            border: `1px solid ${done ? "rgba(52,211,153,0.24)" : "rgba(124,58,237,0.26)"}`,
          }}
          aria-live="polite"
        >
          <span
            className={`size-1.5 rounded-full ${done ? "" : "term-blink"}`}
            style={{ background: done ? C.mint : C.purpleLight }}
          />
          {done ? "Analysis complete" : "Analyzing…"}
        </span>
      </div>

      <div className="px-5 py-4">
        <div className="term-mono text-[9px] uppercase tracking-[0.14em] text-white/30 mb-2.5">
          Idea analysis
        </div>

        {/* ── The idea being analyzed ── */}
        <div
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl mb-4"
          style={{ background: "rgba(255,255,255,0.028)", border: `1px solid ${C.lineSoft}` }}
        >
          <Lightbulb size={15} strokeWidth={2} style={{ color: C.purpleLight }} className="flex-shrink-0" aria-hidden />
          <span className="text-[13px] text-white/80 truncate">{SAMPLE_IDEA}</span>
          <span className="term-mono ml-auto text-[8.5px] uppercase tracking-[0.12em] text-white/25 flex-shrink-0">
            sample
          </span>
        </div>

        {/* ── Scores ── */}
        <div className="flex flex-col gap-2.5 mb-5">
          {SAMPLE_SCORES.map((s, i) => (
            <ScoreRow key={s.label} label={s.label} value={s.value} tone={s.tone} index={i} />
          ))}
        </div>

        {/* ── The board behind the numbers ── */}
        <div className="term-mono text-[9px] uppercase tracking-[0.14em] text-white/30 mb-2.5">
          20 AI agents complete
        </div>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {AGENT_CHIPS.map(({ label, Icon }, i) => (
            <motion.span
              key={label}
              className="inline-flex items-center gap-1.5 text-[10.5px] font-medium text-white/65 px-2 py-1 rounded-lg"
              style={{ background: "rgba(255,255,255,0.032)", border: `1px solid ${C.lineSoft}` }}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.15 + i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Icon size={11} strokeWidth={2} style={{ color: C.purpleLight }} aria-hidden />
              {label}
            </motion.span>
          ))}
          <motion.span
            className="inline-flex items-center text-[10.5px] px-2 py-1 rounded-lg text-white/35"
            style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.lineSoft}` }}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15 + AGENT_CHIPS.length * 0.05, duration: 0.4 }}
          >
            +12 more
          </motion.span>
        </div>

        {/* ── The verdict ── */}
        <motion.div
          className="px-4 py-3.5 rounded-xl"
          style={{
            background: "linear-gradient(135deg, rgba(52,211,153,0.07) 0%, rgba(34,211,238,0.045) 100%)",
            border: "1px solid rgba(52,211,153,0.2)",
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.7, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex items-center justify-center size-8 rounded-lg flex-shrink-0"
              style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.26)" }}
              aria-hidden
            >
              <TrendingUp size={15} strokeWidth={2.3} style={{ color: C.mint }} />
            </span>

            <div className="min-w-0 flex-1">
              <div className="term-mono text-[8.5px] uppercase tracking-[0.14em] text-white/35 whitespace-nowrap">
                Strategic outlook
              </div>
              <div className="text-[13.5px] font-semibold leading-tight mt-0.5" style={{ color: C.mint }}>
                Strong potential
              </div>
            </div>

            <Link
              href="/register"
              className="group inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/75 hover:text-white transition-colors flex-shrink-0 rounded-lg px-1.5 py-1"
            >
              View Full Strategy
              <ArrowRight size={13} strokeWidth={2.4} className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>

          <p className="text-[11px] text-white/42 leading-snug mt-2.5">
            High market demand, scalable model and manageable execution risk.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
