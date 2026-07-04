import { NextRequest, NextResponse } from "next/server";
import { directChat } from "@/lib/orchestrator";
import { validateBody, SendMessageSchema } from "@/lib/validators";
import { chatLimiter, getIdentifier, rateLimitResponse } from "@/lib/middleware/rate-limit";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { success: false, error: "ANTHROPIC_API_KEY is not configured. Add it to .env.local" },
      { status: 503 }
    );
  }

  // Rate limiting
  const identifier = getIdentifier(req);
  const limit = chatLimiter(identifier);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { data, error } = validateBody(SendMessageSchema, rawBody);
  if (error || !data) return NextResponse.json({ success: false, error }, { status: 422 });

  const { message, agentId, persona, history } = data;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));

      try {
        await directChat({
          message,
          agentId,
          persona,
          history,
          onToken: (token) => send({ type: "token", token }),
        });
        send({ type: "done" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        send({ type: "error", message: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-RateLimit-Remaining": String(limit.remaining),
    },
  });
}
