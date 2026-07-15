"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Command, Bot, ListChecks, CalendarClock, Wrench,
  Filter, BarChart3, PlusSquare, Database, MousePointerClick,
} from "lucide-react";
import { markVisit } from "@/components/dashboard/EngagementPanel";

const EASE = [0.22, 1, 0.36, 1] as const;

// ─── Типы и палитра узлов ──────────────────────────────────────────────────────
type NodeType = "agent" | "topic" | "memory" | "doc" | "artifact" | "config";

const TYPE_STYLE: Record<NodeType, { hex: string; dot: string; glow: string; ring: string; chipBg: string; chipText: string; label: string }> = {
  agent:    { hex: "#a78bfa", dot: "bg-violet-400",  glow: "shadow-[0_0_18px_rgba(167,139,250,0.55)]", ring: "ring-violet-300",  chipBg: "bg-violet-500/10 border-violet-400/30",  chipText: "text-violet-300", label: "АГЕНТ" },
  topic:    { hex: "#22d3ee", dot: "bg-cyan-400",    glow: "shadow-[0_0_15px_rgba(34,211,238,0.5)]",   ring: "ring-cyan-300",    chipBg: "bg-cyan-500/10 border-cyan-400/30",      chipText: "text-cyan-300",   label: "ТОПИК-ХАБ" },
  memory:   { hex: "#fbbf24", dot: "bg-amber-400",   glow: "shadow-[0_0_13px_rgba(251,191,36,0.5)]",   ring: "ring-amber-300",   chipBg: "bg-amber-500/10 border-amber-400/30",    chipText: "text-amber-300",  label: "ПАМЯТЬ" },
  doc:      { hex: "#60a5fa", dot: "bg-blue-400",    glow: "shadow-[0_0_13px_rgba(96,165,250,0.5)]",   ring: "ring-blue-300",    chipBg: "bg-blue-500/10 border-blue-400/30",      chipText: "text-blue-300",   label: "ДОКУМЕНТ" },
  artifact: { hex: "#34d399", dot: "bg-emerald-400", glow: "shadow-[0_0_13px_rgba(52,211,153,0.5)]",   ring: "ring-emerald-300", chipBg: "bg-emerald-500/10 border-emerald-400/30",chipText: "text-emerald-300",label: "АРТЕФАКТ" },
  config:   { hex: "#94a3b8", dot: "bg-slate-400",   glow: "shadow-[0_0_10px_rgba(148,163,184,0.4)]",  ring: "ring-slate-300",   chipBg: "bg-slate-500/10 border-slate-400/30",    chipText: "text-slate-300",  label: "КОНФИГ" },
};

const TYPE_HINT: Record<NodeType, string> = {
  agent:    "AI-сотрудник, который работает с данными",
  topic:    "Хаб, объединяющий знания по одной теме",
  memory:   "Рабочая память: что агенты помнят",
  doc:      "Документ в хранилище знаний",
  artifact: "Результат работы: модель, отчёт, выгрузка",
  config:   "Системная настройка",
};

interface VaultNode {
  id: string;
  label: string;
  title: string;
  type: NodeType;
  x: number;
  y: number;
  size: number;
  desc: string;
  scope: "ЛОКАЛЬНЫЙ" | "ОБЩИЙ";
  bytes: string;
  rels: string[];
}

