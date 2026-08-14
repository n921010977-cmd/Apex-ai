import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { directChat } from "@/lib/orchestrator";
import { reportLimiter, rateLimitResponse } from "@/lib/middleware/rate-limit";
import { requireFeature, denyResponse } from "@/lib/server/access";
import { logAiRequest } from "@/lib/analytics/server";
import { industryPromptBlock, matchIndustry } from "@/lib/industries";
import { MODEL_HEAVY, MAX_TOKENS_HEAVY } from "@/lib/ai/model-config";
import { webResearch, webContextBlock, webResearchConfigured } from "@/lib/web-research";
import { safeErrorResponse } from "@/lib/errors";
import { markActivated } from "@/lib/analytics/growth";
import { MAX_QUESTION_LEN, QUESTION_TOO_LONG } from "@/lib/validators";

export const maxDuration = 120;

// POST /api/artifacts/pitch-deck
// Из короткого брифа собирает инвесторский питч-дек по классической структуре
// (10 слайдов) и возвращает его строго структурированным JSON — фронт рисует из
// него презентацию и отдаёт на скачивание. Это «киллер-артефакт»: ChatGPT даёт
// текст в окне, здесь — готовый документ, который не стыдно показать инвестору.

// Единый потолок вопроса к AI — как во всех маршрутах (см. validators).
const MAX_BRIEF = MAX_QUESTION_LEN;

// Каноническая последовательность слайдов инвесторской презентации.
const SLIDES = [
  { key: "title",      title: "Титул" },
  { key: "problem",    title: "Проблема" },
  { key: "solution",   title: "Решение" },
  { key: "market",     title: "Рынок (TAM/SAM/SOM)" },
  { key: "product",    title: "Продукт" },
  { key: "business",   title: "Бизнес-модель" },
  { key: "traction",   title: "Трекшн" },
  { key: "competition",title: "Конкуренты" },
  { key: "team",       title: "Команда" },
  { key: "ask",        title: "Запрос инвестиций" },
];

const STYLES: Record<string, string> = {
  classic:   "уверенный, классический инвесторский — сдержанно и по делу",
  visionary: "дерзкий, визионерский — большие амбиции, смелые формулировки",
  data:      "data-driven — максимум цифр, метрик и обоснований, минимум воды",
};
const LANGS: Record<string, string> = { ru: "русский", en: "английский (English)" };

function buildPrompt(brief: string, language: string, style: string): string {
  const tone = STYLES[style] ?? STYLES.classic;
  const lang = LANGS[language] ?? LANGS.ru;
  return `Собери инвесторский питч-дек для стартапа на основе брифа основателя.

Бриф: ${brief}

Верни СТРОГО JSON без пояснений и без markdown-обёртки, формата:
{
  "company": "рабочее название компании",
  "tagline": "одна фраза-позиционирование",
  "slides": {
    "title":       { "headline": "...", "sub": "..." },
    "problem":     { "headline": "...", "bullets": ["...","...","..."] },
    "solution":    { "headline": "...", "bullets": ["...","...","..."] },
    "market":      { "headline": "...", "tam": "...", "sam": "...", "som": "...", "note": "..." },
    "product":     { "headline": "...", "bullets": ["...","...","..."] },
    "business":    { "headline": "...", "bullets": ["...","...","..."] },
    "traction":    { "headline": "...", "metrics": [{"label":"...","value":"..."}], "note": "..." },
    "competition": { "headline": "...", "edge": ["...","...","..."] },
    "team":        { "headline": "...", "bullets": ["...","...","..."] },
    "ask":         { "headline": "...", "amount": "...", "use": ["...","...","..."], "milestone": "..." }
  }
}

Правила: цифры реалистичные и обоснованные (TAM/SAM/SOM, суммы), метрики трекшна — примеры, которые основателю нужно достичь, помечай их как цели. Тон — ${tone}. Язык всего текста — ${lang}. Только JSON.`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  // Генерация дека — дорогой одиночный вызов модели: держим квоту отчётов.
  const limit = await reportLimiter(`pitch:${session.user.id}`);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  // Единая серверная проверка: тариф открывает функцию + месячная квота.
  const access = await requireFeature("pitchDeck", "pitchDecks");
  if (!access.allowed) return denyResponse(access);

  let body: { brief?: string; industry?: string; research?: boolean; language?: string; style?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  const brief = body.brief?.trim();
  const language = body.language === "en" ? "en" : "ru";
  const style = ["classic", "visionary", "data"].includes(body.style ?? "") ? body.style! : "classic";
  if (!brief) return NextResponse.json({ success: false, error: "Опишите бизнес" }, { status: 422 });
  if (brief.length > MAX_BRIEF) {
    return NextResponse.json({ success: false, error: QUESTION_TOO_LONG }, { status: 422 });
  }

  // Персона = инструкция составителя дека + отраслевая экспертиза по нише.
  const persona =
    "Ты — партнёр венчурного фонда и ex-founder. Ты собираешь убедительные, "
    + "реалистичные инвесторские питч-деки. Отвечаешь строго валидным JSON."
    + industryPromptBlock(body.industry);

  // Если включены свежие данные и настроен Brave — подтягиваем актуальную
  // информацию по рынку и конкурентам и подмешиваем как контекст с источниками.
  let webBlock = "";
  let researched = false;
  if (body.research && webResearchConfigured()) {
    const niche = matchIndustry(body.industry).label;
    const results = await webResearch([
      `${brief} рынок объём 2026`,
      `${brief} конкуренты`,
      `${niche} тренды 2026`,
    ]);
    webBlock = webContextBlock(results);
    researched = results.length > 0;
  }

  let raw: string;
  const t0 = Date.now();
  try {
    // Деку нужен весь JSON целиком — даём увеличенный потолок вывода.
    const result = await directChat({ message: buildPrompt(brief, language, style) + webBlock, persona, maxTokens: Math.max(MAX_TOKENS_HEAVY, 3000) });
    raw = result.content;
    void logAiRequest({ userId: session.user.id, feature: "pitch_deck", model: MODEL_HEAVY, status: "ok", responseTimeMs: Date.now() - t0 });
    void markActivated(session.user.id, "pitch_deck");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI error";
    void logAiRequest({ userId: session.user.id, feature: "pitch_deck", model: MODEL_HEAVY, status: "error", responseTimeMs: Date.now() - t0, errorMessage: msg });
    return safeErrorResponse(err, { endpoint: "/api/artifacts/pitch-deck", userId: session.user.id, publicMessage: "Не удалось собрать питч-дек. Попробуйте ещё раз." });
  }

  // Модель иногда оборачивает JSON в ```json — вырезаем и парсим устойчиво.
  let deck: unknown;
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    deck = JSON.parse(match ? match[0] : raw);
  } catch {
    return NextResponse.json({ success: false, error: "Модель вернула некорректный JSON, попробуйте ещё раз" }, { status: 502 });
  }

  return NextResponse.json({ success: true, deck, slideOrder: SLIDES, model: MODEL_HEAVY, researched });
}
