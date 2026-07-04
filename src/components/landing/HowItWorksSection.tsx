"use client";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

// ─── Step data ────────────────────────────────────────────────────────────────

const STEPS = [
  {
    number:      "01",
    color:       "#8b5cf6",
    rgb:         "139,92,246",
    title:       "Describe Your Business",
    description: "Tell us about your idea, market, or company. Be as specific as you want — our AI understands context and nuance.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    number:      "02",
    color:       "#22d3ee",
    rgb:         "34,211,238",
    title:       "CEO Delegates Work",
    description: "Your AI CEO analyzes the brief and assigns specialized tasks to each executive — CFO, CMO, COO, CTO, and more.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
        <circle cx="12" cy="6" r="3" />
        <path d="M12 9v3" />
        <circle cx="5"  cy="18" r="2" />
        <circle cx="19" cy="18" r="2" />
        <path d="M6.5 16.5 12 12l5.5 4.5" />
      </svg>
    ),
  },
  {
    number:      "03",
    color:       "#60a5fa",
    rgb:         "96,165,250",
    title:       "Executives Work in Parallel",
    description: "All 8 AI executives simultaneously research, analyze, and create their domain-specific strategies — in real time.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    number:      "04",
    color:       "#34d399",
    rgb:         "52,211,153",
    title:       "Premium Report Generated",
    description: "Your complete Business Strategy Report is assembled — financials, market analysis, roadmap, and everything in between.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9"  x2="8" y2="9"  />
      </svg>
    ),
  },
];

// ─── Animated connector between steps (desktop only) ─────────────────────────

function DataConnector({
  fromColor,
  toColor,
  index,
}: {
  fromColor: string;
  toColor:   string;
  index:     number;
}) {
  // 3 particles staggered
  const PARTICLE_DELAYS = [0, 0.87, 1.74];

  return (
    // Vertically aligned to match centre of the 60px icon box:
    // card padding-top 28 + number block ~24 + icon half (30) = ~82px from card top
    <div
      aria-hidden
      style={{
        flexShrink:  0,
        width:       68,
        alignSelf:   "flex-start",
        marginTop:   82,
        position:    "relative",
        height:      2,
      }}
    >
      {/* Gradient line */}
      <div
        style={{
          position:   "absolute",
          inset:      0,
          background: `linear-gradient(90deg, ${fromColor}55, ${toColor}55)`,
          borderRadius: 1,
        }}
      />
      {/* Soft glow behind line */}
      <div
        style={{
          position:   "absolute",
          top:        -4,
          bottom:     -4,
          left:       0,
          right:      0,
          background: `linear-gradient(90deg, ${fromColor}22, ${toColor}22)`,
          filter:     "blur(6px)",
        }}
      />
      {/* Moving light particles */}
      {PARTICLE_DELAYS.map((baseDelay, pi) => (
        <span
          key={pi}
          style={{
            position:      "absolute",
            top:           "50%",
            transform:     "translateY(-50%)",
            width:         5,
            height:        5,
            borderRadius:  "50%",
            background:    `linear-gradient(90deg, ${fromColor}, ${toColor})`,
            boxShadow:     `0 0 8px 2px ${fromColor}bb`,
            animationName: "hiw-particle",
            animationDuration: "2.6s",
            animationDelay:    `${baseDelay + index * 0.32}s`,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            left:          0,
          }}
        />
      ))}
    </div>
  );
}

// ─── Individual step card ─────────────────────────────────────────────────────

const cardVar: Variants = {
  hidden: { opacity: 0, y: 40 },
  show:   { opacity: 1, y: 0 },
};

