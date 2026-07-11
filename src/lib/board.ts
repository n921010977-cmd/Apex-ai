// ─── AI Board Core — общая модель данных для бэкенда и фронтенда ───────────────
// Один источник правды для страницы «Совет» (/dashboard/executives) и API
// /api/board/state. Персоны берутся из канонического реестра команды.
import { TEAM_BY_SLUG } from "@/lib/team";

export type BoardStatus = "thinking" | "analyzing" | "task" | "product" | "idle";

export type BoardAgent = {
  slug: string;
  ab: string;
  name: string;
  role: string;          // отображаемая роль в совете (CEO, CFO, RESEARCH…)
  status: BoardStatus;
  statusLabel: string;   // "Thinking" | "analyzing" | "Current task"…
  task: string;          // текущая задача
  confidence: number;    // 0–100
  tokensPerSec: number;  // живая метрика
  progress: number;      // 0–100
  tasksCompleted: number;
  quality: number;       // 0–100 качество решений
  tools: string[];
  c: string;
  g: [string, string];
};

// Совет = 6 ключевых ролей, каждая привязана к канонической персоне.
const SEED: Omit<BoardAgent, "ab" | "name" | "c" | "g">[] = [
  { slug: "ceo",     role: "CEO",       status: "thinking",  statusLabel: "Thinking",     task: "Синтез стратегии Q3",        confidence: 99, tokensPerSec: 12, progress: 85, tasksCompleted: 4, quality: 96, tools: ["Стратегия", "Синтез"] },
  { slug: "cfo",     role: "CFO",       status: "task",      statusLabel: "Current task", task: "Финмодель рынка Германии",   confidence: 98, tokensPerSec: 13, progress: 85, tasksCompleted: 5, quality: 93, tools: ["Финмодель", "Прогноз"] },
  { slug: "market",  role: "RESEARCH",  status: "analyzing", statusLabel: "analyzing",    task: "143 конкурента, ROI 25%",   confidence: 97, tokensPerSec: 12, progress: 86, tasksCompleted: 5, quality: 91, tools: ["Разведка", "TAM/SAM"] },
  { slug: "cmo",     role: "MARKETING", status: "analyzing", statusLabel: "analyzing",    task: "Спрос растёт, каналы",       confidence: 99, tokensPerSec: 12, progress: 85, tasksCompleted: 3, quality: 94, tools: ["Каналы", "Кампании"] },
  { slug: "legal",   role: "LEGAL",     status: "product",   statusLabel: "Product",      task: "Комплаенс новых рынков",     confidence: 99, tokensPerSec: 12, progress: 85, tasksCompleted: 2, quality: 90, tools: ["Комплаенс", "Право"] },
  { slug: "cto",     role: "TECH",      status: "thinking",  statusLabel: "Thinking",     task: "Готовность платформы ×3",    confidence: 99, tokensPerSec: 12, progress: 85, tasksCompleted: 1, quality: 95, tools: ["Архитектура", "AI"] },
];

export function getBoardAgents(): BoardAgent[] {
  return SEED.map(s => {
    const m = TEAM_BY_SLUG[s.slug];
    return { ...s, ab: m.ab, name: m.name, c: m.c, g: m.g };
  });
}

// ─── Обсуждение совета (правый борт) ──────────────────────────────────────────
export type BoardDebateItem = { slug: string; role: string; text: string; kind: "recommendation" | "alert" | "action" };
export const BOARD_DEBATE: BoardDebateItem[] = [
  { slug: "ceo",    role: "CEO",       text: "Экспансия в Германию выглядит перспективно.",     kind: "recommendation" },
  { slug: "market", role: "RESEARCH",  text: "143 конкурента проанализировано (ROI ~25%).",     kind: "alert" },
  { slug: "cmo",    role: "MARKETING", text: "Спрос растёт — предлагаю усилить каналы.",         kind: "recommendation" },
  { slug: "legal",  role: "LEGAL",     text: "Выявлены юридические риски по комплаенсу.",        kind: "alert" },
];

// ─── Хронология миссий (низ) ──────────────────────────────────────────────────
export type TimelineEvent = { t: string; label: string; kind: "milestone" | "risk" | "decision" };
export const BOARD_TIMELINE: TimelineEvent[] = [
  { t: "10:21", label: "Миссия создана",              kind: "milestone" },
  { t: "10:23", label: "Конкуренты проанализированы", kind: "milestone" },
  { t: "10:24", label: "Финансовый прогноз готов",    kind: "decision" },
  { t: "10:25", label: "Маркетинг-стратегия собрана", kind: "milestone" },
  { t: "10:26", label: "CEO утвердил стратегию",      kind: "decision" },
];

// ─── Автоматические рекомендации (левый борт) ─────────────────────────────────
export const BOARD_RECS: string[] = [
  "Оптимизировать бюджет 2 кампаний",
  "Запустить рыночный тест в регионе Y",
  "Пересмотреть ценообразование (+18%)",
  "Ускорить найм в поддержку под рост",
];

// ─── Системные метрики ядра ───────────────────────────────────────────────────
export type BoardMetrics = {
  healthIndex: number;      // Business Health & Sustainability
  revenuePrediction: number; // +% MoM
  resourceUtilization: number;
  decisionLatency: number;   // ms
  collaborationIndex: number;
  riskRadar: { l: string; v: number }[];
  scenarios: { l: string; v: number }[];
  marketPosition: number[];  // sparkline
};
export function getBoardMetrics(): BoardMetrics {
  return {
    healthIndex: 88,
    revenuePrediction: 24,
    resourceUtilization: 82,
    decisionLatency: 340,
    collaborationIndex: 91,
    riskRadar: [
      { l: "Финансы", v: 0.62 }, { l: "Операции", v: 0.48 }, { l: "Комплаенс", v: 0.55 },
    ],
    scenarios: [
      { l: "Лучший",  v: 0.9 }, { l: "Базовый", v: 0.65 }, { l: "Худший",  v: 0.32 },
    ],
    marketPosition: [30, 42, 38, 55, 60, 72, 68, 84],
  };
}
