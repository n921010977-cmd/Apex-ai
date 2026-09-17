"use client";

import { motion } from "framer-motion";
import { FloatingCard } from "./FloatingCard";
import { DEMAND_DOTS, C } from "./data";

/**
 * Deliberately the quietest panel in the composition — it sits furthest back
 * and only hints at geography, so it reads as depth rather than another chart.
 */
export function GlobalDemandCard({ delay = 0, className = "", style }: {
  delay?: number; className?: string; style?: React.CSSProperties;
}) {
  return (
    <FloatingCard
      eyebrow="Global Demand"
      accent="rgba(148,163,255,0.55)"
      delay={delay}
      drift={4}
      driftDur={10}
      driftDelay={2.4}
      className={className}
      style={style}
    >
      <svg viewBox="0 0 100 46" width="100%" height={46} aria-hidden>
        {DEMAND_DOTS.map(([cx, cy, r], i) => (
          <motion.circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill={i % 5 === 0 ? C.cyan : "rgba(167,139,250,0.75)"}
            initial={{ opacity: 0 }}
            animate={{ opacity: i % 5 === 0 ? 0.9 : 0.4 }}
            transition={{ delay: delay + 0.3 + i * 0.03, duration: 0.5 }}
          />
        ))}
      </svg>
    </FloatingCard>
  );
}
