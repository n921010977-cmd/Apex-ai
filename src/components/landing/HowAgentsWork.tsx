"use client";

import { motion } from "framer-motion";

const ACCENT = "#6366f1";
const RGB = "99,102,241";

const STEPS = [
  {
    n: "01", tag: "PARALLEL",
    title: "20 независимых анализов",
    desc: "Каждый агент получает отдельную системную роль, свой контекст и промпт. Они анализируют идею одновременно и не видят выводов друг друга — как эксперты, работающие независимо.",
  },
  {
    n: "02", tag: "DEBATE",
    title: "Точки расхождения",
    desc: "Мнения намеренно сталкиваются. CFO осторожен по burn rate, CMO оптимистичен по росту, юрист видит риск структуры. Система выделяет, где эксперты не согласны — именно там прячутся ключевые решения.",
  },
  {
    n: "03", tag: "SYNTHESIS",
    title: "CEO синтезирует",
    desc: "CEO взвешивает все позиции, разрешает противоречия и формирует единую стратегию с приоритетами. Ты видишь не усреднённый ответ, а обоснованное решение с учётом всех точек зрения.",
  },
];

// A tiny illustrative divergence example
const OPINIONS = [
  { role: "CFO", stance: "Осторожно", tone: "#f59e0b", note: "Burn выше нормы, сократить CAC на 20%" },
  { role: "CMO", stance: "Рост",       tone: "#10b981", note: "Органика даст 3–5× дешевле привлечение" },
  { role: "Юрист", stance: "Риск",     tone: "#ef4444", note: "Структуру оформить до запуска" },
];

export function HowAgentsWork() {
  return (
    <section id="how-agents" style={{ position: "relative", padding: "96px 24px 100px", overflow: "hidden" }}>
      <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse 60% 50% at 50% 30%, rgba(${RGB},0.05), transparent 65%)`, pointerEvents: "none" }} />

      <div style={{ maxWidth: 1120, margin: "0 auto", position: "relative" }}>
        {/* Header */}
        <motion.div
          style={{ textAlign: "center", marginBottom: 56 }}
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="term-mono" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 8, marginBottom: 22, border: `1px solid rgba(${RGB},0.28)`, background: `rgba(${RGB},0.06)` }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: ACCENT }} />
            <span style={{ fontSize: 10, letterSpacing: "0.18em", color: `rgba(${RGB},0.9)` }}>// HOW IT WORKS</span>
          </div>
          <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 14px", color: "#fff" }}>
            Не один Claude под 20 именами
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", maxWidth: 560, margin: "0 auto", lineHeight: 1.65 }}>
            Настоящий совет — это независимые роли, реальные разногласия и синтез. Вот как рождается решение.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 12, marginBottom: 16 }}>
          {STEPS.map((s, i) => (
            <motion.div key={s.n}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: "relative", borderRadius: 18, padding: "22px 20px 24px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}
            >
              <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: `linear-gradient(90deg, transparent, rgba(${RGB},0.4), transparent)` }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span className="term-mono" style={{ fontSize: 30, fontWeight: 800, color: `rgba(${RGB},0.35)`, lineHeight: 1 }}>{s.n}</span>
                <span className="term-mono" style={{ fontSize: 9, letterSpacing: "0.16em", padding: "3px 8px", borderRadius: 6, background: `rgba(${RGB},0.1)`, border: `1px solid rgba(${RGB},0.22)`, color: `rgba(${RGB},0.9)` }}>{s.tag}</span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 8px", letterSpacing: "-0.01em" }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.42)", lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Divergence example */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.6, delay: 0.15 }}
          style={{ borderRadius: 20, padding: "24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="term-mono" style={{ fontSize: 10, letterSpacing: "0.16em", color: "rgba(255,255,255,0.35)", marginBottom: 18, textTransform: "uppercase" }}>
            // пример: где эксперты расходятся
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 12, marginBottom: 18 }}>
            {OPINIONS.map((o, i) => (
              <motion.div key={o.role}
                initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                style={{ borderRadius: 14, padding: "14px 16px", background: `rgba(${o.tone === "#10b981" ? "16,185,129" : o.tone === "#f59e0b" ? "245,158,11" : "239,68,68"},0.06)`, border: `1px solid ${o.tone}33` }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{o.role}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: o.tone, padding: "2px 8px", borderRadius: 20, background: `${o.tone}18` }}>{o.stance}</span>
                </div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, margin: 0 }}>{o.note}</p>
              </motion.div>
            ))}
          </div>
          {/* Arrow → synthesis */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, background: `rgba(${RGB},0.07)`, border: `1px solid rgba(${RGB},0.25)` }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 14px rgba(${RGB},0.4)` }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="16" height="16"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#a5b4fc", marginBottom: 2 }}>CEO · Решение</div>
              <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.62)", lineHeight: 1.55, margin: 0 }}>
                Запускаем на органике (CMO), удерживаем burn в рамках (CFO), структуру оформляем до старта (юрист). Приоритет — снижение CAC в первые 90 дней.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
