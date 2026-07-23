import { PLANS, type PlanKey } from "../config/constants.js";
import { getPlan, aiUsageToday } from "../database/repositories.js";

export interface PlanStatus {
  plan: PlanKey;
  label: string;
  aiUsed: number;
  aiLimit: number;      // -1 = unlimited
  aiRemaining: number;  // -1 = unlimited
  projectLimit: number;
}

export async function planStatus(orgId: string | null): Promise<PlanStatus> {
  const raw = await getPlan(orgId);
  const plan = (PLANS[raw as PlanKey] ? raw : "free") as PlanKey;
  const def = PLANS[plan];
  const aiUsed = await aiUsageToday(orgId);
  const aiLimit = def.aiPerDay;
  return {
    plan, label: def.label, aiUsed, aiLimit,
    aiRemaining: aiLimit < 0 ? -1 : Math.max(0, aiLimit - aiUsed),
    projectLimit: def.projects,
  };
}

// Enforce the daily AI cap before spending tokens (server-side truth).
export async function canUseAi(orgId: string | null): Promise<{ ok: boolean; status: PlanStatus }> {
  const status = await planStatus(orgId);
  const ok = status.aiLimit < 0 || status.aiUsed < status.aiLimit;
  return { ok, status };
}
