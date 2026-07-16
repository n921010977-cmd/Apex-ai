"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Eye, MessageCircle, Heart, Film, TrendingUp, Zap, Play,
  Award, Flame, FileText, RefreshCw, ArrowUpRight, BarChart3,
} from "lucide-react";

// ─── Design tokens ──────────────────────────────────────────────────────────
const BG     = "#05060A";
const BORD   = "rgba(255,255,255,0.07)";
const TP     = "#E5E7EB";
const TS     = "rgba(255,255,255,0.5)";
const TM     = "rgba(255,255,255,0.3)";
const ACCENT = "#6366f1";
const SUCCESS= "#10b981";
const WARNING= "#f59e0b";
const VIOLET = "#8b5cf6";
const MONO   = "var(--font-geist-mono), ui-monospace, monospace";
const EASE   = [0.22, 1, 0.36, 1] as const;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Reel {
  id: string;
  code: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  er: number;          // engagement rate %
  hasTranscript: boolean;
  hook: string;
}

// ─── Demo reels ────────────────────────────────────────────────────────────────
const REELS: Reel[] = [
  { id: "r1",  code: "B2E2xLERrz1R", title: "Напиши «система» или в личку, чтобы узнать больше…",         views: 86166, likes: 4842, comments: 5613, er: 14.45, hasTranscript: true,  hook: "прямой CTA в первом кадре" },
  { id: "r2",  code: "DY-gyTExtcv",  title: "Вот наш агент из 6 частей — Agentic Growth System",           views: 68834, likes: 4262, comments: 226,  er: 6.68,  hasTranscript: true,  hook: "демонстрация продукта" },
  { id: "r3",  code: "DY5yJSAxP00",  title: "CEO, CMO, ресёрч-агент, sales rep и бизнес-аналитик — все…",   views: 63545, likes: 4165, comments: 455,  er: 7.27,  hasTranscript: true,  hook: "список ролей / интрига" },
  { id: "r4",  code: "DX1kMnPqR2s",  title: "Как один founder заменил целый отдел маркетинга",             views: 51203, likes: 3890, comments: 612,  er: 8.79,  hasTranscript: true,  hook: "трансформация / до-после" },
  { id: "r5",  code: "DW9jLoPvT4u",  title: "Агент написал 40 постов за ночь — вот результаты",            views: 44870, likes: 2103, comments: 189,  er: 5.11,  hasTranscript: false, hook: "конкретика в цифрах" },
  { id: "r6",  code: "DV7hKmNwX9y",  title: "Почему твой контент не продаёт (и как это чинит AI)",          views: 39215, likes: 3012, comments: 341,  er: 8.55,  hasTranscript: true,  hook: "болевая точка" },
  { id: "r7",  code: "DU5gJlMvW8z",  title: "Разбор воронки, которая приносит $100K/мес",                  views: 33988, likes: 2450, comments: 278,  er: 8.03,  hasTranscript: true,  hook: "деньги / кейс" },
  { id: "r8",  code: "DT3fIkLuV7x",  title: "3 промпта, которые заменяют копирайтера",                     views: 28104, likes: 1876, comments: 203,  er: 7.40,  hasTranscript: false, hook: "actionable список" },
  { id: "r9",  code: "DS1eHjKtU6w",  title: "Мой AI-стек для роста в 2026",                                views: 22450, likes: 1340, comments: 98,   er: 6.41,  hasTranscript: true,  hook: "личный опыт / стек" },
  { id: "r10", code: "DR9dGiJsT5v",  title: "Автоматизировал квалификацию лидов — сэкономил 20ч/нед",       views: 19870, likes: 1520, comments: 167,  er: 8.49,  hasTranscript: true,  hook: "экономия времени" },
  { id: "r11", code: "DQ7cFhIrS4u",  title: "Стоит ли доверять AI стратегию бизнеса?",                     views: 15230, likes: 890,  comments: 421,  er: 8.61,  hasTranscript: false, hook: "провокационный вопрос" },
  { id: "r12", code: "DP5bEgHqR3t",  title: "От идеи до отчёта совета директоров за 4 минуты",             views: 12645, likes: 1105, comments: 134,  er: 9.80,  hasTranscript: true,  hook: "скорость / wow-эффект" },
  { id: "r13", code: "DO3aDfGpQ2s",  title: "Что умеет ресёрч-агент, чего не умеет человек",               views: 9880,  likes: 640,  comments: 72,   er: 7.21,  hasTranscript: true,  hook: "сравнение" },
  { id: "r14", code: "DN1zCeF0P1r",  title: "Живой прогон: собрал контент-план на месяц",                  views: 8120,  likes: 512,  comments: 55,   er: 6.98,  hasTranscript: false, hook: "процесс в реальном времени" },
  { id: "r15", code: "DM9yBdEzO0q",  title: "Ошибка, из-за которой 90% AI-контента проваливается",         views: 6740,  likes: 498,  comments: 88,   er: 8.69,  hasTranscript: true,  hook: "ошибка / предупреждение" },
  { id: "r16", code: "DL7xAcDyN9p",  title: "Как измерять реальный ROI от AI-агентов",                     views: 5310,  likes: 320,  comments: 41,   er: 6.80,  hasTranscript: true,  hook: "метрики / ROI" },
  { id: "r17", code: "DK5wZbCxM8o",  title: "Мини-разбор: почему этот рил залетел",                        views: 3920,  likes: 245,  comments: 33,   er: 7.09,  hasTranscript: false, hook: "мета-разбор" },
];

