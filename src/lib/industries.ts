// ─── База знаний по нишам ─────────────────────────────────────────────────────
// Раньше отрасль передавалась в промпт просто строкой («Отрасль: E-commerce») —
// модель видела ярлык, но не экспертизу, и советы выходили общими. Здесь для
// каждой ниши собрана конкретика: по каким метрикам её оценивают, какие цифры
// считаются нормой, на чём обычно горят. Этот блок подмешивается в системный
// промпт агентов, превращая «AI, который рассуждает вообще» в «AI, который
// разбирается именно в этом бизнесе».
//
// Единый источник правды: и мастер создания проекта, и промпты берут ниши
// отсюда — список не расходится между экраном и бэкендом.

export interface Industry {
  id: string;
  emoji: string;
  label: string;          // как показываем пользователю
  /** Ключевые метрики, по которым живёт эта ниша. */
  metrics: string[];
  /** Ориентиры «что считается нормой» — чтобы советы были с цифрами. */
  benchmarks: string[];
  /** Типичные ошибки, о которых агент обязан предупреждать. */
  pitfalls: string[];
  /** Из чего складывается выручка — одна фраза для быстрого контекста. */
  revenueModel: string;
}

export const INDUSTRIES: Industry[] = [
  {
    id: "saas",
    emoji: "🧩",
    label: "SaaS / Software",
    revenueModel: "Subscription (MRR/ARR) = number of paying customers × average price − churn.",
    metrics: ["MRR/ARR", "Monthly churn", "CAC and its payback period (CAC payback)", "LTV/CAC", "Net Revenue Retention", "Activation and trial→paid conversion"],
    benchmarks: ["A healthy monthly churn for SMB is 3–5%, for enterprise <1%", "LTV/CAC ≥ 3, CAC payback < 12 months", "Trial→paid: 15–25% for self-serve", "NRR > 100% means growth even without new customers"],
    pitfalls: ["Counting revenue before deducting churn", "Burning acquisition budget while churn is high — a \"leaky bucket\"", "Ignoring activation: only users who reach value in the first days pay", "Selling to everyone instead of a narrow ICP"],
  },
  {
    id: "ecommerce",
    emoji: "🛍️",
    label: "E-commerce / Online Store",
    revenueModel: "Revenue = traffic × conversion × average order value; profit depends on margin and CAC.",
    metrics: ["CAC and ROAS", "Site conversion rate", "Average order value (AOV)", "Repeat purchases / retention", "Margin after logistics and returns", "Inventory turnover"],
    benchmarks: ["Online store conversion averages 1–3%", "ROAS below 3–4 is often unprofitable after all costs", "20–40% repeat purchase share is a sign of health", "Apparel returns reach 30–50% — factor this into the model"],
    pitfalls: ["Looking at ROAS without accounting for logistics, returns, and packaging", "Driving traffic to a site with low conversion", "Tying up cash in illiquid inventory", "Competing on price instead of brand and experience"],
  },
  {
    id: "marketplace",
    emoji: "🛒",
    label: "Marketplace",
    revenueModel: "Commission on transactions (take rate) × GMV; value grows from the network effect.",
    metrics: ["GMV (volume)", "Take rate (commission)", "Liquidity (share of closed requests)", "Supply/demand balance", "Retention on both sides", "Share of repeat transactions"],
    benchmarks: ["Take rate is typically 10–30% depending on the niche", "Liquidity matters more than growth: an empty marketplace doesn't retain users", "Start with one city/segment, not \"everything for everyone\""],
    pitfalls: ["The chicken-and-egg problem: scaling both sides at once", "Chasing GMV at the expense of liquidity", "Letting either side leave the platform after the first deal", "Too high a commission scares off suppliers"],
  },
  {
    id: "mobile",
    emoji: "📱",
    label: "Mobile App",
    revenueModel: "Freemium/subscription: revenue = installs × conversion to paying users × LTV.",
    metrics: ["D1/D7/D30 retention", "Install→paid conversion", "LTV and ARPU", "CAC by channel", "Virality (K-factor)", "ASO visibility"],
    benchmarks: ["Good D1 retention is 30–40%, D30 is 10%+", "Subscription conversion is 2–5% for consumer apps", "If LTV < CAC, paid traffic is unprofitable", "Organic growth via ASO and virality is cheaper than ads"],
    pitfalls: ["Spending on ads with weak D1/D7 retention", "Measuring success by installs, not retention", "Ignoring ASO as a free channel", "Placing a paywall before value has been shown"],
  },
  {
    id: "restaurant",
    emoji: "🍽️",
    label: "Restaurant / Café / Food Service",
    revenueModel: "Revenue = average check × guest flow; profit is squeezed by food cost and rent.",
    metrics: ["Food cost (% of revenue)", "Table turnover", "Average check", "Repeat visits", "Rent as % of revenue", "Waste and losses"],
    benchmarks: ["Food cost is kept at 28–35% of revenue", "Rent up to 10–15% of revenue, otherwise it eats profit", "Table turnover during peak hours is key to margin", "Repeat guests are far cheaper than new ones"],
    pitfalls: ["A menu with no regard for dish cost", "Renting space \"for growth\" that current traffic can't support", "Betting on new guests instead of returning ones", "Ignoring waste and theft"],
  },
  {
    id: "agency",
    emoji: "📈",
    label: "Agency / Services",
    revenueModel: "Hours × rate or retainers; margin depends on team utilization.",
    metrics: ["Team utilization (billable %)", "Average rate", "Margin by project", "Share of retainers vs one-off projects", "Pipeline and lead conversion", "Client churn"],
    benchmarks: ["70–80% billable utilization is a healthy level", "Retainers provide predictability, one-off projects drive growth", "Productizing the service raises margin and removes the hours ceiling"],
    pitfalls: ["A growth ceiling of \"hours × people\" without productization", "Dependence on 1–2 large clients", "Dumping rates instead of positioning on value", "No pipeline — downtime between projects"],
  },
  {
    id: "content",
    emoji: "🎬",
    label: "Content / Media / Blog",
    revenueModel: "The audience is monetized through ads, subscriptions, sponsors, and products.",
    metrics: ["Audience growth and reach", "Engagement rate (ER)", "Subscriber retention", "Revenue per 1000 views (RPM)", "Audience-to-paying conversion", "Content publishing frequency"],
    benchmarks: ["Engagement matters more than subscriber count", "Revenue diversification: ads + subscriptions + products", "Publishing consistency is the main growth driver"],
    pitfalls: ["Dependence on a single platform and its algorithm", "Chasing reach without monetization", "Burnout from an irregular schedule", "Having an audience but no product for it"],
  },
  {
    id: "fintech",
    emoji: "💳",
    label: "Fintech / Finance",
    revenueModel: "Fees, spread, subscriptions; unit economics constrained by regulation and risk.",
    metrics: ["Acquisition cost and activation", "Transaction volume", "Default/fraud rate", "Regulatory costs", "Risk-adjusted LTV", "Compliance spend"],
    benchmarks: ["Regulation and licensing aren't optional — they're the entry ticket to the market", "Build fraud and defaults into the model from day one", "User trust is more valuable than any acquisition channel"],
    pitfalls: ["Underestimating the cost of licensing and compliance", "Ignoring fraud until the first major loss", "Unit economics that ignore default risk", "Growing faster than the regulator allows"],
  },
  {
    id: "healthtech",
    emoji: "🩺",
    label: "Health / Medtech / Wellness",
    revenueModel: "Subscriptions, B2B contracts with clinics/insurers; long sales cycle.",
    metrics: ["Retention and adherence", "Acquisition cost", "B2B sales cycle length", "Regulatory status", "Clinical outcomes/evidence", "Patient LTV"],
    benchmarks: ["A long B2B sales cycle in medicine is normal — plan cash accordingly", "Evidence (data, studies) sells better than marketing", "Regulatory status determines what you can even claim"],
    pitfalls: ["Promising a medical effect without evidence — a legal risk", "Underestimating the B2B cycle length and burning cash", "Ignoring regulatory requirements for health data", "Weak retention: without a habit, there's no effect"],
  },
  {
    id: "education",
    emoji: "🎓",
    label: "Education / EdTech / Courses",
    revenueModel: "Selling courses, subscriptions, or B2B; the key is completion rate and outcomes.",
    metrics: ["Course completion rate", "Purchase conversion", "Retention and repeat purchases", "NPS / student outcomes", "CAC by channel", "Word-of-mouth share"],
    benchmarks: ["Online course completion is often <10% — this hurts reputation and repeat sales", "Student outcomes = word of mouth = cheap acquisition", "A cohort format keeps engagement better than \"recorded video\""],
    pitfalls: ["Selling a course and forgetting about completion", "Measuring success by sales, not student outcomes", "One acquisition channel with no word of mouth", "Content with no support or feedback"],
  },
  {
    id: "other",
    emoji: "🚀",
    label: "Other / General",
    revenueModel: "Depends on the model — ask the user about their revenue source.",
    metrics: ["Revenue source and recurrence", "Customer acquisition cost (CAC)", "Lifetime value (LTV)", "Margin", "Retention/repeat purchases"],
    benchmarks: ["LTV should exceed CAC by a wide multiple", "Recurring revenue matters more than one-off deals", "Start with a narrow segment, not \"everyone\""],
    pitfalls: ["No clear unit economics", "A product \"for everyone\" with no concrete ICP", "Growth without retention — a \"leaky bucket\"", "Ignoring margin in favor of volume"],
  },
];

