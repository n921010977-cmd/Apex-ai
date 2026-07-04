"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ────────────────────────────────────────────────────────────────────────────
   ApexAI — cinematic hero sequence.
   Six agents idle → magnetic attraction → fusion → flash → explosion →
   particles morph into the "APEXAI" wordmark → settle & breathe → loop.
   Pure Canvas 2D + rAF (GPU-friendly sprite blitting, 60fps, no WebGL deps).
   ──────────────────────────────────────────────────────────────────────────── */

const AGENTS = [
  { short: "CEO", color: "#8b5cf6" },
  { short: "CFO", color: "#3b82f6" },
  { short: "CMO", color: "#10b981" },
  { short: "COO", color: "#f59e0b" },
  { short: "CTO", color: "#ec4899" },
  { short: "BA",  color: "#06b6d4" },
];

// phase durations (ms)
const PHASES = ["idle", "attract", "fusion", "flash", "explode", "morph", "settle"] as const;
const DUR =     [2800,    1300,      1400,     200,     600,        1500,     3600] as const;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInCubic  = (t: number) => t * t * t;
const easeInOut    = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function makeSprite(color: string, size = 64) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, color);
  grad.addColorStop(0.35, color);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.beginPath();
  g.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  g.fill();
  return c;
}

type P = {
  x: number; y: number; vx: number; vy: number;
  bx: number; by: number;        // idle drift anchor
  tx: number; ty: number;        // logo-morph target
  size: number; sprite: HTMLCanvasElement; seed: number;
};

