"use client";

import { MotionConfig } from "framer-motion";

/**
 * Makes `prefers-reduced-motion` actually reach Framer Motion.
 *
 * globals.css neutralises CSS animations for users who ask for reduced motion,
 * but that rule cannot touch Framer Motion: it animates inline transforms from
 * JavaScript, which no stylesheet overrides. Verified in a browser before this
 * existed — with `reduce` set, the hero headline still started at
 * translateY(22px)/opacity:0 and slid in, identical to the default.
 *
 * `reducedMotion="user"` makes every `motion` component skip transform and
 * layout animation straight to its end state when the OS asks for it, while
 * still allowing opacity and colour changes so state feedback survives.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