export const INDUSTRY_BY_ID: Record<string, Industry> = Object.fromEntries(
  INDUSTRIES.map(i => [i.id, i]),
);

/** Сопоставить произвольную строку отрасли (из старых проектов, свободный ввод) с нишей. */
export function matchIndustry(raw: string | null | undefined): Industry {
  if (!raw) return INDUSTRY_BY_ID.other;
  const s = raw.toLowerCase();
  const found = INDUSTRIES.find(i =>
    i.id === s || i.label.toLowerCase().includes(s) || s.includes(i.id),
  );
  if (found) return found;
  // грубое сопоставление по ключевым словам
  const kw: [string[], string][] = [
    [["saas", "software", "b2b", "подписк"], "saas"],
    [["shop", "магазин", "commerce", "d2c", "товар"], "ecommerce"],
    [["market", "маркетплейс", "платформа"], "marketplace"],
    [["mobile", "приложен", "app"], "mobile"],
    [["restaurant", "кафе", "ресторан", "food", "общепит"], "restaurant"],
    [["agency", "агентств", "услуг", "service"], "agency"],
    [["content", "медиа", "блог", "media"], "content"],
    [["fintech", "финанс", "банк", "платеж"], "fintech"],
    [["health", "медиц", "здоров", "wellness"], "healthtech"],
    [["edu", "образован", "курс", "обучен"], "education"],
  ];
  for (const [words, id] of kw) {
    if (words.some(w => s.includes(w))) return INDUSTRY_BY_ID[id];
  }
  return INDUSTRY_BY_ID.other;
}

/**
 * Блок для системного промпта: отраслевая экспертиза по выбранной нише.
 * Возвращает готовый текст, который дописывается к персоне агента как ДАННЫЕ
 * (не как команда) — модель использует это как контекст, а не как инструкцию,
 * которую можно переопределить пользовательским вводом.
 */
export function industryPromptBlock(raw: string | null | undefined): string {
  const ind = matchIndustry(raw);
  return [
    `\n\n<industry_expertise niche="${ind.label}">`,
    `Revenue model: ${ind.revenueModel}`,
    `Key metrics this business is evaluated on: ${ind.metrics.join("; ")}.`,
    `Reference points and benchmarks: ${ind.benchmarks.join("; ")}.`,
    `Common mistakes you must warn about: ${ind.pitfalls.join("; ")}.`,
    `Give advice and numbers specific to this niche, not generic statements. Base them on the metrics and benchmarks above.`,
    `</industry_expertise>`,
  ].join("\n");
}
