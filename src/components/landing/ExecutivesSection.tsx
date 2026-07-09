"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import type { Variants } from "framer-motion";

// ─── Icons ────────────────────────────────────────────────────────────────────
const I = {
  star:   <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
  dollar: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
  mega:   <><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></>,
  search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></>,
  gear:   <><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></>,
  trend:  <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
  code:   <><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>,
  lock:   <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
  box:    <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></>,
  users:  <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></>,
  db:     <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></>,
  cpu:    <><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></>,
  rocket: <><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91 0z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></>,
  handshake: <><path d="M11 17l2 2a1 1 0 1 0 3-3"/><path d="M14 14l2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/></>,
  cube:   <><path d="M12 2l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 17l9 5 9-5"/></>,
  target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  brain:  <><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z"/></>,
  chart:  <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
  compass:<><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></>,
};

function Icon({ paths }: { paths: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      {paths}
    </svg>
  );
}

// ─── 20 Agents ────────────────────────────────────────────────────────────────
const EXECUTIVES = [
  { role:"CEO",   title:"Генеральный директор",  color:"#8b5cf6", rgb:"139,92,246",  icon:I.star,      tags:["Стратегия","Видение","Решения"],       desc:"Координирует команду и формирует итоговую стратегию." },
  { role:"CFO",   title:"Финансовый директор",   color:"#3b82f6", rgb:"59,130,246",  icon:I.dollar,    tags:["Выручка","Бюджет","Инвестиции"],        desc:"Финансовые модели, прогнозы и unit-экономика." },
  { role:"CMO",   title:"Директор по маркетингу",color:"#10b981", rgb:"16,185,129",  icon:I.mega,      tags:["Бренд","Привлечение","Контент"],        desc:"Позиционирование, GTM-стратегия и воронки." },
  { role:"Аналитик", title:"Рыночная разведка",  color:"#f59e0b", rgb:"245,158,11",  icon:I.search,    tags:["Рынок","SWOT","Конкуренты"],            desc:"Анализ рынка, конкурентов и сегментов." },
  { role:"COO",   title:"Операционный директор", color:"#f43f5e", rgb:"244,63,94",   icon:I.gear,      tags:["Роадмап","Процессы","Найм"],            desc:"Операционный план запуска и структура команды." },
  { role:"Продажи",  title:"Выручка и рост",     color:"#6366f1", rgb:"99,102,241",  icon:I.trend,     tags:["Воронка","Цены","Удержание"],           desc:"Воронки продаж, ценообразование и retention." },
  { role:"Юрист", title:"Соответствие и структура", color:"#94a3b8", rgb:"148,163,184", icon:I.shield, tags:["Структура","ИС","Риски"],              desc:"Структура бизнеса, IP и регуляторика." },
  { role:"CTO",   title:"Технический директор",  color:"#d946ef", rgb:"217,70,239",  icon:I.code,      tags:["Стек","Инфраструктура","Роадмап"],      desc:"Технологический стек и архитектура систем." },
  { role:"CISO",  title:"Директор по безопасности", color:"#ef4444", rgb:"239,68,68", icon:I.lock,    tags:["Защита","Риски","Compliance"],          desc:"Кибербезопасность и защита данных." },
  { role:"CPO",   title:"Директор по продукту",  color:"#a78bfa", rgb:"167,139,250", icon:I.box,       tags:["Product","UX","Roadmap"],               desc:"Продуктовая стратегия и приоритизация." },
  { role:"CHRO",  title:"Директор по персоналу", color:"#f472b6", rgb:"244,114,182", icon:I.users,     tags:["Талант","Культура","Найм"],             desc:"HR-система, культура и удержание талантов." },
  { role:"CDO",   title:"Директор по данным",    color:"#06b6d4", rgb:"6,182,212",   icon:I.db,        tags:["Data","Analytics","MLOps"],             desc:"Стратегия данных и модели машинного обучения." },
  { role:"VP Eng",title:"Вице-президент инженерии", color:"#84cc16", rgb:"132,204,22", icon:I.cpu,     tags:["Agile","Платформы","CI/CD"],            desc:"Инженерные команды и техническая культура." },
  { role:"Growth",title:"Специалист по росту",   color:"#fb923c", rgb:"251,146,60",  icon:I.rocket,    tags:["Viral","A/B","Retention"],              desc:"Точки роста и вирусные механики." },
  { role:"IR",    title:"Связи с инвесторами",   color:"#a855f7", rgb:"168,85,247",  icon:I.handshake, tags:["Инвесторы","Due Dil.","Питч"],          desc:"Подготовка к раундам и работа с инвесторами." },
  { role:"Бренд", title:"Бренд-менеджер",        color:"#e879f9", rgb:"232,121,249", icon:I.cube,      tags:["Айдентика","Tone","Storytelling"],      desc:"Позиционирование бренда и визуальный язык." },
  { role:"CS",    title:"Customer Success",      color:"#4ade80", rgb:"74,222,128",  icon:I.target,    tags:["Onboarding","NPS","Retention"],         desc:"Успех клиентов и снижение оттока." },
  { role:"Data",  title:"Дата-саентист",         color:"#22d3ee", rgb:"34,211,238",  icon:I.brain,     tags:["ML","Сегментация","LTV"],               desc:"Прогнозные модели и персонализация." },
  { role:"Инвест",title:"Инвестиционный аналитик",color:"#fde68a", rgb:"253,230,138", icon:I.chart,    tags:["ROI","Мультипликаторы","M&A"],          desc:"Оценка привлекательности и сравнимых сделок." },
  { role:"Стратег",title:"Стратегический консультант", color:"#c4b5fd", rgb:"196,181,253", icon:I.compass, tags:["Moat","Blue Ocean","Horizon"],      desc:"Долгосрочное позиционирование и конкурентный ров." },
];

