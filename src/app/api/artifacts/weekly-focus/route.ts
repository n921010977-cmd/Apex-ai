import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { directChat } from "@/lib/orchestrator";
import { chatLimiter, rateLimitResponse } from "@/lib/middleware/rate-limit";
import { requireFeature, denyResponse } from "@/lib/server/access";
import { logAiRequest } from "@/lib/analytics/server";
import { industryPromptBlock } from "@/lib/industries";

export const maxDuration = 60;

// POST /api/artifacts/weekly-focus
// Пункт 4 — возвращаемость. На вход приходят цели пользователя с текущим и
// целевым значением; на выход — что делать именно на этой неделе. Смысл в том,
// чтобы человек возвращался за фокусом, а не уходил после одного ответа.
// Цели передаются в теле запроса (не из БД) — так фича работает и в демо-режиме
// без Supabase, где данные живут в localStorage на клиенте.

type Goal = {
  title?: string;
  metric?: string;
  current?: number | string;
  target?: number | string;
  deadline?: string;
};

const MAX_GOALS = 20;

function pct(current: unknown, target: unknown): number | null {
  const c = Number(current), t = Number(target);
  if (!Number.isFinite(c) || !Number.isFinite(t) || t === 0) return null;
  return Math.round((c / t) * 100);
}

function buildPrompt(goals: Goal[], industry?: string): string {
  const lines = goals.map((g, i) => {
    const p = pct(g.current, g.target);
    return `${i + 1}. «${g.title ?? "без названия"}» — сейчас ${g.current ?? "?"}${g.metric ? " " + g.metric : ""}, `
      + `цель ${g.target ?? "?"}${g.metric ? " " + g.metric : ""}`
      + (p !== null ? ` (${p}% выполнено)` : "")
      + (g.deadline ? `, дедлайн ${g.deadline}` : "");
  }).join("\n");

  return `Ты — операционный директор, который ведёт основателя по его целям. Вот текущее состояние целей:

${lines}

Дай фокус на ЭТУ НЕДЕЛЮ. Структура строго в markdown:
## Фокус недели — одна цель, на которой сосредоточиться в первую очередь, и почему именно она (сильнее всего отстаёт или самый близкий дедлайн).
## Что сделать — 3–5 конкретных действий на неделю, каждое привязано к цели и измеримо.
## На что не отвлекаться — 1–2 вещи, которые сейчас НЕ приоритет, чтобы не распыляться.
## Проверить в конце недели — 2–3 метрики, по которым понять, сдвинулись ли цели.

Пиши кратко и по делу. Только на русском.`
    + industryPromptBlock(industry);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const limit = await chatLimiter(`weekly-focus:${session.user.id}`);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  const access = await requireFeature("weeklyFocus", "weeklyFocus");
  if (!access.allowed) return denyResponse(access);

  let body: { goals?: Goal[]; industry?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  const goals = Array.isArray(body.goals) ? body.goals.slice(0, MAX_GOALS) : [];
  if (goals.length === 0) {
    return NextResponse.json({ success: false, error: "Добавьте хотя бы одну цель" }, { status: 422 });
  }

  try {
    const t0 = Date.now();
    const { content } = await directChat({
      message: buildPrompt(goals, body.industry),
      persona: "Ты — операционный директор, который держит основателя в фокусе. Конкретика без воды.",
      maxTokens: 1200,
    });
    void logAiRequest({ userId: session.user.id, feature: "weekly_focus", status: "ok", responseTimeMs: Date.now() - t0 });
    return NextResponse.json({ success: true, focus: content });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI error";
    void logAiRequest({ userId: session.user.id, feature: "weekly_focus", status: "error", errorMessage: msg });
    const status = /not configured|не настроен/i.test(msg) ? 503 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
