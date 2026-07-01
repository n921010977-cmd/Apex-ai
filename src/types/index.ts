export type UserRole = "GUEST" | "FREE" | "PRO" | "BUSINESS" | "ENTERPRISE" | "ADMIN" | "FOUNDER";
export type Plan = "FREE" | "PRO" | "BUSINESS" | "ENTERPRISE";
export type AgentRole = "CEO" | "CFO" | "CMO" | "COO" | "CTO" | "ANALYST" | "SALES" | "LEGAL" | "GENERAL";
export type ProjectStage = "IDEA" | "VALIDATION" | "MVP" | "GROWTH" | "SCALE" | "MATURE";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "CANCELLED";

export interface AgentConfig {
  id: string;
  role: AgentRole;
  name: string;
  slug: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  toolsEnabled: string[];
}

export interface AgentResult {
  agentId: string;
  role: AgentRole;
  content: string;
  tokensUsed: number;
  durationMs: number;
  error?: string;
}

export interface OrchestratorRequest {
  message: string;
  projectId?: string;
  conversationId?: string;
  organizationId?: string;
  userId: string;
  agentId?: string;
  stream?: boolean;
}

export interface OrchestratorResponse {
  content: string;
  agentResults: AgentResult[];
  tokensUsed: number;
  durationMs: number;
  toolsCalled: ToolCall[];
}

export interface ToolCall {
  tool: string;
  input: unknown;
  result: unknown;
  durationMs: number;
}

export interface StreamEvent {
  type: "token" | "agent_start" | "agent_done" | "tool_call" | "done" | "error";
  token?: string;
  agent?: string;
  tool?: string;
  input?: unknown;
  result?: unknown;
  message?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const PLAN_LIMITS: Record<Plan, { projects: number; messages: number; agents: number; tokensPerMonth: number }> = {
  FREE:       { projects: 3,    messages: 50,    agents: 0,   tokensPerMonth: 50_000     },
  PRO:        { projects: 20,   messages: 500,   agents: 5,   tokensPerMonth: 500_000    },
  BUSINESS:   { projects: 100,  messages: 5000,  agents: 20,  tokensPerMonth: 5_000_000  },
  ENTERPRISE: { projects: -1,   messages: -1,    agents: -1,  tokensPerMonth: -1         },
};

export const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5-20251001": { input: 0.00025, output: 0.00125 },
  "claude-sonnet-5":           { input: 0.003,   output: 0.015   },
  "claude-opus-4-8":           { input: 0.015,   output: 0.075   },
};
