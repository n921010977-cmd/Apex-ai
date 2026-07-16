"use client";

import { motion } from "framer-motion";

const RGB = "99,102,241";

// ─── Comparison model ─────────────────────────────────────────────────────────
type Cell = { v: "yes" | "no" | "part"; note?: string };
const ROWS: { label: string; chatgpt: Cell; consult: Cell; vertlix: Cell }[] = [
  { label: "Несколько экспертных позиций",
    chatgpt: { v: "no", note: "один собеседник" },
    consult: { v: "yes", note: "команда" },
    vertlix:    { v: "yes", note: "20 ролей" } },
  { label: "Эксперты спорят и проверяют друг друга",
    chatgpt: { v: "no" },
    consult: { v: "part", note: "если повезёт" },
    vertlix:    { v: "yes", note: "конфликт → синтез" } },
  { label: "Финмодель с цифрами (LTV, CAC, окупаемость)",
    chatgpt: { v: "part", note: "если попросить" },
    consult: { v: "yes" },
    vertlix:    { v: "yes", note: "в каждом отчёте" } },
  { label: "Готовый отчёт для инвестора",
    chatgpt: { v: "no", note: "текст в чате" },
    consult: { v: "yes", note: "через недели" },
    vertlix:    { v: "yes", note: "PDF, 15+ разделов" } },
  { label: "Итоговое решение, а не «зависит от…»",
    chatgpt: { v: "no" },
    consult: { v: "part" },
    vertlix:    { v: "yes", note: "вердикт с баллом" } },
  { label: "Скорость",
    chatgpt: { v: "part", note: "мгновенно, но сыро" },
    consult: { v: "no", note: "2–6 недель" },
    vertlix:    { v: "yes", note: "≈ 5 минут" } },
  { label: "Цена",
    chatgpt: { v: "yes", note: "$20/мес" },
    consult: { v: "no", note: "$5 000+" },
    vertlix:    { v: "yes", note: "от $0" } },
];

const MARK: Record<Cell["v"], { icon: string; color: string }> = {
  yes:  { icon: "✓", color: "#34d399" },
  no:   { icon: "✕", color: "rgba(248,113,113,0.85)" },
  part: { icon: "±", color: "#fbbf24" },
};

function CellView({ c, strong }: { c: Cell; strong?: boolean }) {
  const m = MARK[c.v];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "12px 8px" }}>
      <span className="term-mono" style={{ fontSize: 15, fontWeight: 800, color: m.color, lineHeight: 1 }}>{m.icon}</span>
      {c.note && <span style={{ fontSize: 9.5, color: strong ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)", textAlign: "center", lineHeight: 1.3 }}>{c.note}</span>}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────
export function WhyNotChatGPT() {
  return (
    <section id="why-vertlix" style={{ position: "relative", padding: "96px 24px 100px", overflow: "hidden" }}>
      <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse 60% 50% at 50% 40%, rgba(${RGB},0.04), transparent 65%)`, pointerEvents: "none" }} />

      <div style={{ maxWidth: 860, margin: "0 auto", position: "relative" }}>
        {/* Header */}
        <motion.div
          style={{ textAlign: "center", marginBottom: 44 }}
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="term-mono" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 8, marginBottom: 22, border: `1px solid rgba(${RGB},0.25)`, background: `rgba(${RGB},0.05)` }}>
            <span style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: `rgba(${RGB},0.85)` }}>// честное сравнение</span>
          </div>
          <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.12, margin: "0 0 14px", color: "#fff" }}>
            ChatGPT отвечает.<br /><span style={{ color: "#818cf8" }}>Vertlix — решает.</span>
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", maxWidth: 560, margin: "0 auto", lineHeight: 1.65 }}>
            Один AI даст вам мнение. Команда, которая спорит и проверяет друг друга, даст решение, которому можно доверять.
          </p>
        </motion.div>

        {/* Comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.09)", background: "rgba(9,10,16,0.75)", backdropFilter: "blur(20px)", boxShadow: "0 24px 70px rgba(0,0,0,0.45)" }}
        >
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 640 }}>
              {/* Head */}
              <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1.15fr", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                <div className="term-mono" style={{ padding: "14px 18px", fontSize: 10, letterSpacing: "0.16em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
                  критерий
                </div>
                {["ChatGPT", "Консультанты"].map(h => (
                  <div key={h} style={{ padding: "14px 8px", textAlign: "center", fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.5)", borderLeft: "1px solid rgba(255,255,255,0.05)" }}>{h}</div>
                ))}
                <div style={{ padding: "14px 8px", textAlign: "center", borderLeft: `1px solid rgba(${RGB},0.3)`, background: `rgba(${RGB},0.08)` }}>
                  <span className="term-mono" style={{ fontSize: 12.5, fontWeight: 800, color: "#a5b4fc", letterSpacing: "0.06em" }}>VERTLIX AI</span>
                </div>
              </div>

              {/* Rows */}
              {ROWS.map((r, i) => (
                <motion.div key={r.label}
                  initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.35, delay: 0.08 + i * 0.06 }}
                  style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1.15fr", borderBottom: i < ROWS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", alignItems: "center" }}
                >
                  <div style={{ padding: "12px 18px", fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.45 }}>{r.label}</div>
                  <div style={{ borderLeft: "1px solid rgba(255,255,255,0.05)" }}><CellView c={r.chatgpt} /></div>
                  <div style={{ borderLeft: "1px solid rgba(255,255,255,0.05)" }}><CellView c={r.consult} /></div>
                  <div style={{ borderLeft: `1px solid rgba(${RGB},0.3)`, background: `rgba(${RGB},0.06)`, alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CellView c={r.vertlix} strong />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom line */}
          <div className="term-mono" style={{ padding: "12px 18px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 10.5, letterSpacing: "0.06em", color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
            &gt; вывод: используйте ChatGPT для вопросов. используйте vertlix — для решений.
          </div>
        </motion.div>
      </div>
    </section>
  );
}
