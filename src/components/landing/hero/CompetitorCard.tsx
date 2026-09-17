"use client";

import { motion } from "framer-motion";
import { FloatingCard } from "./FloatingCard";
import { COMPETITORS, C } from "./data";

/** Where the sample idea lands against the field it would compete in. */
export function CompetitorCard({ delay = 0, className = "", style }: {
  delay?: number; className?: string; style?: React.CSSProperties;
}) {
  return (
    <FloatingCard
      eyebrow="Competitor Analysis"
      accent={C.blue}
      delay={delay}
      drift={5}
      driftDur={7.5}
      driftDelay={1.6}
      className={className}
      style={style}
    >
      <ul className="flex flex-col gap-2">
        {COMPETITORS.map((c, i) => (
          <li key={c.label} className="flex items-center gap-2">
            <span className={`text-[10px] w-[72px] flex-shrink-0 ${c.own ? "text-white/80 font-medium" : "text-white/40"}`}>
              {c.label}
            </span>
            <span className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.span
                className="block h-full rounded-full"
                style={{
                  background: c.own
                    ? `linear-gradient(90deg, ${C.purple}, ${C.cyan})`
                    : "rgba(148,163,255,0.26)",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${c.value}%` }}
                transition={{ delay: delay + 0.4 + i * 0.1, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              />
            </span>
            <span
              className={`text-[10px] w-6 text-right flex-shrink-0 ${c.own ? "text-white/85 font-semibold" : "text-white/35"}`}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {c.value}%
            </span>
          </li>
        ))}
      </ul>
    </FloatingCard>
  );
}