// ─── Данные графа ─────────────────────────────────────────────────────────────
const NODES: VaultNode[] = [
  // агенты
  { id: "ceo",        label: "CEO / Оркестратор", title: "CEO / Оркестратор", type: "agent", x: 48, y: 42, size: 30, scope: "ОБЩИЙ", bytes: "0 Б", desc: "Распределяет работу, держит контекст всей системы и координирует агентов-специалистов.", rels: ["АГЕНТ-СПЕЦИАЛИСТ", "ОРКЕСТРИРУЕТ", "ВЛАДЕЕТ КОНТЕКСТОМ"] },
  { id: "researcher", label: "Researcher",         title: "Researcher · Разведка", type: "agent", x: 64, y: 28, size: 24, scope: "ОБЩИЙ", bytes: "0 Б", desc: "Собирает данные о рынке, конкурентах и клиентах; наполняет базу исследований.", rels: ["СБОР ДАННЫХ", "ПИШЕТ В ПАМЯТЬ", "ВЛАДЕЕТ КОНТЕКСТОМ"] },
  { id: "cmo",        label: "CMO",                title: "CMO · Голос рынка", type: "agent", x: 34, y: 56, size: 24, scope: "ОБЩИЙ", bytes: "0 Б", desc: "Формирует бренд-нарратив, позиционирование и контент-систему.", rels: ["ИНСАЙТЫ РЫНКА", "ПУБЛИКУЕТ", "ВЛАДЕЕТ КОНТЕКСТОМ"] },
  { id: "sales",      label: "Sales Rep",          title: "Sales Rep · Выручка", type: "agent", x: 58, y: 63, size: 24, scope: "ОБЩИЙ", bytes: "0 Б", desc: "Ведёт воронку лидов, квалификацию и закрытие сделок.", rels: ["ОПЕРАЦИИ ВЫРУЧКИ", "ЧИТАЕТ ВОРОНКУ", "ВЛАДЕЕТ КОНТЕКСТОМ"] },
  { id: "dev",        label: "Dev",                title: "Dev · Сборка продукта", type: "agent", x: 27, y: 32, size: 22, scope: "ОБЩИЙ", bytes: "0 Б", desc: "Проектирует архитектуру и собирает продукт; читает конфигурационные узлы.", rels: ["СИСТЕМА СБОРКИ", "ЧИТАЕТ КОНФИГ", "ВЛАДЕЕТ КОНТЕКСТОМ"] },
  { id: "data",       label: "Data Analyst",       title: "Data Analyst · Сигналы", type: "agent", x: 71, y: 50, size: 22, scope: "ОБЩИЙ", bytes: "0 Б", desc: "Строит метрики и прогнозы, следит за сигналами по всей компании.", rels: ["СЛОЙ СИГНАЛОВ", "АГРЕГИРУЕТ", "ВЛАДЕЕТ КОНТЕКСТОМ"] },
  // топик-хабы
  { id: "t_pipeline", label: "Воронка лидов",   title: "Хаб «Воронка лидов»",   type: "topic", x: 19, y: 47, size: 18, scope: "ОБЩИЙ", bytes: "12 КБ", desc: "Объединяет память, документы и артефакты по воронке продаж.", rels: ["ТОПИК-ХАБ", "ГРУППИРУЕТ", "ОБЩИЙ КОНТЕКСТ"] },
  { id: "t_content",  label: "Контент-движок",  title: "Хаб «Контент-движок»",  type: "topic", x: 78, y: 34, size: 18, scope: "ОБЩИЙ", bytes: "9 КБ",  desc: "Хаб контент-системы: промпты, черновики и аналитика публикаций.", rels: ["ТОПИК-ХАБ", "ГРУППИРУЕТ", "ОБЩИЙ КОНТЕКСТ"] },
  { id: "t_research", label: "База исследований", title: "Хаб «База исследований»", type: "topic", x: 41, y: 19, size: 18, scope: "ОБЩИЙ", bytes: "15 КБ", desc: "Агрегирует память исследований и рыночные документы.", rels: ["ТОПИК-ХАБ", "ГРУППИРУЕТ", "ОБЩИЙ КОНТЕКСТ"] },
  { id: "t_ops",      label: "Опер. конфиг",    title: "Хаб «Операционный конфиг»", type: "topic", x: 66, y: 76, size: 16, scope: "ОБЩИЙ", bytes: "6 КБ",  desc: "Хаб операционной конфигурации и системных узлов.", rels: ["ТОПИК-ХАБ", "ГРУППИРУЕТ", "СИСТЕМА"] },
  // память
  { id: "m1", label: "Последний прогон",   title: "Последний прогон",   type: "memory", x: 30, y: 70, size: 13, scope: "ЛОКАЛЬНЫЙ", bytes: "3.2 КБ", desc: "Рабочая память последнего прогона воронки и его результата.", rels: ["ЗАПИСЬ ПАМЯТИ", "ВСПОМИНАЕТСЯ", "ЛОКАЛЬНЫЙ"] },
  { id: "m2", label: "Промпт этапа 4",     title: "Промпт этапа 4",     type: "memory", x: 52, y: 16, size: 13, scope: "ЛОКАЛЬНЫЙ", bytes: "2.1 КБ", desc: "Сохранённое состояние промпта для исследовательского цикла.", rels: ["ЗАПИСЬ ПАМЯТИ", "ВСПОМИНАЕТСЯ", "ЛОКАЛЬНЫЙ"] },
  { id: "m3", label: "Квалиф. лиды",       title: "Квалифицированные лиды", type: "memory", x: 74, y: 61, size: 13, scope: "ОБЩИЙ", bytes: "5.4 КБ", desc: "Общая память о квалифицированных лидах и заметках скоринга.", rels: ["ЗАПИСЬ ПАМЯТИ", "ОБЩАЯ", "СКОРИНГ"] },
  { id: "m4", label: "Мета-память",        title: "Мета-память",        type: "memory", x: 15, y: 28, size: 13, scope: "ОБЩИЙ", bytes: "1.8 КБ", desc: "Память системного уровня: что компания уже знает.", rels: ["ЗАПИСЬ ПАМЯТИ", "МЕТА", "ОБЩАЯ"] },
  { id: "m5", label: "Дневной синк",       title: "Дневной синк",       type: "memory", x: 45, y: 79, size: 13, scope: "ЛОКАЛЬНЫЙ", bytes: "2.7 КБ", desc: "Снимок последней ежедневной синхронизации агентов.", rels: ["ЗАПИСЬ ПАМЯТИ", "СНИМОК", "ЛОКАЛЬНЫЙ"] },
  { id: "m6", label: "Состояние сессии",   title: "Состояние сессии",   type: "memory", x: 86, y: 46, size: 13, scope: "ЛОКАЛЬНЫЙ", bytes: "0.9 КБ", desc: "Волатильное состояние сессии, которое вспоминает оркестратор.", rels: ["ЗАПИСЬ ПАМЯТИ", "ВСПОМИНАЕТСЯ", "ЛОКАЛЬНЫЙ"] },
  // документы
  { id: "d1", label: "Недельный бриф",     title: "Недельный бриф воронки", type: "doc", x: 21, y: 60, size: 13, scope: "ОБЩИЙ", bytes: "18 КБ", desc: "Документ хранилища: недельный бриф воронки для Sales и CEO.", rels: ["ДОКУМЕНТ", "ССЫЛАЮТСЯ", "ИНДЕКСИРОВАН"] },
  { id: "d2", label: "База контента",      title: "База интеллекта контента", type: "doc", x: 56, y: 34, size: 13, scope: "ОБЩИЙ", bytes: "42 КБ", desc: "Индексированная база эффективности контента и тем.", rels: ["ДОКУМЕНТ", "ИНДЕКСИРОВАН", "ЗАПРАШИВАЮТ"] },
  { id: "d3", label: "Карта рынка",        title: "Карта рынка",        type: "doc", x: 69, y: 18, size: 13, scope: "ОБЩИЙ", bytes: "11 КБ", desc: "Исследовательский документ: сегменты, конкуренты и ниши.", rels: ["ДОКУМЕНТ", "ССЫЛАЮТСЯ", "ИССЛЕДОВАНИЕ"] },
  { id: "d4", label: "Портрет клиента",    title: "Портрет клиента (ICP)", type: "doc", x: 38, y: 45, size: 13, scope: "ОБЩИЙ", bytes: "6 КБ",  desc: "Каноническое описание идеального клиента.", rels: ["ДОКУМЕНТ", "КАНОНИЧЕСКИЙ", "ССЫЛАЮТСЯ"] },
  { id: "d5", label: "Плейбук",            title: "Спецификация плейбука", type: "doc", x: 81, y: 68, size: 13, scope: "ОБЩИЙ", bytes: "24 КБ", desc: "Операционный плейбук для Ops и Sales.", rels: ["ДОКУМЕНТ", "СПЕЦИФИКАЦИЯ", "ССЫЛАЮТСЯ"] },
  // артефакты
  { id: "a1", label: "Прогноз v3",       title: "Прогноз выручки v3", type: "artifact", x: 14, y: 71, size: 12, scope: "ЛОКАЛЬНЫЙ", bytes: "7.5 КБ", desc: "Артефакт данных: прогноз выручки от Data Analyst.", rels: ["АРТЕФАКТ", "СОЗДАН АГЕНТОМ", "ВЕРСИОНИРУЕТСЯ"] },
  { id: "a2", label: "Срез воронки",     title: "Срез воронки",       type: "artifact", x: 61, y: 47, size: 12, scope: "ЛОКАЛЬНЫЙ", bytes: "4.1 КБ", desc: "Снимок текущей конверсии по этапам воронки.", rels: ["АРТЕФАКТ", "СНИМОК", "ВЕРСИОНИРУЕТСЯ"] },
  { id: "a3", label: "Модель скоринга",  title: "Модель скоринга лидов", type: "artifact", x: 47, y: 58, size: 12, scope: "ОБЩИЙ", bytes: "9.8 КБ", desc: "Модель, по которой квалифицируются лиды в воронке.", rels: ["АРТЕФАКТ", "МОДЕЛЬ", "СОЗДАН АГЕНТОМ"] },
  { id: "a4", label: "Выгрузка когорт",  title: "Выгрузка когорт",    type: "artifact", x: 73, y: 27, size: 12, scope: "ЛОКАЛЬНЫЙ", bytes: "13 КБ",  desc: "Экспорт когортного анализа для контент-движка.", rels: ["АРТЕФАКТ", "ЭКСПОРТ", "ПОТРЕБЛЯЕТСЯ"] },
  // конфиги
  { id: "c1", label: "Правила роутинга", title: "Правила роутинга", type: "config", x: 36, y: 80, size: 11, scope: "ОБЩИЙ", bytes: "1.2 КБ", desc: "Конфиг: правила, по которым оркестратор распределяет задачи.", rels: ["КОНФИГ", "ЧИТАЕТСЯ", "СИСТЕМА"] },
  { id: "c2", label: "Ключи хранилища",  title: "Ключи хранилища",  type: "config", x: 88, y: 57, size: 11, scope: "ОБЩИЙ", bytes: "0.4 КБ", desc: "Ключи доступа и области видимости хранилища знаний.", rels: ["КОНФИГ", "ЗАЩИЩЁН", "СИСТЕМА"] },
  { id: "c3", label: "Планировщик",      title: "Задачи планировщика", type: "config", x: 24, y: 17, size: 11, scope: "ОБЩИЙ", bytes: "0.8 КБ", desc: "Конфигурация фоновых задач и синхронизаций.", rels: ["КОНФИГ", "ПО РАСПИСАНИЮ", "СИСТЕМА"] },
];

