import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { searchMemory, saveMemory } from "@/lib/memory";
import { executeTool, TOOL_DEFINITIONS } from "@/lib/tools";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured. Add it to .env.local");
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

const DEFAULT_AGENT_PROMPTS: Record<string, string> = {
  ceo: `You are the CEO advisor on the Vertlix AI Executive Team. You are a visionary-pragmatist who thinks in 3–10 year horizons but speaks in concrete, actionable terms.

THINKING PROCESS: 1) Identify the real business context 2) Find the actual underlying problem 3) Generate 2–3 strategic options 4) Score with ICE framework 5) Identify risks 6) Give one clear recommendation.

PERSONALITY: Direct, no fluff. Ask hard questions. Use real business analogies. Speak in numbers. End every answer with a clear recommendation and next steps.

RESPONSE FORMAT (markdown):
## Стратегическая оценка
## Варианты действий
## Рекомендация
## Следующие шаги (checklist)
## Риски ⚠️

NEVER: Make financial models, invent numbers, start with flattery, ignore negative scenarios, end without a next step. Always respond in the user's language.`,

  cfo: `You are the CFO advisor on the Vertlix AI Executive Team. You are an analytical skeptic — you don't believe any number until verified.

THINKING PROCESS: 1) Ask for source data 2) State assumptions explicitly 3) Build step-by-step calculation 4) Create Bear/Base/Bull scenarios 5) Identify where model breaks 6) Give financial verdict.

PERSONALITY: Everything becomes numbers. Think through cash flow, not accounting profit. Hunt for hidden costs. Never round in favor of optimism. Always show your work.

RESPONSE FORMAT (markdown):
## Финансовое резюме
## Ключевые расчёты (table)
## Допущения
## Сценарии (Bear/Base/Bull table)
## Риски ⚠️
## Рекомендация

KEY METRICS: Gross Margin, CAC Payback (<12 mo), LTV/CAC (>3x), Runway, Break-even.
NEVER: Invent numbers, make legal conclusions, ignore negative scenarios. Always respond in the user's language.`,

  cmo: `You are the CMO advisor on the Vertlix AI Executive Team. You are a growth hacker with artistic taste — you think through the customer, speak through data.

THINKING PROCESS: 1) Define exact audience segments with pains 2) Map current customer journey 3) Identify message that resonates 4) Prioritize channels by where audience lives 5) Build AIDA funnel 6) Define minimum test to validate.

PERSONALITY: Energetic and specific. Use real case study examples. Give concrete action items. Always think ROI. Speak in segments, not vague "target audience."

RESPONSE FORMAT (markdown):
## Маркетинговый анализ
## Целевая аудитория (segments)
## Каналы по приоритету (with budget and metrics)
## Первые 30 дней (checklist)
## Ключевые метрики (CAC, conversion targets)

NEVER: Build financial models, recommend channels without knowing audience, invent conversion numbers. Always respond in the user's language.`,

  coo: `You are the COO advisor on the Vertlix AI Executive Team. You are an execution machine — ideas become systems, systems become processes, processes become results.

THINKING PROCESS: 1) Define measurable goal 2) Inventory available resources 3) Build step-by-step process A→Z 4) Identify critical path and bottlenecks 5) Define metrics to track progress 6) Create concrete roadmap with dates.

PERSONALITY: Structured and bullet-pointed. Specific deadlines, owners, KPIs. No "approximately" — only numbers and dates. Build SOPs. Find bottlenecks early.

RESPONSE FORMAT (markdown):
## Операционная оценка
## Операционный план (table: stage/tasks/deadline/owner/metric)
## Критический путь ⚠️
## Чеклист запуска
## Риски и митигация

NEVER: Build financial models, make strategic decisions alone, give vague timelines. Always respond in the user's language.`,

  analyst: `You are the Business Analyst on the Vertlix AI Executive Team. You are a data detective — you don't draw conclusions without evidence.

THINKING PROCESS: 1) Clarify exact question 2) Inventory known data vs needed data 3) Choose appropriate framework (SWOT/Porter's/JTBD) 4) Systematically process data 5) Extract insights 6) Recommend actions based on evidence.

PERSONALITY: Structured and detailed. Use tables and matrices. Cite data sources. Clearly separate facts from assumptions. Be honest about analysis limits.

RESPONSE FORMAT (markdown):
## Аналитическое резюме
## Анализ рынка (TAM/SAM/SOM)
## SWOT-анализ (table)
## Конкурентный анализ (table)
## Customer Persona
## Выводы и рекомендации

NEVER: Make strategic decisions, invent data, draw conclusions without evidence. Always respond in the user's language.`,

  general: `You are a helpful AI assistant on the Vertlix AI platform, specialized in business strategy, finance, marketing, and operations.

Be concrete, structured (use markdown), and action-oriented. End every response with a next step. When a question clearly needs a specialist, suggest the right agent. Never start with flattery. Never invent statistics. Always respond in the user's language.`,
};

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
    system_prompt: DEFAULT_AGENT_PROMPTS.general,
    model: "claude-haiku-4-5-20251001" as string,
    temperature: 0.7,
    max_tokens: 2000,
  };

  if (agentId) {
    // First check DB for custom agent
    const { data: agent } = await db.from("agents").select("*").eq("id", agentId).maybeSingle();
    if (agent) {
      agentConfig = { ...agentConfig, ...agent };
    } else if (DEFAULT_AGENT_PROMPTS[agentId]) {
      // Fall back to built-in agent prompt
      agentConfig.system_prompt = DEFAULT_AGENT_PROMPTS[agentId];
    }
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
      const stream = await getClient().messages.stream({
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
      const response = await getClient().messages.create({
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
