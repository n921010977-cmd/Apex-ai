"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";

const RGB = "99,102,241";

// ─── Boardroom script ─────────────────────────────────────────────────────────
type Msg = {
  id: string;
  role: string; name: string; color: string;
  stance?: "ЗА" | "ПРОТИВ" | "РИСК" | "ДАННЫЕ";
  text: string;
  conflictWith?: string; // renders a conflict marker after this message
};

const SCRIPT: Msg[] = [
  { id: "ba",  role: "Аналитик", name: "Priya",  color: "#f59e0b", stance: "ДАННЫЕ",
    text: "Рынок фитнес-приложений — $4.2B, рост +24%/год. Конкуренты сильны, но AI-персонализация — незанятая ниша." },
  { id: "cmo", role: "CMO", name: "Elena", color: "#10b981", stance: "ЗА",
    text: "Через органику и микро-инфлюенсеров получаем CAC ~$22. Freemium-воронка даст быстрый рост базы." },
  { id: "cfo", role: "CFO", name: "Marcus", color: "#3b82f6", stance: "ПРОТИВ",
    text: "Возражаю. При churn 8% LTV не сходится: окупаемость уезжает за 26 месяцев. Эта экономика не выдержит платный трафик.",
    conflictWith: "CMO" },
  { id: "cmo2", role: "CMO", name: "Elena", color: "#10b981", stance: "ЗА",
    text: "Контраргумент: retention-программа + AI-планы тренировок снижают churn до 5%. LTV вырастает до $180 — модель сходится." },
  { id: "law", role: "Юрист", name: "Diana", color: "#94a3b8", stance: "РИСК",
    text: "Данные о здоровье = чувствительные. Нужны explicit-согласия и политика хранения до запуска, иначе GDPR-риск." },
  { id: "cto", role: "CTO", name: "Aiden", color: "#d946ef", stance: "ЗА",
    text: "MVP реален за 8 недель: готовый стек, модели персонализации обучаем на открытых датасетах." },
];

const VERDICT = {
  score: 87,
  text: "Запускаем. Freemium-модель, маркетинг-бюджет ≤ 15% MRR (условие CFO), цель по churn — 6% к третьему месяцу, юридическая структура и согласия — до релиза. Elena ведёт GTM, Marcus контролирует unit-экономику еженедельно.",
};

const STANCE_STYLE: Record<string, { bg: string; color: string }> = {
  "ЗА":      { bg: "rgba(16,185,129,0.14)",  color: "#34d399" },
  "ПРОТИВ":  { bg: "rgba(239,68,68,0.14)",   color: "#f87171" },
  "РИСК":    { bg: "rgba(245,158,11,0.14)",  color: "#fbbf24" },
  "ДАННЫЕ":  { bg: "rgba(99,102,241,0.14)",  color: "#a5b4fc" },
};

