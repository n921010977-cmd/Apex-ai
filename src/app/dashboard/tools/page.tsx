"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import {
  Target, Copy, Check, RotateCcw, Square, Sparkles, CornerDownLeft,
  Download, BookOpen, History, ListTree, SendHorizonal, FilePlus2,
} from "lucide-react";
import { track, EVENTS } from "@/lib/analytics/events";
import { INDUSTRIES, industryPromptBlock } from "@/lib/industries";

// ─── ЦЕЛИ И ПЛАН КОМПАНИИ — AI-студия планирования ─────────────────────────────
// Один сфокусированный инструмент вместо витрины из пяти. Слева — структурный
// бриф (описание + горизонт + фокус), справа — документ плана: стриминговый
// markdown, навигация по секциям, уточнение плана в диалоге (history уходит в
// /api/chat/direct), экспорт (.md / буфер / Блокнот) и локальная история запусков.

const ACCENT = "#6366f1";
const RGB = "99,102,241";

const HORIZONS = [
  { id: "6", label: "6 месяцев" },
  { id: "12", label: "12 месяцев" },
  { id: "24", label: "24 месяца" },
];
const FOCUSES = [
  { id: "growth", label: "Рост", hint: "выручка и клиенты" },
  { id: "profit", label: "Прибыльность", hint: "юнит-экономика" },
  { id: "invest", label: "Инвестиции", hint: "готовность к раунду" },
];
const EXAMPLES = [
  "SaaS для автоматизации найма",
  "Кофейня у метро",
  "Онлайн-школа английского",
  "Маркетплейс хендмейда",
];

function buildPersona(horizonId: string, focusId: string, industryId: string): string {
  const horizon = HORIZONS.find(h => h.id === horizonId)?.label ?? "12 месяцев";
  const focusText =
    focusId === "profit" ? "прибыльность и здоровая юнит-экономика"
    : focusId === "invest" ? "подготовка к привлечению инвестиций"
    : "рост выручки и клиентской базы";
  return (
    `Ты — опытный CEO-стратег. Составь план развития бизнеса. Горизонт планирования: ${horizon}. ` +
    `Приоритет основателя: ${focusText}. Структура ответа строго в markdown:\n` +
    `## Главная цель — одно измеримое предложение на весь горизонт.\n` +
    `## Ключевые цели — 4–5 SMART-целей списком, каждая с метрикой.\n` +
    `## План 30/60/90 — подзаголовки ### Дни 1–30, ### Дни 31–60, ### Дни 61–90, в каждом 3–5 конкретных шагов.\n` +
    `## Метрики недели — 4–6 метрик, которые отслеживать еженедельно.\n` +
    `## Риски — 3 главных риска и способ снять каждый.\n` +
    `Пиши кратко и конкретно, без воды. Только на русском.` +
    // отраслевая экспертиза по выбранной нише — метрики и бенчмарки именно её
    industryPromptBlock(industryId)
  );
}

// ─── Лёгкий markdown → JSX (без зависимостей, безопасен для стрима) ──────────────
function renderInline(text: string, keyBase: string) {
  const nodes: React.ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*|`(.+?)`)/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2] !== undefined) nodes.push(<strong key={`${keyBase}-b${i}`} style={{ color: "#fff", fontWeight: 700 }}>{m[2]}</strong>);
    else if (m[3] !== undefined) nodes.push(<code key={`${keyBase}-c${i}`} style={{ background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: 5, fontSize: "0.92em", fontFamily: "var(--font-geist-mono), monospace" }}>{m[3]}</code>);
    last = m.index + m[0].length; i++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

type Section = { title: string; anchor: string };

