import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
});

// ─── Projects ─────────────────────────────────────────────────────────────────

export const CreateProjectSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  industry: z.string().max(100).optional(),
  stage: z.enum(["IDEA", "VALIDATION", "MVP", "GROWTH", "SCALE", "MATURE"]).default("IDEA"),
  goals: z.array(z.string()).max(10).default([]),
  timeframe: z.string().max(50).optional(),
});

export const UpdateProjectSchema = CreateProjectSchema.partial().extend({
  status: z.enum(["ACTIVE", "ARCHIVED", "COMPLETED", "ON_HOLD"]).optional(),
});

// ─── Messages / Chat ──────────────────────────────────────────────────────────

export const SendMessageSchema = z.object({
  message: z.string().min(1).max(10_000),
  projectId: z.string().optional(),
  agentId: z.string().optional(),
  persona: z.string().max(4000).optional(),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).max(50).default([]),
});

// ─── Agents ───────────────────────────────────────────────────────────────────

export const CreateAgentSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).default(""),
  systemPrompt: z.string().min(10).max(10_000),
  model: z.enum([
    "claude-haiku-4-5-20251001",
    "claude-sonnet-5",
    "claude-opus-4-8",
  ]).default("claude-haiku-4-5-20251001"),
  temperature: z.number().min(0).max(1).default(0.7),
  maxTokens: z.number().min(100).max(8000).default(2000),
  toolsEnabled: z.array(z.string()).default([]),
});

export const UpdateAgentSchema = CreateAgentSchema.partial();

// ─── Reports ──────────────────────────────────────────────────────────────────

export const CreateReportSchema = z.object({
  title: z.string().min(2).max(300),
  content: z.string().min(1),
  type: z.enum(["STRATEGY", "FINANCIAL", "MARKETING", "OPERATIONS", "ANALYSIS", "EXECUTIVE", "CUSTOM"]),
  projectId: z.string().optional(),
});

export const UpdateReportSchema = CreateReportSchema.partial();

export const GenerateReportSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
  title: z.string().min(2).max(300).optional(),
  type: z.enum(["STRATEGY", "FINANCIAL", "MARKETING", "OPERATIONS", "ANALYSIS", "EXECUTIVE", "CUSTOM"]).default("EXECUTIVE"),
});

// ─── Report section content schemas (Zod-validated agent output) ──────────────

const SectionScoreSchema = z.object({
  score: z.number().min(0).max(100),
  markdown: z.string().min(1),
});

export const FinanceSectionSchema = SectionScoreSchema.extend({
  unitEconomics: z.object({
    ltv: z.number().optional(),
    cac: z.number().optional(),
    ltvCacRatio: z.number().optional(),
    grossMargin: z.number().optional(),
    paybackMonths: z.number().optional(),
  }).optional(),
  scenarios: z.array(z.object({ name: z.string(), revenueY1: z.number(), revenueY2: z.number(), revenueY3: z.number() })).optional(),
});

export const MarketSectionSchema = SectionScoreSchema.extend({
  tam: z.number().optional(),
  sam: z.number().optional(),
  som: z.number().optional(),
  competitors: z.array(z.object({ name: z.string(), strength: z.string(), weakness: z.string() })).max(5).optional(),
});

export const MarketingSectionSchema = SectionScoreSchema.extend({
  channels: z.array(z.object({ name: z.string(), priority: z.enum(["HIGH", "MEDIUM", "LOW"]), cac: z.number().optional() })).optional(),
});

export const OperationsSectionSchema = SectionScoreSchema.extend({
  milestones: z.array(z.object({ week: z.number(), title: z.string(), description: z.string() })).optional(),
});

export const RisksSectionSchema = SectionScoreSchema.extend({
  risks: z.array(z.object({
    title: z.string(),
    probability: z.enum(["HIGH", "MEDIUM", "LOW"]),
    impact: z.enum(["HIGH", "MEDIUM", "LOW"]),
    mitigation: z.string(),
  })).min(1).max(10),
});

export const RoadmapSectionSchema = SectionScoreSchema.extend({
  phases: z.array(z.object({
    phase: z.number(),
    title: z.string(),
    duration: z.string(),
    goals: z.array(z.string()),
  })).optional(),
});

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const CreateTaskSchema = z.object({
  title: z.string().min(2).max(300),
  description: z.string().max(2000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string().datetime().optional(),
  projectId: z.string().optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE", "CANCELLED"]).optional(),
});

// ─── Settings ─────────────────────────────────────────────────────────────────

export const UpdateSettingsSchema = z.object({
  language: z.enum(["ru", "en"]).optional(),
  timezone: z.string().optional(),
  theme: z.enum(["dark", "light", "system"]).optional(),
  emailNotifs: z.boolean().optional(),
  aiModel: z.string().optional(),
});

// ─── Pagination ───────────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ─── Helper ───────────────────────────────────────────────────────────────────

export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): { data: T; error: null } | { data: null; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const msg = result.error.issues.map(e => `${e.path.join(".")}: ${e.message}`).join("; ");
    return { data: null, error: msg };
  }
  return { data: result.data, error: null };
}
