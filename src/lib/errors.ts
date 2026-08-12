import { log, describeError } from "@/lib/logger";

// ─── Ответ об ошибке для пользователя ─────────────────────────────────────────
// Подробности (текст исключения провайдера, ошибка БД, пути в стеке) остаются в
// серверном логе. Пользователь видит понятную формулировку — и всё.
//
// Исключение: «сервис не настроен» отдаём как 503 с явным текстом, иначе
// владелец сайта не поймёт, что не хватает ключа в окружении.

const NOT_CONFIGURED = /not configured|не настроен|missing api key/i;

export interface SafeErrorOptions {
  endpoint: string;
  userId?: string;
  /** Что показать пользователю, если это не «сервис не настроен». */
  publicMessage?: string;
  status?: number;
}

export function safeErrorResponse(err: unknown, opts: SafeErrorOptions): Response {
  const { message } = describeError(err);
  const notConfigured = NOT_CONFIGURED.test(message);

  log.error({
    event: "api_error",
    endpoint: opts.endpoint,
    userId: opts.userId,
    message,
  });

  const status = notConfigured ? 503 : (opts.status ?? 500);
  const publicMessage = notConfigured
    ? "Сервис временно недоступен: не настроено подключение к AI-провайдеру."
    : (opts.publicMessage ?? "Не удалось выполнить операцию. Попробуйте ещё раз.");

  return new Response(JSON.stringify({ success: false, error: publicMessage }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Ответ на ошибку запроса к БД. Текст Postgres (имена таблиц, колонок,
 * ограничений) наружу не отдаём — он уходит только в серверный лог.
 */
export function dbErrorResponse(error: { message?: string; code?: string } | null, endpoint: string): Response {
  log.error({ event: "db_error", endpoint, code: error?.code, message: error?.message ?? "unknown" });
  return new Response(JSON.stringify({ success: false, error: "Ошибка обращения к базе данных." }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
