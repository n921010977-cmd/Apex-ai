"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

// ─── Animated count-up ────────────────────────────────────────────────────────
function AnimatedStat({ value }: { value: string }) {
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
    setDisplay(`${prefix}${fmt(0)}${suffix}`);
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      setDisplay(`${prefix}${fmt((1 - Math.pow(1 - p, 3)) * target)}${suffix}`);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>{display}</span>;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const ACCENT     = "#6366f1";
const ACCENT_RGB = "99,102,241";

const TESTIMONIALS = [
  { quote: "Потратили $30K на консалтинг, прежде чем нашли Apex AI. За один вечер получили стратегию лучшего качества.", name: "Dmitri Volkov",  role: "CEO, TechFlow SaaS",     avatar: "D" },
  { quote: "Business Analyst нашёл нишу, которую мы пропустили. Изменили позиционирование — выросли в 3 раза за квартал.", name: "Sarah Kim",     role: "Founder, MarketNest",    avatar: "S" },
  { quote: "CFO просчитал точку безубыточности точнее, чем наш финансовый советник за $500/час. Впечатляюще.", name: "Marco Rossi",  role: "Co-founder, InvoiceAI",  avatar: "M" },
  { quote: "Запустил ресторанный бизнес по стратегии от Apex AI. Вышел в плюс на 4 месяца раньше прогноза.", name: "Anna Petrova", role: "Owner, Bistro Verde",     avatar: "A" },
  { quote: "COO прописал операционный план так детально, что я просто следовал инструкциям. Теперь у меня команда 12 человек.", name: "Liam Carter",  role: "Founder, OpsTech",       avatar: "L" },
  { quote: "Legal Advisor предупредил о рисках корпоративной структуры. Сэкономил тысячи на юридических ошибках.", name: "Yuna Park",    role: "CEO, LegalFlow",          avatar: "Y" },
];

const STATS = [
  { value: "2,400+", label: "Основателей" },
  { value: "8,900+", label: "Стратегий создано" },
  { value: "4.9 / 5", label: "Средняя оценка" },
  { value: "$140M+", label: "Прогнозируемая выручка" },
];

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars() {
  return (
    <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
      {[0,1,2,3,4].map(i => (
        <svg key={i} viewBox="0 0 24 24" fill="#fbbf24" width="13" height="13">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function TestCard({ t, i }: { t: typeof TESTIMONIALS[number]; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: (i % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      style={{
        borderRadius: 20,
        padding: "22px 22px 20px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle top bevel */}
      <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }} />

      {/* Quote mark */}
      <div style={{ position: "absolute", top: 12, right: 18, fontSize: 64, lineHeight: 1, fontFamily: "Georgia, serif", color: "rgba(255,255,255,0.04)", userSelect: "none", pointerEvents: "none" }}>&ldquo;</div>

      <Stars />

      <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.72, marginBottom: 18, margin: "0 0 18px" }}>
        &ldquo;{t.quote}&rdquo;
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700, color: "#fff",
          background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`,
          border: "1px solid rgba(255,255,255,0.15)",
        }}>
          {t.avatar}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.88)" }}>{t.name}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{t.role}</div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────
export function TestimonialsSection() {
  return (
    <section id="testimonials" style={{ position: "relative", padding: "96px 24px 112px", overflow: "hidden" }}>

      {/* Single subtle background tint */}
      <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse 70% 60% at 50% 50%, rgba(${ACCENT_RGB},0.04) 0%, transparent 65%)`, pointerEvents: "none" }} />

      <style>{`
        @keyframes tm-marquee-l { from { transform:translateX(0) } to { transform:translateX(-50%) } }
        @keyframes tm-marquee-r { from { transform:translateX(-50%) } to { transform:translateX(0) } }
        .tm-track:hover { animation-play-state: paused }
        @media(prefers-reduced-motion:reduce){ .tm-track{ animation:none!important } }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <motion.div
          style={{ textAlign: "center", marginBottom: 60 }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 18px", borderRadius: 999, marginBottom: 24,
            border: `1px solid rgba(${ACCENT_RGB},0.28)`,
            background: `rgba(${ACCENT_RGB},0.07)`,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: ACCENT, display: "block" }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: `rgba(${ACCENT_RGB},0.9)` }}>
              Отзывы
            </span>
          </div>

          <h2 style={{ fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, margin: "0 0 14px", color: "#fff" }}>
            Тысячи основателей уже внутри
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.35)", maxWidth: 440, margin: "0 auto", lineHeight: 1.65 }}>
            Реальные результаты от реальных предпринимателей.
          </p>
        </motion.div>

        {/* Mobile: plain grid */}
        <div className="grid grid-cols-1 md:hidden" style={{ gap: 12 }}>
          {TESTIMONIALS.map((t, i) => <TestCard key={i} t={t} i={i} />)}
        </div>

        {/* Desktop: marquee rows */}
        <div className="hidden md:flex flex-col" style={{ gap: 12 }}>
          {[
            { items: TESTIMONIALS.slice(0, 3), anim: "tm-marquee-l 44s linear infinite" },
            { items: TESTIMONIALS.slice(3, 6), anim: "tm-marquee-r 52s linear infinite" },
          ].map((row, ri) => (
            <div key={ri} style={{ overflow: "hidden", maskImage: "linear-gradient(90deg, transparent, black 7%, black 93%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, black 7%, black 93%, transparent)" }}>
              <div className="tm-track" style={{ display: "flex", gap: 12, width: "max-content", animation: row.anim }}>
                {[...row.items, ...row.items].map((t, i) => (
                  <div key={i} style={{ width: 400, flexShrink: 0 }}>
                    <TestCard t={t} i={i % row.items.length} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 12, marginTop: 20 }}>
          {STATS.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              style={{
                borderRadius: 20, padding: "28px 20px 24px", textAlign: "center",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              <div style={{ fontSize: "clamp(30px, 3.5vw, 44px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 8, color: "#fff" }}>
                <AnimatedStat value={s.value} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: `rgba(${ACCENT_RGB},0.6)` }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
