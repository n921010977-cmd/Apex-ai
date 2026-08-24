/**
 * AI Report Orchestrator — 15-agent pipeline for 100-page business reports.
 *
 * Architecture:
 *  Phase 1 (parallel): CFO · CMO Market · CMO Marketing · COO · CRO · Roadmap
 *  Phase 2 (sequential): CEO summary synthesised from all section scores
 *
 * Each section runs 4-5 sequential LLM calls (sub-sections), each targeting
 * 3-4 pages of rich markdown, totalling 15+ pages per section ≈ 100 pages overall.
 *
 * Uses @supabase/supabase-js directly (no cookies) so it can run as a
 * fire-and-forget background task after the HTTP response is returned.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProjectContext {
  name:          string;
  description:   string;
  industry:      string;
  stage:         string;
  goals:         string[];
  timeframe:     string;
  targetRevenue: string;
  analysis:      unknown | null;
}

interface ContentBlock {
  subTitle:     string;
  markdown:     string;
  pageEstimate: number;
  score:        number;
}

interface SectionResult {
  blocks:     ContentBlock[];
  totalPages: number;
  score:      number;
  agentMeta:  { agent: string; model: string; tokensUsed: number; durationMs: number };
}

// ─── Clients ──────────────────────────────────────────────────────────────────

function getAi(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars are not set");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createSupabaseClient(url, key, { auth: { persistSession: false } }) as any;
}

// ─── Core agent call ──────────────────────────────────────────────────────────

const SUBMIT_TOOL: Anthropic.Tool = {
  name: "submit_content",
  description: "Submit the completed content block for this sub-section",
  input_schema: {
    type: "object",
    properties: {
      subTitle:     { type: "string",  description: "H3 heading for this sub-section" },
      markdown:     { type: "string",  description: "Rich detailed markdown, 2500–6000 words" },
      score:        { type: "number",  description: "Business readiness score 0–100 for this area" },
      pageEstimate: { type: "number",  description: "Estimated A4 pages if printed (typically 3–5)" },
    },
    required: ["subTitle", "markdown", "score", "pageEstimate"],
  },
};

async function callAgent(params: {
  agentName:  string;
  system:     string;
  user:       string;
  model?:     string;
  maxTokens?: number;
  ai:         Anthropic;
}): Promise<ContentBlock & { tokensUsed: number }> {
  const model = params.model ?? "claude-sonnet-5";
  const start = Date.now();

  let tokensUsed = 0;

  try {
    const response = await params.ai.messages.create({
      model,
      max_tokens: params.maxTokens ?? 8000,
      system:     params.system,
      messages:   [{ role: "user", content: params.user }],
      tools:      [SUBMIT_TOOL],
      tool_choice: { type: "auto" },
    });

    tokensUsed = (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);

    const toolBlock = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (toolBlock) {
      const inp = toolBlock.input as { subTitle?: string; markdown?: string; score?: number; pageEstimate?: number };
      return {
        subTitle:     inp.subTitle     ?? params.agentName,
        markdown:     inp.markdown     ?? "",
        score:        clamp(inp.score  ?? 70, 0, 100),
        pageEstimate: inp.pageEstimate ?? 3,
        tokensUsed,
      };
    }

    // Fallback: use text blocks
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map(b => b.text)
      .join("\n\n");

    return { subTitle: params.agentName, markdown: text || "—", score: 65, pageEstimate: 3, tokensUsed };
  } catch (err) {
    console.error(`[orchestrator] agent "${params.agentName}" error:`, err);
    return { subTitle: params.agentName, markdown: `Generation error: ${String(err)}`, score: 0, pageEstimate: 0, tokensUsed };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

function mean(arr: number[]) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }

function buildContext(p: ProjectContext) {
  return `
Project: ${p.name}
Description: ${p.description || "not specified"}
Industry: ${p.industry}
Stage: ${p.stage}
Goals: ${p.goals.join("; ") || "not specified"}
Timeframe: ${p.timeframe}
Target revenue: ${p.targetRevenue || "not specified"}
${p.analysis ? `\nPreliminary analysis:\n${JSON.stringify(p.analysis, null, 2)}` : ""}
`.trim();
}

async function persistSection(
  db: ReturnType<typeof getDb>,
  reportId: string,
  type: string,
  title: string,
  result: SectionResult,
  sortOrder: number,
) {
  const { error } = await db
    .from("report_sections")
    .upsert(
      {
        report_id:  reportId,
        type,
        title,
        content:    result,
        score:      result.score,
        gen_status: "COMPLETED",
        sort_order: sortOrder,
      },
      { onConflict: "report_id,type" },
    );

  if (error) console.error(`[orchestrator] upsert ${type} error:`, error);
}

async function markSectionProcessing(db: ReturnType<typeof getDb>, reportId: string, type: string, title: string, sortOrder: number) {
  await db
    .from("report_sections")
    .upsert(
      { report_id: reportId, type, title, content: {}, gen_status: "PROCESSING", sort_order: sortOrder },
      { onConflict: "report_id,type" },
    );
}

// ─── Department tracks ────────────────────────────────────────────────────────

async function runFinanceTrack(
  ai: Anthropic,
  db: ReturnType<typeof getDb>,
  reportId: string,
  project: ProjectContext,
): Promise<SectionResult> {
  const start   = Date.now();
  const ctx     = buildContext(project);
  await markSectionProcessing(db, reportId, "FINANCE", "Financial Analysis", 1);

  const BASE_SYSTEM = `You are the CFO (Chief Financial Officer) — an expert in financial modeling and investment analysis.
Write in detail, with tables, formulas, and figures. Respond ONLY through the submit_content tool.
Project context:\n${ctx}`;

  const subSections: Array<{ name: string; prompt: string }> = [
    {
      name:   "Financial Model & Revenue Forecast (Year 1-3)",
      prompt: `Develop a detailed financial model for "${project.name}".
Include: revenue structure and income streams; a monthly plan for Y1, quarterly for Y2, annual for Y3;
pricing and plan tiers; key growth drivers. Use markdown tables.
Target length: 4-5 pages.`,
    },
    {
      name:   "Unit Economics: LTV, CAC, Margins",
      prompt: `Conduct a deep unit economics analysis for "${project.name}".
Calculate and explain: CAC by channel; LTV broken down by segment; LTV/CAC (target >3x);
Gross Margin, Contribution Margin; Payback Period; Churn Rate and its effect on LTV.
Show all formulas and calculations. Length: 3-4 pages.`,
    },
    {
      name:   "Cash Flow, Runway & Breakeven Point",
      prompt: `Build a detailed cash flow analysis for "${project.name}".
Include: monthly cash burn rate; runway at current investment levels; breakeven analysis (units and revenue);
operating vs. free cash flow; working capital; key triggers for a cash crunch.
Tables and ASCII charts. Length: 3-4 pages.`,
    },
    {
      name:   "Fundraising Strategy & Capital Structure",
      prompt: `Develop an investment strategy for "${project.name}".
Include: required funding amount and stages (pre-seed, seed, Series A);
how to allocate capital (use of funds); valuation — DCF and comparable company methods;
investor terms (key term sheet points); a plan to reach milestones before the next round.
Length: 3-4 pages.`,
    },
    {
      name:   "Three-Scenario Analysis: Bear / Base / Bull",
      prompt: `Conduct a full scenario analysis for "${project.name}".
For each scenario (Pessimistic / Base / Optimistic) describe: key assumptions; revenue Y1/Y2/Y3;
EBITDA margin; runway; probability of occurrence; triggers for switching between scenarios; recommended actions.
A scenario comparison table. Length: 4-5 pages.`,
    },
  ];

  const blocks: ContentBlock[] = [];
  let   totalTokens = 0;

  for (const sub of subSections) {
    const result = await callAgent({ agentName: sub.name, system: BASE_SYSTEM, user: sub.prompt, ai, maxTokens: 8000 });
    blocks.push({ subTitle: result.subTitle, markdown: result.markdown, pageEstimate: result.pageEstimate, score: result.score });
    totalTokens += result.tokensUsed;
  }

  const sectionScore = Math.round(mean(blocks.map(b => b.score)));
  const totalPages   = blocks.reduce((s, b) => s + b.pageEstimate, 0);
  const sectionResult: SectionResult = {
    blocks, totalPages, score: sectionScore,
    agentMeta: { agent: "CFO", model: "claude-sonnet-5", tokensUsed: totalTokens, durationMs: Date.now() - start },
  };

  await persistSection(db, reportId, "FINANCE", "Financial Analysis", sectionResult, 1);
  return sectionResult;
}

async function runMarketTrack(
  ai: Anthropic,
  db: ReturnType<typeof getDb>,
  reportId: string,
  project: ProjectContext,
): Promise<SectionResult> {
  const start   = Date.now();
  const ctx     = buildContext(project);
  await markSectionProcessing(db, reportId, "MARKET", "Market Analysis", 2);

  const BASE_SYSTEM = `You are the Chief Market Intelligence Officer — an expert in strategic market analysis and competitive intelligence.
Write in detail, with data, metrics, and concrete examples. Respond ONLY through the submit_content tool.
Project context:\n${ctx}`;

  const subSections = [
    {
      name:   "Market Size & Structure: TAM / SAM / SOM",
      prompt: `Conduct a detailed market analysis for "${project.name}" in the "${project.industry}" industry.
Calculate TAM (Total Addressable Market), SAM (Serviceable Addressable Market), SOM (Serviceable Obtainable Market).
Use bottom-up and top-down methodologies. Describe growth dynamics (CAGR), market structure, and key segments.
Length: 3-4 pages.`,
    },
    {
      name:   "Competitive Landscape & Positioning Analysis",
      prompt: `Conduct a deep competitive analysis for "${project.name}".
Include: a competitor map (direct, indirect, substitutes); a SWOT for 3-5 key players;
a positioning matrix across 2 key axes; entry barriers; the project's competitive advantages;
white space opportunities. Comparison tables. Length: 4-5 pages.`,
    },
    {
      name:   "Customer Segmentation & Ideal Customer Profile",
      prompt: `Develop a detailed target audience segmentation for "${project.name}".
Include: 3-4 key segments with size and potential; an ICP (Ideal Customer Profile) for B2B or B2C;
jobs-to-be-done for each segment; customer pain points and gain points; willingness to pay (WTP);
jobs personas with quotes. Length: 3-4 pages.`,
    },
    {
      name:   "Market Trends & Technology Shifts",
      prompt: `Analyze the megatrends and technology shifts affecting "${project.name}".
Include: 5-7 key trends; technology disruptors; regulatory changes; ESG factors;
geopolitical influences; the impact of AI and automation; time horizons (1/3/5 years);
opportunities and threats for the project. Length: 3-4 pages.`,
    },
  ];

  const blocks: ContentBlock[] = [];
  let   totalTokens = 0;

  for (const sub of subSections) {
    const result = await callAgent({ agentName: sub.name, system: BASE_SYSTEM, user: sub.prompt, ai, maxTokens: 8000 });
    blocks.push({ subTitle: result.subTitle, markdown: result.markdown, pageEstimate: result.pageEstimate, score: result.score });
    totalTokens += result.tokensUsed;
  }

  const sectionScore = Math.round(mean(blocks.map(b => b.score)));
  const totalPages   = blocks.reduce((s, b) => s + b.pageEstimate, 0);
  const sectionResult: SectionResult = {
    blocks, totalPages, score: sectionScore,
    agentMeta: { agent: "CMO-Market", model: "claude-sonnet-5", tokensUsed: totalTokens, durationMs: Date.now() - start },
  };

  await persistSection(db, reportId, "MARKET", "Market Analysis", sectionResult, 2);
  return sectionResult;
}

async function runMarketingTrack(
  ai: Anthropic,
  db: ReturnType<typeof getDb>,
  reportId: string,
  project: ProjectContext,
): Promise<SectionResult> {
  const start   = Date.now();
  const ctx     = buildContext(project);
  await markSectionProcessing(db, reportId, "MARKETING", "Marketing Strategy", 3);

  const BASE_SYSTEM = `You are the CMO (Chief Marketing Officer) — an expert in growth marketing and brand building.
You think in funnels, metrics, and ROI. Respond ONLY through the submit_content tool.
Project context:\n${ctx}`;

  const subSections = [
    {
      name:   "Brand Strategy, USP & Key Messaging",
      prompt: `Develop a complete brand strategy for "${project.name}".
Include: a Brand Positioning Statement; a USP (unique selling proposition) for each segment;
Brand Voice and Tone of Voice; key messaging (messaging matrix); an Elevator Pitch (30 sec / 2 min / 5 min);
tagline options; the Story of Why. Length: 3-4 pages.`,
    },
    {
      name:   "Digital Acquisition Channels & Performance Marketing",
      prompt: `Develop a detailed paid and organic acquisition strategy for "${project.name}".
For each channel (SEA/PPC, Paid Social, Display, Native): audience size; a CAC benchmark;
starting budget vs. scale budget; key metrics and KPIs; an A/B testing plan.
Prioritize channels (ICE score). Length: 3-4 pages.`,
    },
    {
      name:   "Content Marketing, SEO & Organic Growth",
      prompt: `Create a content strategy and SEO plan for "${project.name}".
Include: content pillars; a semantic core (top 20 keywords with traffic estimates);
a 3-month content plan (formats, frequency, topics); a link-building strategy;
an email marketing funnel; a social media strategy by platform. Length: 3-4 pages.`,
    },
    {
      name:   "Partnerships, Referral Program & Community",
      prompt: `Develop a partnership and viral growth strategy for "${project.name}".
Include: partnership types (strategic, channel, technology, co-marketing); top 10 target partners;
partner program terms; referral mechanics (incl. economics);
community strategy (Telegram, Discord, LinkedIn); an Ambassador Program. Length: 3-4 pages.`,
    },
    {
      name:   "Sales Funnel, CRM & Marketing KPIs",
      prompt: `Build a detailed conversion funnel and KPI system for "${project.name}".
Include: TOFU/MOFU/BOFU with specific conversion rates; CRM process and automations;
a marketing attribution model; a KPI dashboard (Awareness → Revenue);
a North Star Metric; quarterly marketing OKRs. Tables. Length: 3-4 pages.`,
    },
  ];

  const blocks: ContentBlock[] = [];
  let   totalTokens = 0;

  for (const sub of subSections) {
    const result = await callAgent({ agentName: sub.name, system: BASE_SYSTEM, user: sub.prompt, ai, maxTokens: 8000 });
    blocks.push({ subTitle: result.subTitle, markdown: result.markdown, pageEstimate: result.pageEstimate, score: result.score });
    totalTokens += result.tokensUsed;
  }

  const sectionScore = Math.round(mean(blocks.map(b => b.score)));
  const totalPages   = blocks.reduce((s, b) => s + b.pageEstimate, 0);
  const sectionResult: SectionResult = {
    blocks, totalPages, score: sectionScore,
    agentMeta: { agent: "CMO-Marketing", model: "claude-sonnet-5", tokensUsed: totalTokens, durationMs: Date.now() - start },
  };

  await persistSection(db, reportId, "MARKETING", "Marketing Strategy", sectionResult, 3);
  return sectionResult;
}

async function runOperationsTrack(
  ai: Anthropic,
  db: ReturnType<typeof getDb>,
  reportId: string,
  project: ProjectContext,
): Promise<SectionResult> {
  const start   = Date.now();
  const ctx     = buildContext(project);
  await markSectionProcessing(db, reportId, "OPERATIONS", "Operations & Technology", 4);

  const BASE_SYSTEM = `You are the COO + CTO — an expert in building scalable operating systems and technology platforms.
You think in processes, metrics, and architecture. Respond ONLY through the submit_content tool.
Project context:\n${ctx}`;

  const subSections = [
    {
      name:   "Org Structure & Hiring Plan",
      prompt: `Design an org structure for "${project.name}".
Include: an org chart (current and at 12/24/36 months); critical hiring roles by priority;
job descriptions for the top 5 positions; a compensation strategy (equity + salary);
onboarding process and culture; KPIs for each role. Length: 3-4 pages.`,
    },
    {
      name:   "Tech Stack & Platform Architecture",
      prompt: `Develop a technology strategy for "${project.name}".
Include: tech stack selection with rationale; platform architecture (monolith vs microservices);
infrastructure (cloud provider, DevOps, CI/CD); a data and analytics strategy;
security and compliance (GDPR, etc.); MVP vs. Scale architecture; a Tech Roadmap.
Length: 4-5 pages.`,
    },
    {
      name:   "Key Business Processes & Operating Model",
      prompt: `Develop a detailed operating model for "${project.name}".
Include: a key process map (value stream mapping); customer acquisition and service processes;
a supply chain or service delivery process; operational KPIs and SLAs;
automation and tooling (with ROI estimates); a Quality Management System. Length: 3-4 pages.`,
    },
    {
      name:   "Operational KPIs, OKRs & Management System",
      prompt: `Create a performance management system for "${project.name}".
Include: a Balanced Scorecard (Financial / Customer / Process / Learning);
quarterly OKRs for each function; an Operational Dashboard (what to measure daily/weekly/monthly);
a meeting cadence and decision-making framework; operational efficiency risks.
KPI tables. Length: 3-4 pages.`,
    },
  ];

  const blocks: ContentBlock[] = [];
  let   totalTokens = 0;

  for (const sub of subSections) {
    const result = await callAgent({ agentName: sub.name, system: BASE_SYSTEM, user: sub.prompt, ai, maxTokens: 8000 });
    blocks.push({ subTitle: result.subTitle, markdown: result.markdown, pageEstimate: result.pageEstimate, score: result.score });
    totalTokens += result.tokensUsed;
  }

  const sectionScore = Math.round(mean(blocks.map(b => b.score)));
  const totalPages   = blocks.reduce((s, b) => s + b.pageEstimate, 0);
  const sectionResult: SectionResult = {
    blocks, totalPages, score: sectionScore,
    agentMeta: { agent: "COO+CTO", model: "claude-sonnet-5", tokensUsed: totalTokens, durationMs: Date.now() - start },
  };

  await persistSection(db, reportId, "OPERATIONS", "Operations & Technology", sectionResult, 4);
  return sectionResult;
}

async function runRisksTrack(
  ai: Anthropic,
  db: ReturnType<typeof getDb>,
  reportId: string,
  project: ProjectContext,
): Promise<SectionResult> {
  const start   = Date.now();
  const ctx     = buildContext(project);
  await markSectionProcessing(db, reportId, "RISKS", "Risk Analysis", 5);

  const BASE_SYSTEM = `You are the CRO (Chief Risk Officer) + legal advisor — an expert in risk management and compliance.
Be honest and rigorous. Don\'t hide problems. Respond ONLY through the submit_content tool.
Project context:\n${ctx}`;

  const subSections = [
    {
      name:   "Strategic & Market Risks",
      prompt: `Conduct a strategic risk analysis for "${project.name}".
Include: risk of misjudging the market (PMF); competitive threats; technology obsolescence;
dependency on key partners or customers; pivot risks; "black swan" scenarios.
A probability × impact matrix. Length: 3-4 pages.`,
    },
    {
      name:   "Financial & Regulatory Risks",
      prompt: `Analyze the financial and legal risks for "${project.name}".
Include: risk of running out of funding; currency and interest rate risks;
regulatory requirements in the "${project.industry}" industry (licenses, GDPR, antitrust, etc.);
tax risks; IP and patent risks; litigation risks; insurance.
Length: 3-4 pages.`,
    },
    {
      name:   "Operational & Technology Risks",
      prompt: `Assess the operational and technical risks for "${project.name}".
Include: key-man risk; cybersecurity and data breach risk;
infrastructure reliability (SLA, RPO/RTO); process failures; vendor lock-in;
technical debt; scaling under load. Length: 3-4 pages.`,
    },
    {
      name:   "Risk Matrix & Mitigation Plan",
      prompt: `Create a complete risk matrix with a mitigation plan for "${project.name}".
Include: the top 15 risks scored (probability 1-5 × impact 1-5 = risk score);
for each risk: owner, review date, strategy (avoid/reduce/transfer/accept), concrete actions;
a Risk Appetite Statement; key Risk Indicators (KRI). Table. Length: 4-5 pages.`,
    },
    {
      name:   "Crisis Plan & Antifragility",
      prompt: `Develop a Crisis Management Plan and antifragility strategy for "${project.name}".
Include: a playbook for the top 5 crisis scenarios (loss of a key customer, data breach, regulatory ban, etc.);
a crisis communication strategy; a Business Continuity Plan; backup funding plans;
how to build antifragility through diversification. Length: 3-4 pages.`,
    },
  ];

  const blocks: ContentBlock[] = [];
  let   totalTokens = 0;

  for (const sub of subSections) {
    const result = await callAgent({ agentName: sub.name, system: BASE_SYSTEM, user: sub.prompt, ai, maxTokens: 8000 });
    blocks.push({ subTitle: result.subTitle, markdown: result.markdown, pageEstimate: result.pageEstimate, score: result.score });
    totalTokens += result.tokensUsed;
  }

  // For risks, lower is better — invert the score for overall quality
  const avgRiskScore = mean(blocks.map(b => b.score));
  const sectionScore = Math.round(avgRiskScore); // Reuse score as "completeness of risk analysis"
  const totalPages   = blocks.reduce((s, b) => s + b.pageEstimate, 0);
  const sectionResult: SectionResult = {
    blocks, totalPages, score: sectionScore,
    agentMeta: { agent: "CRO", model: "claude-sonnet-5", tokensUsed: totalTokens, durationMs: Date.now() - start },
  };

  await persistSection(db, reportId, "RISKS", "Risk Analysis", sectionResult, 5);
  return sectionResult;
}

async function runRoadmapTrack(
  ai: Anthropic,
  db: ReturnType<typeof getDb>,
  reportId: string,
  project: ProjectContext,
): Promise<SectionResult> {
  const start   = Date.now();
  const ctx     = buildContext(project);
  await markSectionProcessing(db, reportId, "ROADMAP", "Strategic Roadmap", 6);

  const BASE_SYSTEM = `You are the Chief Strategy Officer — an expert in strategic planning and execution.
You turn ambitions into concrete plans with dates, owners, and metrics. Respond ONLY through the submit_content tool.
Project context:\n${ctx}`;

  const subSections = [
    {
      name:   "90-Day Launch Plan (Sprint Zero)",
      prompt: `Develop a detailed 90-day launch plan for "${project.name}".
Break it into 3 sprints of 30 days each. For each day/week: specific tasks, an owner, readiness criteria.
Include: hiring, product, sales, marketing, finance, legal.
Identify the critical path and dependencies. Length: 4-5 pages.`,
    },
    {
      name:   "Year 1: Quarterly Milestones & OKRs",
      prompt: `Create a detailed Year 1 plan for "${project.name}" with quarterly OKRs.
For Q1/Q2/Q3/Q4: Objectives (3-4) and Key Results (3-4 per objective) with target figures;
key milestones each quarter; budget; headcount; product releases.
A status-tracking table. Length: 4-5 pages.`,
    },
    {
      name:   "Year 2: Growth Phase & Scaling",
      prompt: `Develop a Year 2 growth strategy for "${project.name}".
Include: a scaling strategy (geographic / product / customer expansion);
key investments and hiring; a product roadmap; channel expansion;
revenue and customer base targets; Series A preparation (if applicable).
Length: 3-4 pages.`,
    },
    {
      name:   "Year 3: Market Dominance & Investment Options",
      prompt: `Define the long-term strategy and exit options for "${project.name}" by the end of Year 3.
Include: a market share target; M&A strategy (buying or being bought); IPO readiness;
international expansion; product portfolio diversification;
enterprise-level strategic partnerships; exit scenarios (IPO / strategic sale / PE buyout).
Length: 3-4 pages.`,
    },
    {
      name:   "Technology & Product Roadmap",
      prompt: `Create a detailed 3-year product roadmap for "${project.name}".
Break it into: Core Features (MVP); Growth Features (Q2-Q4 Y1); Platform Features (Y2); Scale Features (Y3).
For each feature: business rationale, priority (RICE score), effort, impact.
Include an API/integration roadmap and a data roadmap. Length: 4-5 pages.`,
    },
  ];

  const blocks: ContentBlock[] = [];
  let   totalTokens = 0;

  for (const sub of subSections) {
    const result = await callAgent({ agentName: sub.name, system: BASE_SYSTEM, user: sub.prompt, ai, maxTokens: 8000 });
    blocks.push({ subTitle: result.subTitle, markdown: result.markdown, pageEstimate: result.pageEstimate, score: result.score });
    totalTokens += result.tokensUsed;
  }

  const sectionScore = Math.round(mean(blocks.map(b => b.score)));
  const totalPages   = blocks.reduce((s, b) => s + b.pageEstimate, 0);
  const sectionResult: SectionResult = {
    blocks, totalPages, score: sectionScore,
    agentMeta: { agent: "CSO", model: "claude-sonnet-5", tokensUsed: totalTokens, durationMs: Date.now() - start },
  };

  await persistSection(db, reportId, "ROADMAP", "Strategic Roadmap", sectionResult, 6);
  return sectionResult;
}

async function runSummaryTrack(
  ai: Anthropic,
  db: ReturnType<typeof getDb>,
  reportId: string,
  project: ProjectContext,
  sectionResults: SectionResult[],
): Promise<SectionResult> {
  const start = Date.now();
  await markSectionProcessing(db, reportId, "SUMMARY", "Executive Summary", 0);

  const sectionsContext = sectionResults
    .map((r, i) => {
      const titles = ["Finance", "Market", "Marketing", "Operations", "Risks", "Roadmap"];
      return `## ${titles[i] ?? `Section ${i + 1}`} (score: ${r.score}/100)\n` +
        r.blocks.slice(0, 2).map(b => `### ${b.subTitle}\n${b.markdown.slice(0, 800)}...`).join("\n\n");
    })
    .join("\n\n---\n\n");

  const ctx = buildContext(project);

  const BASE_SYSTEM = `You are the CEO — a strategic leader and synthesizer. You build a final vision based on a deep analysis of every department.
You write concisely, to the point, no fluff. Respond ONLY through the submit_content tool.
Project context:\n${ctx}`;

  const subSections = [
    {
      name:   "Executive Summary & Key Takeaways",
      prompt: `Based on the full analysis of every section, write an Executive Summary for "${project.name}".
Include: a Vision Statement in one powerful sentence; key takeaways from each section (finance, market, operations, risks, roadmap);
critical success factors; the main challenges; the top 3 recommended immediate actions.
Section summary data:\n${sectionsContext.slice(0, 3000)}\nLength: 4-5 pages.`,
    },
    {
      name:   "Board-Level Strategic Recommendations",
      prompt: `As the CEO, formulate strategic recommendations for "${project.name}".
Give 7-10 concrete strategic recommendations with priority and rationale.
Include: must-dos in the first 30 days; strategic bets for the next 12 months; red lines (what NOT to do);
decisions that need to be made immediately vs. can be deferred.
Length: 3-4 pages.`,
    },
    {
      name:   "Investment Thesis & Conclusion",
      prompt: `Write the final conclusion and investment thesis for "${project.name}".
Include: why this project will win (unfair advantages); market timing; team and execution;
the financial upside for an investor; what makes this project unique;
a final call to action. An overall conclusion for the report.
Length: 2-3 pages.`,
    },
  ];

  const blocks: ContentBlock[] = [];
  let   totalTokens = 0;

  for (const sub of subSections) {
    const result = await callAgent({ agentName: sub.name, system: BASE_SYSTEM, user: sub.prompt, ai, maxTokens: 6000 });
    blocks.push({ subTitle: result.subTitle, markdown: result.markdown, pageEstimate: result.pageEstimate, score: result.score });
    totalTokens += result.tokensUsed;
  }

  const sectionScore = Math.round(mean(blocks.map(b => b.score)));
  const totalPages   = blocks.reduce((s, b) => s + b.pageEstimate, 0);
  const sectionResult: SectionResult = {
    blocks, totalPages, score: sectionScore,
    agentMeta: { agent: "CEO", model: "claude-sonnet-5", tokensUsed: totalTokens, durationMs: Date.now() - start },
  };

  await persistSection(db, reportId, "SUMMARY", "Executive Summary", sectionResult, 0);
  return sectionResult;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function startAiOrchestrator(
  reportId:  string,
  projectId: string,
  project:   ProjectContext,
): Promise<void> {
  const pipelineStart = Date.now();
  const ai  = getAi();
  const db  = getDb();

  if (process.env.NODE_ENV !== "production") console.log(`[orchestrator] Starting report ${reportId} for project "${project.name}"`);

  // ── Phase 1: Run 6 department tracks in parallel ───────────────────────────
  const [
    financeResult,
    marketResult,
    marketingResult,
    operationsResult,
    risksResult,
    roadmapResult,
  ] = await Promise.allSettled([
    runFinanceTrack(ai, db, reportId, project),
    runMarketTrack(ai, db, reportId, project),
    runMarketingTrack(ai, db, reportId, project),
    runOperationsTrack(ai, db, reportId, project),
    runRisksTrack(ai, db, reportId, project),
    runRoadmapTrack(ai, db, reportId, project),
  ]);

  // Extract successful results (failed sections get a zero-score placeholder)
  function unwrap(settled: PromiseSettledResult<SectionResult>, fallbackLabel: string): SectionResult {
    if (settled.status === "fulfilled") return settled.value;
    console.error(`[orchestrator] Section "${fallbackLabel}" failed:`, settled.reason);
    return { blocks: [], totalPages: 0, score: 0, agentMeta: { agent: fallbackLabel, model: "", tokensUsed: 0, durationMs: 0 } };
  }

  const phase1Results = [
    unwrap(financeResult,    "FINANCE"),
    unwrap(marketResult,     "MARKET"),
    unwrap(marketingResult,  "MARKETING"),
    unwrap(operationsResult, "OPERATIONS"),
    unwrap(risksResult,      "RISKS"),
    unwrap(roadmapResult,    "ROADMAP"),
  ];

  // ── Phase 2: CEO summary — synthesises across all sections ────────────────
  const summaryResult = await runSummaryTrack(ai, db, reportId, project, phase1Results).catch(err => {
    console.error("[orchestrator] Summary track failed:", err);
    return { blocks: [], totalPages: 0, score: 0, agentMeta: { agent: "CEO", model: "", tokensUsed: 0, durationMs: 0 } };
  });

  // ── Compute overall score (math mean across all 7 sections) ───────────────
  const allScores   = [...phase1Results, summaryResult].map(r => r.score).filter(s => s > 0);
  const overallScore = allScores.length ? Math.round(mean(allScores)) : 0;
  const totalPages   = [...phase1Results, summaryResult].reduce((s, r) => s + r.totalPages, 0);
  const durationMs   = Date.now() - pipelineStart;

  // ── Mark report COMPLETED ─────────────────────────────────────────────────
  const { error: updateErr } = await db
    .from("reports")
    .update({
      gen_status:    "COMPLETED",
      status:        "REVIEW",
      overall_score: overallScore,
      total_pages:   totalPages,
      summary:       summaryResult.blocks[0]?.markdown?.slice(0, 2000) ?? null,
      metadata:      JSON.stringify({
        completedAt: new Date().toISOString(),
        durationMs,
        overallScore,
        totalPages,
        sectionCount: 7,
        projectName:  project.name,
      }),
    })
    .eq("id", reportId);

  if (updateErr) {
    console.error("[orchestrator] Failed to mark report COMPLETED:", updateErr);
  }

  if (process.env.NODE_ENV !== "production") console.log(
    `[orchestrator] Report ${reportId} completed — score: ${overallScore}/100, pages: ${totalPages}, time: ${(durationMs / 1000).toFixed(1)}s`,
  );
}
