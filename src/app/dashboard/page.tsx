"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import {
  Zap, TrendingUp, Target, Shield, ChevronRight, ArrowUpRight,
  Brain, DollarSign, Cpu, Globe, Lightbulb, Activity, Users,
  BarChart2, FileText, Rocket, Star, AlertTriangle,
  CheckCircle, ExternalLink, MessageSquare,
} from "lucide-react";
import { EngagementPanel, markVisit } from "@/components/dashboard/EngagementPanel";

// ─── Design tokens ──────────────────────────────────────────────────────────
const ACCENT     = "#6366f1";
const ACCENT_RGB = "99,102,241";
const SUCCESS    = "#10b981";
const WARNING    = "#f59e0b";
const DANGER     = "#ef4444";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Project {
  id: string; name: string; description: string | null;
  overall_score: number; status: string; created_at: string;
  target_revenue: string | null; ai_results: unknown[];
}

// ─── Static data ──────────────────────────────────────────────────────────────
const DEMO_PROJECTS: Project[] = [
  { id: "demo", name: "AI-Powered Fitness App", description: "Мобильное приложение с AI-персонализацией тренировок", overall_score: 87, status: "active", created_at: new Date(Date.now() - 7200000).toISOString(), target_revenue: "$2.4M", ai_results: [1,2,3] },
  { id: "2",    name: "SaaS Invoice Platform",  description: "Автоматизированное выставление счетов для фрилансеров", overall_score: 91, status: "active", created_at: new Date(Date.now() - 86400000).toISOString(), target_revenue: "$1.8M", ai_results: [1,2,3] },
];

const EXECUTIVES = [
  { role: "CEO", name: "Sophia Rivers", title: "Chief Strategy AI", specialty: "Стратегия & Видение",    color: "#6366f1", rgb: "99,102,241",  confidence: 94, tasks: 12, icon: Brain,      slug: "ceo" },
  { role: "CFO", name: "Marcus Chen",   title: "Finance AI",         specialty: "Финансы & Модели",       color: "#3b82f6", rgb: "59,130,246",  confidence: 89, tasks: 8,  icon: DollarSign, slug: "cfo" },
  { role: "CMO", name: "Elena Torres",  title: "Growth AI",          specialty: "Маркетинг & Рост",       color: "#10b981", rgb: "16,185,129",  confidence: 91, tasks: 15, icon: TrendingUp, slug: "cmo" },
  { role: "COO", name: "James Wright",  title: "Operations AI",      specialty: "Операции & Процессы",    color: "#f59e0b", rgb: "245,158,11",  confidence: 86, tasks: 10, icon: Activity,   slug: "coo" },
  { role: "CTO", name: "Park Aiden",    title: "Technology AI",      specialty: "Технологии & Архитект.", color: "#8b5cf6", rgb: "139,92,246",  confidence: 92, tasks: 9,  icon: Cpu,        slug: "cto" },
];

const AI_INSIGHTS = [
  { type: "opportunity", icon: TrendingUp,    color: SUCCESS, title: "Новый рыночный сегмент",  desc: "Корпоративный B2B рынок показывает 340% рост спроса в вашей нише. Потенциал: $4.2M ARR.", prob: 84, impact: "Высокий", growth: "+$4.2M" },
  { type: "threat",      icon: AlertTriangle, color: DANGER,  title: "Конкурент привлёк $15M",  desc: "FitAI Labs закрыла раунд Series A. Агрессивная экспансия в вашу целевую аудиторию.",        prob: 67, impact: "Средний", growth: "-12%" },
  { type: "action",      icon: Lightbulb,     color: WARNING, title: "Повысьте цену на 23%",    desc: "Анализ рынка показывает недооценку продукта. Увеличение до $49/мес не снизит конверсию.",  prob: 78, impact: "Высокий", growth: "+$680K" },
  { type: "opportunity", icon: Globe,         color: SUCCESS, title: "Выход на рынок EU",        desc: "GDPR-совместимая инфраструктура готова. Германия и Нидерланды — первые целевые рынки.",    prob: 71, impact: "Высокий", growth: "+$1.8M" },
];

