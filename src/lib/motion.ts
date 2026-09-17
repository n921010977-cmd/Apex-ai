"use client";

// ─── Motion system ────────────────────────────────────────────────────────────
// Single source of truth for JS-driven motion (Framer Motion). Mirrors the CSS
// motion tokens in src/styles/tokens.css (--duration-*, --ease-*) so a hover in
// CSS and an entrance in JS move on the same curve.
//
// Why this exists: durations were being invented per component — a survey of
// src/ found 15+ distinct values (0.22 … 1.2s) for the same kinds of motion.
// Easing was already disciplined ([0.22, 1, 0.36, 1] in 54 places); this keeps
// that curve and fixes the durations to a three-step scale.
//
// Import these instead of writing literals:
//   import { DUR, EASE, fadeUp, stagger } from "@/lib/motion";

import { useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import type { Transition, Variants } from "framer-motion";

/** Cubic-bezier control points, typed so Framer Motion accepts them as `ease`. */
type Bezier = [number, number, number, number];

// ─── Scale ────────────────────────────────────────────────────────────────────
// Three steps carry ~everything. The finer values exist for the rare case that
// genuinely needs them — reach for FAST/MEDIUM/SLOW first.

export const DUR = {
  /** 0.15s — hover, press, focus, colour/opacity flips. Below perception. */
  FAST: 0.15,
  /** 0.4s — element entrance, state change, modal, layout shift. The default. */
  MEDIUM: 0.4,
  /** 0.7s — hero/cinematic entrance, chart draw, progressive reveal. */
  SLOW: 0.7,

  instant: 0.075,
  normal: 0.25,
  slower: 0.6,
  slowest: 0.9,
} as const;

export const EASE = {
  /** ease-out-quint — the house curve. Default for anything entering. */
  standard: [0.22, 1, 0.36, 1] as Bezier,
  /** Slight overshoot. Only for things that should feel physical (toasts, chips). */
  spring: [0.34, 1.56, 0.64, 1] as Bezier,
  /** Symmetric — for things that move and come back (accordions, toggles). */
  inOut: [0.4, 0, 0.2, 1] as Bezier,
  out: [0, 0, 0.2, 1] as Bezier,
} as const;

/** Spring for gesture-driven motion, where a duration would feel synthetic. */
export const SPRING = { type: "spring", stiffness: 260, damping: 20 } as const;

/** Stagger steps — children of a reveal should land 60–110ms apart, no more. */
export const STAGGER = { tight: 0.05, base: 0.08, loose: 0.11 } as const;

// ─── Base transitions ─────────────────────────────────────────────────────────

export const T: Record<"fast" | "medium" | "slow", Transition> = {
  fast:   { duration: DUR.FAST,   ease: EASE.standard },
  medium: { duration: DUR.MEDIUM, ease: EASE.standard },
  slow:   { duration: DUR.SLOW,   ease: EASE.standard },
};

// ─── Standard patterns ────────────────────────────────────────────────────────
// Use these names in components so the vocabulary stays shared.

/** The default entrance. Content arrives from slightly below. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: T.medium },
};

/** Entrance with no travel — for things that shouldn't appear to move. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: T.medium },
};

/** For elements that grow into place: chips, badges, avatars. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: T.medium },
};

/** Directional entrance — panels, drawers, columns. */
export const slideIn = (from: "left" | "right" | "top" | "bottom" = "right", distance = 28): Variants => {
  const horizontal = from === "left" || from === "right";
  const offset = (from === "left" || from === "top" ? -1 : 1) * distance;
  return horizontal
    ? { hidden: { opacity: 0, x: offset }, show: { opacity: 1, x: 0, transition: T.medium } }
    : { hidden: { opacity: 0, y: offset }, show: { opacity: 1, y: 0, transition: T.medium } };
};

/** Parent of a staggered group. Pair with fadeUp/scaleIn children. */
export const stagger = (step: number = STAGGER.base, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: step, delayChildren } },
});

/** Hover/press for interactive surfaces. Lift is small on purpose. */
export const hoverLift = { y: -2, transition: T.fast } as const;
export const press = { scale: 0.98, transition: { duration: DUR.instant } } as const;

/** Modal / dialog. Backdrop fades, panel scales a touch. */
export const modal: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: T.medium },
  exit: { opacity: 0, scale: 0.98, y: 4, transition: { duration: DUR.normal, ease: EASE.inOut } },
};

