"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Share2, Download, Plus, FileText, FileSpreadsheet, Presentation,
  CalendarClock, Copy, ChevronRight,
} from "lucide-react";

// ─── Demo report data ─────────────────────────────────────────────────────────
const KPI = [
  { l: "Потенциал выручки", v: "$2.4M", s: "+78% к текущей", c: "#818cf8", pts: [20, 26, 24, 34, 31, 42, 40, 52, 49, 62, 60, 74] },
  { l: "Прогноз ROI",       v: "186%",  s: "за 12 месяцев",  c: "#34d399", pts: [30, 34, 33, 40, 45, 43, 52, 58, 56, 66, 72, 80] },
  { l: "Объём рынка",       v: "$8.7B", s: "TAM сегмента",    c: "#60a5fa", pts: [40, 42, 45, 44, 50, 53, 52, 58, 62, 61, 68, 72] },
  { l: "Срок внедрения",    v: "90 дней", s: "до полного запуска", c: "#fbbf24", pts: [70, 66, 62, 60, 55, 50, 46, 42, 38, 33, 28, 22] },
];

const FINDINGS = [
  { i: "▲", c: "#34d399", t: "Сильная рыночная возможность", d: "Рынок e-commerce растёт на 23% в год с растущим спросом в вашей категории.", impact: "Высокий" },
  { i: "◆", c: "#818cf8", t: "Конкурентное преимущество",     d: "Уникальное ценностное предложение и качество создают значимый ров.",        impact: "Высокий" },
  { i: "◷", c: "#fbbf24", t: "Оптимальный момент",            d: "Условия рынка идеальны: конкуренция ниже, спрос выше.",                     impact: "Средний" },
  { i: "◼", c: "#fb923c", t: "Требования к ресурсам",         d: "Успех требует инвестиций в технологии и маркетинг.",                        impact: "Средний" },
];

const TIMELINE = [
  { w: "Недели 1–2",  t: "Планирование и настройка", d: "Требования и инфраструктура", c: "#818cf8" },
  { w: "Недели 3–6",  t: "Разработка",               d: "Сборка и тест ключевого функционала", c: "#34d399" },
  { w: "Недели 7–10", t: "Выход на рынок",           d: "Запуск кампании и привлечение", c: "#60a5fa" },
  { w: "Недели 11–12",t: "Оптимизация",              d: "Анализ результатов и улучшение", c: "#fbbf24" },
];

const ACTIONS = [
  { icon: FileText,        l: "Экспорт в PDF",        act: "print" },
  { icon: Presentation,    l: "Экспорт в PowerPoint", act: "soon" },
  { icon: FileSpreadsheet, l: "Экспорт в Excel",      act: "soon" },
  { icon: Share2,          l: "Поделиться отчётом",   act: "soon" },
  { icon: CalendarClock,   l: "Запланировать отчёт",  act: "soon" },
  { icon: Copy,            l: "Дублировать отчёт",    act: "soon" },
];

const AI_INSIGHTS = [
  { c: "#34d399", t: "Возможность выручки", d: "Экспансия может принести $2.4M дополнительной выручки." },
  { c: "#818cf8", t: "Тренд рынка",          d: "Анализ показывает рост 23% в вашем целевом сегменте." },
  { c: "#fbbf24", t: "Оценка риска",         d: "Низкий уровень риска при сильной валидации рынка." },
];

const INFO: [string, string][] = [
  ["Тип отчёта", "Стратегический"],
  ["Источники данных", "23 источника"],
  ["AI-агентов", "20 специалистов"],
  ["Время анализа", "18 минут"],
  ["Обновлён", "10 июля 2026, 14:30"],
];

const COMMENTS = [
  { ab: "SJ", c: "#818cf8", n: "Sarah Johnson", time: "2ч назад",  t: "Отличный анализ! Рыночные инсайты особенно ценны." },
  { ab: "MC", c: "#34d399", n: "Mike Chen",     time: "4ч назад",  t: "Финансовые прогнозы выглядят обоснованно. Согласен с подходом." },
  { ab: "ED", c: "#fbbf24", n: "Emma Davis",    time: "1д назад",  t: "Очень полный отчёт. Готова двигаться дальше!" },
];

const TABS = ["Резюме", "Ключевые выводы", "Рекомендация", "Таймлайн"];

