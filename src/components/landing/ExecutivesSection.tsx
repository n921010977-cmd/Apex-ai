"use client";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

// ─── Executive data ───────────────────────────────────────────────────────────

const EXECUTIVES = [
  {
    role:             "CEO",
    title:            "Генеральный директор",
    description:      "Координирует всю команду руководителей, синтезирует идеи в единое видение и формирует итоговую стратегию с ключевыми решениями.",
    responsibilities: ["Стратегия", "Видение", "Координация", "Решения"],
    color:            "#8b5cf6",
    rgb:              "139,92,246",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    role:             "CFO",
    title:            "Финансовый директор",
    description:      "Строит полные финансовые модели, прогнозы выручки, анализ затрат и инвестиционные требования для вашего бизнеса.",
    responsibilities: ["Прогноз выручки", "Бюджет", "Cash Flow", "Инвестиции"],
    color:            "#3b82f6",
    rgb:              "59,130,246",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    role:             "CMO",
    title:            "Директор по маркетингу",
    description:      "Разрабатывает позиционирование бренда, стратегию выхода на рынок, воронки привлечения клиентов и контент-план.",
    responsibilities: ["Стратегия бренда", "Привлечение", "Контент", "Соцсети"],
    color:            "#10b981",
    rgb:              "16,185,129",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    role:             "Аналитик",
    title:            "Рыночная разведка",
    description:      "Глубокий анализ рынка, конкурентов, сегментов клиентов, трендов отрасли и картирование бизнес-возможностей.",
    responsibilities: ["Анализ рынка", "SWOT", "Конкуренты", "Персоны"],
    color:            "#f59e0b",
    rgb:              "245,158,11",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    role:             "COO",
    title:            "Операционный директор",
    description:      "Создаёт операционный план запуска, дизайн процессов, структуру команды и временну́ю шкалу 30/90 дней.",
    responsibilities: ["Дорожная карта", "Операции", "Найм", "Процессы"],
    color:            "#f43f5e",
    rgb:              "244,63,94",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
  },
  {
    role:             "Продажи",
    title:            "Выручка и рост",
    description:      "Проектирует воронки продаж, модели ценообразования, стратегии лидогенерации и фреймворки удержания клиентов.",
    responsibilities: ["Воронка продаж", "Цены", "Лиды", "Удержание"],
    color:            "#6366f1",
    rgb:              "99,102,241",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
  {
    role:             "Юрист",
    title:            "Соответствие и структура",
    description:      "Рекомендует структуру бизнеса, учитывает требования соответствия, защиту ИС и идентифицирует риски. (Не юридическая консультация.)",
    responsibilities: ["Структура", "ИС-стратегия", "Риски", "Соответствие"],
    color:            "#94a3b8",
    rgb:              "148,163,184",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    role:             "CTO",
    title:            "Технический директор",
    description:      "Рекомендует оптимальный стек технологий, дизайн инфраструктуры, возможности автоматизации и технический роадмап.",
    responsibilities: ["Стек", "Инфраструктура", "Автоматизация", "Роадмап"],
    color:            "#d946ef",
    rgb:              "217,70,239",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
];

// ─── Icon tile ────────────────────────────────────────────────────────────────

function ExecIcon({ color, rgb, icon }: { color: string; rgb: string; icon: React.ReactNode }) {
  return (
    <div style={{
      width: 52, height: 52, borderRadius: 16, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: `rgba(${rgb},0.1)`,
      border: `1px solid rgba(${rgb},0.28)`,
      boxShadow: `0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)`,
      color: color,
    }}>
      {icon}
    </div>
  );
}

// ─── Executive card ───────────────────────────────────────────────────────────

const cardVar: Variants = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0 },
};

function ExecCard({ exec, index }: { exec: typeof EXECUTIVES[number]; index: number }) {
  const delay = (index % 4) * 0.08 + Math.floor(index / 4) * 0.16;

  return (
    <motion.div
      variants={cardVar}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.22 } }}
      style={{
        position:      "relative",
        borderRadius:  20,
        padding:       "20px 18px 22px",
        overflow:      "hidden",
        cursor:        "default",
        height:        "100%",
        display:       "flex",
        flexDirection: "column",
        gap:           14,
        background:    "rgba(255,255,255,0.025)",
        border:        `1px solid rgba(${exec.rgb},0.16)`,
        boxShadow:     "0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      {/* Subtle top bevel in exec color */}
      <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: `linear-gradient(90deg, transparent, rgba(${exec.rgb},0.4), transparent)` }} />

      <ExecIcon color={exec.color} rgb={exec.rgb} icon={exec.icon} />

      {/* Role + title */}
      <div style={{ flex: 0 }}>
        <span style={{
          display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em",
          textTransform: "uppercase", color: exec.color, marginBottom: 4,
        }}>
          {exec.role}
        </span>
        <span style={{
          display: "block", fontSize: 14, fontWeight: 600,
          color: "rgba(255,255,255,0.9)", lineHeight: 1.3, letterSpacing: "-0.01em",
        }}>
          {exec.title}
        </span>
      </div>

      {/* Description */}
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", lineHeight: 1.65, margin: 0, flex: 1 }}>
        {exec.description}
      </p>

      {/* Skill tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {exec.responsibilities.map((r) => (
          <span key={r} style={{
            fontSize: 10, padding: "3px 8px", borderRadius: 999,
            border:     `1px solid rgba(${exec.rgb},0.18)`,
            background: `rgba(${exec.rgb},0.06)`,
            color:      `rgba(${exec.rgb},0.78)`,
          }}>
            {r}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function ExecutivesSection() {
  return (
    <section id="executives" style={{ position: "relative", padding: "96px 24px 112px", overflow: "hidden" }}>

      {/* Single subtle background tint */}
      <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(139,92,246,0.04) 0%, transparent 65%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* Header */}
        <motion.div
          style={{ textAlign: "center", marginBottom: 56 }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 18px", borderRadius: 999, marginBottom: 24,
            border: "1px solid rgba(139,92,246,0.28)",
            background: "rgba(139,92,246,0.07)",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#8b5cf6", display: "block" }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(196,181,253,0.9)" }}>
              AI Команда
            </span>
          </div>

          <h2 style={{ fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, margin: "0 0 14px", color: "#fff" }}>
            Познакомьтесь с вашей командой
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.35)", maxWidth: 540, margin: "0 auto", lineHeight: 1.65 }}>
            Восемь специализированных AI-руководителей, каждый — эксперт в своей области, вместе создают полную бизнес-стратегию.
          </p>
        </motion.div>

        {/* 4×2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 12 }}>
          {EXECUTIVES.map((exec, i) => (
            <ExecCard key={exec.role} exec={exec} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
}
