import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 120;

const AGENT_PROMPTS: Record<string, string> = {
  ceo: "You are a strategic CEO advisor. Help with strategic planning, business priorities, and key decisions. Be concise, visionary, and action-oriented. Respond in the user's language.",
  cfo: "You are a CFO advisor. Help with financial modeling, ROI calculations, investment decisions, and budgeting. Provide data-driven, numbers-focused insights. Respond in the user's language.",
  cmo: "You are a CMO advisor. Help with go-to-market strategy, brand development, and customer acquisition. Focus on growth and engagement metrics. Respond in the user's language.",
  coo: "You are a COO advisor. Help with operational processes, team management, product launches, and execution planning. Be systematic and practical. Respond in the user's language.",
  analyst: "You are a Business Analyst. Help with market research, competitor analysis, SWOT analysis, and customer personas. Be thorough and data-driven. Respond in the user's language.",
  general: "You are a helpful AI assistant specialized in business strategy, finance, and operations. Answer questions clearly and practically. Respond in the user's language.",
};

const DEFAULT_SYSTEM = "You are a helpful AI assistant for business strategy and analysis. Be concise and actionable. Respond in the user's language.";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });

  let body: { message: string; history?: { role: string; content: string }[]; agentId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { message, history = [], agentId } = body;
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

  const client = new Anthropic({ apiKey });
  const systemPrompt = (agentId && AGENT_PROMPTS[agentId]) ? AGENT_PROMPTS[agentId] : DEFAULT_SYSTEM;

  const messages: Anthropic.MessageParam[] = [
    ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: message },
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      try {
        const anthropicStream = await client.messages.stream({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 2000,
          system: systemPrompt,
          messages,
        });

        for await (const event of anthropicStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            send({ type: "token", token: event.delta.text });
          }
        }
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
