"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles, TrendingUp, Target, Users, ShieldAlert, CheckCircle2, FileText, MessagesSquare } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

// ─── Данные проекта из localStorage ───────────────────────────────────────────
interface AgentResult {
  role: string; title: string; summary: string; analysis: string;
  facts: string; risks: string; recommendations: string; confidence: string; score: number;
}
interface Project {
  id: string; name: string; description: string; industry: string; stage: string;
  goals: string[]; targetRevenue: string; timeframe: string; score: number;
  revenue: string; market: string; growth: string; aiResults: AgentResult[];
}

const ROLE_COLOR: Record<string, string> = {
  CEO: "#8b5cf6", CFO: "#3b82f6", CMO: "#f43f5e", COO: "#10b981", CTO: "#a78bfa",
  "Business Analyst": "#f59e0b", "Sales Director": "#fb923c", "Legal Advisor": "#94a3b8",
};
const colorOf = (role: string, i: number) =>
  ROLE_COLOR[role] ?? ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#f43f5e", "#22d3ee", "#a78bfa", "#fb923c"][i % 8];

// ─── Count-up число ───────────────────────────────────────────────────────────
function CountUp({ to, suffix = "", duration = 1400, delay = 0 }: { to: number; suffix?: string; duration?: number; delay?: number }) {
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
  return <span ref={ref}>{v}{suffix}</span>;
}

// ─── Большой круговой показатель ──────────────────────────────────────────────
function ScoreGauge({ score }: { score: number }) {
  const R = 82, C = 2 * Math.PI * R;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#6366f1" : "#f59e0b";
  return (
    <div className="sr-gauge">
      <svg width="220" height="220" viewBox="0 0 220 220">
        <defs>
          <linearGradient id="srGauge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle cx="110" cy="110" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
        <motion.circle
          cx="110" cy="110" r={R} fill="none" stroke="url(#srGauge)" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={C} transform="rotate(-90 110 110)"
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C * (1 - score / 100) }}
          transition={{ duration: 1.8, ease: EASE, delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 14px ${color}66)` }}
        />
        {/* тики */}
        {Array.from({ length: 40 }, (_, i) => {
          const a = (i / 40) * Math.PI * 2 - Math.PI / 2;
          return <line key={i} x1={110 + Math.cos(a) * 98} y1={110 + Math.sin(a) * 98} x2={110 + Math.cos(a) * 103} y2={110 + Math.sin(a) * 103} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
        })}
      </svg>
      <div className="sr-gauge-center">
        <div className="sr-gauge-num" style={{ color }}><CountUp to={score} delay={400} duration={1800} /></div>
        <div className="sr-gauge-label">SCORE</div>
      </div>
    </div>
  );
}

// ─── Радар компетенций совета ─────────────────────────────────────────────────
function Radar({ results }: { results: AgentResult[] }) {
  const data = results.slice(0, 6);
  const N = data.length || 6;
  const CX = 140, CY = 130, R = 96;
  const pt = (i: number, r: number) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    return [CX + Math.cos(a) * r, CY + Math.sin(a) * r] as const;
  };
  const poly = data.map((d, i) => pt(i, (d.score / 100) * R).join(",")).join(" ");
  return (
    <svg width="100%" viewBox="0 0 280 265" className="sr-radar">
      {[0.25, 0.5, 0.75, 1].map(k => (
        <polygon key={k} points={Array.from({ length: N }, (_, i) => pt(i, R * k).join(",")).join(" ")}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      ))}
      {data.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />; })}
      <motion.polygon points={poly} fill="rgba(99,102,241,0.18)" stroke="#818cf8" strokeWidth="1.8" strokeLinejoin="round"
        initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
        transition={{ duration: 1, ease: EASE, delay: 0.2 }} style={{ transformOrigin: `${CX}px ${CY}px`, filter: "drop-shadow(0 0 12px rgba(99,102,241,0.35))" }} />
      {data.map((d, i) => {
        const [x, y] = pt(i, (d.score / 100) * R);
        const [lx, ly] = pt(i, R + 18);
        return (
          <g key={i}>
            <motion.circle cx={x} cy={y} r="3.4" fill={colorOf(d.role, i)}
              initial={{ opacity: 0, scale: 0 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.7 + i * 0.08, ease: EASE }} style={{ filter: `drop-shadow(0 0 6px ${colorOf(d.role, i)})` }} />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.55)" fontSize="9.5" fontWeight="600">{d.role}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Прогноз выручки (area chart) ─────────────────────────────────────────────
function RevenueChart({ score, months, target }: { score: number; months: number; target: string }) {
  const pts = useMemo(() => {
    const n = Math.max(6, Math.min(24, months || 12));
    const g = 0.14 + (score / 100) * 0.16;
    const out: number[] = []; let v = 8;
    for (let i = 0; i < n; i++) { out.push(v); v *= 1 + g * (1 - i / (n * 2.2)); }
    return out;
  }, [score, months]);
  const W = 560, H = 190, P = 26;
  const max = Math.max(...pts);
  const X = (i: number) => P + (i / (pts.length - 1)) * (W - P * 2);
  const Y = (v: number) => H - P - (v / max) * (H - P * 2);
  const line = pts.map((v, i) => `${i === 0 ? "M" : "L"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${X(pts.length - 1)},${H - P} L${X(0)},${H - P} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="sr-chart">
      <defs>
        <linearGradient id="srArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(99,102,241,0.34)" /><stop offset="100%" stopColor="rgba(99,102,241,0)" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(k => (
        <line key={k} x1={P} x2={W - P} y1={P + (H - P * 2) * k} y2={P + (H - P * 2) * k} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      <motion.path d={area} fill="url(#srArea)" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.7 }} />
      <motion.path d={line} fill="none" stroke="#818cf8" strokeWidth="2.4" strokeLinecap="round"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.6, ease: EASE, delay: 0.2 }}
        style={{ filter: "drop-shadow(0 0 8px rgba(129,140,248,0.5))" }} />
      <motion.circle cx={X(pts.length - 1)} cy={Y(pts[pts.length - 1])} r="4.5" fill="#818cf8"
        initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 1.7, type: "spring", stiffness: 300, damping: 16 }}
        style={{ filter: "drop-shadow(0 0 10px #818cf8)" }} />
      <text x={X(pts.length - 1) - 6} y={Y(pts[pts.length - 1]) - 12} textAnchor="end" fill="#c7d2fe" fontSize="12" fontWeight="800">{target || "цель"}</text>
      <text x={P} y={H - 7} fill="rgba(255,255,255,0.3)" fontSize="9.5">месяц 1</text>
      <text x={W - P} y={H - 7} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="9.5">месяц {pts.length}</text>
    </svg>
  );
}