const ACTIVITY = [
  { icon: CheckCircle, color: SUCCESS, label: "Стратегический анализ завершён",   sub: "Fitness App · 94 балла",       time: "2м назад"  },
  { icon: Globe,       color: ACCENT,  label: "Обнаружен новый конкурент",         sub: "FitAI Labs · $15M funding",    time: "18м назад" },
  { icon: DollarSign,  color: ACCENT,  label: "Финансовая модель обновлена",       sub: "Q2 прогноз пересмотрен вверх", time: "1ч назад"  },
  { icon: FileText,    color: ACCENT,  label: "Investor Report сформирован",       sub: "PDF · 48 страниц",             time: "3ч назад"  },
  { icon: Brain,       color: ACCENT,  label: "Симуляция рынка завершена",         sub: "Точность 91% · 10K сценариев", time: "5ч назад"  },
];

const QUICK_ACTIONS = [
  { label: "Новый анализ",  href: "/dashboard/new",        icon: Zap,      desc: "Запустить AI-команду" },
  { label: "AI Чат",        href: "/dashboard/chat",       icon: Brain,    desc: "Спросить совет" },
  { label: "Отчёты",        href: "/dashboard/reports",    icon: FileText, desc: "Все анализы" },
  { label: "Исп. совет",    href: "/dashboard/executives", icon: Users,    desc: "AI-директора" },
];

// ─── Neural Visualization (Canvas) ───────────────────────────────────────────
function NeuralViz() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const BW = 450, BH = 260;
    const nodes = [
      { x: 50,  y: 50,  r: 5   }, { x: 200, y: 30,  r: 3.5 }, { x: 340, y: 70,  r: 4   },
      { x: 120, y: 120, r: 3   }, { x: 260, y: 110, r: 4.5 }, { x: 400, y: 140, r: 3   },
      { x: 80,  y: 190, r: 3.5 }, { x: 220, y: 195, r: 3   }, { x: 370, y: 210, r: 4   },
    ];
    const edges: [number, number][] = [
      [0,1],[1,2],[0,3],[1,4],[2,4],[3,4],[4,5],[3,6],[6,7],[7,8],[4,7],[5,8],[1,3],[2,5],
    ];

    let raf = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width  = rect.width  * dpr;
      canvas!.height = rect.height * dpr;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Pre-render node sprite
    const sprite = document.createElement("canvas");
    const SP = 40;
    sprite.width = SP; sprite.height = SP;
    const sctx = sprite.getContext("2d")!;
    const g = sctx.createRadialGradient(SP/2, SP/2, 0, SP/2, SP/2, SP/2);
    g.addColorStop(0, "rgba(99,102,241,0.9)");
    g.addColorStop(1, "rgba(99,102,241,0)");
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, SP, SP);

    function draw(t: number) {
      const rect = canvas!.getBoundingClientRect();
      const sx = rect.width / BW, sy = rect.height / BH;
      ctx!.setTransform(dpr * sx, 0, 0, dpr * sy, 0, 0);
      ctx!.clearRect(0, 0, BW, BH);

      const pos = nodes.map((n, i) => ({
        x: n.x + (reduced ? 0 : Math.sin(t / 1700 + i * 1.7) * 4),
        y: n.y + (reduced ? 0 : Math.cos(t / 2100 + i * 2.3) * 3.5),
      }));

      // edges
      ctx!.globalCompositeOperation = "source-over";
      ctx!.strokeStyle = "rgba(99,102,241,0.22)";
      ctx!.lineWidth = 0.8;
      for (const [a, b] of edges) {
        ctx!.beginPath();
        ctx!.moveTo(pos[a].x, pos[a].y);
        ctx!.lineTo(pos[b].x, pos[b].y);
        ctx!.stroke();
      }

      // particles
      ctx!.globalCompositeOperation = "lighter";
      if (!reduced) {
        edges.forEach(([a, b], i) => {
          const dur = 2200 + i * 320;
          const p = ((t + i * 350) % dur) / dur;
          const px = pos[a].x + (pos[b].x - pos[a].x) * p;
          const py = pos[a].y + (pos[b].y - pos[a].y) * p;
          ctx!.drawImage(sprite, px - 6, py - 6, 12, 12);
        });
      }

      // nodes
      nodes.forEach((n, i) => {
        const pulse = reduced ? n.r : n.r + Math.sin(t / 600 + n.x) * n.r * 0.25;
        ctx!.drawImage(sprite, pos[i].x - pulse * 2.4, pos[i].y - pulse * 2.4, pulse * 4.8, pulse * 4.8);
      });

      if (!reduced) raf = requestAnimationFrame(draw);
    }

    if (reduced) draw(0);
    else raf = requestAnimationFrame(draw);

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
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

