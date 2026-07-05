"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const EXECUTIVES = [
  {
    role: "CEO", shortRole: "CEO", title: "Исполнительный директор", name: "Sophia Reeves", years: "20+",
    color: "#7c3aed", rgb: "124,58,237",
    expertise: ["Стратегия роста", "Видение продукта", "Инвесторы"],
    bio: "Координирует всю команду, синтезирует инсайты в единую стратегию и формирует финальное решение. 20+ лет опыта масштабирования стартапов от идеи до Series B.",
    insights: ["Фокусируйтесь на одном ключевом сегменте в первые 12 месяцев", "Привлекайте инвесторов только при наличии чётких метрик роста", "Командная культура важнее любой стратегии — нанимайте тщательно"],
    completedProjects: 3, avgScore: 87,
  },
  {
    role: "CFO", shortRole: "CFO", title: "Финансовый директор", name: "Marcus Chen", years: "25+",
    color: "#3b82f6", rgb: "59,130,246",
    expertise: ["Финансовое моделирование", "Unit-экономика", "Капитал"],
    bio: "Строит финансовые модели, прогнозы выручки, анализирует затраты и инвестиционные требования. Помог 20+ компаниям привлечь $500M+.",
    insights: ["LTV/CAC > 3:1 — минимальный порог для масштабирования", "Runway минимум 18 месяцев перед следующим раундом", "Gross margin с первого дня — ключевой сигнал для инвесторов"],
    completedProjects: 3, avgScore: 91,
  },
  {
    role: "CMO", shortRole: "CMO", title: "Директор по маркетингу", name: "Elena Torres", years: "18+",
    color: "#10b981", rgb: "16,185,129",
    expertise: ["Go-to-market", "Brand building", "Performance"],
    bio: "Разрабатывает позиционирование бренда, стратегию выхода на рынок, воронки привлечения и контент-план. Вывела 10+ продуктов от 0 до 1M пользователей.",
    insights: ["Начинайте с 1-2 каналов привлечения, не распыляйтесь", "Контент-маркетинг даёт лучший ROI в долгосрочной перспективе", "NPS и word-of-mouth — самые дешёвые источники роста"],
    completedProjects: 3, avgScore: 84,
  },
  {
    role: "COO", shortRole: "COO", title: "Операционный директор", name: "James Wright", years: "22+",
    color: "#f59e0b", rgb: "245,158,11",
    expertise: ["Операционная эффективность", "Процессы", "Масштабирование"],
    bio: "Создаёт операционный роадмап, план запуска, дизайн процессов и структуру команды. Строил операционные системы для компаний от 5 до 500 сотрудников.",
    insights: ["Документируйте процессы с первого дня — масштабирование без них невозможно", "Автоматизируйте всё, что повторяется более 3 раз в неделю", "OKR работают только если команда понимает зачем они нужны"],
    completedProjects: 3, avgScore: 79,
  },
  {
    role: "CTO", shortRole: "CTO", title: "Технический директор", name: "Aiden Park", years: "15+",
    color: "#ec4899", rgb: "236,72,153",
    expertise: ["Архитектура систем", "AI/ML", "DevOps"],
    bio: "Рекомендует оптимальный технологический стек, дизайн инфраструктуры и технический роадмап. 15 лет строил масштабируемые системы для продуктов с миллионами пользователей.",
    insights: ["MVP должен быть ugly — красота приходит с пониманием пользователей", "Технический долг убивает стартапы — рефакторьте постоянно", "Безопасность данных с первого дня — потом будет в 10 раз дороже"],
    completedProjects: 3, avgScore: 90,
  },
  {
    role: "Business Analyst", shortRole: "BA", title: "Бизнес-аналитик", name: "Priya Sharma", years: "12+",
    color: "#f97316", rgb: "249,115,22",
    expertise: ["Исследование рынка", "SWOT-анализ", "Конкуренты"],
    bio: "Глубокий анализ рынка, конкурентная разведка, сегментация аудитории и маппинг возможностей. Специализируется на поиске незанятых ниш и голубых океанов.",
    insights: ["Изучите 10 конкурентов перед запуском — найдите их слабые места", "TAM > $1B — минимальный рынок для венчурных инвестиций", "Один детальный customer interview стоит 100 опросов"],
    completedProjects: 3, avgScore: 85,
  },
  {
    role: "Sales Director", shortRole: "SD", title: "Директор по продажам", name: "Carlos Mendes", years: "20+",
    color: "#6366f1", rgb: "99,102,241",
    expertise: ["Sales funnel", "Pricing", "Lead generation"],
    bio: "Разрабатывает воронки продаж, модели ценообразования, стратегии лидогенерации и системы удержания клиентов. Закрыл сделки на суммарно $50M+.",
    insights: ["Первые 10 продаж делайте лично — это ваш лучший источник фидбека", "Цена слишком низкая — ошибка большинства стартапов на старте", "Follow-up решает: 80% продаж закрываются после 5-го контакта"],
    completedProjects: 3, avgScore: 83,
  },
  {
    role: "Legal Advisor", shortRole: "LA", title: "Юридический советник", name: "Diana Volkov", years: "30+",
    color: "#64748b", rgb: "100,116,139",
    expertise: ["Структура бизнеса", "IP-стратегия", "Compliance"],
    bio: "Рекомендации по структуре бизнеса, защите интеллектуальной собственности и соответствию требованиям регуляторов. 30+ лет практики в корпоративном праве.",
    insights: ["Delaware C-Corp — стандарт для венчурных инвестиций", "Зарегистрируйте торговую марку до запуска, не после", "NDA имеют смысл только при раскрытии реально конфиденциальных данных"],
    completedProjects: 3, avgScore: 81,
  },
  {
    role: "CISO", shortRole: "CI", title: "Директор по кибербезопасности", name: "Viktor Stern", years: "20+",
    color: "#ef4444", rgb: "239,68,68",
    expertise: ["Кибербезопасность", "Управление рисками", "Compliance"],
    bio: "Оценивает угрозы информационной безопасности, разрабатывает политики защиты данных и стратегию соответствия стандартам. Защитил системы 40+ корпораций.",
    insights: ["Zero-trust архитектура — стандарт для любого SaaS в 2024", "GDPR и SOC2 проще внедрить с нуля, чем retrofit", "Фишинг — причина 90% взломов: обучайте команду постоянно"],
    completedProjects: 2, avgScore: 88,
  },
  {
    role: "CPO", shortRole: "CP", title: "Директор по продукту", name: "Yuki Tanaka", years: "15+",
    color: "#8b5cf6", rgb: "139,92,246",
    expertise: ["Product strategy", "UX Research", "Roadmap"],
    bio: "Формирует продуктовую стратегию, приоритизирует фичи и выстраивает OKR-систему. Создал продукты с аудиторией 5M+ пользователей в B2C и B2B сегментах.",
    insights: ["Jobs-to-be-done важнее любых демографических метрик", "Не добавляйте фичи без данных: каждая стоит дороже, чем вы думаете", "Product-market fit — это когда 40%+ пользователей расстроятся, если продукт исчезнет"],
    completedProjects: 2, avgScore: 86,
  },
  {
    role: "CHRO", shortRole: "HR", title: "Директор по персоналу", name: "Sarah Mitchell", years: "25+",
    color: "#f43f5e", rgb: "244,63,94",
    expertise: ["Talent acquisition", "Культура", "Орг. дизайн"],
    bio: "Строит HR-систему, культуру компании и программы удержания талантов. Помогла 30+ стартапам масштабировать команды от 5 до 200+ человек без потери качества найма.",
    insights: ["Культурный fit важнее навыков — навыки можно обучить, характер нет", "Прозрачность зарплат снижает текучку на 40%", "Нанимайте медленно, увольняйте быстро — каждый человек задаёт стандарт"],
    completedProjects: 2, avgScore: 82,
  },
  {
    role: "CDO", shortRole: "CD", title: "Директор по данным", name: "Alex Rivera", years: "18+",
    color: "#06b6d4", rgb: "6,182,212",
    expertise: ["Data strategy", "Analytics", "ML Ops"],
    bio: "Формирует стратегию работы с данными, архитектуру аналитики и модели машинного обучения. Построил data-платформы для компаний с объёмом данных 10TB+.",
    insights: ["Начните с одной ключевой метрики — North Star metric задаёт вектор роста", "Data governance с первого дня избавит от головной боли при масштабировании", "Не строите хранилища данных — строите продукты на данных"],
    completedProjects: 2, avgScore: 88,
  },
  {
    role: "VP Engineering", shortRole: "VP", title: "Вице-президент по инженерии", name: "Noah Kim", years: "20+",
    color: "#84cc16", rgb: "132,204,22",
    expertise: ["Engineering management", "Agile", "Платформы"],
    bio: "Управляет инженерными командами, процессами разработки и технической культурой. Руководил командами 50+ инженеров в компаниях уровня Series C и выше.",
    insights: ["Скорость разработки падает без Code Review — не срезайте углы", "Психологическая безопасность — основа высокопроизводительной команды", "Мониторинг и алёртинг важнее новых фичей в production"],
    completedProjects: 2, avgScore: 86,
  },
  {
    role: "Growth Hacker", shortRole: "GH", title: "Специалист по росту", name: "Mia Patel", years: "10+",
    color: "#fb923c", rgb: "251,146,60",
    expertise: ["Viral loops", "A/B тестирование", "Retention"],
    bio: "Находит нестандартные точки роста, строит вирусные механики и оптимизирует конверсию воронки. За карьеру обеспечила рост x10 для 8 стартапов на стадии pre-PMF.",
    insights: ["Retention — самый важный показатель: дырявое ведро не наполнишь", "Сначала ищите product-channel fit, потом масштабируйте канал", "Каждый эксперимент должен иметь гипотезу и метрику успеха до запуска"],
    completedProjects: 2, avgScore: 89,
  },
  {
    role: "IR Manager", shortRole: "IR", title: "Директор по связям с инвесторами", name: "Christopher Lee", years: "35+",
    color: "#a855f7", rgb: "168,85,247",
    expertise: ["Investor relations", "Due diligence", "Питч-деки"],
    bio: "Специализируется на подготовке к раундам финансирования, построении отношений с инвесторами и прохождении due diligence. Участвовал в сделках на $2B+ суммарно.",
    insights: ["Инвесторы покупают команду на ранних стадиях, продукт — на поздних", "Питч-дек — это история с числами, не слайды с буллетами", "Тёплое знакомство через общих контактов повышает шанс встречи в 5 раз"],
    completedProjects: 2, avgScore: 84,
  },
];

