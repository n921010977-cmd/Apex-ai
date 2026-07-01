"use client";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

// ─── Executive data ───────────────────────────────────────────────────────────

const EXECUTIVES = [
  {
    role:             "CEO",
    title:            "Chief Executive Officer",
    description:      "Coordinates the entire executive team, synthesizes all insights into a unified vision, and delivers the executive summary with key decisions.",
    responsibilities: ["Executive Strategy", "Vision & Direction", "Team Coordination", "Final Decisions"],
    color:            "#8b5cf6",
    rgb:              "139,92,246",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="26" height="26">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    role:             "CFO",
    title:            "Chief Financial Officer",
    description:      "Builds complete financial models, revenue projections, cost analysis, and investment requirements for your business.",
    responsibilities: ["Revenue Projections", "Budget Planning", "Cash Flow", "Investment Analysis"],
    color:            "#3b82f6",
    rgb:              "59,130,246",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="26" height="26">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    role:             "CMO",
    title:            "Chief Marketing Officer",
    description:      "Develops brand positioning, go-to-market strategy, customer acquisition funnels, and content marketing plans.",
    responsibilities: ["Brand Strategy", "Customer Acquisition", "Content Plan", "Social Media"],
    color:            "#10b981",
    rgb:              "16,185,129",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="26" height="26">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    role:             "Business Analyst",
    title:            "Market Intelligence",
    description:      "Deep market research, competitor analysis, customer segmentation, industry trends, and business opportunity mapping.",
    responsibilities: ["Market Research", "SWOT Analysis", "Competitor Intel", "Customer Persona"],
    color:            "#f59e0b",
    rgb:              "245,158,11",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="26" height="26">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    role:             "COO",
    title:            "Chief Operations Officer",
    description:      "Creates the operational roadmap, launch plan, process design, team structure, and 30/90-day execution timeline.",
    responsibilities: ["Launch Roadmap", "Operations Design", "Hiring Plan", "Workflow Systems"],
    color:            "#f43f5e",
    rgb:              "244,63,94",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="26" height="26">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
  },
  {
    role:             "Sales Director",
    title:            "Revenue & Growth",
    description:      "Designs sales funnels, pricing models, lead generation strategies, and customer retention frameworks.",
    responsibilities: ["Sales Funnel", "Pricing Strategy", "Lead Generation", "Retention Plans"],
    color:            "#6366f1",
    rgb:              "99,102,241",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="26" height="26">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
  {
    role:             "Legal Advisor",
    title:            "Compliance & Structure",
    description:      "Business structure recommendations, compliance considerations, IP protection, and risk identification. (Not legal advice.)",
    responsibilities: ["Business Structure", "IP Strategy", "Risk Analysis", "Compliance Notes"],
    color:            "#94a3b8",
    rgb:              "148,163,184",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="26" height="26">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    role:             "CTO",
    title:            "Chief Technology Officer",
    description:      "Recommends the optimal technology stack, infrastructure design, automation opportunities, and technical roadmap.",
    responsibilities: ["Tech Stack", "Infrastructure", "Automation", "Technical Roadmap"],
    color:            "#d946ef",
    rgb:              "217,70,239",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="26" height="26">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
];

// ─── Holographic 3D icon tile ─────────────────────────────────────────────────

function HoloIcon({ color, rgb, icon }: { color: string; rgb: string; icon: React.ReactNode }) {
  return (
    <div style={{ position: "relative", width: 58, height: 58, flexShrink: 0 }}>
      {/* Ambient bloom behind the tile */}
      <div
        style={{
          position:   "absolute",
          inset:      -10,
          borderRadius: 28,
          background: `radial-gradient(circle, rgba(${rgb},0.45) 0%, transparent 70%)`,
          filter:     "blur(10px)",
          pointerEvents: "none",
        }}
      />

      {/* Main icon tile */}
      <div
        style={{
          position:       "relative",
          width:          58,
          height:         58,
          borderRadius:   17,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          background:     `linear-gradient(145deg, rgba(${rgb},0.38) 0%, rgba(${rgb},0.1) 100%)`,
          border:         `1px solid rgba(${rgb},0.55)`,
          boxShadow:      [
            `0 0 0 1px rgba(${rgb},0.08)`,
            `0 6px 24px rgba(${rgb},0.28)`,
            `0 12px 40px rgba(0,0,0,0.4)`,
            `inset 0 1px 0 rgba(255,255,255,0.28)`,
            `inset 0 -1px 0 rgba(${rgb},0.12)`,
            `inset 1px 0 0 rgba(255,255,255,0.1)`,
          ].join(", "),
          overflow: "hidden",
        }}
      >
        {/* Top-left holographic reflection */}
        <div
          style={{
            position:     "absolute",
            top:          0,
            left:         0,
            width:        "65%",
            height:       "65%",
            borderRadius: "17px 0 40% 0",
            background:   "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        />
        {/* Bottom-right depth shadow */}
        <div
          style={{
            position:   "absolute",
            bottom:     0,
            right:      0,
            width:      "50%",
            height:     "50%",
            background: `linear-gradient(315deg, rgba(0,0,0,0.3) 0%, transparent 100%)`,
            borderRadius: "0 0 17px 0",
            pointerEvents: "none",
          }}
        />

        {/* Icon with glow */}
        <div
          style={{
            position: "relative",
            zIndex:   1,
            color:    color,
            filter:   `drop-shadow(0 0 8px rgba(${rgb},0.85)) drop-shadow(0 0 16px rgba(${rgb},0.4))`,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Executive card ───────────────────────────────────────────────────────────

const cardVar: Variants = {
  hidden: { opacity: 0, y: 36 },
  show:   { opacity: 1, y: 0 },
};

function ExecCard({ exec, index }: { exec: typeof EXECUTIVES[number]; index: number }) {
  // Stagger: top row 0–3 appear first, bottom row 4–7 after
  const delay = (index % 4) * 0.1 + Math.floor(index / 4) * 0.18;

  return (
    <motion.div
      variants={cardVar}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        y:         -10,
        boxShadow: [
          `0 0 0 1px rgba(${exec.rgb},0.22)`,
          `0 20px 60px rgba(${exec.rgb},0.2)`,
          `0 40px 80px rgba(0,0,0,0.6)`,
          `inset 0 1px 0 rgba(255,255,255,0.12)`,
        ].join(", "),
        transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
      }}
      style={{
        position:       "relative",
        borderRadius:   22,
        padding:        "22px 20px 24px",
        overflow:       "hidden",
        cursor:         "default",
        height:         "100%",
        display:        "flex",
        flexDirection:  "column",
        gap:            18,
        background:     `linear-gradient(145deg, rgba(${exec.rgb},0.1) 0%, rgba(8,8,12,0.9) 55%, rgba(${exec.rgb},0.05) 100%)`,
        border:         `1px solid rgba(${exec.rgb},0.22)`,
        boxShadow:      [
          `0 0 0 1px rgba(${exec.rgb},0.06)`,
          `0 8px 32px rgba(0,0,0,0.5)`,
          `0 24px 64px rgba(0,0,0,0.35)`,
          `inset 0 1px 0 rgba(255,255,255,0.08)`,
          `inset 1px 0 0 rgba(255,255,255,0.04)`,
        ].join(", "),
        backdropFilter: "blur(20px) saturate(160%)",
      }}
    >
      {/* Top shimmer bevel */}
      <div
        style={{
          position:   "absolute",
          top:        0,
          left:       "6%",
          right:      "6%",
          height:     1,
          background: `linear-gradient(90deg, transparent, rgba(${exec.rgb},0.7), transparent)`,
        }}
      />
      {/* Corner ambient bloom */}
      <div
        style={{
          position:   "absolute",
          top:        -40,
          right:      -40,
          width:      130,
          height:     130,
          background: `radial-gradient(circle, rgba(${exec.rgb},0.16) 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Icon */}
      <HoloIcon color={exec.color} rgb={exec.rgb} icon={exec.icon} />

      {/* Role + title */}
      <div style={{ flex: 0 }}>
        <span
          style={{
            display:       "block",
            fontSize:      10,
            fontWeight:    700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color:         exec.color,
            marginBottom:  6,
            fontFamily:    "ui-monospace, monospace",
          }}
        >
          {exec.role}
        </span>
        <span
          style={{
            display:       "block",
            fontSize:      15,
            fontWeight:    600,
            color:         "rgba(255,255,255,0.92)",
            lineHeight:    1.3,
            letterSpacing: "-0.01em",
          }}
        >
          {exec.title}
        </span>
      </div>

      {/* Description */}
      <p
        style={{
          fontSize:   12.5,
          color:      "rgba(255,255,255,0.40)",
          lineHeight: 1.65,
          margin:     0,
          flex:       1,
        }}
      >
        {exec.description}
      </p>

      {/* Skill tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {exec.responsibilities.map((r) => (
          <span
            key={r}
            style={{
              fontSize:      10,
              padding:       "3px 8px",
              borderRadius:  999,
              border:        `1px solid rgba(${exec.rgb},0.2)`,
              background:    `rgba(${exec.rgb},0.06)`,
              color:         `rgba(${exec.rgb},0.8)`,
              letterSpacing: "0.01em",
            }}
          >
            {r}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function ExecutivesSection() {
  return (
    <section
      id="executives"
      style={{ position: "relative", padding: "96px 24px 112px", overflow: "hidden" }}
    >
      <style>{`
        @keyframes exec-badge-glow {
          0%, 100% { box-shadow: 0 0 0 0   rgba(139,92,246,0.25); }
          50%       { box-shadow: 0 0 0 5px rgba(139,92,246,0);    }
        }
      `}</style>

      {/* Deep radial bg glow */}
      <div
        aria-hidden
        style={{
          position:   "absolute",
          top:        "30%",
          left:       "50%",
          transform:  "translate(-50%, -50%)",
          width:      900,
          height:     900,
          background: "radial-gradient(ellipse, rgba(139,92,246,0.07) 0%, transparent 65%)",
          filter:     "blur(60px)",
          pointerEvents: "none",
        }}
      />
      <div aria-hidden style={{ position:"absolute", bottom:"10%", left:"10%",  width:400, height:400, background:"radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 65%)", filter:"blur(50px)", pointerEvents:"none" }} />
      <div aria-hidden style={{ position:"absolute", top:"20%",    right:"10%", width:400, height:400, background:"radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 65%)", filter:"blur(50px)", pointerEvents:"none" }} />

      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* ── Header ── */}
        <motion.div
          style={{ textAlign: "center", marginBottom: 64 }}
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.75, ease: "easeOut" }}
        >
          {/* Badge */}
          <div
            style={{
              display:       "inline-flex",
              alignItems:    "center",
              gap:           9,
              padding:       "7px 20px",
              borderRadius:  999,
              border:        "1px solid rgba(139,92,246,0.38)",
              background:    "rgba(139,92,246,0.07)",
              marginBottom:  28,
              animation:     "exec-badge-glow 3.5s ease-in-out infinite",
            }}
          >
            <span
              style={{
                width: 5, height: 5,
                borderRadius: "50%",
                background:   "#8b5cf6",
                boxShadow:    "0 0 8px #8b5cf6",
                display:      "block",
                flexShrink:   0,
              }}
            />
            <span
              style={{
                fontSize:      10,
                fontWeight:    700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color:         "#c4b5fd",
              }}
            >
              AI Executive Board
            </span>
          </div>

          {/* Title */}
          <h2
            style={{
              fontSize:      "clamp(32px, 5vw, 56px)",
              fontWeight:    800,
              letterSpacing: "-0.025em",
              lineHeight:    1.06,
              margin:        "0 0 20px",
              background:    "linear-gradient(180deg, #ffffff 30%, rgba(255,255,255,0.65) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor:  "transparent",
              backgroundClip:       "text",
            }}
          >
            Meet Your Executive Team
          </h2>

          <p
            style={{
              fontSize:   17,
              color:      "rgba(255,255,255,0.38)",
              maxWidth:   600,
              margin:     "0 auto",
              lineHeight: 1.65,
            }}
          >
            Eight specialized AI executives, each an expert in their domain, collaborating to deliver a complete business strategy.
          </p>
        </motion.div>

        {/* ── Bento 4×2 grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {EXECUTIVES.map((exec, i) => (
            <ExecCard key={exec.role} exec={exec} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
}