// ─── Animated count-up ────────────────────────────────────────────────────────
function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0; let t0: number | null = null;
    const step = (ts: number) => {
      if (t0 === null) t0 = ts;
      const p = Math.min((ts - t0) / 1200, 1);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return <span ref={ref}>{n}{suffix}</span>;
}

// ─── Card ─────────────────────────────────────────────────────────────────────
const cardVar: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  show:   { opacity: 1, y: 0, scale: 1 },
};

function ExecCard({ exec, index }: { exec: typeof EXECUTIVES[number]; index: number }) {
  const [hover, setHover] = useState(false);
  const col = index % 4;
  const row = Math.floor(index / 4);
  const delay = col * 0.06 + row * 0.08;

  return (
    <motion.a
      href={`/chat?agent=${encodeURIComponent(exec.role)}`}
      variants={cardVar}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      style={{
        textDecoration: "none",
        position: "relative", borderRadius: 18, padding: "18px 16px 18px",
        overflow: "hidden", height: "100%", display: "flex", flexDirection: "column", gap: 12,
        background: hover
          ? `linear-gradient(160deg, rgba(${exec.rgb},0.14), rgba(255,255,255,0.02))`
          : `linear-gradient(160deg, rgba(${exec.rgb},0.06), rgba(255,255,255,0.02))`,
        border: `1px solid rgba(${exec.rgb},${hover ? 0.5 : 0.24})`,
        boxShadow: hover
          ? `0 16px 44px rgba(${exec.rgb},0.28), 0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)`
          : `0 4px 20px rgba(0,0,0,0.32), 0 0 0 1px rgba(${exec.rgb},0.04), inset 0 1px 0 rgba(255,255,255,0.05)`,
        transition: "background 0.25s, border-color 0.25s, box-shadow 0.25s",
      }}
    >
      {/* Top bevel */}
      <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: `linear-gradient(90deg, transparent, rgba(${exec.rgb},${hover ? 0.7 : 0.4}), transparent)`, transition: "background 0.25s" }} />

      {/* Hover sheen sweep */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(120px 80px at 20% 0%, rgba(${exec.rgb},0.14), transparent 70%)`,
        opacity: hover ? 1 : 0, transition: "opacity 0.3s",
      }} />

      {/* Icon + online dot */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        {/* Icon with always-spinning conic ring */}
        <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
          {/* rotating conic gradient ring */}
          <div aria-hidden style={{
            position: "absolute", inset: -2, borderRadius: 16,
            background: `conic-gradient(from 0deg, transparent 0deg, rgba(${exec.rgb},0.9) 90deg, transparent 200deg, rgba(${exec.rgb},0.5) 300deg, transparent 360deg)`,
            animation: `exec-spin ${hover ? 2.2 : 5}s linear infinite`,
            opacity: hover ? 1 : 0.75,
            transition: "opacity 0.25s",
            WebkitMask: "radial-gradient(circle, transparent 58%, #000 60%)",
            mask: "radial-gradient(circle, transparent 58%, #000 60%)",
          }} />
          <motion.div
            animate={hover ? { scale: 1.1 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            style={{
              position: "absolute", inset: 2, borderRadius: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: `linear-gradient(135deg, rgba(${exec.rgb},${hover ? 0.42 : 0.28}), rgba(${exec.rgb},0.12))`,
              border: `1px solid rgba(${exec.rgb},${hover ? 0.6 : 0.4})`,
              boxShadow: hover
                ? `0 6px 22px rgba(${exec.rgb},0.5), inset 0 1px 0 rgba(255,255,255,0.2)`
                : `0 3px 14px rgba(${exec.rgb},0.28), inset 0 1px 0 rgba(255,255,255,0.12)`,
              color: "#fff",
              transition: "background 0.25s, border-color 0.25s, box-shadow 0.25s",
            }}
          >
            <div style={{ filter: `drop-shadow(0 0 6px rgba(${exec.rgb},0.9))`, color: exec.color }}>
              <Icon paths={exec.icon} />
            </div>
          </motion.div>
        </div>
        <span style={{
          width: 7, height: 7, borderRadius: "50%", background: "#10b981",
          boxShadow: "0 0 8px rgba(16,185,129,0.8)", marginTop: 4,
          animation: "exec-pulse 2.2s ease-in-out infinite",
        }} />
      </div>

      {/* Role + title */}
      <div>
        <span style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: exec.color, marginBottom: 4 }}>
          {exec.role}
        </span>
        <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "rgba(255,255,255,0.9)", lineHeight: 1.25, letterSpacing: "-0.01em" }}>
          {exec.title}
        </span>
      </div>

      {/* Description */}
      <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, margin: 0, flex: 1 }}>
        {exec.desc}
      </p>

      {/* Tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {exec.tags.map((t) => (
          <span key={t} style={{
            fontSize: 9.5, padding: "2.5px 7px", borderRadius: 999,
            border: `1px solid rgba(${exec.rgb},0.18)`,
            background: `rgba(${exec.rgb},0.06)`,
            color: `rgba(${exec.rgb},0.82)`,
          }}>{t}</span>
        ))}
      </div>

      {/* Chat hint on hover */}
      <div style={{
        display: "flex", alignItems: "center", gap: 5,
        fontSize: 10.5, fontWeight: 600, color: exec.color,
        opacity: hover ? 1 : 0, maxHeight: hover ? 20 : 0,
        transition: "opacity 0.22s, max-height 0.22s",
      }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Обсудить в чате →
      </div>
    </motion.a>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────
export function ExecutivesSection() {
  return (
    <section id="executives" style={{ position: "relative", padding: "96px 24px 112px", overflow: "hidden" }}>
      <style>{`
        @keyframes exec-pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes exec-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(139,92,246,0.05) 0%, transparent 65%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative" }}>

        {/* Header */}
        <motion.div
          style={{ textAlign: "center", marginBottom: 48 }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        >
          <div className="term-mono" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 14px", borderRadius: 8, marginBottom: 24,
            border: "1px solid rgba(99,102,241,0.25)", background: "rgba(99,102,241,0.05)",
          }}>
            <span className="term-blink" style={{ width: 5, height: 5, borderRadius: "50%", background: "#6366f1" }} />
            <span style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(165,180,252,0.9)" }}>
              // ai команда · 20 агентов
            </span>
          </div>

          <h2 style={{ fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, margin: "0 0 14px", color: "#fff" }}>
            Познакомьтесь с вашей командой
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.35)", maxWidth: 560, margin: "0 auto 28px", lineHeight: 1.65 }}>
            <CountUp to={20} /> специализированных AI-руководителей, каждый — эксперт в своей области. Вместе они создают полную бизнес-стратегию.
          </p>

          {/* Live stats */}
          <div style={{ display: "inline-flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
            {[
              { v: <><CountUp to={20} /></>, l: "агентов" },
              { v: <><CountUp to={4} />/5</>, l: "ср. оценка" },
              { v: <>&lt;5 мин</>, l: "полный анализ" },
            ].map((s, i) => (
              <div key={i} style={{
                display: "inline-flex", alignItems: "baseline", gap: 6,
                padding: "7px 14px", borderRadius: 999,
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#a5b4fc", fontVariantNumeric: "tabular-nums" }}>{s.v}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{s.l}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 4-col grid, staggered reveal */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          style={{ gap: 12 }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          {EXECUTIVES.map((exec, i) => (
            <ExecCard key={exec.role} exec={exec} index={i} />
          ))}
        </motion.div>

        {/* Action row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            marginTop: 20, padding: "22px 24px", borderRadius: 20,
            background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(255,255,255,0.02))",
            border: "1px solid rgba(99,102,241,0.22)",
            display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16,
          }}
        >
          <div style={{ minWidth: 220, flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 4, letterSpacing: "-0.01em" }}>
              Обсудите свою идею с командой
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
              Задайте вопрос AI-ассистенту или запустите полный анализ проекта — совет из 20 экспертов ответит за минуты.
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link href="/chat" style={{
              display: "inline-flex", alignItems: "center", gap: 8, height: 46, padding: "0 22px", borderRadius: 13,
              background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", fontSize: 13.5, fontWeight: 700,
              textDecoration: "none", boxShadow: "0 6px 20px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.16)",
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Открыть AI-чат
            </Link>
            <Link href="/register" style={{
              display: "inline-flex", alignItems: "center", gap: 8, height: 46, padding: "0 20px", borderRadius: 13,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.7)", fontSize: 13.5, fontWeight: 600, textDecoration: "none",
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Запустить анализ
            </Link>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
