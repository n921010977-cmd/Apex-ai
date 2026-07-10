import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runConversation } from "@/lib/orchestrator";

export const maxDuration = 120;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await params;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

  // Verify conversation belongs to user + get org/agent
  const { data: convo } = await db.from("conversations").select("*").eq("id", conversationId).eq("user_id", user.id).maybeSingle();
  if (!convo) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  // Save user message immediately
  await db.from("messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: message,
    tokens_used: 0,
    metadata: {},
  });

  // Update conversation title if first message
  const { count } = await db.from("messages").select("id", { count: "exact" }).eq("conversation_id", conversationId);
  if ((count ?? 0) <= 1) {
    const title = message.length > 50 ? message.slice(0, 47) + "..." : message;
    await db.from("conversations").update({ title, updated_at: new Date().toISOString() }).eq("id", conversationId);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      try {
        await runConversation({
          agentId: convo.agent_id ?? undefined,
          conversationId,
          organizationId: convo.organization_id,
          userId: user.id,
          message,
          onToken: (token) => send({ type: "token", token }),
          onToolCall: (tool, input, result) => send({ type: "tool_call", tool, input, result }),
        });
        send({ type: "done" });
      } catch (err) {
        send({ type: "error", message: String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
