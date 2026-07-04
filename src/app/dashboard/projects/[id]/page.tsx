"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface ProjectData {
  name: string; subtitle: string; score: number; status: string;
  scores: { label: string; value: number }[];
  summary: string;
  financials: { label: string; value: string; numeric?: number }[];
  market: { label: string; value: string; numeric?: number }[];
  risks: { level: string; title: string; desc: string }[];
}

// ─── 20 DEMO AGENTS ───────────────────────────────────────────────────────────

const DEMO_AGENTS = [
  { id:"ceo", role:"CEO", name:"Victoria Sterling", color:"#7A5CFF", title:"Генеральный директор", score:82,
    opinion:"Проект имеет чёткий стратегический потенциал в нише с растущим спросом. Бизнес-модель масштабируема и защищена за счёт сетевого эффекта. Рекомендую сконцентрироваться на одном ICP в первые 6 месяцев работы. Ключевой риск — расфокусировка в попытке охватить все сегменты сразу. Команда должна иметь чёткое распределение ролей до запуска. Инвестиции пропорционально делятся между продуктом и привлечением клиентов. Партнёрства с дополнительными игроками рынка существенно ускорят рост. OKR должны быть жёстко привязаны к финансовым целям на каждый квартал. Выход на операционную прибыль реален в горизонте 18–24 месяцев при правильном исполнении." },
  { id:"cfo", role:"CFO", name:"James Hartley", color:"#5A8DFF", title:"Финансовый директор", score:79,
    opinion:"Финансовая структура проекта в целом корректна, однако требует доработки в части прогнозирования выручки. Burn rate следует оптимизировать до уровня максимум 15% месячного MRR. CAC нужно снизить на 20% для достижения прибыльности в плановые сроки. Создайте runway минимум на 18 месяцев до следующего раунда привлечения. P&L должен выйти в плюс не позднее месяца 20 после запуска. Revenue-based financing стоит рассмотреть как альтернативу equity dilution. Unit economics жизнеспособны при достижении масштаба 1000+ активных клиентов. Финансовые KPI необходимо мониторить еженедельно для оперативного реагирования." },
  { id:"coo", role:"COO", name:"Elena Vasquez", color:"#00E7A7", title:"Операционный директор", score:76,
    opinion:"Операционная стратегия требует немедленной проработки процессов доставки ценности клиентам. Без чётких SOP команда потеряет 30–40% эффективности при масштабировании. Автоматизация рутинных задач должна начаться с первого месяца работы компании. KPI по операционной эффективности должны отслеживаться еженедельно на всех уровнях. Время отклика на запросы клиентов является критическим показателем NPS. Операционные расходы реалистично снизить на 18–25% при выходе на объём. Первые 3 месяца — критический период выстраивания операционной дисциплины. Поставщики и партнёры требуют формального договорного оформления до старта." },
  { id:"cmo", role:"CMO", name:"Sarah Chen", color:"#FF5470", title:"Директор по маркетингу", score:84,
    opinion:"Рыночное позиционирование требует более чёткой дифференциации от ключевых конкурентов. Контент-маркетинг рекомендую как основной acquisition channel на старте с минимальным бюджетом. Brand voice должен быть задокументирован до первого публичного контакта с аудиторией. CAC через органику может быть в 3–5 раз ниже paid при правильной SEO стратегии. Email retention программа способна снизить churn на 15–20% при правильной реализации. Партнёрство с инфлюенсерами в нише даст быстрый initial traction на первых 90 дней. Ретаргетинг должен быть настроен с первого месяца присутствия в платных каналах. A/B тестирование — обязательная практика для всех acquisition гипотез без исключения." },
  { id:"cto", role:"CTO", name:"David Park", color:"#a78bfa", title:"Технический директор", score:71,
    opinion:"Технологический стек выбран адекватно стадии и текущему масштабу проекта. Главный риск — накопление технического долга при агрессивном росте без рефакторинга. Архитектура должна быть спроектирована с расчётом на 10x текущей нагрузки системы. DevOps культура и CI/CD — обязательны с первого дня разработки команды. Безопасность данных требует приоритизации, особенно при работе с пользовательскими данными. Мониторинг и alerting должны быть настроены до производственного launch продукта. API-first подход обеспечит гибкость интеграций и будущего масштабирования системы. Инвестиция в автотесты окупится уже на 3-м месяце активной разработки продукта." },
  { id:"ba", role:"Аналитик", name:"Michael Torres", color:"#FFB800", title:"Бизнес-аналитик", score:80,
    opinion:"Рыночный анализ подтверждает наличие реального спроса в целевом сегменте аудитории. Конкуренты не полностью закрывают pain point, который адресует данный проект на рынке. TAM существенен, но реалистичная целевая доля рынка в 3 года составляет 1–3%. Тренды рынка положительные: CAGR 15–25% прогнозируется в следующие 5 лет. Барьеры входа умеренные — window of opportunity открыт для быстрого движения. Поведение потребителей меняется в пользу данного решения по всем ключевым метрикам. Сезонность требует отдельного учёта в финансовой модели при прогнозировании. Данные должны собираться с первого дня для обучения будущих аналитических моделей." },
  { id:"legal", role:"Юрист", name:"Anna Petrova", color:"#94a3b8", title:"Юридический советник", score:68,
    opinion:"Юридическая структура проекта требует проверки на соответствие регуляторным требованиям. Обработка персональных данных пользователей должна соответствовать GDPR и локальным нормам. Регистрация товарного знака необходима до публичного запуска продукта на рынок. Договоры с подрядчиками и сотрудниками должны быть составлены с полноценными NDA. Интеллектуальная собственность должна быть оформлена на юридическое лицо, а не физических лиц. Пользовательское соглашение и политика конфиденциальности являются юридическими требованиями. Потенциальные регуляторные риски в отрасли необходимо задокументировать заблаговременно. Создайте юридический резерв размером 5–10% операционного бюджета для минимизации рисков." },
  { id:"sales", role:"Продажи", name:"Robert Kim", color:"#fb923c", title:"Директор по продажам", score:77,
    opinion:"Воронка продаж требует чёткого определения метрик на каждом этапе customer journey. Conversion rate от лида к клиенту — ключевой KPI, который нужно отслеживать с первого дня. Сегментация по ICP позволит сфокусировать усилия на наиболее конвертируемых лидах. Ценовая стратегия выглядит конкурентоспособно, однако требует рыночного тестирования. CRM система обязательна с появления первого потенциального клиента в pipeline. Реферальная программа может обеспечить до 30% новых клиентов при правильной механике. Sales playbook должен быть документирован до найма первого sales-менеджера в команду. Среднее время закрытия сделки нужно оптимизировать к концу второго квартала работы." },
  { id:"hr", role:"HR", name:"Lisa Johnson", color:"#f472b6", title:"Директор по персоналу", score:72,
    opinion:"Команда — ключевое конкурентное преимущество на ранней стадии развития бизнеса. Культура компании закладывается в первые 10 нанятых сотрудников навсегда. Recruitment pipeline должен быть активным постоянно, а не только при острой необходимости. Onboarding процесс влияет на retention в первые 90 дней критически и определяет лояльность. Компенсационные пакеты должны быть конкурентными в рамках стадии и рынка труда. Employee NPS — важный ранний индикатор проблем с культурой внутри организации. Работа с выгоранием должна быть приоритетом для leadership с первого месяца. Разнообразие в команде коррелирует с качеством решений и уровнем инноваций." },
  { id:"product", role:"Продукт", name:"Chris Wang", color:"#22d3ee", title:"Продукт-менеджер", score:85,
    opinion:"Product-market fit — единственная метрика, которая имеет критическое значение на данной стадии. Пользовательский research должен проводиться еженедельно в первые 3 месяца без исключений. MVP должен быть запущен максимально быстро для получения реального рыночного feedback. Retention rate на 30-й день — главный индикатор достижения product-market fit. Roadmap должен строиться исключительно на основе данных и пользовательского feedback. Feature prioritization по ICE-score предотвратит распыление ресурсов на ненужные функции. NPS должен отслеживаться с первого активного пользователя продукта без задержки. Activation rate является критическим показателем эффективности onboarding процесса." },
  { id:"risk", role:"Риски", name:"Igor Smirnov", color:"#ef4444", title:"Риск-менеджер", score:65,
    opinion:"Профиль рисков проекта классифицирован как умеренно-высокий для текущей стадии идеи. Финансовый риск является главным: 60% стартапов умирают именно от нехватки денег. Рыночный риск снижается хорошим пониманием конкурентной среды и сегментации. Операционный риск связан с критической зависимостью от ключевых сотрудников компании. Технологический риск умеренный при правильном выборе стека и команды разработки. Регуляторный риск требует мониторинга в 6-месячном горизонте планирования. Сценарный анализ — обязательный инструмент финансового и операционного планирования. Резервный фонд в размере 20% бюджета минимизирует black swan сценарии развития." },
  { id:"growth", role:"Growth", name:"Emma Davis", color:"#84cc16", title:"Growth Hacker", score:88,
    opinion:"Самый быстрый путь к росту — нахождение одного масштабируемого acquisition channel в первые 3 месяца. Виральный коэффициент выше 1.0 кардинально трансформирует экономику всего проекта. Экспериментальный подход с еженедельными growth спринтами даёт наилучшие результаты на практике. Product-led growth возможен при правильном дизайне freemium воронки продукта. Community-led growth является самым дешёвым sustainable каналом привлечения клиентов. SEO при правильной стратегии обеспечивает ROI 10x+ в горизонте 12 месяцев работы. Referral loop должен быть зашит непосредственно в продукт, а не прикручен снаружи. Данные из первых 100 клиентов — золото для формирования долгосрочной growth стратегии." },
  { id:"data", role:"Data", name:"Alex Chen", color:"#06b6d4", title:"Дата-саентист", score:74,
    opinion:"Данные — главный актив, который нужно начинать собирать с самого первого дня работы. Структура данных должна быть спроектирована под будущие машинного обучения применения. Customer segmentation на основе поведенческих данных даст долгосрочное конкурентное преимущество. Churn prediction model начинает окупаться при базе от 500 активных клиентов системы. A/B тест инфраструктура необходима для масштабирования экспериментальной культуры. LTV prediction улучшает CAC оптимизацию на 30–40% при правильной реализации. Персонализация на основе данных повышает retention в среднем на 15–25% в первый год. Data-driven culture является конкурентным moat, который сложно скопировать конкурентам." },
  { id:"brand", role:"Бренд", name:"Sofia Martinez", color:"#e879f9", title:"Бренд-менеджер", score:79,
    opinion:"Brand positioning должен быть чётким и различимым на насыщенном конкурентами рынке. Визуальная идентичность компании создаёт первое впечатление, которое невозможно исправить второй раз. Tone of voice бренда должен точно соответствовать ценностям целевой аудитории продукта. Consistency во всех touchpoints является критической для построения доверия и лояльности. Brand equity строится медленно, но является долгосрочным стратегическим активом компании. Storytelling вокруг основателей и миссии работает значительно лучше корпоративного контента. Social proof в виде отзывов и кейсов должен появиться в первые 3 месяца присутствия. Brand guidelines обязательны до найма первого маркетолога и подрядчиков по контенту." },
  { id:"cs", role:"CS", name:"Tom Wilson", color:"#4ade80", title:"Customer Success", score:73,
    opinion:"Customer success — единственный отдел, который непосредственно влияет на retention метрики. Onboarding должен привести клиента к первой ценности за 7 дней максимально. Churn начинается задолго до отказа — триггеры нужно выявить в первые 3 месяца работы. Проактивный outreach при снижении активности снижает churn на 20–30% по данным индустрии. NPS опрос должен проводиться через 30, 60 и 90 дней после начала использования. Customer feedback является лучшим источником идей для product roadmap компании. Expansion revenue через upsell требует предварительного успеха клиента в текущем плане. SLA должен быть задокументирован и неукоснительно соблюдаться с первого клиента." },
  { id:"eng", role:"Инжиниринг", name:"Pavel Novikov", color:"#7dd3fc", title:"Руководитель разработки", score:70,
    opinion:"Технический долг — главная угроза скорости разработки после первого года активного роста. CI/CD pipeline должен быть настроен до первого production деплоя в любом случае. Code review культура предотвращает критические ошибки в production на ранней стадии. Test coverage минимум 70% является обязательным стандартом качества для команды. Документация кода должна быть обязательной практикой всей инженерной команды с первого спринта. Мониторинг и observability — первый приоритет сразу после запуска производственного окружения. Security-first подход в архитектурных решениях защищает от дорогостоящих инцидентов. Incident response playbook нужен до появления первого платящего клиента в системе." },
  { id:"invest", role:"Инвестиции", name:"George Black", color:"#fde68a", title:"Инвестиционный аналитик", score:76,
    opinion:"С точки зрения инвестиционной привлекательности проект находится в зелёной зоне оценки. Comparable companies показывают мультипликаторы 5–15x revenue при правильной бизнес-модели. ROI для seed инвесторов реалистичен при выходе через 3–5 лет при текущих метриках. Рынок имеет аналогичные успешные прецеденты с сопоставимыми входными параметрами. EBITDA margin при масштабировании должна превышать 20% для привлекательности. Burn multiple ниже 2.0 свидетельствует об эффективном расходовании привлечённого капитала. M&A потенциал компании значителен при достижении лидерства в целевой нише рынка. Investor updates должны быть ежемесячными и содержать 5 ключевых операционных метрик." },
  { id:"strategy", role:"Стратегия", name:"Monica Lee", color:"#c4b5fd", title:"Стратегический консультант", score:83,
    opinion:"Стратегическое позиционирование компании недостаточно дифференцировано от ключевых конкурентов. Sustainable competitive moat требует фокуса на одном из трёх: cost leadership, differentiation или niche. Blue ocean стратегия возможна при правильном пересмотре ценностного предложения компании. Стратегический фокус на первые 18 месяцев критически важен для выживания и роста. Конкурентный анализ должен обновляться ежеквартально для актуальности стратегических решений. Barriers to entry нужно активно строить и укреплять с первого дня операционной деятельности. Ecosystem стратегия через партнёрства существенно ускорит рост и снизит стоимость привлечения. Долгосрочная стратегия должна балансировать между Horizon 1 и Horizon 2 развития бизнеса." },
  { id:"ops", role:"Операции", name:"Dmitry Volkov", color:"#6ee7b7", title:"Менеджер операций", score:69,
    opinion:"Операционная эффективность является фундаментом устойчивого масштабирования любого бизнеса. Процессы должны быть задокументированы и стандартизированы до найма 5-го сотрудника команды. Автоматизация рутинных задач сэкономит 20–30% операционного времени всей команды. Vendor management требует формализации с появления первого значимого подрядчика. KPI дерево должно быть каскадировано на каждую функцию и роль в организации. Операционные ритмы — ежедневные standup, еженедельные reviews — являются критически важными. Quality control процессы влияют на NPS и retention клиентов напрямую и ощутимо. Операционная маржа является главным индикатором здоровья бизнеса на уровне unit economics." },
  { id:"research", role:"Исследования", name:"Nina Kozlov", color:"#fdba74", title:"Аналитик рынка", score:77,
    opinion:"Рыночные данные подтверждают наличие устойчивого потребительского спроса в целевом сегменте. Тенденции рынка благоприятны: растущий интерес к категории и снижение барьеров для входа. Потребительское поведение смещается в направлении, совпадающем с ценностным предложением компании. Конкурентная карта показывает незанятую нишу в средней ценовой категории рынка. CAGR в 15–25% на следующие 5 лет создаёт благоприятное окно возможностей для запуска. Сезонность рынка требует обязательного учёта при планировании cash flow и маркетинга. Географическая экспансия возможна после достижения PMF в локальном рынке присутствия. Исследования показывают высокую готовность платить среди целевой аудитории при правильном позиционировании." },
];

