import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await db.from("members").select("organization_id").eq("user_id", user.id).maybeSingle();
  if (!membership) return NextResponse.json({ usage: [] });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const { data: usageStats } = await db
    .from("usage_stats")
    .select("*")
    .eq("organization_id", membership.organization_id)
    .gte("date", thirtyDaysAgo)
    .order("date", { ascending: true });

  const { data: conversations } = await db
    .from("conversations")
    .select("id", { count: "exact" })
    .eq("organization_id", membership.organization_id)
    .eq("user_id", user.id);

  const { data: messages } = await db
    .from("messages")
    .select("tokens_used")
    .in("conversation_id", (conversations ?? []).map((c: { id: string }) => c.id));

  const totalTokens = (messages ?? []).reduce((sum: number, m: { tokens_used: number }) => sum + (m.tokens_used ?? 0), 0);

  return NextResponse.json({
    usage: usageStats ?? [],
    totals: {
      conversations: conversations?.length ?? 0,
      tokens: totalTokens,
      messages: messages?.length ?? 0,
    },
  });
}
