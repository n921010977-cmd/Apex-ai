import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 50);

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Return user's generated growth analyses stored in strategies with tag "growth"
  const { data, error } = await db
    .from("strategies")
    .select("id, title, status, tags, created_at, updated_at, ai_tokens")
    .eq("user_id", session.user.id)
    .contains("tags", ["growth"])
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  let body: {
    company?: string;
    industry?: string;
    market?: string;
    stage?: string;
    revenue?: string;
    competitors?: string[];
    goals?: string;
  };
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.company?.trim() || !body.industry?.trim()) {
    return NextResponse.json({ success: false, error: "company and industry are required" }, { status: 422 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ success: false, error: "AI not configured" }, { status: 503 });

  const client = new Anthropic({ apiKey });

  const prompt = `You are a top-tier growth strategy consultant (ex-McKinsey, ex-BCG).

Analyze growth opportunities for:
Company: ${body.company}
Industry: ${body.industry}
Market: ${body.market ?? "Not specified"}
Stage: ${body.stage ?? "Not specified"}
Current Revenue: ${body.revenue ?? "Not disclosed"}
Key Competitors: ${body.competitors?.join(", ") ?? "Not specified"}
Growth Goals: ${body.goals ?? "Not specified"}

Respond in JSON with this exact structure:
{
  "tam": {
    "size": "<Total Addressable Market size with $ figure>",
    "sam": "<Serviceable Addressable Market>",
    "som": "<Serviceable Obtainable Market>",
    "growth_rate": "<Market CAGR %>"
  },
  "swot": {
    "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
    "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
    "opportunities": ["<opportunity 1>", "<opportunity 2>", "<opportunity 3>"],
    "threats": ["<threat 1>", "<threat 2>", "<threat 3>"]
  },
  "competitors": [
    {"name": "<name>", "strength": "high|medium|low", "differentiation": "<key differentiator>", "market_share": "<% or range>"}
  ],
  "growth_channels": [
    {"channel": "<channel name>", "potential": "high|medium|low", "cost": "high|medium|low", "timeline": "<weeks/months>", "strategy": "<1-2 sentence strategy>"}
  ],
  "recommendations": [
    {"priority": 1, "action": "<action title>", "impact": "<expected impact>", "timeline": "<timeframe>", "investment": "<$ range or team size>"}
  ],
  "north_star_metric": "<single most important growth metric to track>",
  "summary": "<2-3 sentence executive summary of growth opportunity>"
}

Be specific with numbers and timeframes. JSON only, no explanation.`;

  let rawJson = "";
  let tokensUsed = 0;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 3000,
      temperature: 0.5,
      messages: [{ role: "user", content: prompt }],
    });
    rawJson = response.content.filter(b => b.type === "text").map(b => (b as { type: "text"; text: string }).text).join("");
    tokensUsed = (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }

  let parsed: Record<string, unknown>;
  try {
    const match = rawJson.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(match ? match[0] : rawJson);
  } catch {
    return NextResponse.json({ success: false, error: "AI returned invalid JSON" }, { status: 500 });
  }

  // Store as a strategy with growth tag for history
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: strategyRow } = await db.from("strategies").insert({
    user_id: session.user.id,
    title: `Growth Analysis: ${body.company}`,
    status: "generated",
    tags: ["growth", body.industry.toLowerCase()],
    questionnaire: body,
    ai_model: "claude-sonnet-5",
    ai_tokens: tokensUsed,
  }).select().single();

  if (strategyRow) {
    const sectionKeys = ["tam", "swot", "competitors", "growth_channels", "recommendations"];
    const sectionTitles: Record<string, string> = {
      tam: "Market Analysis (TAM/SAM/SOM)",
      swot: "SWOT Analysis",
      competitors: "Competitive Landscape",
      growth_channels: "Growth Channels",
      recommendations: "Strategic Recommendations",
    };

    await db.from("strategy_sections").insert(
      sectionKeys.map((key, i) => ({
        strategy_id: strategyRow.id,
        section_key: key,
        title: sectionTitles[key],
        content: typeof parsed[key] === "string" ? parsed[key] as string : JSON.stringify(parsed[key] ?? "", null, 2),
        data_json: typeof parsed[key] !== "string" ? parsed[key] : null,
        sort_order: i,
        updated_at: new Date().toISOString(),
      }))
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      ...parsed,
      tokens_used: tokensUsed,
      strategy_id: strategyRow?.id ?? null,
    },
  });
}
