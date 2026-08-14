// ─── Тарифы Vertlix AI — единый источник правды ───────────────────────────────
// Три тарифа. На $29 открыто всё, КРОМЕ трёх премиум-инструментов: питч-дек,
// студия «Цели и план» и «Фокус недели». Именно за них доплачивают: на $39 они
// открываются (доступно всё), а $49 — те же функции, что и $39, но лимиты в разы
// больше.
//
// Отсюда берут данные и страница цен, и (когда будет БД) счётчик использования.
// Себестоимость AI низкая (модель Haiku), поэтому лимиты щедрые: они защищают
// от абьюза, а не режут честного пользователя.

export type PlanId = "starter" | "pro" | "max";

/** Возможности, которые тариф может открывать или нет. */
export interface PlanFeatures {
  pitchDeck: boolean;     // питч-дек для инвестора
  goalsPlan: boolean;     // «Цели и план» — студия планирования
  weeklyFocus: boolean;   // трекер целей + фокус недели
  strategies: boolean;    // генерация полноценных стратегий
  boardMeetings: boolean; // заседания совета из 20 директоров
  agents: boolean;        // библиотека AI-агентов
  webResearch: boolean;   // свежие данные с рынка (веб-поиск)
}

/** Месячные лимиты. null = без ограничения (в рамках разумного анти-абьюза). */
export interface PlanLimits {
  aiMessages: number | null;   // сообщения к AI (чат, план, уточнения)
  pitchDecks: number | null;   // сборок питч-дека
  strategies: number | null;   // генераций стратегий
  boardMeetings: number | null;// заседаний совета
  weeklyFocus: number | null;  // запросов «фокус недели»
}

export interface Plan {
  id: PlanId;
  name: string;
  priceMonthly: number;        // USD/мес
  tagline: string;
  highlight?: boolean;         // визуально выделить (рекомендуемый)
  features: PlanFeatures;
  limits: PlanLimits;
  /** Что показать в карточке как ключевые пункты. */
  perks: string[];
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 29,
    tagline: "The full product except three premium tools",
    features: {
      // Три премиум-инструмента закрыты — открываются на Pro.
      pitchDeck: false,
      goalsPlan: false,
      weeklyFocus: false,
      // Всё остальное доступно.
      strategies: true,
      boardMeetings: true,
      agents: true,
      webResearch: true,
    },
    limits: {
      aiMessages: 200,
      pitchDecks: 0,
      strategies: 20,
      boardMeetings: 15,
      weeklyFocus: 0,
    },
    perks: [
      "Board of 20 AI directors",
      "Strategy generation",
      "AI agent library",
      "AI chat and project analysis",
      "200 AI messages per month",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 39,
    tagline: "Everything unlocked, including the three premium tools",
    highlight: true,
    features: {
      pitchDeck: true,
      goalsPlan: true,
      weeklyFocus: true,
      strategies: true,
      boardMeetings: true,
      agents: true,
      webResearch: true,
    },
    limits: {
      aiMessages: 500,
      pitchDecks: 50,
      strategies: 40,
      boardMeetings: 30,
      weeklyFocus: 40,
    },
    perks: [
      "Everything in Starter",
      "Investor pitch deck",
      "Goals & Plan studio",
      "Goal tracker + Weekly Focus",
      "Fresh market data (web search)",
      "500 AI messages per month",
    ],
  },
  {
    id: "max",
    name: "Max",
    priceMonthly: 49,
    tagline: "Everything unlocked, with much higher limits",
    features: {
      pitchDeck: true,
      goalsPlan: true,
      weeklyFocus: true,
      strategies: true,
      boardMeetings: true,
      agents: true,
      webResearch: true,
    },
    limits: {
      aiMessages: 2000,
      pitchDecks: null,
      strategies: null,
      boardMeetings: 120,
      weeklyFocus: null,
    },
    perks: [
      "Everything in Pro — same features",
      "2,000 AI messages per month (4× Pro)",
      "Unlimited pitch decks and strategies",
      "120 board meetings per month (4× Pro)",
      "Unlimited Weekly Focus",
      "Priority processing",
    ],
  },
];

export const PLAN_BY_ID: Record<PlanId, Plan> = Object.fromEntries(
  PLANS.map(p => [p.id, p]),
) as Record<PlanId, Plan>;

/** Бесплатный лимит без тарифа: даём попробовать, но не даём абьюзить. */
export const FREE_LIMITS: PlanLimits = {
  aiMessages: 20,
  pitchDecks: 0,
  strategies: 2,
  boardMeetings: 1,
  weeklyFocus: 0,
};

/** Лимиты для активного тарифа (или бесплатные, если тариф не куплен). */
export function limitsFor(plan: PlanId | "none"): PlanLimits {
  return plan === "none" ? FREE_LIMITS : PLAN_BY_ID[plan].limits;
}

/** Открыта ли возможность на данном тарифе. */
export function planAllows(plan: PlanId, feature: keyof PlanFeatures): boolean {
  return PLAN_BY_ID[plan]?.features[feature] ?? false;
}
