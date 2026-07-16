"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { markVisit } from "@/components/dashboard/EngagementPanel";
import { X, ZoomIn, ZoomOut, RotateCcw, Info } from "lucide-react";

// ── Design tokens ──────────────────────────────────────────────────────────────
const BG    = "#05060A";
const BORD  = "rgba(255,255,255,0.07)";
const BORD_H= "rgba(255,255,255,0.13)";
const SURF  = "rgba(255,255,255,0.025)";
const TP    = "#E5E7EB";
const TS    = "rgba(255,255,255,0.5)";
const TM    = "rgba(255,255,255,0.28)";
const MONO  = "var(--font-geist-mono), ui-monospace, monospace";
const EASE  = [0.22, 1, 0.36, 1] as const;

// ── Node types ─────────────────────────────────────────────────────────────────
type NodeType = "agent" | "topic" | "memory" | "doc" | "artifact" | "config";

const TYPE_COLOR: Record<NodeType, string> = {
  agent:    "#a78bfa",
  topic:    "#22d3ee",
  memory:   "#fbbf24",
  doc:      "#60a5fa",
  artifact: "#34d399",
  config:   "#94a3b8",
};
const TYPE_LABEL: Record<NodeType, string> = {
  agent: "Агент", topic: "Топик-хаб", memory: "Память",
  doc: "Документ", artifact: "Артефакт", config: "Конфиг",
};
const TYPE_DESC: Record<NodeType, string> = {
  agent:    "Специализированный AI-агент системы",
  topic:    "Тематический хаб, объединяет узлы",
  memory:   "Персистентная память агента",
  doc:      "Документ из базы знаний",
  artifact: "Сгенерированный артефакт",
  config:   "Системная конфигурация",
};

// ── Vault nodes ────────────────────────────────────────────────────────────────
interface VaultNode {
  id: string; label: string; title: string; type: NodeType;
  px: number; py: number;  // percent positions → seeded layout
  size: number; desc: string; scope: "ЛОКАЛЬНЫЙ" | "ОБЩИЙ"; bytes: string; rels: string[];
}

