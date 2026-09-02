"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Flame, Trophy, CheckCircle, ArrowRight, Zap, Star, Lock } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;
const STREAK_KEY   = "apex-streak-v1";      // { count, lastDate }
const PROGRESS_KEY = "apex-progress-v1";    // Set of visited page keys

// ─── Daily Insight (rotates daily by date hash) ───────────────────────────────
const DAILY_INSIGHTS = [
  { title: "Фокус на retention, не acquisition",   body: "Увеличение retention на 5% повышает прибыль на 25–95%. Спросите CMO — как удерживать клиентов дешевле." },
  { title: "Ценообразование — самый быстрый рычаг", body: "1% рост цены = 11% рост прибыли. CFO готов построить ценовую модель прямо сейчас." },
  { title: "B2B или B2C: ответьте раз и навсегда",  body: "Смешанная GTM-стратегия убивает фокус. Совет CEO: выберите один канал и идите в него до предела." },
  { title: "CAC окупается дольше, чем кажется",     body: "Типичный SaaS: CAC payback 12–18 мес. Спросите CFO — ваша модель сходится?" },
  { title: "Ваш конкурент — не конкурент",          body: "Настоящий враг — инерция клиента. CMO поможет сформулировать почему менять нужно СЕЙЧАС." },
  { title: "Продукт растёт, команда — нет",         body: "Масштаб без процессов ломает компании. COO готов разработать операционный план на 90 дней." },
  { title: "Технический долг дороже, чем кажется",  body: "Каждый месяц без рефакторинга = +20% к следующей смете. Спросите CTO о приоритетах." },
];

function getDailyInsight() {
  const dayIndex = Math.floor(Date.now() / 86400000);
  return DAILY_INSIGHTS[dayIndex % DAILY_INSIGHTS.length];
}

// ─── Progress milestones ──────────────────────────────────────────────────────
const MILESTONES = [
  { key: "dashboard",    label: "Открыть дашборд",         href: "/dashboard",            xp: 10 },
  { key: "executives",   label: "Зайти в Исполн. совет",   href: "/dashboard/executives", xp: 20 },
  { key: "new",          label: "Создать первый анализ",    href: "/dashboard/new",        xp: 30 },
  { key: "reports",      label: "Посмотреть отчёты",        href: "/dashboard/reports",    xp: 20 },
  { key: "vault",        label: "Открыть Knowledge Vault",  href: "/dashboard/vault",      xp: 15 },
  { key: "chat",         label: "Написать AI-агенту",       href: "/dashboard/chat",       xp: 25 },
];

// ─── Streak logic ─────────────────────────────────────────────────────────────
function getStreak(): { count: number; isToday: boolean } {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { count: 0, isToday: false };
    const { count, lastDate } = JSON.parse(raw);
    const today    = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (lastDate === today) return { count, isToday: true };
    if (lastDate === yesterday) return { count, isToday: false };
    return { count: 0, isToday: false };
  } catch { return { count: 0, isToday: false }; }
}

function updateStreak() {
  const { count, isToday } = getStreak();
  if (isToday) return count;
  const newCount = (count || 0) + 1;
  localStorage.setItem(STREAK_KEY, JSON.stringify({ count: newCount, lastDate: new Date().toDateString() }));
  return newCount;
}

function getProgress(): Set<string> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set<string>();
  } catch { return new Set<string>(); }
}

export function markVisit(pageKey: string) {
  const p = getProgress();
  p.add(pageKey);
  localStorage.setItem(PROGRESS_KEY, JSON.stringify([...p]));
}

