"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ─── Single unified accent ────────────────────────────────────────────────────
const ACCENT = "#6366f1";
const RGB    = "99,102,241";

// ─── Count-up hook (ease-out-cubic via rAF) ───────────────────────────────────
function useCountUp(to: number, active = true, duration = 1100) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) { setVal(0); return; }
    let raf = 0; let start: number | null = null;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const t = Math.min((ts - start) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - t, 3)) * to));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, active, duration]);
  return val;
}

// ─── Animated score ring ──────────────────────────────────────────────────────
function ScoreRing({ score, size = 58 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const count = useCountUp(score);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={ACCENT} strokeWidth={4} strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${(score / 100) * circ} ${circ}` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.3, fontWeight: 800, color: ACCENT, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{count}</span>
      </div>
    </div>
  );
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

const EXECUTIVES = [
  { role: "CEO", shortRole: "CEO", title: "Исполнительный директор", name: "Sophia Reeves", years: "20+",
    expertise: ["Стратегия роста", "Видение продукта", "Инвесторы"],
    bio: "Координирует всю команду, синтезирует инсайты в единую стратегию и формирует финальное решение. 20+ лет опыта масштабирования стартапов от идеи до Series B.",
    insights: ["Фокусируйтесь на одном ключевом сегменте в первые 12 месяцев", "Привлекайте инвесторов только при наличии чётких метрик роста", "Командная культура важнее любой стратегии — нанимайте тщательно"],
    completedProjects: 3, avgScore: 87 },
  { role: "CFO", shortRole: "CFO", title: "Финансовый директор", name: "Marcus Chen", years: "25+",
    expertise: ["Финансовое моделирование", "Unit-экономика", "Капитал"],
    bio: "Строит финансовые модели, прогнозы выручки, анализирует затраты и инвестиционные требования. Помог 20+ компаниям привлечь $500M+.",
    insights: ["LTV/CAC > 3:1 — минимальный порог для масштабирования", "Runway минимум 18 месяцев перед следующим раундом", "Gross margin с первого дня — ключевой сигнал для инвесторов"],
    completedProjects: 3, avgScore: 91 },
  { role: "CMO", shortRole: "CMO", title: "Директор по маркетингу", name: "Elena Torres", years: "18+",
    expertise: ["Go-to-market", "Brand building", "Performance"],
    bio: "Разрабатывает позиционирование бренда, стратегию выхода на рынок, воронки привлечения и контент-план. Вывела 10+ продуктов от 0 до 1M пользователей.",
    insights: ["Начинайте с 1-2 каналов привлечения, не распыляйтесь", "Контент-маркетинг даёт лучший ROI в долгосрочной перспективе", "NPS и word-of-mouth — самые дешёвые источники роста"],
    completedProjects: 3, avgScore: 84 },
  { role: "COO", shortRole: "COO", title: "Операционный директор", name: "James Wright", years: "22+",
    expertise: ["Операционная эффективность", "Процессы", "Масштабирование"],
    bio: "Создаёт операционный роадмап, план запуска, дизайн процессов и структуру команды. Строил операционные системы для компаний от 5 до 500 сотрудников.",
    insights: ["Документируйте процессы с первого дня — масштабирование без них невозможно", "Автоматизируйте всё, что повторяется более 3 раз в неделю", "OKR работают только если команда понимает зачем они нужны"],
    completedProjects: 3, avgScore: 79 },
  { role: "CTO", shortRole: "CTO", title: "Технический директор", name: "Aiden Park", years: "15+",
    expertise: ["Архитектура систем", "AI/ML", "DevOps"],
    bio: "Рекомендует оптимальный технологический стек, дизайн инфраструктуры и технический роадмап. 15 лет строил масштабируемые системы для продуктов с миллионами пользователей.",
    insights: ["MVP должен быть ugly — красота приходит с пониманием пользователей", "Технический долг убивает стартапы — рефакторьте постоянно", "Безопасность данных с первого дня — потом будет в 10 раз дороже"],
    completedProjects: 3, avgScore: 90 },
  { role: "Business Analyst", shortRole: "BA", title: "Бизнес-аналитик", name: "Priya Sharma", years: "12+",
    expertise: ["Исследование рынка", "SWOT-анализ", "Конкуренты"],
    bio: "Глубокий анализ рынка, конкурентная разведка, сегментация аудитории и маппинг возможностей. Специализируется на поиске незанятых ниш и голубых океанов.",
    insights: ["Изучите 10 конкурентов перед запуском — найдите их слабые места", "TAM > $1B — минимальный рынок для венчурных инвестиций", "Один детальный customer interview стоит 100 опросов"],
    completedProjects: 3, avgScore: 85 },
  { role: "Sales Director", shortRole: "SD", title: "Директор по продажам", name: "Carlos Mendes", years: "20+",
    expertise: ["Sales funnel", "Pricing", "Lead generation"],
    bio: "Разрабатывает воронки продаж, модели ценообразования, стратегии лидогенерации и системы удержания клиентов. Закрыл сделки на суммарно $50M+.",
    insights: ["Первые 10 продаж делайте лично — это ваш лучший источник фидбека", "Цена слишком низкая — ошибка большинства стартапов на старте", "Follow-up решает: 80% продаж закрываются после 5-го контакта"],
    completedProjects: 3, avgScore: 83 },
  { role: "Legal Advisor", shortRole: "LA", title: "Юридический советник", name: "Diana Volkov", years: "30+",
    expertise: ["Структура бизнеса", "IP-стратегия", "Compliance"],
    bio: "Рекомендации по структуре бизнеса, защите интеллектуальной собственности и соответствию требованиям регуляторов. 30+ лет практики в корпоративном праве.",
    insights: ["Delaware C-Corp — стандарт для венчурных инвестиций", "Зарегистрируйте торговую марку до запуска, не после", "NDA имеют смысл только при раскрытии реально конфиденциальных данных"],
    completedProjects: 3, avgScore: 81 },
  { role: "CISO", shortRole: "CI", title: "Директор по кибербезопасности", name: "Viktor Stern", years: "20+",
    expertise: ["Кибербезопасность", "Управление рисками", "Compliance"],
    bio: "Оценивает угрозы информационной безопасности, разрабатывает политики защиты данных и стратегию соответствия стандартам. Защитил системы 40+ корпораций.",
    insights: ["Zero-trust архитектура — стандарт для любого SaaS в 2024", "GDPR и SOC2 проще внедрить с нуля, чем retrofit", "Фишинг — причина 90% взломов: обучайте команду постоянно"],
    completedProjects: 2, avgScore: 88 },
  { role: "CPO", shortRole: "CP", title: "Директор по продукту", name: "Yuki Tanaka", years: "15+",
    expertise: ["Product strategy", "UX Research", "Roadmap"],
    bio: "Формирует продуктовую стратегию, приоритизирует фичи и выстраивает OKR-систему. Создал продукты с аудиторией 5M+ пользователей в B2C и B2B сегментах.",
    insights: ["Jobs-to-be-done важнее любых демографических метрик", "Не добавляйте фичи без данных: каждая стоит дороже, чем вы думаете", "Product-market fit — это когда 40%+ пользователей расстроятся, если продукт исчезнет"],
    completedProjects: 2, avgScore: 86 },
  { role: "CHRO", shortRole: "HR", title: "Директор по персоналу", name: "Sarah Mitchell", years: "25+",
    expertise: ["Talent acquisition", "Культура", "Орг. дизайн"],
    bio: "Строит HR-систему, культуру компании и программы удержания талантов. Помогла 30+ стартапам масштабировать команды от 5 до 200+ человек без потери качества найма.",
    insights: ["Культурный fit важнее навыков — навыки можно обучить, характер нет", "Прозрачность зарплат снижает текучку на 40%", "Нанимайте медленно, увольняйте быстро — каждый человек задаёт стандарт"],
    completedProjects: 2, avgScore: 82 },
  { role: "CDO", shortRole: "CD", title: "Директор по данным", name: "Alex Rivera", years: "18+",
    expertise: ["Data strategy", "Analytics", "ML Ops"],
    bio: "Формирует стратегию работы с данными, архитектуру аналитики и модели машинного обучения. Построил data-платформы для компаний с объёмом данных 10TB+.",
    insights: ["Начните с одной ключевой метрики — North Star metric задаёт вектор роста", "Data governance с первого дня избавит от головной боли при масштабировании", "Не строите хранилища данных — строите продукты на данных"],
    completedProjects: 2, avgScore: 88 },
  { role: "VP Engineering", shortRole: "VP", title: "Вице-президент по инженерии", name: "Noah Kim", years: "20+",
    expertise: ["Engineering management", "Agile", "Платформы"],
    bio: "Управляет инженерными командами, процессами разработки и технической культурой. Руководил командами 50+ инженеров в компаниях уровня Series C и выше.",
    insights: ["Скорость разработки падает без Code Review — не срезайте углы", "Психологическая безопасность — основа высокопроизводительной команды", "Мониторинг и алёртинг важнее новых фичей в production"],
    completedProjects: 2, avgScore: 86 },
  { role: "Growth Hacker", shortRole: "GH", title: "Специалист по росту", name: "Mia Patel", years: "10+",
    expertise: ["Viral loops", "A/B тестирование", "Retention"],
    bio: "Находит нестандартные точки роста, строит вирусные механики и оптимизирует конверсию воронки. За карьеру обеспечила рост x10 для 8 стартапов на стадии pre-PMF.",
    insights: ["Retention — самый важный показатель: дырявое ведро не наполнишь", "Сначала ищите product-channel fit, потом масштабируйте канал", "Каждый эксперимент должен иметь гипотезу и метрику успеха до запуска"],
    completedProjects: 2, avgScore: 89 },
  { role: "IR Manager", shortRole: "IR", title: "Директор по связям с инвесторами", name: "Christopher Lee", years: "35+",
    expertise: ["Investor relations", "Due diligence", "Питч-деки"],
    bio: "Специализируется на подготовке к раундам финансирования, построении отношений с инвесторами и прохождении due diligence. Участвовал в сделках на $2B+ суммарно.",
    insights: ["Инвесторы покупают команду на ранних стадиях, продукт — на поздних", "Питч-дек — это история с числами, не слайды с буллетами", "Тёплое знакомство через общих контактов повышает шанс встречи в 5 раз"],
    completedProjects: 2, avgScore: 84 },
];

// ─── GRAPH LAYOUT (initial positions) ─────────────────────────────────────────
const NW = 118, NH = 62;
const GRAPH_LAYOUT: Record<string, { x: number; y: number; parent: string | null; badge: string }> = {
  "CEO":              { x: 664,  y: 60,  parent: null,   badge: "C.E.O" },
  "CFO":              { x: 148,  y: 240, parent: "CEO",  badge: "C.F.O" },
  "CMO":              { x: 424,  y: 240, parent: "CEO",  badge: "C.M.O" },
  "COO":              { x: 720,  y: 240, parent: "CEO",  badge: "C.O.O" },
  "CTO":              { x: 1060, y: 240, parent: "CEO",  badge: "C.T.O" },
  "Business Analyst": { x: 80,   y: 440, parent: "CFO",  badge: "B.ANL" },
  "IR Manager":       { x: 214,  y: 440, parent: "CFO",  badge: "I.R"   },
  "Sales Director":   { x: 356,  y: 440, parent: "CMO",  badge: "S.DIR" },
  "Growth Hacker":    { x: 490,  y: 440, parent: "CMO",  badge: "GRW"   },
  "Legal Advisor":    { x: 588,  y: 440, parent: "COO",  badge: "L.ADV" },
  "CHRO":             { x: 720,  y: 440, parent: "COO",  badge: "H.R"   },
  "VP Engineering":   { x: 852,  y: 440, parent: "COO",  badge: "V.P.E" },
  "CISO":             { x: 950,  y: 440, parent: "CTO",  badge: "CISO"  },
  "CPO":              { x: 1060, y: 440, parent: "CTO",  badge: "C.P.O" },
  "CDO":              { x: 1170, y: 440, parent: "CTO",  badge: "C.D.O" },
};

const CANVAS_W = 1300, CANVAS_H = 560;
const execByRole = Object.fromEntries(EXECUTIVES.map(e => [e.role, e]));

type Pos = { x: number; y: number };

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function ExecutivesPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>("CEO");
  const [zoom, setZoom] = useState(1);
  const [entered, setEntered] = useState(false);
  const [query, setQuery] = useState("");

  // Draggable positions (init from layout)
  const [positions, setPositions] = useState<Record<string, Pos>>(() =>
    Object.fromEntries(Object.entries(GRAPH_LAYOUT).map(([r, l]) => [r, { x: l.x, y: l.y }]))
  );
  const [dragging, setDragging] = useState<string | null>(null);
  const drag = useRef<{ role: string; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);

  useEffect(() => { const t = setTimeout(() => setEntered(true), 60); return () => clearTimeout(t); }, []);

  const selExec = selectedRole ? execByRole[selectedRole] : null;

  // ── Drag handlers ──
  const onPointerDown = (role: string, e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { role, sx: e.clientX, sy: e.clientY, ox: positions[role].x, oy: positions[role].y, moved: false };
    setDragging(role);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const { role, sx, sy, ox, oy } = drag.current;
    const dx = (e.clientX - sx) / zoom;
    const dy = (e.clientY - sy) / zoom;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.current.moved = true;
    setPositions(p => ({ ...p, [role]: { x: ox + dx, y: oy + dy } }));
  };
  const onPointerUp = (role: string) => {
    const wasMoved = drag.current?.moved;
    drag.current = null;
    setDragging(null);
    // treat as click if barely moved
    if (!wasMoved) setSelectedRole(r => (r === role ? null : role));
  };

  const resetLayout = () => {
    setPositions(Object.fromEntries(Object.entries(GRAPH_LAYOUT).map(([r, l]) => [r, { x: l.x, y: l.y }])));
    setZoom(1);
  };

  // Search
  const q = query.trim().toLowerCase();
  const matches = (role: string) => {
    if (!q) return true;
    const e = execByRole[role];
    if (!e) return false;
    return e.name.toLowerCase().includes(q)
      || e.role.toLowerCase().includes(q)
      || e.title.toLowerCase().includes(q)
      || e.expertise.some(x => x.toLowerCase().includes(q));
  };

  // Header stats
  const avgScore = Math.round(EXECUTIVES.reduce((s, e) => s + e.avgScore, 0) / EXECUTIVES.length);
  const totalProjects = EXECUTIVES.reduce((s, e) => s + e.completedProjects, 0);
  const animAvg = useCountUp(avgScore);
  const animCount = useCountUp(EXECUTIVES.length);
  const animProjects = useCountUp(totalProjects);

  return (
    <div style={{ padding: "20px 24px 32px" }}>
      <style>{`
        @keyframes exec-pop { from{transform:scale(0.75);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes exec-glow { 0%,100%{opacity:0.6} 50%{opacity:1} }
        .exec-header-wrap { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:16px; flex-wrap:wrap; }
        .exec-controls { display:flex; flex-direction:column; gap:10px; align-items:flex-end; }
        @media(max-width:700px){ .exec-controls { align-items:flex-start; } }
        .exec-panel-scroll::-webkit-scrollbar { width:6px; }
        .exec-panel-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:3px; }
      `}</style>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="exec-header-wrap"
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>Executive Board</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 20, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.22)" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", animation: "exec-glow 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: "#10b981" }}>Все активны</span>
            </span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", color: "white", margin: 0 }}>Исполнительный совет</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "5px 0 0" }}>Перетаскивайте агентов мышью · кликните для характеристик справа</p>
        </div>

        {/* KPI chips + search */}
        <div className="exec-controls">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { label: "Агентов", value: animCount },
              { label: "Средний балл", value: animAvg },
              { label: "Проектов", value: animProjects },
            ].map(k => (
              <div key={k.label} style={{ padding: "8px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center", minWidth: 74 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: ACCENT, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{k.value}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 3, letterSpacing: "0.04em" }}>{k.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.6" style={{ width: 13, height: 13, position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><circle cx="7" cy="7" r="5" /><path d="M11 11l3 3" /></svg>
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск агента / навыка..."
                style={{ width: 220, height: 32, padding: "0 12px 0 30px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: 12, outline: "none" }}
                onFocus={e => (e.currentTarget.style.borderColor = `rgba(${RGB},0.5)`)}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")} />
            </div>
            {[
              { lbl: "+",  act: () => setZoom(z => Math.min(1.5, z + 0.15)) },
              { lbl: "−",  act: () => setZoom(z => Math.max(0.55, z - 0.15)) },
              { lbl: "⟲",  act: resetLayout },
            ].map(({ lbl, act }, i) => (
              <button key={i} onClick={act} title={lbl === "⟲" ? "Сбросить расположение" : undefined} style={{
                width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)",
                fontSize: lbl === "⟲" ? 15 : 18, cursor: "pointer", fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{lbl}</button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Full-screen graph + right panel */}
      <div style={{
        position: "relative",
        borderRadius: 18, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden",
        background: "radial-gradient(ellipse at 50% 0%,rgba(18,16,40,0.96) 0%,rgba(5,5,12,0.99) 70%)",
        height: "calc(100vh - 210px)", minHeight: 520,
      }}>
        {/* top vignette */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 60, background: "linear-gradient(to bottom,rgba(0,0,0,0.5),transparent)", pointerEvents: "none", zIndex: 2 }}/>

        {/* Scrollable graph area */}
        <div style={{ position: "absolute", inset: 0, overflow: "auto" }}>
          <div style={{ width: CANVAS_W, height: CANVAS_H, position: "relative", transform: `scale(${zoom})`, transformOrigin: "top left", transition: dragging ? "none" : "transform 0.2s" }}>

            {/* Dot grid + edges */}
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
              <defs>
                <pattern id="exec-dots" width="30" height="30" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.05)"/>
                </pattern>
                <filter id="exec-glow-f"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>
              <rect width="100%" height="100%" fill="url(#exec-dots)"/>

              {/* Edges (follow live positions) */}
              {Object.entries(GRAPH_LAYOUT).map(([role, layout]) => {
                if (!layout.parent) return null;
                const p = positions[layout.parent];
                const c = positions[role];
                if (!p || !c) return null;
                const x1 = p.x, y1 = p.y + NH / 2;
                const x2 = c.x, y2 = c.y - NH / 2;
                const my = (y1 + y2) / 2;
                const active = role === selectedRole || layout.parent === selectedRole;
                const edgeColor = active ? ACCENT : `rgba(${RGB},0.28)`;
                const pathD = `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`;
                return (
                  <g key={role}>
                    <path d={pathD} fill="none" stroke={edgeColor} strokeWidth={active ? 1.8 : 1}
                      filter={active ? "url(#exec-glow-f)" : "none"}
                      style={{ transition: "stroke 0.3s, stroke-width 0.3s" }}/>
                    {active && !dragging && (
                      <circle r="2.6" fill={ACCENT} filter="url(#exec-glow-f)">
                        <animateMotion dur="1.9s" repeatCount="indefinite" path={pathD} />
                        <animate attributeName="opacity" values="0;1;1;0" dur="1.9s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <polygon points={`${x2-4},${y2+2} ${x2+4},${y2+2} ${x2},${y2-7}`}
                      fill={active ? ACCENT : `rgba(${RGB},0.28)`}
                      style={{ transition: "fill 0.3s" }}/>
                  </g>
                );
              })}
            </svg>

            {/* Nodes (draggable, unified color) */}
            {Object.entries(GRAPH_LAYOUT).map(([role, layout], idx) => {
              const exec = execByRole[role];
              if (!exec) return null;
              const pos = positions[role];
              const isSelected = role === selectedRole;
              const isDragging = role === dragging;
              const dimmed = !matches(role);
              return (
                <div key={role}
                  onPointerDown={e => onPointerDown(role, e)}
                  onPointerMove={onPointerMove}
                  onPointerUp={() => onPointerUp(role)}
                  style={{
                    position: "absolute",
                    left: pos.x - NW / 2,
                    top: pos.y - NH / 2,
                    width: NW, height: NH,
                    borderRadius: 12,
                    background: isSelected
                      ? `linear-gradient(135deg,rgba(${RGB},0.20),rgba(10,10,22,0.97))`
                      : "rgba(255,255,255,0.03)",
                    // ── Contour: hairline outer + accent inner ring ──
                    border: "1px solid rgba(255,255,255,0.12)",
                    outline: isSelected ? `1.5px solid ${ACCENT}` : "1.5px solid transparent",
                    outlineOffset: 2,
                    boxShadow: isSelected
                      ? `0 8px 30px rgba(${RGB},0.28), inset 0 1px 0 rgba(255,255,255,0.08)`
                      : isDragging
                      ? `0 16px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)`
                      : "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
                    cursor: isDragging ? "grabbing" : "grab",
                    opacity: entered ? (dimmed ? 0.22 : 1) : 0,
                    filter: dimmed ? "grayscale(0.7)" : "none",
                    animation: entered ? `exec-pop 0.42s cubic-bezier(0.34,1.56,0.64,1) ${idx * 32}ms both` : "none",
                    transition: isDragging ? "none" : "outline 0.2s, box-shadow 0.2s, background 0.2s, opacity 0.25s, filter 0.25s, transform 0.15s",
                    transform: isDragging ? "scale(1.06)" : "scale(1)",
                    userSelect: "none", touchAction: "none",
                    zIndex: isDragging ? 30 : isSelected ? 10 : 1,
                  }}>
                  {/* Badge */}
                  <div style={{
                    position: "absolute", top: 5, left: 6,
                    fontSize: 7, fontWeight: 800, color: ACCENT, letterSpacing: "0.06em",
                    background: `rgba(${RGB},0.16)`, borderRadius: 4, padding: "1px 5px", pointerEvents: "none",
                  }}>{layout.badge}</div>
                  {/* Online dot */}
                  <div style={{
                    position: "absolute", top: 7, right: 7,
                    width: 6, height: 6, borderRadius: "50%",
                    background: "#10b981", boxShadow: "0 0 6px rgba(16,185,129,0.9)",
                    animation: "exec-glow 2.2s ease-in-out infinite", pointerEvents: "none",
                  }}/>
                  {/* Short role */}
                  <div style={{
                    position: "absolute", bottom: 17, left: 0, right: 0,
                    textAlign: "center", fontSize: 12, fontWeight: 800,
                    color: isSelected ? "#fff" : "rgba(255,255,255,0.9)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingInline: 6,
                    pointerEvents: "none",
                  }}>{exec.shortRole}</div>
                  {/* Score */}
                  <div style={{
                    position: "absolute", bottom: 5, left: 0, right: 0,
                    textAlign: "center", fontSize: 8.5, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", pointerEvents: "none",
                  }}>Score {exec.avgScore}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right slide-in characteristics panel ── */}
        <AnimatePresence>
          {selExec && (
            <motion.div
              key={selectedRole}
              initial={{ x: 360, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 360, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="exec-panel-scroll"
              style={{
                position: "absolute", top: 0, right: 0, bottom: 0, width: 340, zIndex: 25,
                background: "rgba(8,8,16,0.92)",
                backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                borderLeft: `1px solid rgba(${RGB},0.2)`,
                boxShadow: "-12px 0 40px rgba(0,0,0,0.5)",
                overflowY: "auto", padding: "20px 20px 28px",
              }}
            >
              {/* Close */}
              <button onClick={() => setSelectedRole(null)} style={{
                position: "absolute", top: 14, right: 14, width: 28, height: 28, borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.45)", cursor: "pointer", fontSize: 15, lineHeight: 1,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>×</button>

              {/* Head */}
              <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 18, paddingRight: 30 }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 14, flexShrink: 0,
                  background: `rgba(${RGB},0.16)`, border: `1px solid rgba(${RGB},0.4)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 800, color: ACCENT,
                }}>{selExec.shortRole}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selExec.name}</div>
                  <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{selExec.title}</div>
                </div>
              </div>

              {/* Score + status */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                <ScoreRing score={selExec.avgScore} size={56} />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 20, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", alignSelf: "flex-start" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981" }} />
                    <span style={{ fontSize: 9, color: "#10b981", fontWeight: 700 }}>Активен</span>
                  </div>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{selExec.years} лет опыта · {selExec.completedProjects} проекта</span>
                </div>
              </div>

              {/* Characteristics table */}
              <div style={{ fontSize: 9, fontWeight: 700, color: `rgba(${RGB},0.8)`, textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 10 }}>Характеристики агента</div>
              <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 18 }}>
                {[
                  ["Имя",       selExec.name],
                  ["Должность", selExec.title],
                  ["Опыт",      `${selExec.years} лет`],
                  ["Статус",    "Активен"],
                  ["Оценка",    `${(selExec.avgScore / 20).toFixed(1)} / 5.0`],
                  ["Проектов",  `${selExec.completedProjects} завершено`],
                  ["Модель",    "Claude Haiku 4.5"],
                  ["Точность",  `${95 + (selExec.avgScore % 5)}.${selExec.avgScore % 10}%`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "4px 0", fontSize: 11 }}>
                    <span style={{ color: "rgba(255,255,255,0.35)" }}>{k}</span>
                    <span style={{ color: k === "Статус" ? "#10b981" : "rgba(255,255,255,0.82)", fontWeight: k === "Статус" ? 700 : 500, textAlign: "right", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Bio */}
              <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 16 }}>{selExec.bio}</p>

              {/* Expertise */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
                {selExec.expertise.map(e => (
                  <span key={e} style={{ fontSize: 9.5, padding: "3px 10px", borderRadius: 20, background: `rgba(${RGB},0.1)`, border: `1px solid rgba(${RGB},0.22)`, color: ACCENT }}>{e}</span>
                ))}
              </div>

              {/* Insights */}
              <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 10 }}>Ключевые инсайты</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 20 }}>
                {selExec.insights.map((ins, i) => (
                  <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                    <div style={{
                      width: 19, height: 19, borderRadius: "50%", flexShrink: 0,
                      background: `rgba(${RGB},0.16)`, border: `1px solid rgba(${RGB},0.3)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, fontWeight: 800, color: ACCENT,
                    }}>{i + 1}</div>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: 0 }}>{ins}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <Link href={`/dashboard/chat?agent=${(selExec.shortRole || selExec.role).toLowerCase()}`} style={{
                height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: `linear-gradient(135deg,${ACCENT},#4f46e5)`,
                boxShadow: `0 6px 20px rgba(${RGB},0.3), inset 0 1px 0 rgba(255,255,255,0.16)`,
                color: "#fff", fontWeight: 700, fontSize: 12, textDecoration: "none", marginBottom: 8,
              }}>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><path d="M18 10c0 3.866-3.582 7-8 7a9 9 0 01-2.5-.35L3 17l1.35-4.05A6.5 6.5 0 013 10c0-3.866 3.582-7 8-7s7 3.134 7 7z"/></svg>
                Обсудить с {selExec.name.split(" ")[0]}
              </Link>
              <Link href="/dashboard/new" style={{
                height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 12, textDecoration: "none",
              }}>
                Брифовать совет по проекту
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