export function HeroCinematic() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phaseName, setPhaseName] = useState<(typeof PHASES)[number]>("idle");
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext("2d")!;

    let W = 0, H = 0, DPR = 1;
    let particles: P[] = [];
    let textTargets: { x: number; y: number }[] = [];
    const whiteSprite = makeSprite("#ffffff");
    const cyanSprite = makeSprite("#7dd3fc");
    const violetSprite = makeSprite("#c4b5fd");
    const agentSprites = AGENTS.map(a => makeSprite(a.color));

    // agent runtime state
    const agentState = AGENTS.map((_, i) => ({
      ang: (i / AGENTS.length) * Math.PI * 2 - Math.PI / 2,
      x: 0, y: 0, sx: 0, sy: 0, trail: [] as { x: number; y: number }[],
    }));

    // ── sample the wordmark into target points ──
    function sampleText() {
      const off = document.createElement("canvas");
      off.width = W; off.height = H;
      const g = off.getContext("2d")!;
      g.clearRect(0, 0, W, H);
      g.fillStyle = "#fff";
      g.textAlign = "center";
      g.textBaseline = "middle";
      const fs = Math.max(44, Math.min(W * 0.19, 120));
      g.font = `800 ${fs}px "Geist", system-ui, -apple-system, sans-serif`;
      // slight tracking for a premium wordmark
      const text = "APEXAI";
      g.fillText(text, W / 2, H / 2);
      const data = g.getImageData(0, 0, W, H).data;
      const pts: { x: number; y: number }[] = [];
      const step = Math.max(3, Math.round(W / 150));
      for (let y = 0; y < H; y += step) {
        for (let x = 0; x < W; x += step) {
          if (data[(y * W + x) * 4 + 3] > 130) pts.push({ x, y });
        }
      }
      for (let i = pts.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pts[i], pts[j]] = [pts[j], pts[i]]; }
      textTargets = pts;
    }

    function initParticles() {
      const N = 780;
      particles = Array.from({ length: N }, () => {
        const x = Math.random() * W, y = Math.random() * H;
        const r = Math.random();
        const sprite = r < 0.7 ? whiteSprite : r < 0.85 ? cyanSprite : violetSprite;
        return {
          x, y, vx: 0, vy: 0, bx: x, by: y, tx: 0, ty: 0,
          size: 1.1 + Math.random() * 2.2, sprite, seed: Math.random() * Math.PI * 2,
        };
      });
    }

    function resize() {
      const rect = wrap.getBoundingClientRect();
      W = Math.round(rect.width);
      H = Math.round(rect.height);
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      sampleText();
      if (particles.length === 0) initParticles();
    }

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    // ── phase machine ──
    let phase = 0;
    let phaseStart = performance.now();
    let raf = 0;
    let lastPhaseNotified = -1;

    function enterPhase(p: number) {
      phase = p;
      phaseStart = performance.now();
      const center = { x: W / 2, y: H / 2 };
      if (PHASES[p] === "explode") {
        // burst from core
        for (const pt of particles) {
          const a = Math.random() * Math.PI * 2;
          const sp = 4 + Math.random() * 9;
          pt.x = center.x + (Math.random() - 0.5) * 8;
          pt.y = center.y + (Math.random() - 0.5) * 8;
          pt.vx = Math.cos(a) * sp;
          pt.vy = Math.sin(a) * sp;
        }
      }
      if (PHASES[p] === "morph") {
        particles.forEach((pt, i) => {
          const t = textTargets.length ? textTargets[i % textTargets.length] : center;
          pt.tx = t.x + (Math.random() - 0.5) * 2;
          pt.ty = t.y + (Math.random() - 0.5) * 2;
        });
      }
    }

    function draw(now: number) {
      const el = now - phaseStart;
      const name = PHASES[phase];
      const dur = DUR[phase];
      const cx = W / 2, cy = H / 2;

      if (phase !== lastPhaseNotified) { setPhaseName(name); lastPhaseNotified = phase; }

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      const idleR = Math.min(W, H) * 0.36;

      // ── update + draw agents ──
      const showAgents = phase <= 2;
      if (showAgents) {
        const t = now / 1000;
        agentState.forEach((a, i) => {
          let ax = 0, ay = 0, scale = 1;
          if (name === "idle") {
            const fa = a.ang + t * 0.18;
            ax = cx + Math.cos(fa) * idleR + Math.cos(t * 1.3 + i) * 6;
            ay = cy + Math.sin(fa) * idleR + Math.sin(t * 1.1 + i) * 6;
            a.sx = ax; a.sy = ay;
          } else if (name === "attract") {
            const p = easeInCubic(Math.min(el / dur, 1));
            ax = lerp(a.sx, cx, p);
            ay = lerp(a.sy, cy, p);
            scale = 1 - p * 0.25;
          } else { // fusion
            const p = Math.min(el / dur, 1);
            const r = lerp(idleR * 0.28, 0, easeInCubic(p));
            const spin = a.ang + p * p * 26;
            ax = cx + Math.cos(spin) * r;
            ay = cy + Math.sin(spin) * r;
            scale = 1 - p * 0.6;
          }
          a.x = ax; a.y = ay;

          // trail
          a.trail.push({ x: ax, y: ay });
          if (a.trail.length > 14) a.trail.shift();
          if (name !== "idle") {
            for (let k = 0; k < a.trail.length; k++) {
              const tp = a.trail[k];
              const alpha = (k / a.trail.length) * 0.5;
              const s = 10 * (k / a.trail.length) * scale;
              ctx.globalAlpha = alpha;
              ctx.drawImage(agentSprites[i], tp.x - s, tp.y - s, s * 2, s * 2);
            }
          }

          // orbiting micro-particles (idle)
          if (name === "idle") {
            for (let k = 0; k < 5; k++) {
              const oa = t * 2 + (k / 5) * Math.PI * 2;
              const orr = 20 + Math.sin(t * 2 + k) * 4;
              const ox = ax + Math.cos(oa) * orr;
              const oy = ay + Math.sin(oa) * orr;
              ctx.globalAlpha = 0.5;
              ctx.drawImage(whiteSprite, ox - 2, oy - 2, 4, 4);
            }
          }

          // agent glow orb (breathing)
          const breathe = 1 + Math.sin(t * 2 + i) * 0.06;
          const s = 34 * scale * breathe;
          ctx.globalAlpha = 0.9;
          ctx.drawImage(agentSprites[i], ax - s, ay - s, s * 2, s * 2);
          const cs = 9 * scale;
          ctx.globalAlpha = 1;
          ctx.drawImage(whiteSprite, ax - cs, ay - cs, cs * 2, cs * 2);
        });

        // connection lines between agents
        ctx.globalCompositeOperation = "source-over";
        const flow = (now / 1000) % 1;
        for (let i = 0; i < agentState.length; i++) {
          const a = agentState[i];
          const b = agentState[(i + 1) % agentState.length];
          ctx.strokeStyle = `rgba(140,160,255,${name === "idle" ? 0.12 : 0.06})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          // flowing energy dot
          ctx.globalCompositeOperation = "lighter";
          const fx = lerp(a.x, b.x, flow), fy = lerp(a.y, b.y, flow);
          ctx.globalAlpha = 0.7;
          ctx.drawImage(cyanSprite, fx - 4, fy - 4, 8, 8);
          ctx.globalCompositeOperation = "source-over";
          // line to core
          ctx.strokeStyle = "rgba(120,140,255,0.08)";
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(cx, cy); ctx.stroke();
        }
        ctx.globalCompositeOperation = "lighter";
      }

      // ── background drift particles (idle-ish) ──
      if (name === "idle" || name === "attract") {
        const gA = name === "idle" ? 0.5 : lerp(0.5, 0, el / dur);
        for (const pt of particles) {
          pt.bx += Math.cos(pt.seed + now / 4000) * 0.15;
          pt.by += Math.sin(pt.seed + now / 4000) * 0.15;
          pt.x = pt.bx; pt.y = pt.by;
          ctx.globalAlpha = gA * (0.3 + Math.sin(now / 700 + pt.seed) * 0.2);
          ctx.drawImage(pt.sprite, pt.x - pt.size, pt.y - pt.size, pt.size * 2, pt.size * 2);
        }
      }

      // ── fusion: energy core + expanding rings + inward spiral ──
      if (name === "fusion") {
        const p = Math.min(el / dur, 1);
        // spiral particles inward
        for (const pt of particles) {
          const dx = pt.x - cx, dy = pt.y - cy;
          const ang = Math.atan2(dy, dx) + 0.14;
          const r = Math.max(0, Math.hypot(dx, dy) * 0.94);
          pt.x = cx + Math.cos(ang) * r;
          pt.y = cy + Math.sin(ang) * r;
          ctx.globalAlpha = 0.5;
          ctx.drawImage(pt.sprite, pt.x - pt.size, pt.y - pt.size, pt.size * 2, pt.size * 2);
        }
        // expanding rings
        for (let k = 0; k < 3; k++) {
          const rp = ((el / 700 + k / 3) % 1);
          const rr = rp * Math.min(W, H) * 0.5;
          ctx.globalCompositeOperation = "source-over";
          ctx.strokeStyle = `rgba(180,200,255,${(1 - rp) * 0.25})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
          ctx.globalCompositeOperation = "lighter";
        }
        // core sphere grows + brightens
        const coreS = lerp(20, 64, easeOutCubic(p)) * (1 + Math.sin(now / 90) * 0.05);
        ctx.globalAlpha = 0.9;
        ctx.drawImage(violetSprite, cx - coreS, cy - coreS, coreS * 2, coreS * 2);
        const wc = lerp(8, 34, p);
        ctx.globalAlpha = 1;
        ctx.drawImage(whiteSprite, cx - wc, cy - wc, wc * 2, wc * 2);
      }

      // ── flash ──
      if (name === "flash") {
        const p = el / dur;
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = `rgba(255,255,255,${(1 - Math.abs(p - 0.5) * 2) * 0.9})`;
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "lighter";
        // lens flare streak
        ctx.globalAlpha = 1 - p;
        ctx.drawImage(whiteSprite, cx - W * 0.6, cy - 3, W * 1.2, 6);
        ctx.drawImage(whiteSprite, cx - 3, cy - H * 0.4, 6, H * 0.8);
      }

      // ── explode ──
      if (name === "explode") {
        const p = el / dur;
        for (const pt of particles) {
          pt.x += pt.vx; pt.y += pt.vy;
          pt.vx *= 0.94; pt.vy *= 0.94;
          ctx.globalAlpha = 0.9 * (1 - p * 0.3);
          ctx.drawImage(pt.sprite, pt.x - pt.size, pt.y - pt.size, pt.size * 2, pt.size * 2);
        }
      }

      // ── morph into APEXAI ──
      if (name === "morph") {
        const p = easeInOut(Math.min(el / dur, 1));
        for (const pt of particles) {
          pt.x = lerp(pt.x, pt.tx, 0.12 + p * 0.12);
          pt.y = lerp(pt.y, pt.ty, 0.12 + p * 0.12);
          ctx.globalAlpha = lerp(0.7, 1, p);
          ctx.drawImage(pt.sprite, pt.x - pt.size, pt.y - pt.size, pt.size * 2, pt.size * 2);
        }
      }

      // ── settle: logo breathes, ambient sparkle ──
      if (name === "settle") {
        const t = now / 1000;
        const breathe = 1 + Math.sin(t * 1.4) * 0.015;
        for (let i = 0; i < particles.length; i++) {
          const pt = particles[i];
          const jx = pt.tx + Math.sin(t * 1.5 + pt.seed) * 0.8;
          const jy = pt.ty + Math.cos(t * 1.5 + pt.seed) * 0.8;
          pt.x = lerp(pt.x, cx + (jx - cx) * breathe, 0.2);
          pt.y = lerp(pt.y, cy + (jy - cy) * breathe, 0.2);
          ctx.globalAlpha = 0.85 + Math.sin(t * 3 + pt.seed) * 0.15;
          ctx.drawImage(pt.sprite, pt.x - pt.size, pt.y - pt.size, pt.size * 2, pt.size * 2);
        }
        // rotating light ring behind logo
        ctx.globalCompositeOperation = "source-over";
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * 0.3);
        ctx.strokeStyle = "rgba(150,170,255,0.1)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(0, 0, W * 0.42, H * 0.16, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        ctx.globalCompositeOperation = "lighter";
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      // advance phase
      if (el >= dur) {
        const next = phase + 1;
        if (next >= PHASES.length) {
          // loop: reset particles to drift
          initParticles();
          enterPhase(0);
        } else {
          enterPhase(next);
        }
      }

      raf = requestAnimationFrame(draw);
    }

    if (reduced) {
      // static: draw settled logo once
      const cx = W / 2, cy = H / 2;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      if (textTargets.length === 0) sampleText();
      for (const t of textTargets) {
        ctx.globalAlpha = 0.9;
        ctx.drawImage(whiteSprite, t.x - 2, t.y - 2, 4, 4);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      setPhaseName("settle");
    } else {
      enterPhase(0);
      raf = requestAnimationFrame(draw);
    }

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [reduced]);

  const logoVisible = phaseName === "morph" || phaseName === "settle";

  return (
    <div
      ref={wrapRef}
      className="relative w-full"
      style={{ aspectRatio: "1 / 1", maxWidth: 520 }}
      aria-label="Анимация: шесть AI-агентов объединяются в единый интеллект ApexAI"
      role="img"
    >
      {/* ambient radial glow behind the scene */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 50%, rgba(99,102,241,0.14) 0%, rgba(6,182,212,0.05) 40%, transparent 70%)" }}
      />
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* crisp wordmark + tagline settle overlay */}
      <AnimatePresence>
        {logoVisible && (
          <motion.div
            key="logo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: phaseName === "settle" ? 0.2 : 0.6 }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={{ scale: [1, 1.015, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="text-[clamp(30px,7vw,58px)] font-extrabold tracking-tight"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #c4b5fd 45%, #7dd3fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 24px rgba(124,58,237,0.35))",
              }}
            >
              APEXAI
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.9 }}
              className="mt-3 text-[13px] tracking-wide"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              One Intelligence. Infinite Possibilities.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
