// ─── Canonical Apex AI executive team ────────────────────────────────────────
// Single source of truth for the 20 named AI directors shown across the app
// (dashboard, new-strategy, projects, agents, executive board). Keeping every
// screen on this one roster is what makes the product read as a coherent team
// rather than three unrelated demos.
//
// Each member has an INDIVIDUAL accent color (not shared by department) so the
// team reads as 20 distinct people, and a `reportsTo` slug so the reporting
// structure (who works under which C-level director) is explicit.

export type TeamMember = {
  slug: string;        // stable id, used in routes (?agent=slug)
  ab: string;          // 2–3 letter avatar initials
  name: string;        // persona name — the human face of the agent
  role: string;        // short role code (CEO, CFO, …)
  title: string;       // Russian job title
  dept: "leadership" | "finance" | "marketing" | "operations" | "tech" | "product";
  tier: "c-level" | "specialist";
  reportsTo: string | null; // slug of the C-level lead this member reports to (null for CEO)
  c: string;           // individual accent color
  g: [string, string]; // gradient pair for avatar tiles
};

export const TEAM: TeamMember[] = [
  // ── C-level ──
  { slug: "ceo", ab: "SR", name: "Sophia Rivers", role: "CEO", title: "Генеральный директор",   dept: "leadership", tier: "c-level", reportsTo: null,  c: "#6366f1", g: ["#6366f1", "#4f46e5"] },
  { slug: "cfo", ab: "MC", name: "Marcus Chen",   role: "CFO", title: "Финансовый директор",    dept: "finance",    tier: "c-level", reportsTo: "ceo", c: "#3b82f6", g: ["#3b82f6", "#1d4ed8"] },
  { slug: "cmo", ab: "ET", name: "Elena Torres",  role: "CMO", title: "Директор по маркетингу", dept: "marketing",  tier: "c-level", reportsTo: "ceo", c: "#10b981", g: ["#10b981", "#047857"] },
  { slug: "coo", ab: "JW", name: "James Wright",  role: "COO", title: "Операционный директор",  dept: "operations", tier: "c-level", reportsTo: "ceo", c: "#f59e0b", g: ["#f59e0b", "#b45309"] },
  { slug: "cto", ab: "AP", name: "Aiden Park",    role: "CTO", title: "Технический директор",   dept: "tech",       tier: "c-level", reportsTo: "ceo", c: "#a855f7", g: ["#a855f7", "#7e22ce"] },
  // ── Finance → CFO ──
  { slug: "analyst",  ab: "KP", name: "Kim Park",     role: "Analyst",  title: "Бизнес-аналитик",     dept: "finance",    tier: "specialist", reportsTo: "cfo", c: "#0ea5e9", g: ["#0ea5e9", "#0369a1"] },
  { slug: "invest",   ab: "TE", name: "Tom Evans",    role: "IR",       title: "Инвест-аналитик",     dept: "finance",    tier: "specialist", reportsTo: "cfo", c: "#14b8a6", g: ["#14b8a6", "#0f766e"] },
  { slug: "risk",     ab: "OH", name: "Omar Hassan",  role: "Risk",     title: "Риск-менеджер",       dept: "finance",    tier: "specialist", reportsTo: "cfo", c: "#f43f5e", g: ["#f43f5e", "#be123c"] },
  // ── Marketing → CMO ──
  { slug: "brand",    ab: "CM", name: "Chloe Martin", role: "Brand",    title: "Бренд-стратег",       dept: "marketing",  tier: "specialist", reportsTo: "cmo", c: "#d946ef", g: ["#d946ef", "#a21caf"] },
  { slug: "growth",   ab: "AK", name: "Alex Kim",     role: "Growth",   title: "Директор по росту",   dept: "marketing",  tier: "specialist", reportsTo: "cmo", c: "#84cc16", g: ["#84cc16", "#4d7c0f"] },
  { slug: "market",   ab: "NB", name: "Nina Brown",   role: "Research", title: "Рыночный аналитик",   dept: "marketing",  tier: "specialist", reportsTo: "cmo", c: "#06b6d4", g: ["#06b6d4", "#0e7490"] },
  { slug: "pr",       ab: "LF", name: "Liam Foster",  role: "PR",       title: "PR-директор",         dept: "marketing",  tier: "specialist", reportsTo: "cmo", c: "#fb7185", g: ["#fb7185", "#e11d48"] },
  // ── Operations → COO ──
  { slug: "sales",    ab: "RC", name: "Ryan Cole",    role: "Sales",    title: "Директор по продажам", dept: "operations", tier: "specialist", reportsTo: "coo", c: "#22c55e", g: ["#22c55e", "#15803d"] },
  { slug: "hr",       ab: "MS", name: "Maya Scott",   role: "HR",       title: "HR-директор",         dept: "operations", tier: "specialist", reportsTo: "coo", c: "#ec4899", g: ["#ec4899", "#be185d"] },
  { slug: "legal",    ab: "ML", name: "Mia Larson",   role: "Legal",    title: "Юридический советник", dept: "operations", tier: "specialist", reportsTo: "coo", c: "#94a3b8", g: ["#94a3b8", "#475569"] },
  { slug: "supply",   ab: "JT", name: "Jake Turner",  role: "Supply",   title: "Цепочка поставок",    dept: "operations", tier: "specialist", reportsTo: "coo", c: "#eab308", g: ["#eab308", "#a16207"] },
  // ── Tech & Product → CTO ──
  { slug: "data",     ab: "LZ", name: "Leo Zhang",    role: "Data",     title: "Дата-сайентист",      dept: "tech",       tier: "specialist", reportsTo: "cto", c: "#7c3aed", g: ["#7c3aed", "#5b21b6"] },
  { slug: "product",  ab: "SP", name: "Sara Patel",   role: "Product",  title: "Продукт-менеджер",    dept: "product",    tier: "specialist", reportsTo: "cto", c: "#fb923c", g: ["#fb923c", "#c2410c"] },
  { slug: "ux",       ab: "ZC", name: "Zoe Carter",   role: "UX",       title: "UX-исследователь",    dept: "product",    tier: "specialist", reportsTo: "cto", c: "#2dd4bf", g: ["#2dd4bf", "#0d9488"] },
  // ── Advisor → CEO ──
  { slug: "strategy", ab: "DW", name: "Diana Wells",  role: "Strategy", title: "Стратегический советник", dept: "leadership", tier: "specialist", reportsTo: "ceo", c: "#818cf8", g: ["#818cf8", "#4f46e5"] },
];

export const TEAM_BY_SLUG: Record<string, TeamMember> = Object.fromEntries(TEAM.map(m => [m.slug, m]));
export const C_LEVEL = TEAM.filter(m => m.tier === "c-level");
export const SPECIALISTS = TEAM.filter(m => m.tier === "specialist");

// Reports of a given C-level director (by slug)
export const reportsOf = (slug: string): TeamMember[] => TEAM.filter(m => m.reportsTo === slug);
