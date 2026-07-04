"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";

// Animated count-up that parses values like "2,400+", "$140M+", "4.9 / 5"
function AnimatedStatValue({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    if (!inView) return;
    const match = value.match(/^([^0-9]*)([\d,.]+)(.*)$/);
    if (!match) { setDisplay(value); return; }
    const [, prefix, numStr, suffix] = match;
    const hasComma = numStr.includes(",");
    const target = parseFloat(numStr.replace(/,/g, ""));
    const decimals = numStr.includes(".") ? (numStr.split(".")[1] ?? "").length : 0;
    let raf = 0;
    const start = performance.now();
    const dur = 1500;
    const fmt = (n: number) => {
      const fixed = n.toFixed(decimals);
      return hasComma ? Number(fixed).toLocaleString("en-US", { minimumFractionDigits: decimals }) : fixed;
    };
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(`${prefix}${fmt(eased * target)}${suffix}`);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    setDisplay(`${prefix}${fmt(0)}${suffix}`);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);
  return <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>{display}</span>;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote:  "Мы потратили $30K на консалтинг, прежде чем нашли Apex AI. За один вечер получили стратегию лучшего качества.",
    name:   "Dmitri Volkov",
    role:   "CEO, TechFlow SaaS",
    avatar: "D",
    color:  "#8b5cf6",
    rgb:    "139,92,246",
    rating: 5,
  },
  {
    quote:  "Business Analyst нашёл нишу, которую мы пропустили. Мы изменили позиционирование и выросли в 3 раза за квартал.",
    name:   "Sarah Kim",
    role:   "Founder, MarketNest",
    avatar: "S",
    color:  "#06b6d4",
    rgb:    "6,182,212",
    rating: 5,
  },
  {
    quote:  "CFO просчитал точку безубыточности точнее, чем наш финансовый советник за $500/час. Впечатляюще.",
    name:   "Marco Rossi",
    role:   "Co-founder, InvoiceAI",
    avatar: "M",
    color:  "#10b981",
    rgb:    "16,185,129",
    rating: 5,
  },
  {
    quote:  "Запустил ресторанный бизнес по стратегии от Apex AI. Вышел в плюс на 4 месяца раньше прогноза.",
    name:   "Anna Petrova",
    role:   "Owner, Bistro Verde",
    avatar: "A",
    color:  "#f59e0b",
    rgb:    "245,158,11",
    rating: 5,
  },
  {
    quote:  "COO прописал операционный план так детально, что я просто следовал инструкциям. Теперь у меня команда 12 человек.",
    name:   "Liam Carter",
    role:   "Founder, OpsTech",
    avatar: "L",
    color:  "#ec4899",
    rgb:    "236,72,153",
    rating: 5,
  },
  {
    quote:  "Legal Advisor предупредил о рисках корпоративной структуры. Сэкономил нам тысячи на юридических ошибках.",
    name:   "Yuna Park",
    role:   "CEO, LegalFlow",
    avatar: "Y",
    color:  "#6366f1",
    rgb:    "99,102,241",
    rating: 5,
  },
];

const STATS = [
  { value: "2,400+",  label: "Основателей",          color: "#8b5cf6", rgb: "139,92,246" },
  { value: "8,900+",  label: "Стратегий создано",     color: "#06b6d4", rgb: "6,182,212"  },
  { value: "4.9 / 5", label: "Средняя оценка",        color: "#f59e0b", rgb: "245,158,11" },
  { value: "$140M+",  label: "Прогнозируемая выручка", color: "#10b981", rgb: "16,185,129" },
];

// ─── Star row ─────────────────────────────────────────────────────────────────

