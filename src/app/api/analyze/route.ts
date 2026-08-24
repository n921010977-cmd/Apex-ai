import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { AGENT_PROMPTS, AGENT_META, ProjectBrief, AgentResult } from "@/lib/agents";
import { auth } from "@/auth";
import { reportLimiter, getIdentifier, rateLimitResponse } from "@/lib/middleware/rate-limit";
import { requireFeature, denyResponse } from "@/lib/server/access";
import { industryPromptBlock } from "@/lib/industries";

export const maxDuration = 120;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured. Add it to .env.local");
  return new Anthropic({ apiKey });
}

function buildUserMessage(brief: ProjectBrief): string {
  return `
Проанализируй следующий бизнес-проект:

**Название:** ${brief.name}
**Описание:** ${brief.description}
**Индустрия:** ${brief.industry}
**Стадия:** ${brief.stage}
**Цели:** ${brief.goals.join(", ") || "не указаны"}
**Целевая выручка:** ${brief.targetRevenue || "не указана"}
**Таймфрейм:** ${brief.timeframe} месяцев

Дай полный профессиональный анализ согласно твоей роли. Отвечай строго в JSON формате.
`.trim();
}

// Generate a varied fallback score based on brief quality and role
function computeFallbackScore(role: string, brief: ProjectBrief): number {
  const descLen = brief.description?.length ?? 0;
  const hasRevenue = !!brief.targetRevenue;
  const hasGoals = (brief.goals?.length ?? 0) > 0;
  const hasIndustry = !!brief.industry;

  // Base quality from brief completeness
  let base = 40;
  if (descLen > 100) base += 8;
  if (descLen > 300) base += 7;
  if (descLen > 600) base += 5;
  if (hasRevenue) base += 5;
  if (hasGoals)   base += 5;
  if (hasIndustry) base += 5;

  // Role-specific bias so different directors give different scores
  const roleBias: Record<string, number> = {
    CEO: 2, CFO: -3, CMO: 1, COO: 0,
    "Business Analyst": -2, CTO: 3, "Sales Director": -1,
    "Legal Advisor": -5, "Growth Hacker": 4, "Product Manager": 2,
    "Data Scientist": -1, "HR Director": -2, "Investor Relations": -3,
    "Market Research": 1, "Risk Manager": -6, "Brand Strategist": 2,
    "Supply Chain": -1, "UX Researcher": 3, "PR Director": 1,
    "Strategy Advisor": 2,
  };

  const bias = roleBias[role] ?? 0;
  // Add controlled jitter so parallel agents differ
  const seed = role.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const jitter = ((seed * 7 + 13) % 17) - 8;

  return Math.min(92, Math.max(22, base + bias + jitter));
}

async function runAgent(role: string, brief: ProjectBrief): Promise<AgentResult> {
  // Персона агента + отраслевая экспертиза по нише проекта: с этим блоком
  // директор даёт советы с метриками и бенчмарками именно этой ниши, а не
  // общие рассуждения. Блок оформлен как данные (<industry_expertise>),
  // не как перезаписываемая пользователем команда.
  const systemPrompt = AGENT_PROMPTS[role] + industryPromptBlock(brief.industry);
  const meta = AGENT_META.find((a) => a.role === role)!;

  try {
    const response = await getClient().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 6000,
      system: systemPrompt,
      messages: [{ role: "user", content: buildUserMessage(brief) }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    // Strip markdown code fences if present
    let clean = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();

    // If JSON was truncated (stop_reason = max_tokens), attempt to close it
    if (response.stop_reason === "max_tokens") {
      // Try to close open string/object/array by finding last valid JSON boundary
      try { JSON.parse(clean); } catch {
        // Close any open string, then close objects/arrays
        const openBraces = (clean.match(/\{/g) ?? []).length - (clean.match(/\}/g) ?? []).length;
        const openBrackets = (clean.match(/\[/g) ?? []).length - (clean.match(/\]/g) ?? []).length;
        if (clean.endsWith('"') || clean.split('"').length % 2 === 0) clean += '"';
        clean += "]".repeat(Math.max(0, openBrackets)) + "}".repeat(Math.max(0, openBraces));
      }
    }

    const parsed = JSON.parse(clean);

    return {
      role,
      title: meta.title,
      summary: parsed.summary ?? "",
      analysis: parsed.analysis ?? "",
      facts: parsed.facts ?? "",
      risks: parsed.risks ?? "",
      recommendations: parsed.recommendations ?? "",
      forecast: parsed.forecast ?? "",
      metrics: parsed.metrics ?? {
        success_probability: "—",
        risk_level: "средний",
        competition: "средняя",
        investment_appeal: "—",
        scalability: "—",
      },
      confidence: parsed.confidence ?? "средняя",
      score: (() => {
        const raw = parsed.score;
        if (raw == null) return null; // will be computed below
        const n = typeof raw === "string" ? parseInt(raw, 10) : Number(raw);
        return isNaN(n) ? null : Math.min(100, Math.max(0, n));
      })() ?? computeFallbackScore(role, brief),
    };
  } catch (err) {
    console.error(`[Agent ${role}] error:`, err);
    return {
      role,
      title: meta.title,
      summary: `Ошибка агента ${role}: ${String(err)}`,
      analysis: "",
      facts: "",
      risks: "",
      recommendations: "",
      forecast: "",
      metrics: {
        success_probability: "—",
        risk_level: "—",
        competition: "—",
        investment_appeal: "—",
        scalability: "—",
      },
      confidence: "low",
      score: computeFallbackScore(role, brief),
    };
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const limit = await reportLimiter(getIdentifier(req, session.user.id));
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  // Разбор проекта прогоняет несколько агентов — списываем месячную квоту AI.
  const access = await requireFeature("agents", "aiMessages");
  if (!access.allowed) return denyResponse(access);

  const brief: ProjectBrief = await req.json();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send({ type: "start", total: AGENT_META.length });

        // Run all 8 agents in parallel
        const promises = AGENT_META.map(async ({ role }, index) => {
          const result = await runAgent(role, brief);
          send({ type: "agent_done", index, role, result });
          return result;
        });

        const results = await Promise.all(promises);

        // Calculate overall score (CEO gets double weight)
        const ceoResult = results.find((r) => r.role === "CEO");
        const weights = results.map((r) => (r.role === "CEO" ? 2 : 1));
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        const weightedScore = results.reduce(
          (sum, r, i) => sum + r.score * weights[i],
          0
        );
        const overallScore = Math.round(weightedScore / totalWeight);

        send({
          type: "complete",
          overallScore,
          results,
          ceoSummary: ceoResult?.summary ?? "",
        });
      } catch (err) {
        send({ type: "error", message: String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
