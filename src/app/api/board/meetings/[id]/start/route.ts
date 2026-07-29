import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { reportLimiter, rateLimitResponse } from "@/lib/middleware/rate-limit";
import { enforceUsage, quotaExceededResponse } from "@/lib/middleware/usage-limit";
import { getServerPlan } from "@/lib/server/plan";
import { MODEL_HEAVY, MAX_TOKENS_HEAVY } from "@/lib/ai/model-config";

export const maxDuration = 120;

const EXECUTIVES = [
  {
    id: "ceo",
    role: "CEO",
    name: "Sophia Rivers",
    emoji: "👑",
    color: "#6366f1",
    model: MODEL_HEAVY,
    systemPrompt: `You are Sophia Rivers, CEO of the company. You are a visionary leader with 20+ years of experience.
You focus on: strategic direction, company culture, investor relations, M&A, and long-term value creation.
Risk tolerance: moderate-aggressive. Decision style: analytical yet bold.
When speaking at board meetings: be decisive, reference market dynamics, think 3-5 years ahead, balance growth with sustainability.
Keep responses concise (150-250 words). Use professional executive language.`,
  },
  {
    id: "cfo",
    role: "CFO",
    name: "Marcus Chen",
    emoji: "💼",
    color: "#3b82f6",
    model: MODEL_HEAVY,
    systemPrompt: `You are Marcus Chen, CFO of the company. You are a disciplined financial steward.
You focus on: P&L, cash flow, unit economics, fundraising, ROI, financial risk.
Risk tolerance: conservative. Decision style: data-driven, numbers-first.
When speaking at board meetings: cite financial metrics, stress-test assumptions, highlight cash runway, calculate ROI.
Keep responses concise (150-250 words). Always anchor opinions in financial data.`,
  },
  {
    id: "coo",
    role: "COO",
    name: "James Wright",
    emoji: "⚙️",
    color: "#f59e0b",
    model: MODEL_HEAVY,
    systemPrompt: `You are James Wright, COO of the company. You are an operations excellence expert.
You focus on: process optimization, KPIs, team scaling, OKRs, supply chain, execution velocity.
Risk tolerance: moderate. Decision style: process-oriented, systematic.
When speaking at board meetings: focus on execution feasibility, resource requirements, operational risks, timeline realism.
Keep responses concise (150-250 words). Ground everything in operational reality.`,
  },
  {
    id: "cmo",
    role: "CMO",
    name: "Elena Torres",
    emoji: "📣",
    color: "#10b981",
    model: MODEL_HEAVY,
    systemPrompt: `You are Elena Torres, CMO of the company. You are a growth-obsessed marketing innovator.
You focus on: brand strategy, growth marketing, customer acquisition, retention, community, content.
Risk tolerance: moderate-aggressive. Decision style: creative-analytical.
When speaking at board meetings: bring market perspective, customer voice, brand implications, growth opportunities.
Keep responses concise (150-250 words). Balance creativity with measurable outcomes.`,
  },
  {
    id: "cto",
    role: "CTO",
    name: "Aiden Park",
    emoji: "🔬",
    color: "#a855f7",
    model: MODEL_HEAVY,
    systemPrompt: `You are Aiden Park, CTO of the company. You are a technical visionary and engineering leader.
You focus on: technology strategy, architecture, AI/ML, security, DevOps, R&D, technical debt.
Risk tolerance: moderate. Decision style: technical, pragmatic.
When speaking at board meetings: assess technical feasibility, highlight tech risks, identify build vs buy decisions, consider scalability.
Keep responses concise (150-250 words). Translate technical complexity into business impact.`,
  },
];

