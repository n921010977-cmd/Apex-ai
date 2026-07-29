// ─── Провайдер xAI Grok ───────────────────────────────────────────────────────
// API xAI совместимо с форматом OpenAI (/v1/chat/completions), поэтому обёртка
// такая же тонкая, как у Gemini: своего SDK не ставим. Системный промпт здесь —
// отдельное сообщение с ролью "system", то есть пользовательский текст в него
// по-прежнему не попадает (защита от prompt injection сохраняется).
//
// Ключ только из окружения: GROK_API_KEY или XAI_API_KEY (историческое имя,
// оно уже встречается в .env.example — поддерживаем оба, чтобы не ломать
// существующие настройки).

const DEFAULT_BASE = "https://api.x.ai/v1";

/** Модель по умолчанию: самая дешёвая в линейке. Меняется через GROK_MODEL. */
export const DEFAULT_GROK_MODEL = "grok-3-mini";

export function grokConfigured(): boolean {
  return Boolean((process.env.GROK_API_KEY || process.env.XAI_API_KEY)?.trim());
}

function apiKey(): string {
  const key = (process.env.GROK_API_KEY || process.env.XAI_API_KEY)?.trim();
  if (!key) throw new Error("GROK_API_KEY (или XAI_API_KEY) не настроен");
  return key;
}

function baseUrl(): string {
  return process.env.GROK_API_BASE?.trim() || DEFAULT_BASE;
}

function model(): string {
  return process.env.GROK_MODEL?.trim() || DEFAULT_GROK_MODEL;
}

type Msg = { role: "user" | "assistant"; content: string };

interface ChatCompletion {
  choices?: { message?: { content?: string }; delta?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string } | string;
}

/**
 * Один вызов Grok. С onToken ответ читается потоком — тот же контракт, что у
 * Anthropic- и Gemini-веток, поэтому вызывающий код о провайдере не знает.
 */
export async function grokChat(opts: {
  message: string;
  systemPrompt?: string;
  history?: Msg[];
  maxTokens?: number;
  temperature?: number;
  onToken?: (token: string) => void;
}): Promise<{ content: string; tokensUsed: number }> {
  const { message, systemPrompt, history = [], maxTokens = 1500, temperature = 0.7, onToken } = opts;

  const messages = [
    ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
    ...history,
    { role: "user" as const, content: message },
  ];

  const streaming = Boolean(onToken);
  const res = await fetch(`${baseUrl()}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey()}` },
    body: JSON.stringify({
      model: model(),
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: streaming,
    }),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const err = (await res.json()) as ChatCompletion;
      detail = typeof err.error === "string" ? err.error : err.error?.message ?? "";
    } catch { /* тело не JSON — ограничимся статусом */ }
    const error = new Error(`Grok API ${res.status}${detail ? `: ${detail}` : ""}`);
    (error as Error & { status?: number }).status = res.status;
    throw error;
  }

  if (!streaming) {
    const data = (await res.json()) as ChatCompletion;
    return {
      content: data.choices?.[0]?.message?.content ?? "",
      tokensUsed: (data.usage?.prompt_tokens ?? 0) + (data.usage?.completion_tokens ?? 0),
    };
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("Grok: пустой поток ответа");

  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  let tokensUsed = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part.split("\n").find(l => l.startsWith("data: "));
      if (!line) continue;
      const payload = line.slice(6).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const chunk = JSON.parse(payload) as ChatCompletion;
        const text = chunk.choices?.[0]?.delta?.content ?? "";
        if (text) { content += text; onToken!(text); }
        if (chunk.usage) {
          tokensUsed = (chunk.usage.prompt_tokens ?? 0) + (chunk.usage.completion_tokens ?? 0);
        }
      } catch { /* неполный кусок — придёт целиком следующим */ }
    }
  }

  return { content, tokensUsed };
}