function parseSections(text: string): Section[] {
  const out: Section[] = [];
  text.split("\n").forEach((l, i) => {
    const m = l.match(/^##\s+(.+)$/);
    if (m) out.push({ title: m[1].replace(/\*\*/g, ""), anchor: `plan-sec-${out.length}` });
  });
  return out;
}

function Markdown({ text }: { text: string }) {
  const blocks = useMemo(() => {
    const lines = text.split("\n");
    const out: React.ReactNode[] = [];
    let list: { ordered: boolean; items: string[] } | null = null;
    let h2Count = 0;
    const flush = () => {
      if (!list) return;
      const L = list;
      out.push(
        L.ordered
          ? <ol key={`ol${out.length}`} style={{ margin: "4px 0 12px", paddingLeft: 22, display: "flex", flexDirection: "column", gap: 5 }}>{L.items.map((it, i) => <li key={i} style={{ lineHeight: 1.65 }}>{renderInline(it, `ol${out.length}-${i}`)}</li>)}</ol>
          : <ul key={`ul${out.length}`} style={{ margin: "4px 0 12px", paddingLeft: 4, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>{L.items.map((it, i) => <li key={i} style={{ lineHeight: 1.65, display: "flex", gap: 9 }}><span style={{ color: ACCENT, flexShrink: 0, marginTop: 1 }}>▸</span><span>{renderInline(it, `ul${out.length}-${i}`)}</span></li>)}</ul>
      );
      list = null;
    };
    for (const raw of lines) {
      const line = raw.trimEnd();
      if (/^#{1,3}\s+/.test(line)) {
        flush();
        const level = (line.match(/^#+/)?.[0].length) ?? 1;
        const content = line.replace(/^#+\s+/, "");
        const id = level === 2 ? `plan-sec-${h2Count++}` : undefined;
        const size = level === 1 ? 19 : level === 2 ? 16.5 : 14.5;
        out.push(
          <div key={`h${out.length}`} id={id} style={{ fontSize: size, fontWeight: 750, color: "#fff", margin: out.length ? "18px 0 6px" : "0 0 6px", letterSpacing: "-0.015em", scrollMarginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
            {level === 2 && <span style={{ width: 3, height: 15, borderRadius: 2, background: ACCENT, flexShrink: 0 }} />}
            <span>{renderInline(content, `h${out.length}`)}</span>
          </div>
        );
      } else if (/^[-*•]\s+/.test(line)) {
        if (!list || list.ordered) { flush(); list = { ordered: false, items: [] }; }
        list.items.push(line.replace(/^[-*•]\s+/, ""));
      } else if (/^\d+[.)]\s+/.test(line)) {
        if (!list || !list.ordered) { flush(); list = { ordered: true, items: [] }; }
        list.items.push(line.replace(/^\d+[.)]\s+/, ""));
      } else if (/^(-{3,}|_{3,})$/.test(line)) {
        flush();
        out.push(<div key={`hr${out.length}`} style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "14px 0" }} />);
      } else if (line.trim() === "") {
        flush();
      } else {
        flush();
        out.push(<p key={`p${out.length}`} style={{ margin: "0 0 8px", lineHeight: 1.72 }}>{renderInline(line, `p${out.length}`)}</p>);
      }
    }
    flush();
    return out;
  }, [text]);
  return <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.82)" }}>{blocks}</div>;
}

// ─── Локальная история запусков ──────────────────────────────────────────────────
type HistoryItem = { brief: string; horizon: string; focus: string; industry?: string; answer: string; ts: number };
const HISTORY_KEY = "vertlix_plan_history";

function loadHistory(): HistoryItem[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}
function saveHistory(items: HistoryItem[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 10))); } catch { /* noop */ }
}

// ─── Интерактивный чек-лист выполнения ───────────────────────────────────────────
// Превращаем шаги плана (раздел «План 30/60/90») в отмечаемые задачи с прогрессом.
// План перестаёт быть просто текстом — по нему можно работать и видеть движение.
const CHECKS_KEY = "vertlix_plan_checks";

type Task = { id: string; text: string; phase: string };

function hashStr(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return Math.abs(h).toString(36);
}

