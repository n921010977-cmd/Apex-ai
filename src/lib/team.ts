// ─── Canonical Apex AI executive team ────────────────────────────────────────
// Single source of truth for the 20 named AI directors shown across the app
// (dashboard, new-strategy, projects, agents, executive board). Keeping every
// screen on this one roster is what makes the product read as a coherent team
// rather than three unrelated demos.

export type TeamMember = {
  slug: string;        // stable id, used in routes (?agent=slug)
  ab: string;          // 2–3 letter avatar initials
  name: string;        // persona name — the human face of the agent
  role: string;        // short role code (CEO, CFO, …)
  title: string;       // Russian job title
  dept: "leadership" | "finance" | "marketing" | "operations" | "tech" | "product";
  tier: "c-level" | "specialist";
  c: string;           // accent color
  g: [string, string]; // gradient pair for avatar tiles
};

export const TEAM: TeamMember[] = [
  // ── C-level ──
  { slug: "ceo", ab: "SR", name: "Sophia Rivers", role: "CEO", title: "Генеральный директор",   dept: "leadership", tier: "c-level",  c: "#818cf8", g: ["#6366f1", "#4f46e5"] },
  { slug: "cfo", ab: "MC", name: "Marcus Chen",   role: "CFO", title: "Финансовый директор",    dept: "finance",    tier: "c-level",  c: "#60a5fa", g: ["#3b82f6", "#2563eb"] },
  { slug: "cmo", ab: "ET", name: "Elena Torres",  role: "CMO", title: "Директор по маркетингу", dept: "marketing",  tier: "c-level",  c: "#34d399", g: ["#10b981", "#059669"] },
  { slug: "coo", ab: "JW", name: "James Wright",  role: "COO", title: "Операционный директор",  dept: "operations", tier: "c-level",  c: "#fbbf24", g: ["#f59e0b", "#d97706"] },
  { slug: "cto", ab: "AP", name: "Aiden Park",    role: "CTO", title: "Технический директор",   dept: "tech",       tier: "c-level",  c: "#c084fc", g: ["#a855f7", "#9333ea"] },
  // ── Specialists ──
  { slug: "analyst",  ab: "KP", name: "Kim Park",     role: "Analyst", title: "Бизнес-аналитик",        dept: "finance",    tier: "specialist", c: "#60a5fa", g: ["#3b82f6", "#2563eb"] },
  { slug: "invest",   ab: "TE", name: "Tom Evans",    role: "IR",      title: "Инвест-аналитик",        dept: "finance",    tier: "specialist", c: "#60a5fa", g: ["#3b82f6", "#2563eb"] },
  { slug: "risk",     ab: "OH", name: "Omar Hassan",  role: "Risk",    title: "Риск-менеджер",          dept: "finance",    tier: "specialist", c: "#60a5fa", g: ["#3b82f6", "#2563eb"] },
  { slug: "brand",    ab: "CM", name: "Chloe Martin", role: "Brand",   title: "Бренд-стратег",          dept: "marketing",  tier: "specialist", c: "#34d399", g: ["#10b981", "#059669"] },
  { slug: "growth",   ab: "AK", name: "Alex Kim",     role: "Growth",  title: "Директор по росту",      dept: "marketing",  tier: "specialist", c: "#34d399", g: ["#10b981", "#059669"] },
  { slug: "market",   ab: "NB", name: "Nina Brown",   role: "Research", title: "Рыночный аналитик",     dept: "marketing",  tier: "specialist", c: "#34d399", g: ["#10b981", "#059669"] },
  { slug: "pr",       ab: "LF", name: "Liam Foster",  role: "PR",      title: "PR-директор",            dept: "marketing",  tier: "specialist", c: "#34d399", g: ["#10b981", "#059669"] },
  { slug: "sales",    ab: "RC", name: "Ryan Cole",    role: "Sales",   title: "Директор по продажам",   dept: "operations", tier: "specialist", c: "#fbbf24", g: ["#f59e0b", "#d97706"] },
  { slug: "hr",       ab: "MS", name: "Maya Scott",   role: "HR",      title: "HR-директор",            dept: "operations", tier: "specialist", c: "#fbbf24", g: ["#f59e0b", "#d97706"] },
  { slug: "legal",    ab: "ML", name: "Mia Larson",   role: "Legal",   title: "Юридический советник",    dept: "operations", tier: "specialist", c: "#fbbf24", g: ["#f59e0b", "#d97706"] },
  { slug: "supply",   ab: "JT", name: "Jake Turner",  role: "Supply",  title: "Цепочка поставок",       dept: "operations", tier: "specialist", c: "#fbbf24", g: ["#f59e0b", "#d97706"] },
  { slug: "data",     ab: "LZ", name: "Leo Zhang",    role: "Data",    title: "Дата-сайентист",         dept: "tech",       tier: "specialist", c: "#c084fc", g: ["#a855f7", "#9333ea"] },
  { slug: "product",  ab: "SP", name: "Sara Patel",   role: "Product", title: "Продукт-менеджер",       dept: "product",    tier: "specialist", c: "#c084fc", g: ["#a855f7", "#9333ea"] },
  { slug: "ux",       ab: "ZC", name: "Zoe Carter",   role: "UX",      title: "UX-исследователь",       dept: "product",    tier: "specialist", c: "#c084fc", g: ["#a855f7", "#9333ea"] },
  { slug: "strategy", ab: "DW", name: "Diana Wells",  role: "Strategy", title: "Стратегический советник", dept: "leadership", tier: "specialist", c: "#818cf8", g: ["#6366f1", "#4f46e5"] },
];

export const TEAM_BY_SLUG: Record<string, TeamMember> = Object.fromEntries(TEAM.map(m => [m.slug, m]));
export const C_LEVEL = TEAM.filter(m => m.tier === "c-level");
export const SPECIALISTS = TEAM.filter(m => m.tier === "specialist");