const fmt = (n: number) => n.toLocaleString("ru-RU");
const fmtK = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : `${n}`;

// ─── Count-up ───────────────────────────────────────────────────────────────
function CountUp({ to, duration = 1400, delay = 0 }: { to: number; duration?: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0; const t0 = performance.now() + delay;
    const step = (ts: number) => {
      const p = Math.min(1, Math.max(0, (ts - t0) / duration));
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration, delay]);
  return <span ref={ref}>{fmt(v)}</span>;
}

// ─── Reel thumbnail (generated gradient, no external assets) ──────────────────
function ReelThumb({ reel, size = 48 }: { reel: Reel; size?: number }) {
  // deterministic hue from code
  const hue = useMemo(() => {
    let h = 0; for (const c of reel.code) h = (h * 31 + c.charCodeAt(0)) % 360;
    return h;
  }, [reel.code]);
  return (
    <div style={{
      width: size, height: size * 1.3, borderRadius: 8, flexShrink: 0, position: "relative", overflow: "hidden",
      background: `linear-gradient(150deg, hsl(${hue} 55% 22%), hsl(${(hue + 40) % 360} 45% 12%))`,
      border: "1px solid rgba(255,255,255,0.08)",
    }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Play size={size * 0.3} style={{ color: "rgba(255,255,255,0.55)" }} fill="rgba(255,255,255,0.35)" />
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon: Icon, delay }: {
  label: string; value: number; sub: string; color: string; icon: React.ElementType; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE, delay }}
      className="surface-card"
      style={{ padding: "18px 20px", borderRadius: 16, position: "relative", overflow: "hidden" }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${color}66, transparent)` }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: TM }}>{label}</span>
        <span style={{ width: 30, height: 30, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: `${color}15`, border: `1px solid ${color}25` }}>
          <Icon size={14} style={{ color }} />
        </span>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: TP, letterSpacing: "-0.02em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
        <CountUp to={value} delay={delay * 1000 + 200} />
      </div>
      <div style={{ fontSize: 11, color: TS, marginTop: 6 }}>{sub}</div>
    </motion.div>
  );
}

// ─── Winner row ───────────────────────────────────────────────────────────────
function WinnerRow({ reel, index, maxViews }: { reel: Reel; index: number; maxViews: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: EASE, delay: 0.3 + index * 0.06 }}
      onClick={() => setOpen(o => !o)}
      style={{ borderRadius: 12, cursor: "pointer" }}
      whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px" }}>
        <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: index < 3 ? ACCENT : TM, width: 20, textAlign: "center", flexShrink: 0 }}>
          {index + 1}
        </span>
        <ReelThumb reel={reel} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: TP, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 5 }}>
            {reel.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: TS }}><Heart size={10} style={{ color: "#f43f5e" }} /> {fmt(reel.likes)}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: TS }}><MessageCircle size={10} style={{ color: ACCENT }} /> {fmt(reel.comments)}</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 5, background: `${SUCCESS}15`, color: SUCCESS, border: `1px solid ${SUCCESS}25` }}>ER {reel.er.toFixed(2)}%</span>
          </div>
          {/* views bar */}
          <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${(reel.views / maxViews) * 100}%` }}
              transition={{ duration: 1.1, ease: EASE, delay: 0.5 + index * 0.06 }}
              style={{ height: "100%", borderRadius: 2, background: `linear-gradient(90deg, ${ACCENT}, ${VIOLET})` }}
            />
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, minWidth: 68 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: TP, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{fmt(reel.views)}</div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: TM, letterSpacing: "0.08em", marginTop: 3 }}>ПРОСМОТРОВ</div>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: EASE }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ margin: "0 14px 12px 48px", padding: "10px 12px", borderRadius: 10, background: "rgba(99,102,241,0.06)", border: `1px solid ${ACCENT}22`, display: "flex", flexWrap: "wrap", gap: 14 }}>
              <div style={{ minWidth: 140 }}>
                <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", color: TM, marginBottom: 3 }}>ХУК</div>
                <div style={{ fontSize: 12, color: TS }}>{reel.hook}</div>
              </div>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", color: TM, marginBottom: 3 }}>КОД</div>
                <div style={{ fontFamily: MONO, fontSize: 12, color: "#818cf8" }}>{reel.code}</div>
              </div>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", color: TM, marginBottom: 3 }}>ТРАНСКРИПТ</div>
                <div style={{ fontSize: 12, color: reel.hasTranscript ? SUCCESS : TM }}>{reel.hasTranscript ? "есть" : "нет"}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Outlier card ─────────────────────────────────────────────────────────────
