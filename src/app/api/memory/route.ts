import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchMemory, saveMemory, clearMemory } from "@/lib/memory";

// POST /api/memory — add or search memory
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: membership } = await db.from("members").select("organization_id").eq("user_id", user.id).maybeSingle();
  if (!membership) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const body = await req.json();

  if (body.action === "search") {
    const chunks = await searchMemory({ organizationId: membership.organization_id, query: body.query, topK: body.topK ?? 5 });
    return NextResponse.json({ chunks });
  }

  if (body.action === "add") {
    await saveMemory({
      organizationId: membership.organization_id,
      userId: user.id,
      conversationId: body.conversationId,
      content: body.content,
    });
    return NextResponse.json({ success: true });
  }

  if (body.action === "clear") {
    await clearMemory({ organizationId: membership.organization_id, conversationId: body.conversationId });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
