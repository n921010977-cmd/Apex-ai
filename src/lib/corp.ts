// ─── Digital corporation — 8 departments, 30+ AI employees ────────────────────
// Powers the Command Center: an AI CEO delegates a single goal across these
// departments and their agents work it in real time.

export type Employee = { ab: string; name: string; role: string };
export type Department = {
  id: string;
  name: string;
  short: string;
  color: string;
  g: [string, string];
  lead: Employee;
  agents: Employee[];        // includes lead first
  thoughts: string[];        // "thinking out loud" snippets during work
  deliverable: string;       // what this dept produces
};

export const CEO = { ab: "SR", name: "Sophia Rivers", role: "AI CEO", color: "#818cf8", g: ["#6366f1", "#4f46e5"] as [string, string] };

export const DEPARTMENTS: Department[] = [
  {
    id: "strategy", name: "Стратегия", short: "STR", color: "#818cf8", g: ["#6366f1", "#4f46e5"],
    lead: { ab: "DW", name: "Diana Wells", role: "Стратег" },
    agents: [{ ab: "DW", name: "Diana Wells", role: "Стратег" }, { ab: "IV", name: "Igor Volkov", role: "Аналитик рынка" }, { ab: "MP", name: "Mara Popova", role: "Форсайт" }],
    thoughts: ["Разбиваю цель на 3 горизонта: 30/60/90 дней", "Определяю ключевую метрику успеха", "Нахожу самое узкое место в цели"],
    deliverable: "Стратегическая карта и приоритеты",
  },
  {
    id: "marketing", name: "Маркетинг", short: "MKT", color: "#10b981", g: ["#10b981", "#047857"],
    lead: { ab: "ET", name: "Elena Torres", role: "CMO" },
    agents: [{ ab: "ET", name: "Elena Torres", role: "CMO" }, { ab: "CM", name: "Chloe Martin", role: "Бренд" }, { ab: "AK", name: "Alex Kim", role: "Growth" }, { ab: "NB", name: "Nina Brown", role: "Рынок" }, { ab: "LF", name: "Liam Foster", role: "PR" }],
    thoughts: ["Определяю ICP и главный оффер", "Собираю связку канал → сегмент → сообщение", "Планирую тест спроса за 7 дней", "Считаю ожидаемый CAC по каналам"],
    deliverable: "План привлечения и позиционирование",
  },
  {
    id: "sales", name: "Продажи", short: "SAL", color: "#22c55e", g: ["#22c55e", "#15803d"],
    lead: { ab: "RC", name: "Ryan Cole", role: "Head of Sales" },
    agents: [{ ab: "RC", name: "Ryan Cole", role: "Head of Sales" }, { ab: "DM", name: "Diego Marín", role: "Account Exec" }, { ab: "HK", name: "Hana Kim", role: "SDR" }, { ab: "ES", name: "Emma Stone", role: "Sales Ops" }],
    thoughts: ["Строю воронку от касания до оплаты", "Пишу скрипт первого касания", "Считаю pipeline под цель по выручке"],
    deliverable: "Воронка и процесс продаж",
  },
  {
    id: "dev", name: "Разработка", short: "DEV", color: "#a855f7", g: ["#a855f7", "#7e22ce"],
    lead: { ab: "AP", name: "Aiden Park", role: "CTO" },
    agents: [{ ab: "AP", name: "Aiden Park", role: "CTO" }, { ab: "IP", name: "Ivan Petrov", role: "Backend" }, { ab: "ML", name: "Mei Lin", role: "Frontend" }, { ab: "LZ", name: "Leo Zhang", role: "ML Engineer" }],
    thoughts: ["Проектирую минимальную архитектуру под рост", "Оцениваю MVP: 2–3 недели", "Выбираю стек: Next.js + Postgres", "Планирую первые 3 сценария продукта"],
    deliverable: "Архитектура и план MVP",
  },
  {
    id: "finance", name: "Финансы", short: "FIN", color: "#3b82f6", g: ["#3b82f6", "#1d4ed8"],
    lead: { ab: "MC", name: "Marcus Chen", role: "CFO" },
    agents: [{ ab: "MC", name: "Marcus Chen", role: "CFO" }, { ab: "KP", name: "Kim Park", role: "Аналитик" }, { ab: "TE", name: "Tom Evans", role: "Инвест" }, { ab: "OH", name: "Omar Hassan", role: "Риск" }],
    thoughts: ["Считаю юнит-экономику: LTV/CAC", "Строю финмодель на 12 месяцев", "Нахожу точку безубыточности", "Оцениваю runway при текущем burn"],
    deliverable: "Финмодель и юнит-экономика",
  },
  {
    id: "legal", name: "Юр. отдел", short: "LEG", color: "#94a3b8", g: ["#94a3b8", "#475569"],
    lead: { ab: "MA", name: "Mia Larson", role: "Юрист" },
    agents: [{ ab: "MA", name: "Mia Larson", role: "Юрист" }, { ab: "GO", name: "Grace Owens", role: "Комплаенс" }, { ab: "PN", name: "Paul Nash", role: "Договоры" }],
    thoughts: ["Проверяю комплаенс и лицензии", "Готовлю договорную базу", "Ищу регуляторные блокеры запуска"],
    deliverable: "Комплаенс и договоры",
  },
  {
    id: "hr", name: "HR", short: "HR", color: "#ec4899", g: ["#ec4899", "#be185d"],
    lead: { ab: "MS", name: "Maya Scott", role: "Head of People" },
    agents: [{ ab: "MS", name: "Maya Scott", role: "Head of People" }, { ab: "NB2", name: "Noah Bennett", role: "Рекрутер" }, { ab: "IC", name: "Ivy Chen", role: "Культура" }],
    thoughts: ["Определяю первые 3 ключевые роли", "Планирую скорость найма под рост", "Собираю структуру команды"],
    deliverable: "План найма и структура",
  },
  {
    id: "analytics", name: "Аналитика", short: "ANL", color: "#0ea5e9", g: ["#0ea5e9", "#0369a1"],
    lead: { ab: "SK", name: "Sara Kim", role: "Head of Data" },
    agents: [{ ab: "SK", name: "Sara Kim", role: "Head of Data" }, { ab: "RP", name: "Raj Patel", role: "Data Eng" }, { ab: "LX", name: "Lena Fox", role: "Insights" }],
    thoughts: ["Определяю метрики и события для трекинга", "Строю прогноз выручки на 6 месяцев", "Настраиваю дашборд ключевых KPI"],
    deliverable: "Метрики и прогноз выручки",
  },
  {
    id: "design", name: "Дизайн", short: "DSN", color: "#fb923c", g: ["#fb923c", "#c2410c"],
    lead: { ab: "ZC", name: "Zoe Carter", role: "Head of Design" },
    agents: [{ ab: "ZC", name: "Zoe Carter", role: "Head of Design" }, { ab: "SP", name: "Sara Patel", role: "Продукт" }, { ab: "YT", name: "Yuki Tanaka", role: "Visual" }, { ab: "OR", name: "Owen Reed", role: "Motion" }],
    thoughts: ["Проектирую ключевой пользовательский поток", "Собираю визуальную систему и токены", "Черновик лендинга и онбординга"],
    deliverable: "UX-поток и визуальная система",
  },
];

