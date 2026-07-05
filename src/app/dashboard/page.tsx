"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, TrendingUp, Target, Shield, ChevronRight, ArrowUpRight,
  Brain, DollarSign, Cpu, Globe, Lightbulb, Activity, Users,
  BarChart2, FileText, Rocket, Star, AlertTriangle,
  CheckCircle, MessageSquare, Play, Clock, Flame,
} from "lucide-react";

// ─── Design tokens ───────────────────────────────────────────────────────────
const ACCENT     = "#6366f1";
const ACCENT_RGB = "99,102,241";
const SUCCESS    = "#10b981";
const WARNING    = "#f59e0b";
const DANGER     = "#ef4444";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Project {
  id: string; name: string; description: string | null;
  overall_score: number; status: string; created_at: string;
  target_revenue: string | null; ai_results: unknown[];
}

// ─── Static demo data ────────────────────────────────────────────────────────
const DEMO_PROJECTS: Project[] = [
  { id: "demo", name: "AI-Powered Fitness App", description: "Мобильное приложение с AI-персонализацией тренировок", overall_score: 87, status: "active", created_at: new Date(Date.now() - 7200000).toISOString(), target_revenue: "$2.4M", ai_results: [1,2,3] },
  { id: "2",    name: "SaaS Invoice Platform",  description: "Автоматизированное выставление счетов для фрилансеров",  overall_score: 91, status: "active", created_at: new Date(Date.now() - 86400000).toISOString(), target_revenue: "$1.8M", ai_results: [1,2,3] },
];

const EXECUTIVES = [
  { role: "CEO", name: "Sophia Rivers", title: "Chief Strategy AI", specialty: "Стратегия & Видение",    color: "#6366f1", rgb: "99,102,241",  confidence: 94, tasks: 12, icon: Brain,      slug: "ceo", focus: "Анализ рынка фитнес-SaaS" },
  { role: "CFO", name: "Marcus Chen",   title: "Finance AI",        specialty: "Финансы & Модели",       color: "#3b82f6", rgb: "59,130,246",  confidence: 89, tasks: 8,  icon: DollarSign, slug: "cfo", focus: "Финансовая модель Q3" },
  { role: "CMO", name: "Elena Torres",  title: "Growth AI",         specialty: "Маркетинг & Рост",       color: "#10b981", rgb: "16,185,129",  confidence: 91, tasks: 15, icon: TrendingUp, slug: "cmo", focus: "Стратегия выхода EU" },
  { role: "COO", name: "James Wright",  title: "Operations AI",     specialty: "Операции & Процессы",    color: "#f59e0b", rgb: "245,158,11",  confidence: 86, tasks: 10, icon: Activity,   slug: "coo", focus: "Оптимизация воронки" },
  { role: "CTO", name: "Park Aiden",    title: "Technology AI",     specialty: "Технологии & Архитект.", color: "#8b5cf6", rgb: "139,92,246",  confidence: 92, tasks: 9,  icon: Cpu,        slug: "cto", focus: "Технический due diligence" },
];

const AI_INSIGHTS = [
  { type: "opportunity", icon: TrendingUp,    color: SUCCESS, title: "Новый рыночный сегмент", desc: "Корпоративный B2B рынок показывает 340% рост спроса. Потенциал: $4.2M ARR.", prob: 84, impact: "Высокий", growth: "+$4.2M" },
  { type: "threat",      icon: AlertTriangle, color: DANGER,  title: "Конкурент привлёк $15M", desc: "FitAI Labs закрыла раунд Series A. Агрессивная экспансия в вашу аудиторию.", prob: 67, impact: "Средний",  growth: "–12%" },
  { type: "action",      icon: Lightbulb,     color: WARNING, title: "Повысьте цену на 23%",   desc: "Рынок недооценивает продукт. Увеличение до $49/мес не снизит конверсию.", prob: 78, impact: "Высокий", growth: "+$680K" },
  { type: "opportunity", icon: Globe,         color: SUCCESS, title: "Выход на рынок EU",       desc: "GDPR-совместимая инфраструктура готова. Германия и Нидерланды — первые рынки.", prob: 71, impact: "Высокий", growth: "+$1.8M" },
];

