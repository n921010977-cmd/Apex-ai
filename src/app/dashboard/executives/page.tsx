"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

const EXECUTIVES = [
  {
    role: "CEO", shortRole: "CEO",
    title: "Исполнительный директор",
    name: "Sophia Reeves",
    years: "20+",
    color: "#7c3aed", glow: "rgba(124,58,237,0.35)",
    gradient: "from-violet-600 to-purple-700",
    expertise: ["Стратегия роста", "Видение продукта", "Инвесторы"],
    bio: "Координирует всю команду, синтезирует инсайты в единую стратегию и формирует финальное решение. 20+ лет опыта масштабирования стартапов от идеи до Series B.",
    insights: [
      "Фокусируйтесь на одном ключевом сегменте в первые 12 месяцев",
      "Привлекайте инвесторов только при наличии чётких метрик роста",
      "Командная культура важнее любой стратегии — нанимайте тщательно",
    ],
    completedProjects: 3, avgScore: 87,
  },
  {
    role: "CFO", shortRole: "CFO",
    title: "Финансовый директор",
    name: "Marcus Chen",
    years: "25+",
    color: "#3b82f6", glow: "rgba(59,130,246,0.35)",
    gradient: "from-blue-600 to-cyan-700",
    expertise: ["Финансовое моделирование", "Unit-экономика", "Капитал"],
    bio: "Строит финансовые модели, прогнозы выручки, анализирует затраты и инвестиционные требования. Помог 20+ компаниям привлечь финансирование на общую сумму $500M+.",
    insights: [
      "LTV/CAC > 3:1 — минимальный порог для масштабирования",
      "Runway минимум 18 месяцев перед следующим раундом",
      "Gross margin с первого дня — ключевой сигнал для инвесторов",
    ],
    completedProjects: 3, avgScore: 91,
  },
  {
    role: "CMO", shortRole: "CMO",
    title: "Директор по маркетингу",
    name: "Elena Torres",
    years: "18+",
    color: "#10b981", glow: "rgba(16,185,129,0.35)",
    gradient: "from-emerald-600 to-teal-700",
    expertise: ["Go-to-market", "Brand building", "Performance"],
    bio: "Разрабатывает позиционирование бренда, стратегию выхода на рынок, воронки привлечения и контент-план. Вывела 10+ продуктов от 0 до 1M пользователей.",
    insights: [
      "Начинайте с 1-2 каналов привлечения, не распыляйтесь",
      "Контент-маркетинг даёт лучший ROI в долгосрочной перспективе",
      "NPS и word-of-mouth — самые дешёвые источники роста",
    ],
    completedProjects: 3, avgScore: 84,
  },
  {
    role: "COO", shortRole: "COO",
    title: "Операционный директор",
    name: "James Wright",
    years: "22+",
    color: "#f59e0b", glow: "rgba(245,158,11,0.35)",
    gradient: "from-amber-500 to-orange-600",
    expertise: ["Операционная эффективность", "Процессы", "Масштабирование"],
    bio: "Создаёт операционный роадмап, план запуска, дизайн процессов и структуру команды. Строил операционные системы для компаний от 5 до 500 сотрудников.",
    insights: [
      "Документируйте процессы с первого дня — масштабирование без них невозможно",
      "Автоматизируйте всё, что повторяется более 3 раз в неделю",
      "OKR работают только если команда понимает зачем они нужны",
    ],
    completedProjects: 3, avgScore: 79,
  },
  {
    role: "CTO", shortRole: "CTO",
    title: "Технический директор",
    name: "Aiden Park",
    years: "15+",
    color: "#ec4899", glow: "rgba(236,72,153,0.35)",
    gradient: "from-pink-600 to-rose-700",
    expertise: ["Архитектура систем", "AI/ML", "DevOps"],
    bio: "Рекомендует оптимальный технологический стек, дизайн инфраструктуры и технический роадмап. 15 лет строил масштабируемые системы для продуктов с миллионами пользователей.",
    insights: [
      "MVP должен быть ugly — красота приходит с пониманием пользователей",
      "Технический долг убивает стартапы — рефакторьте постоянно",
      "Безопасность данных с первого дня — потом будет в 10 раз дороже",
    ],
    completedProjects: 3, avgScore: 90,
  },
  {
    role: "Business Analyst", shortRole: "BA",
    title: "Бизнес-аналитик",
    name: "Priya Sharma",
    years: "12+",
    color: "#f97316", glow: "rgba(249,115,22,0.35)",
    gradient: "from-orange-500 to-amber-600",
    expertise: ["Исследование рынка", "SWOT-анализ", "Конкуренты"],
    bio: "Глубокий анализ рынка, конкурентная разведка, сегментация аудитории и маппинг возможностей. Специализируется на поиске незанятых ниш и голубых океанов.",
    insights: [
      "Изучите 10 конкурентов перед запуском — найдите их слабые места",
      "TAM > $1B — минимальный рынок для привлечения венчурных инвестиций",
      "Один детальный customer interview стоит 100 опросов",
    ],
    completedProjects: 3, avgScore: 85,
  },
  {
    role: "Sales Director", shortRole: "SD",
    title: "Директор по продажам",
    name: "Carlos Mendes",
    years: "20+",
    color: "#6366f1", glow: "rgba(99,102,241,0.35)",
    gradient: "from-indigo-600 to-violet-700",
    expertise: ["Sales funnel", "Pricing", "Lead generation"],
    bio: "Разрабатывает воронки продаж, модели ценообразования, стратегии лидогенерации и системы удержания клиентов. Закрыл сделки на суммарно $50M+.",
    insights: [
      "Первые 10 продаж делайте лично — это ваш лучший источник фидбека",
      "Цена слишком низкая — ошибка большинства стартапов на старте",
      "Follow-up решает: 80% продаж закрываются после 5-го контакта",
    ],
    completedProjects: 3, avgScore: 83,
  },
  {
    role: "Legal Advisor", shortRole: "LA",
    title: "Юридический советник",
    name: "Diana Volkov",
    years: "30+",
    color: "#64748b", glow: "rgba(100,116,139,0.3)",
    gradient: "from-slate-600 to-gray-700",
    expertise: ["Структура бизнеса", "IP-стратегия", "Compliance"],
    bio: "Рекомендации по структуре бизнеса, защите интеллектуальной собственности и соответствию требованиям регуляторов. 30+ лет практики в корпоративном праве.",
    insights: [
      "Выбор юрисдикции важен: Delaware C-Corp — стандарт для венчурных инвестиций",
      "Зарегистрируйте торговую марку до запуска, не после",
      "NDA имеют смысл только при раскрытии реально конфиденциальных данных",
    ],
    completedProjects: 3, avgScore: 81,
  },
  {
    role: "CISO", shortRole: "CI",
    title: "Директор по кибербезопасности",
    name: "Viktor Stern",
    years: "20+",
    color: "#ef4444", glow: "rgba(239,68,68,0.35)",
    gradient: "from-red-600 to-rose-700",
    expertise: ["Кибербезопасность", "Управление рисками", "Compliance"],
    bio: "Оценивает угрозы информационной безопасности, разрабатывает политики защиты данных и стратегию соответствия стандартам. Защитил системы 40+ корпораций от кибератак.",
    insights: [
      "Zero-trust архитектура — стандарт для любого SaaS продукта в 2024",
      "GDPR и SOC2 проще внедрить с нуля, чем retrofit в существующую систему",
      "Фишинг — причина 90% взломов: обучайте команду постоянно",
    ],
    completedProjects: 2, avgScore: 88,
  },
  {
    role: "CPO", shortRole: "CP",
    title: "Директор по продукту",
    name: "Yuki Tanaka",
    years: "15+",
    color: "#8b5cf6", glow: "rgba(139,92,246,0.35)",
    gradient: "from-violet-500 to-purple-600",
    expertise: ["Product strategy", "UX Research", "Roadmap"],
    bio: "Формирует продуктовую стратегию, приоритизирует фичи и выстраивает OKR-систему. Создал продукты с аудиторией 5M+ пользователей в B2C и B2B сегментах.",
    insights: [
      "Jobs-to-be-done важнее любых демографических метрик",
      "Не добавляйте фичи без данных: каждая стоит дороже, чем вы думаете",
      "Product-market fit — это когда 40%+ пользователей расстроятся, если продукт исчезнет",
    ],
    completedProjects: 2, avgScore: 86,
  },
  {
    role: "CHRO", shortRole: "HR",
    title: "Директор по персоналу",
    name: "Sarah Mitchell",
    years: "25+",
    color: "#f43f5e", glow: "rgba(244,63,94,0.35)",
    gradient: "from-rose-600 to-pink-700",
    expertise: ["Talent acquisition", "Культура", "Орг. дизайн"],
    bio: "Строит HR-систему, культуру компании и программы удержания талантов. Помогла 30+ стартапам масштабировать команды от 5 до 200+ человек без потери качества найма.",
    insights: [
      "Культурный fit важнее навыков — навыки можно обучить, характер нет",
      "Прозрачность зарплат снижает текучку на 40% — данные не лгут",
      "Нанимайте медленно, увольняйте быстро — каждый человек задаёт стандарт",
    ],
    completedProjects: 2, avgScore: 82,
  },
  {
    role: "CDO", shortRole: "CD",
    title: "Директор по данным",
    name: "Alex Rivera",
    years: "18+",
    color: "#06b6d4", glow: "rgba(6,182,212,0.35)",
    gradient: "from-cyan-600 to-sky-700",
    expertise: ["Data strategy", "Analytics", "ML Ops"],
    bio: "Формирует стратегию работы с данными, архитектуру аналитики и модели машинного обучения. Построил data-платформы для компаний с объёмом данных 10TB+.",
    insights: [
      "Начните с одной ключевой метрики — North Star metric задаёт вектор роста",
      "Data governance с первого дня избавит от головной боли при масштабировании",
      "Не строите хранилища данных — строите продукты на данных",
    ],
    completedProjects: 2, avgScore: 88,
  },
  {
    role: "VP Engineering", shortRole: "VP",
    title: "Вице-президент по инженерии",
    name: "Noah Kim",
    years: "20+",
    color: "#84cc16", glow: "rgba(132,204,22,0.35)",
    gradient: "from-lime-600 to-green-700",
    expertise: ["Engineering management", "Agile", "Платформы"],
    bio: "Управляет инженерными командами, процессами разработки и технической культурой. Руководил командами 50+ инженеров в компаниях уровня Series C и выше.",
    insights: [
      "Скорость разработки падает без Code Review — не срезайте углы",
      "Психологическая безопасность — основа высокопроизводительной команды",
      "Мониторинг и алёртинг важнее новых фичей в production-среде",
    ],
    completedProjects: 2, avgScore: 86,
  },
  {
    role: "Growth Hacker", shortRole: "GH",
    title: "Специалист по росту",
    name: "Mia Patel",
    years: "10+",
    color: "#fb923c", glow: "rgba(251,146,60,0.35)",
    gradient: "from-orange-500 to-red-600",
    expertise: ["Viral loops", "A/B тестирование", "Retention"],
    bio: "Находит нестандартные точки роста, строит вирусные механики и оптимизирует конверсию воронки. За карьеру обеспечила рост x10 для 8 стартапов на стадии pre-PMF.",
    insights: [
      "Retention — самый важный показатель: дырявое ведро не наполнишь",
      "Сначала ищите product-channel fit, потом масштабируйте канал",
      "Каждый эксперимент должен иметь гипотезу и метрику успеха до запуска",
    ],
    completedProjects: 2, avgScore: 89,
  },
  {
    role: "IR Manager", shortRole: "IR",
    title: "Директор по связям с инвесторами",
    name: "Christopher Lee",
    years: "35+",
    color: "#a855f7", glow: "rgba(168,85,247,0.35)",
    gradient: "from-purple-600 to-fuchsia-700",
    expertise: ["Investor relations", "Due diligence", "Питч-деки"],
    bio: "Специализируется на подготовке к раундам финансирования, построении отношений с инвесторами и прохождении due diligence. Участвовал в сделках на $2B+ суммарно.",
    insights: [
      "Инвесторы покупают команду на ранних стадиях, продукт — на поздних",
      "Питч-дек — это история с числами, не слайды с буллетами",
      "Тёплое знакомство через общих контактов повышает шанс встречи в 5 раз",
    ],
    completedProjects: 2, avgScore: 84,
  },
];

