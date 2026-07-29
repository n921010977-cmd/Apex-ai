"use client";

import { useState, useEffect, useMemo } from "react";
import { Flag, Plus, Trash2, TrendingUp, Sparkles, Loader2, Check, X, CalendarClock } from "lucide-react";
import { INDUSTRIES } from "@/lib/industries";
import { track, EVENTS } from "@/lib/analytics/events";

// ─── Цели и фокус недели — возвращаемость (пункт 4) ────────────────────────────
// Пользователь заводит измеримые цели, обновляет прогресс, и раз в неделю просит
// AI дать фокус: на чём сосредоточиться. Смысл — чтобы человек возвращался в
// продукт, а не уходил после одного ответа. Данные в localStorage: работает без
// базы (демо-режим), переживает перезагрузку. Каждое обновление прогресса
// пишется в историю чек-инов — видно динамику и «серию» недель.

const ACCENT = "#6366f1";
const RGB = "99,102,241";
const KEY = "vertlix_goals";

type Check = { value: number; ts: number };
type Goal = {
  id: string;
  title: string;
  metric: string;
  start: number;
  current: number;
  target: number;
  deadline: string;
  checks: Check[];
};

function load(): Goal[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function persist(goals: Goal[]) {
  try { localStorage.setItem(KEY, JSON.stringify(goals)); } catch { /* noop */ }
}

function progress(g: Goal): number {
  const span = g.target - g.start;
  if (span === 0) return g.current >= g.target ? 100 : 0;
  return Math.max(0, Math.min(100, Math.round(((g.current - g.start) / span) * 100)));
}

// ─── очень лёгкий markdown → JSX для фокуса ───────────────────────────────────
function FocusView({ text }: { text: string }) {
  const blocks = useMemo(() => {
    const out: React.ReactNode[] = [];
    let list: string[] = [];
    const flush = () => {
      if (!list.length) return;
      const L = list; list = [];
      out.push(<ul key={out.length} style={{ margin: "4px 0 12px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>{L.map((it, i) => <li key={i} style={{ fontSize: 13, lineHeight: 1.5, color: "rgba(255,255,255,0.75)", display: "flex", gap: 8 }}><span style={{ color: ACCENT }}>▸</span><span>{inline(it)}</span></li>)}</ul>);
    };
    for (const raw of text.split("\n")) {
      const line = raw.trimEnd();
      if (/^##\s+/.test(line)) { flush(); out.push(<div key={out.length} style={{ fontSize: 14.5, fontWeight: 750, color: "#fff", margin: out.length ? "16px 0 6px" : "0 0 6px", display: "flex", gap: 8, alignItems: "center" }}><span style={{ width: 3, height: 15, borderRadius: 2, background: ACCENT }} />{line.replace(/^##\s+/, "")}</div>); }
      else if (/^[-*•]\s+/.test(line)) list.push(line.replace(/^[-*•]\s+/, ""));
      else if (/^\d+[.)]\s+/.test(line)) list.push(line.replace(/^\d+[.)]\s+/, ""));
      else if (line.trim() === "") flush();
      else { flush(); out.push(<p key={out.length} style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.72)", margin: "0 0 8px" }}>{inline(line)}</p>); }
    }
    flush();
    return out;
  }, [text]);
  return <div>{blocks}</div>;
}
function inline(t: string): React.ReactNode {
  const parts = t.split(/(\*\*.+?\*\*)/g);
  return parts.map((p, i) => p.startsWith("**") && p.endsWith("**")
    ? <strong key={i} style={{ color: "#fff", fontWeight: 700 }}>{p.slice(2, -2)}</strong>
    : <span key={i}>{p}</span>);
}

const BLANK = { title: "", metric: "", start: "", current: "", target: "", deadline: "" };

import { PlanGate } from "@/components/dashboard/PlanGate";

export default function GoalsPage() {
  return <PlanGate feature="weeklyFocus"><GoalsPageInner /></PlanGate>;
}

function GoalsPageInner() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [industry, setIndustry] = useState("saas");
  const [draft, setDraft] = useState(BLANK);
  const [adding, setAdding] = useState(false);
  const [focus, setFocus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setGoals(load()); }, []);
  const save = (next: Goal[]) => { setGoals(next); persist(next); };

  const addGoal = () => {
    if (!draft.title.trim()) { setError("Укажите название цели"); return; }
    const start = Number(draft.start) || 0;
    const g: Goal = {
      id: `${Date.now()}`,
      title: draft.title.trim(),
      metric: draft.metric.trim(),
      start,
      current: Number(draft.current) || start,
      target: Number(draft.target) || 0,
      deadline: draft.deadline.trim(),
      checks: [{ value: Number(draft.current) || start, ts: Date.now() }],
    };
    save([g, ...goals]);
    setDraft(BLANK); setAdding(false); setError("");
    track(EVENTS.PROJECT_CREATED, { kind: "goal" });
  };

  const updateProgress = (id: string, value: number) => {
    save(goals.map(g => g.id === id
      ? { ...g, current: value, checks: [...g.checks.slice(-19), { value, ts: Date.now() }] }
      : g));
  };
  const remove = (id: string) => save(goals.filter(g => g.id !== id));

  const getFocus = async () => {
    if (goals.length === 0) { setError("Сначала добавьте цели"); return; }
    setBusy(true); setError(""); setFocus("");
    try {
      const res = await fetch("/api/artifacts/weekly-focus", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry, goals: goals.map(g => ({ title: g.title, metric: g.metric, current: g.current, target: g.target, deadline: g.deadline })) }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.error || "Не удалось получить фокус"); return; }
      setFocus(data.focus);
      track(EVENTS.AI_ANALYSIS_COMPLETED, { kind: "weekly_focus" });
    } catch { setError("Ошибка сети"); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg,${ACCENT},#4f46e5)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 16px rgba(${RGB},0.35)` }}>
          <Flag size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>Цели и фокус недели</h1>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)" }}>Отслеживай прогресс и получай от AI фокус на неделю</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr)", gap: 20, marginTop: 22, alignItems: "start" }}>
        {/* Левая колонка — цели */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Мои цели ({goals.length})</div>
            <button onClick={() => { setAdding(a => !a); setError(""); }}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 650, padding: "7px 12px", borderRadius: 9, cursor: "pointer", color: adding ? "rgba(255,255,255,0.6)" : "#fff", background: adding ? "rgba(255,255,255,0.05)" : `rgba(${RGB},0.16)`, border: adding ? "1px solid rgba(255,255,255,0.1)" : `1px solid rgba(${RGB},0.4)` }}>
              {adding ? <X size={13} /> : <Plus size={13} />} {adding ? "Отмена" : "Цель"}
            </button>
          </div>

          {adding && (
            <div style={{ borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: 14, marginBottom: 14, display: "flex", flexDirection: "column", gap: 9 }}>
              <input autoFocus placeholder="Название цели (напр. Выручка в месяц)" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} style={inp} />
              <div style={{ display: "flex", gap: 8 }}>
                <input placeholder="Сейчас" value={draft.current} onChange={e => setDraft({ ...draft, current: e.target.value })} inputMode="numeric" style={inp} />
                <input placeholder="Цель" value={draft.target} onChange={e => setDraft({ ...draft, target: e.target.value })} inputMode="numeric" style={inp} />
                <input placeholder="Ед. (₽, шт, %)" value={draft.metric} onChange={e => setDraft({ ...draft, metric: e.target.value })} style={inp} />
              </div>
              <input placeholder="Дедлайн (напр. 31.12.2026)" value={draft.deadline} onChange={e => setDraft({ ...draft, deadline: e.target.value })} style={inp} />
              <button onClick={addGoal} style={{ padding: "9px 14px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${ACCENT},#4f46e5)`, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Добавить цель</button>
            </div>
          )}

          {goals.length === 0 && !adding && (
            <div style={{ borderRadius: 14, border: "1px dashed rgba(255,255,255,0.12)", padding: "28px 16px", textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
              Пока нет целей. Добавь первую — и AI будет держать тебя в фокусе каждую неделю.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {goals.map(g => {
              const p = progress(g);
              return (
                <div key={g.id} style={{ borderRadius: 14, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", padding: 15 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{g.title}</div>
                    <button onClick={() => remove(g.id)} title="Удалить" style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", flexShrink: 0 }}><Trash2 size={14} /></button>
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 3, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <span><b style={{ color: "#fff" }}>{g.current}</b> / {g.target} {g.metric}</span>
                    {g.deadline && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><CalendarClock size={11} /> {g.deadline}</span>}
                  </div>
                  <div style={{ marginTop: 10, height: 7, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ width: `${p}%`, height: "100%", borderRadius: 4, background: p >= 100 ? "#10b981" : `linear-gradient(90deg,${ACCENT},#4f46e5)`, transition: "width .6s cubic-bezier(0.22,1,0.36,1)" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", flexShrink: 0 }}>Обновить:</span>
                    <input type="number" defaultValue={g.current} key={g.current}
                      onKeyDown={e => { if (e.key === "Enter") updateProgress(g.id, Number((e.target as HTMLInputElement).value)); }}
                      onBlur={e => { const v = Number(e.target.value); if (v !== g.current) updateProgress(g.id, v); }}
                      style={{ width: 90, ...inp, padding: "6px 9px", fontSize: 12.5 }} />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{p}% · {g.checks.length} чек-инов</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Правая колонка — фокус недели */}
        <div style={{ position: "sticky", top: 16 }}>
          <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Ниша</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              {INDUSTRIES.map(ind => {
                const sel = industry === ind.id;
                return (
                  <button key={ind.id} onClick={() => setIndustry(ind.id)} title={ind.revenueModel}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 9px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", color: sel ? "#fff" : "rgba(255,255,255,0.5)", background: sel ? `rgba(${RGB},0.16)` : "rgba(255,255,255,0.03)", border: sel ? `1px solid rgba(${RGB},0.4)` : "1px solid rgba(255,255,255,0.08)" }}>
                    <span>{ind.emoji}</span><span>{ind.label.split(" / ")[0]}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={getFocus} disabled={busy}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "11px 18px", borderRadius: 12, border: "none", fontSize: 14, fontWeight: 700, color: "#fff", cursor: busy ? "default" : "pointer", background: `linear-gradient(135deg,${ACCENT},#4f46e5)`, boxShadow: `0 6px 22px rgba(${RGB},0.32)`, opacity: busy ? 0.7 : 1 }}>
              {busy ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={15} />}
              {busy ? "Думаю…" : "Фокус на неделю"}
            </button>
            {error && <div style={{ marginTop: 10, fontSize: 12.5, color: "#fca5a5" }}>{error}</div>}
            {focus && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <FocusView text={focus} />
              </div>
            )}
            {!focus && !busy && (
              <div style={{ marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.5, display: "flex", gap: 7 }}>
                <TrendingUp size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                Заходи раз в неделю, обновляй прогресс и получай новый фокус — так цели двигаются, а не забываются.
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const inp: React.CSSProperties = {
  flex: 1, minWidth: 0, height: 38, borderRadius: 9, padding: "0 11px", fontSize: 13,
  background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff", outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};