// ─── Small pieces ─────────────────────────────────────────────────────────────
function MiniChart({ pts, c }: { pts: number[]; c: string }) {
  const W = 150, H = 44;
  const max = Math.max(...pts), min = Math.min(...pts);
  const x = (i: number) => (i / (pts.length - 1)) * (W - 4) + 2;
  const y = (v: number) => H - 4 - ((v - min) / (max - min)) * (H - 10);
  const d = pts.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <path d={`${d} L${x(pts.length - 1)},${H} L2,${H} Z`} fill={`${c}16`} />
      <motion.path d={d} fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
        transition={{ duration: 1.3, ease: "easeOut" }} />
    </svg>
  );
}

function useCountUp(to: number, dur = 1300) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0; let t0: number | null = null;
    const step = (ts: number) => {
      if (t0 === null) t0 = ts;
      const p = Math.min((ts - t0) / dur, 1);
      setV(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, dur]);
  return v;
}

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.025)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
  boxShadow: "0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)",
};

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const [tab, setTab] = useState(0);
  const conf = useCountUp(94, 1400);
  const r = 40, circ = 2 * Math.PI * r;

  const title = decodeURIComponent(params?.id ?? "") === "demo"
    ? "Q2 Growth Strategy Report"
    : "Q2 Growth Strategy Report";

  const scrollTo = (i: number) => {
    setTab(i);
    document.getElementById(`rep-sec-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ padding: "22px 24px 56px", maxWidth: 1440, margin: "0 auto" }}>
      {/* Breadcrumb */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="term-mono"
        style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>
        <Link href="/dashboard/reports" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>reports</Link>
        <span style={{ color: "rgba(124,58,237,0.6)" }}>/</span>
        <span style={{ color: "rgba(255,255,255,0.7)" }}>q2-growth-strategy</span>
      </motion.div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, marginBottom: 14 }}>
        <div>
          <h1 style={{ fontSize: 27, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", margin: "0 0 10px" }}>{title}</h1>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="term-mono" style={{ fontSize: 10, padding: "4px 10px", borderRadius: 7, background: "rgba(124,58,237,.1)", border: "1px solid rgba(124,58,237,.28)", color: "#a5b4fc" }}>E-commerce Expansion</span>
            <span className="term-mono" style={{ fontSize: 10, padding: "4px 10px", borderRadius: 7, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", color: "rgba(255,255,255,.5)" }}>Создан 10 июля 2026</span>
            <span className="term-mono" style={{ fontSize: 10, padding: "4px 10px", borderRadius: 7, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", color: "rgba(255,255,255,.5)" }}>AI-команда · 20 агентов</span>
            <span className="term-mono" style={{ fontSize: 10, padding: "4px 10px", borderRadius: 7, background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.3)", color: "#34d399" }}>✓ Завершён</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 7, height: 36, padding: "0 15px", borderRadius: 10, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.65)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <Download size={13} /> Экспорт
          </button>
          <Link href="/dashboard/new" style={{ display: "flex", alignItems: "center", gap: 7, height: 36, padding: "0 15px", borderRadius: 10, background: "linear-gradient(135deg,#7C3AED,#6D28D9)", color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 14px rgba(124,58,237,.3)" }}>
            <Plus size={13} /> Новый отчёт
          </Link>
        </div>
      </motion.div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 18, overflowX: "auto" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => scrollTo(i)} style={{
            padding: "10px 16px", fontSize: 12.5, fontWeight: 600, border: "none", background: "transparent", cursor: "pointer", whiteSpace: "nowrap",
            color: tab === i ? "#fff" : "rgba(255,255,255,0.35)",
            borderBottom: tab === i ? "2px solid #7C3AED" : "2px solid transparent", marginBottom: -1,
          }}>{t}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px]" style={{ gap: 16 }}>
        {/* ── Main ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>

          {/* Executive summary */}
          <motion.div id="rep-sec-0" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            style={{ ...card, padding: 22, scrollMarginTop: 80 }}>
            <div className="term-mono" style={{ fontSize: 10.5, letterSpacing: ".16em", color: "#a5b4fc", marginBottom: 10 }}>// РЕЗЮМЕ ДЛЯ РУКОВОДСТВА</div>
            <p style={{ fontSize: 13.5, color: "rgba(255,255,255,.62)", lineHeight: 1.75, margin: "0 0 18px", maxWidth: 640 }}>
              AI-команда завершила комплексный анализ стратегии экспансии e-commerce. На основе исследования рынка,
              финансового моделирования и конкурентного анализа мы выявили значимые возможности роста и чёткий путь
              к увеличению выручки на 78% в следующие 12 месяцев.
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 10 }}>
              {KPI.map((k, i) => (
                <motion.div key={k.l} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08 }}
                  style={{ borderRadius: 12, padding: "13px 14px 8px", background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.07)" }}>
                  <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.45)", marginBottom: 6 }}>{k.l}</div>
                  <div className="term-value" style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{k.v}</div>
                  <div style={{ fontSize: 9.5, color: k.c, margin: "5px 0 6px" }}>{k.s}</div>
                  <MiniChart pts={k.pts} c={k.c} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Key findings */}
          <motion.div id="rep-sec-1" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            style={{ ...card, padding: 22, scrollMarginTop: 80 }}>
            <div className="term-mono" style={{ fontSize: 10.5, letterSpacing: ".16em", color: "#a5b4fc", marginBottom: 14 }}>// КЛЮЧЕВЫЕ ВЫВОДЫ</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {FINDINGS.map((f, i) => (
                <motion.div key={f.t} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                  style={{ display: "flex", alignItems: "center", gap: 13, borderRadius: 12, padding: "13px 15px", background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)" }}>
                  <span style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, background: `${f.c}14`, border: `1px solid ${f.c}40`, color: f.c }}>{f.i}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{f.t}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "rgba(255,255,255,.45)", lineHeight: 1.5 }}>{f.d}</span>
                  </span>
                  <span className="term-mono" style={{ flexShrink: 0, fontSize: 9, fontWeight: 700, letterSpacing: ".08em", padding: "4px 10px", borderRadius: 7, background: f.impact === "Высокий" ? "rgba(52,211,153,.12)" : "rgba(251,191,36,.12)", border: `1px solid ${f.impact === "Высокий" ? "rgba(52,211,153,.35)" : "rgba(251,191,36,.35)"}`, color: f.impact === "Высокий" ? "#34d399" : "#fbbf24" }}>
                    {f.impact} импакт
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recommendation */}
          <motion.div id="rep-sec-2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
            style={{ ...card, padding: 22, scrollMarginTop: 80 }}>
            <div className="term-mono" style={{ fontSize: 10.5, letterSpacing: ".16em", color: "#a5b4fc", marginBottom: 10 }}>// РЕКОМЕНДАЦИЯ AI-КОМАНДЫ</div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,.6)", lineHeight: 1.7, margin: "0 0 18px", maxWidth: 640 }}>
              На основе комплексного анализа мы настоятельно рекомендуем продолжить стратегию экспансии.
              Прогнозируемый ROI 186% с потенциалом выручки $2.4M делает это приоритетной инициативой.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr]" style={{ gap: 16, alignItems: "center" }}>
              {/* confidence ring */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 14, background: "rgba(52,211,153,.05)", border: "1px solid rgba(52,211,153,.2)" }}>
                <div style={{ position: "relative", width: 92, height: 92, flexShrink: 0 }}>
                  <svg width={92} height={92} style={{ transform: "rotate(-90deg)" }}>
                    <circle cx={46} cy={46} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={7} />
                    <motion.circle cx={46} cy={46} r={r} fill="none" stroke="#34d399" strokeWidth={7} strokeLinecap="round"
                      initial={{ strokeDasharray: `0 ${circ}` }} animate={{ strokeDasharray: `${0.94 * circ} ${circ}` }}
                      transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }} />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="term-value" style={{ fontSize: 21, fontWeight: 800, color: "#34d399" }}>{conf}%</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", lineHeight: 1.5, maxWidth: 140 }}>
                  Уверенность совета на основе данных и рыночных условий
                </div>
              </div>
              {/* action */}
              <div style={{ padding: "16px 18px", borderRadius: 14, background: "rgba(124,58,237,.06)", border: "1px solid rgba(124,58,237,.25)" }}>
                <div className="term-mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "rgba(255,255,255,.4)", marginBottom: 6 }}>РЕКОМЕНДУЕМОЕ ДЕЙСТВИЕ</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Продолжить экспансию</div>
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.45)", marginBottom: 10 }}>Внедрить 90-дневный план с приоритетом на:</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {["Стратегия проникновения на рынок", "Технологическая инфраструктура", "Запуск маркетинговой кампании"].map(x => (
                    <div key={x} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,.65)" }}>
                      <span style={{ color: "#34d399", fontSize: 11 }}>✓</span>{x}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Timeline */}
          <motion.div id="rep-sec-3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            style={{ ...card, padding: 22, scrollMarginTop: 80 }}>
            <div className="term-mono" style={{ fontSize: 10.5, letterSpacing: ".16em", color: "#a5b4fc", marginBottom: 18 }}>// ТАЙМЛАЙН СЛЕДУЮЩИХ ШАГОВ</div>
            <div style={{ overflowX: "auto", paddingBottom: 4 }}>
              <div style={{ display: "flex", minWidth: 640 }}>
                {TIMELINE.map((s, i) => (
                  <div key={s.w} style={{ flex: 1, position: "relative", paddingRight: i < TIMELINE.length - 1 ? 14 : 0 }}>
                    {/* connector */}
                    {i < TIMELINE.length - 1 && (
                      <div style={{ position: "absolute", top: 15, left: 40, right: -6, height: 2, background: `linear-gradient(90deg, ${s.c}66, ${TIMELINE[i + 1].c}66)` }} />
                    )}
                    <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.12, type: "spring", stiffness: 300, damping: 18 }}
                      style={{ width: 32, height: 32, borderRadius: 10, background: `${s.c}18`, border: `1.5px solid ${s.c}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, position: "relative", zIndex: 1 }}>
                      <span className="term-mono" style={{ fontSize: 11, fontWeight: 800, color: s.c }}>{i + 1}</span>
                    </motion.div>
                    <div className="term-mono" style={{ fontSize: 9, letterSpacing: ".08em", color: s.c, marginBottom: 4 }}>{s.w.toUpperCase()}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{s.t}</div>
                    <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.4)", lineHeight: 1.5, maxWidth: 170 }}>{s.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Right rail ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Actions */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} style={{ ...card, padding: 16 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fff", marginBottom: 12, paddingLeft: 4 }}>Действия с отчётом</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {ACTIONS.map(a => {
                const Icon = a.icon;
                return (
                  <button key={a.l} onClick={() => a.act === "print" && window.print()} style={{
                    display: "flex", alignItems: "center", gap: 10, height: 38, padding: "0 10px", borderRadius: 10,
                    border: "none", background: "transparent", cursor: a.act === "print" ? "pointer" : "default",
                    color: "rgba(255,255,255,.6)", fontSize: 12, fontWeight: 600, textAlign: "left", transition: "background .15s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.04)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <Icon size={14} style={{ color: "#818cf8", flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{a.l}</span>
                    {a.act === "soon" && <span className="term-mono" style={{ fontSize: 7.5, letterSpacing: ".08em", padding: "2px 6px", borderRadius: 5, background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.35)" }}>СКОРО</span>}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* AI insights */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 }} style={{ ...card, padding: 18 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fff", marginBottom: 12 }}>✦ AI-инсайты</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {AI_INSIGHTS.map(x => (
                <div key={x.t} style={{ borderLeft: `2px solid ${x.c}`, paddingLeft: 11 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{x.t}</div>
                  <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.42)", lineHeight: 1.5 }}>{x.d}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} style={{ ...card, padding: 18 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fff", marginBottom: 12 }}>Информация об отчёте</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {INFO.map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>{k}</span>
                  <span className="term-mono" style={{ fontSize: 10.5, color: "rgba(255,255,255,.7)", textAlign: "right" }}>{v}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Comments */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.38 }} style={{ ...card, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: "#fff" }}>Комментарии ({COMMENTS.length})</span>
              <span className="term-mono" style={{ fontSize: 7.5, letterSpacing: ".08em", padding: "2px 6px", borderRadius: 5, background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.35)" }}>СКОРО</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {COMMENTS.map(cm => (
                <div key={cm.n} style={{ display: "flex", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 9, flexShrink: 0, background: `${cm.c}1c`, border: `1px solid ${cm.c}50`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="term-mono" style={{ fontSize: 9, fontWeight: 800, color: cm.c }}>{cm.ab}</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,.85)" }}>{cm.n}</span>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,.28)" }}>{cm.time}</span>
                    </div>
                    <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.45)", lineHeight: 1.5, marginTop: 2 }}>{cm.t}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <Link href="/dashboard/reports" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 38, borderRadius: 10, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)", color: "rgba(255,255,255,.5)", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
            Все отчёты <ChevronRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
