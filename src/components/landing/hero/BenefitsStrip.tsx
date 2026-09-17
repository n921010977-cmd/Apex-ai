"use client";

import { motion } from "framer-motion";
import { LineChart, ShieldCheck, Target, Zap } from "lucide-react";
import { C } from "./data";

const BENEFITS = [
  { Icon: Target,      title: "Smarter decisions",    copy: "Based on structured analysis" },
  { Icon: Zap,         title: "Save time & money",    copy: "Avoid expensive mistakes" },
  { Icon: ShieldCheck, title: "Reduce risks",         copy: "Spot problems earlier" },
  { Icon: LineChart,   title: "Build with confidence", copy: "Get a practical 90-day plan" },
];

/** Closes the first screen — still part of the hero, not a new section. */
export function BenefitsStrip() {
  return (
    <motion.ul
      className="hero-benefits"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {BENEFITS.map(({ Icon, title, copy }) => (
        <li key={title} className="hero-benefit">
          <span
            className="flex items-center justify-center size-9 rounded-xl flex-shrink-0"
            style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}
            aria-hidden
          >
            <Icon size={16} strokeWidth={1.9} style={{ color: C.purpleLight }} />
          </span>
          <div className="min-w-0">
            <div className="text-[13.5px] font-semibold text-white/85 leading-tight">{title}</div>
            <div className="text-[12px] text-white/38 leading-snug mt-0.5">{copy}</div>
          </div>
        </li>
      ))}
    </motion.ul>
  );
}
