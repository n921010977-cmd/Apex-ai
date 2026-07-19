"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { markVisit } from "@/components/dashboard/EngagementPanel";
import { loadTasks, addTask, toggleTask, deleteTask, clearDone, type Task, type Priority } from "@/lib/tasks";
import {
  CheckSquare, Plus, Check, Trash2, Flag, Filter, Sparkles, ChevronDown,
} from "lucide-react";

// ── Tokens ────────────────────────────────────────────────────────────────────
const BG   = "#05060A";
const BORD = "rgba(255,255,255,0.07)";
const TP   = "#E5E7EB";
const TS   = "rgba(255,255,255,0.5)";
const TM   = "rgba(255,255,255,0.3)";
const ACCENT = "#6366f1";
const MONO = "var(--font-geist-mono), ui-monospace, monospace";
const EASE = [0.22, 1, 0.36, 1] as const;

const PRIO: Record<Priority, { label: string; color: string }> = {
  high:   { label: "Высокий", color: "#ef4444" },
  medium: { label: "Средний", color: "#f59e0b" },
  low:    { label: "Низкий",  color: "#10b981" },
};
const PRIO_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [prio, setPrio]   = useState<Priority>("medium");
  const [filter, setFilter] = useState<"active" | "all" | "done">("active");
  const [prioOpen, setPrioOpen] = useState(false);

  const refresh = useCallback(() => setTasks(loadTasks()), []);
  useEffect(() => {
    markVisit("tasks");
    refresh();
    const on = () => refresh();
    window.addEventListener("vertlix-tasks-changed", on);
    return () => window.removeEventListener("vertlix-tasks-changed", on);
  }, [refresh]);

  const add = useCallback(() => {
    if (!title.trim()) return;
    addTask({ title, priority: prio });
    setTitle("");
    refresh();
  }, [title, prio, refresh]);

  const stats = useMemo(() => {
    const done = tasks.filter(t => t.done).length;
    return { total: tasks.length, done, active: tasks.length - done, pct: tasks.length ? Math.round(done / tasks.length * 100) : 0 };
  }, [tasks]);

  const visible = useMemo(() => {
    return tasks
      .filter(t => filter === "all" || (filter === "done" ? t.done : !t.done))
      .sort((a, b) => (a.done === b.done ? PRIO_ORDER[a.priority] - PRIO_ORDER[b.priority] || b.createdAt - a.createdAt : a.done ? 1 : -1));
  }, [tasks, filter]);

  return (
    <div style={{ minHeight: "100%", background: BG, padding: "28px 32px 60px" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }}
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 36, height: 36, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#6366f1,#4f46e5)", boxShadow: "0 6px 18px rgba(99,102,241,0.4)" }}>
              <CheckSquare size={18} color="#fff" />
            </span>
            <h1 style={{ fontSize: "clamp(22px,2.6vw,30px)", fontWeight: 800, color: TP, letterSpacing: "-0.02em", margin: 0 }}>Задачи</h1>
          </div>
          <p style={{ fontSize: 13.5, color: TS, marginTop: 8, maxWidth: 560, lineHeight: 1.6 }}>
            Превращайте рекомендации совета в конкретные действия и отслеживайте прогресс.
          </p>
        </div>
        {stats.done > 0 && (
          <button onClick={() => { clearDone(); refresh(); }}
            style={{ display: "flex", alignItems: "center", gap: 7, height: 40, padding: "0 15px", borderRadius: 11, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: `1px solid ${BORD}`, color: TS, fontSize: 12.5, fontWeight: 600 }}>
            <Trash2 size={13} /> Очистить выполненные
          </button>
        )}
      </motion.div>

      {/* Progress */}
      {stats.total > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.05 }}
          className="surface-card" style={{ marginTop: 22, padding: "16px 18px", borderRadius: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: TM }}>Прогресс</span>
            <span style={{ fontSize: 13, color: TS }}><b style={{ color: TP }}>{stats.done}</b> из {stats.total} · {stats.pct}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${stats.pct}%` }} transition={{ duration: 0.9, ease: EASE }}
              style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg,#6366f1,#10b981)" }} />
          </div>
        </motion.div>
      )}

      {/* Add task */}
      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === "Enter") add(); }}
          placeholder="Новая задача… (Enter — добавить)"
          style={{ flex: "1 1 260px", minWidth: 220, height: 46, padding: "0 14px", borderRadius: 12, border: `1px solid ${BORD}`, background: "rgba(255,255,255,0.035)", color: TP, fontSize: 14, outline: "none", boxSizing: "border-box" }}
          onFocus={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")} onBlur={e => (e.currentTarget.style.borderColor = BORD)} />
        {/* priority selector */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setPrioOpen(o => !o)}
            style={{ height: 46, padding: "0 14px", borderRadius: 12, border: `1px solid ${BORD}`, background: "rgba(255,255,255,0.035)", color: PRIO[prio].color, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}>
            <Flag size={13} /> {PRIO[prio].label} <ChevronDown size={13} style={{ opacity: 0.5 }} />
          </button>
          <AnimatePresence>
            {prioOpen && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.13 }}
                style={{ position: "absolute", top: 50, left: 0, zIndex: 30, minWidth: 150, background: "#0a0c15", border: `1px solid ${BORD}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}>
                {(Object.keys(PRIO) as Priority[]).map(p => (
                  <button key={p} onClick={() => { setPrio(p); setPrioOpen(false); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", border: "none", background: prio === p ? "rgba(255,255,255,0.05)" : "transparent", color: PRIO[p].color, fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
                    <Flag size={12} /> {PRIO[p].label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button onClick={add} disabled={!title.trim()}
          style={{ height: 46, padding: "0 20px", borderRadius: 12, border: "none", cursor: title.trim() ? "pointer" : "default", fontSize: 13.5, fontWeight: 700, color: "#fff",
            background: title.trim() ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "rgba(255,255,255,0.06)", boxShadow: title.trim() ? "0 6px 20px rgba(99,102,241,0.32)" : "none", display: "flex", alignItems: "center", gap: 8 }}>
          <Plus size={16} /> Добавить
        </button>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        {([["active", "Активные", stats.active], ["all", "Все", stats.total], ["done", "Выполнено", stats.done]] as const).map(([key, label, n]) => {
          const active = filter === key;
          return (
            <button key={key} onClick={() => setFilter(key)}
              style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 13px", borderRadius: 10, cursor: "pointer", border: `1px solid ${active ? "rgba(99,102,241,0.5)" : BORD}`, background: active ? "rgba(99,102,241,0.14)" : "transparent", color: active ? "#a5b4fc" : TS, fontSize: 12.5, fontWeight: 600 }}>
              {key === "active" && <Filter size={12} />}{label}<span style={{ fontFamily: MONO, fontSize: 10, opacity: 0.7 }}>{n}</span>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
        {visible.length === 0 && (
          <div style={{ padding: "56px 0", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 15, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Sparkles size={20} style={{ color: ACCENT }} />
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: TS }}>{filter === "done" ? "Пока ничего не выполнено" : "Задач нет"}</div>
            <div style={{ fontSize: 12.5, color: TM, marginTop: 4 }}>Добавьте задачу выше или создайте её из ответа совета.</div>
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {visible.map((t, i) => {
            const p = PRIO[t.priority];
            return (
              <motion.div key={t.id} layout
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.28, ease: EASE, delay: Math.min(i * 0.02, 0.2) }}
                className="surface-card" style={{ padding: "13px 15px", borderRadius: 13, display: "flex", alignItems: "center", gap: 12, opacity: t.done ? 0.55 : 1 }}>
                {/* checkbox */}
                <button onClick={() => toggleTask(t.id)}
                  style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    background: t.done ? "#10b981" : "transparent", border: `2px solid ${t.done ? "#10b981" : "rgba(255,255,255,0.2)"}`, transition: "all 0.15s" }}>
                  {t.done ? <Check size={13} color="#fff" strokeWidth={3} /> : null}
                </button>
                {/* priority dot */}
                <span title={p.label} style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0, boxShadow: t.done ? "none" : `0 0 6px ${p.color}` }} />
                {/* title */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, color: t.done ? TM : TP, textDecoration: t.done ? "line-through" : "none", lineHeight: 1.4 }}>{t.title}</div>
                  {t.source && t.source !== "Вручную" && (
                    <div style={{ fontFamily: MONO, fontSize: 9.5, color: TM, marginTop: 3 }}>из: {t.source}</div>
                  )}
                </div>
                {/* delete */}
                <button onClick={() => deleteTask(t.id)} title="Удалить"
                  style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", color: TM, cursor: "pointer" }}
                  onMouseOver={e => (e.currentTarget.style.color = "#ef4444")} onMouseOut={e => (e.currentTarget.style.color = TM)}>
                  <Trash2 size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
