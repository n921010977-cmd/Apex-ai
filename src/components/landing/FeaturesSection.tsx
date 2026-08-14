"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import type { Variants } from "framer-motion";

// Count-up number that starts when scrolled into view
function CountUp({ to, duration = 1400 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>{val}</span>;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const REPORT_SECTIONS = [
  "Investor summary",       "Business score (0–100)",
  "Financial forecast",     "Revenue projection",
  "Market analysis",        "Competitor breakdown",
  "SWOT analysis",          "Marketing strategy",
  "Customer profile",       "Launch plan",
  "30-day roadmap",         "90-day roadmap",
  "Growth strategy",        "Risk analysis",
  "Action checklist",
];

const FEATURES = [
  {
    title:       "Real boardroom thinking",
    description: "Not generic AI answers. Every director gives their own position, data and recommendations — like a real board meeting.",
    color:       "#8b5cf6",
    rgb:         "139,92,246",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14Z" />
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14Z" />
      </svg>
    ),
  },
  {
    title:       "Financial model in minutes",
    description: "The CFO builds a realistic revenue, cost and break-even forecast for your business model — not for an \u201caverage company\u201d.",
    color:       "#3b82f6",
    rgb:         "59,130,246",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6"  y1="20" x2="6"  y2="14" />
      </svg>
    ),
  },
  {
    title:       "Competitive intelligence",
    description: "The Analyst dissects competitors: positioning map, open niches and a differentiation strategy — exactly where you win.",
    color:       "#06b6d4",
    rgb:         "6,182,212",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    title:       "A report you can proudly show",
    description: "Presentation-grade PDF for investors, co-founders and banks. Download it and walk into the meeting.",
    color:       "#10b981",
    rgb:         "16,185,129",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
  },
];

// ─── Holographic icon (reused from executives section pattern) ────────────────