// ─── PROJECT STATIC DATA ─────────────────────────────────────────────────────

const PROJECTS_DATA: Record<string, ProjectData> = {
  demo: {
    name: "AI-Powered Fitness Platform", subtitle: "SaaS · Mobile App · 8 AI Executives", score: 87, status: "Завершён",
    scores: [{ label: "Рыночный потенциал", value: 91 }, { label: "Финансовая устойчивость", value: 83 }, { label: "Реализуемость", value: 87 }, { label: "Конкурентное преимущество", value: 79 }],
    summary: "AI-Powered Fitness Platform — высокопотенциальный продукт в быстрорастущем рынке персональных тренировок ($4.2B). Сильная дифференциация через AI-персонализацию. Рекомендуется B2C модель с freemium воронкой и монетизацией через Premium подписку ($19.99/мес).",
    financials: [{ label: "Прогноз выручки (год 1)", value: "$240K", numeric: 240 }, { label: "Прогноз выручки (год 3)", value: "$2.4M", numeric: 2400 }, { label: "Точка безубыточности", value: "18 месяцев" }, { label: "LTV пользователя", value: "$180" }, { label: "CAC", value: "$22" }, { label: "LTV/CAC", value: "8.2x" }],
    market: [{ label: "TAM (общий рынок)", value: "$4.2B", numeric: 4200 }, { label: "SAM (достижимый)", value: "$840M", numeric: 840 }, { label: "SOM (целевой)", value: "$42M", numeric: 42 }, { label: "Рост рынка", value: "+24%/год" }],
    risks: [{ level: "high", title: "Высокая конкуренция", desc: "MyFitnessPal, Noom, Peloton — крупные игроки с большими бюджетами." }, { level: "medium", title: "Стоимость привлечения", desc: "CAC может вырасти при масштабировании платных каналов." }, { level: "low", title: "Технический риск", desc: "AI модели требуют постоянного обучения и качественных данных." }],
  },
  "2": {
    name: "SaaS Invoice Platform", subtitle: "SaaS · FinTech · 8 AI Executives", score: 91, status: "Завершён",
    scores: [{ label: "Рыночный потенциал", value: 94 }, { label: "Финансовая устойчивость", value: 90 }, { label: "Реализуемость", value: 88 }, { label: "Конкурентное преимущество", value: 85 }],
    summary: "SaaS Invoice Platform решает реальную боль 59M фрилансеров в США. Высокая retention (78%) в категории, предсказуемый MRR. Рекомендуется запуск с фокусом на дизайн-агентства и IT-консультантов как первичный ICP.",
    financials: [{ label: "Прогноз выручки (год 1)", value: "$180K", numeric: 180 }, { label: "Прогноз выручки (год 3)", value: "$1.8M", numeric: 1800 }, { label: "Точка безубыточности", value: "12 месяцев" }, { label: "LTV пользователя", value: "$540" }, { label: "CAC", value: "$48" }, { label: "LTV/CAC", value: "11.2x" }],
    market: [{ label: "TAM (общий рынок)", value: "$2.1B", numeric: 2100 }, { label: "SAM (достижимый)", value: "$420M", numeric: 420 }, { label: "SOM (целевой)", value: "$21M", numeric: 21 }, { label: "Рост рынка", value: "+18%/год" }],
    risks: [{ level: "medium", title: "FreshBooks / QuickBooks", desc: "Доминирующие игроки с высокой узнаваемостью бренда." }, { level: "low", title: "Интеграции", desc: "Нужны интеграции с банками и платёжными системами." }, { level: "low", title: "Регуляторные требования", desc: "Разные требования к счетам в разных странах." }],
  },
  "3": {
    name: "Local Restaurant Chain", subtitle: "Restaurant · Food · 5 AI Executives", score: 72, status: "В работе",
    scores: [{ label: "Рыночный потенциал", value: 75 }, { label: "Финансовая устойчивость", value: 68 }, { label: "Реализуемость", value: 74 }, { label: "Конкурентное преимущество", value: 70 }],
    summary: "Стратегия расширения ресторанной сети анализируется. Умеренный потенциал в конкурентном рынке fast-casual.",
    financials: [{ label: "Стартовые инвестиции", value: "$350K" }, { label: "Маржинальность", value: "~15-20%" }, { label: "Food cost %", value: "~28-32%" }],
    market: [{ label: "TAM (общий рынок)", value: "$890M", numeric: 890 }, { label: "SAM (достижимый)", value: "$89M", numeric: 89 }, { label: "SOM (целевой)", value: "$4.5M", numeric: 4.5 }, { label: "Рост рынка", value: "+9%/год" }],
    risks: [{ level: "high", title: "Операционная сложность", desc: "Управление несколькими точками требует систем." }, { level: "high", title: "Высокая конкуренция", desc: "Насыщенный рынок с низкими барьерами входа." }, { level: "medium", title: "Рост аренды", desc: "Стоимость коммерческой недвижимости растёт." }],
  },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function buildProjectFromUser(raw: Record<string, unknown>): ProjectData {
  const score = Number(raw.score) || 78;
  const rawRevenue = raw.revenue ? String(raw.revenue) : null;
  const revenueDisplay = rawRevenue && rawRevenue.length > 0 && rawRevenue !== "0"
    ? rawRevenue.startsWith("$") ? rawRevenue : `$${rawRevenue}` : `$${(score * 3).toFixed(0)}K`;
  return {
    name: String(raw.name || "Проект"),
    subtitle: `${raw.industry || "Бизнес"} · ${raw.stage || "Идея"} · AI Executive Board`,
    score, status: "Завершён",
    scores: [
      { label: "Рыночный потенциал", value: Math.min(99, score + 4) },
      { label: "Финансовая устойчивость", value: Math.max(50, score - 6) },
      { label: "Реализуемость", value: Math.min(99, score + 1) },
      { label: "Конкурентное преимущество", value: Math.max(50, score - 8) },
    ],
    summary: `${raw.name} — бизнес-идея в сфере ${raw.industry || "вашей индустрии"}. ${raw.description ? String(raw.description).slice(0, 200) : ""} AI-команда проанализировала проект и подготовила стратегию.`,
    financials: [
      { label: "Прогноз выручки (год 1)", value: revenueDisplay, numeric: score * 3 },
      { label: "Прогноз выручки (год 3)", value: `$${(score * 0.03).toFixed(1)}M`, numeric: score * 30 },
      { label: "Точка безубыточности", value: score > 80 ? "14 месяцев" : "20 месяцев" },
      { label: "LTV пользователя", value: `$${(score * 2).toFixed(0)}` },
      { label: "CAC", value: `$${Math.floor(score / 3)}` },
      { label: "LTV/CAC", value: `${(score / 15).toFixed(1)}x` },
      { label: "Таймфрейм", value: `${raw.timeframe || "12"} месяцев` },
    ],
    market: [
      { label: "TAM (общий рынок)", value: raw.market ? String(raw.market) : `$${(score * 50).toFixed(0)}M`, numeric: score * 50 },
      { label: "SAM (достижимый)", value: `$${(score * 10).toFixed(0)}M`, numeric: score * 10 },
      { label: "SOM (целевой)", value: `$${score}M`, numeric: score },
      { label: "Рост рынка", value: raw.growth ? String(raw.growth) : `+${Math.floor(score / 7)}%/год` },
    ],
    risks: [
      { level: "medium", title: "Конкурентная среда", desc: `В сфере ${raw.industry || "вашей индустрии"} присутствуют устоявшиеся игроки с ресурсами.` },
      { level: score > 80 ? "low" : "medium", title: "Привлечение клиентов", desc: "Стоимость привлечения может вырасти при масштабировании." },
      { level: "low", title: "Операционные риски", desc: "Требуется выстроить процессы и команду до масштабирования." },
    ],
  };
}

// ─── ANIMATION HOOK ───────────────────────────────────────────────────────────

function useAnimated(delay = 0) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return ready;
}

