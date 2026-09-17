"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { revealLine, revealLines, useMagnetic } from "@/lib/motion";
import { ArrowRight, Clock, CreditCard, Play, Sparkles, Users } from "lucide-react";
import { C } from "./data";

const cont: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const TRUST = [
  { Icon: CreditCard, label: "No credit card" },
  { Icon: Clock, label: "5-minute analysis" },
  { Icon: Users, label: "20 AI specialists" },
];

/** Left column: the promise, the ask, and the reasons to trust it. */
export function HeroCopy() {
  const magnetic = useMagnetic(6);

  return (
    <motion.div className="hero-copy" variants={cont} initial="hidden" animate="show">
      {/* Badge */}
      <motion.div variants={item}>
        <span
          className="term-mono inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10.5px] font-semibold uppercase"
          style={{
            letterSpacing: "0.13em",
            color: "rgba(216,206,255,0.9)",
            background: "rgba(124,58,237,0.08)",
            border: "1px solid rgba(124,58,237,0.24)",
          }}
        >
          <Sparkles size={12} strokeWidth={2.2} style={{ color: C.purpleLight }} aria-hidden />
          20 AI specialists • One decision
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h1 className="hero-h1" variants={revealLines(0.12)} initial="hidden" animate="show">
        {/* Each line is its own block so it can rise and sharpen independently —
            the promise resolves line by line rather than arriving all at once. */}
        <motion.span variants={revealLine} style={{ display: "block" }} className="text-white">
          Turn your idea
        </motion.span>
        <motion.span variants={revealLine} style={{ display: "block" }}>
          <span className="hero-h1-grad">into a real business.</span>
        </motion.span>
      </motion.h1>

      {/* Supporting paragraph */}
      <motion.p variants={item} className="hero-lede">
        Enter your business idea. 20 specialized AI agents analyze the market, numbers,
        risks and growth potential — then turn the findings into a clear 90-day action plan.
      </motion.p>

      {/* CTAs */}
      <motion.div variants={item} className="hero-cta-row flex flex-wrap items-center justify-center gap-3 lg:justify-start">
        <motion.div {...magnetic} style={{ display: "inline-flex", ...(magnetic.style ?? {}) }}>
        <Link href="/register" className="hero-cta group">
          Analyze My Idea — Free
          <ArrowRight
            size={17}
            strokeWidth={2.4}
            className="transition-transform duration-200 ease-out group-hover:translate-x-1"
            aria-hidden
          />
        </Link>
        </motion.div>

        <a href="#product" className="hero-cta-ghost group">
          <span
            className="flex items-center justify-center size-7 rounded-full flex-shrink-0 transition-colors duration-200"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            aria-hidden
          >
            <Play size={10} strokeWidth={2.5} fill="currentColor" className="translate-x-px" />
          </span>
          See How It Works
        </a>
      </motion.div>

      {/* Trust row */}
      <motion.ul variants={item} className="hero-trust flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 lg:justify-start">
        {TRUST.map(({ Icon, label }) => (
          <li key={label} className="flex items-center gap-2 text-[13px] text-white/50">
            <Icon size={14} strokeWidth={1.9} className="text-white/35 flex-shrink-0" aria-hidden />
            {label}
          </li>
        ))}
      </motion.ul>

      {/* Closing notes */}
      <motion.div variants={item} className="hero-notes">
        <p className="text-[13px] text-white/35">Built for founders, creators and ambitious teams.</p>
        <p className="text-[13px] text-white/55">
          Turn an idea into <span className="text-white/80 font-medium">evidence</span> before you spend money.
        </p>
      </motion.div>
    </motion.div>
  );
}