const RAW_NODES: VaultNode[] = [
  { id:"ceo",        label:"CEO / Оркестратор",  title:"CEO / Оркестратор",       type:"agent",    px:48, py:42, size:30, scope:"ОБЩИЙ",    bytes:"0 Б",    desc:"Распределяет работу, держит контекст всей системы и координирует агентов-специалистов.", rels:["АГЕНТ-СПЕЦИАЛИСТ","ОРКЕСТРИРУЕТ","ВЛАДЕЕТ КОНТЕКСТОМ"] },
  { id:"researcher", label:"Researcher",          title:"Researcher · Разведка",   type:"agent",    px:64, py:28, size:24, scope:"ОБЩИЙ",    bytes:"0 Б",    desc:"Собирает данные о рынке, конкурентах и клиентах.", rels:["СБОР ДАННЫХ","ПИШЕТ В ПАМЯТЬ","ВЛАДЕЕТ КОНТЕКСТОМ"] },
  { id:"cmo",        label:"CMO",                 title:"CMO · Голос рынка",       type:"agent",    px:34, py:56, size:24, scope:"ОБЩИЙ",    bytes:"0 Б",    desc:"Формирует бренд-нарратив, позиционирование и контент-систему.", rels:["ИНСАЙТЫ РЫНКА","ПУБЛИКУЕТ","ВЛАДЕЕТ КОНТЕКСТОМ"] },
  { id:"sales",      label:"Sales Rep",           title:"Sales Rep · Выручка",     type:"agent",    px:58, py:64, size:24, scope:"ОБЩИЙ",    bytes:"0 Б",    desc:"Ведёт воронку лидов, квалификацию и закрытие сделок.", rels:["ОПЕРАЦИИ ВЫРУЧКИ","ЧИТАЕТ ВОРОНКУ","ВЛАДЕЕТ КОНТЕКСТОМ"] },
  { id:"dev",        label:"Dev",                 title:"Dev · Сборка продукта",   type:"agent",    px:27, py:32, size:22, scope:"ОБЩИЙ",    bytes:"0 Б",    desc:"Проектирует архитектуру и собирает продукт.", rels:["СИСТЕМА СБОРКИ","ЧИТАЕТ КОНФИГ","ВЛАДЕЕТ КОНТЕКСТОМ"] },
  { id:"data",       label:"Data Analyst",        title:"Data Analyst · Сигналы", type:"agent",    px:71, py:50, size:22, scope:"ОБЩИЙ",    bytes:"0 Б",    desc:"Строит метрики и прогнозы, следит за сигналами.", rels:["СЛОЙ СИГНАЛОВ","АГРЕГИРУЕТ","ВЛАДЕЕТ КОНТЕКСТОМ"] },
  { id:"t_pipeline", label:"Воронка лидов",       title:"Хаб «Воронка лидов»",    type:"topic",    px:19, py:47, size:18, scope:"ОБЩИЙ",    bytes:"12 КБ",  desc:"Объединяет память, документы и артефакты по воронке продаж.", rels:["ТОПИК-ХАБ","ГРУППИРУЕТ","ОБЩИЙ КОНТЕКСТ"] },
  { id:"t_content",  label:"Контент-движок",      title:"Хаб «Контент-движок»",   type:"topic",    px:78, py:34, size:18, scope:"ОБЩИЙ",    bytes:"9 КБ",   desc:"Хаб контент-системы: промпты, черновики и аналитика.", rels:["ТОПИК-ХАБ","ГРУППИРУЕТ","ОБЩИЙ КОНТЕКСТ"] },
  { id:"t_research", label:"База исследований",   title:"Хаб «База исследований»",type:"topic",    px:41, py:19, size:18, scope:"ОБЩИЙ",    bytes:"15 КБ",  desc:"Агрегирует память исследований и рыночные документы.", rels:["ТОПИК-ХАБ","ГРУППИРУЕТ","ОБЩИЙ КОНТЕКСТ"] },
  { id:"t_ops",      label:"Опер. конфиг",        title:"Хаб «Операционный конфиг»",type:"topic",  px:66, py:76, size:16, scope:"ОБЩИЙ",    bytes:"6 КБ",   desc:"Хаб операционной конфигурации и системных узлов.", rels:["ТОПИК-ХАБ","ГРУППИРУЕТ","СИСТЕМА"] },
  { id:"m1",         label:"Последний прогон",    title:"Последний прогон",        type:"memory",   px:30, py:70, size:13, scope:"ЛОКАЛЬНЫЙ",bytes:"3.2 КБ", desc:"Рабочая память последнего прогона воронки.", rels:["ЗАПИСЬ ПАМЯТИ","ВСПОМИНАЕТСЯ","ЛОКАЛЬНЫЙ"] },
  { id:"m2",         label:"Промпт этапа 4",      title:"Промпт этапа 4",          type:"memory",   px:52, py:16, size:13, scope:"ЛОКАЛЬНЫЙ",bytes:"2.1 КБ", desc:"Сохранённое состояние промпта для исследовательского цикла.", rels:["ЗАПИСЬ ПАМЯТИ","ВСПОМИНАЕТСЯ","ЛОКАЛЬНЫЙ"] },
  { id:"m3",         label:"Квалиф. лиды",        title:"Квалифицированные лиды",  type:"memory",   px:74, py:61, size:13, scope:"ОБЩИЙ",    bytes:"5.4 КБ", desc:"Общая память о квалифицированных лидах.", rels:["ЗАПИСЬ ПАМЯТИ","ОБЩАЯ","СКОРИНГ"] },
  { id:"m4",         label:"Мета-память",         title:"Мета-память",             type:"memory",   px:15, py:28, size:13, scope:"ОБЩИЙ",    bytes:"1.8 КБ", desc:"Память системного уровня: что компания уже знает.", rels:["ЗАПИСЬ ПАМЯТИ","МЕТА","ОБЩАЯ"] },
  { id:"m5",         label:"Дневной синк",        title:"Дневной синк",            type:"memory",   px:45, py:79, size:13, scope:"ЛОКАЛЬНЫЙ",bytes:"2.7 КБ", desc:"Снимок последней ежедневной синхронизации.", rels:["ЗАПИСЬ ПАМЯТИ","СНИМОК","ЛОКАЛЬНЫЙ"] },
  { id:"m6",         label:"Состояние сессии",    title:"Состояние сессии",        type:"memory",   px:86, py:46, size:13, scope:"ЛОКАЛЬНЫЙ",bytes:"0.9 КБ", desc:"Волатильное состояние сессии.", rels:["ЗАПИСЬ ПАМЯТИ","ВСПОМИНАЕТСЯ","ЛОКАЛЬНЫЙ"] },
  { id:"d1",         label:"Недельный бриф",      title:"Недельный бриф воронки",  type:"doc",      px:21, py:60, size:13, scope:"ОБЩИЙ",    bytes:"18 КБ",  desc:"Документ хранилища: недельный бриф воронки.", rels:["ДОКУМЕНТ","ССЫЛАЮТСЯ","ИНДЕКСИРОВАН"] },
  { id:"d2",         label:"База контента",       title:"База интеллекта контента",type:"doc",      px:56, py:34, size:13, scope:"ОБЩИЙ",    bytes:"42 КБ",  desc:"Индексированная база эффективности контента.", rels:["ДОКУМЕНТ","ИНДЕКСИРОВАН","ЗАПРАШИВАЮТ"] },
  { id:"d3",         label:"Карта рынка",         title:"Карта рынка",             type:"doc",      px:69, py:18, size:13, scope:"ОБЩИЙ",    bytes:"11 КБ",  desc:"Исследовательский документ: сегменты и конкуренты.", rels:["ДОКУМЕНТ","ССЫЛАЮТСЯ","ИССЛЕДОВАНИЕ"] },
  { id:"d4",         label:"Портрет клиента",     title:"Портрет клиента (ICP)",   type:"doc",      px:38, py:45, size:13, scope:"ОБЩИЙ",    bytes:"6 КБ",   desc:"Каноническое описание идеального клиента.", rels:["ДОКУМЕНТ","КАНОНИЧЕСКИЙ","ССЫЛАЮТСЯ"] },
  { id:"d5",         label:"Плейбук",             title:"Спецификация плейбука",   type:"doc",      px:81, py:68, size:13, scope:"ОБЩИЙ",    bytes:"24 КБ",  desc:"Операционный плейбук для Ops и Sales.", rels:["ДОКУМЕНТ","СПЕЦИФИКАЦИЯ","ССЫЛАЮТСЯ"] },
  { id:"a1",         label:"Прогноз v3",          title:"Прогноз выручки v3",      type:"artifact", px:14, py:71, size:12, scope:"ЛОКАЛЬНЫЙ",bytes:"7.5 КБ", desc:"Артефакт данных: прогноз выручки от Data Analyst.", rels:["АРТЕФАКТ","СОЗДАН АГЕНТОМ","ВЕРСИОНИРУЕТСЯ"] },
  { id:"a2",         label:"Срез воронки",        title:"Срез воронки",            type:"artifact", px:61, py:47, size:12, scope:"ЛОКАЛЬНЫЙ",bytes:"4.1 КБ", desc:"Снимок текущей конверсии по этапам воронки.", rels:["АРТЕФАКТ","СНИМОК","ВЕРСИОНИРУЕТСЯ"] },
  { id:"a3",         label:"Модель скоринга",     title:"Модель скоринга лидов",   type:"artifact", px:47, py:58, size:12, scope:"ОБЩИЙ",    bytes:"9.8 КБ", desc:"Модель, по которой квалифицируются лиды.", rels:["АРТЕФАКТ","МОДЕЛЬ","СОЗДАН АГЕНТОМ"] },
  { id:"a4",         label:"Выгрузка когорт",     title:"Выгрузка когорт",         type:"artifact", px:73, py:27, size:12, scope:"ЛОКАЛЬНЫЙ",bytes:"13 КБ",  desc:"Экспорт когортного анализа для контент-движка.", rels:["АРТЕФАКТ","ЭКСПОРТ","ПОТРЕБЛЯЕТСЯ"] },
  { id:"c1",         label:"Правила роутинга",    title:"Правила роутинга",        type:"config",   px:36, py:80, size:11, scope:"ОБЩИЙ",    bytes:"1.2 КБ", desc:"Конфиг: правила распределения задач.", rels:["КОНФИГ","ЧИТАЕТСЯ","СИСТЕМА"] },
  { id:"c2",         label:"Ключи хранилища",     title:"Ключи хранилища",         type:"config",   px:88, py:57, size:11, scope:"ОБЩИЙ",    bytes:"0.4 КБ", desc:"Ключи доступа и области видимости хранилища.", rels:["КОНФИГ","ЗАЩИЩЁН","СИСТЕМА"] },
  { id:"c3",         label:"Планировщик",         title:"Задачи планировщика",     type:"config",   px:24, py:17, size:11, scope:"ОБЩИЙ",    bytes:"0.8 КБ", desc:"Конфигурация фоновых задач и синхронизаций.", rels:["КОНФИГ","ПО РАСПИСАНИЮ","СИСТЕМА"] },
];

