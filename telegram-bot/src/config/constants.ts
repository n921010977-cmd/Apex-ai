// Plan tiers mirror the web app's monetization (server-enforced limits).
export const PLANS = {
  free:         { label: "Free",         aiPerDay: 20,   projects: 3,   model: "haiku" },
  starter:      { label: "Starter",      aiPerDay: 100,  projects: 10,  model: "sonnet" },
  professional: { label: "Professional", aiPerDay: 500,  projects: -1,  model: "opus" },
  business:     { label: "Business",     aiPerDay: 2000, projects: -1,  model: "opus" },
  enterprise:   { label: "Enterprise",   aiPerDay: -1,   projects: -1,  model: "opus" },
} as const;

export type PlanKey = keyof typeof PLANS;

export const MODELS = {
  haiku:  "claude-haiku-4-5-20251001",
  sonnet: "claude-sonnet-5",
  opus:   "claude-opus-4-8",
} as const;

// How often (ms) we edit the streaming Telegram message. Telegram rate-limits
// edits (~1/sec per chat), so we throttle to stay safe.
export const STREAM_EDIT_INTERVAL_MS = 1200;

// Per-user command rate limit.
export const RATE_LIMIT = { windowMs: 60_000, max: 30 };
// AI messages are heavier — separate, stricter bucket.
export const AI_RATE_LIMIT = { windowMs: 60_000, max: 12 };

export const LINK_CODE_TTL_MS = 15 * 60_000; // 15 min
export const MAX_LINK_ATTEMPTS = 5;
