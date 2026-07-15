"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Brain, Zap, Users, BarChart2, Shield, TrendingUp,
  ArrowRight, Check, X, Star,
} from "lucide-react";

const STORAGE_KEY = "apex-onboarded-v1";

const INDUSTRIES = [
  { id: "saas",    label: "SaaS / Продукт",      icon: Zap },
  { id: "ecomm",  label: "E-commerce",            icon: TrendingUp },
  { id: "fin",    label: "Финтех / Финансы",      icon: BarChart2 },
  { id: "health", label: "Здоровье / Медтех",     icon: Shield },
  { id: "edtech", label: "Образование",           icon: Brain },
  { id: "other",  label: "Другое",                icon: Star },
];

const GOALS = [
  { id: "validate", label: "Валидировать идею" },
  { id: "strategy", label: "Построить стратегию" },
  { id: "invest",   label: "Подготовить питч" },
  { id: "scale",    label: "Масштабировать бизнес" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export function OnboardingModal() {
  const [show, setShow]       = useState(false);
  const [step, setStep]       = useState(0);
  const [industry, setIndustry] = useState<string | null>(null);
  const [goal, setGoal]       = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    setClosing(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, "1");
      setShow(false);
    }, 300);
  };

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    dismiss();
    router.push("/dashboard/new");
  };

  if (!show) return null;

  const STEPS = [
    // Step 0: Welcome
    <motion.div key="s0"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: EASE }}
      style={{ textAlign: "center" }}
    >
      {/* Animated logo */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
        <motion.div
          animate={{ scale: [1, 1.06, 1], rotate: [0, 3, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: 72, height: 72, borderRadius: 20,
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            boxShadow: "0 8px 32px rgba(99,102,241,0.45), 0 0 0 1px rgba(255,255,255,0.12) inset",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </motion.div>
      </div>

      <h2 style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", margin: "0 0 10px", textWrap: "balance" } as React.CSSProperties}>
        Добро пожаловать в Apex AI
      </h2>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, margin: "0 0 32px", maxWidth: 380, marginLeft: "auto", marginRight: "auto" }}>
        У вас есть совет из 20 AI-директоров — CEO, CFO, CMO и другие. Они готовы помочь с любым бизнес-решением прямо сейчас.
      </p>

      {/* Team preview */}
      <div style={{ display: "flex", justifyContent: "center", gap: -8, marginBottom: 32 }}>
        {[
          { ab: "SR", c: "#6366f1" }, { ab: "MC", c: "#3b82f6" }, { ab: "ET", c: "#10b981" },
          { ab: "JW", c: "#f59e0b" }, { ab: "AP", c: "#a855f7" },
        ].map((m, i) => (
          <motion.div key={m.ab}
            initial={{ opacity: 0, scale: 0.5, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.08, ease: EASE }}
            style={{
              width: 44, height: 44, borderRadius: 14,
              background: `linear-gradient(135deg, ${m.c}, ${m.c}99)`,
              border: "2px solid rgba(5,6,10,1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, color: "#fff",
              marginLeft: i > 0 ? -10 : 0,
              position: "relative", zIndex: 5 - i,
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}>
            {m.ab}
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, ease: EASE }}
          style={{
            width: 44, height: 44, borderRadius: 14,
            background: "rgba(255,255,255,0.06)", border: "2px solid rgba(5,6,10,1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)",
            marginLeft: -10, zIndex: 0,
          }}>
          +15
        </motion.div>
      </div>

      {/* Agent count badges */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 36, flexWrap: "wrap" }}>
        {[
          { icon: Brain,     label: "20 AI-директоров" },
          { icon: BarChart2, label: "Анализ рынков" },
          { icon: Shield,    label: "Оценка рисков" },
        ].map(b => {
          const Icon = b.icon;
          return (
            <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 10, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <Icon size={12} color="#818cf8" />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#a5b4fc" }}>{b.label}</span>
            </div>
          );
        })}
      </div>

      <button onClick={() => setStep(1)} style={{
        width: "100%", height: 48, borderRadius: 14,
        background: "linear-gradient(135deg, #6366f1, #4f46e5)",
        border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
        boxShadow: "0 6px 24px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.16)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        Начать <ArrowRight size={16} />
      </button>
    </motion.div>,

    // Step 1: Industry
    <motion.div key="s1"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <Users size={18} color="#818cf8" />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.12em" }}>Шаг 1 из 2</span>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", margin: "0 0 6px" }}>
        В какой отрасли вы работаете?
      </h2>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "0 0 24px" }}>
        Агенты адаптируют свои анализы под вашу сферу
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
        {INDUSTRIES.map(ind => {
          const Icon = ind.icon;
          const sel = industry === ind.id;
          return (
            <button key={ind.id} onClick={() => setIndustry(ind.id)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 14px", borderRadius: 12, cursor: "pointer",
              background: sel ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.025)",
              border: `1px solid ${sel ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.07)"}`,
              color: sel ? "#a5b4fc" : "rgba(255,255,255,0.55)",
              fontSize: 13, fontWeight: sel ? 700 : 500,
              transition: "all 0.15s", textAlign: "left",
            }}>
              <Icon size={15} />
              {ind.label}
              {sel && <Check size={13} style={{ marginLeft: "auto", color: "#6366f1" }} />}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setStep(0)} style={{
          flex: "0 0 auto", height: 44, padding: "0 18px", borderRadius: 12,
          background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.45)", fontSize: 13, cursor: "pointer",
        }}>Назад</button>
        <button onClick={() => setStep(2)} disabled={!industry} style={{
          flex: 1, height: 44, borderRadius: 12,
          background: industry ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "rgba(255,255,255,0.05)",
          border: "none", color: industry ? "#fff" : "rgba(255,255,255,0.2)",
          fontSize: 14, fontWeight: 700, cursor: industry ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          transition: "all 0.2s",
        }}>
          Продолжить <ArrowRight size={14} />
        </button>
      </div>
    </motion.div>,

    // Step 2: Goal
    <motion.div key="s2"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <Zap size={18} color="#818cf8" />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.12em" }}>Шаг 2 из 2</span>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", margin: "0 0 6px" }}>
        Какова ваша главная цель?
      </h2>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "0 0 24px" }}>
        Это поможет агентам дать максимально релевантные рекомендации
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
        {GOALS.map(g => {
          const sel = goal === g.id;
          return (
            <button key={g.id} onClick={() => setGoal(g.id)} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 16px", borderRadius: 12, cursor: "pointer",
              background: sel ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.025)",
              border: `1px solid ${sel ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.07)"}`,
              color: sel ? "#a5b4fc" : "rgba(255,255,255,0.65)",
              fontSize: 14, fontWeight: sel ? 700 : 500,
              transition: "all 0.15s", textAlign: "left",
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: 6, border: `2px solid ${sel ? "#6366f1" : "rgba(255,255,255,0.2)"}`,
                background: sel ? "#6366f1" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                transition: "all 0.15s",
              }}>
                {sel && <Check size={11} color="#fff" />}
              </div>
              {g.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setStep(1)} style={{
          flex: "0 0 auto", height: 48, padding: "0 18px", borderRadius: 12,
          background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.45)", fontSize: 13, cursor: "pointer",
        }}>Назад</button>
        <button onClick={finish} disabled={!goal} style={{
          flex: 1, height: 48, borderRadius: 12,
          background: goal ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "rgba(255,255,255,0.05)",
          border: "none", color: goal ? "#fff" : "rgba(255,255,255,0.2)",
          fontSize: 14, fontWeight: 700, cursor: goal ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: goal ? "0 6px 24px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.16)" : "none",
          transition: "all 0.2s",
        }}>
          Запустить анализ <Zap size={15} />
        </button>
      </div>
    </motion.div>,
  ];

  return (
    <AnimatePresence>
      {show && !closing && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={dismiss}
            style={{
              position: "fixed", inset: 0, zIndex: 1000,
              background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.35, ease: EASE }}
            style={{
              position: "fixed", left: "50%", top: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1001, width: "min(480px, calc(100vw - 32px))",
              background: "rgba(10,11,18,0.98)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 24,
              boxShadow: "0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
              padding: "36px 32px 32px",
              backdropFilter: "blur(24px)",
            }}
          >
            {/* Close */}
            <button onClick={dismiss} style={{
              position: "absolute", top: 16, right: 16,
              width: 32, height: 32, borderRadius: 10,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.35)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <X size={14} />
            </button>

            {/* Step dots */}
            <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  height: 3, borderRadius: 99,
                  width: i === step ? 24 : 8,
                  background: i <= step ? "#6366f1" : "rgba(255,255,255,0.1)",
                  transition: "all 0.3s ease",
                }} />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {STEPS[step]}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