const EDGES: [string, string][] = [
  ["researcher", "ceo"], ["cmo", "ceo"], ["sales", "ceo"], ["dev", "ceo"], ["data", "ceo"],
  ["t_pipeline", "sales"], ["t_pipeline", "cmo"], ["t_content", "cmo"], ["t_content", "researcher"],
  ["t_research", "researcher"], ["t_research", "data"], ["t_ops", "dev"], ["t_ops", "ceo"],
  ["m1", "t_pipeline"], ["m1", "sales"], ["m2", "t_research"], ["m2", "researcher"],
  ["m3", "sales"], ["m3", "data"], ["m4", "ceo"], ["m4", "t_research"],
  ["m5", "ceo"], ["m5", "t_ops"], ["m6", "ceo"], ["m6", "data"],
  ["d1", "t_pipeline"], ["d1", "ceo"], ["d2", "t_content"], ["d2", "data"],
  ["d3", "t_research"], ["d3", "researcher"], ["d4", "cmo"], ["d4", "t_pipeline"],
  ["d5", "t_ops"], ["d5", "sales"],
  ["a1", "data"], ["a1", "t_pipeline"], ["a2", "data"], ["a2", "sales"],
  ["a3", "sales"], ["a3", "t_pipeline"], ["a4", "t_content"], ["a4", "data"],
  ["c1", "ceo"], ["c1", "t_ops"], ["c2", "t_ops"], ["c3", "dev"], ["c3", "t_ops"],
  ["d2", "cmo"], ["m3", "d1"], ["a3", "m3"], ["d4", "researcher"], ["m2", "d3"],
];

