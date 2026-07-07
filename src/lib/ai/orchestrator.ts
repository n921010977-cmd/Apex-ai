/**
 * AI Report Orchestrator — 15-agent pipeline for 100-page business reports.
 *
 * Architecture:
 *  Phase 1 (parallel): CFO · CMO Market · CMO Marketing · COO · CRO · Roadmap
 *  Phase 2 (sequential): CEO summary synthesised from all section scores
 *
 * Each section runs 4-5 sequential LLM calls (sub-sections), each targeting
 * 3-4 pages of rich markdown, totalling 15+ pages per section ≈ 100 pages overall.
 *
 * Uses @supabase/supabase-js directly (no cookies) so it can run as a
 * fire-and-forget background task after the HTTP response is returned.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProjectContext {
  name:          string;
  description:   string;
  industry:      string;
  stage:         string;
  goals:         string[];
  timeframe:     string;
  targetRevenue: string;
  analysis:      unknown | null;
}

interface ContentBlock {
  subTitle:     string;
  markdown:     string;
  pageEstimate: number;
  score:        number;
}

interface SectionResult {
  blocks:     ContentBlock[];
  totalPages: number;
  score:      number;
  agentMeta:  { agent: string; model: string; tokensUsed: number; durationMs: number };
}

// ─── Clients ──────────────────────────────────────────────────────────────────

function getAi(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars are not set");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createSupabaseClient(url, key, { auth: { persistSession: false } }) as any;
}

// ─── Core agent call ──────────────────────────────────────────────────────────

const SUBMIT_TOOL: Anthropic.Tool = {
  name: "submit_content",
  description: "Submit the completed content block for this sub-section",
  input_schema: {
    type: "object",
    properties: {
      subTitle:     { type: "string",  description: "H3 heading for this sub-section" },
      markdown:     { type: "string",  description: "Rich detailed markdown, 2500–6000 words" },
      score:        { type: "number",  description: "Business readiness score 0–100 for this area" },
      pageEstimate: { type: "number",  description: "Estimated A4 pages if printed (typically 3–5)" },
    },
    required: ["subTitle", "markdown", "score", "pageEstimate"],
  },
};

async function callAgent(params: {
  agentName:  string;
  system:     string;
  user:       string;
  model?:     string;
  maxTokens?: number;
  ai:         Anthropic;
}): Promise<ContentBlock & { tokensUsed: number }> {
  const model = params.model ?? "claude-sonnet-5";
  const start = Date.now();

  let tokensUsed = 0;

  try {
    const response = await params.ai.messages.create({
      model,
      max_tokens: params.maxTokens ?? 8000,
      system:     params.system,
      messages:   [{ role: "user", content: params.user }],
      tools:      [SUBMIT_TOOL],
      tool_choice: { type: "auto" },
    });

    tokensUsed = (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);

    const toolBlock = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (toolBlock) {
      const inp = toolBlock.input as { subTitle?: string; markdown?: string; score?: number; pageEstimate?: number };
      return {
        subTitle:     inp.subTitle     ?? params.agentName,
        markdown:     inp.markdown     ?? "",
        score:        clamp(inp.score  ?? 70, 0, 100),
        pageEstimate: inp.pageEstimate ?? 3,
        tokensUsed,
      };
    }

    // Fallback: use text blocks
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map(b => b.text)
      .join("\n\n");

    return { subTitle: params.agentName, markdown: text || "—", score: 65, pageEstimate: 3, tokensUsed };
  } catch (err) {
    console.error(`[orchestrator] agent "${params.agentName}" error:`, err);
    return { subTitle: params.agentName, markdown: `Ошибка генерации: ${String(err)}`, score: 0, pageEstimate: 0, tokensUsed };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

function mean(arr: number[]) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }

function buildContext(p: ProjectContext) {
  return `
Проект: ${p.name}
Описание: ${p.description || "не указано"}
Отрасль: ${p.industry}
Стадия: ${p.stage}
Цели: ${p.goals.join("; ") || "не указаны"}
Горизонт: ${p.timeframe}
Целевая выручка: ${p.targetRevenue || "не указана"}
${p.analysis ? `\nПредварительный анализ:\n${JSON.stringify(p.analysis, null, 2)}` : ""}
`.trim();
}

async function persistSection(
  db: ReturnType<typeof getDb>,
  reportId: string,
  type: string,
  title: string,
  result: SectionResult,
  sortOrder: number,
) {
  const { error } = await db
    .from("report_sections")
    .upsert(
      {
        report_id:  reportId,
        type,
        title,
        content:    result,
        score:      result.score,
        gen_status: "COMPLETED",
        sort_order: sortOrder,
      },
      { onConflict: "report_id,type" },
    );

  if (error) console.error(`[orchestrator] upsert ${type} error:`, error);
}

async function markSectionProcessing(db: ReturnType<typeof getDb>, reportId: string, type: string, title: string, sortOrder: number) {
  await db
    .from("report_sections")
    .upsert(
      { report_id: reportId, type, title, content: {}, gen_status: "PROCESSING", sort_order: sortOrder },
      { onConflict: "report_id,type" },
    );
}

// ─── Department tracks ────────────────────────────────────────────────────────

async function runFinanceTrack(
  ai: Anthropic,
  db: ReturnType<typeof getDb>,
  reportId: string,
  project: ProjectContext,
): Promise<SectionResult> {
  const start   = Date.now();
  const ctx     = buildContext(project);
  await markSectionProcessing(db, reportId, "FINANCE", "Финансовый анализ", 1);

  const BASE_SYSTEM = `Ты CFO (Chief Financial Officer) — эксперт финансового моделирования и инвестиционного анализа.
Пиши детально, с таблицами, формулами и цифрами. Ответ ТОЛЬКО через инструмент submit_content.
Контекст проекта:\n${ctx}`;

  const subSections: Array<{ name: string; prompt: string }> = [
    {
      name:   "Финансовая модель и прогноз выручки (Year 1–3)",
      prompt: `Разработай детальную финансовую модель для "${project.name}".
Включи: структуру выручки и потоков дохода; помесячный план Y1, квартальный Y2, годовой Y3;
ценообразование и тарифные планы; ключевые драйверы роста. Используй markdown-таблицы.
Целевой объём: 4–5 страниц.`,
    },
    {
      name:   "Юнит-экономика: LTV, CAC, маржинальность",
      prompt: `Проведи глубокий анализ юнит-экономики "${project.name}".
Рассчитай и объясни: CAC по каждому каналу; LTV с разбивкой по сегментам; LTV/CAC (цель >3×);
Gross Margin, Contribution Margin; Payback Period; Churn Rate и влияние на LTV.
Приведи все формулы и расчёты. Объём: 3–4 страницы.`,
    },
    {
      name:   "Денежный поток, runway и точка безубыточности",
      prompt: `Построй детальный анализ денежного потока "${project.name}".
Включи: ежемесячный cash burn rate; runway при текущих инвестициях; Break-even анализ (единиц и выручки);
операционный vs. свободный денежный поток; рабочий капитал; ключевые триггеры кассового разрыва.
Таблицы и графики в ASCII. Объём: 3–4 страницы.`,
    },
    {
      name:   "Стратегия привлечения инвестиций и структура капитала",
      prompt: `Разработай инвестиционную стратегию для "${project.name}".
Включи: необходимый объём инвестиций и стадии (pre-seed, seed, Series A);
как распределить капитал (use of funds); оценка (valuation) — методы DCF, comparable companies;
условия для инвесторов (term sheet ключевые пункты); план достижения milestones до следующего раунда.
Объём: 3–4 страницы.`,
    },
    {
      name:   "Трёх-сценарный анализ: Медведь / База / Бык",
      prompt: `Проведи полный сценарный анализ для "${project.name}".
Для каждого сценария (Pessimistic / Base / Optimistic) опиши: ключевые допущения; выручка Y1/Y2/Y3;
EBITDA маржа; runway; вероятность реализации; триггеры перехода между сценариями; рекомендуемые действия.
Таблица сравнения сценариев. Объём: 4–5 страниц.`,
    },
  ];

  const blocks: ContentBlock[] = [];
  let   totalTokens = 0;

  for (const sub of subSections) {
    const result = await callAgent({ agentName: sub.name, system: BASE_SYSTEM, user: sub.prompt, ai, maxTokens: 8000 });
    blocks.push({ subTitle: result.subTitle, markdown: result.markdown, pageEstimate: result.pageEstimate, score: result.score });
    totalTokens += result.tokensUsed;
  }

  const sectionScore = Math.round(mean(blocks.map(b => b.score)));
  const totalPages   = blocks.reduce((s, b) => s + b.pageEstimate, 0);
  const sectionResult: SectionResult = {
    blocks, totalPages, score: sectionScore,
    agentMeta: { agent: "CFO", model: "claude-sonnet-5", tokensUsed: totalTokens, durationMs: Date.now() - start },
  };

  await persistSection(db, reportId, "FINANCE", "Финансовый анализ", sectionResult, 1);
  return sectionResult;
}

async function runMarketTrack(
  ai: Anthropic,
  db: ReturnType<typeof getDb>,
  reportId: string,
  project: ProjectContext,
): Promise<SectionResult> {
  const start   = Date.now();
  const ctx     = buildContext(project);
  await markSectionProcessing(db, reportId, "MARKET", "Анализ рынка", 2);

  const BASE_SYSTEM = `Ты Chief Market Intelligence Officer — эксперт стратегического анализа рынков и конкурентной разведки.
Пиши детально, с данными, метриками и конкретными примерами. Ответ ТОЛЬКО через инструмент submit_content.
Контекст проекта:\n${ctx}`;

  const subSections = [
    {
      name:   "Размер и структура рынка: TAM / SAM / SOM",
      prompt: `Проведи детальный анализ рынка для "${project.name}" в отрасли "${project.industry}".
Рассчитай TAM (Total Addressable Market), SAM (Serviceable Addressable Market), SOM (Serviceable Obtainable Market).
Используй bottom-up и top-down методологии. Опиши динамику роста (CAGR), структуру рынка, ключевые сегменты.
Объём: 3–4 страницы.`,
    },
    {
      name:   "Конкурентный ландшафт и анализ позиционирования",
      prompt: `Проведи глубокий конкурентный анализ для "${project.name}".
Включи: карту конкурентов (прямые, косвенные, заменители); SWOT для 3–5 ключевых игроков;
матрицу позиционирования по 2 ключевым осям; барьеры входа; конкурентные преимущества проекта;
White space opportunities. Таблицы сравнения. Объём: 4–5 страниц.`,
    },
    {
      name:   "Сегментация клиентов и Ideal Customer Profile",
      prompt: `Разработай детальную сегментацию целевой аудитории для "${project.name}".
Включи: 3–4 ключевых сегмента с размером и потенциалом; ICP (Ideal Customer Profile) для B2B или B2C;
Jobs-to-be-done для каждого сегмента; Customer Pain Points и Gain Points; готовность платить (WTP);
Jobs personas с цитатами. Объём: 3–4 страницы.`,
    },
    {
      name:   "Рыночные тренды и технологические изменения",
      prompt: `Проанализируй мегатренды и технологические сдвиги, влияющие на "${project.name}".
Включи: 5–7 ключевых трендов; технологические дизрапторы; регуляторные изменения; ESG-факторы;
геополитические влияния; влияние AI и автоматизации; временные горизонты (1/3/5 лет);
возможности и угрозы для проекта. Объём: 3–4 страницы.`,
    },
  ];

  const blocks: ContentBlock[] = [];
  let   totalTokens = 0;

  for (const sub of subSections) {
    const result = await callAgent({ agentName: sub.name, system: BASE_SYSTEM, user: sub.prompt, ai, maxTokens: 8000 });
    blocks.push({ subTitle: result.subTitle, markdown: result.markdown, pageEstimate: result.pageEstimate, score: result.score });
    totalTokens += result.tokensUsed;
  }

  const sectionScore = Math.round(mean(blocks.map(b => b.score)));
  const totalPages   = blocks.reduce((s, b) => s + b.pageEstimate, 0);
  const sectionResult: SectionResult = {
    blocks, totalPages, score: sectionScore,
    agentMeta: { agent: "CMO-Market", model: "claude-sonnet-5", tokensUsed: totalTokens, durationMs: Date.now() - start },
  };

  await persistSection(db, reportId, "MARKET", "Анализ рынка", sectionResult, 2);
  return sectionResult;
}

async function runMarketingTrack(
  ai: Anthropic,
  db: ReturnType<typeof getDb>,
  reportId: string,
  project: ProjectContext,
): Promise<SectionResult> {
  const start   = Date.now();
  const ctx     = buildContext(project);
  await markSectionProcessing(db, reportId, "MARKETING", "Маркетинговая стратегия", 3);

  const BASE_SYSTEM = `Ты CMO (Chief Marketing Officer) — эксперт growth-маркетинга и построения брендов.
Ты мыслишь воронками, метриками и ROI. Ответ ТОЛЬКО через инструмент submit_content.
Контекст проекта:\n${ctx}`;

  const subSections = [
    {
      name:   "Бренд-стратегия, УТП и ключевые сообщения",
      prompt: `Разработай полную бренд-стратегию для "${project.name}".
Включи: Brand Positioning Statement; УТП (уникальное торговое предложение) для каждого сегмента;
Brand Voice и Tone of Voice; ключевые сообщения (messaging matrix); Elevator Pitch (30 сек / 2 мин / 5 мин);
Tagline варианты; Story of Why. Объём: 3–4 страницы.`,
    },
    {
      name:   "Digital-каналы привлечения и performance-маркетинг",
      prompt: `Разработай детальную стратегию платного и органического привлечения для "${project.name}".
Для каждого канала (SEA/PPC, Paid Social, Display, Native): объём аудитории; CAC-ориентир;
бюджет на старте vs. масштаб; ключевые метрики и KPI; план A/B-тестирования.
Расставь каналы по приоритету (ICE score). Объём: 3–4 страницы.`,
    },
    {
      name:   "Контент-маркетинг, SEO и органический рост",
      prompt: `Создай контент-стратегию и SEO-план для "${project.name}".
Включи: контент-пилларс; семантическое ядро (топ-20 ключевых слов с оценкой трафика);
контент-план на 3 месяца (форматы, частота, темы); стратегию link-building;
Email-маркетинг воронка; Social Media стратегия по платформам. Объём: 3–4 страницы.`,
    },
    {
      name:   "Партнёрства, реферральная программа и community",
      prompt: `Разработай стратегию партнёрств и вирального роста для "${project.name}".
Включи: типы партнёрств (strategic, channel, technology, co-marketing); топ-10 целевых партнёров;
условия партнёрской программы; реферральная механика (incl. экономика);
community-стратегия (Telegram, Discord, LinkedIn); Ambassador Program. Объём: 3–4 страницы.`,
    },
    {
      name:   "Воронка продаж, CRM и маркетинговые KPI",
      prompt: `Построй детальную воронку конверсий и систему KPI для "${project.name}".
Включи: TOFU/MOFU/BOFU с конкретными конверсиями; CRM-процесс и автоматизации;
Marketing Attribution модель; дашборд KPI (Awareness → Revenue);
North Star Metric; OKR для маркетинга на квартал. Таблицы. Объём: 3–4 страницы.`,
    },
  ];

  const blocks: ContentBlock[] = [];
  let   totalTokens = 0;

  for (const sub of subSections) {
    const result = await callAgent({ agentName: sub.name, system: BASE_SYSTEM, user: sub.prompt, ai, maxTokens: 8000 });
    blocks.push({ subTitle: result.subTitle, markdown: result.markdown, pageEstimate: result.pageEstimate, score: result.score });
    totalTokens += result.tokensUsed;
  }

  const sectionScore = Math.round(mean(blocks.map(b => b.score)));
  const totalPages   = blocks.reduce((s, b) => s + b.pageEstimate, 0);
  const sectionResult: SectionResult = {
    blocks, totalPages, score: sectionScore,
    agentMeta: { agent: "CMO-Marketing", model: "claude-sonnet-5", tokensUsed: totalTokens, durationMs: Date.now() - start },
  };

  await persistSection(db, reportId, "MARKETING", "Маркетинговая стратегия", sectionResult, 3);
  return sectionResult;
}

async function runOperationsTrack(
  ai: Anthropic,
  db: ReturnType<typeof getDb>,
  reportId: string,
  project: ProjectContext,
): Promise<SectionResult> {
  const start   = Date.now();
  const ctx     = buildContext(project);
  await markSectionProcessing(db, reportId, "OPERATIONS", "Операции и технологии", 4);

  const BASE_SYSTEM = `Ты COO + CTO — эксперт по построению масштабируемых операционных систем и технологических платформ.
Ты мыслишь процессами, метриками и архитектурой. Ответ ТОЛЬКО через инструмент submit_content.
Контекст проекта:\n${ctx}`;

  const subSections = [
    {
      name:   "Организационная структура и план найма",
      prompt: `Спроектируй организационную структуру для "${project.name}".
Включи: org chart (текущий и через 12/24/36 месяцев); критические роли для найма по приоритету;
должностные инструкции для топ-5 позиций; стратегию компенсации (equity + salary);
процесс онбординга и культура; KPI для каждой роли. Объём: 3–4 страницы.`,
    },
    {
      name:   "Технологический стек и архитектура платформы",
      prompt: `Разработай технологическую стратегию для "${project.name}".
Включи: выбор технологического стека с обоснованием; архитектуру платформы (monolith vs microservices);
инфраструктуру (cloud provider, DevOps, CI/CD); стратегию данных и аналитики;
безопасность и compliance (GDPR и др.); MVP vs. Scale архитектура; Tech Roadmap.
Объём: 4–5 страниц.`,
    },
    {
      name:   "Ключевые бизнес-процессы и операционная модель",
      prompt: `Разработай детальную операционную модель для "${project.name}".
Включи: карту ключевых процессов (value stream mapping); процессы привлечения и обслуживания клиентов;
Supply chain или Service Delivery процесс; операционные KPI и SLA;
автоматизация и инструменты (с оценкой ROI); Quality Management System. Объём: 3–4 страницы.`,
    },
    {
      name:   "Операционные KPI, OKR и система управления",
      prompt: `Создай систему управления эффективностью для "${project.name}".
Включи: Balanced Scorecard (Financial / Customer / Process / Learning);
OKR на квартал для каждой функции; Operational Dashboard (что мерить ежедневно/еженедельно/ежемесячно);
Meeting Cadence и Decision-Making Framework; риски операционной эффективности.
Таблицы KPI. Объём: 3–4 страницы.`,
    },
  ];

  const blocks: ContentBlock[] = [];
  let   totalTokens = 0;

  for (const sub of subSections) {
    const result = await callAgent({ agentName: sub.name, system: BASE_SYSTEM, user: sub.prompt, ai, maxTokens: 8000 });
    blocks.push({ subTitle: result.subTitle, markdown: result.markdown, pageEstimate: result.pageEstimate, score: result.score });
    totalTokens += result.tokensUsed;
  }

  const sectionScore = Math.round(mean(blocks.map(b => b.score)));
  const totalPages   = blocks.reduce((s, b) => s + b.pageEstimate, 0);
  const sectionResult: SectionResult = {
    blocks, totalPages, score: sectionScore,
    agentMeta: { agent: "COO+CTO", model: "claude-sonnet-5", tokensUsed: totalTokens, durationMs: Date.now() - start },
  };

  await persistSection(db, reportId, "OPERATIONS", "Операции и технологии", sectionResult, 4);
  return sectionResult;
}

async function runRisksTrack(
  ai: Anthropic,
  db: ReturnType<typeof getDb>,
  reportId: string,
  project: ProjectContext,
): Promise<SectionResult> {
  const start   = Date.now();
  const ctx     = buildContext(project);
  await markSectionProcessing(db, reportId, "RISKS", "Анализ рисков", 5);

  const BASE_SYSTEM = `Ты CRO (Chief Risk Officer) + юридический советник — эксперт управления рисками и compliance.
Будь честен и строг. Не скрывай проблемы. Ответ ТОЛЬКО через инструмент submit_content.
Контекст проекта:\n${ctx}`;

  const subSections = [
    {
      name:   "Стратегические и рыночные риски",
      prompt: `Проведи анализ стратегических рисков для "${project.name}".
Включи: риск неверной оценки рынка (PMF); конкурентные угрозы; технологическая устарелость;
зависимость от ключевых партнёров или клиентов; риски пивота; сценарии "black swan".
Матрица вероятность × влияние. Объём: 3–4 страницы.`,
    },
    {
      name:   "Финансовые и регуляторные риски",
      prompt: `Проанализируй финансовые и юридические риски для "${project.name}".
Включи: риск исчерпания финансирования; валютные и процентные риски;
регуляторные требования в отрасли "${project.industry}" (лицензии, GDPR, антимонопольное и т.д.);
налоговые риски; IP и патентные риски; судебные риски; страхование.
Объём: 3–4 страницы.`,
    },
    {
      name:   "Операционные и технологические риски",
      prompt: `Оцени операционные и технические риски для "${project.name}".
Включи: риск ключевых сотрудников (key man); кибербезопасность и data breach;
надёжность инфраструктуры (SLA, RPO/RTO); процессные сбои; vendor lock-in;
технический долг; масштабирование под нагрузкой. Объём: 3–4 страницы.`,
    },
    {
      name:   "Матрица рисков и план митигации",
      prompt: `Создай полную матрицу рисков с планом митигации для "${project.name}".
Включи: топ-15 рисков с оценкой (probability 1-5 × impact 1-5 = risk score);
для каждого риска: owner, дата review, стратегия (avoid/reduce/transfer/accept), конкретные действия;
Risk Appetite Statement; ключевые Risk Indicators (KRI). Таблица. Объём: 4–5 страниц.`,
    },
    {
      name:   "Кризисный план и антихрупкость",
      prompt: `Разработай Crisis Management Plan и стратегию антихрупкости для "${project.name}".
Включи: Playbook для топ-5 кризисных сценариев (потеря ключевого клиента, data breach, регуляторный запрет, etc.);
коммуникационная стратегия в кризис; Business Continuity Plan; резервные планы финансирования;
как строить антихрупкость через диверсификацию. Объём: 3–4 страницы.`,
    },
  ];

  const blocks: ContentBlock[] = [];
  let   totalTokens = 0;

  for (const sub of subSections) {
    const result = await callAgent({ agentName: sub.name, system: BASE_SYSTEM, user: sub.prompt, ai, maxTokens: 8000 });
    blocks.push({ subTitle: result.subTitle, markdown: result.markdown, pageEstimate: result.pageEstimate, score: result.score });
    totalTokens += result.tokensUsed;
  }

  // For risks, lower is better — invert the score for overall quality
  const avgRiskScore = mean(blocks.map(b => b.score));
  const sectionScore = Math.round(avgRiskScore); // Reuse score as "completeness of risk analysis"
  const totalPages   = blocks.reduce((s, b) => s + b.pageEstimate, 0);
  const sectionResult: SectionResult = {
    blocks, totalPages, score: sectionScore,
    agentMeta: { agent: "CRO", model: "claude-sonnet-5", tokensUsed: totalTokens, durationMs: Date.now() - start },
  };

  await persistSection(db, reportId, "RISKS", "Анализ рисков", sectionResult, 5);
  return sectionResult;
}

async function runRoadmapTrack(
  ai: Anthropic,
  db: ReturnType<typeof getDb>,
  reportId: string,
  project: ProjectContext,
): Promise<SectionResult> {
  const start   = Date.now();
  const ctx     = buildContext(project);
  await markSectionProcessing(db, reportId, "ROADMAP", "Стратегическая дорожная карта", 6);

  const BASE_SYSTEM = `Ты Chief Strategy Officer — эксперт стратегического планирования и execution.
Ты превращаешь амбиции в конкретные планы с датами, ответственными и метриками. Ответ ТОЛЬКО через инструмент submit_content.
Контекст проекта:\n${ctx}`;

  const subSections = [
    {
      name:   "90-дневный план запуска (Sprint Zero)",
      prompt: `Разработай детальный 90-дневный план запуска для "${project.name}".
Разбей на 3 спринта по 30 дней. Для каждого дня/недели: конкретные задачи, ответственный, критерии готовности.
Включи: найм, продукт, продажи, маркетинг, финансы, юридическое.
Определи critical path и зависимости. Объём: 4–5 страниц.`,
    },
    {
      name:   "Year 1: Квартальные milestone и OKR",
      prompt: `Создай подробный план Year 1 для "${project.name}" с квартальными OKR.
Для Q1/Q2/Q3/Q4: Objectives (3–4) и Key Results (3–4 per objective) с целевыми цифрами;
ключевые milestones каждого квартала; бюджет; headcount; продуктовые релизы.
Таблица с трекингом статуса. Объём: 4–5 страниц.`,
    },
    {
      name:   "Year 2: Фаза роста и масштабирование",
      prompt: `Разработай стратегию роста Year 2 для "${project.name}".
Включи: стратегию масштабирования (Geographic / Product / Customer expansion);
ключевые инвестиции и найм; продуктовую roadmap; расширение каналов;
цели по выручке и клиентской базе; Series A подготовка (если применимо).
Объём: 3–4 страницы.`,
    },
    {
      name:   "Year 3: Доминирование на рынке и инвестиционные опционы",
      prompt: `Определи долгосрочную стратегию и опционы выхода для "${project.name}" к концу Year 3.
Включи: рыночная доля цель; M&A стратегия (покупать или быть купленными); IPO готовность;
международная экспансия; диверсификация продуктового портфеля;
стратегические партнёрства уровня enterprise; Exit Scenarios (IPO / Strategic Sale / PE Buyout).
Объём: 3–4 страницы.`,
    },
    {
      name:   "Технологическая и продуктовая дорожная карта",
      prompt: `Создай детальную продуктовую roadmap для "${project.name}" на 3 года.
Разбей на: Core Features (MVP); Growth Features (Q2–Q4 Y1); Platform Features (Y2); Scale Features (Y3).
Для каждой фичи: бизнес-обоснование, приоритет (RICE score), effort, impact.
Включи API/Integration roadmap и Data roadmap. Объём: 4–5 страниц.`,
    },
  ];

  const blocks: ContentBlock[] = [];
  let   totalTokens = 0;

  for (const sub of subSections) {
    const result = await callAgent({ agentName: sub.name, system: BASE_SYSTEM, user: sub.prompt, ai, maxTokens: 8000 });
    blocks.push({ subTitle: result.subTitle, markdown: result.markdown, pageEstimate: result.pageEstimate, score: result.score });
    totalTokens += result.tokensUsed;
  }

  const sectionScore = Math.round(mean(blocks.map(b => b.score)));
  const totalPages   = blocks.reduce((s, b) => s + b.pageEstimate, 0);
  const sectionResult: SectionResult = {
    blocks, totalPages, score: sectionScore,
    agentMeta: { agent: "CSO", model: "claude-sonnet-5", tokensUsed: totalTokens, durationMs: Date.now() - start },
  };

  await persistSection(db, reportId, "ROADMAP", "Стратегическая дорожная карта", sectionResult, 6);
  return sectionResult;
}

async function runSummaryTrack(
  ai: Anthropic,
  db: ReturnType<typeof getDb>,
  reportId: string,
  project: ProjectContext,
  sectionResults: SectionResult[],
): Promise<SectionResult> {
  const start = Date.now();
  await markSectionProcessing(db, reportId, "SUMMARY", "Исполнительное резюме", 0);

  const sectionsContext = sectionResults
    .map((r, i) => {
      const titles = ["Финансы", "Рынок", "Маркетинг", "Операции", "Риски", "Дорожная карта"];
      return `## ${titles[i] ?? `Раздел ${i + 1}`} (оценка: ${r.score}/100)\n` +
        r.blocks.slice(0, 2).map(b => `### ${b.subTitle}\n${b.markdown.slice(0, 800)}...`).join("\n\n");
    })
    .join("\n\n---\n\n");

  const ctx = buildContext(project);

  const BASE_SYSTEM = `Ты CEO — стратегический лидер и синтезатор. Ты создаёшь итоговое видение на основе глубокого анализа всех департаментов.
Ты пишешь ёмко, по существу, без воды. Ответ ТОЛЬКО через инструмент submit_content.
Контекст проекта:\n${ctx}`;

  const subSections = [
    {
      name:   "Исполнительное резюме и ключевые выводы",
      prompt: `На основе полного анализа всех разделов напиши Исполнительное резюме для "${project.name}".
Включи: Vision Statement одной мощной фразой; ключевые выводы из каждого раздела (финансы, рынок, операции, риски, roadmap);
критические факторы успеха; главные вызовы; рекомендуемые немедленные действия топ-3.
Сводные данные из разделов:\n${sectionsContext.slice(0, 3000)}\nОбъём: 4–5 страниц.`,
    },
    {
      name:   "Стратегические рекомендации совета директоров",
      prompt: `Как CEO, сформулируй стратегические рекомендации для "${project.name}".
Дай 7–10 конкретных стратегических рекомендаций с приоритетом и обоснованием.
Включи: must-do в первые 30 дней; стратегические ставки на 12 месяцев; красные линии (что НЕЛЬЗЯ делать);
решения, которые нужно принять немедленно vs. можно отложить.
Объём: 3–4 страницы.`,
    },
    {
      name:   "Инвестиционный тезис и заключение",
      prompt: `Напиши финальное заключение и инвестиционный тезис для "${project.name}".
Включи: почему этот проект выиграет (unfair advantages); рыночный timing; команда и исполнение;
финансовый потенциал для инвестора; что делает этот проект уникальным;
финальный призыв к действию. Общий вывод по отчёту.
Объём: 2–3 страницы.`,
    },
  ];

  const blocks: ContentBlock[] = [];
  let   totalTokens = 0;

  for (const sub of subSections) {
    const result = await callAgent({ agentName: sub.name, system: BASE_SYSTEM, user: sub.prompt, ai, maxTokens: 6000 });
    blocks.push({ subTitle: result.subTitle, markdown: result.markdown, pageEstimate: result.pageEstimate, score: result.score });
    totalTokens += result.tokensUsed;
  }

  const sectionScore = Math.round(mean(blocks.map(b => b.score)));
  const totalPages   = blocks.reduce((s, b) => s + b.pageEstimate, 0);
  const sectionResult: SectionResult = {
    blocks, totalPages, score: sectionScore,
    agentMeta: { agent: "CEO", model: "claude-sonnet-5", tokensUsed: totalTokens, durationMs: Date.now() - start },
  };

  await persistSection(db, reportId, "SUMMARY", "Исполнительное резюме", sectionResult, 0);
  return sectionResult;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function startAiOrchestrator(
  reportId:  string,
  projectId: string,
  project:   ProjectContext,
): Promise<void> {
  const pipelineStart = Date.now();
  const ai  = getAi();
  const db  = getDb();

  if (process.env.NODE_ENV !== "production") console.log(`[orchestrator] Starting report ${reportId} for project "${project.name}"`);

  // ── Phase 1: Run 6 department tracks in parallel ───────────────────────────
  const [
    financeResult,
    marketResult,
    marketingResult,
    operationsResult,
    risksResult,
    roadmapResult,
  ] = await Promise.allSettled([
    runFinanceTrack(ai, db, reportId, project),
    runMarketTrack(ai, db, reportId, project),
    runMarketingTrack(ai, db, reportId, project),
    runOperationsTrack(ai, db, reportId, project),
    runRisksTrack(ai, db, reportId, project),
    runRoadmapTrack(ai, db, reportId, project),
  ]);

  // Extract successful results (failed sections get a zero-score placeholder)
  function unwrap(settled: PromiseSettledResult<SectionResult>, fallbackLabel: string): SectionResult {
    if (settled.status === "fulfilled") return settled.value;
    console.error(`[orchestrator] Section "${fallbackLabel}" failed:`, settled.reason);
    return { blocks: [], totalPages: 0, score: 0, agentMeta: { agent: fallbackLabel, model: "", tokensUsed: 0, durationMs: 0 } };
  }

  const phase1Results = [
    unwrap(financeResult,    "FINANCE"),
    unwrap(marketResult,     "MARKET"),
    unwrap(marketingResult,  "MARKETING"),
    unwrap(operationsResult, "OPERATIONS"),
    unwrap(risksResult,      "RISKS"),
    unwrap(roadmapResult,    "ROADMAP"),
  ];

  // ── Phase 2: CEO summary — synthesises across all sections ────────────────
  const summaryResult = await runSummaryTrack(ai, db, reportId, project, phase1Results).catch(err => {
    console.error("[orchestrator] Summary track failed:", err);
    return { blocks: [], totalPages: 0, score: 0, agentMeta: { agent: "CEO", model: "", tokensUsed: 0, durationMs: 0 } };
  });

  // ── Compute overall score (math mean across all 7 sections) ───────────────
  const allScores   = [...phase1Results, summaryResult].map(r => r.score).filter(s => s > 0);
  const overallScore = allScores.length ? Math.round(mean(allScores)) : 0;
  const totalPages   = [...phase1Results, summaryResult].reduce((s, r) => s + r.totalPages, 0);
  const durationMs   = Date.now() - pipelineStart;

  // ── Mark report COMPLETED ─────────────────────────────────────────────────
  const { error: updateErr } = await db
    .from("reports")
    .update({
      gen_status:    "COMPLETED",
      status:        "REVIEW",
      overall_score: overallScore,
      total_pages:   totalPages,
      summary:       summaryResult.blocks[0]?.markdown?.slice(0, 2000) ?? null,
      metadata:      JSON.stringify({
        completedAt: new Date().toISOString(),
        durationMs,
        overallScore,
        totalPages,
        sectionCount: 7,
        projectName:  project.name,
      }),
    })
    .eq("id", reportId);

  if (updateErr) {
    console.error("[orchestrator] Failed to mark report COMPLETED:", updateErr);
  }

  if (process.env.NODE_ENV !== "production") console.log(
    `[orchestrator] Report ${reportId} completed — score: ${overallScore}/100, pages: ${totalPages}, time: ${(durationMs / 1000).toFixed(1)}s`,
  );
}
