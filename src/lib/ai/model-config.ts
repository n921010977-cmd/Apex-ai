// ─── Экономичная конфигурация моделей ─────────────────────────────────────────
// Стоимость запроса складывается из модели и количества токенов. Раньше тяжёлые
// сценарии (совет директоров, генерация стратегии) были жёстко прибиты к
// дорогой модели, а лимиты вывода задавались «с запасом» — при пустом балансе
// это и приводило к отказам. Теперь всё в одном месте и настраивается
// переменными окружения, без правки кода.
//
// По умолчанию выбран самый дешёвый вариант: Haiku и умеренные лимиты вывода.
// Когда захочется качества — поставить ANTHROPIC_MODEL_HEAVY=claude-sonnet-5.

/** Дешёвая модель для чата, ответов агентов, саммари. */
export const MODEL_FAST =
  process.env.ANTHROPIC_MODEL_FAST?.trim() || "claude-haiku-4-5-20251001";

/** Модель для тяжёлых сценариев. По умолчанию тоже дешёвая — ради экономии. */
export const MODEL_HEAVY =
  process.env.ANTHROPIC_MODEL_HEAVY?.trim() || MODEL_FAST;

function num(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Потолок вывода в чате: длинного ответа тут не нужно, а платим за каждый токен. */
export const MAX_TOKENS_CHAT = num("AI_MAX_TOKENS_CHAT", 1500);

/** Потолок вывода в тяжёлых сценариях (разделы стратегии, реплики совета). */
export const MAX_TOKENS_HEAVY = num("AI_MAX_TOKENS_HEAVY", 2000);

/** Короткие служебные ответы: саммари заметки, ответ поддержки. */
export const MAX_TOKENS_SHORT = num("AI_MAX_TOKENS_SHORT", 500);