// ─── Mini sparkline ───────────────────────────────────────────────────────────
function MiniSparkline({ color, data }: { color: string; data: number[] }) {
  const W = 64, H = 20, n = data.length;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => ({ x: (i / (n-1)) * W, y: H - ((v - min) / (max - min + 0.001)) * H }));
  const d = pts.map((p, i) => i === 0 ? `M${p.x.toFixed(1)},${p.y.toFixed(1)}` : `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[n-1].x} cy={pts[n-1].y} r="2.5" fill={color} />
    </svg>
  );
}

// ─── KPI Chip ─────────────────────────────────────────────────────────────────
function KpiChip({ icon: Icon, label, value, suffix, color, delay }: {
  icon: React.ElementType; label: string; value: number; suffix: string; color: string; delay: number;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate-hover={{ y: hovered ? -3 : 0 }}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 16px", borderRadius: 14, cursor: "default",
        background: hovered ? `rgba(${color === SUCCESS ? "16,185,129" : color === DANGER ? "239,68,68" : color === WARNING ? "245,158,11" : ACCENT_RGB},0.1)` : "rgba(255,255,255,0.04)",
        border: `1px solid ${hovered ? `${color}40` : "rgba(255,255,255,0.08)"}`,
        boxShadow: hovered ? `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${color}20` : "none",
        transition: "all 0.22s ease",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
        background: `${color}15`, border: `1px solid ${color}25`,
        transition: "transform 0.22s ease",
        transform: hovered ? "scale(1.1)" : "scale(1)",
      }}>
        <Icon size={14} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
          <Counter to={value} suffix={suffix} />
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", marginTop: 2, whiteSpace: "nowrap" }}>{label}</div>
      </div>
    </motion.div>
  );
}

// ─── CTA Button ───────────────────────────────────────────────────────────────
function CtaButton({ href, primary, icon: Icon, label }: {
  href: string; primary?: boolean; icon: React.ElementType; label: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        height: 46, padding: "0 22px", borderRadius: 13, fontSize: 13.5,
        fontWeight: 700, textDecoration: "none", position: "relative", overflow: "hidden",
        transition: "all 0.22s ease",
        ...(primary
          ? {
              background: hovered
                ? "linear-gradient(135deg, #7c7ff3, #5855e8)"
                : `linear-gradient(135deg, ${ACCENT}, #4f46e5)`,
              color: "#fff",
              boxShadow: hovered
                ? "0 12px 40px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.2)"
                : "0 4px 16px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.16)",
              transform: hovered ? "translateY(-2px)" : "translateY(0)",
            }
          : {
              background: hovered ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
              color: hovered ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.6)",
              border: `1px solid ${hovered ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.1)"}`,
              transform: hovered ? "translateY(-2px)" : "translateY(0)",
            }),
      }}
    >
      {primary && hovered && (
        <span style={{
          position: "absolute", inset: 0, borderRadius: 13,
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)",
          animation: "shimmer 0.6s ease forwards",
          pointerEvents: "none",
        }} />
      )}
      <Icon size={15} />
      {label}
    </Link>
  );
}

