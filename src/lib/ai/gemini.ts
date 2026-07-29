// ─── Провайдер Google Gemini ──────────────────────────────────────────────────
// Тонкая обёртка над REST API Gemini: отдельный SDK не ставим, чтобы не тащить
// ещё одну зависимость ради двух запросов. Интерфейс намеренно повторяет то,
// что нужно directChat: системный промпт отдельно, история сообщений отдельно,
// потоковая отдача по токенам.
//
// Ключ берётся ТОЛЬКО из переменной окружения GEMINI_API_KEY. Ключ в коде или в
// репозитории недопустим: он даёт доступ к оплачиваемой квоте, а история git
// хранится вечно.

// Базовый адрес вынесен в переменную: это позволяет прогнать интеграцию против
// локального мока в тестах и пустить трафик через корпоративный прокси, не
// трогая код. По умолчанию — официальный адрес Google.
const ENDPOINT = process.env.GEMINI_API_BASE?.trim() || "https://generativelanguage.googleapis.com/v1beta/models";

/** Модель по умолчанию; переопределяется через GEMINI_MODEL. */
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("GEMINI_API_KEY не настроен");
  return key;
}

function model(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

type Msg = { role: "user" | "assistant"; content: string };
type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

/** История в формате Gemini: роль ассистента там называется "model". */
function toContents(history: Msg[], message: string, image?: { data: string; mediaType: string }) {
  const contents = history.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }] as Part[],
  }));

  const lastParts: Part[] = image
    ? [
        { inlineData: { mimeType: image.mediaType, data: image.data } },
        { text: message || "Опиши и проанализируй это изображение." },
      ]
    : [{ text: message }];

  contents.push({ role: "user", parts: lastParts });
  return contents;
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  error?: { message?: string };
}

function textOf(chunk: GeminiResponse): string {
  return chunk.candidates?.[0]?.content?.parts?.map(p => p.text ?? "").join("") ?? "";
}

/**
 * Один вызов Gemini. Если передан onToken — ответ читается потоком и каждый
 * кусочек текста отдаётся в колбэк (тот же контракт, что у Anthropic-ветки).
 */
export async function geminiChat(opts: {
  message: string;
  systemPrompt?: string;
  history?: Msg[];
  image?: { data: string; mediaType: string };
  maxTokens?: number;
  temperature?: number;
  onToken?: (token: string) => void;
}): Promise<{ content: string; tokensUsed: number }> {
  const { message, systemPrompt, history = [], image, maxTokens = 4096, temperature = 0.7, onToken } = opts;

  const body = JSON.stringify({
    ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
    contents: toContents(history, message, image),
    generationConfig: { maxOutputTokens: maxTokens, temperature },
  });

  const headers = { "Content-Type": "application/json", "x-goog-api-key": apiKey() };
  const streaming = Boolean(onToken);
  const url = `${ENDPOINT}/${model()}:${streaming ? "streamGenerateContent?alt=sse" : "generateContent"}`;

  const res = await fetch(url, { method: "POST", headers, body });

  if (!res.ok) {
    // Тело ошибки может содержать ключ в эхо-запросе — наружу отдаём только код.
    let detail = "";
    try {
      const err = (await res.json()) as GeminiResponse;
      detail = err.error?.message ?? "";
    } catch { /* тело не JSON — ограничимся статусом */ }
    throw new Error(`Gemini API ${res.status}${detail ? `: ${detail}` : ""}`);
  }

  if (!streaming) {
    const data = (await res.json()) as GeminiResponse;
    const usage = data.usageMetadata;
    return {
      content: textOf(data),
      tokensUsed: (usage?.promptTokenCount ?? 0) + (usage?.candidatesTokenCount ?? 0),
    };
  }

  // SSE: события разделены пустой строкой, полезная нагрузка — строки "data: {…}".
  const reader = res.body?.getReader();
  if (!reader) throw new Error("Gemini: пустой поток ответа");

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
        const chunk = JSON.parse(payload) as GeminiResponse;
        const text = textOf(chunk);
        if (text) { content += text; onToken!(text); }
        const usage = chunk.usageMetadata;
        if (usage) tokensUsed = (usage.promptTokenCount ?? 0) + (usage.candidatesTokenCount ?? 0);
      } catch { /* неполный кусок — пропускаем, следующий придёт целиком */ }
    }
  }

  return { content, tokensUsed };
}