// ─── Component ────────────────────────────────────────────────────────────────
export function EngagementPanel() {
  const [streak, setStreak]     = useState(0);
  const [progress, setProgress] = useState<Set<string>>(new Set());
  const [showDetail, setShowDetail] = useState(false);
  const insight = useMemo(() => getDailyInsight(), []);
  const router = useRouter();

  useEffect(() => {
    const s = updateStreak();
    setStreak(s);
    setProgress(getProgress());
  }, []);

  const done  = MILESTONES.filter(m => progress.has(m.key));
  const todo  = MILESTONES.filter(m => !progress.has(m.key));
  const xpTotal = MILESTONES.reduce((s, m) => s + m.xp, 0);
  const xpEarned = done.reduce((s, m) => s + m.xp, 0);
  const pct   = Math.round((done.length / MILESTONES.length) * 100);

  const nextMilestone = todo[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── Streak + XP ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ease: EASE }}
        style={{
          background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, padding: "16px 18px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.28)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(251,146,60,0.12)", border: "1px solid rgba(251,146,60,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Flame size={15} color="#fb923c" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#E5E7EB" }}>Серия активности</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>Заходите каждый день</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#fb923c", letterSpacing: "-0.03em" }}>{streak}🔥</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{streak === 1 ? "день" : streak < 5 ? "дня" : "дней"}</div>
          </div>
        </div>

        {/* Streak mini-calendar: last 7 days */}
        <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
          {Array.from({ length: 7 }, (_, i) => {
            const daysAgo = 6 - i;
            const filled = daysAgo < streak;
            const isToday = daysAgo === 0;
            const day = new Date(Date.now() - daysAgo * 86400000);
            const label = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"][day.getDay()];
            return (
              <div key={i} style={{ flex: 1, textAlign: "center" }}>
                <div style={{
                  height: 28, borderRadius: 8,
                  background: filled ? (isToday ? "#fb923c" : "rgba(251,146,60,0.3)") : "rgba(255,255,255,0.04)",
                  border: `1px solid ${filled ? (isToday ? "rgba(251,146,60,0.6)" : "rgba(251,146,60,0.2)") : "rgba(255,255,255,0.06)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, color: filled ? (isToday ? "#fff" : "rgba(251,146,60,0.9)") : "rgba(255,255,255,0.2)",
                  fontWeight: filled ? 800 : 400,
                  boxShadow: isToday && filled ? "0 0 10px rgba(251,146,60,0.4)" : "none",
                }}>✓</div>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", marginTop: 3, fontVariantNumeric: "tabular-nums" }}>{label}</div>
              </div>
            );
          })}
        </div>

        {/* XP / Progress */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Trophy size={11} color="#f59e0b" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b" }}>{xpEarned} XP</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>/ {xpTotal} XP</span>
          </div>
          <button onClick={() => setShowDetail(v => !v)} style={{ fontSize: 10, color: "rgba(124,58,237,0.8)", background: "none", border: "none", cursor: "pointer" }}>
            {showDetail ? "скрыть" : `${pct}% пройдено →`}
          </button>
        </div>
        <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.4, duration: 0.9, ease: EASE }}
            style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg, #7C3AED, #D946EF)" }} />
        </div>

        {/* Milestone detail */}
        <AnimatePresence>
          {showDetail && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: EASE }} style={{ overflow: "hidden" }}>
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                {MILESTONES.map(m => {
                  const isDone = progress.has(m.key);
                  return (
                    <button key={m.key} onClick={() => !isDone && router.push(m.href)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "8px 10px", borderRadius: 10, cursor: isDone ? "default" : "pointer",
                        background: isDone ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isDone ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)"}`,
                        textAlign: "left",
                      }}>
                      {isDone
                        ? <CheckCircle size={13} color="#10b981" style={{ flexShrink: 0 }} />
                        : <Lock size={13} color="rgba(255,255,255,0.25)" style={{ flexShrink: 0 }} />}
                      <span style={{ flex: 1, fontSize: 12, color: isDone ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.7)" }}>{m.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: isDone ? "#10b981" : "#a5b4fc" }}>+{m.xp} XP</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Daily AI Insight ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, ease: EASE }}
        style={{
          background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.2)",
          borderRadius: 16, padding: "16px 18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <Star size={12} color="#818cf8" />
          <span style={{ fontSize: 10, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.12em" }}>Инсайт дня</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#E5E7EB", marginBottom: 6, lineHeight: 1.4 }}>{insight.title}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 12 }}>{insight.body}</div>
        <button onClick={() => router.push("/dashboard/executives")}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, cursor: "pointer",
            background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)",
            color: "#a5b4fc", fontSize: 12, fontWeight: 700,
          }}>
          <Zap size={12} />Спросить совет <ArrowRight size={11} />
        </button>
      </motion.div>

      {/* ── Next milestone ── */}
      {nextMilestone && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, ease: EASE }}
          onClick={() => router.push(nextMilestone.href)}
          whileHover={{ y: -2 }}
          style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: "14px 16px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 12,
          }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(217,70,239,0.12)", border: "1px solid rgba(217,70,239,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Trophy size={16} color="#D946EF" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "rgba(217,70,239,0.8)", fontWeight: 700, marginBottom: 2 }}>СЛЕДУЮЩАЯ ЦЕЛЬ</div>
            <div style={{ fontSize: 13, color: "#E5E7EB", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nextMilestone.label}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#a5b4fc" }}>+{nextMilestone.xp} XP</span>
            <ArrowRight size={13} color="rgba(255,255,255,0.3)" />
          </div>
        </motion.div>
      )}
    </div>
  );
}
