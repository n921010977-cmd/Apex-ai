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
    tagline: "Весь продукт, кроме трёх премиум-инструментов",
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
      "Совет из 20 AI-директоров",
      "Генерация стратегий",
      "Библиотека AI-агентов",
      "AI-чат и анализ проектов",
      "200 AI-сообщений в месяц",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 39,
    tagline: "Всё открыто, включая три премиум-инструмента",
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
      "Всё из Starter",
      "Питч-дек для инвестора",
      "Студия «Цели и план»",
      "Трекер целей + «Фокус недели»",
      "Свежие данные с рынка (веб-поиск)",
      "500 AI-сообщений в месяц",
    ],
  },
  {
    id: "max",
    name: "Max",
    priceMonthly: 49,
    tagline: "Всё открыто, лимиты в разы выше",
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
      "Всё из Pro — те же функции",
      "2000 AI-сообщений в месяц (×4 к Pro)",
      "Питч-деки и стратегии без лимита",
      "120 заседаний совета в месяц (×4 к Pro)",
      "«Фокус недели» без лимита",
      "Приоритетная обработка",
    ],
  },
];

export const PLAN_BY_ID: Record<PlanId, Plan> = Object.fromEntries(
  PLANS.map(p => [p.id, p]),
) as Record<PlanId, Plan>;

/** Открыта ли возможность на данном тарифе. */
export function planAllows(plan: PlanId, feature: keyof PlanFeatures): boolean {
  return PLAN_BY_ID[plan]?.features[feature] ?? false;
}
