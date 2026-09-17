"use client";

import { motion } from "framer-motion";
import { C } from "./data";

/**
 * Glass panel shell for every satellite card around the main dashboard.
 * Owns the chrome (surface, hairline, eyebrow) and the two motions each card
 * shares: the entrance, and a slow idle drift so the composition breathes.
 * Drift amplitude/duration differ per card so they never move in lockstep.
 */
export function FloatingCard({
  eyebrow,
  accent = C.purpleLight,
  delay = 0,
  drift = 5,
  driftDur = 7,
  driftDelay = 0,
  action,
  className = "",
  style,
  children,
}: {
  eyebrow: string;
  accent?: string;
  delay?: number;
  drift?: number;
  driftDur?: number;
  driftDelay?: number;
  action?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="hero-drift rounded-2xl p-3.5"
        style={{
          ["--drift" as string]: `${drift}px`,
          animationDuration: `${driftDur}s`,
          animationDelay: `${driftDelay}s`,
          background: `linear-gradient(180deg, rgba(20,22,36,0.88) 0%, rgba(9,10,18,0.92) 100%)`,
          border: `1px solid ${C.line}`,
          boxShadow: "0 1px 2px rgba(0,0,0,0.5), 0 18px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <span
            className="term-mono text-[9.5px] font-bold uppercase leading-[1.35]"
            style={{ color: accent, letterSpacing: "0.12em" }}
          >
            {eyebrow}
          </span>
          {action}
        </div>
        {children}
      </div>
    </motion.div>
  );
}
