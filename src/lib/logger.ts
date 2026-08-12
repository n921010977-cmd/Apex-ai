// ─── Структурные логи для production ──────────────────────────────────────────
// Одна строка JSON на событие — Vercel Logs и любой внешний сборщик читают их
// без парсеров. Главное правило: секреты в лог не попадают никогда. Значения
// известных секретных переменных вырезаются из любого текста, а поля с
// «говорящими» именами (token, key, password, secret) маскируются.

type Level = "info" | "warn" | "error";

const SECRET_ENV_KEYS = [
  "ANTHROPIC_API_KEY", "GEMINI_API_KEY", "GROK_API_KEY", "XAI_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "OXAPAY_MERCHANT_API_KEY", "OXAPAY_API_KEY", "OXAPAY_PAYOUT_API_KEY",
  "NEXTAUTH_SECRET", "AUTH_SECRET", "UPSTASH_REDIS_REST_TOKEN",
];

const SENSITIVE_FIELD = /(token|key|secret|password|authorization|cookie|hmac)/i;

/** Вырезает из строки фактические значения секретов окружения. */
function scrub(text: string): string {
  let out = text;
  for (const name of SECRET_ENV_KEYS) {
    const v = process.env[name];
    if (v && v.length > 6) out = out.split(v).join("[redacted]");
  }
  // Часто встречающиеся форматы ключей — на случай, если значение пришло извне.
  out = out.replace(/sk-[A-Za-z0-9_-]{12,}/g, "[redacted]");
  out = out.replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}/g, "[redacted-jwt]");
  return out;
}

function clean(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return scrub(value.slice(0, 500));
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (depth > 2) return "[…]";
  if (Array.isArray(value)) return value.slice(0, 20).map(v => clean(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_FIELD.test(k) ? "[redacted]" : clean(v, depth + 1);
    }
    return out;
  }
  return String(value).slice(0, 200);
}

export interface LogFields {
  event: string;                 // короткое имя события: api_error, payment_webhook…
  endpoint?: string;
  method?: string;
  status?: number;
  durationMs?: number;
  userId?: string;               // идентификатор, не email — персональных данных в логах нет
  errorCode?: string;
  message?: string;
  [key: string]: unknown;
}

function emit(level: Level, fields: LogFields) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    ...(clean(fields) as Record<string, unknown>),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  info:  (fields: LogFields) => emit("info", fields),
  warn:  (fields: LogFields) => emit("warn", fields),
  error: (fields: LogFields) => emit("error", fields),
};

/**
 * Безопасное описание исключения для лога. В ответ пользователю это НЕ уходит —
 * наружу отдаём только общую формулировку.
 */
export function describeError(e: unknown): { message: string; name?: string } {
  if (e instanceof Error) return { name: e.name, message: scrub(e.message).slice(0, 300) };
  return { message: scrub(String(e)).slice(0, 300) };
}
