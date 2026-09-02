"use client";

import { motion } from "framer-motion";
import { MousePointerClick, Wallet, ShieldCheck, Unlock } from "lucide-react";

// ─── Блок «How payment works» на странице тарифов ───────────────────────────
// Успокаивает клиента перед оплатой: платёж через OxaPay в USDT, мы проверяем
// подпись, тариф включается автоматически. Ставится над таблицей сравнения.

const ACCENT = "#7C3AED";
const RGB = "124,58,237";
const EASE = [0.22, 1, 0.36, 1] as const;

const STEPS = [
  { icon: MousePointerClick, title: "Pick a plan", desc: "One click opens a secure payment page" },
  { icon: Wallet,            title: "Pay in USDT",  desc: "On the OxaPay page, crypto transfer (TRC-20)" },
  { icon: ShieldCheck,       title: "We verify it", desc: "OxaPay\u2019s signature is checked — impossible to fake" },
  { icon: Unlock,            title: "Plan activates", desc: "Automatically, right after confirmation" },
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
        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>How payment works</span>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>— secure, in crypto</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ position: "relative", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg,${ACCENT},#6D28D9)`, boxShadow: `0 4px 14px rgba(${RGB},0.35)` }}>
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
        Payments go through OxaPay — we never store your card or wallet. After payment your plan activates automatically, usually within 1–3 minutes.
      </div>
    </motion.div>
  );
}
