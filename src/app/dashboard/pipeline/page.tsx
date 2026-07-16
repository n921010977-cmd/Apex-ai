"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Search, Phone, PhoneOff, Building2, Mail, TrendingUp, Filter,
  CheckCircle2, Clock, ChevronDown, DollarSign, Users, Target,
  CalendarClock, ArrowUpRight, Sparkles,
} from "lucide-react";

// ─── Design tokens ──────────────────────────────────────────────────────────
const BG     = "#05060A";
const SURF   = "rgba(255,255,255,0.03)";
const BORD   = "rgba(255,255,255,0.07)";
const BORD_H = "rgba(255,255,255,0.13)";
const TP     = "#E5E7EB";
const TS     = "rgba(255,255,255,0.5)";
const TM     = "rgba(255,255,255,0.3)";
const ACCENT = "#6366f1";
const SUCCESS= "#10b981";
const WARNING= "#f59e0b";
const DANGER = "#ef4444";
const MONO   = "var(--font-geist-mono), ui-monospace, monospace";
const EASE   = [0.22, 1, 0.36, 1] as const;

// ─── Types ────────────────────────────────────────────────────────────────────
type RevenueBand = "$100K+/мес" | "$30K–$100K/мес" | "$5K–$30K/мес" | "$2K–$5K/мес";

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  band: RevenueBand;
  bandValue: number;        // for sorting
  booked: boolean;
  marketing: string;
  business: string;
  received: string;
  call?: string;
  score: number;            // AI qualification score
}

// ─── Demo leads ────────────────────────────────────────────────────────────────
const LEADS: Lead[] = [
  { id: "l1", name: "Alex Rivera",        company: "Priority Doors & Windows", email: "alex@prioritydoors.com",  band: "$100K+/мес",     bandValue: 4, booked: true,  marketing: "Пока нет структурированной маркетинговой воронки", business: "Продажа окон и дверей премиум-сегмента", received: "18 июня · 22:12", call: "Чт 18 июня · 16:00–17:00", score: 92 },
  { id: "l2", name: "Benjamin Cole",      company: "Client Matchmaking",        email: "ben@clientmatch.io",     band: "$100K+/мес",     bandValue: 4, booked: false, marketing: "Есть агентство, но нужна автоматизация лидгена", business: "Маркетинговое агентство · лидген и назначение встреч", received: "8 июня · 08:18", score: 88 },
  { id: "l3", name: "Joseph Marino",      company: "MediaFlooding",             email: "joseph@mediaflood.com",  band: "$100K+/мес",     bandValue: 4, booked: true,  marketing: "Контент есть, но нет системы дистрибуции", business: "Работа с корпоративными клиентами · контент", received: "7 июня · 08:15", call: "Вт 9 июня · 18:30", score: 85 },
  { id: "l4", name: "Daniel Osei",        company: "MediaStream",               email: "daniel@mediastream.co",  band: "$30K–$100K/мес", bandValue: 3, booked: true,  marketing: "Хочет перейти из B2B в B2G и масштабировать", business: "B2G-компания, выросшая из B2B", received: "7 июня · 02:03", call: "Сб 15 июня · 12:00–12:30", score: 79 },
  { id: "l5", name: "Arnaldo L. Caprai",  company: "Caprai S.R.L.",             email: "arnaldo@caprai.it",      band: "$30K–$100K/мес", bandValue: 3, booked: false, marketing: "Производство без цифрового присутствия", business: "Производственная компания полного цикла", received: "2 июня · 07:12", score: 71 },
  { id: "l6", name: "Saeed Rahman",       company: "Ran-Zo",                    email: "saeed@ranzo.co",         band: "$100K+/мес",     bandValue: 4, booked: true,  marketing: "Сильный бренд, слабая перформанс-часть", business: "Fashion-ритейл и дистрибуция", received: "1 июня · 01:56", call: "Пн 3 июня · 14:00", score: 83 },
  { id: "l7", name: "Marta Lindqvist",    company: "Nordic Health Labs",        email: "marta@nordichealth.se",  band: "$30K–$100K/мес", bandValue: 3, booked: false, marketing: "Органика растёт, платные каналы не окупаются", business: "D2C wellness · подписочная модель", received: "31 мая · 19:40", score: 74 },
  { id: "l8", name: "Tobias Werner",      company: "Werner Automation",         email: "tobias@werner-a.de",     band: "$5K–$30K/мес",   bandValue: 2, booked: false, marketing: "Только начинает выстраивать процессы", business: "Промышленная автоматизация для SMB", received: "30 мая · 11:22", score: 66 },
  { id: "l9", name: "Priya Nair",         company: "Bloom Studio",              email: "priya@bloomstudio.in",   band: "$5K–$30K/мес",   bandValue: 2, booked: true,  marketing: "Хочет системный контент вместо разовых постов", business: "Дизайн-студия · брендинг", received: "29 мая · 09:05", call: "Пт 31 мая · 11:00", score: 69 },
  { id: "l10", name: "Carlos Mendez",     company: "Mendez Logistics",          email: "carlos@mendezlog.mx",    band: "$100K+/мес",     bandValue: 4, booked: false, marketing: "Продажи через сарафан, лидген не построен", business: "Логистика и складские решения", received: "28 мая · 16:48", score: 81 },
  { id: "l11", name: "Yuki Tanaka",       company: "Sakura Ventures",           email: "yuki@sakuravc.jp",       band: "$30K–$100K/мес", bandValue: 3, booked: true,  marketing: "Нужен thought-leadership контент для фонда", business: "Венчурный фонд · early-stage", received: "27 мая · 13:30", call: "Ср 29 мая · 09:30", score: 77 },
  { id: "l12", name: "Emma Watson",       company: "Craft & Co",                email: "emma@craftco.uk",        band: "$2K–$5K/мес",    bandValue: 1, booked: false, marketing: "Ранняя стадия, ограниченный бюджет", business: "Ремесленный бренд · e-commerce", received: "26 мая · 08:12", score: 58 },
];

