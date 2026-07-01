"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── FAQ data ─────────────────────────────────────────────────────────────────

const FAQ = [
  {
    q: "Это реальный AI или просто шаблонные ответы?",
    a: "Это реальные AI-агенты на базе передовых языковых моделей. Каждый из 8 экспертов анализирует именно ваш бизнес, а не подставляет вас в шаблон. CEO синтезирует результаты всей команды в единый отчёт.",
  },
  {
    q: "Насколько это лучше обычного ChatGPT?",
    a: "Принципиально. Вместо одного ответа вы получаете 8 параллельных специализированных анализов. CFO считает финансовую модель, CMO строит go-to-market, Legal Advisor проверяет риски — всё одновременно и без ваших дополнительных запросов.",
  },
  {
    q: "Могу ли я доверять финансовым и юридическим рекомендациям?",
    a: "Отчёты дают вам стратегическую базу и ориентиры, но не заменяют профессиональных консультантов. Legal Advisor не является юридической консультацией. Для критических решений рекомендуем верифицировать данные у профессионалов.",
  },
  {
    q: "Сколько времени занимает генерация отчёта?",
    a: "Обычно 2–5 минут. Все 20 агентов работают параллельно, CEO объединяет результаты — и вы получаете полный структурированный отчёт.",
  },
  {
    q: "Что входит в бесплатный тариф?",
    a: "3 полных анализа в месяц, все 8 AI-экспертов, финансовые прогнозы, анализ рисков, рыночный анализ и резюме стратегии. Без кредитной карты.",
  },
  {
    q: "Можно ли экспортировать отчёты?",
    a: "Да, на Pro и Business тарифах доступен экспорт в PDF и Google Docs. На Free — только просмотр онлайн.",
  },
  {
    q: "Мои данные в безопасности?",
    a: "Данные вашего бизнеса используются только для генерации вашего отчёта и не передаются третьим лицам. Все данные шифруются при передаче и хранении.",
  },
  {
    q: "Есть ли скидки для стартапов и студентов?",
    a: "Да. Для верифицированных стартапов из акселераторов — скидка 50%. Для студентов — бесплатный Pro-доступ на 3 месяца. Напишите нам на support@apexai.com.",
  },
];

// Alternate accent colors per item for visual richness
const ACCENT_COLORS = [
  { color: "#8b5cf6", rgb: "139,92,246" },  // violet
  { color: "#06b6d4", rgb: "6,182,212"   },  // cyan
  { color: "#8b5cf6", rgb: "139,92,246" },
  { color: "#6366f1", rgb: "99,102,241"  },  // indigo
  { color: "#8b5cf6", rgb: "139,92,246" },
  { color: "#06b6d4", rgb: "6,182,212"   },
  { color: "#8b5cf6", rgb: "139,92,246" },
  { color: "#06b6d4", rgb: "6,182,212"   },
];

// ─── Single accordion item ────────────────────────────────────────────────────