// ─── Страница отчёта ──────────────────────────────────────────────────────────
export default function StrategyReportPage() {
  const params = useParams();
  const router = useRouter();
  const reduce = useReducedMotion();
  const id = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    // Try localStorage first (fast path), then API fallback (deep-link support)
    try {
      const all: Project[] = JSON.parse(localStorage.getItem("apex-user-projects") || "[]");
      const p = all.find(x => x.id === id);
      if (p) { setProject(p); return; }
    } catch { /* fall through */ }

    fetch(`/api/projects/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.project) {
          const p = data.project as Project & { ai_results?: AgentResult[]; overall_score?: number };
          setProject({ ...p, score: p.score ?? p.overall_score ?? 0, aiResults: p.aiResults ?? p.ai_results ?? [] });
        } else {
          setMissing(true);
        }
      })
      .catch(() => setMissing(true));
  }, [id]);

  useEffect(() => { if (missing) router.replace("/dashboard/projects"); }, [missing, router]);

  const results = project?.aiResults ?? [];
  const avgConf = useMemo(() => {
    if (!results.length) return 0;
    return Math.round(results.reduce((n, r) => n + r.score, 0) / results.length);
  }, [results]);
  const topRisks = useMemo(
    () => results.filter(r => r.risks && r.risks.length > 10).slice(0, 3),
    [results],
  );

  if (!project) return <div style={{ minHeight: "100vh", background: "#05060A" }} />;

  return (
    <div className="sr-root">
      <div className="sr-ambient" aria-hidden />
      {/* восходящие частицы */}
      {!reduce && (
        <div className="sr-particles" aria-hidden>
          {Array.from({ length: 14 }, (_, i) => (
            <motion.span key={i} className="sr-particle"
              style={{ left: `${6 + (i * 6.6) % 90}%`, background: i % 3 ? "rgba(129,140,248,0.5)" : "rgba(52,211,153,0.4)" }}
              animate={{ y: [0, -560], opacity: [0, 0.7, 0] }}
              transition={{ duration: 9 + (i % 5) * 2, repeat: Infinity, delay: i * 0.9, ease: "linear" }} />
          ))}
        </div>
      )}

      <div className="sr-wrap">
        {/* Hero */}
        <motion.div className="sr-hero" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>
          <div className="sr-ready"><Sparkles size={12} /> СТРАТЕГИЯ ГОТОВА · {results.length} AI-ДИРЕКТОРОВ ПРОАНАЛИЗИРОВАЛИ</div>
          <h1 className="sr-title">{project.name}</h1>
          <p className="sr-sub">{project.industry || "Бизнес"} · {project.stage || "Ранняя стадия"} · горизонт {project.timeframe || "12"} мес.</p>
          <button
            onClick={() => router.push(`/dashboard/executives?ask=${encodeURIComponent(`Обсудите мой проект «${project.name}» (${project.industry || "бизнес"}, стадия: ${project.stage || "ранняя"}). Что улучшить в первую очередь и какие 3 шага сделать?`)}`)}
            style={{ marginTop: 18, display: "inline-flex", alignItems: "center", gap: 9, height: 46, padding: "0 22px", borderRadius: 13, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", fontSize: 14, fontWeight: 700,
              boxShadow: "0 8px 24px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.18)" }}
            onMouseOver={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
            <MessagesSquare size={16} /> Обсудить с советом
          </button>
        </motion.div>

        {/* Gauge + KPI */}
        <div className="sr-topgrid">
          <motion.div className="sr-panel sr-gaugebox" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}>
            <ScoreGauge score={project.score} />
            <div className="sr-gauge-verdict">
              {project.score >= 80 ? "Сильная стратегия — можно запускать" : project.score >= 60 ? "Рабочая стратегия — с точками роста" : "Требует доработки перед запуском"}
            </div>
          </motion.div>

          <div className="sr-kpis">
            {[
              { icon: TrendingUp, label: "Прогноз выручки", value: project.revenue || "—", color: "#10b981", num: null },
              { icon: Target, label: "Объём рынка", value: project.market || "—", color: "#6366f1", num: null },
              { icon: Users, label: "Уверенность совета", value: null, color: "#f59e0b", num: avgConf },
              { icon: ShieldAlert, label: "Рисков найдено", value: null, color: "#f43f5e", num: topRisks.length || results.length },
            ].map((k, i) => (
              <motion.div key={k.label} className="sr-kpi" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.25 + i * 0.09 }}>
                <span className="sr-kpi-ic" style={{ color: k.color, background: `${k.color}18`, borderColor: `${k.color}35` }}><k.icon size={15} /></span>
                <span className="sr-kpi-v" style={{ color: k.color }}>
                  {k.num != null ? <CountUp to={k.num} suffix={k.label === "Уверенность совета" ? "%" : ""} delay={500 + i * 150} /> : k.value}
                </span>
                <span className="sr-kpi-l">{k.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Charts row */}
        <div className="sr-charts">
          <motion.div className="sr-panel" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.6, ease: EASE }}>
            <div className="sr-panel-h">Траектория выручки</div>
            <div className="sr-panel-s">Модель роста от текущей точки к цели {project.targetRevenue || project.revenue}</div>
            <RevenueChart score={project.score} months={parseInt(project.timeframe) || 12} target={project.targetRevenue || project.revenue} />
          </motion.div>
          <motion.div className="sr-panel" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}>
            <div className="sr-panel-h">Оценки совета</div>
            <div className="sr-panel-s">Как каждый директор оценил проект по своей зоне</div>
            <Radar results={results} />
          </motion.div>
        </div>

        {/* Полосы по каждому директору */}
        <motion.div className="sr-panel" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.6, ease: EASE }}>
          <div className="sr-panel-h">Вердикты по направлениям</div>
          <div className="sr-bars">
            {results.map((r, i) => {
              const c = colorOf(r.role, i);
              return (
                <div key={r.role} className="sr-bar">
                  <span className="sr-bar-role" style={{ color: c }}>{r.role}</span>
                  <div className="sr-bar-track">
                    <motion.i initial={{ width: 0 }} whileInView={{ width: `${r.score}%` }} viewport={{ once: true }}
                      transition={{ duration: 1.1, ease: EASE, delay: 0.1 + i * 0.07 }}
                      style={{ background: `linear-gradient(90deg, ${c}88, ${c})`, boxShadow: `0 0 10px ${c}44` }} />
                  </div>
                  <span className="sr-bar-num" style={{ color: c }}><CountUp to={r.score} delay={300 + i * 100} /></span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Карточки анализа */}
        <div className="sr-cards">
          {results.map((r, i) => {
            const c = colorOf(r.role, i);
            return (
              <motion.div key={r.role} className="sr-card" style={{ borderColor: `${c}30` }}
                initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, ease: EASE, delay: Math.min(i * 0.06, 0.4) }} whileHover={{ y: -4 }}>
                <span className="sr-card-spine" style={{ background: c }} />
                <div className="sr-card-top">
                  <span className="sr-card-role" style={{ color: c, background: `${c}16`, borderColor: `${c}40` }}>{r.role}</span>
                  <span className="sr-card-title">{r.title}</span>
                  <span className="sr-card-score" style={{ color: c }}>{r.score}</span>
                </div>
                {r.summary && <p className="sr-card-sum">{r.summary}</p>}
                {r.recommendations && (
                  <div className="sr-card-block">
                    <div className="sr-card-bh" style={{ color: "#34d399" }}><CheckCircle2 size={11} /> Рекомендации</div>
                    <p>{r.recommendations}</p>
                  </div>
                )}
                {r.risks && (
                  <div className="sr-card-block">
                    <div className="sr-card-bh" style={{ color: "#f87171" }}><ShieldAlert size={11} /> Риски</div>
                    <p>{r.risks}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div className="sr-cta" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: EASE }}>
          <Link href={`/dashboard/projects/${project.id}`} className="sr-btn sr-btn-main">
            <FileText size={14} /> Полный отчёт по проекту <ArrowRight size={14} />
          </Link>
          <Link href="/dashboard/new" className="sr-btn sr-btn-ghost">Новая стратегия</Link>
        </motion.div>
      </div>

      <SrStyles />
    </div>
  );
}

function SrStyles() {
  return (
    <style jsx global>{`
      .sr-root { position: relative; min-height: 100vh; background: #05060A; overflow: hidden; }
      .sr-ambient { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: min(1000px, 100%); height: 620px; pointer-events: none;
        background: radial-gradient(52% 55% at 50% 0%, rgba(99,102,241,0.15), transparent 70%); }
      .sr-particles { position: absolute; inset: 0; pointer-events: none; }
      .sr-particle { position: absolute; bottom: -10px; width: 3px; height: 3px; border-radius: 50%; }

      .sr-wrap { position: relative; max-width: 1080px; margin: 0 auto; padding: 48px 24px 80px; }

      .sr-hero { text-align: center; margin-bottom: 30px; }
      .sr-ready { display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-geist-mono), monospace; font-size: 10px; letter-spacing: 0.15em;
        color: rgba(52,211,153,0.95); background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.25); border-radius: 999px; padding: 7px 15px; margin-bottom: 18px; }
      .sr-title { font-size: clamp(28px, 4.5vw, 44px); font-weight: 800; letter-spacing: -0.03em; color: #F3F4F6; margin: 0 0 8px; text-wrap: balance; }
      .sr-sub { font-size: 14px; color: rgba(255,255,255,0.45); margin: 0; }

      .sr-topgrid { display: grid; grid-template-columns: 320px 1fr; gap: 16px; margin-bottom: 16px; }
      .sr-panel { border-radius: 20px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07); padding: 22px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.4), 0 16px 48px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.05); }
      .sr-panel-h { font-size: 15px; font-weight: 800; letter-spacing: -0.01em; color: #E5E7EB; margin-bottom: 3px; }
      .sr-panel-s { font-size: 12px; color: rgba(255,255,255,0.4); margin-bottom: 14px; }

      .sr-gaugebox { display: flex; flex-direction: column; align-items: center; justify-content: center;
        background: linear-gradient(160deg, rgba(99,102,241,0.09), rgba(255,255,255,0.015) 65%); border-color: rgba(99,102,241,0.28); }
      .sr-gauge { position: relative; }
      .sr-gauge-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      .sr-gauge-num { font-size: 52px; font-weight: 800; letter-spacing: -0.04em; font-variant-numeric: tabular-nums; line-height: 1; }
      .sr-gauge-label { font-family: var(--font-geist-mono), monospace; font-size: 10px; letter-spacing: 0.3em; color: rgba(255,255,255,0.35); margin-top: 6px; }
      .sr-gauge-verdict { margin-top: 6px; font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,0.65); text-align: center; }

      .sr-kpis { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .sr-kpi { display: flex; flex-direction: column; gap: 6px; padding: 18px; border-radius: 18px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07);
        box-shadow: 0 1px 2px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04); }
      .sr-kpi-ic { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 10px; border: 1px solid; }
      .sr-kpi-v { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
      .sr-kpi-l { font-size: 11.5px; color: rgba(255,255,255,0.42); }

      .sr-charts { display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; margin-bottom: 16px; }
      .sr-chart, .sr-radar { display: block; }

      .sr-bars { display: flex; flex-direction: column; gap: 10px; }
      .sr-bar { display: flex; align-items: center; gap: 12px; }
      .sr-bar-role { width: 110px; flex-shrink: 0; font-family: var(--font-geist-mono), monospace; font-size: 10.5px; font-weight: 700; letter-spacing: 0.04em; text-align: right; }
      .sr-bar-track { flex: 1; height: 8px; border-radius: 5px; background: rgba(255,255,255,0.05); overflow: hidden; }
      .sr-bar-track i { display: block; height: 100%; border-radius: 5px; }
      .sr-bar-num { width: 30px; flex-shrink: 0; font-size: 12px; font-weight: 800; font-variant-numeric: tabular-nums; }

      .sr-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; margin-top: 16px; }
      .sr-card { position: relative; overflow: hidden; border-radius: 18px; padding: 18px 18px 16px 21px; background: rgba(255,255,255,0.025); border: 1px solid;
        box-shadow: 0 1px 2px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04); transition: box-shadow .25s; }
      .sr-card:hover { box-shadow: 0 14px 44px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06); }
      .sr-card-spine { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; opacity: 0.9; }
      .sr-card-top { display: flex; align-items: center; gap: 9px; margin-bottom: 10px; }
      .sr-card-role { font-family: var(--font-geist-mono), monospace; font-size: 9.5px; font-weight: 800; letter-spacing: 0.08em; padding: 3px 8px; border-radius: 7px; border: 1px solid; flex-shrink: 0; }
      .sr-card-title { flex: 1; min-width: 0; font-size: 11.5px; color: rgba(255,255,255,0.45); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .sr-card-score { font-size: 18px; font-weight: 800; font-variant-numeric: tabular-nums; flex-shrink: 0; }
      .sr-card-sum { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.75); margin: 0 0 12px; }
      .sr-card-block { margin-bottom: 10px; }
      .sr-card-bh { display: flex; align-items: center; gap: 6px; font-family: var(--font-geist-mono), monospace; font-size: 9.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 5px; }
      .sr-card-block p { font-size: 12px; line-height: 1.6; color: rgba(255,255,255,0.55); margin: 0; white-space: pre-wrap; }

      .sr-cta { display: flex; gap: 10px; justify-content: center; margin-top: 34px; flex-wrap: wrap; }
      .sr-btn { display: inline-flex; align-items: center; gap: 8px; height: 48px; padding: 0 22px; border-radius: 14px; font-size: 13.5px; font-weight: 700; text-decoration: none; transition: transform .15s; }
      .sr-btn:hover { transform: translateY(-1px); }
      .sr-btn-main { color: #fff; background: linear-gradient(135deg, #6366f1, #4f46e5); box-shadow: 0 4px 18px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.18); }
      .sr-btn-ghost { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); }

      @media (max-width: 900px) {
        .sr-topgrid, .sr-charts { grid-template-columns: 1fr; }
        .sr-kpis { grid-template-columns: 1fr 1fr; }
        .sr-bar-role { width: 84px; font-size: 9.5px; }
      }
      @media (prefers-reduced-motion: reduce) { .sr-particle { display: none; } }
    `}</style>
  );
}
