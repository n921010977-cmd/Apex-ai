// Hero content + palette. Single place to edit the sample analysis shown in the
// product preview, so the copy never drifts between the panels.

import {
  Crown, Wallet, Megaphone, Cpu, TrendingUp, Scale,
  Database, Microscope, Palette, MousePointerClick,
  type LucideIcon,
} from "lucide-react";

/** Hero palette — restrained: purple leads, blue supports, cyan/mint signal. */
export const C = {
  purple: "#7C3AED",
  purpleLight: "#A78BFA",
  indigo: "#4F46E5",
  blue: "#3B82F6",
  cyan: "#22D3EE",
  mint: "#34D399",
  ink: "#05060B",
  panel: "rgba(11,13,21,0.82)",
  line: "rgba(148,163,255,0.12)",
  lineSoft: "rgba(148,163,255,0.08)",
} as const;

/** The idea shown in the preview — one illustrative sample run, not a claim. */
export const SAMPLE_IDEA = "AI fitness app for teenagers";

/** Scores for that sample idea. `tone` picks the bar's gradient end. */
export const SAMPLE_SCORES: { label: string; value: number; tone: "good" | "neutral" | "low" }[] = [
  { label: "Market", value: 82, tone: "good" },
  { label: "Demand", value: 91, tone: "good" },
  { label: "Competition", value: 64, tone: "neutral" },
  { label: "Risk", value: 38, tone: "low" },
];

/** The 10 named directors shown as chips; the board is 20 in total. */
export const AGENT_CHIPS: { label: string; Icon: LucideIcon }[] = [
  { label: "CEO", Icon: Crown },
  { label: "CFO", Icon: Wallet },
  { label: "CMO", Icon: Megaphone },
  { label: "CTO", Icon: Cpu },
  { label: "Growth", Icon: TrendingUp },
  { label: "Legal", Icon: Scale },
  { label: "Data", Icon: Database },
  { label: "Research", Icon: Microscope },
  { label: "Brand", Icon: Palette },
  { label: "UX", Icon: MousePointerClick },
];

export const ACTION_PLAN = [
  "Market validation",
  "Financial model",
  "Growth strategy",
  "Risk management",
];

export const COMPETITORS: { label: string; value: number; own?: boolean }[] = [
  { label: "Your idea", value: 82, own: true },
  { label: "Competitor A", value: 61 },
  { label: "Competitor B", value: 48 },
  { label: "Competitor C", value: 32 },
];

/** 12-point upward trend for the Market Growth sparkline (0–100 space). */
export const GROWTH_SERIES = [18, 24, 21, 33, 39, 36, 48, 57, 55, 68, 79, 92];

/** Sparse dots for the Global Demand mini-map, in a 100×52 viewBox. */
export const DEMAND_DOTS: [number, number, number][] = [
  [14, 18, 1.6], [19, 24, 1.1], [23, 30, 1.3], [17, 33, 1],
  [30, 14, 1.2], [34, 20, 1.7], [31, 26, 1], [37, 31, 1.2],
  [46, 16, 1.4], [50, 22, 1.1], [48, 29, 1.6], [53, 34, 1],
  [62, 15, 1.2], [67, 21, 1.5], [71, 27, 1.1], [65, 32, 1.3],
  [79, 19, 1.4], [84, 26, 1], [81, 33, 1.2], [88, 30, 1.5],
];