function FaqItem({
  item,
  index,
  isOpen,
  onToggle,
}: {
  item:     { q: string; a: string };
  index:    number;
  isOpen:   boolean;
  onToggle: () => void;
}) {
  const { color, rgb } = ACCENT_COLORS[index % ACCENT_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position:  "relative",
        borderRadius: 18,
        overflow:  "hidden",
        // glass base
        background:     isOpen
          ? `linear-gradient(135deg, rgba(${rgb},0.08) 0%, rgba(8,8,14,0.88) 100%)`
          : "rgba(255,255,255,0.025)",
        border:         `1px solid ${isOpen ? `rgba(${rgb},0.3)` : "rgba(255,255,255,0.07)"}`,
        boxShadow:      isOpen
          ? [
              `0 0 0 1px rgba(${rgb},0.08)`,
              `0 0 40px rgba(${rgb},0.08)`,
              `0 8px 32px rgba(0,0,0,0.45)`,
              `inset 0 1px 0 rgba(255,255,255,0.07)`,
            ].join(", ")
          : "0 2px 12px rgba(0,0,0,0.3)",
        backdropFilter: "blur(20px) saturate(160%)",
        transition:     "background 0.35s, border-color 0.35s, box-shadow 0.35s",
      }}
    >
      {/* Left neon accent bar — only visible when open */}
      <div
        style={{
          position:   "absolute",
          left:       0,
          top:        "12%",
          bottom:     "12%",
          width:      3,
          borderRadius: 4,
          background: `linear-gradient(180deg, ${color}, rgba(${rgb},0.3))`,
          boxShadow:  `0 0 12px rgba(${rgb},0.6)`,
          opacity:    isOpen ? 1 : 0,
          transition: "opacity 0.3s",
        }}
      />

      {/* Top shimmer bevel */}
      {isOpen && (
        <div
          style={{
            position:   "absolute",
            top:        0,
            left:       "6%",
            right:      "6%",
            height:     1,
            background: `linear-gradient(90deg, transparent, rgba(${rgb},0.55), transparent)`,
          }}
        />
      )}

      {/* Trigger button */}
      <button
        onClick={onToggle}
        style={{
          width:          "100%",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          gap:            16,
          padding:        "18px 20px 18px 24px",
          background:     "none",
          border:         "none",
          cursor:         "pointer",
          textAlign:      "left",
        }}
      >
        <span
          style={{
            fontSize:      15,
            fontWeight:    isOpen ? 600 : 500,
            color:         isOpen ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.6)",
            lineHeight:    1.45,
            letterSpacing: "-0.005em",
            transition:    "color 0.25s, font-weight 0s",
          }}
        >
          {item.q}
        </span>

        {/* Icon circle */}
        <div
          style={{
            flexShrink:     0,
            width:          30,
            height:         30,
            borderRadius:   "50%",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            background:     isOpen ? `rgba(${rgb},0.12)` : "rgba(255,255,255,0.04)",
            border:         `1px solid ${isOpen ? `rgba(${rgb},0.35)` : "rgba(255,255,255,0.08)"}`,
            boxShadow:      isOpen ? `0 0 12px rgba(${rgb},0.25)` : "none",
            transition:     "background 0.3s, border-color 0.3s, box-shadow 0.3s",
          }}
        >
          <motion.svg
            viewBox="0 0 24 24"
            fill="none"
            stroke={isOpen ? color : "rgba(255,255,255,0.35)"}
            strokeWidth="2"
            width="13"
            height="13"
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: isOpen ? `drop-shadow(0 0 4px rgba(${rgb},0.8))` : "none" }}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5"  y1="12" x2="19" y2="12" />
          </motion.svg>
        </div>
      </button>

      {/* Answer panel */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 24px 20px 24px" }}>
              {/* Thin divider */}
              <div style={{
                height:     1,
                background: `linear-gradient(90deg, rgba(${rgb},0.25), rgba(255,255,255,0.06), transparent)`,
                marginBottom: 14,
              }} />
              <p style={{
                fontSize:   14,
                color:      "rgba(255,255,255,0.48)",
                lineHeight: 1.72,
                margin:     0,
              }}>
                {item.a}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      style={{ position: "relative", padding: "96px 24px 112px", overflow: "hidden" }}
    >
      <style>{`
        @keyframes faq-badge-glow {
          0%, 100% { box-shadow: 0 0 0 0   rgba(139,92,246,0.25); }
          50%       { box-shadow: 0 0 0 5px rgba(139,92,246,0);    }
        }
        @keyframes faq-mesh-drift {
          0%,100% { transform: translate(-50%,-50%) scale(1);     }
          50%      { transform: translate(-50%,-50%) scale(1.08);  }
        }
      `}</style>

      {/* Mesh radial center glow */}
      <div
        aria-hidden
        style={{
          position:  "absolute",
          top:       "40%",
          left:      "50%",
          transform: "translate(-50%,-50%)",
          width:     700,
          height:    700,
          background: "radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, rgba(6,182,212,0.04) 40%, transparent 70%)",
          filter:    "blur(60px)",
          animation: "faq-mesh-drift 12s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 780, margin: "0 auto" }}>

        {/* ── Header ── */}
        <motion.div
          style={{ textAlign: "center", marginBottom: 56 }}
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.75, ease: "easeOut" }}
        >
          {/* Badge */}
          <div
            style={{
              display:       "inline-flex",
              alignItems:    "center",
              gap:           9,
              padding:       "7px 20px",
              borderRadius:  999,
              border:        "1px solid rgba(139,92,246,0.38)",
              background:    "rgba(139,92,246,0.07)",
              marginBottom:  28,
              animation:     "faq-badge-glow 3.5s ease-in-out infinite",
            }}
          >
            <span style={{
              display: "block", width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
              background: "#8b5cf6", boxShadow: "0 0 8px #8b5cf6",
            }} />
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.22em",
              textTransform: "uppercase", color: "#c4b5fd",
            }}>
              FAQ
            </span>
          </div>

          {/* Heading */}
          <h2
            style={{
              fontSize:      "clamp(28px, 4.5vw, 50px)",
              fontWeight:    800,
              letterSpacing: "-0.025em",
              lineHeight:    1.08,
              margin:        "0 0 16px",
              background:    "linear-gradient(180deg, #ffffff 35%, rgba(255,255,255,0.65) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor:  "transparent",
              backgroundClip:       "text",
            }}
          >
            Часто задаваемые вопросы
          </h2>

          <p style={{
            fontSize:   16,
            color:      "rgba(255,255,255,0.35)",
            margin:     0,
            lineHeight: 1.6,
          }}>
            Всё, что нужно знать перед началом работы.
          </p>
        </motion.div>

        {/* ── Accordion ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {FAQ.map((item, i) => (
            <FaqItem
              key={i}
              item={item}
              index={i}
              isOpen={open === i}
              onToggle={() => setOpen(open === i ? null : i)}
            />
          ))}
        </div>

        {/* ── Footer CTA ── */}
        <motion.div
          style={{ textAlign: "center", marginTop: 48 }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.28)", marginBottom: 12 }}>
            Не нашли ответа?
          </p>
          <a
            href="mailto:support@apexai.com"
            style={{
              display:        "inline-flex",
              alignItems:     "center",
              gap:            7,
              fontSize:       14,
              fontWeight:     500,
              color:          "#a78bfa",
              textDecoration: "none",
              padding:        "9px 18px",
              borderRadius:   999,
              border:         "1px solid rgba(139,92,246,0.22)",
              background:     "rgba(139,92,246,0.06)",
              backdropFilter: "blur(12px)",
              transition:     "color 0.2s, background 0.2s, border-color 0.2s",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget;
              el.style.color       = "#c4b5fd";
              el.style.background  = "rgba(139,92,246,0.12)";
              el.style.borderColor = "rgba(139,92,246,0.4)";
            }}
            onMouseLeave={e => {
              const el = e.currentTarget;
              el.style.color       = "#a78bfa";
              el.style.background  = "rgba(139,92,246,0.06)";
              el.style.borderColor = "rgba(139,92,246,0.22)";
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            support@apexai.com
          </a>
        </motion.div>

      </div>
    </section>
  );
}