// ─── GRAPH LAYOUT ─────────────────────────────────────────────────────────────
// x/y = node center. Node size: NW × NH
const NW = 118, NH = 60;

// Hierarchy: CEO → CFO, CMO, COO, CTO → children
// Under CFO: Business Analyst, IR Manager
// Under CMO: Sales Director, Growth Hacker
// Under COO: Legal Advisor, CHRO, VP Engineering
// Under CTO: CISO, CPO, CDO
const GRAPH_LAYOUT: Record<string, { x: number; y: number; parent: string | null; badge: string }> = {
  "CEO":              { x: 664,  y: 44,  parent: null,   badge: "C.E.O" },
  "CFO":              { x: 148,  y: 200, parent: "CEO",  badge: "C.F.O" },
  "CMO":              { x: 424,  y: 200, parent: "CEO",  badge: "C.M.O" },
  "COO":              { x: 720,  y: 200, parent: "CEO",  badge: "C.O.O" },
  "CTO":              { x: 1060, y: 200, parent: "CEO",  badge: "C.T.O" },
  "Business Analyst": { x: 80,   y: 374, parent: "CFO",  badge: "B.ANL" },
  "IR Manager":       { x: 214,  y: 374, parent: "CFO",  badge: "I.R"   },
  "Sales Director":   { x: 356,  y: 374, parent: "CMO",  badge: "S.DIR" },
  "Growth Hacker":    { x: 490,  y: 374, parent: "CMO",  badge: "GRW"   },
  "Legal Advisor":    { x: 588,  y: 374, parent: "COO",  badge: "L.ADV" },
  "CHRO":             { x: 720,  y: 374, parent: "COO",  badge: "H.R"   },
  "VP Engineering":   { x: 852,  y: 374, parent: "COO",  badge: "V.P.E" },
  "CISO":             { x: 950,  y: 374, parent: "CTO",  badge: "CISO"  },
  "CPO":              { x: 1060, y: 374, parent: "CTO",  badge: "C.P.O" },
  "CDO":              { x: 1170, y: 374, parent: "CTO",  badge: "C.D.O" },
};