// ─── Section ──────────────────────────────────────────────────────────────────
export function HowAgentsWork() {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, margin: "-120px" });

  // phase: -1 idle · 0..N-1 message being "typed" · N verdict · N+1 done
  const [shown, setShown] = useState(0);      // messages fully shown
  const [typing, setTyping] = useState(false);
  const [verdict, setVerdict] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Play the session
  useEffect(() => {
    if (!inView) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const play = (i: number) => {
      if (cancelled) return;
      if (i >= SCRIPT.length) {
        timers.push(setTimeout(() => { if (!cancelled) setVerdict(true); }, 900));
        return;
      }
      setTyping(true);
      timers.push(setTimeout(() => {
        if (cancelled) return;
        setTyping(false);
        setShown(i + 1);
        timers.push(setTimeout(() => play(i + 1), 1400));
      }, 850));
    };
    timers.push(setTimeout(() => play(0), 600));
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, [inView]);

  // Auto-scroll the feed
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [shown, typing, verdict]);

  const replay = () => { setShown(0); setVerdict(false); setTyping(false);
    setTimeout(() => {
      // re-trigger by faking the effect loop
      let i = 0;
      const step = () => {
        if (i >= SCRIPT.length) { setTimeout(() => setVerdict(true), 900); return; }
        setTyping(true);
        setTimeout(() => { setTyping(false); i += 1; setShown(i); setTimeout(step, 1400); }, 850);
      };
      step();
    }, 300);
  };

  const nextAgent = shown < SCRIPT.length ? SCRIPT[shown] : null;

  return (
    <section id="how-agents" ref={rootRef} style={{ position: "relative", padding: "96px 24px 100px", overflow: "hidden" }}>
      <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse 60% 50% at 50% 30%, rgba(${RGB},0.05), transparent 65%)`, pointerEvents: "none" }} />

      <div style={{ maxWidth: 900, margin: "0 auto", position: "relative" }}>
        {/* Header */}
        <motion.div
          style={{ textAlign: "center", marginBottom: 40 }}
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="term-mono" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 8, marginBottom: 22, border: `1px solid rgba(${RGB},0.25)`, background: `rgba(${RGB},0.05)` }}>
            <span className="term-blink" style={{ width: 5, height: 5, borderRadius: "50%", background: "#ef4444" }} />
            <span style={{ fontSize: 10, letterSpacing: "0.18em", color: `rgba(${RGB},0.85)` }}>// LIVE — ЗАСЕДАНИЕ СОВЕТА</span>
          </div>
          <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 14px", color: "#fff" }}>
            Посмотрите, как совет принимает решение
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", maxWidth: 540, margin: "0 auto", lineHeight: 1.65 }}>
            Это не карточки с обещаниями. Это реальный процесс: аргументы, конфликт позиций и решение CEO.
          </p>
        </motion.div>

        {/* ── Boardroom window ── */}
        <motion.div
          initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.09)", background: "rgba(9,10,16,0.8)", backdropFilter: "blur(20px)", boxShadow: "0 24px 70px rgba(0,0,0,0.5)" }}
        >
          {/* Title bar */}
          <div className="term-mono" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ display: "flex", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", opacity: 0.7 }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b", opacity: 0.7 }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", opacity: 0.7 }} />
              </span>
              <span style={{ fontSize: 10.5, letterSpacing: "0.14em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>vertlix — boardroom session</span>
            </div>
            <span style={{ fontSize: 10, letterSpacing: "0.1em", color: verdict ? "#34d399" : "rgba(255,255,255,0.35)" }}>
              {verdict ? "РЕШЕНИЕ ПРИНЯТО" : `${shown}/${SCRIPT.length} ВЫСТУПИЛИ`}
            </span>
          </div>

          {/* Topic line */}
          <div className="term-mono" style={{ padding: "10px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 11.5, color: "rgba(255,255,255,0.55)", letterSpacing: "0.03em" }}>
            <span style={{ color: `rgba(${RGB},0.8)` }}>&gt; ПОВЕСТКА:</span> AI-фитнес приложение · подписка $19/мес — запускать?
          </div>

          {/* Feed */}
          <div ref={scrollRef} style={{ height: 420, overflowY: "auto", padding: "18px 18px 8px", display: "flex", flexDirection: "column", gap: 12 }}>
            {SCRIPT.slice(0, shown).map((m) => (
              <div key={m.id}>
                <motion.div
                  initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  style={{ display: "flex", gap: 11 }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0, marginTop: 2,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, color: m.color,
                    background: `${m.color}16`, border: `1px solid ${m.color}40`,
                  }}>{m.role.slice(0, 2).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{m.role} · {m.name}</span>
                      {m.stance && (
                        <span className="term-mono" style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: "0.1em", padding: "2px 7px", borderRadius: 5, background: STANCE_STYLE[m.stance].bg, color: STANCE_STYLE[m.stance].color }}>
                          {m.stance}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, margin: 0, maxWidth: 620 }}>{m.text}</p>
                  </div>
                </motion.div>

                {/* Conflict marker */}
                {m.conflictWith && (
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0.6 }} animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="term-mono"
                    style={{ margin: "12px 0 0 45px", display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span style={{ flex: "0 0 40px", height: 1, background: "linear-gradient(90deg, transparent, rgba(239,68,68,0.6))" }} />
                    <span style={{ fontSize: 9.5, letterSpacing: "0.14em", color: "#f87171" }}>⚡ КОНФЛИКТ ПОЗИЦИЙ: {m.role} ↔ {m.conflictWith}</span>
                    <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(239,68,68,0.6), transparent)" }} />
                  </motion.div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {typing && nextAgent && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", gap: 11, alignItems: "center" }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: nextAgent.color, background: `${nextAgent.color}16`, border: `1px solid ${nextAgent.color}40` }}>
                  {nextAgent.role.slice(0, 2).toUpperCase()}
                </div>
                <span style={{ display: "inline-flex", gap: 4, padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {[0, 1, 2].map(d => (
                    <span key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: nextAgent.color, opacity: 0.7, animation: `brd-dot 1.1s ${d * 0.18}s infinite` }} />
                  ))}
                </span>
              </motion.div>
            )}

            {/* CEO verdict */}
            <AnimatePresence>
              {verdict && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  style={{ margin: "8px 0 12px", borderRadius: 16, padding: "18px 18px 16px", background: `rgba(${RGB},0.08)`, border: `1px solid rgba(${RGB},0.35)`, boxShadow: `0 8px 32px rgba(${RGB},0.12)` }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 14px rgba(${RGB},0.4)` }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="15" height="15"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>CEO · Sophia — решение совета</div>
                      <div className="term-mono" style={{ fontSize: 9, letterSpacing: "0.12em", color: `rgba(${RGB},0.8)` }}>SYNTHESIS COMPLETE</div>
                    </div>
                    <div className="term-value" style={{ fontSize: 26, fontWeight: 800, color: "#34d399" }}>{VERDICT.score}<span style={{ fontSize: 12, opacity: 0.5 }}>/100</span></div>
                  </div>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.72)", lineHeight: 1.65, margin: 0 }}>{VERDICT.text}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer bar */}
          <div className="term-mono" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: 9.5, letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)" }}>
              симуляция на основе реального пайплайна vertlix
            </span>
            {verdict && (
              <button onClick={replay} style={{ fontSize: 10, letterSpacing: "0.1em", color: "#a5b4fc", background: `rgba(${RGB},0.1)`, border: `1px solid rgba(${RGB},0.3)`, borderRadius: 7, padding: "4px 12px", cursor: "pointer" }}>
                ▸ ПОВТОРИТЬ СЕССИЮ
              </button>
            )}
          </div>
        </motion.div>
      </div>

      <style>{`@keyframes brd-dot { 0%,80%,100%{transform:scale(0.5);opacity:0.35} 40%{transform:scale(1);opacity:1} }`}</style>
    </section>
  );
}