function extractTasks(md: string): Task[] {
  const lines = md.split("\n");
  let h2 = "", h3 = "";
  const inPlan: Task[] = [];
  const all: Task[] = [];
  for (const raw of lines) {
    const l = raw.trim();
    const m2 = l.match(/^##\s+(.+)/); if (m2) { h2 = m2[1].replace(/\*\*/g, ""); h3 = ""; continue; }
    const m3 = l.match(/^###\s+(.+)/); if (m3) { h3 = m3[1].replace(/\*\*/g, ""); continue; }
    const mi = l.match(/^(?:[-*•]|\d+[.)])\s+(.+)/);
    if (!mi) continue;
    const text = mi[1].replace(/\*\*/g, "").trim();
    if (!text) continue;
    const phase = h3 || h2 || "Шаги";
    const task = { id: hashStr(phase + "|" + text), text, phase };
    all.push(task);
    if (/план|30\/60\/90|дн[ия]/i.test(h2 + " " + h3)) inPlan.push(task);
  }
  return inPlan.length ? inPlan : all;
}

function loadChecks(briefKey: string): Set<string> {
  try { const all = JSON.parse(localStorage.getItem(CHECKS_KEY) || "{}"); return new Set(all[briefKey] || []); }
  catch { return new Set(); }
}
function saveChecks(briefKey: string, ids: Set<string>) {
  try {
    const all = JSON.parse(localStorage.getItem(CHECKS_KEY) || "{}");
    all[briefKey] = [...ids];
    localStorage.setItem(CHECKS_KEY, JSON.stringify(all));
  } catch { /* noop */ }
}

function Checklist({ md, briefKey }: { md: string; briefKey: string }) {
  const tasks = useMemo(() => extractTasks(md), [md]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  useEffect(() => { setChecked(loadChecks(briefKey)); }, [briefKey, md]);
  if (!tasks.length) return null;

  const toggle = (id: string) => setChecked(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id);
    saveChecks(briefKey, n);
    return n;
  });

  const doneCount = tasks.filter(t => checked.has(t.id)).length;
  const pct = Math.round((doneCount / tasks.length) * 100);
  const phases: string[] = [];
  for (const t of tasks) if (!phases.includes(t.phase)) phases.push(t.phase);

  return (
    <div style={{ marginTop: 16, borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Check size={15} style={{ color: ACCENT }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Чек-лист выполнения</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: pct === 100 ? "#34d399" : "rgba(255,255,255,0.6)", fontVariantNumeric: "tabular-nums" }}>
          {doneCount} / {tasks.length} · {pct}%
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: 14 }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: pct === 100 ? "linear-gradient(90deg,#34d399,#10b981)" : `linear-gradient(90deg,${ACCENT},#818cf8)`, transition: "width .4s cubic-bezier(0.22,1,0.36,1)" }} />
      </div>
      {phases.map(phase => (
        <div key={phase} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", margin: "6px 0 6px" }}>{phase}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {tasks.filter(t => t.phase === phase).map(t => {
              const on = checked.has(t.id);
              return (
                <button key={t.id} onClick={() => toggle(t.id)}
                  style={{ display: "flex", alignItems: "flex-start", gap: 10, textAlign: "left", padding: "7px 8px", borderRadius: 9, cursor: "pointer", background: "transparent", border: "none", width: "100%" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <span style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center",
                    background: on ? `linear-gradient(135deg,${ACCENT},#4f46e5)` : "rgba(255,255,255,0.04)",
                    border: on ? "none" : "1px solid rgba(255,255,255,0.18)" }}>
                    {on && <Check size={12} color="#fff" />}
                  </span>
                  <span style={{ fontSize: 13, lineHeight: 1.5, color: on ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.82)", textDecoration: on ? "line-through" : "none" }}>{t.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Страница ───────────────────────────────────────────────────────────────────
import { PlanGate } from "@/components/dashboard/PlanGate";

export default function GoalsPlanStudio() {
  return <PlanGate feature="goalsPlan"><GoalsPlanStudioInner /></PlanGate>;
}

function GoalsPlanStudioInner() {
  const [brief, setBrief] = useState("");
  const [horizon, setHorizon] = useState("12");
  const [focus, setFocus] = useState("growth");
  const [industry, setIndustry] = useState("saas");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState<"idle" | "saving" | "ok" | "fail">("idle");
  const [refine, setRefine] = useState("");
  const [refineCount, setRefineCount] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  // диалоговая цепочка для уточнений: [бриф → план → уточнение → план …]
  const turnsRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);

  useEffect(() => { setHistory(loadHistory()); }, []);

  const sections = useMemo(() => (done || out ? parseSections(out) : []), [out, done]);
  const words = useMemo(() => out.trim().split(/\s+/).filter(Boolean).length, [out]);

  const stream = async (message: string, hist: { role: "user" | "assistant"; content: string }[]) => {
    setOut(""); setDone(false); setError(""); setBusy(true); setSaved("idle");
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let full = "";
    try {
      const res = await fetch("/api/chat/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, persona: buildPersona(horizon, focus, industry), history: hist }),
        signal: ctrl.signal,
      });
      if (res.status === 401) { setError("Войдите в аккаунт, чтобы построить план."); return null; }
      if (res.status === 503) { setError("AI временно недоступен (не настроен ключ)."); return null; }
      if (res.status === 429) { setError("Слишком много запросов — попробуйте через минуту."); return null; }
      if (!res.ok || !res.body) { setError("Не удалось получить ответ. Попробуйте ещё раз."); return null; }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n"); buf = parts.pop() ?? "";
        for (const p of parts) {
          const m = p.match(/^data: (.*)$/m);
          if (!m) continue;
          try {
            const ev = JSON.parse(m[1]);
            if (ev.type === "token") { full += ev.token; setOut(o => o + ev.token); }
            if (ev.type === "error") setError(ev.message || "Ошибка AI");
          } catch { /* noop */ }
        }
      }
      if (!full) { setError("Пустой ответ. Попробуйте переформулировать."); return null; }
      setDone(true);
      return full;
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") setError("Сбой соединения. Попробуйте ещё раз.");
      return null;
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  const run = async (overrideBrief?: string) => {
    const text = (overrideBrief ?? brief).trim();
    if (!text || busy) return;
    if (overrideBrief) setBrief(overrideBrief);
    track(EVENTS.CHAT_MESSAGE_SENT, { source: "goals_plan", horizon, focus });
    setRefineCount(0);
    const userMsg = `Бизнес: ${text}`;
    const answer = await stream(userMsg, []);
    if (answer) {
      turnsRef.current = [{ role: "user", content: userMsg }, { role: "assistant", content: answer }];
      const item: HistoryItem = { brief: text, horizon, focus, industry, answer, ts: Date.now() };
      const next = [item, ...loadHistory().filter(h => h.brief !== text)].slice(0, 10);
      saveHistory(next); setHistory(next);
    }
  };

  const runRefine = async () => {
    const q = refine.trim();
    if (!q || busy || turnsRef.current.length === 0) return;
    setRefine("");
    track(EVENTS.CHAT_MESSAGE_SENT, { source: "goals_plan_refine" });
    const answer = await stream(
      `Уточнение к плану: ${q}. Обнови план целиком с учётом уточнения, сохрани ту же структуру разделов.`,
      turnsRef.current.slice(-6),
    );
    if (answer) {
      turnsRef.current = [...turnsRef.current, { role: "user", content: q }, { role: "assistant", content: answer }];
      setRefineCount(c => c + 1);
      const next = loadHistory().map(h => (h.brief === brief.trim() ? { ...h, answer, ts: Date.now() } : h));
      saveHistory(next); setHistory(next);
    }
  };

  const stop = () => { abortRef.current?.abort(); setBusy(false); setDone(true); };
  const copy = async () => { try { await navigator.clipboard.writeText(out); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* noop */ } };

  const downloadMd = () => {
    const blob = new Blob([`# План: ${brief.trim()}\n\n${out}`], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `план-${brief.trim().slice(0, 30).replace(/\s+/g, "-") || "компании"}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const saveToNotepad = async () => {
    if (saved === "saving") return;
    setSaved("saving");
    try {
      const res = await fetch("/api/notepad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `План: ${brief.trim().slice(0, 60)}`, content: out, emoji: "🎯", tags: ["план", "цели"], folder: "general" }),
      });
      setSaved(res.ok ? "ok" : "fail");
    } catch { setSaved("fail"); }
    setTimeout(() => setSaved("idle"), 2400);
  };

  const restore = (h: HistoryItem) => {
    setBrief(h.brief); setHorizon(h.horizon); setFocus(h.focus); setIndustry(h.industry ?? "saas");
    setOut(h.answer); setDone(true); setError(""); setRefineCount(0);
    turnsRef.current = [{ role: "user", content: `Бизнес: ${h.brief}` }, { role: "assistant", content: h.answer }];
    setShowHistory(false);
  };

  const newPlan = () => {
    setBrief(""); setOut(""); setDone(false); setError(""); setRefineCount(0);
    turnsRef.current = [];
  };

  const canRun = !!brief.trim() && !busy;

  return (
    <div style={{ padding: "26px 26px 60px", maxWidth: 1280, margin: "0 auto" }}>
      <style>{`
        @keyframes gpspin { to { transform: rotate(360deg); } }
        @keyframes gpblink { 50% { opacity: 0; } }
        .gp-grid { display: grid; grid-template-columns: minmax(340px, 400px) 1fr; gap: 20px; align-items: start; }
        @media (max-width: 980px) { .gp-grid { grid-template-columns: 1fr; } }
        .gp-chip:hover { border-color: rgba(${RGB},0.45) !important; color: #fff !important; }
        .gp-act:hover { background: rgba(255,255,255,0.08) !important; color: #fff !important; }
      `}</style>

      {/* ── Шапка инструмента ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(145deg, rgba(${RGB},0.24), rgba(${RGB},0.08))`, border: `1px solid rgba(${RGB},0.35)`, boxShadow: `0 0 28px rgba(${RGB},0.16)` }}>
            <Target size={22} style={{ color: ACCENT }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontSize: "clamp(21px,2.6vw,27px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#fff", margin: 0 }}>Цели и план компании</h1>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#a5b4fc", padding: "3px 8px", borderRadius: 6, background: `rgba(${RGB},0.12)`, border: `1px solid rgba(${RGB},0.3)` }}>AI-студия</span>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.48)", margin: "3px 0 0" }}>Измеримая цель, SMART-задачи и план 30/60/90 — под ваш горизонт и приоритет.</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="gp-act" onClick={() => setShowHistory(s => !s)}
            style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, padding: "9px 14px", borderRadius: 10, cursor: "pointer", color: showHistory ? "#fff" : "rgba(255,255,255,0.6)", background: showHistory ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", transition: "all .15s" }}>
            <History size={14} /> История{history.length ? ` · ${history.length}` : ""}
          </button>
          {(out || brief) && (
            <button className="gp-act" onClick={newPlan}
              style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, padding: "9px 14px", borderRadius: 10, cursor: "pointer", color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", transition: "all .15s" }}>
              <FilePlus2 size={14} /> Новый план
            </button>
          )}
        </div>
      </div>

      {/* ── История запусков ── */}
      {showHistory && (
        <div style={{ marginBottom: 18, padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {history.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)" }}>Пока пусто — постройте первый план, и он появится здесь.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {history.map(h => (
                <button key={h.ts} onClick={() => restore(h)}
                  style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", padding: "9px 12px", borderRadius: 10, cursor: "pointer", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.75)", transition: "all .15s" }}
                  className="gp-act">
                  <span style={{ fontSize: 13, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.brief}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", flexShrink: 0 }}>{HORIZONS.find(x => x.id === h.horizon)?.label} · {FOCUSES.find(x => x.id === h.focus)?.label}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{new Date(h.ts).toLocaleDateString("ru-RU")}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="gp-grid">
        {/* ── Левая колонка: бриф ── */}
        <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", overflow: "hidden", position: "sticky", top: 16 }}>
          <div style={{ height: 3, background: `linear-gradient(90deg, ${ACCENT}, transparent 85%)` }} />
          <div style={{ padding: "18px 18px 20px", display: "flex", flexDirection: "column", gap: 15 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Опишите бизнес</label>
              <div style={{ position: "relative" }}>
                <textarea
                  value={brief}
                  onChange={e => setBrief(e.target.value)}
                  onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); run(); } }}
                  placeholder="Чем занимаетесь, для кого, на какой стадии…"
                  rows={4}
                  maxLength={4000}
                  disabled={busy}
                  style={{ width: "100%", resize: "vertical", minHeight: 96, background: "rgba(0,0,0,0.24)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, color: "#fff", fontSize: 13.5, padding: "11px 12px 24px", outline: "none", fontFamily: "inherit", lineHeight: 1.55 }}
                  onFocus={e => { e.currentTarget.style.borderColor = `rgba(${RGB},0.5)`; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(${RGB},0.08)`; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <span style={{ position: "absolute", right: 11, bottom: 8, fontSize: 10.5, color: "rgba(255,255,255,0.28)", fontVariantNumeric: "tabular-nums", pointerEvents: "none" }}>{brief.length}/4000</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
                {EXAMPLES.map(ex => (
                  <button key={ex} className="gp-chip" onClick={() => setBrief(ex)}
                    style={{ fontSize: 11, fontWeight: 500, padding: "4px 9px", borderRadius: 7, cursor: "pointer", color: "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.08)", transition: "all .15s" }}>
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Горизонт</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
                {HORIZONS.map(h => {
                  const sel = horizon === h.id;
                  return (
                    <button key={h.id} onClick={() => setHorizon(h.id)} disabled={busy}
                      style={{ padding: "9px 4px", borderRadius: 10, fontSize: 12.5, fontWeight: 650, cursor: "pointer", transition: "all .15s", color: sel ? "#fff" : "rgba(255,255,255,0.5)", background: sel ? `rgba(${RGB},0.16)` : "rgba(255,255,255,0.03)", border: sel ? `1px solid rgba(${RGB},0.45)` : "1px solid rgba(255,255,255,0.08)" }}>
                      {h.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Ниша</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {INDUSTRIES.map(ind => {
                  const sel = industry === ind.id;
                  return (
                    <button key={ind.id} onClick={() => setIndustry(ind.id)} disabled={busy} title={ind.revenueModel}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 11px", borderRadius: 9, fontSize: 12.5, fontWeight: 650, cursor: "pointer", transition: "all .15s", color: sel ? "#fff" : "rgba(255,255,255,0.55)", background: sel ? `rgba(${RGB},0.16)` : "rgba(255,255,255,0.03)", border: sel ? `1px solid rgba(${RGB},0.45)` : "1px solid rgba(255,255,255,0.08)" }}>
                      <span>{ind.emoji}</span>
                      <span>{ind.label.split(" / ")[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Приоритет</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {FOCUSES.map(f => {
                  const sel = focus === f.id;
                  return (
                    <button key={f.id} onClick={() => setFocus(f.id)} disabled={busy}
                      style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, padding: "9px 12px", borderRadius: 10, fontSize: 13, fontWeight: 650, cursor: "pointer", textAlign: "left", transition: "all .15s", color: sel ? "#fff" : "rgba(255,255,255,0.55)", background: sel ? `rgba(${RGB},0.16)` : "rgba(255,255,255,0.03)", border: sel ? `1px solid rgba(${RGB},0.45)` : "1px solid rgba(255,255,255,0.08)" }}>
                      <span>{f.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 400, color: sel ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.3)" }}>{f.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {!busy ? (
              <button onClick={() => run()} disabled={!canRun}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "12px 18px", borderRadius: 12, border: "1px solid transparent", fontSize: 14, fontWeight: 700, color: "#fff", cursor: canRun ? "pointer" : "not-allowed", opacity: canRun ? 1 : 0.5, background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`, boxShadow: `0 6px 22px rgba(${RGB},0.32), inset 0 1px 0 rgba(255,255,255,0.16)`, transition: "opacity .15s" }}>
                <Sparkles size={15} /> Построить план
                <kbd style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: "2px 6px", borderRadius: 5, background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.18)", fontSize: 10, fontWeight: 600 }}>⌘<CornerDownLeft size={9} /></kbd>
              </button>
            ) : (
              <button onClick={stop}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "12px 18px", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)" }}>
                <Square size={12} fill="currentColor" /> Остановить генерацию
              </button>
            )}

            {error && (
              <div style={{ fontSize: 12.5, color: "#f87171", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", borderRadius: 10, padding: "9px 12px" }}>{error}</div>
            )}
          </div>
        </div>

        {/* ── Правая колонка: документ плана ── */}
        <div style={{ borderRadius: 18, border: `1px solid rgba(${RGB},0.14)`, background: "rgba(0,0,0,0.24)", overflow: "hidden", minHeight: 420, display: "flex", flexDirection: "column" }}>
          {/* Тулбар документа */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Документ плана</span>
            {done && out && (
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", fontVariantNumeric: "tabular-nums" }}>· {words} слов{refineCount > 0 ? ` · ${refineCount} уточн.` : ""}</span>
            )}
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              {out && !busy && (
                <>
                  <button className="gp-act" onClick={() => run()} title="Пересоздать" style={tbBtn}><RotateCcw size={14} /></button>
                  <button className="gp-act" onClick={copy} title="Копировать" style={tbBtn}>{copied ? <Check size={14} style={{ color: "#10b981" }} /> : <Copy size={14} />}</button>
                  <button className="gp-act" onClick={downloadMd} title="Скачать .md" style={tbBtn}><Download size={14} /></button>
                  <button className="gp-act" onClick={saveToNotepad} title="Сохранить в Блокнот" style={{ ...tbBtn, width: "auto", padding: "0 11px", gap: 6, fontSize: 12 }}>
                    <BookOpen size={14} />
                    {saved === "saving" ? "Сохраняю…" : saved === "ok" ? "Сохранено ✓" : saved === "fail" ? "Не удалось" : "В Блокнот"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Навигация по секциям */}
          {sections.length > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", overflowX: "auto" }}>
              <ListTree size={13} style={{ color: "rgba(255,255,255,0.35)", flexShrink: 0 }} />
              {sections.map(s => (
                <button key={s.anchor} className="gp-chip"
                  onClick={() => document.getElementById(s.anchor)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  style={{ fontSize: 11.5, fontWeight: 600, padding: "4px 10px", borderRadius: 999, cursor: "pointer", whiteSpace: "nowrap", color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", transition: "all .15s" }}>
                  {s.title}
                </button>
              ))}
            </div>
          )}

          {/* Тело документа */}
          <div ref={resultRef} style={{ padding: "18px 20px", overflowY: "auto", flex: 1, maxHeight: 640 }}>
            {!out && !busy && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 320, gap: 12, color: "rgba(255,255,255,0.35)" }}>
                <div style={{ width: 52, height: 52, borderRadius: 15, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.14)" }}>
                  <Target size={22} style={{ opacity: 0.55 }} />
                </div>
                <div style={{ fontSize: 13.5, textAlign: "center", maxWidth: 300, lineHeight: 1.6 }}>
                  Опишите бизнес слева, выберите горизонт и приоритет — план появится здесь.
                </div>
              </div>
            )}
            {busy && !out && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.5)", fontSize: 13.5, paddingTop: 8 }}>
                <span style={{ width: 15, height: 15, borderRadius: "50%", border: `2px solid rgba(255,255,255,0.25)`, borderTopColor: ACCENT, display: "inline-block", animation: "gpspin 0.7s linear infinite" }} />
                AI-стратег составляет план…
              </div>
            )}
            {out && <Markdown text={out} />}
            {busy && out && <span style={{ display: "inline-block", width: 7, height: 15, background: ACCENT, marginLeft: 1, verticalAlign: "text-bottom", animation: "gpblink 0.9s step-start infinite" }} />}
            {done && out && !busy && <Checklist md={out} briefKey={brief.trim()} />}
          </div>

          {/* Уточнение плана */}
          {done && out && !busy && (
            <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)" }}>
              <input
                value={refine}
                onChange={e => setRefine(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); runRefine(); } }}
                placeholder="Уточнить план: «бюджет $10k», «без найма», «фокус на B2B»…"
                maxLength={500}
                style={{ flex: 1, height: 40, background: "rgba(0,0,0,0.24)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 11, color: "#fff", fontSize: 13, padding: "0 13px", outline: "none" }}
                onFocus={e => { e.currentTarget.style.borderColor = `rgba(${RGB},0.5)`; }}
                onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
              />
              <button onClick={runRefine} disabled={!refine.trim()}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 16px", borderRadius: 11, border: "1px solid transparent", fontSize: 13, fontWeight: 700, color: "#fff", cursor: refine.trim() ? "pointer" : "not-allowed", opacity: refine.trim() ? 1 : 0.5, background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)` }}>
                <SendHorizonal size={14} /> Уточнить
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const tbBtn: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", color: "rgba(255,255,255,0.65)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", transition: "all .15s",
};
