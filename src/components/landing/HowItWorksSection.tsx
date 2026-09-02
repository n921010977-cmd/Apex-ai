"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;
const STEP_MS = 3600; // сколько «выполняется» каждый шаг

// ─── Step data ────────────────────────────────────────────────────────────────

const STEPS = [
  { number: "01", color: "#D946EF", rgb: "217,70,239", title: "Describe Your Business",
    description: "Tell us about your idea, market, or company. Be as specific as you want — our AI understands context and nuance." },
  { number: "02", color: "#22d3ee", rgb: "34,211,238", title: "CEO Delegates Work",
    description: "Your AI CEO analyzes the brief and assigns specialized tasks to each executive — CFO, CMO, COO, CTO, and more." },
  { number: "03", color: "#60a5fa", rgb: "96,165,250", title: "Executives Work in Parallel",
    description: "All 20 AI executives simultaneously research, analyze, and create their domain-specific strategies — in real time." },
  { number: "04", color: "#34d399", rgb: "52,211,153", title: "Premium Report Generated",
    description: "Your complete Business Strategy Report is assembled — financials, market analysis, roadmap, and everything in between." },
];

type StepState = "wait" | "run" | "done";

// ─── Мини-сцены внутри карточек ───────────────────────────────────────────────

// 01 — печатается бриф основателя
function SceneDescribe({ run, color, rgb }: { run: boolean; color: string; rgb: string }) {
  return (
    <div className="hiw-scene" style={{ borderColor: `rgba(${rgb},0.25)` }}>
      <span className="hiw-mono" style={{ color, flexShrink: 0 }}>{">"}</span>
      <div style={{ overflow: "hidden", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
        <motion.div
          style={{ overflow: "hidden", whiteSpace: "nowrap", display: "inline-block", verticalAlign: "bottom" }}
          animate={run ? { width: ["0%", "100%", "100%"] } : { width: "100%" }}
          transition={run ? { duration: 3.2, times: [0, 0.7, 1], repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
        >
          <span className="hiw-mono" style={{ color: "rgba(255,255,255,0.72)" }}>Launching an AI fitness app for busy founders…</span>
        </motion.div>
        {run && <motion.span className="hiw-caret" style={{ background: color }} animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.9, repeat: Infinity }} />}
      </div>
    </div>
  );
}

// 02 — CEO рассылает задачи четырём директорам
function SceneDelegate({ run, color, rgb }: { run: boolean; color: string; rgb: string }) {
  const execs = [
    { label: "CFO", y: 14 }, { label: "CMO", y: 38 }, { label: "COO", y: 62 }, { label: "CTO", y: 86 },
  ];
  return (
    <div className="hiw-scene hiw-scene-rel" style={{ borderColor: `rgba(${rgb},0.25)` }}>
      {/* CEO */}
      <span className="hiw-node hiw-node-ceo" style={{ left: "10%", top: "50%", background: color, boxShadow: `0 0 12px ${color}88` }}>CEO</span>
      {/* линии */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        {execs.map(e => (
          <line key={e.label} x1={16} y1={50} x2={78} y2={e.y} stroke={`rgba(${rgb},0.25)`} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      {/* пакеты задач */}
      {run && execs.map((e, i) => (
        <motion.span key={e.label} className="hiw-packet" style={{ background: color, boxShadow: `0 0 8px ${color}` }}
          initial={{ left: "14%", top: "50%", opacity: 0 }}
          animate={{ left: ["14%", "76%"], top: ["50%", `${e.y}%`], opacity: [0, 1, 0] }}
          transition={{ duration: 1.15, repeat: Infinity, delay: i * 0.28, ease: "easeInOut" }} />
      ))}
      {/* директора */}
      {execs.map((e, i) => (
        <motion.span key={e.label} className="hiw-node" style={{ left: "82%", top: `${e.y}%`, background: `rgba(${rgb},0.16)`, border: `1px solid rgba(${rgb},0.45)`, color }}
          animate={run ? { scale: [1, 1.18, 1] } : { scale: 1 }}
          transition={run ? { duration: 1.15, repeat: Infinity, delay: i * 0.28 + 0.55 } : undefined}>
          {e.label}
        </motion.span>
      ))}
    </div>
  );
}

// 03 — параллельная работа: бегущие индикаторы
function SceneParallel({ run, color, rgb }: { run: boolean; color: string; rgb: string }) {
  const rows = [0, 1, 2, 3];
  return (
    <div className="hiw-scene hiw-scene-col" style={{ borderColor: `rgba(${rgb},0.25)` }}>
      {rows.map(i => (
        <div key={i} className="hiw-workrow">
          <motion.span className="hiw-workdot" style={{ background: color }}
            animate={run ? { opacity: [1, 0.35, 1] } : { opacity: 0.5 }}
            transition={run ? { duration: 1.2, repeat: Infinity, delay: i * 0.2 } : undefined} />
          <div className="hiw-worktrack">
            <motion.span className="hiw-worksweep" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
              animate={run ? { left: ["-35%", "100%"] } : { left: "-35%" }}
              transition={run ? { duration: 1.5 + i * 0.25, repeat: Infinity, ease: "easeInOut", delay: i * 0.18 } : undefined} />
          </div>
        </div>
      ))}
    </div>
  );
}

// 04 — отчёт собирается: строки заполняются, появляется галочка
function SceneReport({ run, color, rgb }: { run: boolean; color: string; rgb: string }) {
  const lines = [88, 64, 76, 46];
  return (
    <div className="hiw-scene hiw-scene-col" style={{ borderColor: `rgba(${rgb},0.25)`, position: "relative" }}>
      {lines.map((w, i) => (
        <div key={i} className="hiw-repline">
          <motion.span style={{ display: "block", height: "100%", borderRadius: 2, background: `rgba(${rgb},0.55)` }}
            animate={run ? { width: ["0%", `${w}%`, `${w}%`] } : { width: `${w}%` }}
            transition={run ? { duration: 3.3, times: [i * 0.12, i * 0.12 + 0.3, 1], repeat: Infinity, ease: EASE } : { duration: 0.3 }} />
        </div>
      ))}
      <motion.span className="hiw-repcheck" style={{ background: color, boxShadow: `0 4px 14px ${color}66` }}
        animate={run ? { scale: [0, 0, 1.2, 1, 1], opacity: [0, 0, 1, 1, 1] } : { scale: 1, opacity: 1 }}
        transition={run ? { duration: 3.3, times: [0, 0.62, 0.74, 0.82, 1], repeat: Infinity } : { duration: 0.3 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#05060A" strokeWidth="3.4" width="11" height="11"><polyline points="20 6 9 17 4 12" /></svg>
      </motion.span>
    </div>
  );
}

const SCENES = [SceneDescribe, SceneDelegate, SceneParallel, SceneReport];

// ─── Коннектор с частицами ────────────────────────────────────────────────────

function DataConnector({ fromColor, toColor, hot }: { fromColor: string; toColor: string; hot: boolean }) {
  return (
    <div aria-hidden style={{ flexShrink: 0, width: 68, alignSelf: "flex-start", marginTop: 92, position: "relative", height: 2 }}>
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${fromColor}${hot ? "88" : "30"}, ${toColor}${hot ? "88" : "30"})`, borderRadius: 1, transition: "opacity .4s" }} />
      <div style={{ position: "absolute", top: -4, bottom: -4, left: 0, right: 0, opacity: hot ? 1 : 0, transition: "opacity .4s",
        background: `linear-gradient(90deg, ${fromColor}26, ${toColor}26)`, filter: "blur(6px)" }} />
      {[0, 0.85, 1.7].map((d, pi) => (
        <span key={pi} style={{
          position: "absolute", top: "50%", transform: "translateY(-50%)", width: 5, height: 5, borderRadius: "50%",
          background: `linear-gradient(90deg, ${fromColor}, ${toColor})`, boxShadow: `0 0 8px 2px ${fromColor}bb`,
          animationName: "hiw-particle", animationDuration: "2.4s", animationDelay: `${d}s`,
          animationTimingFunction: "linear", animationIterationCount: "infinite", left: 0,
          opacity: hot ? 1 : 0, transition: "opacity .4s",
        }} />
      ))}
    </div>
  );
}

// ─── Карточка шага ────────────────────────────────────────────────────────────

const cardVar: Variants = {
  hidden: { opacity: 0, y: 40 },
  show:   { opacity: 1, y: 0 },
};

const STATE_LABEL: Record<StepState, string> = { wait: "QUEUED", run: "RUNNING", done: "DONE" };

function StepCard({ step, index, state, onSelect }: { step: typeof STEPS[number]; index: number; state: StepState; onSelect: () => void }) {
  const Scene = SCENES[index];
  const run = state === "run";
  return (
    <motion.div
      variants={cardVar}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.75, delay: index * 0.12, ease: EASE }}
      whileHover={{ y: -8, transition: { type: "spring", stiffness: 260, damping: 20 } }}
      onClick={onSelect}
      style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
    >
      <motion.div
        animate={{
          borderColor: run ? `rgba(${step.rgb},0.65)` : state === "done" ? `rgba(${step.rgb},0.3)` : `rgba(${step.rgb},0.16)`,
          boxShadow: run
            ? `0 0 0 1px rgba(${step.rgb},0.14), 0 14px 46px rgba(${step.rgb},0.16), 0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)`
            : `0 0 0 1px rgba(${step.rgb},0.05), 0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)`,
          opacity: state === "wait" ? 0.72 : 1,
        }}
        transition={{ duration: 0.5, ease: EASE }}
        style={{
          position: "relative", height: "100%", borderRadius: 24, padding: "24px 22px 26px", overflow: "hidden",
          background: `linear-gradient(145deg, rgba(${step.rgb},0.09) 0%, rgba(255,255,255,0.022) 60%, rgba(${step.rgb},0.04) 100%)`,
          border: `1px solid rgba(${step.rgb},0.24)`,
          backdropFilter: "blur(20px) saturate(180%)",
        }}
      >
        {/* верхняя световая кромка */}
        <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1,
          background: `linear-gradient(90deg, transparent, rgba(${step.rgb},${run ? 0.9 : 0.5}), transparent)`, transition: "opacity .4s" }} />
        {/* угловое свечение */}
        <motion.div animate={{ opacity: run ? 1 : 0.45 }} transition={{ duration: 0.5 }}
          style={{ position: "absolute", top: -50, right: -50, width: 150, height: 150,
            background: `radial-gradient(circle, rgba(${step.rgb},0.2) 0%, transparent 70%)`, pointerEvents: "none" }} />

        {/* номер + статус */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span className="hiw-mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.26em", color: step.color }}>{step.number}</span>
          <span className="hiw-mono" style={{
            display: "inline-flex", alignItems: "center", gap: 5, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.16em",
            padding: "3px 8px", borderRadius: 6,
            color: state === "done" ? "#34d399" : run ? step.color : "rgba(255,255,255,0.28)",
            border: `1px solid ${state === "done" ? "rgba(52,211,153,0.35)" : run ? `rgba(${step.rgb},0.45)` : "rgba(255,255,255,0.08)"}`,
            background: state === "done" ? "rgba(52,211,153,0.07)" : run ? `rgba(${step.rgb},0.1)` : "transparent",
            transition: "all .4s",
          }}>
            {state === "done" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" width="8" height="8"><polyline points="20 6 9 17 4 12" /></svg>
            ) : run ? (
              <motion.span style={{ width: 5, height: 5, borderRadius: "50%", background: step.color, display: "inline-block" }}
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
            ) : null}
            {STATE_LABEL[state]}
          </span>
        </div>

        {/* живая мини-сцена */}
        <Scene run={run} color={step.color} rgb={step.rgb} />

        {/* заголовок */}
        <h3 style={{ color: "rgba(255,255,255,0.92)", fontWeight: 600, fontSize: 15.5, lineHeight: 1.35, letterSpacing: "-0.01em", margin: "18px 0 10px" }}>
          {step.title}
        </h3>
        <p style={{ color: "rgba(255,255,255,0.42)", fontSize: 13.5, lineHeight: 1.65, margin: 0 }}>
          {step.description}
        </p>

        {/* прогресс шага */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 3, background: "rgba(255,255,255,0.05)" }}>
          {run && (
            <motion.div key={`p-${index}`} initial={{ width: "0%" }} animate={{ width: "100%" }}
              transition={{ duration: STEP_MS / 1000, ease: "linear" }}
              style={{ height: "100%", background: `linear-gradient(90deg, rgba(${step.rgb},0.6), ${step.color})` }} />
          )}
          {state === "done" && <div style={{ height: "100%", width: "100%", background: `rgba(${step.rgb},0.4)` }} />}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function HowItWorksSection() {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.25 });
  const reduce = useReducedMotion();

  // активный шаг конвейера: 0→1→2→3→0…
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (!inView || reduce) return;
    const t = setInterval(() => setActive(a => (a + 1) % STEPS.length), STEP_MS);
    return () => clearInterval(t);
  }, [inView, reduce]);

  const stateOf = (i: number): StepState => {
    if (reduce) return "done";
    if (i === active) return "run";
    return i < active ? "done" : "wait";
  };

  return (
    <section id="product" ref={rootRef} style={{ position: "relative", padding: "96px 24px 112px", overflow: "hidden" }}>
      <style>{`
        @keyframes hiw-particle {
          0%   { left: -6px;              opacity: 0; }
          8%   {                          opacity: 1; }
          92%  {                          opacity: 1; }
          100% { left: calc(100% + 6px); opacity: 0; }
        }
        @keyframes hiw-badge-glow {
          0%, 100% { box-shadow: 0 0 0 0   rgba(217,70,239,0.14), inset 0 0 6px  rgba(217,70,239,0.04); }
          50%       { box-shadow: 0 0 0 4px rgba(217,70,239,0),   inset 0 0 10px rgba(217,70,239,0.1); }
        }
        @keyframes hiw-dot-blink {
          0%, 100% { opacity: 1;   transform: scale(1);   }
          50%       { opacity: 0.3; transform: scale(0.55); }
        }
        .hiw-mono { font-family: ui-monospace, 'Cascadia Code', monospace; font-size: 11px; }
        .hiw-scene { display: flex; align-items: center; gap: 8px; height: 68px; padding: 0 14px; border-radius: 14px;
          background: rgba(5,6,10,0.5); border: 1px solid; overflow: hidden; }
        .hiw-scene-rel { position: relative; padding: 0; }
        .hiw-scene-col { flex-direction: column; align-items: stretch; justify-content: center; gap: 8px; padding: 0 14px; }
        .hiw-caret { display: inline-block; width: 6px; height: 12px; margin-left: 2px; border-radius: 1px; vertical-align: middle; }
        .hiw-node { position: absolute; transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center;
          width: 26px; height: 18px; border-radius: 5px; font-family: ui-monospace, monospace; font-size: 6.5px; font-weight: 800; letter-spacing: 0.04em; }
        .hiw-node-ceo { width: 30px; height: 22px; color: #05060A; font-size: 7.5px; border-radius: 6px; }
        .hiw-packet { position: absolute; width: 6px; height: 6px; margin: -3px 0 0 -3px; border-radius: 50%; pointer-events: none; }
        .hiw-workrow { display: flex; align-items: center; gap: 8px; }
        .hiw-workdot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
        .hiw-worktrack { position: relative; flex: 1; height: 4px; border-radius: 3px; background: rgba(255,255,255,0.06); overflow: hidden; }
        .hiw-worksweep { position: absolute; top: 0; bottom: 0; width: 35%; border-radius: 3px; }
        .hiw-repline { height: 4px; border-radius: 2px; background: rgba(255,255,255,0.05); overflow: hidden; }
        .hiw-repcheck { position: absolute; right: 12px; bottom: 10px; width: 18px; height: 18px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; }
      `}</style>

      {/* Micro-grid background */}
      <div aria-hidden style={{
        position: "absolute", inset: 0,
        backgroundImage: [
          "linear-gradient(rgba(255,255,255,0.027) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(255,255,255,0.027) 1px, transparent 1px)",
        ].join(", "),
        backgroundSize: "44px 44px",
        maskImage: "radial-gradient(ellipse 88% 88% at 50% 50%, black 25%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 88% 88% at 50% 50%, black 25%, transparent 100%)",
        pointerEvents: "none",
      }} />

      {/* Ambient glows */}
      <div aria-hidden style={{ position: "absolute", top: "5%", left: "5%", width: 560, height: 560, background: "radial-gradient(circle, rgba(217,70,239,0.07) 0%, transparent 65%)", filter: "blur(70px)", pointerEvents: "none" }} />
      <div aria-hidden style={{ position: "absolute", bottom: "5%", right: "5%", width: 560, height: 560, background: "radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 65%)", filter: "blur(70px)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* ── Header ── */}
        <motion.div
          style={{ textAlign: "center", marginBottom: 72 }}
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.75, ease: "easeOut" }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 9, padding: "7px 20px", borderRadius: 999,
            border: "1px solid rgba(217,70,239,0.42)", background: "rgba(217,70,239,0.07)", marginBottom: 28,
            animation: "hiw-badge-glow 3s ease-in-out infinite",
          }}>
            <span style={{ display: "block", width: 5, height: 5, borderRadius: "50%", background: "#D946EF", boxShadow: "0 0 8px #D946EF", animation: "hiw-dot-blink 2s ease-in-out infinite", flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#c4b5fd" }}>How It Works · Live</span>
          </div>

          <h2 style={{ fontSize: "clamp(30px, 4.5vw, 52px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.025em", margin: "0 0 20px" }}>
            <span style={{ display: "block", background: "linear-gradient(180deg, #ffffff 35%, rgba(255,255,255,0.68) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              From Idea to Strategy
            </span>
            <span style={{ display: "block", background: "linear-gradient(135deg, #c4b5fd 0%, #818cf8 45%, #60a5fa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              in Under 5 Minutes
            </span>
          </h2>

          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.40)", maxWidth: 520, margin: "0 auto", lineHeight: 1.65 }}>
            No meetings. No lengthy onboarding. Just describe your business and watch your executive team get to work.
          </p>
        </motion.div>

        {/* ── Steps: mobile/tablet 2-col grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:hidden">
          {STEPS.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} state={stateOf(i)} onSelect={() => setActive(i)} />
          ))}
        </div>

        {/* ── Steps: desktop flex row with connectors ── */}
        <div className="hidden lg:flex items-start gap-0">
          {STEPS.map((step, i) => (
            <div key={step.number} style={{ display: "contents" }}>
              <StepCard step={step} index={i} state={stateOf(i)} onSelect={() => setActive(i)} />
              {i < STEPS.length - 1 && (
                <DataConnector fromColor={step.color} toColor={STEPS[i + 1].color} hot={reduce ? true : active > i} />
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