// ─── Project card ─────────────────────────────────────────────────────────────
const PROJECT_SCORES_DATA = [
  [55, 60, 68, 72, 79, 83, 87],
  [62, 70, 74, 82, 86, 89, 91],
];

function ProjectCard({ p, i }: { p: Project; i: number }) {
  const [hovered, setHovered] = useState(false);
  const scoreColor = p.overall_score >= 85 ? SUCCESS : p.overall_score >= 75 ? WARNING : DANGER;
  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{ y: hovered ? -6 : 0, scale: hovered ? 1.01 : 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{
        borderRadius: 16, overflow: "hidden",
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? `rgba(${ACCENT_RGB},0.25)` : "rgba(255,255,255,0.07)"}`,
        boxShadow: hovered
          ? "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.045)"
          : "0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.045)",
        transition: "border-color 0.28s, box-shadow 0.28s",
        cursor: "pointer",
      }}
    >
      <div className="h-24 relative overflow-hidden" style={{ background: `linear-gradient(135deg, rgba(${ACCENT_RGB},0.18), rgba(79,70,229,0.06))` }}>
        <div className="absolute bottom-3 left-4 flex items-center gap-2">
          <div className="size-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <Rocket size={14} style={{ color: "rgba(255,255,255,0.7)" }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.6)", background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)", padding: "3px 8px", borderRadius: 6 }}>
            {p.status === "active" ? "● Активен" : "⏸ Пауза"}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <MiniSparkline color={scoreColor} data={PROJECT_SCORES_DATA[i % 2]} />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{p.name}</h3>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", lineHeight: 1.5 }}>{p.description}</p>
          </div>
          <div className="text-right flex-shrink-0 ml-3">
            <div style={{ fontSize: 22, fontWeight: 800, color: scoreColor, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{p.overall_score}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>AI Score</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 mb-3">
          {[
            { label: "ARR",    value: p.target_revenue ?? "—", color: SUCCESS },
            { label: "Health", value: `${p.overall_score}%`,   color: ACCENT },
            { label: "Stage",  value: "Growth",                 color: "rgba(255,255,255,0.7)" },
          ].map(m => (
            <div key={m.label} className="text-center p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>
        <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginBottom: 12, overflow: "hidden" }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${p.overall_score}%` }} transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
            style={{ height: "100%", borderRadius: 2, background: scoreColor }} />
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/projects/${p.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 font-semibold text-white transition-all hover:-translate-y-px"
            style={{ height: 30, borderRadius: 9, fontSize: 11, background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)" }}>
            <ArrowUpRight size={11} /> Открыть
          </Link>
          <Link href="/dashboard/reports"
            className="flex items-center justify-center gap-1.5 transition-all hover:bg-white/[0.08]"
            style={{ height: 30, padding: "0 12px", borderRadius: 9, fontSize: 11, color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <FileText size={11} /> Отчёт
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Executive card ───────────────────────────────────────────────────────────
const EXEC_SPARKLINES: Record<string, number[]> = {
  CEO: [70, 74, 79, 82, 88, 91, 94],
  CFO: [65, 68, 73, 78, 83, 87, 89],
  CMO: [60, 67, 75, 80, 85, 88, 91],
  COO: [72, 75, 78, 80, 83, 85, 86],
  CTO: [68, 74, 80, 84, 87, 90, 92],
};

function ExecCard({ exec }: { exec: typeof EXECUTIVES[number] }) {
  const [hovered, setHovered] = useState(false);
  const Icon = exec.icon;
  return (
    <Link href={`/dashboard/chat?agent=${exec.slug}`} style={{ display: "block" }}>
      <motion.div
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        animate={{ y: hovered ? -8 : 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        style={{
          borderRadius: 16, padding: "18px 16px",
          background: hovered
            ? `linear-gradient(145deg, rgba(${exec.rgb},0.13) 0%, rgba(255,255,255,0.04) 100%)`
            : `linear-gradient(145deg, rgba(${exec.rgb},0.07) 0%, rgba(255,255,255,0.02) 100%)`,
          border: `1px solid ${hovered ? `rgba(${exec.rgb},0.38)` : `rgba(${exec.rgb},0.18)`}`,
          boxShadow: hovered
            ? `0 20px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(${exec.rgb},0.12), inset 0 1px 0 rgba(255,255,255,0.06)`
            : "0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)",
          transition: "all 0.28s ease",
          cursor: "pointer", position: "relative", overflow: "hidden",
        }}
      >
        {/* Subtle glow on hover */}
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, rgba(${exec.rgb},0.18), transparent 70%)`, pointerEvents: "none" }}
          />
        )}

        {/* Role badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: hovered ? 1.08 : 1 }}
              transition={{ duration: 0.22 }}
              style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                background: `linear-gradient(135deg, rgba(${exec.rgb},0.28), rgba(${exec.rgb},0.1))`,
                border: `1px solid rgba(${exec.rgb},0.35)`, color: exec.color }}
            >
              <Icon size={15} />
            </motion.div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: exec.color }}>{exec.role}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>{exec.title}</div>
            </div>
          </div>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: SUCCESS, display: "block", boxShadow: `0 0 6px ${SUCCESS}`, animation: "xc-pulse 2s ease-in-out infinite" }} />
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{exec.name}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", marginBottom: 12 }}>{exec.specialty}</div>

        <div className="flex items-end justify-between mb-2">
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: exec.color, lineHeight: 1 }}>{exec.confidence}%</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>Уверенность AI</div>
          </div>
          <MiniSparkline color={exec.color} data={EXEC_SPARKLINES[exec.role]} />
        </div>

        <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 12 }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${exec.confidence}%` }}
            transition={{ duration: 1.1, ease: "easeOut", delay: 0.3 }}
            style={{ height: "100%", borderRadius: 2, background: exec.color }} />
        </div>

        <div className="flex items-center justify-between">
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>{exec.tasks} задач активно</span>
          <motion.div
            animate={{ x: hovered ? 2 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1"
            style={{ fontSize: 10, color: exec.color }}
          >
            Спросить <MessageSquare size={10} />
          </motion.div>
        </div>

        <style>{`
          @keyframes xc-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
        `}</style>
      </motion.div>
    </Link>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyProjects() {
  return (
    <div style={{ borderRadius: 16, padding: "48px 24px", textAlign: "center", background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${ACCENT_RGB},0.1)`, border: `1px solid rgba(${ACCENT_RGB},0.22)` }}>
        <Rocket size={22} color={ACCENT} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Создайте первый проект</div>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.42)", lineHeight: 1.6, maxWidth: 360, margin: "0 auto 20px" }}>
        Опишите бизнес-идею — AI-команда директоров проведёт полный анализ рынка, финансов и стратегии.
      </p>
      <Link href="/dashboard/new"
        className="inline-flex items-center gap-2 font-semibold text-white transition-all hover:-translate-y-px"
        style={{ height: 42, padding: "0 22px", borderRadius: 12, fontSize: 14, background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)" }}>
        <Zap size={15} /> Начать анализ
      </Link>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDemo,   setIsDemo]   = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<"projects" | "insights">("projects");

  useEffect(() => {
    markVisit("dashboard");
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
    <div className="min-h-full" style={{ background: "#05060A", paddingBottom: "max(60px, env(safe-area-inset-bottom))" }}>

      <style>{`
        @keyframes hero-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.35;transform:scale(0.55)} }
        @keyframes shimmer { from{transform:translateX(-100%)} to{transform:translateX(200%)} }
        @keyframes float-node { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .hero-grid { grid-template-columns: 1fr 400px; }
        .main-grid { grid-template-columns: 1fr 340px; }
        @media (max-width: 1023px) {
          .hero-grid, .main-grid { grid-template-columns: 1fr; }
          .hero-grid > *:last-child { display: none; }
        }
        @media (max-width: 640px) {
          .hero-grid, .main-grid, .page-section { padding-left: 16px !important; padding-right: 16px !important; }
        }
      `}</style>

      {/* ═══ HERO + EXEC BOARD (одна секция, всё видно без скролла) ═══ */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #080B14 0%, #05060A 100%)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse 55% 70% at 75% 30%, rgba(${ACCENT_RGB},0.08) 0%, transparent 65%)`, pointerEvents: "none" }} />

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 32px 32px" }}>

          {/* Top row: headline left + neural viz right */}
          <div className="hero-grid" style={{ display: "grid", gap: 32, alignItems: "center", marginBottom: 28 }}>

            {/* Left */}
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, duration: 0.4 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <span className="size-1.5 rounded-full" style={{ background: SUCCESS, animation: "hero-pulse 1.8s ease-in-out infinite" }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: SUCCESS, letterSpacing: "0.11em" }}>AI СИСТЕМА АКТИВНА</span>
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.22, duration: 0.4 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: `rgba(${ACCENT_RGB},0.07)`, border: `1px solid rgba(${ACCENT_RGB},0.18)` }}>
                  <Star size={10} style={{ color: ACCENT }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: `rgba(${ACCENT_RGB},0.9)` }}>Confidence 91%</span>
                </motion.div>
              </div>

              {/* Headline */}
              <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.55 }}
                style={{ fontSize: "clamp(24px,3vw,40px)", fontWeight: 800, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 8 }}>
                {greeting}, {firstName}<br />
                <span style={{ background: `linear-gradient(130deg, ${ACCENT} 0%, #8b5cf6 60%, #a78bfa 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  Vertlix Executive Board
                </span>
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25, duration: 0.5 }}
                style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, marginBottom: 20, maxWidth: 440 }}>
                AI-команда директоров анализирует рынок, стратегию и финансы в реальном времени.
              </motion.p>

              {/* KPI chips */}
              <div className="flex flex-wrap gap-2.5 mb-6">
                {[
                  { icon: Target,     label: "Возможностей", value: 4,  suffix: "",  color: SUCCESS },
                  { icon: BarChart2,  label: "AI Analyses",  value: 12, suffix: "+", color: ACCENT  },
                  { icon: Shield,     label: "Рисков",       value: 2,  suffix: "",  color: DANGER  },
                  { icon: TrendingUp, label: "Рост MoM",     value: 34, suffix: "%", color: WARNING },
                ].map((k, i) => (
                  <KpiChip key={k.label} {...k} delay={0.3 + i * 0.06} />
                ))}
              </div>

              {/* CTA */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.45 }}
                className="flex flex-wrap gap-3">
                <CtaButton href="/dashboard/new"  primary icon={Zap}   label="Новая стратегия" />
                <CtaButton href="/dashboard/chat"         icon={Brain}  label="Спросить совет" />
              </motion.div>
            </motion.div>

            {/* Right: neural viz */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
              style={{ height: 240, position: "relative", borderRadius: 20, overflow: "hidden",
                background: `linear-gradient(155deg, rgba(${ACCENT_RGB},0.07), rgba(${ACCENT_RGB},0.018) 60%)`,
                border: `1px solid rgba(${ACCENT_RGB},0.18)`,
                boxShadow: `0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)` }}
            >
              <NeuralViz />
              <div style={{ position: "absolute", top: 10, left: 12, pointerEvents: "none" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 9px", borderRadius: 7, background: "rgba(5,6,10,0.65)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: ACCENT, boxShadow: `0 0 7px ${ACCENT}`, animation: "hero-pulse 2s ease-in-out infinite" }} />
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}>NEURAL NET</span>
                </div>
              </div>
              <div style={{ position: "absolute", bottom: 10, right: 12, pointerEvents: "none", fontSize: 9.5, color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em" }}>20 узлов · sync</div>
            </motion.div>
          </div>

          {/* ── EXEC BOARD — прямо под hero, без скролла ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>Executive AI Board</h2>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", paddingTop: 1 }}>5 AI-директоров · нажмите чтобы задать вопрос</span>
              </div>
              <Link href="/dashboard/executives" className="flex items-center gap-1"
                style={{ fontSize: 11, color: `rgba(${ACCENT_RGB},0.7)`, textDecoration: "none" }}>
                Все директора <ChevronRight size={12} />
              </Link>
            </div>

            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3"
              initial="hidden" animate="show"
              variants={{ show: { transition: { staggerChildren: 0.07 } } }}
            >
              {EXECUTIVES.map(exec => (
                <motion.div key={exec.role} variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22,1,0.36,1] } } }}>
                  <ExecCard exec={exec} />
                </motion.div>
              ))}
            </motion.div>
          </div>

        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="main-grid page-section" style={{ maxWidth: 1280, margin: "40px auto 0", padding: "0 32px", display: "grid", gap: 24 }}>

        {/* Left */}
        <div className="space-y-6">
          {/* Tab bar */}
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "inline-flex" }}>
            {([["projects", "Мои проекты"], ["insights", "AI Intelligence"]] as const).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={tab === id
                  ? { background: `rgba(${ACCENT_RGB},0.18)`, color: "#c4b5fd", border: `1px solid rgba(${ACCENT_RGB},0.28)` }
                  : { color: "rgba(255,255,255,0.38)", border: "1px solid transparent" }}
              >
                {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "projects" ? (
              <motion.div key="proj" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[0,1].map(i => <div key={i} className="h-72 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }} />)}
                  </div>
                ) : projects.length === 0 ? (
                  <EmptyProjects />
                ) : (
                  <>
                    {isDemo && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 12, padding: "5px 12px", borderRadius: 8, background: `rgba(${ACCENT_RGB},0.08)`, border: `1px solid rgba(${ACCENT_RGB},0.2)` }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: `rgba(${ACCENT_RGB},0.9)` }}>Демо-данные</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>— создайте свой проект</span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {projects.slice(0, 4).map((p, i) => <ProjectCard key={p.id} p={p} i={i} />)}
                    </div>
                    <Link href="/dashboard/new"
                      className="mt-4 flex items-center gap-3 p-4 rounded-2xl group transition-all"
                      style={{ border: "1px dashed rgba(255,255,255,0.07)" }}>
                      <div className="size-10 rounded-xl flex items-center justify-center" style={{ border: "1px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
                        <Zap size={16} className="text-white/20 group-hover:text-indigo-400/60 transition-colors" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white/30 group-hover:text-white/55 transition-colors">Новая стратегия</div>
                        <div className="text-xs text-white/15">Опишите идею — AI-команда проведёт полный анализ</div>
                      </div>
                    </Link>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div key="insights" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="space-y-3">
                {AI_INSIGHTS.map((ins, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: i * 0.07 }}
                    style={{ borderRadius: 16, padding: "16px 18px", background: "rgba(255,255,255,0.03)", border: `1px solid ${ins.color}22`, cursor: "pointer" }}
                    className="group hover:-translate-y-0.5 transition-transform">
                    <div className="flex items-start gap-3">
                      <div className="size-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${ins.color}12`, border: `1px solid ${ins.color}22`, color: ins.color }}>
                        <ins.icon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 3 }}>{ins.title}</div>
                            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.55 }}>{ins.desc}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div style={{ fontSize: 14, fontWeight: 800, color: ins.color }}>{ins.growth}</div>
                            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>Эффект</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                            <span style={{ color: ins.color, fontWeight: 700 }}>{ins.prob}%</span> вероятность
                          </div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>·</div>
                          <div style={{ fontSize: 10, color: ins.impact === "Высокий" ? SUCCESS : WARNING, fontWeight: 600 }}>{ins.impact} импакт</div>
                          <ExternalLink size={10} className="ml-auto text-white/20 group-hover:text-indigo-400/50 transition-colors" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            style={{ borderRadius: 16, padding: "18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 12 }}>
              Быстрые действия
            </div>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((qa, i) => (
                <Link key={i} href={qa.href}
                  className="flex flex-col gap-2 p-3 rounded-xl group transition-all hover:-translate-y-0.5"
                  style={{ background: `rgba(${ACCENT_RGB},0.06)`, border: `1px solid rgba(${ACCENT_RGB},0.12)` }}>
                  <qa.icon size={15} style={{ color: ACCENT }} />
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,0.72)", lineHeight: 1.3 }}>{qa.label}</div>
                    <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{qa.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Activity */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.06 }}
            style={{ borderRadius: 16, padding: "18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                Журнал активности
              </div>
              <div className="flex items-center gap-1.5" style={{ fontSize: 9, fontWeight: 600, color: SUCCESS }}>
                <span className="size-1.5 rounded-full" style={{ background: SUCCESS, animation: "hero-pulse 2s ease-in-out infinite" }} />
                Live
              </div>
            </div>
            <div className="space-y-0">
              {ACTIVITY.map((ev, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                  className="flex items-start gap-3 py-2.5 group cursor-pointer"
                  style={{ borderBottom: i < ACTIVITY.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <div className="size-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${ev.color}12`, border: `1px solid ${ev.color}20`, color: ev.color }}>
                    <ev.icon size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 11.5, fontWeight: 500, color: "rgba(255,255,255,0.72)", lineHeight: 1.3 }}>{ev.label}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>{ev.sub}</div>
                  </div>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", flexShrink: 0, marginTop: 1 }}>{ev.time}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recommendation */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.12 }}
            style={{ borderRadius: 16, padding: "18px", background: `linear-gradient(145deg, rgba(${ACCENT_RGB},0.1), rgba(79,70,229,0.04))`, border: `1px solid rgba(${ACCENT_RGB},0.22)` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={13} style={{ color: ACCENT }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: `rgba(${ACCENT_RGB},0.9)` }}>
                Рекомендация дня
              </span>
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.5, marginBottom: 8 }}>
              Повысьте цену на 23% — рынок недооценивает продукт
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", lineHeight: 1.55, marginBottom: 14 }}>
              Анализ 340 конкурентов показывает медиану $49/мес. Текущая цена оставляет $680K в год на столе.
            </p>
            <div className="flex items-center gap-3 mb-4">
              {[{ v: "78%", l: "Вероятность", c: SUCCESS }, { v: "+$680K", l: "Потенциал/год", c: WARNING }, { v: "High", l: "Импакт", c: ACCENT }].map((m, i) => (
                <div key={i} className="text-center" style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: m.c }}>{m.v}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{m.l}</div>
                  {i < 2 && <div style={{ position: "absolute" }} />}
                </div>
              ))}
            </div>
            <Link href="/dashboard/new"
              className="flex items-center justify-center gap-2 font-semibold text-white transition-all hover:-translate-y-px"
              style={{ height: 36, borderRadius: 10, fontSize: 12, background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)" }}>
              <Zap size={12} /> Применить стратегию
            </Link>
          </motion.div>

          {/* Engagement / Streak / Daily Insight */}
          <EngagementPanel />

          {/* Market pulse */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.18 }}
            style={{ borderRadius: 16, padding: "18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 12 }}>
              Пульс рынка
            </div>
            {[
              { label: "B2B SaaS",      trend: "+18%",  positive: true },
              { label: "AI Fitness",    trend: "+340%", positive: true },
              { label: "FinTech Tools", trend: "+22%",  positive: true },
              { label: "No-code Tools", trend: "-4%",   positive: false },
            ].map((m, i) => (
              <div key={i} className="flex items-center justify-between py-2"
                style={{ borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <div className="flex items-center gap-2">
                  <Globe size={11} style={{ color: "rgba(255,255,255,0.22)" }} />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{m.label}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: m.positive ? SUCCESS : DANGER }}>{m.trend}</span>
              </div>
            ))}
          </motion.div>

        </div>
      </div>

    </div>
  );
}