const BANDS: { label: string; match: (l: Lead) => boolean; color: string }[] = [
  { label: "Все",              match: () => true,                       color: ACCENT  },
  { label: "$100K+/мес",       match: l => l.band === "$100K+/мес",     color: SUCCESS },
  { label: "$30K–$100K/мес",   match: l => l.band === "$30K–$100K/мес", color: WARNING },
  { label: "$5K–$30K/мес",     match: l => l.band === "$5K–$30K/мес",   color: "#8b5cf6" },
  { label: "$2K–$5K/мес",      match: l => l.band === "$2K–$5K/мес",    color: TS      },
];

const BAND_COLOR: Record<RevenueBand, string> = {
  "$100K+/мес":     SUCCESS,
  "$30K–$100K/мес": WARNING,
  "$5K–$30K/мес":   "#8b5cf6",
  "$2K–$5K/мес":    TS,
};

// ─── Count-up ───────────────────────────────────────────────────────────────
function CountUp({ to, duration = 1300, delay = 0 }: { to: number; duration?: number; delay?: number }) {
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
  return <span ref={ref}>{v.toLocaleString("ru-RU")}</span>;
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

// ─── Lead card ────────────────────────────────────────────────────────────────
function LeadCard({ lead, index }: { lead: Lead; index: number }) {
  const [open, setOpen] = useState(false);
  const bandColor = BAND_COLOR[lead.band];
  const scoreColor = lead.score >= 80 ? SUCCESS : lead.score >= 65 ? ACCENT : WARNING;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE, delay: Math.min(index * 0.04, 0.4) }}
      whileHover={{ y: -4 }}
      onClick={() => setOpen(o => !o)}
      className="surface-card"
      style={{ padding: 18, borderRadius: 16, cursor: "pointer", position: "relative" }}
    >
      {/* header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
        <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: TM }}>
          Квалифицированный лид
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: `${bandColor}15`, color: bandColor, border: `1px solid ${bandColor}30`, whiteSpace: "nowrap" }}>
            {lead.band}
          </span>
          <span style={{
            display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
            background: lead.booked ? `${SUCCESS}12` : "rgba(255,255,255,0.04)",
            color: lead.booked ? SUCCESS : TM,
            border: `1px solid ${lead.booked ? SUCCESS + "30" : BORD}`,
          }}>
            {lead.booked ? <Phone size={9} /> : <PhoneOff size={9} />}
            {lead.booked ? "Звонок назначен" : "Не назначен"}
          </span>
        </div>
      </div>

      {/* name + company */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: TP, letterSpacing: "-0.01em", marginBottom: 2 }}>{lead.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: TS }}>
            <Building2 size={11} style={{ flexShrink: 0, color: TM }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.company}</span>
          </div>
        </div>
        {/* score ring */}
        <div style={{ flexShrink: 0, textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: scoreColor, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{lead.score}</div>
          <div style={{ fontFamily: MONO, fontSize: 8, color: TM, letterSpacing: "0.1em", marginTop: 2 }}>AI SCORE</div>
        </div>
      </div>

      {/* meta */}
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 12, color: TS, lineHeight: 1.5 }}>
          <span style={{ color: TM, fontWeight: 600 }}>Маркетинг: </span>{lead.marketing}
        </div>
        <div style={{ fontSize: 12, color: TS, lineHeight: 1.5 }}>
          <span style={{ color: TM, fontWeight: 600 }}>Бизнес: </span>{lead.business}
        </div>
      </div>

      {/* footer */}
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BORD}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: MONO, fontSize: 10, color: TM }}>
          <Clock size={10} /> {lead.received}
        </span>
        {lead.call && (
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: MONO, fontSize: 10, color: SUCCESS }}>
            <CalendarClock size={10} /> {lead.call}
          </span>
        )}
      </div>

      {/* expandable detail */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BORD}`, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: TS }}>
                <Mail size={11} style={{ color: TM }} /> {lead.email}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button
                  onClick={e => { e.stopPropagation(); window.location.href = `mailto:${lead.email}`; }}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 38, borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)" }}
                >
                  <Mail size={12} /> Написать
                </button>
                <button
                  onClick={e => e.stopPropagation()}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 38, borderRadius: 10, border: `1px solid ${BORD_H}`, background: "transparent", color: TS, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  <ArrowUpRight size={12} /> Открыть CRM
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function PipelinePage() {
  const [query, setQuery] = useState("");
  const [band, setBand] = useState("Все");
  const [bookedOnly, setBookedOnly] = useState(false);
  const [sort, setSort] = useState<"score" | "revenue" | "recent">("score");

  const filtered = useMemo(() => {
    const bandDef = BANDS.find(b => b.label === band) ?? BANDS[0];
    let out = LEADS.filter(l => {
      const q = query.trim().toLowerCase();
      const matchQ = !q || l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.business.toLowerCase().includes(q);
      return matchQ && bandDef.match(l) && (!bookedOnly || l.booked);
    });
    out = [...out].sort((a, b) =>
      sort === "score" ? b.score - a.score :
      sort === "revenue" ? b.bandValue - a.bandValue :
      0,
    );
    return out;
  }, [query, band, bookedOnly, sort]);

  // Stats
  const stats = useMemo(() => {
    const total = LEADS.length;
    const booked = LEADS.filter(l => l.booked).length;
    const highValue = LEADS.filter(l => l.bandValue >= 4).length;
    const avgScore = Math.round(LEADS.reduce((s, l) => s + l.score, 0) / total);
    return { total, booked, highValue, avgScore };
  }, []);

  // Band distribution for the mini funnel
  const dist = useMemo(() => BANDS.slice(1).map(b => ({
    label: b.label, color: b.color, count: LEADS.filter(b.match).length,
  })), []);
  const maxDist = Math.max(...dist.map(d => d.count), 1);

  return (
    <div style={{ minHeight: "100%", background: BG, padding: "28px 32px 60px" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
        <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: ACCENT, marginBottom: 8 }}>
          Lead Pipeline
        </div>
        <h1 className="text-balance" style={{ fontSize: "clamp(26px, 3.4vw, 38px)", fontWeight: 800, color: TP, letterSpacing: "-0.02em", lineHeight: 1.05 }}>
          Квалифицированные лиды
        </h1>
        <p style={{ fontSize: 14, color: TS, marginTop: 8, maxWidth: 620, lineHeight: 1.6 }}>
          Входящие лиды, отфильтрованные AI по выручке и намерению. Оценка, сегмент и статус звонка — в одном представлении.
        </p>
      </motion.div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginTop: 24 }}>
        <StatCard label="Всего лидов"     value={stats.total}     sub={`${filtered.length} показано`}         color={ACCENT}  icon={Users}      delay={0.05} />
        <StatCard label="Звонки назначены" value={stats.booked}    sub={`${Math.round(stats.booked / stats.total * 100)}% конверсия`} color={SUCCESS} icon={Phone}      delay={0.1}  />
        <StatCard label="High-value"       value={stats.highValue} sub="$100K+/мес сегмент"                    color={WARNING} icon={DollarSign} delay={0.15} />
        <StatCard label="Средний AI Score" value={stats.avgScore}  sub="качество базы"                         color="#8b5cf6" icon={Target}     delay={0.2}  />
      </div>

      {/* Distribution funnel */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE, delay: 0.25 }}
        className="surface-card"
        style={{ marginTop: 14, padding: "18px 20px", borderRadius: 16 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <TrendingUp size={13} style={{ color: ACCENT }} />
          <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: TM }}>Распределение по выручке</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {dist.map((d, i) => (
            <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 130, flexShrink: 0, fontSize: 12, color: TS, fontWeight: 600 }}>{d.label}</span>
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${(d.count / maxDist) * 100}%` }}
                  transition={{ duration: 1.2, ease: EASE, delay: 0.4 + i * 0.1 }}
                  style={{ height: "100%", borderRadius: 4, background: d.color }}
                />
              </div>
              <span style={{ width: 28, textAlign: "right", fontFamily: MONO, fontSize: 12, fontWeight: 700, color: d.color, fontVariantNumeric: "tabular-nums" }}>{d.count}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.3 }}
        style={{ marginTop: 24, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}
      >
        {/* search */}
        <div style={{ position: "relative", flex: "1 1 260px", minWidth: 220 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: TM, pointerEvents: "none" }} />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Имя, компания, email, ниша…"
            style={{ width: "100%", height: 42, padding: "0 12px 0 36px", borderRadius: 12, border: `1px solid ${BORD}`, background: "rgba(255,255,255,0.035)", color: TP, fontSize: 13, outline: "none", boxSizing: "border-box" }}
            onFocus={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
            onBlur={e => (e.currentTarget.style.borderColor = BORD)}
          />
        </div>

        {/* booked toggle */}
        <button
          onClick={() => setBookedOnly(v => !v)}
          style={{
            display: "flex", alignItems: "center", gap: 7, height: 42, padding: "0 16px", borderRadius: 12, cursor: "pointer",
            border: `1px solid ${bookedOnly ? SUCCESS + "40" : BORD}`,
            background: bookedOnly ? `${SUCCESS}12` : "transparent",
            color: bookedOnly ? SUCCESS : TS, fontSize: 13, fontWeight: 600,
          }}
        >
          <CheckCircle2 size={14} /> Только с звонком
        </button>

        {/* sort */}
        <div style={{ position: "relative" }}>
          <select
            value={sort} onChange={e => setSort(e.target.value as typeof sort)}
            style={{ height: 42, padding: "0 34px 0 14px", borderRadius: 12, border: `1px solid ${BORD}`, background: "rgba(255,255,255,0.035)", color: TS, fontSize: 13, fontWeight: 600, outline: "none", cursor: "pointer", appearance: "none", WebkitAppearance: "none" }}
          >
            <option value="score" style={{ background: "#14161d" }}>По AI Score</option>
            <option value="revenue" style={{ background: "#14161d" }}>По выручке</option>
            <option value="recent" style={{ background: "#14161d" }}>По дате</option>
          </select>
          <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: TM, pointerEvents: "none" }} />
        </div>
      </motion.div>

      {/* Band filter pills */}
      <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
        {BANDS.map(b => {
          const active = band === b.label;
          return (
            <button
              key={b.label}
              onClick={() => setBand(b.label)}
              style={{
                display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", borderRadius: 10, cursor: "pointer",
                border: `1px solid ${active ? b.color + "50" : BORD}`,
                background: active ? `${b.color}15` : "transparent",
                color: active ? b.color : TS, fontSize: 12.5, fontWeight: 600, transition: "all 0.15s",
              }}
            >
              {b.label === "Все" && <Filter size={12} />}
              {b.label}
            </button>
          );
        })}
      </div>

      {/* Lead grid */}
      {filtered.length > 0 ? (
        <motion.div layout style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
          <AnimatePresence mode="popLayout">
            {filtered.map((lead, i) => <LeadCard key={lead.id} lead={lead} index={i} />)}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div style={{ marginTop: 60, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <Sparkles size={22} style={{ color: ACCENT }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: TS }}>Лиды не найдены</div>
          <div style={{ fontSize: 13, color: TM, marginTop: 4 }}>Измените фильтры или поисковый запрос</div>
        </div>
      )}
    </div>
  );
}