const ACTIVITY = [
  { icon: CheckCircle, color: SUCCESS, label: "Стратегический анализ завершён",  sub: "Fitness App · 94 балла",       time: "2м" },
  { icon: Globe,       color: ACCENT,  label: "Обнаружен новый конкурент",        sub: "FitAI Labs · $15M funding",    time: "18м" },
  { icon: DollarSign,  color: ACCENT,  label: "Финансовая модель обновлена",      sub: "Q2 прогноз пересмотрен вверх", time: "1ч" },
  { icon: FileText,    color: ACCENT,  label: "Investor Report сформирован",      sub: "PDF · 48 страниц",             time: "3ч" },
  { icon: Brain,       color: ACCENT,  label: "Симуляция рынка завершена",        sub: "Точность 91% · 10K сценариев", time: "5ч" },
];

const MARKET_PULSE = [
  { label: "B2B SaaS",      trend: "+18%",  pos: true },
  { label: "AI Fitness",    trend: "+340%", pos: true },
  { label: "FinTech Tools", trend: "+22%",  pos: true },
  { label: "No-code Tools", trend: "–4%",   pos: false },
];

const PROJECT_SCORES: number[][] = [
  [55, 60, 68, 72, 79, 83, 87],
  [62, 70, 74, 82, 86, 89, 91],
];

const EXEC_SPARKLINES: Record<string, number[]> = {
  CEO: [70, 74, 79, 82, 88, 91, 94],
  CFO: [65, 68, 73, 78, 83, 87, 89],
  CMO: [60, 67, 75, 80, 85, 88, 91],
  COO: [72, 75, 78, 80, 83, 85, 86],
  CTO: [68, 74, 80, 84, 87, 90, 92],
};

// ─── Animated counter ────────────────────────────────────────────────────────
function Counter({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const start = Date.now(), dur = 1400;
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / dur);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [to]);
  return <>{prefix}{val.toLocaleString()}{suffix}</>;
}