// ─── ANIMATED GAUGE ───────────────────────────────────────────────────────────

function AnimatedGauge({ score, color, size = 72, delay = 0, showLabel = true }:
  { score: number; color: string; size?: number; delay?: number; showLabel?: boolean }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setVal(score), delay + 80);
    return () => clearTimeout(t);
  }, [score, delay]);

  const cx = size / 2, cy = size / 2;
  const r = size * 0.37;
  const circ = 2 * Math.PI * r;
  const maxDash = circ * 0.75;
  const drawn = (val / 100) * maxDash;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ overflow: "visible" }}>
      <g transform={`rotate(-135 ${cx} ${cy})`}>
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="rgba(255,255,255,0.07)" strokeWidth={size * 0.075}
          strokeDasharray={`${maxDash} ${circ}`} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color}
          strokeWidth={size * 0.075}
          strokeDasharray={`${drawn} ${circ}`} strokeLinecap="round"
          style={{
            transition: `stroke-dasharray 1.4s cubic-bezier(0.34,1.1,0.64,1) ${delay}ms`,
            filter: `drop-shadow(0 0 ${size * 0.04}px ${color})`,
          }} />
      </g>
      <text x={cx} y={cy + (showLabel ? size * 0.06 : size * 0.09)} textAnchor="middle"
        fontSize={size * 0.26} fontWeight="800" fill="white"
        fontFamily="ui-monospace,monospace">{val}</text>
      {showLabel && (
        <text x={cx} y={cy + size * 0.22} textAnchor="middle"
          fontSize={size * 0.09} fill="rgba(255,255,255,0.25)"
          fontFamily="system-ui" letterSpacing="1">БАЛЛ</text>
      )}
    </svg>
  );
}

// ─── ANIMATED BAR ─────────────────────────────────────────────────────────────

function AnimatedBar({ value, color, delay = 0, height = 6 }:
  { value: number; color: string; delay?: number; height?: number }) {
  const animated = useAnimated(delay + 100);
  return (
    <div style={{ height, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
      <div style={{
        height: "100%", width: animated ? `${value}%` : "0%",
        background: `linear-gradient(90deg, ${color}, ${color}99)`,
        transition: `width 1.3s cubic-bezier(0.34,1.1,0.64,1) ${delay}ms`,
        borderRadius: 99,
        boxShadow: `0 0 8px ${color}50`,
      }} />
    </div>
  );
}

// ─── ANIMATED AREA CHART ──────────────────────────────────────────────────────

function DetailedRevenueChart({ financials, timeframe }: {
  financials: { label: string; value: string; numeric?: number }[];
  timeframe?: string;
}) {
  const animated = useAnimated(100);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const yr1 = financials.find(f => f.label.toLowerCase().includes("год 1") || f.label.toLowerCase().includes("year 1"));
  const yr3 = financials.find(f => f.label.toLowerCase().includes("год 3") || f.label.toLowerCase().includes("year 3"));
  const v1 = yr1?.numeric ?? 100;
  const v3 = yr3?.numeric ?? v1 * 10;

  // Generate 28 monthly data points with accelerating growth curve
  const months = 28;
  const pts28 = Array.from({ length: months }, (_, i) => {
    const t = i / (months - 1);
    const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    return Math.round(v1 + (v3 - v1) * eased);
  });

  // Date labels starting 6 months before "now"
  const now = new Date(2026, 0, 1);
  const RU_MONTHS = ["ЯНВ","ФЕВ","МАР","АПР","МАЙ","ИЮН","ИЮЛ","АВГ","СЕН","ОКТ","НОЯ","ДЕК"];
  const dateLabels = Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i - 2, 1);
    return `${RU_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  });

  const W = 600, H = 220;
  const PL = 54, PR = 18, PT = 16, PB = 36;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;
  const maxV = Math.max(...pts28);
  const yTicks = 5;

  const toX = (i: number) => PL + (i / (months - 1)) * chartW;
  const toY = (v: number) => PT + chartH - (v / maxV) * chartH;

  const linePath = pts28.map((v, i) => {
    const x = toX(i), y = toY(v);
    if (i === 0) return `M ${x} ${y}`;
    const px = toX(i - 1), py = toY(pts28[i - 1]);
    const cx = (px + x) / 2;
    return `C ${cx} ${py} ${cx} ${y} ${x} ${y}`;
  }).join(" ");
  const areaPath = `${linePath} L ${toX(months - 1)} ${PT + chartH} L ${toX(0)} ${PT + chartH} Z`;

  const xTickIdxs = [0, 4, 8, 12, 16, 20, 24, 27];

  const formatVal = (v: number) => {
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}M`;
    return `$${v}K`;
  };

  const hovered = hoverIdx !== null ? { x: toX(hoverIdx), y: toY(pts28[hoverIdx]), val: pts28[hoverIdx], label: dateLabels[hoverIdx] } : null;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    const chartX = relX - PL;
    const idx = Math.max(0, Math.min(months - 1, Math.round((chartX / chartW) * (months - 1))));
    setHoverIdx(idx);
  };

  return (
    <div style={{
      background: "rgba(14,16,26,0.9)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16, overflow: "hidden", position: "relative",
    }}>
      <div style={{ padding: "16px 20px 0" }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.22em", color: "rgba(255,255,255,0.28)", textTransform: "uppercase", marginBottom: 4 }}>
          Детализированный прогноз выручки
        </div>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block", cursor: "crosshair" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="fin-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5A8DFF" />
            <stop offset="100%" stopColor="#7A5CFF" />
          </linearGradient>
          <linearGradient id="fin-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7A5CFF" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#5A8DFF" stopOpacity="0.02" />
          </linearGradient>
          <clipPath id="fin-clip">
            <rect x={PL} y={PT} width={chartW} height={chartH} />
          </clipPath>
        </defs>

        {/* Y-axis grid + labels */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const frac = i / yTicks;
          const v = maxV * frac;
          const y = PT + chartH * (1 - frac);
          return (
            <g key={i}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x={PL - 6} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="ui-monospace,monospace">
                {formatVal(v)}
              </text>
            </g>
          );
        })}

        {/* Y-axis label rotated */}
        <text x={10} y={H / 2} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="8"
          fontFamily="ui-monospace,monospace" transform={`rotate(-90, 10, ${H / 2})`}>
          ВЫРУЧКА ($)
        </text>

        {/* X-axis labels */}
        {xTickIdxs.map(i => (
          <text key={i} x={toX(i)} y={H - 6} textAnchor="middle" fill="rgba(255,255,255,0.22)" fontSize="8" fontFamily="ui-monospace,monospace">
            {dateLabels[i]}
          </text>
        ))}
        <text x={W / 2} y={H - 0} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="7.5" fontFamily="ui-monospace,monospace">
          ВРЕМЯ (МЕСЯЦЫ/ГОДЫ)
        </text>

        {/* Area + line (clipped) */}
        <g clipPath="url(#fin-clip)">
          <path d={areaPath} fill="url(#fin-area)"
            style={{ opacity: animated ? 1 : 0, transition: "opacity 1.1s ease-out 0.6s" }} />
          <path d={linePath} fill="none" stroke="url(#fin-line)" strokeWidth="2.2" strokeLinecap="round"
            strokeDasharray="3000" strokeDashoffset={animated ? "0" : "3000"}
            style={{ transition: "stroke-dashoffset 2.4s cubic-bezier(0.25,0.46,0.45,0.94) 0.2s" }} />
        </g>

        {/* Data dots every 4th */}
        {pts28.map((v, i) => {
          if (i % 4 !== 0 && i !== months - 1) return null;
          const x = toX(i), y = toY(v);
          return (
            <g key={i} style={{ opacity: animated ? 1 : 0, transition: `opacity 0.3s ${0.9 + i * 0.03}s` }}>
              <circle cx={x} cy={y} r="4" fill="#070912" stroke={i === months - 1 ? "#7A5CFF" : "#5A8DFF"} strokeWidth="1.5" />
              <circle cx={x} cy={y} r="1.8" fill={i === months - 1 ? "#7A5CFF" : "#5A8DFF"} />
            </g>
          );
        })}

        {/* Peak label */}
        {animated && (
          <g style={{ opacity: animated ? 1 : 0, transition: "opacity 0.5s 2s" }}>
            <text x={toX(months - 1) - 6} y={toY(pts28[months - 1]) - 10}
              textAnchor="end" fill="#7A5CFF" fontSize="11" fontWeight="700" fontFamily="ui-monospace,monospace">
              {yr3?.value ?? formatVal(v3)}
            </text>
          </g>
        )}

        {/* Hover cursor */}
        {hovered && (
          <g>
            <line x1={hovered.x} y1={PT} x2={hovered.x} y2={PT + chartH}
              stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 3" />
            <circle cx={hovered.x} cy={hovered.y} r="5" fill="#070912" stroke="#5A8DFF" strokeWidth="2" />
            <circle cx={hovered.x} cy={hovered.y} r="2.5" fill="#5A8DFF" />
            {/* Tooltip */}
            <g transform={`translate(${Math.min(hovered.x + 10, W - 130)}, ${Math.max(hovered.y - 46, PT + 4)})`}>
              <rect width="118" height="38" rx="7" fill="rgba(14,18,34,0.95)" stroke="rgba(90,141,255,0.3)" strokeWidth="1" />
              <text x="10" y="14" fill="rgba(255,255,255,0.5)" fontSize="8.5" fontFamily="ui-monospace,monospace">{hovered.label}</text>
              <text x="10" y="28" fill="#5A8DFF" fontSize="11" fontWeight="700" fontFamily="ui-monospace,monospace">
                {formatVal(hovered.val)}
              </text>
            </g>
          </g>
        )}

        {/* Start label */}
        {animated && (
          <text x={toX(0)} y={toY(pts28[0]) - 10} textAnchor="start"
            fill="#5A8DFF" fontSize="11" fontWeight="700" fontFamily="ui-monospace,monospace"
            style={{ opacity: animated ? 1 : 0, transition: "opacity 0.5s 2s" }}>
            {yr1?.value ?? formatVal(v1)}
          </text>
        )}
      </svg>
    </div>
  );
}

// ─── ANIMATED RINGS (TAM/SAM/SOM) ────────────────────────────────────────────