/** Route/page level — quieter and faster than element entrances. */
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.normal, ease: EASE.standard } },
};

// ─── Product-narrative patterns ───────────────────────────────────────────────
// VERTLIX motion tells one story: INPUT → ANALYSIS → INSIGHT → STRATEGY → ACTION.
// These are the beats. Delays are relative to the panel's own entrance.

export const REVEAL = {
  /** Panel lands first. */
  panel: 0.1,
  /** Metrics start filling once the panel is readable. */
  bars: 0.75,
  /** Agents report in after the numbers. */
  agents: 1.15,
  /** The verdict is last — it's the payoff. */
  verdict: 1.7,
  /** "Analyzing…" → "Analysis complete", in ms. */
  statusSwitchMs: 2600,
} as const;

/** Bars/rings filling. Slow on purpose — it reads as calculation, not decoration. */
export const barFill = (value: number, index = 0): Transition & { width: string } => ({
  width: `${value}%`,
  duration: 1.2,
  delay: REVEAL.bars + index * 0.12,
  ease: EASE.standard,
});

/** SVG line that draws itself. Animate `pathLength` 0 → 1, never stroke-dasharray by hand. */
export const chartDraw = (delay = 0): Transition => ({
  duration: 1.4,
  delay,
  ease: EASE.standard,
});

/** Count-up easing — ease-out-cubic. Digits must finish with their bar. */
export const countEase = (t: number) => 1 - Math.pow(1 - t, 3);
export const COUNT_MS = 1200;

// ─── Accessibility ────────────────────────────────────────────────────────────
// globals.css neutralises CSS animations under prefers-reduced-motion, but that
// rule CANNOT reach Framer Motion — it animates inline transforms from JS, which
// no stylesheet overrides. To honour the setting app-wide, wrap the tree once:
//
// This is handled app-wide by <MotionProvider> (src/components/MotionProvider.tsx),
// mounted in the root layout. Verified by frame-tracing the hero headline: with
// `reduce` set it moves through 2 distinct positions (a snap) versus 12 without,
// so no per-component guards are needed. Do not add them.

// ─── Editorial reveal ─────────────────────────────────────────────────────────
// Line-by-line entrance for display type: the line rises out of a slight blur
// and sharpens. Reads as film titling rather than a UI fade, and unlike a
// typewriter it never leaves the headline unreadable mid-flight.
//
// `filter` is not a compositor-only property, so this is reserved for a handful
// of display lines on first paint — never for body copy or anything in a list.

export const revealLine: Variants = {
  hidden: { opacity: 0, y: "0.42em", filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: "0em",
    filter: "blur(0px)",
    transition: { duration: 0.85, ease: EASE.standard },
  },
};

/** Parent for revealLine children. Lines land ~130ms apart. */
export const revealLines = (delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren } },
});

// ─── Ambient ──────────────────────────────────────────────────────────────────

/** Slow idle drift. Give neighbouring elements different durations. */
export const floatY = (px = 6, seconds = 7) => ({
  animate: { y: [0, -px, 0] },
  transition: { duration: seconds, ease: EASE.inOut, repeat: Infinity },
});

/** Breathing opacity for live/status indicators. */
export const pulse = (seconds = 2.4) => ({
  animate: { opacity: [0.35, 1, 0.35] },
  transition: { duration: seconds, ease: EASE.inOut, repeat: Infinity },
});

// ─── Pointer magnetism ────────────────────────────────────────────────────────

/**
 * Pulls an element a few pixels toward the cursor while it is nearby, then
 * springs home. Used on the primary CTA so it feels like it wants to be
 * pressed. Deliberately small — past ~8px it reads as a gimmick and the button
 * starts running away from the click.
 *
 * Returns props to spread on a `motion` element. No-ops for coarse pointers
 * (touch has no hover state to anticipate) and when reduced motion is set.
 */
export function useMagnetic(strength = 6) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const reduced = useReducedMotion();
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.35 });

  const fine = typeof window !== "undefined" && window.matchMedia?.("(pointer: fine)").matches;
  const active = fine && !reduced;

  return {
    style: active ? { x: sx, y: sy } : undefined,
    onPointerMove: active
      ? (e: React.PointerEvent<HTMLElement>) => {
          const r = e.currentTarget.getBoundingClientRect();
          x.set(((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) * strength);
          y.set(((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) * strength);
        }
      : undefined,
    onPointerLeave: active ? () => { x.set(0); y.set(0); } : undefined,
  };
}
