"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { FloatingCard } from "./FloatingCard";
import { C, GROWTH_SERIES } from "./data";

const W = 118;
const H = 44;

/** Series → smooth-ish polyline path in the card's own coordinate space. */
function linePath(series: number[]) {
  const max = Math.max(...series);
  const min = Math.min(...series);
  const span = max - min || 1;
  return series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * W;
      const y = H - ((v - min) / span) * (H - 6) - 3;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

/** Market Growth — headline number plus a line chart that draws itself in. */
export function FloatingInsightCard({ delay = 0, className = "", style }: {
  delay?: number; className?: string; style?: React.CSSProperties;
}) {
  const d = linePath(GROWTH_SERIES);

  return (
    <FloatingCard
      eyebrow="Market Growth"
      accent={C.cyan}
      delay={delay}
      drift={6}
      driftDur={8}
      className={className}
      style={style}
    >
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-[26px] font-bold leading-none tracking-tight text-white" style={{ fontVariantNumeric: "tabular-nums" }}>
          +82%
        </span>
        <ArrowUpRight size={15} strokeWidth={2.6} style={{ color: C.mint }} aria-hidden />
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} fill="none" aria-hidden className="overflow-visible">
        <defs>
          <linearGradient id="hero-spark" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.purple} />
            <stop offset="100%" stopColor={C.cyan} />
          </linearGradient>
          <linearGradient id="hero-spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.purple} stopOpacity="0.22" />
            <stop offset="100%" stopColor={C.purple} stopOpacity="0" />
          </linearGradient>
        </defs>

        <motion.path
          d={`${d} L ${W} ${H} L 0 ${H} Z`}
          fill="url(#hero-spark-fill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 1.1, duration: 0.8 }}
        />
        <motion.path
          d={d}
          stroke="url(#hero-spark)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: delay + 0.25, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.circle
          cx={W} cy={3} r="2.6" fill={C.cyan}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 1.55, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </svg>
    </FloatingCard>
  );
}