function MarketSphereChart({ items }: { items: { label: string; value: string; numeric?: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const tRef      = useRef(0);

  const tam  = items.find(m => m.label.toLowerCase().includes("tam") || m.label.toLowerCase().includes("общий"));
  const sam  = items.find(m => m.label.toLowerCase().includes("sam") || m.label.toLowerCase().includes("достиж"));
  const som  = items.find(m => m.label.toLowerCase().includes("som") || m.label.toLowerCase().includes("целевой"));
  const cagr = items.find(m => m.label.toLowerCase().includes("рост") || m.label.toLowerCase().includes("cagr"));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const DPR = Math.min(window.devicePixelRatio ?? 1, 2);
    const W = 460, H = 370;
    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";
    ctx.scale(DPR, DPR);

    function drawSphere(
      cx: number, cy: number, r: number,
      hiColor: string, midColor: string, glowRgb: string,
    ) {
      // Outer glow bloom
      const bloom = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 2.2);
      bloom.addColorStop(0, `rgba(${glowRgb},0.22)`);
      bloom.addColorStop(1, `rgba(${glowRgb},0)`);
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = bloom;
      ctx.beginPath(); ctx.arc(cx, cy, r * 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // Sphere body
      const hx = cx - r * 0.3, hy = cy - r * 0.32;
      const body = ctx.createRadialGradient(hx, hy, r * 0.02, cx + r * 0.08, cy + r * 0.08, r * 1.15);
      body.addColorStop(0,   hiColor);
      body.addColorStop(0.45, midColor);
      body.addColorStop(1,   `rgba(${glowRgb},0.08)`);
      ctx.fillStyle = body;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

      // Specular highlight
      const spec = ctx.createRadialGradient(hx, hy, 0, hx, hy, r * 0.55);
      spec.addColorStop(0, "rgba(255,255,255,0.52)");
      spec.addColorStop(0.6, "rgba(255,255,255,0.08)");
      spec.addColorStop(1,  "rgba(255,255,255,0)");
      ctx.fillStyle = spec;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

      // Bottom rim light
      const rim = ctx.createRadialGradient(cx, cy + r * 0.7, 0, cx, cy + r * 0.7, r * 0.55);
      rim.addColorStop(0, `rgba(${glowRgb},0.28)`);
      rim.addColorStop(1, `rgba(${glowRgb},0)`);
      ctx.fillStyle = rim;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    }

    function drawPlatform(cy: number) {
      const w = 280, h = 28;
      const cx = W / 2;
      // Glass platform ellipse
      const g = ctx.createLinearGradient(cx - w / 2, cy, cx + w / 2, cy + h);
      g.addColorStop(0,   "rgba(122,92,255,0.12)");
      g.addColorStop(0.5, "rgba(90,141,255,0.18)");
      g.addColorStop(1,   "rgba(122,92,255,0.06)");
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
      // Edge highlight
      ctx.strokeStyle = "rgba(180,160,255,0.22)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      tRef.current += 0.012;
      const t = tRef.current;

      const breathTam = 1 + Math.sin(t)         * 0.016;
      const breathSam = 1 + Math.sin(t + 1.1)   * 0.018;
      const breathSom = 1 + Math.sin(t + 2.3)   * 0.025;

      const tamCx = W * 0.43, tamCy = 185, tamR = 132 * breathTam;
      const samCx = W * 0.47, samCy = 310, samR = 78  * breathSam;
      const somCx = W * 0.45, somCy = 356, somR = 26  * breathSom;

      // Platform
      drawPlatform(370);

      // Platform reflection glow
      const refGlow = ctx.createRadialGradient(W * 0.45, 368, 0, W * 0.45, 368, 120);
      refGlow.addColorStop(0, "rgba(122,92,255,0.12)");
      refGlow.addColorStop(1, "rgba(122,92,255,0)");
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = refGlow;
      ctx.beginPath(); ctx.ellipse(W * 0.45, 368, 120, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // Draw back-to-front: TAM, SAM, SOM
      drawSphere(tamCx, tamCy, tamR, "#c4b5fd", "#7A5CFF", "122,92,255");
      drawSphere(samCx, samCy, samR, "#93c5fd", "#3b82f6",  "90,141,255");
      drawSphere(somCx, somCy, somR, "#6ee7b7", "#00E7A7",  "0,231,167");

      rafRef.current = requestAnimationFrame(draw);
    }
    draw();

    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const cards = [
    { key: "TAM", label: "TAM: " + (tam?.value ?? "—"), sub: "(Общий адресный рынок)", color: "#a78bfa", rgb: "167,139,250",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{width:26,height:26}}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
    { key: "SAM", label: "SAM: " + (sam?.value ?? "—"), sub: "(Достижимый рынок)", color: "#5A8DFF", rgb: "90,141,255",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{width:26,height:26}}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg> },
    { key: "SOM", label: "SOM: " + (som?.value ?? "—"), sub: "(Достижимый рыночный охват)", color: "#00E7A7", rgb: "0,231,167",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{width:26,height:26}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><path d="M17 3l1 4-4 1"/></svg> },
    { key: "CAGR", label: "CAGR: " + (cagr?.value ?? "+25%"), sub: "(Среднегодовой темп роста)", color: "#FFB800", rgb: "255,184,0",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{width:26,height:26}}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/><rect x="2" y="14" width="4" height="7" rx="1"/><rect x="9" y="10" width="4" height="11" rx="1"/><rect x="16" y="6" width="4" height="15" rx="1"/></svg> },
  ];

  return (
    <div style={{
      background: "rgba(8,10,20,0.95)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16, overflow: "hidden", position: "relative",
    }}>
      <div style={{ padding: "14px 20px 0", fontSize: 9, fontWeight: 800, letterSpacing: "0.22em", color: "rgba(255,255,255,0.28)", textTransform: "uppercase" }}>
        Анализ объема рынка (TAM/SAM/SOM)
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center" }}>
        {/* Canvas left */}
        <canvas ref={canvasRef} style={{ display: "block", maxWidth: "100%" }} />

        {/* Cards right */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "16px 20px 16px 0" }}>
          {cards.map((c, i) => (
            <div key={c.key} style={{
              background: `rgba(${c.rgb},0.07)`,
              border: `1px solid rgba(${c.rgb},0.22)`,
              borderRadius: 14, padding: "14px 14px",
              display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8,
              opacity: 0, animation: `mkt-fadein 0.55s cubic-bezier(0.22,1,0.36,1) ${150 + i * 110}ms forwards`,
            }}>
              <div>
                {c.key === "SOM" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.color, boxShadow: `0 0 6px ${c.color}`, display: "inline-block" }} />
                    <span style={{ fontSize: 11, fontWeight: 800, color: c.color }}>{c.label}</span>
                  </div>
                )}
                {c.key !== "SOM" && (
                  <div style={{ fontSize: 11, fontWeight: 800, color: c.color, marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
                    {c.key === "TAM" && <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.color, display: "inline-block" }} />}
                    {c.label}
                  </div>
                )}
                <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>{c.sub}</div>
              </div>
              <div style={{ color: c.color, opacity: 0.6, flexShrink: 0, marginTop: 1 }}>{c.icon}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes mkt-fadein { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}

// ─── ANIMATED RADAR ───────────────────────────────────────────────────────────

function AnimatedRadar({ risks }: { risks: { level: string; title: string }[] }) {
  const animated = useAnimated(150);
  const axes = risks.length >= 3 ? risks.slice(0, 6) : [
    { title: "Конкуренция", level: "high" }, { title: "Рынок", level: "medium" },
    { title: "Финансы", level: "high" }, { title: "Команда", level: "medium" },
    { title: "Регуляторика", level: "low" }, { title: "Технологии", level: "medium" },
  ];
  const n = axes.length;
  const cx = 110, cy = 110, r = 78;
  const lv: Record<string, number> = { high: 0.88, medium: 0.55, low: 0.28 };
  const lc: Record<string, string> = { high: "#FF5470", medium: "#FFB800", low: "#00E7A7" };

  const pts = axes.map((ax, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const frac = lv[ax.level] ?? 0.5;
    return {
      x: cx + Math.cos(angle) * r * frac,
      y: cy + Math.sin(angle) * r * frac,
      lx: cx + Math.cos(angle) * (r + 24),
      ly: cy + Math.sin(angle) * (r + 24),
      color: lc[ax.level] ?? "#a78bfa",
    };
  });
  const poly = pts.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <div style={{
      background: "linear-gradient(135deg,rgba(255,84,112,0.05) 0%,rgba(10,10,18,0.88) 100%)",
      border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 20, position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.02, backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.4) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
      <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 4 }}>Матрица угроз</div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg viewBox="0 0 220 220" width={200} height={200}>
          <defs>
            <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF5470" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#FFB800" stopOpacity="0.04" />
            </radialGradient>
          </defs>
          {[0.28, 0.55, 0.88].map((frac, gi) => {
            const ringPts = Array.from({ length: n }, (_, i) => {
              const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
              return `${cx + Math.cos(angle) * r * frac},${cy + Math.sin(angle) * r * frac}`;
            }).join(" ");
            const cs = ["rgba(0,231,167,0.1)", "rgba(255,184,0,0.1)", "rgba(255,84,112,0.1)"];
            return <polygon key={gi} points={ringPts} fill={cs[gi]} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />;
          })}
          {axes.map((_, i) => {
            const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
            return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(angle)*r} y2={cy + Math.sin(angle)*r} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />;
          })}
          <polygon points={poly} fill="url(#radarFill)" stroke="rgba(255,84,112,0.6)" strokeWidth="1.5" strokeLinejoin="round"
            style={{ opacity: animated ? 1 : 0, transition: "opacity 0.8s ease-out 0.3s" }} />
          {pts.map((p, i) => (
            <g key={i} style={{ opacity: animated ? 1 : 0, transition: `opacity 0.3s ${0.5 + i * 0.07}s` }}>
              <circle cx={p.x} cy={p.y} r="5" fill="#07090F" stroke={p.color} strokeWidth="1.5"
                style={{ filter: `drop-shadow(0 0 4px ${p.color}80)` }} />
              <circle cx={p.x} cy={p.y} r="2" fill={p.color} />
              <text x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="middle"
                fontSize="7" fill="rgba(255,255,255,0.3)" fontFamily="system-ui">
                {axes[i].title.slice(0, 10)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ─── SCORE GAUGE (big) ────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => { const t = setTimeout(() => setVal(score), 200); return () => clearTimeout(t); }, [score]);
  const color = score >= 85 ? "#00E7A7" : score >= 70 ? "#FFB800" : "#FF5470";
  const cx = 65, cy = 65, r = 50;
  const circ = 2 * Math.PI * r;
  const maxDash = circ * 0.75;
  const drawn = (val / 100) * maxDash;

  return (
    <svg viewBox="0 0 130 104" width={130} height={104}>
      <g transform="rotate(-135 65 65)">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8"
          strokeDasharray={`${maxDash} ${circ}`} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${drawn} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.5s cubic-bezier(0.34,1.1,0.64,1) 0.2s", filter: `drop-shadow(0 0 6px ${color})` }} />
      </g>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="26" fontWeight="800" fill="white" fontFamily="ui-monospace,monospace">{val}</text>
      <text x={cx} y={cy + 23} textAnchor="middle" fontSize="7.5" fill="rgba(255,255,255,0.28)" fontFamily="system-ui" letterSpacing="1.5">БИЗНЕС-БАЛЛ</text>
    </svg>
  );
}

// ─── AGENT PANEL ──────────────────────────────────────────────────────────────

function AgentPanel({ letter, name, subtitle, color, score, opinion, delay = 0 }:
  { letter: string; name: string; subtitle: string; color: string; score: number; opinion: string; delay?: number }) {
  const animated = useAnimated(delay);
  return (
    <div style={{
      background: `linear-gradient(135deg,${color}08 0%,rgba(10,10,18,0.92) 100%)`,
      border: `1px solid ${color}22`, borderRadius: 14, padding: 18,
      opacity: animated ? 1 : 0, transform: animated ? "translateY(0)" : "translateY(14px)",
      transition: `opacity 0.5s ${delay}ms, transform 0.5s ${delay}ms`,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: "0 0 auto", height: 1, background: `linear-gradient(90deg,transparent,${color}50,transparent)` }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 800, flexShrink: 0,
          background: `${color}18`, border: `1px solid ${color}30`, color,
        }}>{letter}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.88)" }}>{name}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>AI Executive Board · {subtitle}</div>
        </div>
        <AnimatedGauge score={score} color={color} size={52} delay={delay + 200} showLabel={false} />
      </div>
      <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.58)", lineHeight: 1.78, margin: 0 }}>{opinion}</p>
    </div>
  );
}

