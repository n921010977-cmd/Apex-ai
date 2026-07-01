import { NextRequest, NextResponse } from "next/server";
import { orchestrate } from "@/lib/orchestrator";
import { validateBody, SendMessageSchema } from "@/lib/validators";
import { chatLimiter, getIdentifier, rateLimitResponse } from "@/lib/middleware/rate-limit";
import type { StreamEvent } from "@/types";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { success: false, error: "ANTHROPIC_API_KEY is not configured. Add it to .env.local" },
      { status: 503 }
    );
  }

  const identifier = getIdentifier(req);
  const limit = chatLimiter(identifier);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  let rawBody: unknown;
  try { rawBody = await req.json(); } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { data, error } = validateBody(SendMessageSchema, rawBody);
  if (error || !data) return NextResponse.json({ success: false, error }, { status: 422 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));

      try {
        await orchestrate(
          { message: data.message, agentId: data.agentId, userId: "anonymous" },
          {
            onEvent: (evt: StreamEvent) => {
              send(evt);
            },
          }
        );
      } catch (err) {
        send({ type: "error", message: err instanceof Error ? err.message : String(err) });
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
    },
  });
}