export const TOTAL_EMPLOYEES = DEPARTMENTS.reduce((n, d) => n + d.agents.length, 0);

// какие отделы подключить под задачу (по ключевым словам)
export function routeDepartments(goal: string): string[] {
  const s = goal.toLowerCase();
  const on = new Set<string>(["strategy", "finance"]); // всегда
  if (/(маркет|клиент|бренд|реклам|прода|аудитор|канал|рост|привлеч|трафик)/.test(s)) { on.add("marketing"); on.add("sales"); }
  if (/(сайт|продукт|приложение|saas|платформ|разработ|код|mvp|ai|ии|технолог|автоматизац)/.test(s)) { on.add("dev"); on.add("design"); }
  if (/(команд|найм|сотрудник|люди|культур)/.test(s)) on.add("hr");
  if (/(данн|аналит|метрик|прогноз|отчёт|дашборд)/.test(s)) on.add("analytics");
  if (/(юрид|право|договор|лиценз|регул|комплаенс)/.test(s)) on.add("legal");
  // если мало — добавить ключевые для «бизнеса под ключ»
  for (const id of ["marketing", "dev", "design", "analytics"]) if (on.size < 6) on.add(id);
  // сохранить порядок как в DEPARTMENTS
  return DEPARTMENTS.filter(d => on.has(d.id)).map(d => d.id);
}