function StepCard({ step, index }: { step: typeof STEPS[number]; index: number }) {
  return (
    <motion.div
      variants={cardVar}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.75, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8, transition: { type: "spring", stiffness: 260, damping: 20 } }}
      // flex-1 on desktop so all cards share equal width
      style={{ flex: 1, minWidth: 0 }}
    >
      <div
        style={{
          position:       "relative",
          height:         "100%",
          borderRadius:   24,
          padding:        "28px 22px 34px",
          overflow:       "hidden",
          background:     `linear-gradient(145deg, rgba(${step.rgb},0.09) 0%, rgba(255,255,255,0.022) 60%, rgba(${step.rgb},0.04) 100%)`,
          border:         `1px solid rgba(${step.rgb},0.24)`,
          boxShadow:      [
            `0 0 0 1px rgba(${step.rgb},0.06)`,
            `0 0 48px rgba(${step.rgb},0.09)`,
            `inset 0 1px 0 rgba(255,255,255,0.09)`,
          ].join(", "),
          backdropFilter: "blur(20px) saturate(180%)",
        }}
      >
        {/* Top shimmer bevel */}
        <div
          style={{
            position:   "absolute",
            top:        0,
            left:       "8%",
            right:      "8%",
            height:     1,
            background: `linear-gradient(90deg, transparent, rgba(${step.rgb},0.7), transparent)`,
          }}
        />
        {/* Corner ambient glow */}
        <div
          style={{
            position:   "absolute",
            top:        -50,
            right:      -50,
            width:      150,
            height:     150,
            background: `radial-gradient(circle, rgba(${step.rgb},0.16) 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        {/* Step number */}
        <span
          style={{
            display:       "block",
            fontFamily:    "ui-monospace, 'Cascadia Code', monospace",
            fontSize:      10,
            fontWeight:    700,
            letterSpacing: "0.26em",
            color:         step.color,
            marginBottom:  14,
          }}
        >
          {step.number}
        </span>

        {/* Icon tile */}
        <div
          style={{
            width:          60,
            height:         60,
            borderRadius:   16,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            marginBottom:   22,
            color:          step.color,
            background:     `linear-gradient(135deg, rgba(${step.rgb},0.2) 0%, rgba(${step.rgb},0.06) 100%)`,
            border:         `1px solid rgba(${step.rgb},0.32)`,
            boxShadow:      `0 0 24px rgba(${step.rgb},0.2), inset 0 1px 0 rgba(${step.rgb},0.25)`,
          }}
        >
          {step.icon}
        </div>

        {/* Title */}
        <h3
          style={{
            color:         "rgba(255,255,255,0.92)",
            fontWeight:    600,
            fontSize:      15.5,
            lineHeight:    1.35,
            letterSpacing: "-0.01em",
            marginBottom:  10,
            margin:        "0 0 10px",
          }}
        >
          {step.title}
        </h3>

        {/* Description */}
        <p
          style={{
            color:      "rgba(255,255,255,0.42)",
            fontSize:   13.5,
            lineHeight: 1.65,
            margin:     0,
          }}
        >
          {step.description}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function HowItWorksSection() {
  return (
    <section
      id="product"
      style={{ position: "relative", padding: "96px 24px 112px", overflow: "hidden" }}
    >
      {/* Keyframe animations */}
      <style>{`
        @keyframes hiw-particle {
          0%   { left: -6px;              opacity: 0; }
          8%   {                          opacity: 1; }
          92%  {                          opacity: 1; }
          100% { left: calc(100% + 6px); opacity: 0; }
        }
        @keyframes hiw-badge-glow {
          0%, 100% { box-shadow: 0 0 0 0   rgba(139,92,246,0.28), inset 0 0 8px  rgba(139,92,246,0.06); }
          50%       { box-shadow: 0 0 0 6px rgba(139,92,246,0),   inset 0 0 16px rgba(139,92,246,0.18); }
        }
        @keyframes hiw-dot-blink {
          0%, 100% { opacity: 1;   transform: scale(1);   }
          50%       { opacity: 0.3; transform: scale(0.55); }
        }
      `}</style>

      {/* Micro-grid background */}
      <div
        aria-hidden
        style={{
          position:        "absolute",
          inset:           0,
          backgroundImage: [
            "linear-gradient(rgba(255,255,255,0.027) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,0.027) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize:      "44px 44px",
          maskImage:           "radial-gradient(ellipse 88% 88% at 50% 50%, black 25%, transparent 100%)",
          WebkitMaskImage:     "radial-gradient(ellipse 88% 88% at 50% 50%, black 25%, transparent 100%)",
          pointerEvents:       "none",
        }}
      />

      {/* Ambient glows */}
      <div aria-hidden style={{ position:"absolute", top:"5%",    left:"5%",   width:560, height:560, background:"radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 65%)", filter:"blur(70px)", pointerEvents:"none" }} />
      <div aria-hidden style={{ position:"absolute", bottom:"5%", right:"5%",  width:560, height:560, background:"radial-gradient(circle, rgba(52,211,153,0.06)  0%, transparent 65%)", filter:"blur(70px)", pointerEvents:"none" }} />
      <div aria-hidden style={{ position:"absolute", top:"45%",   left:"42%",  width:380, height:380, background:"radial-gradient(circle, rgba(96,165,250,0.05)  0%, transparent 65%)", filter:"blur(50px)", pointerEvents:"none" }} />

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* ── Header ── */}
        <motion.div
          style={{ textAlign: "center", marginBottom: 72 }}
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.75, ease: "easeOut" }}
        >
          {/* Glowing badge */}
          <div
            style={{
              display:       "inline-flex",
              alignItems:    "center",
              gap:           9,
              padding:       "7px 20px",
              borderRadius:  999,
              border:        "1px solid rgba(139,92,246,0.42)",
              background:    "rgba(139,92,246,0.07)",
              marginBottom:  28,
              animation:     "hiw-badge-glow 3s ease-in-out infinite",
            }}
          >
            <span
              style={{
                display:      "block",
                width:        5,
                height:       5,
                borderRadius: "50%",
                background:   "#8b5cf6",
                boxShadow:    "0 0 8px #8b5cf6",
                animation:    "hiw-dot-blink 2s ease-in-out infinite",
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
              How It Works
            </span>
          </div>

          {/* Main heading */}
          <h2
            style={{
              fontSize:      "clamp(30px, 4.5vw, 52px)",
              fontWeight:    800,
              lineHeight:    1.08,
              letterSpacing: "-0.025em",
              margin:        "0 0 20px",
            }}
          >
            <span
              style={{
                display:              "block",
                background:           "linear-gradient(180deg, #ffffff 35%, rgba(255,255,255,0.68) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor:  "transparent",
                backgroundClip:       "text",
              }}
            >
              From Idea to Strategy
            </span>
            <span
              style={{
                display:              "block",
                background:           "linear-gradient(135deg, #c4b5fd 0%, #818cf8 45%, #60a5fa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor:  "transparent",
                backgroundClip:       "text",
              }}
            >
              in Under 5 Minutes
            </span>
          </h2>

          <p
            style={{
              fontSize:   17,
              color:      "rgba(255,255,255,0.40)",
              maxWidth:   520,
              margin:     "0 auto",
              lineHeight: 1.65,
            }}
          >
            No meetings. No lengthy onboarding. Just describe your business and watch your executive team get to work.
          </p>
        </motion.div>

        {/* ── Steps: mobile/tablet 2-col grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:hidden">
          {STEPS.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} />
          ))}
        </div>

        {/* ── Steps: desktop flex row with connectors ── */}
        <div className="hidden lg:flex items-start gap-0">
          {STEPS.map((step, i) => (
            <div key={step.number} style={{ display: "contents" }}>
              <StepCard step={step} index={i} />
              {i < STEPS.length - 1 && (
                <DataConnector
                  fromColor={step.color}
                  toColor={STEPS[i + 1].color}
                  index={i}
                />
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
