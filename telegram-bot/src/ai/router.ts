import { MODELS, PLANS, type PlanKey } from "../config/constants.js";
import type { AgentDef } from "./agents.js";

// Model router — picks the concrete model id from (agent preference × plan cap).
// Opus is gated to paid plans; free/starter fall back to the best they can use.
// An OpenAI branch can be added here when OPENAI_API_KEY is set (kept minimal now).
export function pickModel(agent: AgentDef, plan: string): string {
  const p = (PLANS[plan as PlanKey] ? plan : "free") as PlanKey;
  const planTier = PLANS[p].model; // "haiku" | "sonnet" | "opus"
  const order = ["haiku", "sonnet", "opus"] as const;
  const cap = order.indexOf(planTier);
  const want = order.indexOf(agent.model);
  const chosen = order[Math.min(cap, want)];
  return MODELS[chosen];
}
