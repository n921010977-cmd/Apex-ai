// ─── Очередь провайдеров: Anthropic → Gemini ──────────────────────────────────
// Anthropic основной, Gemini подхватывает, когда основной не может ответить.
// Главный случай, ради которого это写ано: на балансе Anthropic кончились деньги
// и API отвечает «credit balance is too low». Раньше такой ответ просто ронял
// запрос, и пользователь видел ошибку, хотя рабочий второй провайдер настроен.
//
// Переключаемся только на ошибках, которые означают «этот провайдер сейчас
// ответить не может»: нет денег, нет доступа, превышена квота, сбой на стороне
// сервиса. На ошибке в самом запросе (некорректные параметры) переключаться
// нельзя — второй провайдер упадёт так же, а мы заплатим дважды.

/** Ошибка, при которой имеет смысл пойти к запасному провайдеру. */
export function shouldFailover(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (status === 401 || status === 402 || status === 403 || status === 429) return true;
  if (typeof status === "number" && status >= 500) return true;

  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes("credit balance") ||     // «недостаточно средств» у Anthropic
    msg.includes("insufficient")  ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("overloaded") ||
    msg.includes("billing")
  );
}

/** Короткое человекочитаемое объяснение, зачем мы переключились (для логов). */
export function failoverReason(err: unknown): string {
  const status = (err as { status?: number })?.status;
  const msg = err instanceof Error ? err.message : String(err);
  return `${status ? `HTTP ${status}: ` : ""}${msg}`.slice(0, 200);
}
