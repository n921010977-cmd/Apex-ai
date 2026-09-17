"use client";

import { AnalysisDashboard } from "./hero/AnalysisDashboard";
import { ActionPlanCard } from "./hero/ActionPlanCard";
import { BenefitsStrip } from "./hero/BenefitsStrip";
import { CompetitorCard } from "./hero/CompetitorCard";
import { FloatingInsightCard } from "./hero/FloatingInsightCard";
import { GlobalDemandCard } from "./hero/GlobalDemandCard";
import { HeroCopy } from "./hero/HeroCopy";

// Ambient motes. Deterministic so server and client render the same markup;
// deliberately few and faint — they read as depth, not as an effect.
const MOTES = [
  { x: 14, y: 22, d: 34, delay: 0 },
  { x: 31, y: 68, d: 46, delay: 6 },
  { x: 47, y: 12, d: 38, delay: 3 },
  { x: 58, y: 81, d: 52, delay: 9 },
  { x: 72, y: 34, d: 42, delay: 2 },
  { x: 86, y: 58, d: 48, delay: 7 },
  { x: 92, y: 18, d: 36, delay: 4 },
];

export function HeroSection() {
  return (
    <section className="hero" aria-label="Turn your idea into a real business">
      {/* ── Environment ── */}
      <div className="hero-grid-bg" aria-hidden />
      <div className="hero-glow-primary" aria-hidden />
      <div className="hero-glow-support" aria-hidden />
      <div className="hero-vignette" aria-hidden />
      <div className="hero-motes" aria-hidden>
        {MOTES.map((m, i) => (
          <span
            key={i}
            style={{
              left: `${m.x}%`,
              top: `${m.y}%`,
              animationDuration: `${m.d}s`,
              animationDelay: `-${m.delay}s`,
            }}
          />
        ))}
      </div>

      {/* ── Content ── */}
      <div className="hero-inner">
        <div className="hero-layout">
          <HeroCopy />

          <div className="hero-stage-wrap">
            <div className="hero-stage">
              {/* DOM order pairs the two compact cards so the mobile grid has
                  no empty cell; on desktop position comes from CSS, and the
                  entrance delays below keep the intended reveal sequence. */}
              <AnalysisDashboard className="stage-main" />
              <FloatingInsightCard className="stage-market" delay={0.5} />
              <GlobalDemandCard className="stage-demand" delay={0.86} />
              <ActionPlanCard className="stage-plan" delay={0.68} />
              <CompetitorCard className="stage-competitor" delay={1.02} />
            </div>
          </div>
        </div>

        <BenefitsStrip />
      </div>
    </section>
  );
}