const EDGES: [string,string][] = [
  ["researcher","ceo"],["cmo","ceo"],["sales","ceo"],["dev","ceo"],["data","ceo"],
  ["t_pipeline","sales"],["t_pipeline","cmo"],["t_content","cmo"],["t_content","researcher"],
  ["t_research","researcher"],["t_research","data"],["t_ops","dev"],["t_ops","ceo"],
  ["m1","t_pipeline"],["m1","sales"],["m2","t_research"],["m2","researcher"],
  ["m3","sales"],["m3","data"],["m4","ceo"],["m4","t_research"],
  ["m5","ceo"],["m5","t_ops"],["m6","ceo"],["m6","data"],
  ["d1","t_pipeline"],["d1","ceo"],["d2","t_content"],["d2","data"],
  ["d3","t_research"],["d3","researcher"],["d4","cmo"],["d4","t_pipeline"],
  ["d5","t_ops"],["d5","sales"],
  ["a1","data"],["a1","t_pipeline"],["a2","data"],["a2","sales"],
  ["a3","sales"],["a3","t_pipeline"],["a4","t_content"],["a4","data"],
  ["c1","ceo"],["c1","t_ops"],["c2","t_ops"],["c3","dev"],["c3","t_ops"],
  ["d2","cmo"],["m3","d1"],["a3","m3"],["d4","researcher"],["m2","d3"],
];

const NODE_BY_ID = Object.fromEntries(RAW_NODES.map(n => [n.id, n]));

// nodes connected to a given id
function connectedIds(id: string): Set<string> {
  const s = new Set<string>();
  EDGES.forEach(([a,b]) => { if (a === id) s.add(b); if (b === id) s.add(a); });
  return s;
}

// left panel agent stats (deterministic)
function hashOf(s: string) { let h = 0; for (const c of s) h = (h*31 + c.charCodeAt(0))|0; return Math.abs(h); }
function agentStats(id: string) {
  const h = hashOf(id);
  return { done: 24 + (h%76), success: 88 + (h%11), conf: 91 + (h%8), load: 35 + (h%58) };
}

type AgentStatus = "working" | "waiting" | "idle";
const AGENT_LIST: { id: string; name: string; layer: string; status: AgentStatus }[] = [
  { id:"ceo",        name:"CEO",          layer:"КОМАНДНЫЙ УРОВЕНЬ", status:"working" },
  { id:"researcher", name:"Researcher",   layer:"СБОР ДАННЫХ",       status:"waiting" },
  { id:"cmo",        name:"CMO",          layer:"РЫНОК & РОСТ",      status:"waiting" },
  { id:"sales",      name:"Sales Rep",    layer:"ВОРОНКА ВЫРУЧКИ",   status:"working" },
  { id:"dev",        name:"Dev",          layer:"СБОРКА ПРОДУКТА",   status:"idle" },
  { id:"data",       name:"Data Analyst", layer:"СЛОЙ СИГНАЛОВ",     status:"idle" },
];
const STATUS_STYLE: Record<AgentStatus, { color: string; label: string }> = {
  working: { color:"#10b981", label:"в работе" },
  waiting: { color:"#f59e0b", label:"ожидает"  },
  idle:    { color:"#475569", label:"свободен" },
};

