"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Settings2, ArrowRight } from "lucide-react";
import { streamChat } from "@/lib/stream-chat";

// ─── Team data ────────────────────────────────────────────────────────────────
const AGENTS = [
  { ab: "CEO", name: "CEO Стратег",        dept: "Стратегия и планирование", desc: "Определяет стратегию, анализирует возможности, строит роадмапы.", st: "Анализирует",   c: "#818cf8", g: ["#6366f1", "#4f46e5"] },
  { ab: "MR",  name: "Market Researcher",  dept: "Рыночная разведка",        desc: "Исследует тренды рынка, конкурентов и инсайты клиентов.",         st: "Исследует",     c: "#60a5fa", g: ["#3b82f6", "#2563eb"] },
  { ab: "ME",  name: "Marketing Expert",   dept: "Рост и маркетинг",         desc: "Разрабатывает маркетинг-стратегии и кампании роста.",             st: "Создаёт",       c: "#34d399", g: ["#10b981", "#059669"] },
  { ab: "FA",  name: "Financial Analyst",  dept: "Финансы и анализ",         desc: "Анализирует финансы, строит прогнозы и считает ROI.",             st: "Считает",       c: "#2dd4bf", g: ["#14b8a6", "#0d9488"] },
  { ab: "SS",  name: "Sales Strategist",   dept: "Продажи и выручка",        desc: "Строит стратегии продаж, процессы и оптимизацию выручки.",        st: "Планирует",     c: "#fbbf24", g: ["#f59e0b", "#d97706"] },
  { ab: "OM",  name: "Operations Manager", dept: "Операции и процессы",      desc: "Оптимизирует операции, процессы и эффективность команды.",        st: "Оптимизирует",  c: "#fb923c", g: ["#f97316", "#ea580c"] },
  { ab: "PA",  name: "Product Advisor",    dept: "Продукт и инновации",      desc: "Советует по продуктовой стратегии, фичам и инновациям.",          st: "Оценивает",     c: "#c084fc", g: ["#a855f7", "#9333ea"] },
];

// офлайн-ответы, если API недоступен
const FALLBACK: Record<string, string> = {
  CEO: "Смотрю стратегически: сформулируйте цель на 90 дней и одну ключевую метрику. Я разложу её на инициативы по департаментам и укажу, где сейчас самое узкое место. Полный живой анализ доступен после настройки API-ключа.",
  MR:  "По рынку: назовите нишу и географию — я соберу размер рынка, 3–5 ключевых конкурентов и незакрытые боли клиентов. Сейчас работаю в демо-режиме: подключите API-ключ, и анализ будет по вашим реальным данным.",
  ME:  "По маркетингу: для старта хватит двух каналов и одного оффера. Я предложу связку канал→сегмент→сообщение и метрики для проверки за 7 дней. Живые рекомендации включатся после настройки API-ключа.",
  FA:  "По финансам: пришлите цену, себестоимость и ожидаемый объём — посчитаю маржу, точку безубыточности и чувствительность прибыли. В демо-режиме показываю методику; для расчёта по вашим цифрам нужен API-ключ.",
  SS:  "По продажам: опишите, кто платит и сколько стоит сделка — я соберу воронку от первого касания до оплаты и укажу, где теряются деньги. Полный разбор — после подключения API-ключа.",
  OM:  "По операциям: назовите процесс, который болит, — я разложу его на шаги, найду узкое место и предложу, что автоматизировать первым. Демо-режим: для детального плана подключите API-ключ.",
  PA:  "По продукту: сформулируйте боль пользователя одним предложением — я проверю, решает ли её текущая фича, и предложу минимальный скоуп MVP. Живой анализ доступен после настройки API-ключа.",
};

const ACTIVITY = [
  { c: "#c084fc", t: "Market Researcher",  s: "Проанализировал 15 конкурентов",   time: "2 мин назад" },
  { c: "#60a5fa", t: "Financial Analyst",  s: "Завершил прогноз ROI",             time: "3 мин назад" },
  { c: "#34d399", t: "Marketing Expert",   s: "Сгенерировал стратегии роста",     time: "4 мин назад" },
  { c: "#818cf8", t: "CEO Стратег",        s: "Обновил стратегический роадмап",   time: "5 мин назад" },
  { c: "#fbbf24", t: "Sales Strategist",   s: "Оптимизировал воронку продаж",     time: "6 мин назад" },
];

