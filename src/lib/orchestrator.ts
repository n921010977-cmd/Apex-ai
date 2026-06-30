import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { searchMemory, saveMemory } from "@/lib/memory";
import { executeTool, TOOL_DEFINITIONS } from "@/lib/tools";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface OrchestratorOptions {
  agentId?: string;
  conversationId: string;
  organizationId: string;
  userId: string;
  message: string;
  onToken?: (token: string) => void;
  onToolCall?: (tool: string, input: unknown, result: unknown) => void;
}

export interface OrchestratorResult {
  content: string;
  tokensUsed: number;
  toolsCalled: { tool: string; input: unknown; result: unknown }[];
}

export async function runOrchestrator(opts: OrchestratorOptions): Promise<OrchestratorResult> {
  const { agentId, conversationId, organizationId, userId, message, onToken, onToolCall } = opts;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // 1. Load agent config
  let agentConfig = {
    name: "AI Assistant",
    system_prompt: "You are a helpful AI assistant for business strategy and analysis.",
    model: "claude-haiku-4-5-20251001" as string,
    temperature: 0.7,
    max_tokens: 2000,
  };

  if (agentId) {
    const { data: agent } = await db.from("agents").select("*").eq("id", agentId).maybeSingle();
    if (agent) agentConfig = { ...agentConfig, ...agent };
  }

  // 2. Load short-term memory (last 20 messages from conversation)
  const { data: recentMessages } = await db
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(20);

  const history = ((recentMessages || []) as { role: string; content: string }[]).reverse();

  // 3. Fetch long-term memory (vector search)
  let memoryContext = "";
  try {
    const chunks = await searchMemory({ organizationId, query: message, topK: 5 });
    if (chunks.length > 0) {
      memoryContext = "\n\nRELEVANT MEMORY:\n" + chunks.map((c) => `- ${c.content}`).join("\n");
    }
  } catch {}

  // 4. Build system prompt
  const systemPrompt = buildSystemPrompt({
    basePrompt: agentConfig.system_prompt,
    orgId: organizationId,
    userId,
    memoryContext,
  });

  // 5. Build messages array
  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: message },
  ];

  // 6. Call LLM with reasoning loop
  let fullContent = "";
  let tokensUsed = 0;
  const toolsCalled: OrchestratorResult["toolsCalled"] = [];
  let continueLoop = true;
  let loopMessages = [...messages];

  while (continueLoop) {
    continueLoop = false;

    if (onToken) {
      // Streaming mode
      const stream = await client.messages.stream({
        model: agentConfig.model,
        max_tokens: agentConfig.max_tokens,
        system: systemPrompt,
        messages: loopMessages,
        tools: TOOL_DEFINITIONS,
      });

      let currentToolName = "";
      let currentToolInput = "";
      let currentToolId = "";
      let isToolUse = false;

      for await (const event of stream) {
        if (event.type === "content_block_start") {
          if (event.content_block.type === "tool_use") {
            isToolUse = true;
            currentToolName = event.content_block.name;
            currentToolId = event.content_block.id;
            currentToolInput = "";
          } else {
            isToolUse = false;
          }
        }
        if (event.type === "content_block_delta") {
          if (!isToolUse && event.delta.type === "text_delta") {
            onToken(event.delta.text);
            fullContent += event.delta.text;
          }
          if (isToolUse && event.delta.type === "input_json_delta") {
            currentToolInput += event.delta.partial_json;
          }
        }
        if (event.type === "content_block_stop" && isToolUse && currentToolName) {
          let toolInput: unknown = {};
          try { toolInput = JSON.parse(currentToolInput); } catch {}
          const toolResult = await executeTool(currentToolName, toolInput as Record<string, unknown>, { organizationId, userId });
          toolsCalled.push({ tool: currentToolName, input: toolInput, result: toolResult });
          if (onToolCall) onToolCall(currentToolName, toolInput, toolResult);

          // Continue reasoning loop with tool result
          loopMessages = [
            ...loopMessages,
            { role: "assistant", content: [{ type: "tool_use" as const, id: currentToolId, name: currentToolName, input: toolInput as Record<string, unknown> }] },
            { role: "user", content: [{ type: "tool_result" as const, tool_use_id: currentToolId, content: JSON.stringify(toolResult) }] },
          ];
          continueLoop = true;
          fullContent = "";
          isToolUse = false;
          currentToolName = "";
        }
        if (event.type === "message_delta" && event.usage) {
          tokensUsed += event.usage.output_tokens ?? 0;
        }
      }
    } else {
      // Non-streaming mode
      const response = await client.messages.create({
        model: agentConfig.model,
        max_tokens: agentConfig.max_tokens,
        system: systemPrompt,
        messages: loopMessages,
        tools: TOOL_DEFINITIONS,
      });

      tokensUsed += response.usage.output_tokens;

      for (const block of response.content) {
        if (block.type === "text") {
          fullContent += block.text;
        } else if (block.type === "tool_use") {
          const toolResult = await executeTool(block.name, block.input as Record<string, unknown>, { organizationId, userId });
          toolsCalled.push({ tool: block.name, input: block.input, result: toolResult });
          if (onToolCall) onToolCall(block.name, block.input, toolResult);

          loopMessages = [
            ...loopMessages,
            { role: "assistant", content: response.content },
            { role: "user", content: [{ type: "tool_result" as const, tool_use_id: block.id, content: JSON.stringify(toolResult) }] },
          ];
          continueLoop = true;
          fullContent = "";
        }
      }
    }
  }

  // 7. Save assistant message to DB
  await db.from("messages").insert({
    conversation_id: conversationId,
    role: "assistant",
    content: fullContent,
    tokens_used: tokensUsed,
    metadata: toolsCalled.length > 0 ? { tools: toolsCalled } : {},
  });

  // 8. Save to long-term memory (async, best-effort)
  saveMemory({ organizationId, userId, conversationId, content: `User: ${message}\nAssistant: ${fullContent}` }).catch(() => {});

  // 9. Update usage stats (best-effort)
  const today = new Date().toISOString().split("T")[0];
  db.from("usage_stats").upsert({
    organization_id: organizationId,
    date: today,
    messages_count: 1,
    tokens_used: tokensUsed,
    agent_runs: 1,
    tool_calls: toolsCalled.length,
  }, { onConflict: "organization_id,date" }).then(() => {}).catch(() => {});

  return { content: fullContent, tokensUsed, toolsCalled };
}

function buildSystemPrompt({ basePrompt, orgId, userId, memoryContext }: {
  basePrompt: string;
  orgId: string;
  userId: string;
  memoryContext: string;
}): string {
  return `${basePrompt}

CONTEXT:
- Organization ID: ${orgId}
- User ID: ${userId}
- Current date: ${new Date().toLocaleDateString("ru-RU")}
${memoryContext}

INSTRUCTIONS:
- Always respond in the same language as the user
- Be specific, data-driven, and actionable
- When using tools, explain what you're doing
- Format responses with markdown when helpful`;
}
