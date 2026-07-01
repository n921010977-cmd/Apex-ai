/**
 * Multi-Agent Report Generation Pipeline
 *
 * Architecture:
 *   Orchestrator → [Finance, Market, Marketing, Operations, Risks, Roadmap] → Summary
 *
 * Each agent runs in parallel, returns Zod-validated JSON with a section score
 * and markdown content. The Orchestrator writes the executive summary last,
 * computing overallScore = mean of all section scores.
 */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import {
  FinanceSectionSchema,
  MarketSectionSchema,
  MarketingSectionSchema,
  OperationsSectionSchema,
  RisksSectionSchema,
  RoadmapSectionSchema,
} from "@/lib/validators";
import { createClient } from "@/lib/supabase/server";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY is missing");
    _client = new Anthropic({ apiKey: key });
  }
  return _client;
}

// ─── Project context ──────────────────────────────────────────────────────────

export interface ProjectContext {
  name: string;
  description: string;
  industry: string;
  stage: string;
  goals: string[];
  timeframe: string;
  targetRevenue: string;
}

export interface GenerateReportInput {
  reportId: string;
  projectId: string;
  project: ProjectContext;
  userId: string;
}

// ─── Generic JSON agent runner ────────────────────────────────────────────────

async function runJsonAgent<T>(opts: {
  systemPrompt: string;
  userMessage: string;
  schema: z.ZodSchema<T>;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<T> {
  const client = getClient();

  const response = await client.messages.create({
    model: opts.model ?? "claude-haiku-4-5-20251001",
    max_tokens: opts.maxTokens ?? 3000,
    temperature: opts.temperature ?? 0.4,
    system: opts.systemPrompt,
    messages: [{ role: "user", content: opts.userMessage }],
  });

  const raw = response.content.find(b => b.type === "text")?.text ?? "{}";

  // Extract first JSON object from the response (agents sometimes add prose)
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Agent returned no JSON. Raw: ${raw.slice(0, 200)}`);

  const parsed = JSON.parse(jsonMatch[0]);
  return opts.schema.parse(parsed);
}

// ─── Individual section agents ────────────────────────────────────────────────

async function runFinanceAgent(p: ProjectContext) {
  return runJsonAgent({
    schema: FinanceSectionSchema,
    systemPrompt: `You are a world-class CFO and financial modelling expert.
Analyse the business concept and return ONLY a JSON object matching this exact structure:
{
  "score": <0-100 integer>,
  "markdown": "<full financial analysis in Russian markdown>",
  "unitEconomics": { "ltv": <number>, "cac": <number>, "ltvCacRatio": <number>, "grossMargin": <0-1 float>, "paybackMonths": <number> },
  "scenarios": [
    { "name": "Bear", "revenueY1": <number>, "revenueY2": <number>, "revenueY3": <number> },
    { "name": "Base", "revenueY1": <number>, "revenueY2": <number>, "revenueY3": <number> },
    { "name": "Bull", "revenueY1": <number>, "revenueY2": <number>, "revenueY3": <number> }
  ]
}
Rules: Never invent impossible numbers. Base assumptions on the industry and stage. Write markdown in Russian. Score reflects financial viability (100 = exceptional).`,
    userMessage: `Business: ${p.name}\nIndustry: ${p.industry}\nStage: ${p.stage}\nDescription: ${p.description}\nGoals: ${p.goals.join(", ")}\nTimeframe: ${p.timeframe}\nTarget revenue: ${p.targetRevenue}`,
  });
}

async function runMarketAgent(p: ProjectContext) {
  return runJsonAgent({
    schema: MarketSectionSchema,
    systemPrompt: `You are a top market research analyst.
Return ONLY a JSON object:
{
  "score": <0-100>,
  "markdown": "<Russian markdown — TAM/SAM/SOM analysis, market trends, segmentation>",
  "tam": <total addressable market in USD>,
  "sam": <serviceable addressable market in USD>,
  "som": <serviceable obtainable market in USD>,
  "competitors": [{ "name": "...", "strength": "...", "weakness": "..." }]
}
Score reflects market attractiveness. Use realistic industry data. Write in Russian.`,
    userMessage: `Business: ${p.name}\nIndustry: ${p.industry}\nDescription: ${p.description}\nStage: ${p.stage}`,
  });
}

async function runMarketingAgent(p: ProjectContext) {
  return runJsonAgent({
    schema: MarketingSectionSchema,
    systemPrompt: `You are a CMO and growth marketing expert.
Return ONLY a JSON object:
{
  "score": <0-100>,
  "markdown": "<Russian markdown — positioning, GTM strategy, content plan, channels>",
  "channels": [
    { "name": "...", "priority": "HIGH"|"MEDIUM"|"LOW", "cac": <estimated CAC in USD> }
  ]
}
Score = marketing strategy quality. Channels ordered by ROI potential. Write in Russian.`,
    userMessage: `Business: ${p.name}\nIndustry: ${p.industry}\nDescription: ${p.description}\nGoals: ${p.goals.join(", ")}`,
  });
}

async function runOperationsAgent(p: ProjectContext) {
  return runJsonAgent({
    schema: OperationsSectionSchema,
    systemPrompt: `You are a COO and operations excellence expert.
Return ONLY a JSON object:
{
  "score": <0-100>,
  "markdown": "<Russian markdown — team structure, key processes, operational KPIs, toolstack>",
  "milestones": [
    { "week": <1-52>, "title": "...", "description": "..." }
  ]
}
Score = operational readiness. Milestones sorted by week. Write in Russian.`,
    userMessage: `Business: ${p.name}\nStage: ${p.stage}\nDescription: ${p.description}\nGoals: ${p.goals.join(", ")}\nTimeframe: ${p.timeframe}`,
  });
}

async function runRisksAgent(p: ProjectContext) {
  return runJsonAgent({
    schema: RisksSectionSchema,
    systemPrompt: `You are a risk management expert and CISO.
Return ONLY a JSON object:
{
  "score": <0-100 — higher means lower/manageable risk>,
  "markdown": "<Russian markdown — SWOT, risk matrix, mitigation playbook>",
  "risks": [
    { "title": "...", "probability": "HIGH"|"MEDIUM"|"LOW", "impact": "HIGH"|"MEDIUM"|"LOW", "mitigation": "..." }
  ]
}
List 5-8 risks ordered by severity (probability × impact). Write in Russian.`,
    userMessage: `Business: ${p.name}\nIndustry: ${p.industry}\nStage: ${p.stage}\nDescription: ${p.description}`,
  });
}

async function runRoadmapAgent(p: ProjectContext) {
  return runJsonAgent({
    schema: RoadmapSectionSchema,
    systemPrompt: `You are a project management and startup launch expert.
Return ONLY a JSON object:
{
  "score": <0-100>,
  "markdown": "<Russian markdown — phased roadmap, key milestones, go/no-go gates>",
  "phases": [
    { "phase": 1, "title": "...", "duration": "...", "goals": ["..."] }
  ]
}
3-5 phases covering the full journey to profitability. Write in Russian.`,
    userMessage: `Business: ${p.name}\nStage: ${p.stage}\nTimeframe: ${p.timeframe}\nGoals: ${p.goals.join(", ")}\nDescription: ${p.description}`,
  });
}

// ─── Orchestrator summary agent ───────────────────────────────────────────────

async function runOrchestratorSummary(p: ProjectContext, sectionMarkdowns: string[], overallScore: number): Promise<string> {
  const client = getClient();
  const combined = sectionMarkdowns.join("\n\n---\n\n");

  const resp = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    temperature: 0.5,
    system: `You are a CEO synthesising a business analysis from your expert team.
Write 2-3 sentences of executive summary in Russian. Be direct, data-driven, and actionable.
Do NOT use markdown formatting — plain text only.`,
    messages: [
      {
        role: "user",
        content: `Business: "${p.name}"\nOverall score: ${overallScore}/100\n\nAgent reports summary:\n${combined.slice(0, 4000)}`,
      },
    ],
  });

  return resp.content.find(b => b.type === "text")?.text?.trim() ?? "";
}

// ─── Supabase persistence helpers ─────────────────────────────────────────────

type SectionType = "SUMMARY" | "FINANCE" | "MARKET" | "MARKETING" | "OPERATIONS" | "RISKS" | "ROADMAP";

async function upsertSection(
  db: ReturnType<typeof Object.create>,
  reportId: string,
  type: SectionType,
  title: string,
  content: Record<string, unknown>,
  score: number,
  sortOrder: number,
) {
  await db.from("report_sections").upsert({
    report_id: reportId,
    type,
    title,
    content,
    score,
    status: "COMPLETED",
    sort_order: sortOrder,
  }, { onConflict: "report_id,type" });
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

export async function generateReport(input: GenerateReportInput): Promise<void> {
  const { reportId, project } = input;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  try {
    // Mark as PROCESSING
    await db.from("reports").update({ gen_status: "PROCESSING" }).eq("id", reportId);

    // ── Run all section agents in parallel ──────────────────────────────────
    const [finance, market, marketing, operations, risks, roadmap] = await Promise.allSettled([
      runFinanceAgent(project),
      runMarketAgent(project),
      runMarketingAgent(project),
      runOperationsAgent(project),
      runRisksAgent(project),
      runRoadmapAgent(project),
    ]);

    const resolve = <T>(r: PromiseSettledResult<T>, fallback: T): T =>
      r.status === "fulfilled" ? r.value : (console.error("[agent-error]", r.reason), fallback);

    const financeData    = resolve(finance,    { score: 50, markdown: "Данные не получены." });
    const marketData     = resolve(market,     { score: 50, markdown: "Данные не получены." });
    const marketingData  = resolve(marketing,  { score: 50, markdown: "Данные не получены." });
    const operationsData = resolve(operations, { score: 50, markdown: "Данные не получены." });
    const risksData      = resolve(risks,      { score: 50, markdown: "Данные не получены.", risks: [] });
    const roadmapData    = resolve(roadmap,    { score: 50, markdown: "Данные не получены." });

    // ── Persist sections ────────────────────────────────────────────────────
    await Promise.all([
      upsertSection(db, reportId, "FINANCE",    "Финансовая модель", financeData    as Record<string, unknown>, financeData.score,    1),
      upsertSection(db, reportId, "MARKET",     "Анализ рынка",      marketData     as Record<string, unknown>, marketData.score,     2),
      upsertSection(db, reportId, "MARKETING",  "Маркетинг",         marketingData  as Record<string, unknown>, marketingData.score,  3),
      upsertSection(db, reportId, "OPERATIONS", "Операции",          operationsData as Record<string, unknown>, operationsData.score, 4),
      upsertSection(db, reportId, "RISKS",      "Риски",             risksData      as Record<string, unknown>, risksData.score,      5),
      upsertSection(db, reportId, "ROADMAP",    "Дорожная карта",    roadmapData    as Record<string, unknown>, roadmapData.score,    6),
    ]);

    // ── Compute overall score ───────────────────────────────────────────────
    const scores = [financeData.score, marketData.score, marketingData.score, operationsData.score, risksData.score, roadmapData.score];
    const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    // ── Orchestrator writes executive summary ───────────────────────────────
    const markdowns = [
      financeData.markdown, marketData.markdown, marketingData.markdown,
      operationsData.markdown, operationsData.markdown, roadmapData.markdown,
    ];
    const summaryText = await runOrchestratorSummary(project, markdowns, overallScore);

    // Persist SUMMARY section
    await upsertSection(db, reportId, "SUMMARY", "Резюме", { markdown: summaryText }, overallScore, 0);

    // Estimate total pages: ~250 words per page, each markdown ~800 words avg
    const totalPages = Math.max(8, Math.ceil((markdowns.join("").split(/\s+/).length) / 250));

    // ── Mark report COMPLETED ───────────────────────────────────────────────
    await db.from("reports").update({
      gen_status:    "COMPLETED",
      status:        "PUBLISHED",
      overall_score: overallScore,
      summary:       summaryText,
      total_pages:   totalPages,
      content:       markdowns.join("\n\n---\n\n"),
    }).eq("id", reportId);

  } catch (err) {
    console.error("[generateReport] fatal:", err);
    await db.from("reports").update({ gen_status: "FAILED" }).eq("id", reportId);
    throw err;
  }
}