const STAGES = [
  { n: 1, t: "Анализ проблемы",     d: "Определение ключевых вызовов",     st: "done" },
  { n: 2, t: "Сбор данных",         d: "Сбор релевантных данных и фактов", st: "done" },
  { n: 3, t: "Анализ и рисёрч",     d: "Глубокий анализ и изучение рынка", st: "progress" },
  { n: 4, t: "Разработка стратегии",d: "Создание стратегий и решений",     st: "pending" },
  { n: 5, t: "Синтез решения",      d: "Сведение инсайтов в финальный отчёт", st: "pending" },
];

function useCountUp(to: number, dur = 1200) {
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

export default function AITeamPage() {
  const eff = useCountUp(92, 1400);
  const r = 42, circ = 2 * Math.PI * r;
  const progress = 67;

  // ── Спросить агента (реальный бэкенд + офлайн-фолбэк) ──
  const [ask, setAsk] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);

  const submit = useCallback(async () => {
    const question = q.trim();
    if (!question || busy || ask === null) return;
    const a = AGENTS[ask];
    setBusy(true); setAnswer(""); setOffline(false);
    const persona = `Ты — ${a.name}, ${a.dept} в AI-команде Apex AI, работаешь на основателя бизнеса. ${a.desc} Ответь на русском, конкретно и по делу, 4–7 предложений, без воды. Обычный текст без markdown-разметки (никаких ** и #). Если не хватает данных — задай 1–2 уточняющих вопроса в конце.`;
    try {
      await streamChat(question, persona, t => setAnswer(prev => prev + t));
    } catch {
      setOffline(true);
      const fb = FALLBACK[a.ab] ?? FALLBACK.CEO;
      for (const ch of fb) {
        setAnswer(prev => prev + ch);
        await new Promise(res => setTimeout(res, 8));
      }
    }
    setBusy(false);
  }, [q, busy, ask]);

  const selectAgent = useCallback((i: number) => {
    setAsk(prev => (prev === i ? null : i));
    setAnswer(""); setQ(""); setOffline(false);
  }, []);

  return (
    <div style={{ padding: "22px 24px 48px", maxWidth: 1440, margin: "0 auto" }}>
      <style>{`
        @keyframes ait-pulse { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes ait-hub { 0%,100%{box-shadow:0 0 30px rgba(99,102,241,.4)} 50%{box-shadow:0 0 55px rgba(99,102,241,.7)} }
        @keyframes ait-flow { to { stroke-dashoffset: -24; } }
        .ait-scroll::-webkit-scrollbar{height:6px}
        .ait-scroll::-webkit-scrollbar-thumb{background:rgba(99,102,241,.25);border-radius:3px}
      `}</style>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 6 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", margin: 0 }}>AI Team</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "6px 0 0" }}>Ваши специализированные AI-агенты работают вместе</p>
        </div>
        <div className="term-mono" style={{ display: "flex", alignItems: "center", gap: 7, height: 34, padding: "0 13px", borderRadius: 10, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <span className="term-blink" style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
          <span style={{ fontSize: 10.5, letterSpacing: "0.08em", color: "#34d399" }}>СТАТУС КОМАНДЫ: АКТИВНА</span>
        </div>
      </motion.div>

      {/* Hint */}
      <div className="term-mono" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "rgba(255,255,255,0.4)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "8px 0 12px", marginBottom: 18 }}>
        <span style={{ color: "#818cf8" }}>▸</span> Кликните на агента — и задайте ему вопрос напрямую. Совместные решения принимает <Link href="/dashboard/executives" style={{ color: "#818cf8" }}>Совет</Link>.
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px]" style={{ gap: 16 }}>
        {/* ── Left ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          {/* Working panel */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ ...card, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Ваша AI-команда работает</span>
                <span className="term-mono" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 9, padding: "3px 9px", borderRadius: 20, background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.3)", color: "#34d399", letterSpacing: ".08em" }}>
                  <span className="term-blink" style={{ width: 4, height: 4, borderRadius: "50%", background: "#34d399" }} />LIVE
                </span>
              </div>
              <Link href="/dashboard/executives" style={{ display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 13px", borderRadius: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>
                <Settings2 size={12} /> Настройки команды
              </Link>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 16px" }}>Совместная работа в реальном времени</p>

            {/* Agent cards */}
            <div className="ait-scroll" style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 }}>
              {AGENTS.map((a, i) => (
                <motion.div key={a.ab}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
                  onClick={() => selectAgent(i)}
                  whileHover={{ y: -4 }}
                  style={{ flex: "0 0 150px", borderRadius: 14, padding: 12, cursor: "pointer",
                    background: ask === i ? `linear-gradient(160deg, ${a.g[0]}14, rgba(255,255,255,0.02))` : "rgba(255,255,255,0.02)",
                    border: ask === i ? `1.5px solid ${a.c}88` : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: ask === i ? `0 0 24px ${a.c}22` : "none",
                    display: "flex", flexDirection: "column" }}>
                  <div style={{ height: 76, borderRadius: 10, marginBottom: 10, background: `linear-gradient(160deg, ${a.g[0]}30, #0b0c14 75%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: `linear-gradient(135deg, ${a.g[0]}, ${a.g[1]})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 18px ${a.g[0]}55, inset 0 1px 0 rgba(255,255,255,.3)` }}>
                      <span className="term-mono" style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>{a.ab}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{a.name}</div>
                  <div style={{ fontSize: 9.5, color: `${a.c}cc`, marginBottom: 6 }}>{a.dept}</div>
                  <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.38)", lineHeight: 1.45, flex: 1 }}>{a.desc}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 5, marginTop: 9, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: a.c, animation: "ait-pulse 1.6s infinite" }} />
                      <span style={{ fontSize: 9.5, fontWeight: 600, color: a.c }}>{a.st}</span>
                    </span>
                    <span className="term-mono" style={{ fontSize: 8.5, fontWeight: 700, color: ask === i ? a.c : "rgba(255,255,255,0.3)" }}>{ask === i ? "▾ ОТКРЫТ" : "▸ СПРОСИТЬ"}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Ask console */}
            <AnimatePresence>
              {ask !== null && (() => {
                const a = AGENTS[ask];
                return (
                  <motion.div key={a.ab}
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: "hidden" }}>
                    <div style={{ marginTop: 12, borderRadius: 14, border: `1px solid ${a.c}44`, background: "rgba(255,255,255,0.02)", padding: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg,${a.g[0]},${a.g[1]})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span className="term-mono" style={{ fontSize: 10, fontWeight: 800, color: "#fff" }}>{a.ab}</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{a.name}</div>
                          <div style={{ fontSize: 10.5, color: `${a.c}cc` }}>{a.dept}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span className="term-mono" style={{ color: a.c, fontSize: 13, alignSelf: "center" }}>{">"}</span>
                        <input value={q} onChange={e => setQ(e.target.value)} disabled={busy}
                          onKeyDown={e => { if (e.key === "Enter") void submit(); }}
                          placeholder={`Вопрос для ${a.name}…`}
                          style={{ flex: 1, minWidth: 0, height: 38, padding: "0 12px", borderRadius: 10, background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.1)", outline: "none", color: "#E5E7EB", fontSize: 13 }} />
                        <button onClick={() => void submit()} disabled={busy || !q.trim()} className="term-mono"
                          style={{ height: 38, padding: "0 16px", borderRadius: 10, border: "none", fontSize: 11, fontWeight: 800, color: "#fff", background: `linear-gradient(135deg,${a.g[0]},${a.g[1]})`, cursor: busy ? "wait" : "pointer", opacity: busy || !q.trim() ? 0.55 : 1, flexShrink: 0 }}>
                          {busy ? "ДУМАЕТ…" : "▸ СПРОСИТЬ"}
                        </button>
                      </div>
                      {(answer || busy) && (
                        <div style={{ marginTop: 12, borderRadius: 10, background: "rgba(5,6,10,0.6)", border: "1px solid rgba(255,255,255,0.07)", padding: "12px 14px" }}>
                          <div className="term-mono" style={{ fontSize: 9.5, color: a.c, marginBottom: 5 }}>{a.name.toUpperCase()} // ОТВЕТ</div>
                          <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.78)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
                            {answer.replace(/\*\*/g, "")}{busy && <span className="term-blink" style={{ color: a.c }}>▋</span>}
                          </p>
                          {offline && !busy && (
                            <div className="term-mono" style={{ fontSize: 10, color: "rgba(251,191,36,0.8)", marginTop: 8 }}>⚠ OFFLINE-РЕЖИМ: API-ключ не настроен на сервере, показан демо-ответ</div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>

            {/* Collaboration hub — converging flows */}
            <div style={{ position: "relative", marginTop: 4 }}>
              <svg viewBox="0 0 700 110" style={{ width: "100%", height: "auto", display: "block" }}>
                <defs>
                  {AGENTS.map((a, i) => (
                    <linearGradient key={i} id={`hubg${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={a.c} stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.5" />
                    </linearGradient>
                  ))}
                </defs>
                {AGENTS.map((a, i) => {
                  const x = 50 + i * 100;
                  const d = `M${x},0 C${x},60 350,50 350,100`;
                  return (
                    <path key={i} d={d} fill="none" stroke={`url(#hubg${i})`} strokeWidth="1.6"
                      strokeDasharray="6 6" style={{ animation: `ait-flow ${1.2 + i * 0.12}s linear infinite` }} />
                  );
                })}
              </svg>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: -6 }}>
                <div style={{ width: 62, height: 62, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #a5b4fc, #4f46e5 70%)", display: "flex", alignItems: "center", justifyContent: "center", animation: "ait-hub 3s ease-in-out infinite" }}>
                  <span className="term-mono" style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>AI</span>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", marginTop: 10 }}>Хаб совместной работы</div>
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>Синтез инсайтов и генерация комплексных решений</div>
              </div>
            </div>
          </motion.div>

          {/* Current workflow */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} style={{ ...card, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>Текущий процесс</div>
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Мультиагентная работа в процессе</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)" }}>Общий прогресс</span>
                <div style={{ width: 140, height: 6, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#6366f1,#8b5cf6)" }} />
                </div>
                <span className="term-value" style={{ fontSize: 13, fontWeight: 800, color: "#a5b4fc" }}>{progress}%</span>
              </div>
            </div>

            <div className="ait-scroll" style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
              {STAGES.map((s, i) => {
                const done = s.st === "done", prog = s.st === "progress";
                return (
                  <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto" }}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
                      style={{
                        width: 168, borderRadius: 12, padding: "13px 14px",
                        background: prog ? "rgba(99,102,241,0.08)" : done ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.015)",
                        border: prog ? "1.5px solid rgba(99,102,241,0.6)" : "1px solid rgba(255,255,255,0.08)",
                        boxShadow: prog ? "0 0 24px rgba(99,102,241,0.15)" : "none",
                      }}>
                      <div className="term-mono" style={{ fontSize: 9, letterSpacing: ".1em", color: "rgba(255,255,255,0.35)", marginBottom: 5 }}>ЭТАП {s.n}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{s.t}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", lineHeight: 1.45, marginBottom: 9, height: 28 }}>{s.d}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: done ? "#34d399" : prog ? "#a5b4fc" : "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 5 }}>
                        {done ? "✓ Завершён" : prog ? <><span className="term-blink" style={{ width: 5, height: 5, borderRadius: "50%", background: "#818cf8" }} />В процессе</> : "◷ Ожидает"}
                      </div>
                    </motion.div>
                    {i < STAGES.length - 1 && <ArrowRight size={14} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* ── Right rail ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Activity */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} style={{ ...card, padding: 18 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fff", marginBottom: 3 }}>Активность команды</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>Живые обновления от вашей AI-команды</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {ACTIVITY.map((a, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.07 }}
                  style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: a.c, marginTop: 4, flexShrink: 0, boxShadow: `0 0 6px ${a.c}80` }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{a.t}</span>
                    <span style={{ display: "block", fontSize: 10.5, color: "rgba(255,255,255,0.38)", marginTop: 1 }}>{a.s}</span>
                  </span>
                  <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>{a.time}</span>
                </motion.div>
              ))}
            </div>
            <Link href="/dashboard/reports" style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 14, fontSize: 11, color: "#818cf8", textDecoration: "none" }}>
              Вся активность <ArrowRight size={11} />
            </Link>
          </motion.div>

          {/* Performance */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} style={{ ...card, padding: 18 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fff", marginBottom: 3 }}>Эффективность команды</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 14 }}>Текущая сессия</div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ position: "relative", width: 100, height: 100, flexShrink: 0 }}>
                <svg width={100} height={100} style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={7} />
                  <motion.circle cx={50} cy={50} r={r} fill="none" stroke="#34d399" strokeWidth={7} strokeLinecap="round"
                    initial={{ strokeDasharray: `0 ${circ}` }} animate={{ strokeDasharray: `${0.92 * circ} ${circ}` }}
                    transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span className="term-value" style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{eff}%</span>
                  <span style={{ fontSize: 7.5, color: "rgba(255,255,255,0.35)", letterSpacing: ".06em" }}>ЭФФЕКТИВН.</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[["7", "Активных агентов", "#34d399"], ["24", "Задач завершено", "#818cf8"], ["98%", "Оценка качества", "#c084fc"]].map(([v, l, c]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: c as string }} />
                    <span className="term-value" style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{v}</span>
                    <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)" }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Insights */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }} style={{ ...card, padding: 18 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fff", marginBottom: 3 }}>Инсайты команды</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>Ключевые выводы этой сессии</div>
            <div style={{ borderRadius: 12, padding: "13px 14px", background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.25)", display: "flex", gap: 11 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" width="15" height="15"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 3 }}>Сильная рыночная возможность</div>
                <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>Анализ показывает 78% product-market fit с высоким потенциалом роста</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