const CANVAS_W = 1300, CANVAS_H = 470;

const execByRole = Object.fromEntries(EXECUTIVES.map(e => [e.role, e]));

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function ExecutivesPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>("CEO");
  const [zoom, setZoom] = useState(1);
  const [entered, setEntered] = useState(false);
  useEffect(() => { const t = setTimeout(() => setEntered(true), 60); return () => clearTimeout(t); }, []);

  const selExec = selectedRole ? execByRole[selectedRole] : null;
  const selLayout = selectedRole ? GRAPH_LAYOUT[selectedRole] : null;
  const selColor = selExec?.color ?? "#7c3aed";
  const selRgb = selExec?.rgb ?? "124,58,237";

  return (
    <div style={{ padding: "20px 24px 48px", maxWidth: 1340, margin: "0 auto" }}>
      <style>{`
        @keyframes exec-pop { from{transform:scale(0.75);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes exec-glow { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes exec-slide { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: "white", margin: 0 }}>Исполнительный совет</h1>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "4px 0 0" }}>15 AI-экспертов — кликните на агента для просмотра профиля</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {["+", "−", "⊡"].map((lbl, i) => (
            <button key={i} onClick={() => {
              if (lbl === "+") setZoom(z => Math.min(1.5, z + 0.15));
              else if (lbl === "−") setZoom(z => Math.max(0.55, z - 0.15));
              else setZoom(1);
            }} style={{
              width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)",
              fontSize: lbl === "⊡" ? 14 : 18, cursor: "pointer", fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{lbl}</button>
          ))}
          <Link href="/dashboard/new" style={{
            height: 36, padding: "0 18px", borderRadius: 10, fontSize: 12, fontWeight: 700,
            background: "linear-gradient(135deg,#3CFF6A,#00C44F)", color: "#0a1a0a",
            border: "none", display: "inline-flex", alignItems: "center", gap: 7,
            boxShadow: "0 0 20px rgba(60,255,106,0.35)", textDecoration: "none",
          }}>
            <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 11, height: 11 }}><polygon points="3,2 14,8 3,14"/></svg>
            Брифовать совет
          </Link>
        </div>
      </div>

      {/* Graph canvas */}
      <div style={{
        borderRadius: 18, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", position: "relative",
        background: "radial-gradient(ellipse at 50% 0%,rgba(30,18,60,0.96) 0%,rgba(5,5,12,0.99) 70%)",
        marginBottom: 16,
      }}>
        {/* top vignette */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 60, background: "linear-gradient(to bottom,rgba(0,0,0,0.55),transparent)", pointerEvents: "none", zIndex: 2 }}/>

        <div style={{ overflowX: "auto", overflowY: "hidden" }}>
          <div style={{ width: CANVAS_W, height: CANVAS_H + 10, position: "relative", transform: `scale(${zoom})`, transformOrigin: "top left", transition: "transform 0.2s" }}>

            {/* Dot grid bg */}
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
              <defs>
                <pattern id="exec-dots" width="30" height="30" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.055)"/>
                </pattern>
                <linearGradient id="exec-edge-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.6"/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6"/>
                </linearGradient>
                <filter id="exec-glow-f"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>
              <rect width="100%" height="100%" fill="url(#exec-dots)"/>

              {/* Edges */}
              {Object.entries(GRAPH_LAYOUT).map(([role, layout]) => {
                if (!layout.parent) return null;
                const parent = GRAPH_LAYOUT[layout.parent];
                if (!parent) return null;
                const x1 = parent.x, y1 = parent.y + NH / 2;
                const x2 = layout.x,  y2 = layout.y - NH / 2;
                const my = (y1 + y2) / 2;
                const active = role === selectedRole || layout.parent === selectedRole;
                const ec = execByRole[role];
                const pc = execByRole[layout.parent];
                const edgeColor = active
                  ? (selExec?.color ?? "#7c3aed")
                  : `rgba(${ec?.rgb ?? "139,92,246"},0.35)`;
                return (
                  <g key={role}>
                    <path d={`M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`}
                      fill="none" stroke={edgeColor} strokeWidth={active ? 1.8 : 1}
                      filter={active ? "url(#exec-glow-f)" : "none"}
                      style={{ transition: "stroke 0.3s, stroke-width 0.3s" }}/>
                    {/* Arrow tip */}
                    <polygon points={`${x2-4},${y2+2} ${x2+4},${y2+2} ${x2},${y2-7}`}
                      fill={active ? (selExec?.color ?? "#7c3aed") : `rgba(${ec?.rgb ?? "255,255,255"},0.3)`}
                      style={{ transition: "fill 0.3s" }}/>
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {Object.entries(GRAPH_LAYOUT).map(([role, layout], idx) => {
              const exec = execByRole[role];
              if (!exec) return null;
              const isSelected = role === selectedRole;
              return (
                <div key={role}
                  onClick={() => setSelectedRole(isSelected ? null : role)}
                  style={{
                    position: "absolute",
                    left: layout.x - NW / 2,
                    top: layout.y - NH / 2,
                    width: NW, height: NH,
                    borderRadius: 11,
                    background: isSelected
                      ? `linear-gradient(135deg,rgba(${exec.rgb},0.22),rgba(10,10,26,0.97))`
                      : `linear-gradient(135deg,rgba(${exec.rgb},0.09),rgba(8,8,20,0.96))`,
                    border: isSelected
                      ? `2px solid ${exec.color}`
                      : `1px solid rgba(${exec.rgb},0.35)`,
                    boxShadow: isSelected
                      ? `0 0 28px rgba(${exec.rgb},0.55), 0 0 60px rgba(${exec.rgb},0.18)`
                      : `0 0 10px rgba(${exec.rgb},0.15)`,
                    cursor: "pointer",
                    opacity: entered ? 1 : 0,
                    animation: entered ? `exec-pop 0.42s cubic-bezier(0.34,1.56,0.64,1) ${idx * 32}ms both` : "none",
                    transition: "border 0.22s, box-shadow 0.22s, background 0.22s",
                    userSelect: "none",
                    zIndex: isSelected ? 10 : 1,
                  }}>
                  {/* Badge */}
                  <div style={{
                    position: "absolute", top: 5, left: 6,
                    fontSize: 7, fontWeight: 800, color: exec.color, letterSpacing: "0.06em",
                    background: `rgba(${exec.rgb},0.18)`, borderRadius: 4, padding: "1px 5px",
                  }}>{layout.badge}</div>
                  {/* Online dot */}
                  <div style={{
                    position: "absolute", top: 7, right: 7,
                    width: 6, height: 6, borderRadius: "50%",
                    background: "#34d399", boxShadow: "0 0 6px rgba(52,211,153,0.9)",
                    animation: "exec-glow 2.2s ease-in-out infinite",
                  }}/>
                  {/* Short role */}
                  <div style={{
                    position: "absolute", bottom: 16, left: 0, right: 0,
                    textAlign: "center", fontSize: 11.5, fontWeight: 800,
                    color: isSelected ? exec.color : "rgba(255,255,255,0.9)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingInline: 6,
                    textShadow: isSelected ? `0 0 12px rgba(${exec.rgb},0.8)` : "none",
                    transition: "color 0.2s, text-shadow 0.2s",
                  }}>{exec.shortRole === exec.role ? exec.shortRole : `${exec.shortRole}`}</div>
                  {/* Score */}
                  <div style={{
                    position: "absolute", bottom: 5, left: 0, right: 0,
                    textAlign: "center", fontSize: 8.5, color: "rgba(255,255,255,0.3)", fontFamily: "monospace",
                  }}>Score {exec.avgScore}</div>
                </div>
              );
            })}

            {/* Popup tooltip near selected node */}
            {selExec && selLayout && (() => {
              const popW = 260;
              let px = selLayout.x - NW / 2;
              let py = selLayout.y + NH / 2 + 12;
              if (px + popW > CANVAS_W - 8) px = CANVAS_W - popW - 8;
              if (py + 210 > CANVAS_H) py = selLayout.y - NH / 2 - 220;
              return (
                <div style={{
                  position: "absolute", left: px, top: py, width: popW,
                  background: "rgba(8,8,22,0.97)",
                  border: `1px solid rgba(${selRgb},0.4)`,
                  borderRadius: 12,
                  boxShadow: `0 8px 32px rgba(0,0,0,0.65), 0 0 24px rgba(${selRgb},0.2)`,
                  padding: "12px 14px", zIndex: 20,
                  animation: "exec-pop 0.22s cubic-bezier(0.34,1.56,0.64,1) both",
                }}>
                  <div style={{ fontSize: 8.5, fontWeight: 800, color: selColor, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                    {selExec.shortRole} | Характеристики Агента
                  </div>
                  {[
                    ["Имя",        selExec.name],
                    ["Должность",  selExec.title],
                    ["Опыт",       `${selExec.years} лет`],
                    ["Статус",     "Активен"],
                    ["Оценка",     `${(selExec.avgScore / 20).toFixed(1)} / 5.0`],
                    ["Проектов",   `${selExec.completedProjects} завершено`],
                    ["Модель",     "Claude Haiku 4.5"],
                    ["Точность",   `${95 + (selExec.avgScore % 5)}.${selExec.avgScore % 10}%`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4, fontSize: 9.5 }}>
                      <span style={{ color: "rgba(255,255,255,0.35)" }}>{k}</span>
                      <span style={{ color: k === "Статус" ? "#34d399" : "rgba(255,255,255,0.8)", fontWeight: k === "Статус" ? 700 : 400, textAlign: "right", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Sparkle */}
            <div style={{ position: "absolute", bottom: 18, right: 22, color: "rgba(255,255,255,0.1)", fontSize: 38, pointerEvents: "none", animation: "exec-glow 4s ease-in-out infinite" }}>✦</div>
          </div>
        </div>
      </div>

      {/* Detail panel for selected exec */}
      {selExec && (
        <div style={{
          background: `linear-gradient(135deg,rgba(${selRgb},0.08) 0%,rgba(8,8,20,0.97) 100%)`,
          border: `1px solid rgba(${selRgb},0.2)`,
          borderRadius: 18, padding: "22px 24px", position: "relative", overflow: "hidden",
          animation: "exec-slide 0.35s ease both",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,rgba(${selRgb},0.6),transparent)` }}/>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
            {/* Left: bio + expertise */}
            <div style={{ gridColumn: "span 1" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: `rgba(${selRgb},0.2)`, border: `1px solid rgba(${selRgb},0.4)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 800, color: selColor,
                  boxShadow: `0 6px 20px rgba(${selRgb},0.35)`,
                }}>{selExec.shortRole}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "white" }}>{selExec.name}</div>
                  <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.38)", marginTop: 2 }}>{selExec.title}</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 5, padding: "2px 8px", borderRadius: 20, background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)" }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399" }}/>
                    <span style={{ fontSize: 9, color: "#34d399", fontWeight: 700 }}>Активен</span>
                  </div>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <div style={{ fontSize: 30, fontWeight: 900, color: selColor, fontFamily: "monospace", textShadow: `0 0 16px rgba(${selRgb},0.7)` }}>{selExec.avgScore}</div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>средний балл</div>
                </div>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.75, marginBottom: 14 }}>{selExec.bio}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {selExec.expertise.map(e => (
                  <span key={e} style={{ fontSize: 9.5, padding: "3px 10px", borderRadius: 20, background: `rgba(${selRgb},0.12)`, border: `1px solid rgba(${selRgb},0.25)`, color: selColor }}>{e}</span>
                ))}
              </div>
            </div>

            {/* Middle: key insights */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 12 }}>Ключевые инсайты</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {selExec.insights.map((ins, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                      background: `rgba(${selRgb},0.18)`, border: `1px solid rgba(${selRgb},0.3)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, fontWeight: 800, color: selColor,
                    }}>{i + 1}</div>
                    <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, margin: 0 }}>{ins}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: stats + action */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { label: "Завершено проектов", value: selExec.completedProjects.toString() },
                  { label: "Средний балл", value: selExec.avgScore.toString() },
                  { label: "Статус", value: "Активен" },
                ].map(s => (
                  <div key={s.label} style={{
                    padding: "12px 10px", borderRadius: 12, textAlign: "center",
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "white", fontFamily: "monospace" }}>{s.value}</div>
                    <div style={{ fontSize: 8.5, color: "rgba(255,255,255,0.28)", marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "12px 14px", borderRadius: 12, background: `rgba(${selRgb},0.07)`, border: `1px solid rgba(${selRgb},0.18)` }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>Опыт и специализация</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <svg viewBox="0 0 14 14" fill="none" stroke={selColor} strokeWidth="1.5" style={{ width: 12, height: 12, flexShrink: 0 }}><circle cx="7" cy="7" r="5"/><path d="M7 4v3l2 1.5"/></svg>
                  <span style={{ fontSize: 11, fontWeight: 700, color: selColor }}>{selExec.years} лет в индустрии</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: `rgba(${selRgb},0.12)`, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(99, parseInt(selExec.years) * 2.5)}%`, background: `linear-gradient(90deg,rgba(${selRgb},0.5),${selColor})`, borderRadius: 2, boxShadow: `0 0 6px ${selColor}` }}/>
                </div>
              </div>
              <Link href={`/dashboard/chat?agent=${(selExec.shortRole || selExec.role).toLowerCase()}`} style={{
                height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: `linear-gradient(135deg,rgba(${selRgb},0.85),rgba(${selRgb},0.5))`,
                border: `1px solid rgba(${selRgb},0.5)`,
                boxShadow: `0 6px 24px rgba(${selRgb},0.3)`,
                color: "white", fontWeight: 700, fontSize: 12, textDecoration: "none",
                transition: "filter 0.2s",
              }}>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><path d="M18 10c0 3.866-3.582 7-8 7a9 9 0 01-2.5-.35L3 17l1.35-4.05A6.5 6.5 0 013 10c0-3.866 3.582-7 8-7s7 3.134 7 7z"/></svg>
                Обсудить с {selExec.name.split(" ")[0]}
              </Link>
              <Link href="/dashboard/new" style={{
                height: 38, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.65)", fontWeight: 600, fontSize: 12, textDecoration: "none",
              }}>
                Брифовать совет по новому проекту
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