function HoloIcon({ color, rgb, icon }: { color: string; rgb: string; icon: React.ReactNode }) {
  return (
    <div style={{ position: "relative", width: 50, height: 50, flexShrink: 0 }}>
      {/* Bloom */}
      <div style={{
        position: "absolute", inset: -8, borderRadius: 24,
        background: `radial-gradient(circle, rgba(${rgb},0.4) 0%, transparent 70%)`,
        filter: "blur(8px)", pointerEvents: "none",
      }} />
      {/* Tile */}
      <div style={{
        position: "relative", width: 50, height: 50, borderRadius: 14,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: `linear-gradient(145deg, rgba(${rgb},0.32) 0%, rgba(${rgb},0.09) 100%)`,
        border: `1px solid rgba(${rgb},0.5)`,
        boxShadow: [
          `0 4px 20px rgba(${rgb},0.24)`,
          `inset 0 1px 0 rgba(255,255,255,0.24)`,
          `inset 0 -1px 0 rgba(${rgb},0.1)`,
        ].join(", "),
        overflow: "hidden",
      }}>
        {/* Top-left reflection */}
        <div style={{
          position: "absolute", top: 0, left: 0, width: "60%", height: "60%",
          borderRadius: "14px 0 40% 0",
          background: "linear-gradient(135deg, rgba(255,255,255,0.16) 0%, transparent 100%)",
          pointerEvents: "none",
        }} />
        <div style={{
          color, position: "relative", zIndex: 1,
          filter: `drop-shadow(0 0 7px rgba(${rgb},0.8)) drop-shadow(0 0 14px rgba(${rgb},0.35))`,
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Floating widget ──────────────────────────────────────────────────────────

function FloatingWidget({
  label, value, color, rgb, style,
}: { label: string; value: string; color: string; rgb: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        padding:        "12px 16px",
        borderRadius:   16,
        background:     "rgba(6,6,10,0.88)",
        backdropFilter: "blur(24px) saturate(180%)",
        border:         `1px solid rgba(${rgb},0.28)`,
        boxShadow:      [
          `0 0 0 1px rgba(${rgb},0.08)`,
          `0 0 28px rgba(${rgb},0.14)`,
          `0 12px 40px rgba(0,0,0,0.55)`,
          `inset 0 1px 0 rgba(255,255,255,0.08)`,
        ].join(", "),
        ...style,
      }}
    >
      {/* Shimmer top */}
      <div style={{
        position: "absolute", top: 0, left: "10%", right: "10%", height: 1,
        background: `linear-gradient(90deg, transparent, rgba(${rgb},0.6), transparent)`,
      }} />
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", letterSpacing: "0.1em", marginBottom: 5 }}>
        {label}
      </div>
      <div style={{ fontSize: 21, fontWeight: 700, color, letterSpacing: "-0.02em", lineHeight: 1 }}>
        {value}
      </div>
    </motion.div>
  );
}

// ─── Report card (left column) ────────────────────────────────────────────────

function ReportCard() {
  return (
    <div style={{ position: "relative", padding: "24px 8px 24px 8px" }}>

      {/* Floating widget – top right */}
      <div className="hidden lg:block" style={{ position: "absolute", top: 0, right: -8, zIndex: 10 }}>
        <FloatingWidget label="Revenue forecast" value="$2.4M / yr" color="#10b981" rgb="16,185,129"
          style={{ position: "relative" }} />
      </div>

      {/* Floating widget – bottom left */}
      <div className="hidden lg:block" style={{ position: "absolute", bottom: 0, left: -8, zIndex: 10 }}>
        <FloatingWidget label="Payback" value="month 8" color="#3b82f6" rgb="59,130,246"
          style={{ position: "relative" }} />
      </div>

      {/* Main glass card */}
      <div
        style={{
          borderRadius:   24,
          overflow:       "hidden",
          background:     "linear-gradient(160deg, rgba(20,14,40,0.85) 0%, rgba(6,6,12,0.92) 100%)",
          border:         "1px solid rgba(255,255,255,0.08)",
          boxShadow:      [
            "0 0 0 1px rgba(139,92,246,0.08)",
            "0 8px 40px rgba(0,0,0,0.6)",
            "0 32px 80px rgba(0,0,0,0.4)",
            "inset 0 1px 0 rgba(255,255,255,0.07)",
          ].join(", "),
          backdropFilter: "blur(24px) saturate(160%)",
        }}
      >
        {/* ─ Header row ─ */}
        <div style={{
          display:       "flex",
          alignItems:    "center",
          gap:           14,
          padding:       "18px 22px",
          borderBottom:  "1px solid rgba(255,255,255,0.06)",
        }}>
          {/* Doc icon */}
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: "linear-gradient(135deg, #7c3aed, #2563eb)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 20px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" width="20" height="20">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.01em" }}>
              Strategy report
            </div>
            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.32)", marginTop: 2 }}>
              Prepared by the AI board of directors
            </div>
          </div>
          {/* Complete badge */}
          <div style={{
            fontSize: 10.5, padding: "4px 10px", borderRadius: 999, fontWeight: 600,
            background: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.25)",
            color: "#34d399",
          }}>
            Ready
          </div>
        </div>

        {/* ─ Score section ─ */}
        <div style={{ padding: "22px 22px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", letterSpacing: "0.01em" }}>
              Viability score
            </span>
            <span style={{ fontSize: 42, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em", color: "#fff", display: "flex", alignItems: "baseline", gap: 2 }}>
              <CountUp to={87} /><span style={{ fontSize: 20, opacity: 0.4, fontWeight: 700 }}>/100</span>
            </span>
          </div>

          {/* Category breakdown — mini bar chart (single indigo accent) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {[
              { label: "Market potential",  v: 91 },
              { label: "Finance",           v: 83 },
              { label: "Feasibility",       v: 87 },
              { label: "Competitiveness",   v: 79 },
            ].map((c, i) => (
              <div key={c.label} style={{ display: "grid", gridTemplateColumns: "120px 1fr 30px", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.42)" }}>{c.label}</span>
                <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 999, overflow: "hidden" }}>
                  <motion.div
                    style={{ height: "100%", background: "linear-gradient(90deg, rgba(99,102,241,0.5), #6366f1)", borderRadius: 999 }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${c.v}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.1, delay: 0.3 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#a5b4fc", fontVariantNumeric: "tabular-nums", textAlign: "right" }}>{c.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─ Report contents ─ */}
        <div style={{ padding: "18px 22px 22px" }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.25)", marginBottom: 14,
          }}>
            Report Contents
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px 12px" }}>
            {REPORT_SECTIONS.map((section, i) => (
              <motion.div
                key={section}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.035 }}
              >
                {/* Glowing check circle */}
                <div style={{
                  width: 17, height: 17, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.32)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 5px rgba(16,185,129,0.18)",
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" width="10" height="10">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.3 }}>
                  {section}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

const listVar: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVar: Variants = {
  hidden: { opacity: 0, x: 28 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

export function FeaturesSection() {
  return (
    <section
      id="testimonials"
      style={{ position: "relative", padding: "96px 24px 112px", overflow: "hidden" }}
    >
      <style>{`
        @keyframes feat-badge-glow {
          0%, 100% { box-shadow: 0 0 0 0   rgba(16,185,129,0.25); }
          50%       { box-shadow: 0 0 0 5px rgba(16,185,129,0);    }
        }
      `}</style>

      {/* Ambient glows */}
      <div aria-hidden style={{ position:"absolute", top:"20%",    left:"8%",   width:600, height:600, background:"radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 65%)", filter:"blur(70px)", pointerEvents:"none" }} />
      <div aria-hidden style={{ position:"absolute", bottom:"15%", right:"8%",  width:600, height:600, background:"radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 65%)", filter:"blur(70px)", pointerEvents:"none" }} />
      <div aria-hidden style={{ position:"absolute", top:"50%",    left:"50%",  transform:"translate(-50%,-50%)", width:800, height:400, background:"radial-gradient(ellipse, rgba(6,182,212,0.04) 0%, transparent 65%)", filter:"blur(60px)", pointerEvents:"none" }} />

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* ── Header ── */}
        <motion.div
          style={{ textAlign: "center", marginBottom: 72 }}
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.75, ease: "easeOut" }}
        >
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 9,
            padding: "7px 20px", borderRadius: 999,
            border: "1px solid rgba(16,185,129,0.38)",
            background: "rgba(16,185,129,0.07)",
            marginBottom: 28,
            animation: "feat-badge-glow 3.5s ease-in-out infinite",
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
              background: "#10b981", boxShadow: "0 0 8px #10b981", display: "block",
            }} />
            <span className="term-mono" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6ee7b7" }}>
              // что внутри отчёта
            </span>
          </div>

          {/* Heading */}
          <h2 style={{ fontSize: "clamp(30px, 5vw, 56px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.07, margin: "0 0 20px", color: "#fff" }}>
            <span style={{ display: "block" }}>Everything you need to decide.</span>
            <span style={{ display: "block", color: "rgba(255,255,255,0.45)" }}>And nothing you don\u2019t.</span>
          </h2>

          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.38)", maxWidth: 520, margin: "0 auto", lineHeight: 1.65 }}>
            Every report has 15+ professional sections: from the financial model to an action plan for the first 90 days.
          </p>
        </motion.div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* Left — report card */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <ReportCard />
          </motion.div>

          {/* Right — feature list */}
          <motion.div
            className="flex flex-col gap-4"
            variants={listVar}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
          >
            {FEATURES.map((f) => (
              <motion.div
                key={f.title}
                variants={itemVar}
                style={{
                  display:        "flex",
                  gap:            18,
                  padding:        "18px 20px",
                  borderRadius:   20,
                  background:     `linear-gradient(135deg, rgba(${f.rgb},0.07) 0%, rgba(6,6,12,0.7) 100%)`,
                  border:         `1px solid rgba(${f.rgb},0.18)`,
                  boxShadow:      `0 0 0 1px rgba(${f.rgb},0.05), 0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
                  backdropFilter: "blur(16px)",
                }}
              >
                <HoloIcon color={f.color} rgb={f.rgb} icon={f.icon} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.01em", margin: "0 0 7px" }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", lineHeight: 1.65, margin: 0 }}>
                    {f.description}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* See a sample report link */}
            <motion.div variants={itemVar} style={{ paddingTop: 8 }}>
              <a
                href="/dashboard"
                style={{
                  display:        "inline-flex",
                  alignItems:     "center",
                  gap:            8,
                  fontSize:       14,
                  fontWeight:     600,
                  color:          "#a78bfa",
                  textDecoration: "none",
                  transition:     "color 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "#c4b5fd")}
                onMouseLeave={e => (e.currentTarget.style.color = "#a78bfa")}
              >
                See a sample report
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
