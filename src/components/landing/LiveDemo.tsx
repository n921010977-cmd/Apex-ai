"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const RGB = "99,102,241";
const FREE_RUNS = 2;

const EXAMPLES = [
  "Кофейня для айтишников с подпиской",
  "SaaS для автоматизации отчётов",
  "Онлайн-магазин локальных брендов",
];

// Fallback verdict if the API is unavailable — the demo must always work
const FALLBACK = `ОЦЕНКА: 78/100
СИЛЬНОЕ: понятная боль аудитории и готовность платить за решение
СИЛЬНОЕ: низкий порог входа — MVP можно проверить за 4–6 недель
РИСК: конкуренты с бюджетом уже занимают нишу — нужна чёткая дифференциация
РИСК: unit-экономика чувствительна к стоимости привлечения
ПЕРВЫЙ ШАГ: 10 интервью с целевыми клиентами до написания кода`;

const PERSONA = `Ты — экспресс-совет Vertlix из 20 AI-директоров. Дай краткий вердикт по бизнес-идее СТРОГО в формате (6 строк, без вступлений и пояснений):
ОЦЕНКА: N/100
СИЛЬНОЕ: …
СИЛЬНОЕ: …
РИСК: …
РИСК: …
ПЕРВЫЙ ШАГ: …
Каждая строка ≤ 14 слов. Пиши по-русски, конкретно, с учётом именно этой идеи.`;

export function LiveDemo() {
  const [idea, setIdea] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runs, setRuns] = useState(0);
  const outRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRuns(parseInt(localStorage.getItem("apex-demo-runs") ?? "0", 10) || 0);
  }, []);
  useEffect(() => { outRef.current?.scrollTo({ top: outRef.current.scrollHeight }); }, [out]);

  const exhausted = runs >= FREE_RUNS;

  // Typewriter for the fallback so the demo never looks broken
  const playFallback = () => {
    let i = 0;
    const tick = () => {
      i += 3;
      setOut(FALLBACK.slice(0, i));
      if (i < FALLBACK.length) setTimeout(tick, 24);
      else { setBusy(false); setDone(true); }
    };
    tick();
  };

  const run = async (preset?: string) => {
    const text = (preset ?? idea).trim();
    if (!text || busy || exhausted) return;
    if (preset) setIdea(preset);
    setOut(""); setDone(false); setBusy(true);
    const next = runs + 1;
    setRuns(next);
    localStorage.setItem("apex-demo-runs", String(next));

    try {
      const res = await fetch("/api/chat/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Бизнес-идея: ${text}`, persona: PERSONA, history: [] }),
      });
      if (!res.ok || !res.body) { playFallback(); return; }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "", got = false;
      while (true) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n"); buf = parts.pop() ?? "";
        for (const p of parts) {
          const m = p.match(/^data: (.*)$/m);
          if (!m) continue;
          try {
            const ev = JSON.parse(m[1]);
            if (ev.type === "token") { got = true; setOut(o => o + ev.token); }
          } catch { /* noop */ }
        }
      }
      if (!got) { playFallback(); return; }
      setBusy(false); setDone(true);
    } catch { playFallback(); }
  };

  return (
    <section id="demo" style={{ position: "relative", padding: "40px 24px 96px", overflow: "hidden" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", position: "relative" }}>
        <motion.div
          initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ borderRadius: 20, overflow: "hidden", border: `1px solid rgba(${RGB},0.25)`, background: "rgba(9,10,16,0.85)", backdropFilter: "blur(20px)", boxShadow: `0 24px 70px rgba(0,0,0,0.5), 0 0 60px rgba(${RGB},0.06)` }}
        >
          {/* Title bar */}
          <div className="term-mono" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ display: "flex", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", opacity: 0.7 }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b", opacity: 0.7 }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", opacity: 0.7 }} />
              </span>
              <span style={{ fontSize: 10.5, letterSpacing: "0.14em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>vertlix — экспресс-проверка · без регистрации</span>
            </div>
            <span style={{ fontSize: 10, letterSpacing: "0.1em", color: exhausted ? "#fbbf24" : "rgba(255,255,255,0.3)" }}>
              {exhausted ? "ЛИМИТ ДЕМО" : `${FREE_RUNS - runs} ИЗ ${FREE_RUNS} БЕСПЛАТНО`}
            </span>
          </div>

          <div style={{ padding: "20px 20px 22px" }}>
            {/* Input row */}
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <input maxLength={1000}
                value={idea}
                onChange={e => setIdea(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") run(); }}
                placeholder="Опишите бизнес-идею одной фразой…"
                disabled={busy || exhausted}
                className="term-mono"
                style={{
                  flex: 1, height: 46, padding: "0 16px", borderRadius: 12,
                  background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff", fontSize: 13.5, outline: "none", transition: "border-color 0.15s",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = `rgba(${RGB},0.55)`)}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
              />
              <button onClick={() => run()} disabled={busy || !idea.trim() || exhausted}
                className="term-mono"
                style={{
                  height: 46, padding: "0 20px", borderRadius: 12, border: "none", flexShrink: 0,
                  cursor: busy || !idea.trim() || exhausted ? "default" : "pointer",
                  fontSize: 11.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#fff",
                  background: busy || !idea.trim() || exhausted ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg,#6366f1,#4f46e5)",
                  boxShadow: busy || !idea.trim() || exhausted ? "none" : `0 5px 18px rgba(${RGB},0.35)`,
                }}>
                {busy ? "СОВЕТ ДУМАЕТ…" : "▸ Проверить"}
              </button>
            </div>

            {/* Example chips */}
            {!out && !busy && !exhausted && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                {EXAMPLES.map(x => (
                  <button key={x} onClick={() => run(x)}
                    style={{ fontSize: 11.5, padding: "6px 12px", borderRadius: 9, cursor: "pointer", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(${RGB},0.35)`; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}>
                    {x}
                  </button>
                ))}
              </div>
            )}

            {/* Output */}
            {(out || busy) && (
              <div ref={outRef} className="term-mono" style={{
                marginTop: 8, padding: "16px 18px", borderRadius: 12, maxHeight: 260, overflowY: "auto",
                background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.07)",
                fontSize: 12.5, lineHeight: 1.9, color: "rgba(230,232,240,0.85)", whiteSpace: "pre-wrap",
              }}>
                {out || "> запрос отправлен 20 директорам…"}
                {busy && <span className="term-blink">▋</span>}
              </div>
            )}

            {/* Post-result / exhausted CTA */}
            {(done || exhausted) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                  {exhausted && !done
                    ? "Демо-лимит исчерпан. Полный разбор — бесплатно после входа."
                    : "Это 1% отчёта. Полная версия: финмодель, конкуренты, план на 90 дней."}
                </span>
                <Link href="/register" className="term-mono" style={{
                  display: "inline-flex", alignItems: "center", gap: 7, height: 40, padding: "0 18px",
                  borderRadius: 10, textDecoration: "none", fontSize: 11, fontWeight: 700,
                  letterSpacing: "0.1em", textTransform: "uppercase", color: "#fff",
                  background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                  boxShadow: `0 5px 18px rgba(${RGB},0.35)`, flexShrink: 0,
                }}>
                  ▸ Полный отчёт
                </Link>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
