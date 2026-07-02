import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "30d";

  const periodDays: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
  const days = periodDays[period] ?? 30;
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const userId = session.user.id!;

  const [
    messagesRes,
    strategiesRes,
    risksRes,
    meetingsRes,
    decisionsRes,
    notesRes,
    ticketsRes,
  ] = await Promise.allSettled([
    db.from("messages").select("id, tokens_used, created_at").eq("user_id", userId).gte("created_at", since).order("created_at"),
    db.from("strategies").select("id, status, ai_tokens, created_at, updated_at").eq("user_id", userId).gte("created_at", since),
    db.from("risks").select("id, status, category, probability, impact, created_at").eq("user_id", userId),
    db.from("board_meetings").select("id, status, ai_tokens, created_at, completed_at").eq("user_id", userId).gte("created_at", since),
    db.from("board_decisions").select("id, verdict, created_at").gte("created_at", since),
    db.from("notes").select("id, word_count, created_at").eq("user_id", userId).eq("is_deleted", false).gte("created_at", since),
    db.from("support_tickets").select("id, status, category, created_at").eq("user_id", userId).gte("created_at", since),
  ]);

  const safe = <T>(r: PromiseSettledResult<{ data: T[] | null }>): T[] =>
    r.status === "fulfilled" ? r.value.data ?? [] : [];

  const messages = safe<{ id: string; tokens_used: number; created_at: string }>(messagesRes as PromiseSettledResult<{ data: { id: string; tokens_used: number; created_at: string }[] | null }>);
  const strategies = safe<{ id: string; status: string; ai_tokens: number; created_at: string; updated_at: string }>(strategiesRes as PromiseSettledResult<{ data: { id: string; status: string; ai_tokens: number; created_at: string; updated_at: string }[] | null }>);
  const risks = safe<{ id: string; status: string; category: string; probability: number; impact: number; created_at: string }>(risksRes as PromiseSettledResult<{ data: { id: string; status: string; category: string; probability: number; impact: number; created_at: string }[] | null }>);
  const meetings = safe<{ id: string; status: string; ai_tokens: number; created_at: string; completed_at: string }>(meetingsRes as PromiseSettledResult<{ data: { id: string; status: string; ai_tokens: number; created_at: string; completed_at: string }[] | null }>);
  const decisions = safe<{ id: string; verdict: string; created_at: string }>(decisionsRes as PromiseSettledResult<{ data: { id: string; verdict: string; created_at: string }[] | null }>);
  const notes = safe<{ id: string; word_count: number; created_at: string }>(notesRes as PromiseSettledResult<{ data: { id: string; word_count: number; created_at: string }[] | null }>);
  const tickets = safe<{ id: string; status: string; category: string; created_at: string }>(ticketsRes as PromiseSettledResult<{ data: { id: string; status: string; category: string; created_at: string }[] | null }>);

  // Build daily buckets for time-series
  const buckets: Record<string, { date: string; messages: number; tokens: number; strategies: number }> = {};
  const makeKey = (iso: string) => iso.slice(0, 10);

  for (let d = 0; d < days; d++) {
    const date = makeKey(new Date(Date.now() - d * 86400000).toISOString());
    buckets[date] = { date, messages: 0, tokens: 0, strategies: 0 };
  }

  for (const m of messages) {
    const k = makeKey(m.created_at);
    if (buckets[k]) { buckets[k].messages++; buckets[k].tokens += m.tokens_used ?? 0; }
  }
  for (const s of strategies) {
    const k = makeKey(s.created_at);
    if (buckets[k]) buckets[k].strategies++;
  }

  const timeSeries = Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date));

  // Risk heatmap: category × severity
  const risksByCategory: Record<string, { active: number; total: number; avg_score: number }> = {};
  for (const r of risks) {
    if (!risksByCategory[r.category]) risksByCategory[r.category] = { active: 0, total: 0, avg_score: 0 };
    risksByCategory[r.category].total++;
    if (r.status === "active") risksByCategory[r.category].active++;
    risksByCategory[r.category].avg_score += r.probability * r.impact;
  }
  for (const cat of Object.values(risksByCategory)) {
    if (cat.total > 0) cat.avg_score = Math.round(cat.avg_score / cat.total);
  }

  const totalTokens = messages.reduce((s, m) => s + (m.tokens_used ?? 0), 0) +
    strategies.reduce((s, st) => s + (st.ai_tokens ?? 0), 0) +
    meetings.reduce((s, mt) => s + (mt.ai_tokens ?? 0), 0);

  return NextResponse.json({
    success: true,
    data: {
      period,
      summary: {
        ai_messages: messages.length,
        total_tokens: totalTokens,
        strategies_generated: strategies.filter(s => s.status === "generated" || s.status === "published").length,
        board_meetings: meetings.filter(m => m.status === "completed").length,
        decisions_made: decisions.length,
        decisions_approved: decisions.filter(d => d.verdict === "approved").length,
        notes_created: notes.length,
        words_written: notes.reduce((s, n) => s + (n.word_count ?? 0), 0),
        active_risks: risks.filter(r => r.status === "active").length,
        critical_risks: risks.filter(r => r.probability * r.impact >= 16).length,
        support_tickets: tickets.length,
      },
      time_series: timeSeries,
      risks_by_category: risksByCategory,
      decisions: {
        approved: decisions.filter(d => d.verdict === "approved").length,
        rejected: decisions.filter(d => d.verdict === "rejected").length,
        deferred: decisions.filter(d => d.verdict === "deferred").length,
      },
      tickets_by_category: tickets.reduce((acc: Record<string, number>, t) => {
        acc[t.category] = (acc[t.category] ?? 0) + 1;
        return acc;
      }, {}),
    },
  });
}
