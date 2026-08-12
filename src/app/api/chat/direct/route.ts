import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { directChat } from "@/lib/orchestrator";
import { validateBody, SendMessageSchema } from "@/lib/validators";
import { chatLimiter, getIdentifier, rateLimitResponse } from "@/lib/middleware/rate-limit";
import { requireFeature, denyResponse } from "@/lib/server/access";
import { logAiRequest } from "@/lib/analytics/server";
import { geminiConfigured } from "@/lib/ai/gemini";
import { grokConfigured } from "@/lib/ai/grok";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  // Require a signed-in user first — this is a paid LLM endpoint, and anonymous
  // callers shouldn't learn anything about service configuration.
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  // Достаточно любого из провайдеров: Anthropic основной, Gemini и Grok — запасные.
  if (!process.env.ANTHROPIC_API_KEY?.trim() && !geminiConfigured() && !grokConfigured()) {
    return NextResponse.json(
      { success: false, error: "AI не настроен: задайте ANTHROPIC_API_KEY, GEMINI_API_KEY или GROK_API_KEY" },
      { status: 503 }
    );
  }

  // Rate limiting (keyed per user so one account can't exhaust a shared IP's budget)
  const identifier = getIdentifier(req, session.user.id);
  const limit = await chatLimiter(identifier);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  // Месячная квота тарифа (защита от абьюза). Гость/без тарифа — бесплатный лимит.
  // Чат доступен и без тарифа (бесплатная квота), но лимит списывается всегда.
  const access = await requireFeature(null, "aiMessages");
  if (!access.allowed) return denyResponse(access);

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { data, error } = validateBody(SendMessageSchema, rawBody);
  if (error || !data) return NextResponse.json({ success: false, error }, { status: 422 });

  const { message, agentId, persona, history, image } = data;

  const encoder = new TextEncoder();
  const userId = session.user.id;
  const t0 = Date.now();
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
          image,
          onToken: (token) => send({ type: "token", token }),
        });
        send({ type: "done" });
        void logAiRequest({ userId, feature: "chat", status: "ok", responseTimeMs: Date.now() - t0 });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        send({ type: "error", message: msg });
        void logAiRequest({ userId, feature: "chat", status: "error", responseTimeMs: Date.now() - t0, errorMessage: msg });
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
