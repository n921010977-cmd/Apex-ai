import { anthropic } from "./anthropic.js";
import type { AgentDef } from "./agents.js";

export interface ChatTurn { role: "user" | "assistant"; content: string; }

export interface StreamResult { text: string; inputTokens: number; outputTokens: number; }

// Streams a reply from Claude. Telegram has no token stream, so the caller edits
// one message as `onUpdate` fires (throttled). Returns the final text + usage.
export async function streamAgentReply(opts: {
  agent: AgentDef;
  model: string;
  history: ChatTurn[];
  userMessage: string;
  onUpdate?: (partial: string) => void;
  signal?: AbortSignal;
}): Promise<StreamResult> {
  const messages = [
    ...opts.history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: opts.userMessage },
  ];

  const stream = anthropic().messages.stream(
    {
      model: opts.model,
      max_tokens: 1500,
      system: opts.agent.system,
      messages,
    },
    { signal: opts.signal },
  );

  let text = "";
  stream.on("text", (delta) => {
    text += delta;
    opts.onUpdate?.(text);
  });

  const final = await stream.finalMessage();
  return {
    text: text || extractText(final),
    inputTokens: final.usage?.input_tokens ?? 0,
    outputTokens: final.usage?.output_tokens ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractText(msg: any): string {
  try {
    return (msg.content ?? [])
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("");
  } catch {
    return "";
  }
}
