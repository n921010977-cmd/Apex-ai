"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { FileText, Presentation, Target, Users, ArrowRight, ShieldCheck, CreditCard, LifeBuoy } from "lucide-react";

// ─── Что получает пользователь ────────────────────────────────────────────────
// Раньше здесь были отзывы и метрики («2 400 основателей», «4.9/5», «$140M+»),
// которых у продукта нет. Придуманное социальное доказательство — это ложь
// покупателю и юридический риск, поэтому секция заменена на проверяемое:
// конкретные результаты, которые продукт действительно выдаёт, и честные
// условия покупки. Как только появятся настоящие отзывы — их место здесь.

const ACCENT = "#6366f1";
const RGB = "99,102,241";
const EASE = [0.22, 1, 0.36, 1] as const;

const DELIVERABLES = [
  {
    icon: Users,
    title: "Board review of your idea",
    what: "20 AI roles — CEO, CFO, CMO, lawyer, analyst and more — each examine your project from their own angle.",
    result: "A list of risks and decisions you would never spot alone.",
  },
  {
    icon: FileText,
    title: "Growth strategy",
    what: "Positioning, market, competitors, monetization model and priorities.",
    result: "A document you can take to your team and partners.",
  },
  {
    icon: Presentation,
    title: "Investor pitch deck",
    what: "Slides in the classic structure, with language and style options, edited right in the browser.",
    result: "A finished presentation with PDF export.",
  },
  {
    icon: Target,
    title: "30/60/90 plan and weekly focus",
    what: "Goals are broken into concrete steps with a checkable to-do list.",
    result: "You know what to do next Monday — not \"someday\".",
  },
];

const TRUST = [
  { icon: CreditCard,  title: "Monthly billing",  text: "One month at a time. Not happy? Simply don\u2019t renew." },
  { icon: ShieldCheck, title: "Transparent limits",  text: "Exactly how many requests each plan includes is on the pricing page and in your dashboard." },
  { icon: LifeBuoy,    title: "Human support",    text: "Email us via the footer — a person answers, not a bot." },
];

export function ProofSection() {
  const reduce = useReducedMotion();
  const rise = reduce ? {} : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 } };

  return (
    <section style={{ maxWidth: 1120, margin: "0 auto", padding: "80px 24px 96px" }}>
      <motion.div
        {...rise}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: EASE }}
        style={{ textAlign: "center", marginBottom: 48 }}
      >
        <div className="term-mono" style={{
          display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 8, marginBottom: 20,
          border: `1px solid rgba(${RGB},0.25)`, background: `rgba(${RGB},0.05)`,
        }}>
          <span style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: `rgba(${RGB},0.85)` }}>
            {"// what you get"}
          </span>
        </div>
        <h2 style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 14px", color: "#fff", textWrap: "balance" }}>
          Not \u201cAI access\u201d — four finished documents
        </h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", maxWidth: 560, margin: "0 auto", lineHeight: 1.65 }}>
          Describe your business once — walk away with results, not a chat transcript.
        </p>
      </motion.div>

      <div className="proof-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 14 }}>
        {DELIVERABLES.map((d, i) => (
          <motion.div
            key={d.title}
            {...rise}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, delay: i * 0.08, ease: EASE }}
            whileHover={reduce ? undefined : { y: -4 }}
            style={{
              borderRadius: 16, padding: "22px 24px",
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.045)",
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 10, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center",
              background: `rgba(${RGB},0.12)`, border: `1px solid rgba(${RGB},0.25)`,
            }}>
              <d.icon size={18} color="#a5b4fc" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 8, letterSpacing: "-0.01em" }}>{d.title}</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "rgba(255,255,255,0.5)", margin: "0 0 12px" }}>{d.what}</p>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: "#a5b4fc", fontWeight: 600 }}>{d.result}</div>
          </motion.div>
        ))}
      </div>

      {/* Честные условия покупки — вместо выдуманных гарантий */}
      <div className="proof-trust" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 14, marginTop: 14 }}>
        {TRUST.map((t, i) => (
          <motion.div
            key={t.title}
            {...rise}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.07, ease: EASE }}
            style={{ borderRadius: 16, padding: "18px 20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
              <t.icon size={15} color="#34d399" />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{t.title}</span>
            </div>
            <p style={{ fontSize: 12.5, lineHeight: 1.55, color: "rgba(255,255,255,0.42)", margin: 0 }}>{t.text}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        {...rise}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
        style={{ display: "flex", justifyContent: "center", marginTop: 36 }}
      >
        <Link
          href="/register"
          data-cta="proof-section"
          style={{
            display: "inline-flex", alignItems: "center", gap: 9, height: 52, padding: "0 30px", borderRadius: 13,
            fontSize: 15.5, fontWeight: 700, color: "#fff", textDecoration: "none",
            background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`,
            boxShadow: `0 8px 28px rgba(${RGB},0.4), inset 0 1px 0 rgba(255,255,255,0.16)`,
          }}
        >
          Start free <ArrowRight size={17} />
        </Link>
      </motion.div>

      <style>{`
        @media (max-width: 820px) {
          .proof-grid  { grid-template-columns: 1fr !important; }
          .proof-trust { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