function StarRow({ count }: { count: number }) {
  return (
    <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          fill="#fbbf24"
          width="14"
          height="14"
          style={{ filter: "drop-shadow(0 0 5px rgba(251,191,36,0.85))" }}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

// ─── Testimonial card ─────────────────────────────────────────────────────────

function TestimonialCard({
  t,
  index,
}: {
  t:     typeof TESTIMONIALS[number];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
      style={{
        position:       "relative",
        borderRadius:   22,
        padding:        "26px 24px 24px",
        overflow:       "hidden",
        background:     `linear-gradient(145deg, rgba(${t.rgb},0.07) 0%, rgba(10,10,18,0.88) 60%, rgba(${t.rgb},0.03) 100%)`,
        border:         `1px solid rgba(${t.rgb},0.22)`,
        boxShadow:      [
          `0 0 0 1px rgba(${t.rgb},0.06)`,
          `0 0 40px rgba(${t.rgb},0.07)`,
          `0 8px 32px rgba(0,0,0,0.5)`,
          `inset 0 1px 0 rgba(255,255,255,0.07)`,
        ].join(", "),
        backdropFilter: "blur(20px) saturate(160%)",
        cursor:         "default",
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
          background: `linear-gradient(90deg, transparent, rgba(${t.rgb},0.6), transparent)`,
        }}
      />

      {/* Corner ambient glow */}
      <div
        style={{
          position:      "absolute",
          top:           -60,
          right:         -60,
          width:         180,
          height:        180,
          borderRadius:  "50%",
          background:    `radial-gradient(circle, rgba(${t.rgb},0.14) 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Opening quote mark */}
      <div
        style={{
          position:   "absolute",
          top:        14,
          right:      20,
          fontSize:   72,
          lineHeight: 1,
          fontFamily: "Georgia, serif",
          color:      `rgba(${t.rgb},0.12)`,
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        &ldquo;
      </div>

      <StarRow count={t.rating} />

      <p
        style={{
          fontSize:   13.5,
          color:      "rgba(255,255,255,0.65)",
          lineHeight: 1.72,
          marginBottom: 20,
          margin:     "0 0 20px",
        }}
      >
        &ldquo;{t.quote}&rdquo;
      </p>

      {/* Avatar + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Avatar circle */}
        <div
          style={{
            flexShrink:     0,
            width:          44,
            height:         44,
            borderRadius:   "50%",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            fontSize:       15,
            fontWeight:     700,
            color:          "#fff",
            background:     `linear-gradient(135deg, ${t.color}, rgba(${t.rgb},0.55))`,
            border:         `1px solid rgba(${t.rgb},0.45)`,
            boxShadow:      `0 0 16px rgba(${t.rgb},0.4), inset 0 1px 0 rgba(255,255,255,0.2)`,
          }}
        >
          {t.avatar}
        </div>

        <div>
          <div
            style={{
              fontSize:      13,
              fontWeight:    600,
              color:         "rgba(255,255,255,0.92)",
              letterSpacing: "-0.005em",
            }}
          >
            {t.name}
          </div>
          <div
            style={{
              fontSize:  11.5,
              color:     `rgba(${t.rgb},0.7)`,
              marginTop: 2,
            }}
          >
            {t.role}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ stat, index }: { stat: typeof STATS[number]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.65, delay: 0.15 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.28 } }}
      style={{
        position:       "relative",
        borderRadius:   22,
        padding:        "32px 24px 28px",
        textAlign:      "center",
        overflow:       "hidden",
        background:     `linear-gradient(145deg, rgba(${stat.rgb},0.1) 0%, rgba(8,8,14,0.92) 100%)`,
        border:         `1px solid rgba(${stat.rgb},0.25)`,
        boxShadow:      [
          `0 0 0 1px rgba(${stat.rgb},0.07)`,
          `0 0 48px rgba(${stat.rgb},0.1)`,
          `0 8px 40px rgba(0,0,0,0.55)`,
          `inset 0 1px 0 rgba(255,255,255,0.07)`,
        ].join(", "),
        backdropFilter: "blur(20px)",
        cursor:         "default",
      }}
    >
      {/* Top bevel */}
      <div
        style={{
          position:   "absolute",
          top:        0,
          left:       "12%",
          right:      "12%",
          height:     1,
          background: `linear-gradient(90deg, transparent, rgba(${stat.rgb},0.7), transparent)`,
        }}
      />

      {/* Center radial bloom */}
      <div
        style={{
          position:   "absolute",
          bottom:     -40,
          left:       "50%",
          transform:  "translateX(-50%)",
          width:      180,
          height:     120,
          background: `radial-gradient(ellipse, rgba(${stat.rgb},0.18) 0%, transparent 70%)`,
          filter:     "blur(20px)",
          pointerEvents: "none",
        }}
      />

      {/* Value */}
      <div
        style={{
          fontSize:      "clamp(34px, 4vw, 48px)",
          fontWeight:    800,
          letterSpacing: "-0.03em",
          lineHeight:    1,
          marginBottom:  10,
          background:    `linear-gradient(180deg, #ffffff 20%, rgba(${stat.rgb},0.85) 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor:  "transparent",
          backgroundClip: "text",
          filter:        `drop-shadow(0 0 18px rgba(${stat.rgb},0.45))`,
        }}
      >
        <AnimatedStatValue value={stat.value} />
      </div>

      {/* Label */}
      <div
        style={{
          fontSize:      12,
          fontWeight:    500,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color:         `rgba(${stat.rgb},0.6)`,
        }}
      >
        {stat.label}
      </div>
    </motion.div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      style={{ position: "relative", padding: "96px 24px 112px", overflow: "hidden" }}
    >
      <style>{`
        @keyframes tm-badge-pulse {
          0%, 100% { box-shadow: 0 0 0 0   rgba(6,182,212,0.28); }
          50%       { box-shadow: 0 0 0 5px rgba(6,182,212,0);    }
        }
        @keyframes tm-word-glow {
          0%, 100% { text-shadow: 0 0 24px rgba(6,182,212,0.55), 0 0 48px rgba(6,182,212,0.25); }
          50%       { text-shadow: 0 0 36px rgba(6,182,212,0.80), 0 0 72px rgba(6,182,212,0.40); }
        }
        @keyframes tm-orb-drift {
          0%,100% { transform: translate(0, 0) scale(1);    }
          50%     { transform: translate(30px,-20px) scale(1.06); }
        }
      `}</style>

      {/* Ambient orbs */}
      <div aria-hidden style={{ position:"absolute", top:"8%",   left:"4%",   width:600, height:600, background:"radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 65%)",  filter:"blur(70px)", animation:"tm-orb-drift 14s ease-in-out infinite", pointerEvents:"none" }} />
      <div aria-hidden style={{ position:"absolute", bottom:"8%", right:"4%",  width:600, height:600, background:"radial-gradient(circle, rgba(6,182,212,0.06)   0%, transparent 65%)",  filter:"blur(70px)", animation:"tm-orb-drift 18s ease-in-out infinite reverse", pointerEvents:"none" }} />
      <div aria-hidden style={{ position:"absolute", top:"42%",  left:"38%",  width:420, height:420, background:"radial-gradient(circle, rgba(16,185,129,0.05)  0%, transparent 65%)",  filter:"blur(55px)", pointerEvents:"none" }} />

      {/* Micro-grid */}
      <div
        aria-hidden
        style={{
          position:        "absolute",
          inset:           0,
          backgroundImage: [
            "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize:      "48px 48px",
          maskImage:           "radial-gradient(ellipse 85% 85% at 50% 50%, black 20%, transparent 100%)",
          WebkitMaskImage:     "radial-gradient(ellipse 85% 85% at 50% 50%, black 20%, transparent 100%)",
          pointerEvents:       "none",
        }}
      />

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

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
              display:      "inline-flex",
              alignItems:   "center",
              gap:          9,
              padding:      "7px 20px",
              borderRadius: 999,
              border:       "1px solid rgba(6,182,212,0.35)",
              background:   "rgba(6,182,212,0.07)",
              marginBottom: 28,
              animation:    "tm-badge-pulse 3.5s ease-in-out infinite",
            }}
          >
            <span style={{
              display: "block", width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
              background: "#06b6d4", boxShadow: "0 0 8px #06b6d4",
            }} />
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.22em",
              textTransform: "uppercase", color: "#67e8f9",
            }}>
              Отзывы
            </span>
          </div>

          {/* Heading */}
          <h2
            style={{
              fontSize:      "clamp(30px, 4.5vw, 56px)",
              fontWeight:    800,
              letterSpacing: "-0.03em",
              lineHeight:    1.08,
              margin:        "0 0 16px",
              color:         "#ffffff",
            }}
          >
            Тысячи основателей уже{" "}
            <span
              style={{
                color:     "#38bdf8",
                animation: "tm-word-glow 3s ease-in-out infinite",
              }}
            >
              внутри
            </span>
          </h2>

          <p style={{
            fontSize:   17,
            color:      "rgba(255,255,255,0.35)",
            maxWidth:   480,
            margin:     "0 auto",
            lineHeight: 1.65,
          }}>
            Реальные результаты от реальных предпринимателей.
          </p>
        </motion.div>

        {/* ── Testimonials: mobile grid ── */}
        <div className="grid grid-cols-1 md:hidden" style={{ gap: 14 }}>
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={i} t={t} index={i} />
          ))}
        </div>

        {/* ── Testimonials: desktop infinite marquee (2 rows, opposite directions) ── */}
        <style>{`
          @keyframes tm-marquee-l { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          @keyframes tm-marquee-r { from { transform: translateX(-50%); } to { transform: translateX(0); } }
          .tm-track:hover { animation-play-state: paused; }
          @media (prefers-reduced-motion: reduce) { .tm-track { animation: none !important; } }
        `}</style>
        <div className="hidden md:flex flex-col" style={{ gap: 14 }}>
          {[
            { items: TESTIMONIALS.slice(0, 3), anim: "tm-marquee-l 42s linear infinite" },
            { items: TESTIMONIALS.slice(3, 6), anim: "tm-marquee-r 48s linear infinite" },
          ].map((row, ri) => (
            <div
              key={ri}
              style={{
                overflow: "hidden",
                maskImage: "linear-gradient(90deg, transparent, black 6%, black 94%, transparent)",
                WebkitMaskImage: "linear-gradient(90deg, transparent, black 6%, black 94%, transparent)",
              }}
            >
              <div className="tm-track" style={{ display: "flex", gap: 14, width: "max-content", animation: row.anim }}>
                {[...row.items, ...row.items].map((t, i) => (
                  <div key={i} style={{ width: 420, flexShrink: 0 }}>
                    <TestimonialCard t={t} index={i % row.items.length} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Stats row ── */}
        <div
          className="grid grid-cols-2 md:grid-cols-4"
          style={{ gap: 14, marginTop: 20 }}
        >
          {STATS.map((stat, i) => (
            <StatCard key={i} stat={stat} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
}