// type counts for legend
const TYPE_COUNTS = Object.fromEntries(
  (Object.keys(TYPE_COLOR) as NodeType[]).map(t => [t, RAW_NODES.filter(n => n.type === t).length])
);

// ── Physics node (mutable) ─────────────────────────────────────────────────────
interface PhysNode {
  id: string; type: NodeType; label: string;
  x: number; y: number; vx: number; vy: number;
  r: number;  // radius
  phase: number;  // for float oscillation
  color: string;
}

// ── Canvas graph engine ────────────────────────────────────────────────────────
interface Ripple { x: number; y: number; t: number; }
interface Particle { edgeIdx: number; t: number; speed: number; }

function buildPhysNodes(W: number, H: number): PhysNode[] {
  return RAW_NODES.map((n, i) => ({
    id: n.id, type: n.type, label: n.label,
    x: (n.px / 100) * W,
    y: (n.py / 100) * H,
    vx: 0, vy: 0,
    r: n.size * (W / 900),
    phase: i * 0.61803,
    color: TYPE_COLOR[n.type],
  }));
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function KnowledgeVaultPage() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const containerRef= useRef<HTMLDivElement>(null);
  const rafRef      = useRef<number>(0);
  const nodesRef    = useRef<PhysNode[]>([]);
  const ripplesRef  = useRef<Ripple[]>([]);
  const particlesRef= useRef<Particle[]>([]);
  const spriteCache = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const timeRef     = useRef(0);
  const zoomRef     = useRef(1);
  const panRef      = useRef({ x: 0, y: 0 });
  const dragRef     = useRef<{ start: {x:number;y:number}; pan:{x:number;y:number} } | null>(null);

  const [selected, setSelected] = useState<string>("ceo");
  const [hovered,  setHovered]  = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showLegend, setShowLegend] = useState(true);

  useEffect(() => { markVisit("vault"); }, []);

  const focus = hovered ?? selected;
  const connected = useMemo(() => connectedIds(focus), [focus]);
  const selectedNode = NODE_BY_ID[selected];

  // ── Sprite factory ─────────────────────────────────────────────────────────
  const getSprite = useCallback((color: string, r: number, glow: boolean): HTMLCanvasElement => {
    const key = `${color}-${Math.round(r)}-${glow}`;
    if (spriteCache.current.has(key)) return spriteCache.current.get(key)!;
    const pad = glow ? 20 : 6;
    const sz = (r + pad) * 2;
    const c = document.createElement("canvas");
    c.width = c.height = sz;
    const ctx = c.getContext("2d")!;
    const cx = sz / 2;
    if (glow) {
      const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, r + pad);
      g.addColorStop(0, color + "55"); g.addColorStop(1, "transparent");
      ctx.fillStyle = g; ctx.fillRect(0, 0, sz, sz);
    }
    ctx.beginPath(); ctx.arc(cx, cx, r, 0, Math.PI * 2);
    const radGrad = ctx.createRadialGradient(cx - r*0.3, cx - r*0.3, 0, cx, cx, r);
    radGrad.addColorStop(0, color + "ff"); radGrad.addColorStop(1, color + "cc");
    ctx.fillStyle = radGrad; ctx.fill();
    spriteCache.current.set(key, c);
    return c;
  }, []);

  // ── Canvas draw loop ───────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;
    const nodes = nodesRef.current;
    const t = timeRef.current;

    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(panRef.current.x, panRef.current.y);
    ctx.scale(zoomRef.current, zoomRef.current);

    const dpr = window.devicePixelRatio || 1;
    const TW = W / zoomRef.current / dpr;
    const TH = H / zoomRef.current / dpr;

    // background ambient
    const bg = ctx.createRadialGradient(TW/2, TH/2, 0, TW/2, TH/2, Math.max(TW, TH) * 0.6);
    bg.addColorStop(0, "rgba(40,30,80,0.18)"); bg.addColorStop(1, "transparent");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, TW, TH);

    // node map for fast lookup
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // which edges are active (connected to focus)
    const focusConnected = connected;
    const isFocused = (id: string) => id === focus || focusConnected.has(id);

    // ── draw edges ────────────────────────────────────────────────────────────
    EDGES.forEach(([aId, bId], idx) => {
      const a = nodeMap.get(aId), b = nodeMap.get(bId);
      if (!a || !b) return;
      const active = aId === focus || bId === focus || focusConnected.has(aId) && focusConnected.has(bId);
      const alpha = active ? 0.55 : (isFocused(aId) || isFocused(bId) ? 0.28 : 0.08);
      const aColor = a.color; const bColor = b.color;
      const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      grad.addColorStop(0, aColor + Math.round(alpha*255).toString(16).padStart(2,"0"));
      grad.addColorStop(1, bColor + Math.round(alpha*255).toString(16).padStart(2,"0"));
      ctx.beginPath();
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = active ? 1.8 : 0.8;
      ctx.stroke();

      // flowing particles along active edges
      if (active) {
        const ps = particlesRef.current.filter(p => p.edgeIdx === idx);
        ps.forEach(p => {
          const px = a.x + (b.x - a.x) * p.t;
          const py = a.y + (b.y - a.y) * p.t;
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI*2);
          ctx.fillStyle = aColor + "cc"; ctx.fill();
          ctx.restore();
        });
      }
    });

    // ── draw nodes ────────────────────────────────────────────────────────────
    nodes.forEach(node => {
      const isSelected = node.id === selected;
      const isHov = node.id === hovered;
      const dim = !isFocused(node.id) && focus !== node.id;
      const alpha = dim ? 0.2 : 1;
      const floatY = Math.sin(t * 0.0006 + node.phase) * 3.5;
      const px = node.x; const py = node.y + floatY;

      ctx.save(); ctx.globalAlpha = alpha;

      // outer glow (active nodes)
      if (!dim) {
        const pulseFactor = 0.5 + 0.5 * Math.sin(t * 0.003 + node.phase * 2);
        const glowR = node.r + 6 + (isSelected ? pulseFactor * 10 : pulseFactor * 4);
        const gGrad = ctx.createRadialGradient(px, py, node.r * 0.5, px, py, glowR);
        gGrad.addColorStop(0, node.color + "44"); gGrad.addColorStop(1, "transparent");
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        ctx.beginPath(); ctx.arc(px, py, glowR, 0, Math.PI*2);
        ctx.fillStyle = gGrad; ctx.fill();
        ctx.restore();
      }

      // sprite
      const sp = getSprite(node.color, node.r, !dim);
      const pad = !dim ? 20 : 6;
      ctx.drawImage(sp, px - node.r - pad, py - node.r - pad);

      // ring (selected or hovered)
      if (isSelected || isHov) {
        ctx.beginPath(); ctx.arc(px, py, node.r + 4, 0, Math.PI*2);
        ctx.strokeStyle = node.color; ctx.lineWidth = isSelected ? 2 : 1.2;
        ctx.globalAlpha = alpha * (isSelected ? 0.9 : 0.6);
        ctx.stroke();
        // second ring for selected
        if (isSelected) {
          const pulse = 0.4 + 0.6 * Math.sin(t * 0.004);
          ctx.beginPath(); ctx.arc(px, py, node.r + 10 + pulse*6, 0, Math.PI*2);
          ctx.strokeStyle = node.color; ctx.lineWidth = 0.8;
          ctx.globalAlpha = alpha * 0.3 * pulse;
          ctx.stroke();
        }
      }

      ctx.restore();

      // label
      if (!dim || isSelected) {
        ctx.save(); ctx.globalAlpha = dim ? 0.25 : 0.85;
        ctx.font = `${node.type === "agent" ? 600 : 400} ${node.r < 13 ? 9 : 11}px ${MONO.split(",")[0].trim()}`;
        ctx.fillStyle = node.color;
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillText(node.label, px, py + node.r + 5);
        ctx.restore();
      }
    });

    // ── ripple effects ────────────────────────────────────────────────────────
    ripplesRef.current = ripplesRef.current.filter(r => r.t < 1);
    ripplesRef.current.forEach(r => {
      const age = r.t;
      const radius = age * 80;
      ctx.save();
      ctx.globalAlpha = (1 - age) * 0.5;
      ctx.beginPath(); ctx.arc(r.x, r.y, radius, 0, Math.PI*2);
      ctx.strokeStyle = "#a78bfa"; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(r.x, r.y, radius * 0.6, 0, Math.PI*2);
      ctx.strokeStyle = "#6366f1"; ctx.lineWidth = 1; ctx.stroke();
      r.t += 0.018;
      ctx.restore();
    });

    ctx.restore();
  }, [focus, selected, hovered, connected, getSprite]);

  // ── Physics tick ──────────────────────────────────────────────────────────
  const tick = useCallback((dt: number) => {
    const nodes = nodesRef.current;
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr / zoomRef.current;
    const H = canvas.height / dpr / zoomRef.current;

    // node map
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    nodes.forEach(n => { n.vx = 0; n.vy = 0; });

    // repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i+1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        const minDist = (a.r + b.r) * 4.5;
        if (dist < minDist) {
          const force = (minDist - dist) / minDist * 0.8;
          const fx = (dx / dist) * force, fy = (dy / dist) * force;
          a.vx -= fx; a.vy -= fy; b.vx += fx; b.vy += fy;
        }
      }
    }

    // spring attraction along edges
    EDGES.forEach(([aId, bId]) => {
      const a = nodeMap.get(aId), b = nodeMap.get(bId);
      if (!a || !b) return;
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx*dx + dy*dy) || 1;
      const ideal = 80 + (a.r + b.r) * 2.2;
      const stretch = (dist - ideal) / ideal * 0.12;
      const fx = (dx/dist) * stretch, fy = (dy/dist) * stretch;
      a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
    });

    // center gravity
    const cx = W * 0.5, cy = H * 0.5;
    nodes.forEach(n => {
      n.vx += (cx - n.x) * 0.001;
      n.vy += (cy - n.y) * 0.001;
    });

    // integrate
    nodes.forEach(n => {
      n.x += n.vx * dt * 0.035;
      n.y += n.vy * dt * 0.035;
      n.x = Math.max(n.r + 10, Math.min(W - n.r - 10, n.x));
      n.y = Math.max(n.r + 10, Math.min(H - n.r - 10, n.y));
    });
  }, []);

  // ── Particles tick ────────────────────────────────────────────────────────
  const tickParticles = useCallback((dt: number) => {
    particlesRef.current.forEach(p => { p.t += p.speed * dt * 0.0008; if (p.t > 1) p.t -= 1; });
  }, []);

  // ── Init & rAF loop ───────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width  = rect.width  * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width  = rect.width  + "px";
      canvas.style.height = rect.height + "px";
      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);
      nodesRef.current = buildPhysNodes(rect.width, rect.height);
      spriteCache.current.clear();
    };
    resize();

    // init particles along all edges
    particlesRef.current = EDGES.flatMap((_, i) =>
      Array.from({ length: 2 }, () => ({
        edgeIdx: i, t: Math.random(), speed: 0.3 + Math.random() * 0.5,
      }))
    );

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(now - last, 50); last = now;
      timeRef.current = now;
      tick(dt);
      tickParticles(dt);
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [draw, tick, tickParticles]);

  // ── Hit test ──────────────────────────────────────────────────────────────
  const hitTest = useCallback((clientX: number, clientY: number): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mx = (clientX - rect.left - panRef.current.x / dpr) / zoomRef.current;
    const my = (clientY - rect.top  - panRef.current.y / dpr) / zoomRef.current;
    const nodes = nodesRef.current;
    let best: string | null = null, bestDist = Infinity;
    nodes.forEach(n => {
      const floatY = Math.sin(timeRef.current * 0.0006 + n.phase) * 3.5;
      const dx = mx - n.x, dy = my - (n.y + floatY);
      const dist = Math.sqrt(dx*dx+dy*dy);
      if (dist < n.r + 8 && dist < bestDist) { best = n.id; bestDist = dist; }
    });
    return best;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const hit = hitTest(e.clientX, e.clientY);
    if (hit) {
      setSelected(hit);
      // ripple
      const canvas = canvasRef.current;
      const rect = canvas!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const node = nodesRef.current.find(n => n.id === hit);
      if (node) ripplesRef.current.push({ x: node.x, y: node.y, t: 0 });
      void rect;
    }
  }, [hitTest]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragRef.current) {
      const dx = e.clientX - dragRef.current.start.x;
      const dy = e.clientY - dragRef.current.start.y;
      panRef.current = { x: dragRef.current.pan.x + dx, y: dragRef.current.pan.y + dy };
      return;
    }
    const hit = hitTest(e.clientX, e.clientY);
    setHovered(hit);
    const canvas = canvasRef.current;
    if (canvas) canvas.style.cursor = hit ? "pointer" : "grab";
  }, [hitTest]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || e.altKey) {
      dragRef.current = { start: { x: e.clientX, y: e.clientY }, pan: { ...panRef.current } };
    }
  }, []);
  const handleMouseUp = useCallback(() => { dragRef.current = null; }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.91;
    zoomRef.current = Math.max(0.4, Math.min(3, zoomRef.current * factor));
    setZoom(zoomRef.current);
  }, []);

  const resetView = useCallback(() => {
    zoomRef.current = 1; panRef.current = { x: 0, y: 0 }; setZoom(1);
  }, []);

  return (
    <div style={{ display:"flex", height:"100%", background: BG, overflow:"hidden" }}>

      {/* ── Left panel ── */}
      <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
        transition={{ duration:0.5, ease:EASE }}
        style={{ width:220, flexShrink:0, display:"flex", flexDirection:"column",
          borderRight:`1px solid ${BORD}`, background:"rgba(5,6,10,0.9)", overflowY:"auto" }}>

        <div style={{ padding:"18px 16px 10px" }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.14em", color:TM,
            fontFamily: MONO, marginBottom:12 }}>АГЕНТЫ · {AGENT_LIST.length}</div>

          {AGENT_LIST.map((ag, i) => {
            const st = STATUS_STYLE[ag.status];
            const stats = agentStats(ag.id);
            const isActive = selected === ag.id;
            return (
              <motion.div key={ag.id}
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                transition={{ delay: i*0.07, duration:0.4, ease:EASE }}
                onClick={() => { setSelected(ag.id); ripplesRef.current.push({ x: nodesRef.current.find(n=>n.id===ag.id)?.x??200, y: nodesRef.current.find(n=>n.id===ag.id)?.y??200, t:0 }); }}
                style={{ padding:"10px 11px", borderRadius:12, marginBottom:6, cursor:"pointer",
                  background: isActive ? "rgba(167,139,250,0.08)" : "transparent",
                  border:`1px solid ${isActive ? "rgba(167,139,250,0.3)" : "transparent"}`,
                  transition:"all 0.18s" }}
                whileHover={{ background: isActive ? "rgba(167,139,250,0.1)" : "rgba(255,255,255,0.03)" }}>
                {/* Name + status */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:isActive ? TP : "rgba(229,231,235,0.75)" }}>{ag.name}</span>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:8, fontWeight:700,
                    fontFamily:MONO, letterSpacing:"0.08em", padding:"2px 6px", borderRadius:5,
                    background:`${st.color}15`, border:`1px solid ${st.color}38`, color:st.color }}>
                    <span style={{ width:4, height:4, borderRadius:"50%", background:st.color,
                      animation: ag.status==="working" ? "kv-pulse 2s ease-in-out infinite" : "none" }} />
                    {ag.status==="working"?"в рабо.":ag.status==="waiting"?"ожидает":"свобод."}
                  </span>
                </div>
                <div style={{ fontSize:9, color:TM, fontFamily:MONO, letterSpacing:"0.08em", marginBottom:6 }}>{ag.layer}</div>
                {/* Stats row */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:1,
                  borderRadius:6, overflow:"hidden", border:`1px solid ${BORD}` }}>
                  {[
                    { v: stats.done,          l:"задач" },
                    { v: `${stats.success}%`, l:"успех" },
                    { v: `${stats.conf}%`,    l:"конф" },
                  ].map((s,j) => (
                    <div key={j} style={{ padding:"5px 0", textAlign:"center", background:"rgba(255,255,255,0.012)",
                      borderRight: j<2 ? `1px solid ${BORD}` : "none" }}>
                      <div style={{ fontSize:11, fontWeight:800, color:TYPE_COLOR.agent, fontVariantNumeric:"tabular-nums" }}>{s.v}</div>
                      <div style={{ fontSize:7.5, color:TM }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Divider + legend mini */}
        <div style={{ padding:"10px 16px", borderTop:`1px solid ${BORD}`, marginTop:"auto" }}>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.12em", color:TM, fontFamily:MONO, marginBottom:8 }}>ТИПЫ УЗЛОВ</div>
          {(Object.keys(TYPE_COLOR) as NodeType[]).map(t => (
            <div key={t} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ width:7, height:7, borderRadius:"50%", background:TYPE_COLOR[t], flexShrink:0 }} />
                <span style={{ fontSize:10, color:TS }}>{TYPE_LABEL[t]}</span>
              </div>
              <span style={{ fontSize:9, color:TM, fontFamily:MONO }}>{TYPE_COUNTS[t]}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Canvas area ── */}
      <div style={{ flex:1, position:"relative", overflow:"hidden" }}>
        <div ref={containerRef} style={{ position:"absolute", inset:0 }}>
          <canvas ref={canvasRef}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { setHovered(null); handleMouseUp(); }}
            onWheel={handleWheel}
            style={{ display:"block", position:"absolute", inset:0, cursor:"grab" }} />
        </div>

        {/* Canvas controls */}
        <div style={{ position:"absolute", top:16, right:16, display:"flex", flexDirection:"column", gap:6, zIndex:10 }}>
          {[
            { icon: ZoomIn,    action: () => { zoomRef.current = Math.min(3, zoomRef.current*1.15); setZoom(zoomRef.current); }, title:"Приблизить" },
            { icon: ZoomOut,   action: () => { zoomRef.current = Math.max(0.4, zoomRef.current*0.87); setZoom(zoomRef.current); }, title:"Отдалить" },
            { icon: RotateCcw, action: resetView, title:"Сбросить" },
            { icon: Info,      action: () => setShowLegend(v=>!v), title:"Легенда" },
          ].map(({ icon: Icon, action, title }) => (
            <button key={title} onClick={action} title={title}
              style={{ width:32, height:32, borderRadius:9, border:`1px solid ${BORD}`,
                background:"rgba(5,6,10,0.8)", backdropFilter:"blur(8px)",
                display:"flex", alignItems:"center", justifyContent:"center",
                color:TS, cursor:"pointer", transition:"all 0.15s" }}
              onMouseOver={e => { e.currentTarget.style.borderColor=BORD_H; e.currentTarget.style.color=TP; }}
              onMouseOut={e  => { e.currentTarget.style.borderColor=BORD;   e.currentTarget.style.color=TS; }}>
              <Icon size={13} />
            </button>
          ))}
        </div>

        {/* Zoom indicator */}
        <div style={{ position:"absolute", bottom:16, left:"50%", transform:"translateX(-50%)",
          padding:"4px 12px", borderRadius:8, background:"rgba(5,6,10,0.7)",
          border:`1px solid ${BORD}`, backdropFilter:"blur(8px)",
          fontSize:10, color:TM, fontFamily:MONO, pointerEvents:"none" }}>
          {Math.round(zoom*100)}%
        </div>

        {/* Hover tooltip */}
        <AnimatePresence>
          {hovered && hovered !== selected && (
            <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              transition={{ duration:0.15 }}
              style={{ position:"absolute", bottom:50, left:"50%", transform:"translateX(-50%)",
                padding:"6px 14px", borderRadius:9, background:"rgba(10,11,20,0.9)",
                border:`1px solid ${TYPE_COLOR[NODE_BY_ID[hovered]?.type ?? "agent"]}44`,
                backdropFilter:"blur(12px)", pointerEvents:"none", whiteSpace:"nowrap",
                fontSize:11.5, fontWeight:600, color:TP }}>
              {NODE_BY_ID[hovered]?.title}
              <span style={{ marginLeft:8, fontSize:9, color:TYPE_COLOR[NODE_BY_ID[hovered]?.type ?? "agent"],
                fontFamily:MONO, fontWeight:700 }}>{TYPE_LABEL[NODE_BY_ID[hovered]?.type ?? "agent"]}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Right panel ── */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div key={selected}
            initial={{ opacity:0, x:24 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:16 }}
            transition={{ duration:0.28, ease:EASE }}
            style={{ width:280, flexShrink:0, display:"flex", flexDirection:"column",
              borderLeft:`1px solid ${BORD}`, background:"rgba(5,6,10,0.92)", overflowY:"auto" }}>

            {/* Node header */}
            <div style={{ padding:"20px 18px 16px",
              borderBottom:`1px solid ${BORD}` }}>
              {/* Type chip + scope */}
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 9px",
                  borderRadius:7, fontSize:9, fontWeight:700, fontFamily:MONO, letterSpacing:"0.1em",
                  background:`${TYPE_COLOR[selectedNode.type]}14`,
                  border:`1px solid ${TYPE_COLOR[selectedNode.type]}38`,
                  color:TYPE_COLOR[selectedNode.type] }}>
                  <span style={{ width:5, height:5, borderRadius:"50%", background:TYPE_COLOR[selectedNode.type] }} />
                  {TYPE_LABEL[selectedNode.type].toUpperCase()}
                </span>
                <span style={{ fontSize:9, color:TM, fontFamily:MONO }}>{selectedNode.scope}</span>
              </div>

              {/* Node avatar */}
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                <div style={{ width:44, height:44, borderRadius:13, flexShrink:0, display:"flex",
                  alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800,
                  fontFamily:MONO, color:"#fff",
                  background:`radial-gradient(circle at 35% 35%, ${TYPE_COLOR[selectedNode.type]}dd, ${TYPE_COLOR[selectedNode.type]}88)`,
                  boxShadow:`0 8px 24px ${TYPE_COLOR[selectedNode.type]}40, inset 0 1px 0 rgba(255,255,255,0.2)` }}>
                  {selectedNode.label.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:TP, letterSpacing:"-0.01em", lineHeight:1.3 }}>{selectedNode.title}</div>
                  <div style={{ fontSize:10, color:TM, marginTop:3, fontFamily:MONO }}>{selectedNode.bytes}</div>
                </div>
              </div>

              <p style={{ fontSize:12, color:TS, lineHeight:1.65, margin:0 }}>{selectedNode.desc}</p>
            </div>

            {/* Stats (for agents) */}
            {selectedNode.type === "agent" && (() => {
              const st = agentStats(selectedNode.id);
              return (
                <div style={{ padding:"14px 18px", borderBottom:`1px solid ${BORD}` }}>
                  <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.12em", color:TM, fontFamily:MONO, marginBottom:10 }}>МЕТРИКИ</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                    {[{ v:st.done, l:"Задач" },{ v:`${st.success}%`, l:"Успех" },{ v:`${st.conf}%`, l:"Конф" }].map((s,i) => (
                      <div key={i} style={{ padding:"10px 8px", borderRadius:10, background:SURF, border:`1px solid ${BORD}`,
                        textAlign:"center" }}>
                        <CountUp to={typeof s.v==="number"?s.v:parseInt(s.v)} suffix={typeof s.v==="string"&&s.v.endsWith("%")?"%":""} color={TYPE_COLOR[selectedNode.type]} />
                        <div style={{ fontSize:9, color:TM, marginTop:3 }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Relations */}
            <div style={{ padding:"14px 18px" }}>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.12em", color:TM, fontFamily:MONO, marginBottom:10 }}>СВЯЗИ</div>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                {selectedNode.rels.map(r => (
                  <div key={r} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px",
                    borderRadius:8, background:SURF, border:`1px solid ${BORD}` }}>
                    <span style={{ width:5, height:5, borderRadius:"50%", background:TYPE_COLOR[selectedNode.type], flexShrink:0 }} />
                    <span style={{ fontSize:11, color:TS }}>{r}</span>
                  </div>
                ))}
              </div>

              {/* Connected nodes */}
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.12em", color:TM, fontFamily:MONO,
                marginTop:16, marginBottom:8 }}>СОЕДИНЁН С</div>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {Array.from(connected).slice(0, 6).map(cId => {
                  const cn = NODE_BY_ID[cId]; if (!cn) return null;
                  return (
                    <button key={cId} onClick={() => setSelected(cId)}
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px",
                        borderRadius:8, background:"transparent", border:`1px solid ${BORD}`,
                        cursor:"pointer", transition:"all 0.15s", textAlign:"left" }}
                      onMouseOver={e => { e.currentTarget.style.borderColor=BORD_H; e.currentTarget.style.background=SURF; }}
                      onMouseOut={e  => { e.currentTarget.style.borderColor=BORD;   e.currentTarget.style.background="transparent"; }}>
                      <span style={{ width:7, height:7, borderRadius:"50%", background:TYPE_COLOR[cn.type], flexShrink:0 }} />
                      <span style={{ fontSize:11, color:TS, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{cn.label}</span>
                      <span style={{ fontSize:8, color:TM, fontFamily:MONO }}>{TYPE_LABEL[cn.type].slice(0,3).toUpperCase()}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom legend table ── */}
      <AnimatePresence>
        {showLegend && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:20 }}
            transition={{ duration:0.25, ease:EASE }}
            style={{ position:"absolute", bottom:20, left:240, right:300, zIndex:20,
              background:"rgba(8,9,18,0.94)", border:`1px solid ${BORD}`,
              borderRadius:14, padding:"12px 16px", backdropFilter:"blur(16px)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.14em", color:TM, fontFamily:MONO }}>НОДА · ДЕСКРИПЦИЯ · КОЛ-ВО</span>
              <button onClick={() => setShowLegend(false)} style={{ background:"none", border:"none", cursor:"pointer", color:TM, padding:0 }}><X size={12} /></button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"3px 16px" }}>
              {(Object.keys(TYPE_COLOR) as NodeType[]).map(t => (
                <div key={t} style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 0" }}>
                  <span style={{ width:7, height:7, borderRadius:"50%", background:TYPE_COLOR[t], flexShrink:0 }} />
                  <span style={{ fontSize:10, color:TS, flex:1 }}>{TYPE_LABEL[t]}</span>
                  <span style={{ fontSize:9, color:TM, fontFamily:MONO, flexShrink:0 }}>{TYPE_COUNTS[t]}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${BORD}`,
              fontSize:9, color:TM }}>
              Нажмите на узел чтобы исследовать · Колесо мыши для зума · Alt+drag для перемещения
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes kv-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(0.5)} }
        @media (prefers-reduced-motion:reduce) { * { animation-duration:0.01ms!important } }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius:2px; }
      `}</style>
    </div>
  );
}

// ── Count-up component ─────────────────────────────────────────────────────────
function CountUp({ to, suffix, color }: { to: number; suffix: string; color: string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0; const t0 = performance.now(); const dur = 900;
    const step = (ts: number) => {
      const p = Math.min(1, (ts-t0)/dur);
      setV(Math.round(to * (1 - Math.pow(1-p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <div style={{ fontSize:16, fontWeight:800, color, fontVariantNumeric:"tabular-nums" }}>{v}{suffix}</div>;
}