interface AgendaItem {
  title: string;
  description?: string;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  // Самый дорогой вызов в продукте: одно заседание — это прогон всего совета
  // директоров. Без квоты один аккаунт в цикле сжигает бюджет на токены.
  const limit = await reportLimiter(`board-start:${session.user.id}`);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  const plan = await getServerPlan();
  const quota = await enforceUsage(session.user.id, plan, "boardMeetings");
  if (!quota.allowed) return quotaExceededResponse("boardMeetings", quota);

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: meeting, error: fetchErr } = await db
    .from("board_meetings")
    .select("*")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (fetchErr || !meeting) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (meeting.status === "running") return NextResponse.json({ success: false, error: "Meeting already running" }, { status: 409 });
  if (meeting.status === "completed") return NextResponse.json({ success: false, error: "Meeting already completed" }, { status: 409 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ success: false, error: "AI not configured" }, { status: 503 });

  await db.from("board_meetings").update({ status: "running" }).eq("id", id);

  const client = new Anthropic({ apiKey });
  const agenda: AgendaItem[] = Array.isArray(meeting.agenda) ? meeting.agenda : [];
  const context = meeting.context ?? {};

  const agendaText = agenda.length > 0
    ? agenda.map((item: AgendaItem, i: number) => `${i + 1}. ${item.title}${item.description ? `: ${item.description}` : ""}`).join("\n")
    : "General business review and strategic planning";

  const contextText = Object.keys(context).length > 0
    ? Object.entries(context).map(([k, v]) => `${k}: ${v}`).join("\n")
    : "No additional context provided";

  const userPrompt = `Board Meeting: "${meeting.title}"

Agenda:
${agendaText}

Business Context:
${contextText}

Please provide your perspective on the agenda items as a C-suite executive. Address the key issues, offer your department's viewpoint, and make specific recommendations. Consider risks and opportunities relevant to your role.`;

  let totalTokens = 0;

  try {
    // Round 1: All executives speak in parallel
    const round1Results = await Promise.allSettled(
      EXECUTIVES.map(async (exec) => {
        const response = await client.messages.create({
          model: exec.model,
          max_tokens: Math.min(600, MAX_TOKENS_HEAVY),
          temperature: 0.7,
          system: exec.systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        });
        const content = response.content.filter(b => b.type === "text").map(b => (b as { type: "text"; text: string }).text).join("");
        const tokens = (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0);
        return { exec, content, tokens };
      })
    );

    const round1Speeches: { exec: typeof EXECUTIVES[0]; content: string; tokens: number }[] = [];
    for (const result of round1Results) {
      if (result.status === "fulfilled") {
        round1Speeches.push(result.value);
        totalTokens += result.value.tokens;
      }
    }

    // Insert round 1 speeches
    if (round1Speeches.length > 0) {
      await db.from("board_speeches").insert(
        round1Speeches.map(({ exec, content, tokens }) => ({
          meeting_id: id,
          executive: exec.role,
          round: 1,
          content,
          tokens_used: tokens,
        }))
      );
    }

    // Round 2: Deliberation — each exec responds to others
    const round1Summary = round1Speeches
      .map(({ exec, content }) => `**${exec.role} (${exec.name}):** ${content}`)
      .join("\n\n---\n\n");

    const deliberationPrompt = `${userPrompt}

---

Your colleagues have shared their initial perspectives:

${round1Summary}

---

Now provide your deliberation response: address any disagreements, build on areas of alignment, and sharpen your recommendations based on what your colleagues said. Be direct and decisive.`;

    const round2Results = await Promise.allSettled(
      EXECUTIVES.map(async (exec) => {
        const response = await client.messages.create({
          model: exec.model,
          max_tokens: Math.min(400, MAX_TOKENS_HEAVY),
          temperature: 0.6,
          system: exec.systemPrompt,
          messages: [{ role: "user", content: deliberationPrompt }],
        });
        const content = response.content.filter(b => b.type === "text").map(b => (b as { type: "text"; text: string }).text).join("");
        const tokens = (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0);
        return { exec, content, tokens };
      })
    );

    const round2Speeches: { exec: typeof EXECUTIVES[0]; content: string; tokens: number }[] = [];
    for (const result of round2Results) {
      if (result.status === "fulfilled") {
        round2Speeches.push(result.value);
        totalTokens += result.value.tokens;
      }
    }

    if (round2Speeches.length > 0) {
      await db.from("board_speeches").insert(
        round2Speeches.map(({ exec, content, tokens }) => ({
          meeting_id: id,
          executive: exec.role,
          round: 2,
          content,
          tokens_used: tokens,
        }))
      );
    }

    // Voting phase: each exec votes
    const allSpeeches = [...round1Speeches, ...round2Speeches];
    const fullDiscussion = allSpeeches
      .map(({ exec, content }) => `**${exec.role}:** ${content}`)
      .join("\n\n");

    const votePrompt = `Based on the full board discussion below, cast your vote on whether to proceed with the proposed agenda items.

Discussion:
${fullDiscussion}

Respond in JSON format only:
{
  "vote": "approve" | "reject" | "abstain",
  "confidence": <integer 1-100>,
  "rationale": "<one or two sentences explaining your vote>"
}`;

    const voteResults = await Promise.allSettled(
      EXECUTIVES.map(async (exec) => {
        const response = await client.messages.create({
          model: exec.model,
          max_tokens: 200,
          temperature: 0.3,
          system: exec.systemPrompt,
          messages: [{ role: "user", content: votePrompt }],
        });
        const raw = response.content.filter(b => b.type === "text").map(b => (b as { type: "text"; text: string }).text).join("");
        const tokens = (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0);

        let parsed: { vote: string; confidence: number; rationale: string };
        try {
          const match = raw.match(/\{[\s\S]*\}/);
          parsed = JSON.parse(match ? match[0] : raw);
        } catch {
          parsed = { vote: "abstain", confidence: 50, rationale: "Unable to reach a clear position." };
        }
        return { exec, parsed, tokens };
      })
    );

    const votes: { executive: string; vote: string; confidence: number; rationale: string }[] = [];
    for (const result of voteResults) {
      if (result.status === "fulfilled") {
        const { exec, parsed, tokens } = result.value;
        totalTokens += tokens;
        votes.push({
          executive: exec.role,
          vote: parsed.vote ?? "abstain",
          confidence: parsed.confidence ?? 50,
          rationale: parsed.rationale ?? "",
        });
      }
    }

    if (votes.length > 0) {
      await db.from("board_votes").insert(
        votes.map(v => ({ meeting_id: id, ...v }))
      );
    }

    // Tally votes and generate decision
    const votesFor = votes.filter(v => v.vote === "approve").length;
    const votesAgainst = votes.filter(v => v.vote === "reject").length;
    const abstentions = votes.filter(v => v.vote === "abstain").length;
    const verdict = votesFor > votesAgainst ? "approved" : votesFor < votesAgainst ? "rejected" : "deferred";

    // CEO synthesizes the final decision
    const ceoExec = EXECUTIVES[0];
    const decisionPrompt = `As CEO, synthesize this board meeting into a final decision summary.

Meeting: "${meeting.title}"
Vote result: ${votesFor} approve, ${votesAgainst} reject, ${abstentions} abstain → ${verdict.toUpperCase()}

Full discussion:
${fullDiscussion}

Respond in JSON:
{
  "summary": "<2-3 sentence executive summary of the decision and rationale>",
  "action_items": ["<specific action item 1>", "<specific action item 2>", "<specific action item 3>"]
}`;

    const decisionResponse = await client.messages.create({
      model: ceoExec.model,
      max_tokens: Math.min(400, MAX_TOKENS_HEAVY),
      temperature: 0.4,
      system: ceoExec.systemPrompt,
      messages: [{ role: "user", content: decisionPrompt }],
    });

    const decisionRaw = decisionResponse.content
      .filter(b => b.type === "text")
      .map(b => (b as { type: "text"; text: string }).text)
      .join("");
    totalTokens += (decisionResponse.usage.input_tokens ?? 0) + (decisionResponse.usage.output_tokens ?? 0);

    let decisionParsed: { summary: string; action_items: string[] };
    try {
      const match = decisionRaw.match(/\{[\s\S]*\}/);
      decisionParsed = JSON.parse(match ? match[0] : decisionRaw);
    } catch {
      decisionParsed = {
        summary: `Board voted ${verdict} on "${meeting.title}" with ${votesFor} approvals, ${votesAgainst} rejections, ${abstentions} abstentions.`,
        action_items: [],
      };
    }

    await db.from("board_decisions").insert({
      meeting_id: id,
      verdict,
      votes_for: votesFor,
      votes_against: votesAgainst,
      abstentions,
      summary: decisionParsed.summary ?? "",
      action_items: decisionParsed.action_items ?? [],
    });

    await db.from("board_meetings").update({
      status: "completed",
      summary: decisionParsed.summary,
      ai_tokens: totalTokens,
      completed_at: new Date().toISOString(),
    }).eq("id", id);

    // Fetch full result
    const [{ data: finalSpeeches }, { data: finalVotes }, { data: finalDecisions }] = await Promise.all([
      db.from("board_speeches").select("*").eq("meeting_id", id).order("created_at"),
      db.from("board_votes").select("*").eq("meeting_id", id),
      db.from("board_decisions").select("*").eq("meeting_id", id),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        verdict,
        votes_for: votesFor,
        votes_against: votesAgainst,
        abstentions,
        summary: decisionParsed.summary,
        action_items: decisionParsed.action_items,
        speeches: finalSpeeches ?? [],
        votes: finalVotes ?? [],
        decisions: finalDecisions ?? [],
        tokens_used: totalTokens,
      },
    });
  } catch (err) {
    await db.from("board_meetings").update({ status: "failed" }).eq("id", id);
    const msg = err instanceof Error ? err.message : "AI error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