// Score arc indicator for card
function ScoreArc({ score, color }: { score: number; color: string }) {
  const r = 14; const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg viewBox="0 0 36 36" className="size-9">
      <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
      <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ * 0.25}
        strokeLinecap="round" style={{ filter: `drop-shadow(0 0 3px ${color}80)` }} />
      <text x="18" y="22" textAnchor="middle" fontSize="9" fontWeight="700" fill="white" fontFamily="monospace">{score}</text>
    </svg>
  );
}

export default function ExecutivesPage() {
  const [active, setActive] = useState(EXECUTIVES[0]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-0.5">Исполнительный совет</h1>
        <p className="text-sm text-white/35">15 AI-экспертов, каждый отвечает за свою область анализа</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-5 items-start">

        {/* ── 3×5 Agent Grid ── */}
        <div className="grid grid-cols-3 gap-3">
          {EXECUTIVES.map((exec) => {
            const isActive = active.role === exec.role;
            return (
              <button
                key={exec.role}
                onClick={() => setActive(exec)}
                className="relative rounded-2xl overflow-hidden p-4 text-left transition-all duration-200 group hover:scale-[1.025] hover:-translate-y-0.5"
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${exec.color}18 0%, rgba(10,10,14,0.92) 100%)`
                    : "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(10,10,14,0.7) 100%)",
                  border: isActive
                    ? `1px solid ${exec.color}35`
                    : "1px solid rgba(255,255,255,0.07)",
                  backdropFilter: "blur(12px)",
                  boxShadow: isActive
                    ? `inset 0 1px 0 ${exec.color}18, 0 8px 28px rgba(0,0,0,0.35)`
                    : "inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.2)",
                }}
              >
                {/* shimmer top edge */}
                <div className="absolute inset-x-0 top-0 h-px transition-opacity duration-200"
                  style={{ background: `linear-gradient(90deg, transparent, ${exec.color}${isActive ? "55" : "25"}, transparent)` }} />

                {/* active glow bg */}
                {isActive && (
                  <div className="absolute inset-0 opacity-10" style={{
                    background: `radial-gradient(ellipse at 30% 30%, ${exec.color} 0%, transparent 70%)`,
                  }} />
                )}

                {/* status dot */}
                <div className="absolute top-3 right-3 size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />

                {/* avatar + score */}
                <div className="flex items-start justify-between mb-3 relative">
                  <div
                    className="size-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${exec.color}30, ${exec.color}10)`,
                      border: `1px solid ${exec.color}35`,
                      color: exec.color,
                      boxShadow: `0 4px 12px ${exec.glow}`,
                    }}
                  >
                    {exec.shortRole.slice(0, 2)}
                  </div>
                  <ScoreArc score={exec.avgScore} color={exec.color} />
                </div>

                {/* name + title */}
                <div className="relative mb-2">
                  <div className="text-[12px] font-bold text-white leading-tight mb-0.5">{exec.name}</div>
                  <div className="text-[10px] text-white/35 leading-tight truncate">{exec.title}</div>
                </div>

                {/* experience badge */}
                <div
                  className="relative inline-flex items-center gap-1 rounded-full px-2 py-0.5"
                  style={{
                    background: `${exec.color}12`,
                    border: `1px solid ${exec.color}22`,
                  }}
                >
                  <svg viewBox="0 0 12 12" className="size-2.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: exec.color }}>
                    <circle cx="6" cy="6" r="4.5"/><path d="M6 3.5v2.5l1.5 1"/>
                  </svg>
                  <span className="text-[9px] font-semibold" style={{ color: exec.color }}>Опыт: {exec.years} лет</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Right Detail Panel ── */}
        <div className="space-y-4 xl:sticky xl:top-6">
          {/* Agent card */}
          <div
            className="relative rounded-2xl overflow-hidden p-5"
            style={{
              background: `linear-gradient(135deg, ${active.color}0d 0%, rgba(10,10,14,0.94) 100%)`,
              border: `1px solid ${active.color}25`,
              backdropFilter: "blur(20px)",
              boxShadow: `inset 0 1px 0 ${active.color}18, 0 20px 60px rgba(0,0,0,0.4)`,
            }}
          >
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${active.color}55, transparent)` }} />
            <div className="absolute top-0 left-0 right-0 h-32 opacity-10" style={{
              background: `radial-gradient(ellipse at 40% 0%, ${active.color} 0%, transparent 70%)`,
            }} />

            {/* header */}
            <div className="flex items-start gap-4 mb-5 relative">
              <div
                className="size-14 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${active.color}35, ${active.color}15)`,
                  border: `1px solid ${active.color}40`,
                  color: active.color,
                  boxShadow: `0 8px 24px ${active.glow}`,
                }}
              >
                {active.shortRole}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <h2 className="text-base font-bold text-white">{active.name}</h2>
                  <Badge variant="success" dot>Активен</Badge>
                </div>
                <p className="text-xs text-white/40 mb-2">{active.title}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {active.expertise.map((e) => (
                    <span
                      key={e}
                      className="text-[9px] px-2 py-0.5 rounded-full border"
                      style={{ background: `${active.color}10`, color: active.color, borderColor: `${active.color}25` }}
                    >{e}</span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-3xl font-bold font-mono" style={{ color: active.color, textShadow: `0 0 20px ${active.glow}` }}>{active.avgScore}</div>
                <div className="text-[9px] text-white/30 leading-tight">средний балл</div>
                <div className="text-[9px] text-white/20 mt-0.5">{active.completedProjects} проекта</div>
              </div>
            </div>

            {/* experience bar */}
            <div
              className="flex items-center gap-2 mb-4 rounded-xl px-3 py-2 relative"
              style={{ background: `${active.color}0a`, border: `1px solid ${active.color}18` }}
            >
              <svg viewBox="0 0 16 16" className="size-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: active.color }}>
                <circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/>
              </svg>
              <span className="text-[10px] font-semibold" style={{ color: active.color }}>Опыт: {active.years} лет</span>
              <span className="text-[10px] text-white/25 ml-auto">в индустрии</span>
            </div>

            <p className="text-[12.5px] text-white/55 leading-[1.8] mb-5 relative">{active.bio}</p>

            {/* Insights */}
            <div
              className="relative rounded-xl p-4"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="text-[9px] font-semibold text-white/30 uppercase tracking-[0.2em] mb-3">Ключевые инсайты</div>
              <div className="space-y-3">
                {active.insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="size-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5"
                      style={{ background: `${active.color}20`, color: active.color, border: `1px solid ${active.color}30` }}
                    >
                      {i + 1}
                    </div>
                    <p className="text-[11.5px] text-white/55 leading-[1.7]">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Завершено проектов", value: active.completedProjects.toString() },
              { label: "Средний балл", value: active.avgScore.toString() },
              { label: "Статус", value: "Активен" },
            ].map((s) => (
              <div
                key={s.label}
                className="relative rounded-xl overflow-hidden p-3 text-center"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(10,10,14,0.8) 100%)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)" }} />
                <div className="text-xl font-bold font-mono text-white mb-0.5">{s.value}</div>
                <div className="text-[9px] text-white/30">{s.label}</div>
              </div>
            ))}
          </div>

          <Link
            href="/dashboard/new"
            className="relative w-full h-11 text-[13px] font-semibold text-white rounded-xl flex items-center justify-center gap-2 overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)",
              boxShadow: "0 8px 28px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-200" style={{ background: "linear-gradient(135deg, #8b5cf6, #60a5fa)" }} />
            <svg className="size-4 relative" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            <span className="relative">Брифовать совет по новому проекту</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