// ─── CIRCULAR SCORE (small) ───────────────────────────────────────────────────

function CircularScore({ score, color }: { score: number; color: string }) {
  const r = 22; const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg viewBox="0 0 60 60" width={40} height={40}>
      <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
      <circle cx="30" cy="30" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ * 0.25}
        strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color}80)` }} />
      <text x="30" y="35" textAnchor="middle" fontSize="11" fontWeight="700" fill="white" fontFamily="ui-monospace,monospace">{score}</text>
    </svg>
  );
}

// ─── AGENT COLORS ─────────────────────────────────────────────────────────────

const AGENT_COLORS: Record<string, string> = {
  "CEO": "#7A5CFF", "CFO": "#5A8DFF", "CMO": "#FF5470", "COO": "#00E7A7",
  "Business Analyst": "#FFB800", "CTO": "#a78bfa", "Legal Advisor": "#94a3b8",
  "Sales Director": "#fb923c", "HR Director": "#f472b6",
};
function agentColor(role: string) {
  return AGENT_COLORS[role] ?? DEMO_AGENTS.find(a => a.id === role?.toLowerCase().slice(0,3))?.color ?? "#7A5CFF";
}

// ─── TABS ─────────────────────────────────────────────────────────────────────

const TABS = ["Диагностика", "AI Команда", "Финансы", "Рынок", "Риски"];

// ─── DIAGNOSTICS TAB ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DiagnosticsTab({ project, aiResults }: { project: ProjectData; aiResults: any[] }) {
  const animated = useAnimated(100);
  const agents = aiResults.length > 0
    ? aiResults.map(r => ({
        id: r.role, role: r.role, name: r.name || r.role,
        color: agentColor(r.role), title: r.title || r.role, score: r.score,
        opinion: [r.summary, r.analysis, r.recommendations].filter(Boolean).join(" ").slice(0, 600),
      }))
    : DEMO_AGENTS;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: "Бизнес-балл", value: project.score, color: project.score >= 85 ? "#00E7A7" : project.score >= 70 ? "#FFB800" : "#FF5470", suffix: "/100" },
          { label: "Рыночный потенциал", value: project.scores[0]?.value, color: "#7A5CFF", suffix: "" },
          { label: "Финансовая устойчивость", value: project.scores[1]?.value, color: "#5A8DFF", suffix: "" },
          { label: "Реализуемость", value: project.scores[2]?.value, color: "#00E7A7", suffix: "" },
        ].map((kpi, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: "16px 18px",
            opacity: animated ? 1 : 0, transform: animated ? "translateY(0)" : "translateY(12px)",
            transition: `opacity 0.5s ${i * 80}ms, transform 0.5s ${i * 80}ms`,
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: kpi.color, fontFamily: "monospace", lineHeight: 1 }}>
              {kpi.value}{kpi.suffix}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>{kpi.label}</div>
            <div style={{ marginTop: 10 }}>
              <AnimatedBar value={kpi.value ?? 0} color={kpi.color} delay={i * 80 + 200} height={4} />
            </div>
          </div>
        ))}
      </div>

      {/* Sub-scores chart */}
      <div style={{
        background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16, padding: 20,
        opacity: animated ? 1 : 0, transform: animated ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.5s 320ms, transform 0.5s 320ms",
      }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 16 }}>Профиль бизнеса</div>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          <ScoreGauge score={project.score} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
            {project.scores.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", width: 200, flexShrink: 0 }}>{s.label}</span>
                <div style={{ flex: 1 }}>
                  <AnimatedBar value={s.value} color={["#7A5CFF", "#5A8DFF", "#00E7A7", "#FFB800"][i]} delay={400 + i * 80} height={6} />
                </div>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "monospace", width: 28, textAlign: "right", flexShrink: 0 }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 20 agents grid */}
      <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.2em" }}>
        Полная диагностика — {agents.length} специалистов
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
        {agents.map((agent, i) => (
          <AgentPanel
            key={agent.id}
            letter={(agent.name || agent.role)[0]}
            name={agent.name || agent.role}
            subtitle={agent.title}
            color={agent.color}
            score={agent.score}
            opinion={agent.opinion || "Анализ проекта завершён. Рекомендации доступны после запуска полного AI-анализа."}
            delay={500 + i * 60}
          />
        ))}
      </div>
    </div>
  );
}

// ─── AI TEAM TAB ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AITeamTab({ aiResults, isUserProject, isReanalyzing, reanalyzeProgress, onReanalyze }:
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { aiResults: any[]; isUserProject: boolean; isReanalyzing: boolean; reanalyzeProgress: number; onReanalyze: () => void }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeAgent, setActiveAgent] = useState<any>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (aiResults.length > 0 && !activeAgent) setActiveAgent(aiResults[0]); }, [aiResults]);

  if (aiResults.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 20px" }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(122,92,255,0.1)", border: "1px solid rgba(122,92,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 16px" }}>🤖</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "white", marginBottom: 8 }}>AI-анализ ещё не запущен</div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 20, lineHeight: 1.6 }}>Запустите анализ, чтобы получить полный разбор от AI-специалистов.</p>
          {isUserProject && (
            <button onClick={onReanalyze} disabled={isReanalyzing}
              style={{ height: 36, padding: "0 24px", fontSize: 12, fontWeight: 600, background: "linear-gradient(135deg,#7A5CFF,#5A8DFF)", color: "white", border: "none", borderRadius: 10, cursor: "pointer" }}>
              {isReanalyzing ? `Анализируем… ${reanalyzeProgress}/8` : "Запустить AI-анализ"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CONF: Record<string, string> = { высокая: "#00E7A7", средняя: "#FFB800", низкая: "#FF5470" };
  const r = activeAgent;
  const rColor = agentColor(r?.role ?? "");
  const avgScore = Math.round(aiResults.reduce((s: number, x: { score: number }) => s + x.score, 0) / aiResults.length);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>
      {/* Left: agent list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {aiResults.map((ag: { role: string; title: string; score: number; confidence: string }) => {
          const color = agentColor(ag.role);
          const isActive = activeAgent?.role === ag.role;
          return (
            <button key={ag.role} onClick={() => { setActiveAgent(ag); setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50); }}
              style={{
                width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 12,
                background: isActive ? "rgba(122,92,255,0.12)" : "rgba(255,255,255,0.025)",
                border: `1px solid ${isActive ? "rgba(122,92,255,0.35)" : "rgba(255,255,255,0.05)"}`,
                cursor: "pointer", transition: "all 0.2s",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, background: `${color}18`, border: `1px solid ${color}28`, color }}>{ag.role[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,0.88)" }}>{ag.role}</div>
                  <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.28)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ag.title}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color, flexShrink: 0, fontFamily: "monospace" }}>{ag.score}</div>
              </div>
              {isActive && (
                <div style={{ marginTop: 8 }}>
                  <AnimatedBar value={ag.score} color={color} height={3} />
                </div>
              )}
            </button>
          );
        })}
        {/* avg */}
        <div style={{ marginTop: 8, padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 6 }}>Средний балл</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#7A5CFF", fontFamily: "monospace", marginBottom: 6 }}>{avgScore}</div>
          <AnimatedBar value={avgScore} color="#7A5CFF" delay={200} />
        </div>
      </div>

      {/* Right: agent detail */}
      <div ref={detailRef}>
        {r && (
          <div style={{
            background: `linear-gradient(135deg,${rColor}08 0%,rgba(10,10,18,0.94) 100%)`,
            border: `1px solid ${rColor}20`, borderRadius: 16, padding: 22, position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", inset: "0 0 auto", height: 1, background: `linear-gradient(90deg,transparent,${rColor}55,transparent)` }} />

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, background: `${rColor}20`, border: `1px solid ${rColor}30`, color: rColor }}>{r.role[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>{r.role}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{r.title}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: rColor, fontFamily: "monospace" }}>{r.score}</div>
                <div style={{ fontSize: 10, color: CONF[r.confidence] ?? "rgba(255,255,255,0.4)", fontWeight: 600 }}>{r.confidence} уверенность</div>
              </div>
            </div>

            {/* Animated skill bars */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 12 }}>Оценка специалиста</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Уровень экспертизы", v: r.score },
                  { label: "Уверенность в оценке", v: r.confidence === "высокая" ? 88 : r.confidence === "средняя" ? 65 : 45 },
                  { label: "Глубина анализа", v: Math.min(99, r.score + 5) },
                  { label: "Практичность рекомендаций", v: Math.max(55, r.score - 4) },
                ].map((bar, bi) => (
                  <div key={bi} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", width: 200, flexShrink: 0 }}>{bar.label}</span>
                    <div style={{ flex: 1 }}>
                      <AnimatedBar value={bar.v} color={rColor} delay={bi * 80} />
                    </div>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: "monospace", width: 28, textAlign: "right", flexShrink: 0 }}>{bar.v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sections */}
            {[
              { label: "📌 Краткий вывод", text: r.summary },
              { label: "📊 Подробный анализ", text: r.analysis },
              { label: "📋 Факты и данные", text: r.facts },
              { label: "⚠️ Риски", text: r.risks },
              { label: "🚀 Рекомендации", text: r.recommendations },
              { label: "📈 Прогноз", text: r.forecast },
            ].filter(s => s.text).map((sec, si) => (
              <div key={si} style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.04)", marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>{sec.label}</div>
                <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.78, margin: 0, whiteSpace: "pre-line" }}>{sec.text}</p>
              </div>
            ))}

            {/* Metrics */}
            {r.metrics && r.metrics.success_probability !== "—" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 12 }}>
                {[
                  { label: "Вероятность успеха", value: r.metrics.success_probability },
                  { label: "Уровень риска", value: r.metrics.risk_level },
                  { label: "Конкуренция", value: r.metrics.competition },
                  { label: "Привлекательность", value: r.metrics.investment_appeal },
                  { label: "Масштабируемость", value: r.metrics.scalability },
                ].map((m, mi) => (
                  <div key={mi} style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: rColor }}>{m.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FINANCE TAB ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FinanceTab({ project, aiResults }: { project: ProjectData; aiResults: any[] }) {
  const animated = useAnimated(100);
  const cfo = aiResults.find((r: { role: string }) => r.role === "CFO" || r.role?.toLowerCase().includes("финанс"));
  const coo = aiResults.find((r: { role: string }) => r.role === "COO" || r.role?.toLowerCase().includes("операц"));
  const ceo = aiResults.find((r: { role: string }) => r.role === "CEO" || r.role?.toLowerCase().includes("ceo"));

  const FIN_AGENTS = [
    cfo ? { ...cfo, color: "#5A8DFF", letter: "J", subtitle: "Финансовый директор — прогноз", opinion: [cfo.analysis, cfo.recommendations, cfo.forecast].filter(Boolean).join(" ").slice(0, 500) } : null,
    coo ? { ...coo, color: "#00E7A7", letter: "E", subtitle: "Операционный директор — бюджет", opinion: [coo.analysis, coo.recommendations].filter(Boolean).join(" ").slice(0, 450) } : null,
    ceo ? { ...ceo, color: "#7A5CFF", letter: "V", subtitle: "Генеральный директор — стратегия", opinion: [ceo.summary, ceo.forecast].filter(Boolean).join(" ").slice(0, 450) } : null,
  ].filter(Boolean) as { role: string; name: string; color: string; letter: string; subtitle: string; score: number; opinion: string }[];

  const yr1 = project.financials.find(f => f.label.toLowerCase().includes("год 1") || f.label.toLowerCase().includes("year 1"));
  const yr3 = project.financials.find(f => f.label.toLowerCase().includes("год 3") || f.label.toLowerCase().includes("year 3"));
  const breakeven = project.financials.find(f => f.label.toLowerCase().includes("безубыточ"));
  const ltv = project.financials.find(f => f.label.toLowerCase().includes("ltv"));
  const cac = project.financials.find(f => f.label.toLowerCase().includes("cac") && !f.label.toLowerCase().includes("/"));
  const ltvcac = project.financials.find(f => f.label.toLowerCase().includes("ltv/cac") || f.label.toLowerCase().includes("ltv/"));
  const timeframeVal = project.financials.find(f => f.label.toLowerCase().includes("таймфрейм") || f.label.toLowerCase().includes("timeframe"));

  // Icon SVGs as inline components
  const IconRevYear = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
      <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
      <path d="M7 7h10M7 11h6" />
    </svg>
  );
  const IconTrendUp = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
    </svg>
  );
  const IconClock = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
  const IconUser = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
  const IconFilter = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
  const IconCalc = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
      <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="8" y2="10" strokeLinecap="round" strokeWidth="2" />
      <line x1="12" y1="10" x2="12" y2="10" strokeLinecap="round" strokeWidth="2" />
      <line x1="16" y1="10" x2="16" y2="10" strokeLinecap="round" strokeWidth="2" />
      <line x1="8" y1="14" x2="8" y2="14" strokeLinecap="round" strokeWidth="2" />
      <line x1="12" y1="14" x2="16" y2="14" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
  const IconCalendar = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );

  const rightCards = [
    { label: "ПРОГНОЗ (ГОД 1):", value: yr1?.value ?? "—", color: "#5A8DFF", rgb: "90,141,255", Icon: IconRevYear },
    { label: "ПРОГНОЗ (ГОД 3):", value: yr3?.value ?? "—", color: "#7A5CFF", rgb: "122,92,255", Icon: IconTrendUp },
    { label: "ТОЧКА БЕЗУБЫТОЧНОСТИ:", value: breakeven?.value ?? "—", color: "#00E7A7", rgb: "0,231,167", Icon: IconClock },
  ];
  const bottomCards = [
    { label: "LTV ПОЛЬЗОВАТЕЛЯ:", value: ltv?.value ?? "—", color: "#a78bfa", rgb: "167,139,250", Icon: IconUser },
    { label: "CAC:", value: cac?.value ?? "—", color: "#5A8DFF", rgb: "90,141,255", Icon: IconFilter },
    { label: "LTV/CAC RATIO:", value: ltvcac?.value ?? "—", suffix: true, color: "#00E7A7", rgb: "0,231,167", Icon: IconCalc },
    { label: "ТАЙМФРЕЙМ:", value: timeframeVal?.value ?? (project.financials[5]?.value ?? "—"), color: "#FFB800", rgb: "255,184,0", Icon: IconCalendar },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── TOP ROW: chart + right KPI cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 14, alignItems: "start" }}>
        <DetailedRevenueChart financials={project.financials} />

        {/* Right stacked cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rightCards.map((c, i) => (
            <div
              key={i}
              style={{
                background: `rgba(${c.rgb},0.06)`,
                border: `1px solid rgba(${c.rgb},0.18)`,
                borderRadius: 14, padding: "14px 16px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                opacity: animated ? 1 : 0, transform: animated ? "translateX(0)" : "translateX(14px)",
                transition: `opacity 0.5s ${200 + i * 90}ms, transform 0.5s ${200 + i * 90}ms`,
                position: "relative", overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, borderRadius: "14px 0 0 14px", background: c.color }} />
              <div style={{ paddingLeft: 8 }}>
                <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: "0.16em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 4 }}>{c.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: c.color, fontFamily: "ui-monospace,monospace", lineHeight: 1, letterSpacing: "-0.02em" }}>{c.value}</div>
              </div>
              <div style={{ color: c.color, opacity: 0.5, flexShrink: 0 }}><c.Icon /></div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BOTTOM ROW: 4 metric tiles ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {bottomCards.map((c, i) => (
          <div
            key={i}
            style={{
              background: `rgba(${c.rgb},0.05)`,
              border: `1px solid rgba(${c.rgb},0.15)`,
              borderRadius: 14, padding: "16px 18px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
              opacity: animated ? 1 : 0, transform: animated ? "translateY(0)" : "translateY(12px)",
              transition: `opacity 0.5s ${400 + i * 80}ms, transform 0.5s ${400 + i * 80}ms`,
            }}
          >
            <div>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", color: "rgba(255,255,255,0.28)", textTransform: "uppercase", marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: c.color, fontFamily: "ui-monospace,monospace", lineHeight: 1, display: "flex", alignItems: "center", gap: 4 }}>
                {c.value}
                {c.suffix && (
                  <svg viewBox="0 0 16 12" fill="none" style={{ width: 18, height: 14, color: c.color }}>
                    <polyline points="1 11 5 5 9 7 15 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <div style={{ color: c.color, opacity: 0.45, flexShrink: 0 }}><c.Icon /></div>
          </div>
        ))}
      </div>

      {/* ── AGENT PANELS ── */}
      {FIN_AGENTS.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {FIN_AGENTS.map((ag, i) => (
            <AgentPanel key={i} letter={ag.letter} name={ag.role} subtitle={ag.subtitle}
              color={ag.color} score={ag.score} opinion={ag.opinion || "Финансовый анализ недоступен. Запустите AI-анализ."} delay={i * 120} />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { letter: "J", name: "CFO", subtitle: "Спец. Оценка финансового директора", color: "#5A8DFF", score: 79,
              opinion: "Финансовая структура проекта в целом корректна и требует только доработки в части прогнозирования выручки. Burn rate следует оптимизировать до уровня максимум 15% месячного MRR с первого дня. CAC нужно снизить на 20% для достижения прибыльности в плановые сроки. Создайте runway минимум на 18 месяцев до следующего раунда привлечения инвестиций. P&L должен выйти в плюс не позднее месяца 20 от даты запуска. Revenue-based financing стоит рассмотреть как альтернативу equity dilution на раннем этапе. Unit economics жизнеспособны при достижении масштаба 1000+ активных клиентов. Финансовые KPI необходимо мониторить еженедельно для оперативного реагирования на отклонения." },
            { letter: "E", name: "COO", subtitle: "Операционный директор — операционные расходы", color: "#00E7A7", score: 76,
              opinion: "С операционной точки зрения проект имеет реалистичную структуру затрат для выбранной стадии. Операционные расходы можно оптимизировать на 20–25% при внедрении автоматизации с первых месяцев. COGS следует контролировать еженедельно и не допускать роста выше 35% от выручки. Операционный рычаг начнёт проявляться после достижения 500 платящих клиентов в системе. Fixed costs необходимо удерживать на минимуме в первые 18 месяцев операционной деятельности." },
            { letter: "V", name: "CEO", subtitle: "Генеральный директор — стратегия роста", color: "#7A5CFF", score: 82,
              opinion: "Стратегически проект движется в правильном направлении, однако требует чёткой расстановки приоритетов. Следующий раунд финансирования следует поднимать при достижении $100K MRR. Инвестиционная привлекательность проекта высокая при демонстрации устойчивого роста более 15% в месяц. Capital efficiency должна превышать 1.5x MRR/burn на протяжении всего периода до прибыльности." },
          ].map((ag, i) => (
            <AgentPanel key={i} letter={ag.letter} name={ag.name} subtitle={ag.subtitle}
              color={ag.color} score={ag.score} opinion={ag.opinion} delay={i * 120} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MARKET TAB ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MarketTab({ project, aiResults }: { project: ProjectData; aiResults: any[] }) {
  const animated = useAnimated(100);
  const ba = aiResults.find((r: { role: string }) => r.role === "Business Analyst" || r.role?.toLowerCase().includes("аналитик"));
  const cmo = aiResults.find((r: { role: string }) => r.role === "CMO" || r.role?.toLowerCase().includes("маркетинг"));
  const ceo = aiResults.find((r: { role: string }) => r.role === "CEO" || r.role?.toLowerCase().includes("ceo"));

  const MKT_AGENTS = [
    ba ? { letter: "M", name: "Business Analyst", subtitle: "Бизнес-аналитик — рыночный анализ", color: "#FFB800", score: ba.score, opinion: [ba.analysis, ba.facts].filter(Boolean).join(" ").slice(0, 500) } : null,
    cmo ? { letter: "S", name: "CMO", subtitle: "Директор по маркетингу — стратегия", color: "#FF5470", score: cmo.score, opinion: [cmo.analysis, cmo.recommendations].filter(Boolean).join(" ").slice(0, 500) } : null,
    ceo ? { letter: "V", name: "CEO", subtitle: "Генеральный директор — рыночная позиция", color: "#7A5CFF", score: ceo.score, opinion: [ceo.summary, ceo.analysis].filter(Boolean).join(" ").slice(0, 450) } : null,
  ].filter(Boolean) as { letter: string; name: string; subtitle: string; color: string; score: number; opinion: string }[];

  const fallbackAgents = [
    { letter: "M", name: "Бизнес-аналитик", subtitle: "Рыночный анализ и конкурентная среда", color: "#FFB800", score: 80,
      opinion: "Рыночный анализ подтверждает наличие реального спроса в целевом сегменте аудитории. Конкуренты не полностью закрывают ключевой pain point, который адресует данный проект. Тренды рынка положительные: CAGR 15–25% прогнозируется на следующие 5 лет. Барьеры входа умеренные — window of opportunity открыт для быстрого движения на рынок. Поведение потребителей меняется в пользу данного решения по всем ключевым метрикам. Конкурентная карта показывает незанятую нишу в средней ценовой категории рынка. Сезонность требует отдельного учёта при планировании cashflow и маркетинговых активностей. Географическая экспансия возможна после достижения PMF в локальном рынке присутствия." },
    { letter: "S", name: "CMO", subtitle: "Маркетинговая стратегия и GTM", color: "#FF5470", score: 84,
      opinion: "Рыночное позиционирование требует более чёткой дифференциации от ключевых конкурентов в сегменте. Контент-маркетинг является оптимальным первичным acquisition channel для данного типа продукта. Brand voice должен быть задокументирован строго до первого публичного контакта с аудиторией. CAC через органику может быть в 3–5 раз ниже paid при правильной долгосрочной SEO стратегии. Email retention программа способна снизить churn на 15–20% при качественной реализации. Партнёрство с лидерами мнений в нише обеспечит быстрый initial traction в первые 90 дней. A/B тестирование landing page и онбординга обязательно с первого дня привлечения трафика. Community-building вокруг продукта создаёт органический acquisition loop с нулевым CAC." },
    { letter: "V", name: "CEO", subtitle: "Стратегическая позиция на рынке", color: "#7A5CFF", score: 82,
      opinion: "Рыночная позиция проекта выглядит сильно при условии правильного позиционирования в нише. Своевременный вход на рынок создаёт первопроходческое преимущество перед потенциальными конкурентами. Партнёрства с complementary продуктами ускорят market penetration без значительных затрат. Ecosystem стратегия через интеграции создаёт высокие switching costs для клиентов компании. Географическое масштабирование следует начинать только после достижения unit economics в первой локации. Network effects должны быть намеренно встроены в product roadmap с первой версии продукта. Доминирование в одной нише лучше слабого присутствия в нескольких направлениях одновременно. Стратегический партнёр с дистрибуцией может accelerate market share лучше, чем органический рост." },
  ];

  const agents = MKT_AGENTS.length >= 2 ? MKT_AGENTS : fallbackAgents;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <MarketSphereChart items={project.market} />

      {/* Market growth bar */}
      <div style={{
        background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px 20px",
        opacity: animated ? 1 : 0, transition: "opacity 0.5s 300ms",
      }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 14 }}>Рыночные показатели</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
          {project.market.map((m, i) => {
            const colors = ["#7A5CFF", "#5A8DFF", "#00E7A7", "#FFB800"];
            const color = colors[i % 4];
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.38)" }}>{m.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "monospace" }}>{m.value}</span>
                </div>
                {m.numeric && <AnimatedBar value={Math.min(100, (m.numeric / (project.market[0]?.numeric || 1)) * 100)} color={color} delay={200 + i * 80} height={4} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Agent opinions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {agents.map((ag, i) => (
          <AgentPanel key={i} letter={ag.letter} name={ag.name} subtitle={ag.subtitle}
            color={ag.color} score={ag.score} opinion={ag.opinion} delay={i * 120} />
        ))}
      </div>
    </div>
  );
}

// ─── RISKS TAB ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RisksTab({ project, aiResults }: { project: ProjectData; aiResults: any[] }) {
  const animated = useAnimated(80);
  const [period, setPeriod] = useState<"month"|"quarter"|"year">("quarter");

  const RISK_META: Record<string, { color: string; rgb: string; label: string; badge: string; badgeColor: string }> = {
    high:   { color: "#FF5470", rgb: "255,84,112",  label: "ВЫСОКИЙ",  badge: "Требует Внимания",  badgeColor: "#FF5470" },
    medium: { color: "#FFB800", rgb: "255,184,0",   label: "СРЕДНИЙ",  badge: "Приоритет",          badgeColor: "#FFB800" },
    low:    { color: "#00E7A7", rgb: "0,231,167",   label: "НИЗКИЙ",   badge: "Стабильно",          badgeColor: "#00E7A7" },
  };

  const risks = project.risks.length >= 2 ? project.risks : [
    { level: "medium", title: "Конкурентная динамика",    desc: "Высокая активность конкурентов. Риск потери доли рынка без чёткого УТП." },
    { level: "medium", title: "Оптимизация привлечения",  desc: "CAC растёт. Необходима диверсификация каналов и улучшение retention." },
    { level: "low",    title: "Инфраструктурная устойчивость", desc: "Технический стек стабилен. Требуется планирование disaster recovery." },
  ];

  const lv: Record<string, number> = { high: 72, medium: 55, low: 28 };
  const riskManager = aiResults.find((r: { role: string }) => r.role === "Risk Manager");
  const ceo         = aiResults.find((r: { role: string }) => r.role === "CEO");
  const legal       = aiResults.find((r: { role: string }) => r.role === "Legal Advisor");

  // Build actionable plans from AI data or use defaults
  const riskPlans = risks.map((risk, i) => {
    const source = i === 0 ? ceo : i === 1 ? riskManager : legal;
    const rawRecs = source?.recommendations || "";
    const steps = rawRecs
      .split(/\d+\.\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((s: string) => s.trim().slice(0, 80));
    const defaultSteps = [
      ["Формализовать УТП: Ревизия ценностного предложения.", "Оптимизировать LTV: Запуск программы лояльности.", "Конкурентная разведка: Еженедельный мониторинг."],
      ["Аудит CAC: Анализ эффективности каналов.", "Ремаркетинг: Запуск A/B тестов для удержания.", "Чат-бот ИИ: Внедрение ИИ-поддержки."],
      ["Проактивный мониторинг: ИИ-прогнозирование сбоев.", "Облачное дублирование: Тестирование аварийного восстановления.", "Кибер-аудит: Регулярный вудит и обучение команды."],
    ];
    return steps.length >= 2 ? steps : defaultSteps[i] ?? defaultSteps[0];
  });

  const globalScore = Math.round(risks.reduce((s, r) => s + (lv[r.level] ?? 50), 0) / risks.length);

  // Bar chart icons (SVG glyphs for each risk type)
  const barIcons = [
    <svg key="0" viewBox="0 0 32 32" fill="none" style={{width:28,height:28}}>
      <path d="M16 4l-10 8v16h7v-8h6v8h7V12L16 4z" stroke="#FF5470" strokeWidth="1.5" fill="rgba(255,84,112,0.1)"/>
      <path d="M12 20h8M12 15h8" stroke="#FF5470" strokeWidth="1" opacity="0.6"/>
    </svg>,
    <svg key="1" viewBox="0 0 32 32" fill="none" style={{width:28,height:28}}>
      <circle cx="16" cy="12" r="6" stroke="#FFB800" strokeWidth="1.5" fill="rgba(255,184,0,0.1)"/>
      <path d="M10 24c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#FFB800" strokeWidth="1.5"/>
      <path d="M22 8l3-3M10 8l-3-3" stroke="#FFB800" strokeWidth="1" opacity="0.6"/>
    </svg>,
    <svg key="2" viewBox="0 0 32 32" fill="none" style={{width:28,height:28}}>
      <rect x="6" y="8" width="20" height="16" rx="2" stroke="#00E7A7" strokeWidth="1.5" fill="rgba(0,231,167,0.08)"/>
      <path d="M10 14h12M10 18h8" stroke="#00E7A7" strokeWidth="1.2" opacity="0.7"/>
      <circle cx="24" cy="10" r="3" fill="rgba(0,231,167,0.3)" stroke="#00E7A7" strokeWidth="1"/>
    </svg>,
  ];

  const now = new Date();
  const dateStr = `Q${Math.ceil((now.getMonth()+1)/3)}.${String(now.getDate()).padStart(2,"0")}.${now.getFullYear()}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <style>{`
        @keyframes bar-rise { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes risk-card-in { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }
        @keyframes rsk-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.85)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Глобальная оценка рисков проекта
          <span style={{ marginLeft: 10, fontSize: 10, fontWeight: 600, color: "#7A5CFF" }}>Отчёт {dateStr}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ padding: "5px 12px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 10, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 6 }}>
            <svg viewBox="0 0 14 14" fill="none" style={{width:11,height:11}}><rect x="1" y="2" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M5 1v2M9 1v2M1 6h12" stroke="currentColor" strokeWidth="1.2"/></svg>
            {dateStr}
          </div>
          {(["month","quarter","year"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: "5px 12px", borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: "pointer",
              background: period === p ? "rgba(122,92,255,0.2)" : "rgba(255,255,255,0.03)",
              border: period === p ? "1px solid rgba(122,92,255,0.5)" : "1px solid rgba(255,255,255,0.07)",
              color: period === p ? "#a78bfa" : "rgba(255,255,255,0.35)",
              transition: "all 0.15s",
            }}>
              {p === "month" ? "Месяц" : p === "quarter" ? "Квартал" : "Год"}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN GRID: chart left + cards right ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" }}>

        {/* LEFT: neon bar chart */}
        <div style={{
          background: "rgba(8,10,20,0.95)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, padding: "20px 20px 16px", position: "relative", overflow: "hidden",
        }}>
          {/* Grid lines */}
          <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {[0, 25, 50, 75, 100].map(pct => (
              <div key={pct} style={{
                position: "absolute", left: 44, right: 16,
                top: `${20 + (1 - pct / 100) * 68}%`,
                borderTop: "1px solid rgba(255,255,255,0.05)",
                display: "flex", alignItems: "center",
              }}>
                <span style={{ position: "absolute", left: -40, fontSize: 8.5, color: "rgba(255,255,255,0.2)", fontFamily: "ui-monospace,monospace" }}>{pct}%</span>
              </div>
            ))}
          </div>

          {/* Bars */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", height: 240, paddingLeft: 36, paddingRight: 8, gap: 16, position: "relative" }}>
            {risks.map((risk, i) => {
              const meta = RISK_META[risk.level] ?? RISK_META.medium;
              const pct = lv[risk.level] ?? 50;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end", gap: 8 }}>
                  {/* Percentage label */}
                  <div style={{
                    fontSize: 18, fontWeight: 800, color: meta.color, fontFamily: "ui-monospace,monospace",
                    textShadow: `0 0 16px rgba(${meta.rgb},0.8)`,
                    opacity: animated ? 1 : 0,
                    transition: `opacity 0.4s ${200 + i * 150}ms`,
                  }}>{pct}%</div>

                  {/* Bar wrapper */}
                  <div style={{ width: "100%", height: `${pct}%`, position: "relative", transformOrigin: "bottom" }}>
                    {/* Glow outer */}
                    <div style={{
                      position: "absolute", inset: -4, borderRadius: 10,
                      background: `rgba(${meta.rgb},0.12)`,
                      filter: "blur(8px)",
                      opacity: animated ? 1 : 0, transition: `opacity 0.6s ${300 + i * 150}ms`,
                    }} />
                    {/* Bar body */}
                    <div style={{
                      position: "absolute", inset: 0, borderRadius: 8,
                      background: `linear-gradient(180deg, rgba(${meta.rgb},0.9) 0%, rgba(${meta.rgb},0.25) 100%)`,
                      border: `1px solid rgba(${meta.rgb},0.6)`,
                      boxShadow: `inset 0 0 20px rgba(${meta.rgb},0.2), 0 0 20px rgba(${meta.rgb},0.3)`,
                      transformOrigin: "bottom",
                      animation: animated ? `bar-rise 0.9s cubic-bezier(0.34,1.56,0.64,1) ${100 + i * 180}ms both` : "none",
                    }}>
                      {/* Inner highlight streak */}
                      <div style={{ position: "absolute", top: 0, left: "20%", width: "20%", bottom: 0, borderRadius: 4, background: `rgba(255,255,255,0.12)` }} />
                      {/* Dot marker */}
                      <div style={{
                        position: "absolute", top: -5, left: "50%", transform: "translateX(-50%)",
                        width: 8, height: 8, borderRadius: "50%",
                        background: meta.color, boxShadow: `0 0 10px rgba(${meta.rgb},1)`,
                        animation: "rsk-pulse 2s ease-in-out infinite",
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Connecting curve between bars */}
            {animated && (
              <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="risk-curve" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#FF5470" stopOpacity="0.5" />
                    <stop offset="50%" stopColor="#FFB800" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#00E7A7" stopOpacity="0.5" />
                  </linearGradient>
                </defs>
                <path
                  d={`M ${(1/6)*100}% ${(1 - (lv[risks[0]?.level ?? "medium"]/100)) * 100}%
                      C 40% ${(1 - (lv[risks[0]?.level ?? "medium"]/100)) * 100}%
                        60% ${(1 - (lv[risks[1]?.level ?? "medium"]/100)) * 100}%
                        ${(3/6)*100}% ${(1 - (lv[risks[1]?.level ?? "medium"]/100)) * 100}%
                      C ${(4/6)*100}% ${(1 - (lv[risks[1]?.level ?? "medium"]/100)) * 100}%
                        80% ${(1 - (lv[risks[2]?.level ?? "low"]/100)) * 100}%
                        ${(5/6)*100}% ${(1 - (lv[risks[2]?.level ?? "low"]/100)) * 100}%`}
                  fill="none" stroke="url(#risk-curve)" strokeWidth="1.5"
                  strokeDasharray="5 3" opacity="0.6"
                  style={{ opacity: animated ? 0.6 : 0, transition: "opacity 0.8s 1s" }}
                />
              </svg>
            )}
          </div>

          {/* X-axis labels */}
          <div style={{ display: "flex", justifyContent: "space-around", paddingLeft: 36, paddingRight: 8, marginTop: 10, gap: 16 }}>
            {risks.map((risk, i) => {
              const meta = RISK_META[risk.level] ?? RISK_META.medium;
              return (
                <div key={i} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.1em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", lineHeight: 1.3 }}>
                    {risk.title.toUpperCase()}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 7.5, fontWeight: 700, color: meta.color, letterSpacing: "0.08em" }}>{meta.label}</div>
                </div>
              );
            })}
          </div>

          {/* Global Risk Index */}
          <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.75)" }}>
                Глобальный Индекс Риска: <span style={{ color: "#FFB800" }}>{globalScore}/100</span>
              </span>
              <svg viewBox="0 0 28 28" fill="none" style={{ width: 22, height: 22 }}>
                <circle cx="14" cy="14" r="11" stroke="rgba(255,184,0,0.3)" strokeWidth="2" />
                <circle cx="14" cy="14" r="11" stroke="#FFB800" strokeWidth="2"
                  strokeDasharray={`${2 * Math.PI * 11 * globalScore / 100} ${2 * Math.PI * 11}`}
                  strokeLinecap="round" strokeDashoffset={2 * Math.PI * 11 * 0.25}
                  style={{ transition: "stroke-dasharray 1.2s ease-out 0.8s" }} />
              </svg>
            </div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 5 }}>Рекомендации ИИ по рискам</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {[
                "Увеличить LTV-фокус в сегменте SMB.",
                "Оптимизировать конкуренцию в ключевых каналах.",
                "Ввести ежеквартальный risk-review процесс.",
                "Усилить рост охвата по ключевым сегментам.",
              ].map((rec, i) => (
                <div key={i} style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", display: "flex", gap: 5, alignItems: "flex-start" }}>
                  <span style={{ color: "#7A5CFF", fontWeight: 700, flexShrink: 0 }}>ИИ:</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: risk detail cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {risks.slice(0, 3).map((risk, i) => {
            const meta = RISK_META[risk.level] ?? RISK_META.medium;
            const plans = riskPlans[i] ?? [];
            return (
              <div
                key={i}
                style={{
                  background: `rgba(${meta.rgb},0.04)`,
                  border: `1px solid rgba(${meta.rgb},0.2)`,
                  borderRadius: 14, padding: "14px 16px",
                  opacity: 0,
                  animation: `risk-card-in 0.55s cubic-bezier(0.22,1,0.36,1) ${200 + i * 140}ms forwards`,
                  position: "relative", overflow: "hidden",
                }}
              >
                {/* Top accent line */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, rgba(${meta.rgb},0.7), transparent)` }} />

                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  {/* Icon box */}
                  <div style={{
                    width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                    background: `rgba(${meta.rgb},0.1)`, border: `1px solid rgba(${meta.rgb},0.25)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {barIcons[i]}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{risk.title}</span>
                      <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: `rgba(${meta.rgb},0.15)`, border: `1px solid rgba(${meta.rgb},0.35)`, color: meta.color, letterSpacing: "0.08em", textTransform: "uppercase", flexShrink: 0 }}>
                        {meta.label} | {meta.badge}
                      </span>
                    </div>
                    <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.38)", lineHeight: 1.5, marginBottom: 8 }}>
                      {risk.desc || `Уровень угрозы: ${meta.label.toLowerCase()}. Мониторинг и контроль приоритетны.`}
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 5 }}>Actionable Plan:</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      {plans.map((step: string, si: number) => (
                        <div key={si} style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", display: "flex", gap: 6, alignItems: "flex-start" }}>
                          <span style={{ fontWeight: 800, color: meta.color, flexShrink: 0 }}>{si + 1}.</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "demo";
  const [activeTab, setActiveTab] = useState("Диагностика");
  const [project, setProject] = useState<ProjectData>(PROJECTS_DATA[id] ?? PROJECTS_DATA["demo"]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [aiResults, setAiResults] = useState<any[]>([]);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [reanalyzeProgress, setReanalyzeProgress] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rawProject, setRawProject] = useState<Record<string, any> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isUserProject = !PROJECTS_DATA[id];

  useEffect(() => {
    if (!isUserProject) return;
    fetch(`/api/projects/${id}`).then(r => r.json()).then(data => {
      if (data.project) {
        const p = data.project;
        const mapped = { id: p.id, name: p.name, description: p.description, industry: p.industry, stage: p.stage, goals: p.goals, targetRevenue: p.target_revenue, timeframe: p.timeframe, score: p.overall_score, aiResults: Array.isArray(p.ai_results) ? p.ai_results : [] };
        setRawProject(mapped);
        setProject(buildProjectFromUser(mapped));
        if (mapped.aiResults?.length > 0) setAiResults(mapped.aiResults);
        return;
      }
      throw new Error("not found");
    }).catch(() => {
      try {
        const stored = JSON.parse(localStorage.getItem("apex-user-projects") || "[]");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const found = stored.find((p: any) => p.id === id);
        if (found) { setRawProject(found); setProject(buildProjectFromUser(found)); if (found.aiResults?.length > 0) setAiResults(found.aiResults); }
      } catch { /* noop */ }
    });
  }, [id, isUserProject]);

  async function handleReanalyze() {
    if (!rawProject) return;
    setIsReanalyzing(true); setReanalyzeProgress(0); setActiveTab("AI Команда");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const collected: any[] = [];
    abortRef.current = new AbortController();
    try {
      const res = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: rawProject.name, description: rawProject.description, industry: rawProject.industry, stage: rawProject.stage, goals: rawProject.goals, targetRevenue: rawProject.targetRevenue, timeframe: rawProject.timeframe }),
        signal: abortRef.current.signal,
      });
      const reader = res.body!.getReader(); const dec = new TextDecoder(); let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === "agent_done") { collected.push(evt.result); setReanalyzeProgress(collected.length); setAiResults([...collected]); }
            if (evt.type === "complete") {
              setProject(prev => ({ ...prev, score: evt.overallScore }));
              try {
                const stored = JSON.parse(localStorage.getItem("apex-user-projects") || "[]");
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                localStorage.setItem("apex-user-projects", JSON.stringify(stored.map((p: any) => p.id === id ? { ...p, aiResults: evt.results, score: evt.overallScore } : p)));
              } catch { /* noop */ }
            }
          } catch { /* noop */ }
        }
      }
    } catch (e) { if ((e as Error).name !== "AbortError") console.error(e); }
    finally { setIsReanalyzing(false); }
  }

  const headerBg = "linear-gradient(135deg,rgba(122,92,255,0.07) 0%,rgba(10,10,18,0.95) 100%)";
  const scoreColor = project.score >= 85 ? "#00E7A7" : project.score >= 70 ? "#FFB800" : "#FF5470";

  return (
    <div style={{ padding: "24px 24px 48px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Back */}
      <button onClick={() => router.push("/dashboard/projects")}
        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", marginBottom: 20, padding: 0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Назад к проектам
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "white", margin: 0 }}>{project.name}</h1>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99, letterSpacing: "0.1em",
              background: project.status === "Завершён" ? "rgba(0,231,167,0.12)" : "rgba(255,184,0,0.12)",
              color: project.status === "Завершён" ? "#00E7A7" : "#FFB800",
              border: `1px solid ${project.status === "Завершён" ? "rgba(0,231,167,0.25)" : "rgba(255,184,0,0.25)"}`,
            }}>● {project.status}</span>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>{project.subtitle}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isUserProject && (
            <button onClick={() => handleReanalyze()} disabled={isReanalyzing}
              style={{ height: 36, padding: "0 16px", fontSize: 11, fontWeight: 600, border: "1px solid rgba(122,92,255,0.3)", color: "#7A5CFF", background: "rgba(122,92,255,0.07)", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              {isReanalyzing ? `↻ ${reanalyzeProgress}/8 агентов` : "↻ Обновить анализ"}
            </button>
          )}
          <button style={{ height: 36, padding: "0 16px", fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.03)", borderRadius: 10, cursor: "pointer" }}>Экспорт PDF</button>
          <button style={{ height: 36, padding: "0 18px", fontSize: 11, fontWeight: 600, background: "linear-gradient(135deg,#7A5CFF,#5A8DFF)", color: "white", border: "none", borderRadius: 10, cursor: "pointer" }}>Уточнить стратегию</button>
        </div>
      </div>

      {/* Score panel */}
      <div style={{
        background: headerBg, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "20px 24px",
        display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap", marginBottom: 24, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: "0 0 auto", height: 1, background: "linear-gradient(90deg,transparent,rgba(122,92,255,0.4),transparent)" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 44, fontWeight: 800, color: scoreColor, fontFamily: "monospace", lineHeight: 1 }}>{project.score}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>Бизнес-балл</div>
        </div>
        <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 12 }}>
          {project.scores.map((item, i) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", width: 210, flexShrink: 0 }}>{item.label}</span>
              <div style={{ flex: 1 }}>
                <AnimatedBar value={item.value} color={["#7A5CFF","#5A8DFF","#00E7A7","#FFB800"][i]} delay={i * 80} />
              </div>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "monospace", width: 28, textAlign: "right", flexShrink: 0 }}>{item.value}</span>
            </div>
          ))}
        </div>
        <ScoreGauge score={project.score} />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, padding: 4, background: "rgba(255,255,255,0.04)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", width: "fit-content", marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{
              padding: "7px 18px", fontSize: 11.5, fontWeight: 600, borderRadius: 10, border: "none", cursor: "pointer",
              background: activeTab === t ? "linear-gradient(135deg,#7A5CFF,#5A8DFF)" : "transparent",
              color: activeTab === t ? "white" : "rgba(255,255,255,0.4)",
              transition: "all 0.2s",
            }}>{t}</button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Диагностика" && <DiagnosticsTab project={project} aiResults={aiResults} />}
      {activeTab === "AI Команда" && (
        <AITeamTab aiResults={aiResults} isUserProject={isUserProject} isReanalyzing={isReanalyzing}
          reanalyzeProgress={reanalyzeProgress} onReanalyze={handleReanalyze} />
      )}
      {activeTab === "Финансы" && <FinanceTab project={project} aiResults={aiResults} />}
      {activeTab === "Рынок" && <MarketTab project={project} aiResults={aiResults} />}
      {activeTab === "Риски" && <RisksTab project={project} aiResults={aiResults} />}
    </div>
  );
}