const NODE_BY_ID = Object.fromEntries(NODES.map(n => [n.id, n]));
const LINKS_OF: Record<string, number> = {};
EDGES.forEach(([a, b]) => { LINKS_OF[a] = (LINKS_OF[a] || 0) + 1; LINKS_OF[b] = (LINKS_OF[b] || 0) + 1; });

// «магистрали» — связи между агентами и хабами, по ним текут частицы данных
const BACKBONE = EDGES.map((e, i) => ({ e, i })).filter(({ e }) => {
  const a = NODE_BY_ID[e[0]].type, b = NODE_BY_ID[e[1]].type;
  return (a === "agent" || a === "topic") && (b === "agent" || b === "topic");
});

// ─── Левое меню ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "command",   label: "Командный центр",    icon: Command },
  { id: "agents",    label: "Агенты",             icon: Bot },
  { id: "tasks",     label: "Задачи",             icon: ListChecks },
  { id: "schedule",  label: "Расписание",         icon: CalendarClock },
  { id: "tools",     label: "Инструменты",        icon: Wrench },
  { id: "pipeline",  label: "Воронка лидов",      icon: Filter },
  { id: "analytics", label: "Аналитика контента", icon: BarChart3 },
  { id: "content",   label: "Контент",            icon: PlusSquare },
  { id: "vault",     label: "Хранилище знаний",   icon: Database },
];

