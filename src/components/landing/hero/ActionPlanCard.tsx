"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";
import { FloatingCard } from "./FloatingCard";
import { ACTION_PLAN, C } from "./data";

/** The deliverable: a 90-day plan, checked off item by item. */
export function ActionPlanCard({ delay = 0, className = "", style }: {
  delay?: number; className?: string; style?: React.CSSProperties;
}) {
  return (
    <FloatingCard
      eyebrow="90-Day Action Plan"
      accent={C.purpleLight}
      delay={delay}
      drift={7}
      driftDur={9}
      driftDelay={0.8}
      className={className}
      style={style}
      action={
        <span
          className="flex items-center justify-center size-6 rounded-full flex-shrink-0"
          style={{ background: "rgba(124,58,237,0.16)", border: `1px solid rgba(124,58,237,0.32)` }}
          aria-hidden
        >
          <ArrowUpRight size={13} strokeWidth={2.4} style={{ color: C.purpleLight }} />
        </span>
      }
    >
      <ul className="flex flex-col gap-2.5">
        {ACTION_PLAN.map((step, i) => (
          <motion.li
            key={step}
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.35 + i * 0.13, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <span
              className="flex items-center justify-center size-4 rounded-[5px] flex-shrink-0"
              style={{ background: "rgba(52,211,153,0.14)", border: "1px solid rgba(52,211,153,0.3)" }}
            >
              <Check size={10} strokeWidth={3} style={{ color: C.mint }} aria-hidden />
            </span>
            <span className="text-[11.5px] text-white/72 leading-tight">{step}</span>
          </motion.li>
        ))}
      </ul>
    </FloatingCard>
  );
}
