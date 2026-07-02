import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 120;

const SECTIONS = [
  { key: "vision",    title: "Видение и миссия",         order: 0 },
  { key: "goals",     title: "Стратегические цели",      order: 1 },
  { key: "swot",      title: "SWOT-анализ",              order: 2 },
  { key: "execution", title: "План реализации",          order: 3 },
  { key: "kpis",      title: "Ключевые метрики (KPI)",   order: 4 },
  { key: "risks",     title: "Риски и митигация",        order: 5 },
];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: strategy, error: fetchErr } = await db
    .from("strategies").select("*").eq("id", id).eq("user_id", session.user.id).maybeSingle();
  if (fetchErr || !strategy) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (strategy.status === "generating") return NextResponse.json({ success: false, error: "Already generating" }, { status: 409 });

  const body = await req.json().catch(() => ({}));
  const questionnaire = body.questionnaire ?? strategy.questionnaire ?? {};
  const language = body.language ?? strategy.language ?? "ru";

  await db.from("strategies").update({ status: "generating", questionnaire }).eq("id", id);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ success: false, error: "AI not configured" }, { status: 503 });

  const client = new Anthropic({ apiKey });

  const qFormatted = Object.entries(questionnaire)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
    .join("\n");

  const prompt = `Ты — Senior Strategy Consultant уровня McKinsey. Составь полноценную бизнес-стратегию на основе следующих данных:

${qFormatted}

Язык ответа: ${language === "ru" ? "русский" : language}.

Сгенерируй стратегию строго в формате JSON со следующей структурой:
{
  "vision": "Чёткое видение и миссия компании (2-3 предложения)",
  "goals": [{"title":"...","metric":"...","target":"...","deadline":"..."}],
  "swot": {
    "strengths": ["..."],
    "weaknesses": ["..."],
    "opportunities": ["..."],
    "threats": ["..."]
  },
  "execution": [{"phase":"...","duration":"...","actions":["..."],"budget":"..."}],
  "kpis": [{"name":"...","metric":"...","baseline":"...","target":"...","frequency":"..."}],
  "risks": [{"description":"...","probability":"high|medium|low","impact":"high|medium|low","mitigation":"..."}]
}

Будь конкретным, используй реальные цифры и временные рамки. Только JSON, без пояснений.`;

  let rawJson = "";
  let tokensUsed = 0;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 4096,
      temperature: 0.5,
      messages: [{ role: "user", content: prompt }],
    });

    for (const block of response.content) {
      if (block.type === "text") rawJson += block.text;
    }
    tokensUsed = (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0);
  } catch (err) {
    await db.from("strategies").update({ status: "draft" }).eq("id", id);
    const msg = err instanceof Error ? err.message : "AI error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }

  let parsed: Record<string, unknown>;
  try {
    const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawJson);
  } catch {
    await db.from("strategies").update({ status: "draft" }).eq("id", id);
    return NextResponse.json({ success: false, error: "AI returned invalid JSON" }, { status: 500 });
  }

  await db.from("strategy_sections").delete().eq("strategy_id", id);

  const sectionInserts = SECTIONS.map((s) => ({
    strategy_id: id,
    section_key: s.key,
    title: s.title,
    content: typeof parsed[s.key] === "string"
      ? parsed[s.key] as string
      : JSON.stringify(parsed[s.key] ?? "", null, 2),
    data_json: typeof parsed[s.key] !== "string" ? parsed[s.key] : null,
    sort_order: s.order,
    updated_at: new Date().toISOString(),
  }));

  await db.from("strategy_sections").insert(sectionInserts);

  await db.from("strategies").update({
    status: "generated",
    ai_model: "claude-sonnet-5",
    ai_tokens: tokensUsed,
    updated_at: new Date().toISOString(),
  }).eq("id", id);

  const { data: sections } = await db.from("strategy_sections").select("*").eq("strategy_id", id).order("sort_order");

  return NextResponse.json({ success: true, data: { sections: sections ?? [], tokens_used: tokensUsed } });
}
