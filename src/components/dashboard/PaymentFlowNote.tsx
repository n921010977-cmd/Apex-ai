"use client";

import { motion } from "framer-motion";
import { MousePointerClick, Wallet, ShieldCheck, Unlock } from "lucide-react";

// ─── Блок «Как проходит оплата» на странице тарифов ───────────────────────────
// Успокаивает клиента перед оплатой: платёж через OxaPay в USDT, мы проверяем
// подпись, тариф включается автоматически. Ставится над таблицей сравнения.

const ACCENT = "#6366f1";
const RGB = "99,102,241";
const EASE = [0.22, 1, 0.36, 1] as const;

const STEPS = [
  { icon: MousePointerClick, title: "Выбираешь тариф", desc: "Жмёшь кнопку — открывается защищённая оплата" },
  { icon: Wallet,            title: "Платишь в USDT",  desc: "На странице OxaPay, крипто-перевод (TRC-20)" },
  { icon: ShieldCheck,       title: "Проверяем оплату", desc: "Сверяем подпись OxaPay — подделать нельзя" },
  { icon: Unlock,            title: "Тариф включается", desc: "Автоматически, сразу после подтверждения" },
];

export function PaymentFlowNote() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: EASE }}
      style={{ marginTop: 44, borderRadius: 18, padding: "22px 24px", background: `linear-gradient(180deg, rgba(${RGB},0.06), rgba(${RGB},0.015))`, border: `1px solid rgba(${RGB},0.18)` }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
        <ShieldCheck size={16} style={{ color: "#a5b4fc" }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>Как проходит оплата</span>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>— безопасно, в криптовалюте</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ position: "relative", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg,${ACCENT},#4f46e5)`, boxShadow: `0 4px 14px rgba(${RGB},0.35)` }}>
                <s.icon size={16} color="#fff" />
              </div>
              <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>0{i + 1}</span>
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>{s.title}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.45 }}>{s.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
        Деньги проходят через OxaPay — мы не храним твою карту или кошелёк. После оплаты тариф активируется автоматически, обычно за 1–3 минуты.
      </div>
    </motion.div>
  );
}
