"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CONTACT_EMAIL } from "@/lib/site";

const RGB = "124,58,237";

// ─── FAQ data (question = command, answer = console output) ──────────────────
const FAQ = [
  { cmd: "real-ai",   q: "Is this real AI or canned answers?",
    a: "Real AI agents built on frontier language models. Each of the 20 experts analyzes your specific business rather than fitting it into a template. The CEO synthesizes the team\u2019s findings into one report." },
  { cmd: "vs-chatgpt", q: "How is this better than plain ChatGPT?",
    a: "Instead of one answer you get 20 parallel specialist analyses. The CFO builds the financial model, the CMO plans go-to-market, the lawyer checks risks — all at once. Most importantly: they debate and cross-check each other." },
  { cmd: "trust",     q: "Can I trust the financial and legal conclusions?",
    a: "Reports give you a strategic foundation and direction, but do not replace professional advisors. The legal section is not legal advice. Verify critical decisions with qualified specialists." },
  { cmd: "speed",     q: "How long does a report take?",
    a: "Usually 2–5 minutes. All 20 agents work in parallel and the CEO merges the results into a structured report with 15+ sections." },
  { cmd: "free",      q: "What does the free tier include?",
    a: "20 AI messages, 2 strategies and 1 board meeting per month — enough to properly test the product. No credit card required." },
  { cmd: "export",    q: "Can I export reports?",
    a: "Yes — the pitch deck exports to presentation-grade PDF for investors, co-founders and banks (available on Pro and Max)." },
  { cmd: "security",  q: "Is my data safe?",
    a: "Your data is used only to generate your report and is never shared with third parties. Encrypted in transit and at rest." },
  { cmd: "discounts", q: "Do you offer startup or student discounts?",
    a: "Write to support — we discuss startup and student discounts individually." },
];

export function FaqSection() {
  const [sel, setSel] = useState(0);
  const [typed, setTyped] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Typewriter: answer "executes" in the console
  useEffect(() => {
    const full = FAQ[sel].a;
    setTyped("");
    let i = 0;
    const tick = () => {
      i += 4;
      setTyped(full.slice(0, i));
      if (i < full.length) timer.current = setTimeout(tick, 12);
    };
    timer.current = setTimeout(tick, 220);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [sel]);

  const doneTyping = typed.length >= FAQ[sel].a.length;

  return (
    <section id="faq" style={{ position: "relative", padding: "96px 24px 100px", overflow: "hidden" }}>
      <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse 60% 50% at 50% 40%, rgba(${RGB},0.04), transparent 65%)`, pointerEvents: "none" }} />

      <div style={{ maxWidth: 960, margin: "0 auto", position: "relative" }}>
        {/* Header */}
        <motion.div
          style={{ textAlign: "center", marginBottom: 44 }}
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="term-mono" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 8, marginBottom: 22, border: `1px solid rgba(${RGB},0.25)`, background: `rgba(${RGB},0.05)` }}>
            <span style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: `rgba(${RGB},0.85)` }}>// вопросы к системе</span>
          </div>
          <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 14px", color: "#fff" }}>
            Ask the system directly
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", maxWidth: 480, margin: "0 auto", lineHeight: 1.65 }}>
            Pick a query on the left — the console runs it and prints the answer.
          </p>
        </motion.div>

        {/* Console */}
        <motion.div
          initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 md:grid-cols-[minmax(260px,340px)_1fr]"
          style={{ gap: 0, borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.09)", background: "rgba(9,10,16,0.8)", backdropFilter: "blur(20px)", boxShadow: "0 24px 70px rgba(0,0,0,0.5)" }}
        >
          {/* Query list */}
          <div style={{ borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column" }}>
            <div className="term-mono" style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 10, letterSpacing: "0.16em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
              // доступные запросы
            </div>
            <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
              {FAQ.map((f, i) => {
                const active = sel === i;
                return (
                  <button key={f.cmd} onClick={() => setSel(i)}
                    className="term-mono"
                    style={{
                      display: "flex", alignItems: "baseline", gap: 8, textAlign: "left",
                      padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                      background: active ? `rgba(${RGB},0.12)` : "transparent",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? `rgba(${RGB},0.12)` : "transparent"; }}>
                    <span style={{ fontSize: 11, color: active ? "#818cf8" : "rgba(255,255,255,0.25)", flexShrink: 0 }}>&gt;</span>
                    <span style={{ fontSize: 12.5, lineHeight: 1.45, color: active ? "#fff" : "rgba(255,255,255,0.5)", fontFamily: "var(--font-geist-sans), system-ui", fontWeight: active ? 600 : 400 }}>
                      {f.q}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Output console */}
          <div style={{ display: "flex", flexDirection: "column", minHeight: 320 }}>
            <div className="term-mono" style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 10, letterSpacing: "0.16em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", display: "flex", justifyContent: "space-between" }}>
              <span>// вывод</span>
              <span style={{ color: doneTyping ? "#34d399" : "#fbbf24" }}>{doneTyping ? "OK" : "EXEC…"}</span>
            </div>
            <div className="term-mono" style={{ padding: "18px 20px", fontSize: 13, lineHeight: 1.9, flex: 1 }}>
              <div style={{ color: "#818cf8", marginBottom: 10 }}>
                $ vertlix query --{FAQ[sel].cmd}
              </div>
              <div style={{ color: "rgba(230,232,240,0.8)", whiteSpace: "pre-wrap", fontFamily: "var(--font-geist-sans), system-ui", fontSize: 14 }}>
                {typed}
                {!doneTyping && <span className="term-blink" style={{ color: "#818cf8" }}>▋</span>}
              </div>
            </div>
            <div className="term-mono" style={{ padding: "10px 18px", borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: 10, letterSpacing: "0.08em", color: "rgba(255,255,255,0.25)" }}>
              didn\u2019t find your answer? → <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#818cf8", textDecoration: "none" }}>support</a> · or ask in <a href="/chat" style={{ color: "#818cf8", textDecoration: "none" }}>Vertlix chat</a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
