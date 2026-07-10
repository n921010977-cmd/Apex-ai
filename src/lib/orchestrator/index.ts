import Anthropic from "@anthropic-ai/sdk";
import { AGENT_REGISTRY, detectRequiredAgents } from "@/lib/agents/registry";
import { TOOL_DEFINITIONS, executeTool } from "@/lib/tools";
import type { AgentResult, OrchestratorRequest, StreamEvent, AgentConfig } from "@/types";
import type { AgentRole } from "@/types";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured. Add it to .env.local");
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

// ─── Single Agent Runner ──────────────────────────────────────────────────────

async function runAgent(
  agent: AgentConfig,
  message: string,
  history: { role: "user" | "assistant"; content: string }[],
  context: { organizationId?: string; userId?: string; projectId?: string },
): Promise<AgentResult> {
  const start = Date.now();
  try {
    const messages: Anthropic.MessageParam[] = [
      ...history,
      { role: "user", content: message },
    ];

    const tools = agent.toolsEnabled.length > 0
      ? TOOL_DEFINITIONS.filter(t => agent.toolsEnabled.includes(t.name as string))
      : undefined;

    let fullContent = "";
    let tokensUsed = 0;
    let continueLoop = true;
    let loopMessages = [...messages];

    while (continueLoop) {
      continueLoop = false;
      const response = await getClient().messages.create({
        model: agent.model,
        max_tokens: agent.maxTokens,
        temperature: agent.temperature,
        system: agent.systemPrompt,
        messages: loopMessages,
        ...(tools ? { tools } : {}),
      });

      tokensUsed += response.usage.output_tokens + response.usage.input_tokens;

      for (const block of response.content) {
        if (block.type === "text") {
          fullContent += block.text;
        } else if (block.type === "tool_use" && tools) {
          const toolResult = await executeTool(
            block.name,
            block.input as Record<string, unknown>,
            { organizationId: context.organizationId ?? "", userId: context.userId ?? "" }
          );
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

    return {
      agentId: agent.id,
      role: agent.role,
      content: fullContent,
      tokensUsed,
      durationMs: Date.now() - start,
    };
  } catch (error) {
    return {
      agentId: agent.id,
      role: agent.role,
      content: "",
      tokensUsed: 0,
      durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ─── CEO Synthesis ────────────────────────────────────────────────────────────

async function synthesizeWithCEO(
  originalMessage: string,
  agentResults: AgentResult[],
  onToken?: (token: string) => void,
): Promise<{ content: string; tokensUsed: number }> {
  const successfulResults = agentResults.filter(r => !r.error && r.content);

  const synthesisPrompt = successfulResults.length > 1
    ? `The user asked: "${originalMessage}"

Your specialist team has analyzed this. Here are their findings:

${successfulResults.map(r => `### ${r.role} Analysis\n${r.content}`).join("\n\n")}

---

As CEO, synthesize all of this into ONE unified, professional executive report. Integrate all perspectives cohesively. Structure it as a complete strategic recommendation that combines financial, marketing, operational, and strategic insights. Do not just summarize — synthesize into a single coherent recommendation the user can act on immediately.`
    : originalMessage;

  const ceoConfig = AGENT_REGISTRY.ceo;
  let fullContent = "";
  let tokensUsed = 0;

  if (onToken) {
    const stream = await getClient().messages.stream({
      model: ceoConfig.model,
      max_tokens: ceoConfig.maxTokens,
      temperature: ceoConfig.temperature,
      system: ceoConfig.systemPrompt,
      messages: [{ role: "user", content: synthesisPrompt }],
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        onToken(event.delta.text);
        fullContent += event.delta.text;
      }
      if (event.type === "message_delta" && event.usage) {
        tokensUsed += event.usage.output_tokens ?? 0;
      }
    }
  } else {
    const response = await getClient().messages.create({
      model: ceoConfig.model,
      max_tokens: ceoConfig.maxTokens,
      system: ceoConfig.systemPrompt,
      messages: [{ role: "user", content: synthesisPrompt }],
    });
    for (const block of response.content) {
      if (block.type === "text") fullContent += block.text;
    }
    tokensUsed = response.usage.output_tokens + response.usage.input_tokens;
  }

  return { content: fullContent, tokensUsed };
}

// ─── Main Orchestrator (Streaming) ───────────────────────────────────────────

export async function orchestrate(
  req: OrchestratorRequest,
  callbacks: {
    onEvent?: (event: StreamEvent) => void;
  } = {}
): Promise<{ content: string; agentResults: AgentResult[]; tokensUsed: number; durationMs: number }> {
  const start = Date.now();
  const { message, agentId, userId, organizationId, projectId } = req;
  const { onEvent } = callbacks;

  const send = (event: StreamEvent) => onEvent?.(event);

  const history: { role: "user" | "assistant"; content: string }[] = [];
  const context = { organizationId, userId, projectId };

  // If a specific agent is requested, run only that agent
  if (agentId && AGENT_REGISTRY[agentId]) {
    const agent = AGENT_REGISTRY[agentId];
    send({ type: "agent_start", agent: agent.name });

    const result = await runAgent(agent, message, history, context);
    send({ type: "agent_done", agent: agent.name });

    // Stream the result
    if (result.content && onEvent) {
      for (const char of result.content) {
        send({ type: "token", token: char });
      }
    }

    send({ type: "done" });
    return {
      content: result.content,
      agentResults: [result],
      tokensUsed: result.tokensUsed,
      durationMs: Date.now() - start,
    };
  }

  // Multi-agent mode: detect which agents are needed
  const requiredRoles = detectRequiredAgents(message);
  const subAgents = requiredRoles
    .filter(role => role !== "CEO")
    .map(role => Object.values(AGENT_REGISTRY).find(a => a.role === role))
    .filter(Boolean) as AgentConfig[];

  let agentResults: AgentResult[] = [];

  // Run sub-agents in parallel
  if (subAgents.length > 0) {
    subAgents.forEach(a => send({ type: "agent_start", agent: a.name }));

    agentResults = await Promise.all(
      subAgents.map(agent => runAgent(agent, message, history, context))
    );

    agentResults.forEach(r => send({ type: "agent_done", agent: r.agentId }));
  }

  // CEO synthesizes and streams
  const { content, tokensUsed: ceoTokens } = await synthesizeWithCEO(
    message,
    agentResults,
    onEvent ? (token) => send({ type: "token", token }) : undefined,
  );

  const totalTokens = agentResults.reduce((s, r) => s + r.tokensUsed, 0) + ceoTokens;
  send({ type: "done" });

  return {
    content,
    agentResults,
    tokensUsed: totalTokens,
    durationMs: Date.now() - start,
  };
}

// ─── Simple Direct Chat (no multi-agent) ─────────────────────────────────────

export async function directChat(opts: {
  message: string;
  agentId?: string;
  persona?: string;
  history?: { role: "user" | "assistant"; content: string }[];
  image?: { data: string; mediaType: string };
  onToken?: (token: string) => void;
}): Promise<{ content: string; tokensUsed: number }> {
  const { message, agentId, persona, history = [], image, onToken } = opts;
  const agent = (agentId && AGENT_REGISTRY[agentId]) ? AGENT_REGISTRY[agentId] : AGENT_REGISTRY.general ?? Object.values(AGENT_REGISTRY)[0];
  const systemPrompt = persona && persona.trim().length > 0 ? persona : agent.systemPrompt;

  // Vision: attach an image to the latest user message when provided
  const lastUserContent: Anthropic.MessageParam["content"] = image
    ? [
        { type: "image", source: { type: "base64", media_type: image.mediaType as "image/png" | "image/jpeg" | "image/gif" | "image/webp", data: image.data } },
        { type: "text", text: message || "Опиши и проанализируй это изображение." },
      ]
    : message;

  const messages: Anthropic.MessageParam[] = [
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: lastUserContent },
  ];

  let fullContent = "";
  let tokensUsed = 0;

  if (onToken) {
    const stream = await getClient().messages.stream({
      model: agent.model,
      max_tokens: agent.maxTokens,
      temperature: agent.temperature,
      system: systemPrompt,
      messages,
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        onToken(event.delta.text);
        fullContent += event.delta.text;
      }
      if (event.type === "message_delta" && event.usage) {
        tokensUsed += event.usage.output_tokens ?? 0;
      }
    }
  } else {
    const response = await getClient().messages.create({
      model: agent.model,
      max_tokens: agent.maxTokens,
      system: systemPrompt,
      messages,
    });
    for (const block of response.content) {
      if (block.type === "text") fullContent += block.text;
    }
    tokensUsed = response.usage.output_tokens;
  }

  return { content: fullContent, tokensUsed };
}
