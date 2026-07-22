import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify the conversation belongs to the caller before returning its messages
  // — otherwise any authed user could read any conversation by id (IDOR).
  const { data: convo } = await db
    .from("conversations").select("id").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await db
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  return NextResponse.json({ messages: data });
}
