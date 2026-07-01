import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { AGENT_PROMPTS, AGENT_META, ProjectBrief, AgentResult } from "@/lib/agents";

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

async function runAgent(role: string, brief: ProjectBrief): Promise<AgentResult> {
  const systemPrompt = AGENT_PROMPTS[role];
  const meta = AGENT_META.find((a) => a.role === role)!;

  try {
    const response = await getClient().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: buildUserMessage(brief) }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    // Strip markdown code fences if present
    const clean = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
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
      score: Math.min(100, Math.max(0, Number(parsed.score) || 75)),
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
      confidence: "низкая",
      score: 70,
    };
  }
}

export async function POST(req: NextRequest) {
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