// ─── Mini sparkline ──────────────────────────────────────────────────────────
function Spark({ color, data, w = 56, h = 20 }: { color: string; data: number[]; w?: number; h?: number }) {
  const n = data.length;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => ({ x: (i / (n - 1)) * w, y: h - ((v - min) / (max - min + 0.001)) * h }));
  const d = pts.map((p, i) => (i === 0 ? `M${p.x.toFixed(1)},${p.y.toFixed(1)}` : `L${p.x.toFixed(1)},${p.y.toFixed(1)}`)).join(" ");
  const area = `${d} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color.replace("#","")})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[n - 1].x} cy={pts[n - 1].y} r="2.5" fill={color} />
    </svg>
  );
}

// ─── Live Intelligence Panel (replaces canvas viz) ───────────────────────────
function LiveIntelPanel() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  const analyses = [
    { exec: EXECUTIVES[0], status: "Анализирует рынок...",    pct: 78 },
    { exec: EXECUTIVES[2], status: "Строит воронку роста...", pct: 55 },
    { exec: EXECUTIVES[1], status: "Обновляет модель...",     pct: 91 },
  ];

  return (
    <div style={{ borderRadius: 20, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", padding: "20px", height: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>AI в работе</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginTop: 2 }}>20 агентов активны</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 20, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: SUCCESS, display: "block", animation: "db-pulse 2s ease-in-out infinite" }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: SUCCESS, letterSpacing: "0.08em" }}>LIVE</span>
        </div>
      </div>

      {/* Active analyses */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {analyses.map(({ exec, status, pct }, i) => {
          const Icon = exec.icon;
          const animated = (pct + tick * 2) % 100;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${exec.rgb},0.12)`, border: `1px solid rgba(${exec.rgb},0.22)`, flexShrink: 0 }}>
                <Icon size={14} style={{ color: exec.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{exec.role} — {status}</span>
                  <span style={{ fontSize: 10, color: exec.color, fontVariantNumeric: "tabular-nums" }}>{animated}%</span>
                </div>
                <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                  <motion.div
                    animate={{ width: `${animated}%` }}
                    transition={{ duration: 2.8, ease: "easeInOut" }}
                    style={{ height: "100%", background: exec.color, borderRadius: 2 }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

      {/* Portfolio summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { label: "Среднее AI Score", value: "89", suffix: "/100", color: SUCCESS },
          { label: "Анализов сегодня", value: "12",  suffix: "+",    color: ACCENT },
          { label: "Активных рисков",  value: "2",   suffix: "",     color: DANGER },
          { label: "Возможностей",     value: "4",   suffix: "",     color: WARNING },
        ].map(m => (
          <div key={m.label} style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: m.color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              <Counter to={parseInt(m.value)} suffix={m.suffix} />
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 3, lineHeight: 1.3 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link href="/dashboard/new" style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        height: 38, borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#fff",
        background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)", textDecoration: "none",
      }}>
        <Play size={11} />Запустить новый анализ
      </Link>
    </div>
  );
}

// ─── Project card ─────────────────────────────────────────────────────────────
function ProjectCard({ p, i }: { p: Project; i: number }) {
  const [hov, setHov] = useState(false);
  const sc = p.overall_score >= 85 ? SUCCESS : p.overall_score >= 75 ? WARNING : DANGER;
  const age = Math.round((Date.now() - new Date(p.created_at).getTime()) / 3600000);
  const ageStr = age < 24 ? `${age}ч назад` : `${Math.round(age / 24)}д назад`;

  return (
    <motion.div
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      animate={{ y: hov ? -6 : 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{
        borderRadius: 16, overflow: "hidden",
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${hov ? `rgba(${ACCENT_RGB},0.28)` : "rgba(255,255,255,0.07)"}`,
        boxShadow: hov ? "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.045)" : "0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.045)",
        transition: "border-color 0.25s, box-shadow 0.25s",
        cursor: "pointer",
      }}
    >
      {/* Cover strip */}
      <div style={{ height: 6, background: sc }} />

      {/* Content */}
      <div style={{ padding: "16px" }}>
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
                <Rocket size={12} style={{ color: "rgba(255,255,255,0.5)" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: SUCCESS, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", padding: "2px 7px", borderRadius: 20 }}>
                  ● Активен
                </span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{ageStr}</span>
              </div>
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 3, lineHeight: 1.3 }}>{p.name}</h3>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", lineHeight: 1.5 }}>{p.description}</p>
          </div>
          {/* Score circle */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: sc, lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>{p.overall_score}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>AI Score</div>
          </div>
        </div>

        {/* Sparkline + ARR row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <Spark color={sc} data={PROJECT_SCORES[i % 2]} w={72} h={24} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: SUCCESS }}>{p.target_revenue ?? "—"}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Target ARR</div>
          </div>
        </div>

        {/* Score bar */}
        <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginBottom: 12, overflow: "hidden" }}>
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${p.overall_score}%` }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            style={{ height: "100%", borderRadius: 2, background: sc }}
          />
        </div>

        {/* Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
          {[
            { l: "Рынок", v: "B2B SaaS" },
            { l: "Стадия", v: "Growth" },
            { l: "AI агенты", v: "20" },
          ].map(m => (
            <div key={m.l} style={{ padding: "6px 8px", borderRadius: 8, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>{m.v}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", marginTop: 1 }}>{m.l}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/dashboard/projects/${p.id}`} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            height: 34, borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#fff",
            background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)", textDecoration: "none",
          }}>
            <ArrowUpRight size={12} />Открыть
          </Link>
          <Link href="/dashboard/reports" style={{
            display: "flex", alignItems: "center", gap: 5, padding: "0 12px",
            height: 34, borderRadius: 10, fontSize: 11, fontWeight: 600,
            color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)", textDecoration: "none",
          }}>
            <FileText size={11} />Отчёт
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Executive card ───────────────────────────────────────────────────────────
function ExecCard({ exec, delay }: { exec: typeof EXECUTIVES[number]; delay: number }) {
  const [hov, setHov] = useState(false);
  const Icon = exec.icon;

  return (
    <Link href={`/dashboard/chat?agent=${exec.slug}`} style={{ textDecoration: "none", display: "block" }}>
      <motion.div
        onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
        whileHover={{ y: -6 }}
        style={{
          borderRadius: 16, padding: "16px",
          background: `rgba(${exec.rgb},0.06)`,
          border: `1px solid ${hov ? `rgba(${exec.rgb},0.32)` : `rgba(${exec.rgb},0.16)`}`,
          boxShadow: "0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)",
          transition: "border-color 0.25s",
          cursor: "pointer", position: "relative",
        }}
      >
        {/* Role header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${exec.rgb},0.18)`, border: `1px solid rgba(${exec.rgb},0.28)` }}>
              <Icon size={14} style={{ color: exec.color }} />
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: exec.color }}>{exec.role}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>{exec.title}</div>
            </div>
          </div>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: SUCCESS, display: "block", animation: "db-pulse 2.2s ease-in-out infinite" }} />
        </div>

        {/* Name */}
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 1 }}>{exec.name}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 10 }}>{exec.specialty}</div>

        {/* Focus line */}
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "5px 8px", marginBottom: 12, lineHeight: 1.4 }}>
          <span style={{ color: exec.color, fontWeight: 600 }}>● </span>{exec.focus}
        </div>

        {/* Confidence + sparkline */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: exec.color, lineHeight: 1 }}>{exec.confidence}%</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>Уверенность</div>
          </div>
          <Spark color={exec.color} data={EXEC_SPARKLINES[exec.role]} />
        </div>

        {/* Progress bar */}
        <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 10 }}>
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${exec.confidence}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: delay + 0.2 }}
            style={{ height: "100%", borderRadius: 2, background: exec.color }}
          />
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>{exec.tasks} задач</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: exec.color }}>
            Спросить <MessageSquare size={9} />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyProjects() {
  return (
    <div style={{ borderRadius: 16, padding: "48px 24px", textAlign: "center", background: "rgba(255,255,255,0.025)", border: "1px dashed rgba(255,255,255,0.1)" }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${ACCENT_RGB},0.1)`, border: `1px solid rgba(${ACCENT_RGB},0.22)` }}>
        <Rocket size={22} color={ACCENT} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Создайте первый проект</div>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.42)", lineHeight: 1.6, maxWidth: 360, margin: "0 auto 20px" }}>
        Опишите бизнес-идею — AI-команда директоров проведёт полный анализ рынка, финансов и стратегии.
      </p>
      <Link href="/dashboard/new" style={{
        display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 22px",
        borderRadius: 12, fontSize: 14, fontWeight: 700, color: "#fff",
        background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)", textDecoration: "none",
      }}>
        <Zap size={15} />Начать анализ
      </Link>
    </div>
  );
}

// ─── Dashboard page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDemo,   setIsDemo]   = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<"projects" | "insights">("projects");

  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.json())
      .then(d => {
        if (d.projects?.length) { setProjects(d.projects); setIsDemo(false); }
        else                    { setProjects(DEMO_PROJECTS); setIsDemo(true); }
      })
      .catch(() => { setProjects(DEMO_PROJECTS); setIsDemo(true); })
      .finally(() => setLoading(false));
  }, []);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Доброе утро" : hour < 17 ? "Добрый день" : "Добрый вечер";
  const firstName = session?.user?.name?.split(" ")[0] ?? "Founder";

  return (
    <div style={{ minHeight: "100%", background: "#05060A", paddingBottom: "max(60px, env(safe-area-inset-bottom))" }}>

      <style>{`
        @keyframes db-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.35;transform:scale(0.55)} }
        .db-hero-grid { display:grid; grid-template-columns:1fr 360px; gap:32px; align-items:start; }
        .db-main-grid { display:grid; grid-template-columns:1fr 340px; gap:24px; }
        @media(max-width:1100px) {
          .db-hero-grid { grid-template-columns:1fr; }
          .db-hero-grid > *:last-child { display:none; }
          .db-main-grid { grid-template-columns:1fr; }
        }
        @media(max-width:640px) {
          .db-section { padding-left:16px!important; padding-right:16px!important; }
        }
      `}</style>

      {/* ══════════════════ HERO ══════════════════ */}
      <div style={{ background: "linear-gradient(180deg, #080A14 0%, #05060A 100%)", borderBottom: "1px solid rgba(255,255,255,0.05)", position: "relative", overflow: "hidden" }}>
        {/* Subtle radial bloom */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse 55% 100% at 75% 50%, rgba(${ACCENT_RGB},0.07) 0%, transparent 65%)`, pointerEvents: "none" }} />

        <div className="db-section db-hero-grid" style={{ maxWidth: 1280, margin: "0 auto", padding: "44px 32px 40px" }}>

          {/* Left: greeting + headline + KPIs + CTAs */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>

            {/* Status pills */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: SUCCESS, display: "block", animation: "db-pulse 1.8s ease-in-out infinite" }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: SUCCESS, letterSpacing: "0.1em" }}>AI СИСТЕМА АКТИВНА</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: `rgba(${ACCENT_RGB},0.07)`, border: `1px solid rgba(${ACCENT_RGB},0.18)` }}>
                <Star size={10} style={{ color: ACCENT }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: `rgba(${ACCENT_RGB},0.9)` }}>Confidence 91%</span>
              </div>
            </div>

            {/* Headline */}
            <h1 style={{ fontSize: "clamp(28px,3.5vw,46px)", fontWeight: 800, color: "#fff", lineHeight: 1.08, letterSpacing: "-0.03em", marginBottom: 12, textWrap: "balance" } as React.CSSProperties}>
              {greeting}, {firstName}<br />
              <span style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #8b5cf6 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Apex Executive Board
              </span>
            </h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.42)", lineHeight: 1.65, marginBottom: 32, maxWidth: 500 }}>
              Ваша AI-команда директоров анализирует рынок, стратегию и финансы в реальном времени — пока вы принимаете решения.
            </p>

            {/* KPI strip */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
              {[
                { icon: Target,     label: "Возможностей", value: 4,  suffix: "",  color: SUCCESS },
                { icon: BarChart2,  label: "AI Анализов",  value: 12, suffix: "+", color: ACCENT  },
                { icon: Shield,     label: "Активных рисков", value: 2, suffix: "", color: DANGER  },
                { icon: TrendingUp, label: "Рост MoM",     value: 34, suffix: "%", color: WARNING },
              ].map(k => (
                <div key={k.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <k.icon size={15} style={{ color: k.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: k.color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                      <Counter to={k.value} suffix={k.suffix} />
                    </div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2, whiteSpace: "nowrap" }}>{k.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Link href="/dashboard/new" style={{
                display: "flex", alignItems: "center", gap: 8, height: 46, padding: "0 22px",
                borderRadius: 12, fontSize: 14, fontWeight: 700, color: "#fff",
                background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16), 0 8px 24px rgba(99,102,241,0.3)",
                textDecoration: "none", transition: "transform 0.2s", letterSpacing: "-0.01em",
              }}>
                <Zap size={15} />Новая стратегия
              </Link>
              <Link href="/dashboard/chat" style={{
                display: "flex", alignItems: "center", gap: 8, height: 46, padding: "0 22px",
                borderRadius: 12, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.68)",
                background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.1)",
                textDecoration: "none",
              }}>
                <Brain size={14} />Спросить совет
              </Link>
            </div>
          </motion.div>

          {/* Right: Live Intelligence Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <LiveIntelPanel />
          </motion.div>
        </div>
      </div>

      {/* ══════════════════ EXECUTIVE BOARD ══════════════════ */}
      <div className="db-section" style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 32px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Executive AI Board</h2>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>5 AI-директоров · Нажмите, чтобы задать вопрос</p>
          </div>
          <Link href="/dashboard/executives" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: `rgba(${ACCENT_RGB},0.8)`, textDecoration: "none" }}>
            Открыть совет <ChevronRight size={13} />
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {EXECUTIVES.map((exec, i) => <ExecCard key={exec.role} exec={exec} delay={i * 0.07} />)}
        </div>
      </div>

      {/* ══════════════════ MAIN CONTENT ══════════════════ */}
      <div className="db-section db-main-grid" style={{ maxWidth: 1280, margin: "28px auto 0", padding: "0 32px" }}>

        {/* LEFT COLUMN: Projects + Insights */}
        <div>

          {/* Tab bar — underline style */}
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 20 }}>
            {([["projects", "Мои проекты"], ["insights", "AI Intelligence"]] as const).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} style={{
                padding: "0 4px 12px", marginRight: 24,
                fontSize: 13, fontWeight: tab === id ? 700 : 500,
                color: tab === id ? "#fff" : "rgba(255,255,255,0.38)",
                background: "none", border: "none", cursor: "pointer",
                borderBottom: `2px solid ${tab === id ? ACCENT : "transparent"}`,
                marginBottom: -1, transition: "color 0.2s",
              }}>
                {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "projects" ? (
              <motion.div key="proj" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
                {loading ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {[0, 1].map(i => <div key={i} style={{ height: 280, borderRadius: 16, background: "rgba(255,255,255,0.03)", animation: "pulse 1.5s ease-in-out infinite" }} />)}
                  </div>
                ) : projects.length === 0 ? (
                  <EmptyProjects />
                ) : (
                  <>
                    {isDemo && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 14, padding: "5px 12px", borderRadius: 8, background: `rgba(${ACCENT_RGB},0.08)`, border: `1px solid rgba(${ACCENT_RGB},0.2)` }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: `rgba(${ACCENT_RGB},0.9)` }}>Демо-данные</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>— создайте проект, чтобы увидеть реальные</span>
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                      {projects.slice(0, 4).map((p, i) => <ProjectCard key={p.id} p={p} i={i} />)}
                    </div>

                    {/* New project tile */}
                    <Link href="/dashboard/new" style={{
                      marginTop: 16, display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                      borderRadius: 14, border: "1px dashed rgba(255,255,255,0.08)", textDecoration: "none",
                      transition: "border-color 0.2s, background 0.2s",
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `rgba(${ACCENT_RGB},0.25)`; (e.currentTarget as HTMLElement).style.background = `rgba(${ACCENT_RGB},0.04)`; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <div style={{ width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
                        <Zap size={15} style={{ color: "rgba(255,255,255,0.2)" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>Новая стратегия</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>Опишите идею — AI-команда проведёт полный анализ</div>
                      </div>
                    </Link>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div key="insights" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {AI_INSIGHTS.map((ins, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.38, delay: i * 0.07 }}
                    style={{ borderRadius: 14, padding: "14px 16px", background: "rgba(255,255,255,0.025)", border: `1px solid rgba(255,255,255,0.07)`, cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 12 }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${ins.color}28`}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"}
                  >
                    {/* Left color rail */}
                    <div style={{ width: 3, alignSelf: "stretch", borderRadius: 2, background: ins.color, flexShrink: 0 }} />
                    <div style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: `${ins.color}12`, border: `1px solid ${ins.color}22` }}>
                      <ins.icon size={14} style={{ color: ins.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 3 }}>{ins.title}</div>
                          <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)", lineHeight: 1.55 }}>{ins.desc}</p>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: ins.color }}>{ins.growth}</div>
                          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", marginTop: 1 }}>Эффект</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                          <span style={{ color: ins.color, fontWeight: 700 }}>{ins.prob}%</span> вероятность
                        </span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>·</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: ins.impact === "Высокий" ? SUCCESS : WARNING }}>{ins.impact} импакт</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Strategic Signal (top recommendation) */}
          <div style={{ borderRadius: 16, padding: "20px", background: `linear-gradient(145deg, rgba(${ACCENT_RGB},0.1), rgba(79,70,229,0.04))`, border: `1px solid rgba(${ACCENT_RGB},0.22)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <Flame size={12} style={{ color: ACCENT }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: `rgba(${ACCENT_RGB},0.9)` }}>
                Сигнал дня
              </span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1.45, marginBottom: 6 }}>
              Повысьте цену на 23% — рынок недооценивает продукт
            </p>
            <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.42)", lineHeight: 1.6, marginBottom: 16 }}>
              340 конкурентов · медиана $49/мес · $680K/год остаётся на столе
            </p>

            {/* Impact metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
              {[
                { v: "78%",    l: "Вероятность", c: ACCENT  },
                { v: "+$680K", l: "Потенциал/год", c: SUCCESS },
                { v: "High",   l: "Импакт",       c: WARNING },
              ].map(m => (
                <div key={m.l} style={{ textAlign: "center", padding: "8px 6px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: m.c }}>{m.v}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{m.l}</div>
                </div>
              ))}
            </div>

            <Link href="/dashboard/new" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              height: 38, borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#fff",
              background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)", textDecoration: "none",
            }}>
              <Zap size={11} />Применить стратегию
            </Link>
          </div>

          {/* Activity feed */}
          <div style={{ borderRadius: 16, padding: "16px 18px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>Активность</span>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, fontWeight: 700, color: SUCCESS }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: SUCCESS, display: "block", animation: "db-pulse 2s ease-in-out infinite" }} />
                Live
              </div>
            </div>
            {ACTIVITY.map((ev, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderBottom: i < ACTIVITY.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", cursor: "pointer" }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: `${ev.color}12`, border: `1px solid ${ev.color}1e` }}>
                  <ev.icon size={11} style={{ color: ev.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 500, color: "rgba(255,255,255,0.72)", lineHeight: 1.3 }}>{ev.label}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>{ev.sub}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                  <Clock size={9} style={{ color: "rgba(255,255,255,0.18)" }} />
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>{ev.time}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Market Pulse */}
          <div style={{ borderRadius: 16, padding: "16px 18px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", display: "block", marginBottom: 12 }}>Пульс рынка</span>
            {MARKET_PULSE.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < MARKET_PULSE.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Globe size={11} style={{ color: "rgba(255,255,255,0.22)" }} />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{m.label}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ height: 2, width: 32, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: m.pos ? SUCCESS : DANGER, width: m.pos ? "80%" : "20%", borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: m.pos ? SUCCESS : DANGER, minWidth: 40, textAlign: "right" }}>{m.trend}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "AI Чат",    href: "/dashboard/chat",       icon: Brain,    desc: "Спросить совет" },
              { label: "Отчёты",   href: "/dashboard/reports",    icon: FileText, desc: "Все анализы" },
              { label: "Агенты",   href: "/dashboard/executives", icon: Users,    desc: "AI-директора" },
              { label: "Блокнот",  href: "/dashboard/notepad",    icon: FileText, desc: "Заметки" },
            ].map((qa, i) => (
              <Link key={i} href={qa.href} style={{
                display: "flex", flexDirection: "column", gap: 6, padding: "12px",
                borderRadius: 12, background: `rgba(${ACCENT_RGB},0.05)`,
                border: `1px solid rgba(${ACCENT_RGB},0.12)`, textDecoration: "none",
                transition: "background 0.2s, border-color 0.2s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `rgba(${ACCENT_RGB},0.1)`; (e.currentTarget as HTMLElement).style.borderColor = `rgba(${ACCENT_RGB},0.24)`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `rgba(${ACCENT_RGB},0.05)`; (e.currentTarget as HTMLElement).style.borderColor = `rgba(${ACCENT_RGB},0.12)`; }}
              >
                <qa.icon size={14} style={{ color: ACCENT }} />
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,0.72)" }}>{qa.label}</div>
                  <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.28)", marginTop: 1 }}>{qa.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