function OutlierCard({ label, reel, metric, color, icon: Icon, delay }: {
  label: string; reel: Reel | null; metric: string; color: string; icon: React.ElementType; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay }}
      className="surface-card"
      style={{ padding: 16, borderRadius: 14, display: "flex", flexDirection: "column", gap: 10, minHeight: 130 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ width: 24, height: 24, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: `${color}15`, border: `1px solid ${color}25` }}>
          <Icon size={12} style={{ color }} />
        </span>
        <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: TM }}>{label}</span>
      </div>
      {reel ? (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: TP, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {reel.title}
          </div>
          <div style={{ marginTop: "auto", display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{metric}</span>
          </div>
        </>
      ) : (
        <div style={{ marginTop: "auto", fontSize: 13, color: TM }}>— нет данных</div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function ContentAnalyticsPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [reels, setReels] = useState<Reel[]>(REELS);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const totals = useMemo(() => ({
    reels: reels.length,
    transcripts: reels.filter(r => r.hasTranscript).length,
    views: reels.reduce((s, r) => s + r.views, 0),
    comments: reels.reduce((s, r) => s + r.comments, 0),
    likes: reels.reduce((s, r) => s + r.likes, 0),
  }), [reels]);

  const winners = useMemo(() => [...reels].sort((a, b) => b.views - a.views), [reels]);
  const maxViews = winners[0]?.views ?? 1;

  const viewsLeader   = useMemo(() => [...reels].sort((a, b) => b.views - a.views)[0] ?? null, [reels]);
  const commentLeader = useMemo(() => [...reels].sort((a, b) => b.comments - a.comments)[0] ?? null, [reels]);
  const erLeader      = useMemo(() => [...reels].sort((a, b) => b.er - a.er)[0] ?? null, [reels]);
  const likesLeader   = useMemo(() => [...reels].sort((a, b) => b.likes - a.likes)[0] ?? null, [reels]);

  // Simulate a live sync: new views/likes/comments trickle in, ER recomputed.
  const refresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    setTimeout(() => {
      setReels(prev => prev.map(r => {
        const dv = Math.round(r.views * (0.005 + Math.random() * 0.03));
        const dl = Math.round(r.likes * (0.004 + Math.random() * 0.025));
        const dc = Math.round(r.comments * (0.003 + Math.random() * 0.02));
        const views = r.views + dv, likes = r.likes + dl, comments = r.comments + dc;
        const er = +(((likes + comments) / views) * 100).toFixed(2);
        return { ...r, views, likes, comments, er };
      }));
      setLastSync(new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setRefreshing(false);
    }, 900);
  };

  return (
    <div style={{ minHeight: "100%", background: BG, padding: "28px 32px 60px" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}
      >
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: ACCENT, marginBottom: 8 }}>
            Content Analytics
          </div>
          <h1 className="text-balance" style={{ fontSize: "clamp(26px, 3.4vw, 38px)", fontWeight: 800, color: TP, letterSpacing: "-0.02em", lineHeight: 1.05 }}>
            Кокпит эффективности контента
          </h1>
          <p style={{ fontSize: 14, color: TS, marginTop: 8, maxWidth: 640, lineHeight: 1.6 }}>
            Приоритетный аналитический слой для рилсов: победители, выбросы, хуки, темы и граф связей.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <button
            onClick={refresh} disabled={refreshing}
            style={{ display: "flex", alignItems: "center", gap: 8, height: 42, padding: "0 18px", borderRadius: 12, border: `1px solid ${ACCENT}40`, background: "rgba(99,102,241,0.08)", color: "#818cf8", fontSize: 13, fontWeight: 700, cursor: refreshing ? "default" : "pointer", opacity: refreshing ? 0.6 : 1 }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? "spin 0.9s linear infinite" : "none" }} />
            {refreshing ? "Синхронизация…" : "Обновить аналитику"}
          </button>
          {lastSync && (
            <span style={{ fontFamily: MONO, fontSize: 10, color: TM }}>обновлено в {lastSync}</span>
          )}
        </div>
      </motion.div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginTop: 24 }}>
        <StatCard label="Рилсов отслежено" value={totals.reels}    sub={`${totals.transcripts}/${totals.reels} с транскриптами`} color={ACCENT}  icon={Film}          delay={0.05} />
        <StatCard label="Всего просмотров" value={totals.views}    sub="живая база рилсов"                                       color={VIOLET}  icon={Eye}           delay={0.1}  />
        <StatCard label="Всего комментариев" value={totals.comments} sub="сигнал вовлечённости"                                  color={SUCCESS} icon={MessageCircle} delay={0.15} />
        <StatCard label="Всего лайков"     value={totals.likes}    sub="сигнал охвата"                                          color="#f43f5e" icon={Heart}         delay={0.2}  />
      </div>

      {/* Two-column: winners + outliers */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)", gap: 16, marginTop: 16 }} className="content-grid">
        {/* Winners */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE, delay: 0.25 }}
          className="surface-card"
          style={{ padding: "18px 14px 14px", borderRadius: 18 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Award size={15} style={{ color: WARNING }} />
              <span style={{ fontSize: 15, fontWeight: 800, color: TP, letterSpacing: "-0.01em" }}>Победители по просмотрам</span>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: "rgba(99,102,241,0.1)", color: "#818cf8", border: `1px solid ${ACCENT}22`, letterSpacing: "0.06em" }}>
              {REELS.length} РИЛСОВ
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 560, overflowY: "auto" }}>
            {winners.map((r, i) => <WinnerRow key={r.id} reel={r} index={i} maxViews={maxViews} />)}
          </div>
        </motion.div>

        {/* Outliers */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE, delay: 0.3 }}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 2px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Flame size={15} style={{ color: "#f43f5e" }} />
              <span style={{ fontSize: 15, fontWeight: 800, color: TP, letterSpacing: "-0.01em" }}>Выбросы контента</span>
            </div>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: MONO, fontSize: 9, fontWeight: 600, color: SUCCESS, letterSpacing: "0.1em" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: SUCCESS }} /> LIVE
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <OutlierCard label="Лидер просмотров"     reel={viewsLeader}   metric={fmt(viewsLeader?.views ?? 0)}       color={VIOLET}  icon={Eye}           delay={0.35} />
            <OutlierCard label="Лидер комментариев"   reel={commentLeader} metric={fmt(commentLeader?.comments ?? 0)}  color={ACCENT}  icon={MessageCircle} delay={0.4}  />
            <OutlierCard label="Лидер по ER"          reel={erLeader}      metric={`${erLeader?.er.toFixed(2) ?? 0}%`} color={SUCCESS} icon={Zap}           delay={0.45} />
            <OutlierCard label="Лидер по лайкам"      reel={likesLeader}   metric={fmt(likesLeader?.likes ?? 0)}       color="#f43f5e" icon={Heart}         delay={0.5}  />
          </div>

          {/* Transcript coverage */}
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.55 }}
            className="surface-card"
            style={{ padding: 16, borderRadius: 14 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
              <FileText size={13} style={{ color: TS }} />
              <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: TM }}>Глубина транскриптов</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: TP, fontVariantNumeric: "tabular-nums" }}>
                {Math.round(totals.transcripts / totals.reels * 100)}%
              </span>
              <span style={{ fontSize: 12, color: TS }}>{totals.transcripts} из {totals.reels} рилсов</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${totals.transcripts / totals.reels * 100}%` }}
                transition={{ duration: 1.3, ease: EASE, delay: 0.7 }}
                style={{ height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${ACCENT}, ${VIOLET})` }}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          :global(.content-grid) { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