type AgentStatus = "working" | "waiting" | "idle";
const AGENT_LIST: { id: string; name: string; layer: string; status: AgentStatus }[] = [
  { id: "ceo",        name: "CEO",          layer: "КОМАНДНЫЙ УРОВЕНЬ", status: "working" },
  { id: "researcher", name: "Researcher",   layer: "СБОР ДАННЫХ",       status: "waiting" },
  { id: "cmo",        name: "CMO",          layer: "ГОЛОС РЫНКА",       status: "waiting" },
  { id: "sales",      name: "Sales Rep",    layer: "ВЫРУЧКА",           status: "working" },
  { id: "dev",        name: "Dev",          layer: "СБОРКА ПРОДУКТА",   status: "idle" },
  { id: "data",       name: "Data Analyst", layer: "СЛОЙ СИГНАЛОВ",     status: "idle" },
];

const STATUS_STYLE: Record<AgentStatus, { dot: string; text: string; label: string }> = {
  working: { dot: "bg-emerald-400", text: "text-emerald-400", label: "в работе" },
  waiting: { dot: "bg-amber-400",   text: "text-amber-400",   label: "ожидает" },
  idle:    { dot: "bg-slate-500",   text: "text-slate-400",   label: "свободен" },
};

// ─── Страница ─────────────────────────────────────────────────────────────────
export default function KnowledgeVaultPage() {
  const [activeTab, setActiveTab] = useState("vault");
  const [selectedNode, setSelectedNode] = useState<string>("ceo");
  const [hovered, setHovered] = useState<string | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => { markVisit("vault"); }, []);

  const node = NODE_BY_ID[selectedNode] ?? NODE_BY_ID.ceo;
  const style = TYPE_STYLE[node.type];
  const focus = hovered ?? selectedNode;

  const activeEdges = useMemo(() => {
    const s = new Set<number>();
    EDGES.forEach((e, i) => { if (e[0] === focus || e[1] === focus) s.add(i); });
    return s;
  }, [focus]);

  const neighborIds = useMemo(() => {
    const s = new Set<string>([focus]);
    EDGES.forEach(e => { if (e[0] === focus) s.add(e[1]); if (e[1] === focus) s.add(e[0]); });
    return s;
  }, [focus]);

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    NODES.forEach(n => { c[n.type] = (c[n.type] || 0) + 1; });
    return c;
  }, []);

  return (
    <div className="h-screen w-full flex bg-slate-950 text-slate-300 overflow-hidden">

      {/* ═══ Левая панель ═══ */}
      <aside className="w-72 flex-shrink-0 border-r border-slate-800 flex flex-col bg-slate-950/80 backdrop-blur">
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 text-left">
          <div className="size-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-violet-600/30 border border-blue-400/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_18px_rgba(59,130,246,0.25)]">
            <Database size={17} className="text-blue-300" />
          </div>
          <div className="min-w-0 text-left">
            <div className="text-[15px] font-bold text-slate-100 tracking-tight truncate">Apex Agentic OS</div>
            <div className="text-[9px] font-mono tracking-[0.18em] text-slate-500 uppercase">Операции агентного роста</div>
          </div>
        </div>

        <nav className="px-3 py-2 flex flex-col gap-0.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-start gap-3 px-3 py-2 rounded-lg text-left text-[13px] transition-colors ${
                  active ? "bg-blue-900/20 text-blue-400 border border-blue-500/20" : "text-slate-400 border border-transparent hover:bg-slate-800/40 hover:text-slate-200"
                }`}>
                <Icon size={15} className="flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex-1 overflow-y-auto px-3 pb-4 mt-2">
          <div className="px-2 pb-2 text-left text-[10px] font-mono font-semibold tracking-[0.2em] text-blue-400/80 uppercase">Агенты</div>
          <div className="flex flex-col gap-1.5">
            {AGENT_LIST.map(a => {
              const st = STATUS_STYLE[a.status];
              const selected = selectedNode === a.id;
              return (
                <button key={a.id}
                  onClick={() => setSelectedNode(a.id)}
                  onMouseEnter={() => setHovered(a.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-left transition-colors backdrop-blur ${
                    selected ? "border-violet-400/40 bg-violet-500/[0.08]" : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                  }`}>
                  <span className="min-w-0 text-left">
                    <span className="block text-[13px] font-semibold text-slate-100 truncate">{a.name}</span>
                    <span className="block text-[9px] font-mono tracking-[0.14em] text-slate-500 uppercase truncate">{a.layer}</span>
                  </span>
                  <span className={`flex items-center gap-1.5 flex-shrink-0 px-2 py-0.5 rounded-md border border-slate-700/60 bg-slate-900/60 text-[10px] font-mono ${st.text}`}>
                    <span className={`size-1.5 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ═══ Центр: карта ═══ */}
      <main className="flex-1 relative flex flex-col min-w-0">
        <div className="flex items-start justify-between gap-4 px-7 pt-6 pb-3 text-left">
          <div className="min-w-0 text-left">
            <h1 className="text-[21px] font-bold text-slate-100 tracking-tight text-left">Живая карта памяти и знаний</h1>
            <p className="text-[13px] text-slate-500 mt-0.5 text-left">Агенты, их память, документы, артефакты данных и топик-хабы — всё связано в одну систему.</p>
          </div>
          <div className="flex-shrink-0 px-3.5 py-1.5 rounded-lg border border-blue-500/25 bg-blue-500/10 text-blue-300 text-[12px] font-mono">
            {NODES.length} узлов · {EDGES.length} связей
          </div>
        </div>

        {/* подсказка */}
        <div className="flex items-center gap-2 px-7 pb-3 text-left text-[11.5px] text-slate-500">
          <MousePointerClick size={12} className="text-blue-400/70" />
          Наведите — подсветятся связи · кликните узел — детали справа · частицы показывают поток данных
        </div>

        {/* граф */}
        <div className="flex-1 relative mx-5 rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(60%_55%_at_50%_45%,rgba(59,130,246,0.06),transparent_70%)]" />

          {/* рёбра */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {EDGES.map((e, i) => {
              const a = NODE_BY_ID[e[0]], b = NODE_BY_ID[e[1]];
              if (!a || !b) return null;
              const hot = activeEdges.has(i);
              return (
                <motion.line key={i}
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={hot ? `${TYPE_STYLE[a.type].hex}99` : "rgba(148,163,184,0.10)"}
                  strokeWidth={hot ? 1.6 : 1}
                  vectorEffect="non-scaling-stroke"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: reduce ? 0 : 0.2 + (i % 12) * 0.06, ease: EASE }}
                />
              );
            })}
          </svg>

          {/* частицы данных по магистралям */}
          {!reduce && BACKBONE.map(({ e }, k) => {
            const a = NODE_BY_ID[e[0]], b = NODE_BY_ID[e[1]];
            const c = TYPE_STYLE[a.type].hex;
            return (
              <motion.span key={`pk-${k}`}
                className="absolute w-[5px] h-[5px] -ml-[2.5px] -mt-[2.5px] rounded-full pointer-events-none"
                style={{ background: c, boxShadow: `0 0 8px ${c}` }}
                initial={{ left: `${a.x}%`, top: `${a.y}%`, opacity: 0 }}
                animate={{ left: [`${a.x}%`, `${b.x}%`], top: [`${a.y}%`, `${b.y}%`], opacity: [0, 0.9, 0] }}
                transition={{ duration: 2 + (k % 4) * 0.5, repeat: Infinity, delay: k * 0.55, ease: "easeInOut" }}
              />
            );
          })}

          {/* узлы */}
          {NODES.map((n, i) => {
            const ts = TYPE_STYLE[n.type];
            const isSel = n.id === selectedNode;
            const near = neighborIds.has(n.id);
            const dim = !near;
            return (
              <motion.button key={n.id}
                onClick={() => setSelectedNode(n.id)}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-start group"
                style={{ left: `${n.x}%`, top: `${n.y}%` }}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: dim ? 0.4 : 1, scale: 1 }}
                transition={{ opacity: { duration: 0.3 }, scale: { duration: 0.5, delay: reduce ? 0 : Math.min(i * 0.03, 0.7), ease: EASE } }}
                title={`${ts.label}: ${n.label}`}
              >
                <motion.span
                  className={`block rounded-full ${ts.dot} ${ts.glow} ${isSel ? `ring-2 ring-offset-2 ring-offset-slate-950 ${ts.ring}` : ""}`}
                  style={{ width: n.size, height: n.size }}
                  animate={reduce ? undefined : { scale: hovered === n.id ? 1.25 : [1, 1.1, 1], opacity: [0.88, 1, 0.88] }}
                  transition={reduce ? undefined : { scale: hovered === n.id ? { duration: 0.2 } : { duration: 2.4 + (i % 5) * 0.5, repeat: Infinity, ease: "easeInOut", delay: (i % 7) * 0.3 }, opacity: { duration: 2.4 + (i % 5) * 0.5, repeat: Infinity, ease: "easeInOut", delay: (i % 7) * 0.3 } }}
                />
                <span className={`mt-1.5 text-[9px] font-mono whitespace-nowrap text-left transition-colors ${
                  isSel ? "text-slate-100" : n.type === "agent" ? "text-slate-300" : dim ? "text-slate-600" : "text-slate-400 group-hover:text-slate-200"
                }`}>
                  {n.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* легенда типов — для понятности */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-7 py-3.5 text-left">
          {(Object.keys(TYPE_STYLE) as NodeType[]).map(t => (
            <span key={t} className="inline-flex items-center gap-2 text-[11px] text-slate-400" title={TYPE_HINT[t]}>
              <span className={`size-2.5 rounded-full ${TYPE_STYLE[t].dot} ${TYPE_STYLE[t].glow}`} />
              {TYPE_STYLE[t].label.toLowerCase()}
              <b className="font-mono text-[10px] text-slate-600">{typeCounts[t]}</b>
            </span>
          ))}
        </div>
      </main>

      {/* ═══ Правая панель: инспектор ═══ */}
      <aside className="w-96 flex-shrink-0 border-l border-slate-800 bg-slate-950/80 backdrop-blur overflow-y-auto">
        <motion.div key={node.id}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: EASE }}
          className="p-6 text-left">
          <div className="flex items-center justify-start gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-mono font-semibold tracking-wide ${style.chipBg} ${style.chipText}`}>
              <span className={`size-1.5 rounded-full ${style.dot}`} />
              {style.label}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md border border-slate-700 bg-slate-800/50 text-slate-300 text-[10px] font-mono font-semibold tracking-wide">
              {node.scope}
            </span>
          </div>

          <h2 className="mt-4 text-[24px] leading-tight font-bold text-slate-100 tracking-tight text-left">{node.title}</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-slate-400 text-left">{node.desc}</p>
          <p className="mt-2 text-[11.5px] leading-relaxed text-slate-600 text-left">{TYPE_HINT[node.type]}.</p>

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            {[
              { k: "ТИП", v: style.label },
              { k: "ОБЛАСТЬ", v: node.scope },
              { k: "РАЗМЕР", v: node.bytes },
              { k: "СВЯЗИ", v: `${LINKS_OF[node.id] ?? 0}` },
            ].map(m => (
              <div key={m.k} className="px-3.5 py-3 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur text-left">
                <div className="text-[9px] font-mono tracking-[0.18em] text-slate-500 uppercase text-left">{m.k}</div>
                <div className="mt-1 text-[12.5px] font-mono font-semibold text-blue-300 text-left">{m.v}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap justify-start gap-2">
            {node.rels.map((r, i) => (
              <span key={`${r}-${i}`} className="px-2.5 py-1.5 rounded-lg border border-slate-700/70 bg-slate-800/40 text-slate-300 text-[10px] font-mono tracking-wide">
                {r}
              </span>
            ))}
          </div>

          <div className="mt-7 text-left">
            <div className="text-[10px] font-mono tracking-[0.2em] text-slate-500 uppercase text-left">Связанные узлы</div>
            <div className="mt-2.5 flex flex-col gap-1.5">
              {EDGES.filter(e => e[0] === node.id || e[1] === node.id).slice(0, 8).map((e, i) => {
                const other = NODE_BY_ID[e[0] === node.id ? e[1] : e[0]];
                if (!other) return null;
                const ots = TYPE_STYLE[other.type];
                return (
                  <button key={`${other.id}-${i}`}
                    onClick={() => setSelectedNode(other.id)}
                    onMouseEnter={() => setHovered(other.id)}
                    onMouseLeave={() => setHovered(null)}
                    className="w-full flex items-center justify-start gap-2.5 px-3 py-2 rounded-lg border border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/40 transition-colors text-left">
                    <span className={`size-2 rounded-full flex-shrink-0 ${ots.dot}`} />
                    <span className="text-[12px] text-slate-300 truncate">{other.label}</span>
                    <span className="ml-auto text-[9px] font-mono text-slate-600 uppercase flex-shrink-0">{ots.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </aside>
    </div>
  );
}
