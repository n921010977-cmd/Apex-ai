import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runOrchestrator } from "@/lib/orchestrator";

export const maxDuration = 120;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: agentId } = await params;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, conversationId } = await req.json();
  if (!message || !conversationId) return NextResponse.json({ error: "message and conversationId required" }, { status: 400 });

  // Get org
  const { data: membership } = await db.from("members").select("organization_id").eq("user_id", user.id).maybeSingle();
  if (!membership) return NextResponse.json({ error: "No organization" }, { status: 400 });

  // Save user message
  await db.from("messages").insert({ conversation_id: conversationId, role: "user", content: message, tokens_used: 0, metadata: {} });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      try {
        let fullContent = "";
        await runOrchestrator({
          agentId,
          conversationId,
          organizationId: membership.organization_id,
          userId: user.id,
          message,
          onToken: (token) => {
            fullContent += token;
            send({ type: "token", token });
          },
          onToolCall: (tool, input, result) => {
            send({ type: "tool_call", tool, input, result });
          },
        });
        send({ type: "done", content: fullContent });
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
