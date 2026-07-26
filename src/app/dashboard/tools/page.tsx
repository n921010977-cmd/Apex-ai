"use client";

import { useState, useRef, useMemo } from "react";
import { Target, Lightbulb, Users, TrendingUp, Rocket, Copy, Check, RotateCcw, Square, Sparkles, CornerDownLeft } from "lucide-react";
import { track, EVENTS } from "@/lib/analytics/events";

// ─── AI-ИНСТРУМЕНТЫ ─────────────────────────────────────────────────────────────
// Пять сфокусированных AI-функций. Каждая — своя persona (system-prompt), который
// переопределяет промпт в /api/chat/direct (SSE-стрим). Вывод модели — markdown,
// рендерится лёгким инлайн-парсером ниже (заголовки, списки, жирный, разделители).

type Tool = {
  id: string;
  title: string;
  desc: string;
  icon: typeof Target;
  color: string;
  rgb: string;
  placeholder: string;
  cta: string;
  examples: string[];
  persona: string;
};

const TOOLS: Tool[] = [
  {
    id: "goals",
    title: "Цели и план компании",
    desc: "Чёткие цели и пошаговый план на 90 дней под вашу идею.",
    icon: Target, color: "#6366f1", rgb: "99,102,241",
    placeholder: "Опишите ваш бизнес или идею…",
    cta: "Построить план",
    examples: ["SaaS для автоматизации найма", "Кофейня у метро", "Онлайн-школа английского"],
    persona:
      "Ты — опытный CEO-стратег. По описанию бизнеса сформулируй: 1) главную цель на 12 месяцев (одним предложением, измеримо); 2) 3–5 ключевых целей (SMART); 3) пошаговый план на первые 90 дней с разбивкой по 30/60/90 дней; 4) 3 главных риска и как их снять. Используй markdown: заголовки ## и списки. Кратко, по делу. Только на русском.",
  },
  {
    id: "ideas",
    title: "Новые идеи и инновации",
    desc: "Свежие идеи, фичи и способы отстроиться от конкурентов.",
    icon: Lightbulb, color: "#f59e0b", rgb: "245,158,11",
    placeholder: "Опишите ваш продукт или направление…",
    cta: "Сгенерировать идеи",
    examples: ["Приложение для фитнеса", "Маркетплейс хендмейда", "B2B-сервис аналитики"],
    persona:
      "Ты — директор по инновациям и продуктовый визионер. По описанию бизнеса предложи: 1) 5 сильных новых идей/фич с кратким обоснованием ценности; 2) 2 нестандартных (контринтуитивных) хода; 3) 1 способ отстроиться от конкурентов. Для каждой идеи — 1 строка «почему сработает». Используй markdown-списки. Только на русском.",
  },
  {
    id: "audience",
    title: "Понять свою ЦА",
    desc: "Портрет целевой аудитории, боли, сегменты и где их искать.",
    icon: Users, color: "#10b981", rgb: "16,185,129",
    placeholder: "Опишите продукт и кому он нужен…",
    cta: "Проанализировать ЦА",
    examples: ["Сервис доставки еды", "Курс по инвестициям", "CRM для салонов красоты"],
    persona:
      "Ты — исследователь рынка и специалист по customer development. По описанию продукта опиши: 1) 2–3 сегмента ЦА с портретом (кто, роль, контекст); 2) боли и желания каждого сегмента; 3) какой сегмент брать первым (ICP) и почему; 4) где искать этих людей (каналы). Используй markdown: заголовки по сегментам и списки. Только на русском.",
  },
  {
    id: "trends",
    title: "Тенденции рынка",
    desc: "Ключевые тренды, драйверы роста и окно возможностей.",
    icon: TrendingUp, color: "#06b6d4", rgb: "6,182,212",
    placeholder: "Опишите нишу или рынок…",
    cta: "Разобрать тренды",
    examples: ["Рынок EdTech в СНГ", "Электромобили", "AI-инструменты для дизайна"],
    persona:
      "Ты — аналитик рынка. По описанию ниши дай: 1) 4–6 ключевых трендов (что меняется и почему); 2) драйверы роста и барьеры; 3) оценку динамики (растёт/стагнирует, ориентировочный CAGR-диапазон как экспертная оценка — отметь это); 4) «окно возможностей» — что делать сейчас. Помечай, где это оценка, а не факт. Markdown-заголовки и списки. Только на русском.",
  },
  {
    id: "invest",
    title: "Упаковаться под инвестиции",
    desc: "Структура питча, метрики и что усилить перед раундом.",
    icon: Rocket, color: "#a855f7", rgb: "168,85,247",
    placeholder: "Опишите проект, стадию и текущие метрики…",
    cta: "Упаковать под инвестора",
    examples: ["Pre-seed SaaS, MRR $3k", "Маркетплейс, 10k юзеров", "AI-стартап без выручки"],
    persona:
      "Ты — инвестор и советник по фандрейзингу. По описанию проекта собери: 1) структуру питча (проблема, решение, рынок, бизнес-модель, трекшн, команда, ask) — по одному ёмкому пункту на блок; 2) какие метрики инвестор захочет увидеть на этой стадии; 3) 3 слабых места и как их усилить до раунда; 4) реалистичный тип раунда. Markdown-заголовки и списки. Только на русском.",
  },
];

// ─── Лёгкий markdown → JSX (без зависимостей, безопасно для стрима) ──────────────
function renderInline(text: string, keyBase: string) {
  // **bold** и `code`
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

function Markdown({ text, color }: { text: string; color: string }) {
  const blocks = useMemo(() => {
    const lines = text.split("\n");
    const out: React.ReactNode[] = [];
    let list: { ordered: boolean; items: string[] } | null = null;
    const flush = () => {
      if (!list) return;
      const L = list;
      out.push(
        L.ordered
          ? <ol key={`ol${out.length}`} style={{ margin: "4px 0 10px", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>{L.items.map((it, i) => <li key={i} style={{ lineHeight: 1.65 }}>{renderInline(it, `ol${out.length}-${i}`)}</li>)}</ol>
          : <ul key={`ul${out.length}`} style={{ margin: "4px 0 10px", paddingLeft: 4, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>{L.items.map((it, i) => <li key={i} style={{ lineHeight: 1.65, display: "flex", gap: 9 }}><span style={{ color, flexShrink: 0, marginTop: 1 }}>▸</span><span>{renderInline(it, `ul${out.length}-${i}`)}</span></li>)}</ul>
      );
      list = null;
    };
    for (const raw of lines) {
      const line = raw.trimEnd();
      if (/^#{1,3}\s+/.test(line)) {
        flush();
        const level = (line.match(/^#+/)?.[0].length) ?? 1;
        const content = line.replace(/^#+\s+/, "");
        const size = level === 1 ? 16.5 : level === 2 ? 15 : 14;
        out.push(<div key={`h${out.length}`} style={{ fontSize: size, fontWeight: 700, color: "#fff", margin: out.length ? "12px 0 4px" : "0 0 4px", letterSpacing: "-0.01em" }}>{renderInline(content, `h${out.length}`)}</div>);
      } else if (/^[-*•]\s+/.test(line)) {
        if (!list || list.ordered) { flush(); list = { ordered: false, items: [] }; }
        list.items.push(line.replace(/^[-*•]\s+/, ""));
      } else if (/^\d+[.)]\s+/.test(line)) {
        if (!list || !list.ordered) { flush(); list = { ordered: true, items: [] }; }
        list.items.push(line.replace(/^\d+[.)]\s+/, ""));
      } else if (/^(-{3,}|_{3,})$/.test(line)) {
        flush();
        out.push(<div key={`hr${out.length}`} style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "12px 0" }} />);
      } else if (line.trim() === "") {
        flush();
      } else {
        flush();
        out.push(<p key={`p${out.length}`} style={{ margin: "0 0 8px", lineHeight: 1.7 }}>{renderInline(line, `p${out.length}`)}</p>);
      }
    }
    flush();
    return out;
  }, [text, color]);
  return <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.82)" }}>{blocks}</div>;
}

function ToolCard({ tool }: { tool: Tool }) {
  const [idea, setIdea] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const Icon = tool.icon;

  const run = async (overrideIdea?: string) => {
    const text = (overrideIdea ?? idea).trim();
    if (!text || busy) return;
    if (overrideIdea) setIdea(overrideIdea);
    setOut(""); setDone(false); setError(""); setBusy(true);
    track(EVENTS.CHAT_MESSAGE_SENT, { source: "ai_tool", tool: tool.id });
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/chat/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Вводные от пользователя:\n${text}`, persona: tool.persona, history: [] }),
        signal: ctrl.signal,
      });
      if (res.status === 401) { setError("Войдите в аккаунт, чтобы использовать инструмент."); return; }
      if (res.status === 503) { setError("AI временно недоступен (не настроен ключ)."); return; }
      if (res.status === 429) { setError("Слишком много запросов — попробуйте через минуту."); return; }
      if (!res.ok || !res.body) { setError("Не удалось получить ответ. Попробуйте ещё раз."); return; }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "", got = false;
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
            if (ev.type === "token") { got = true; setOut(o => o + ev.token); }
            if (ev.type === "error") setError(ev.message || "Ошибка AI");
          } catch { /* noop */ }
        }
      }
      if (!got) setError("Пустой ответ. Попробуйте переформулировать.");
      setDone(true);
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") setError("Сбой соединения. Попробуйте ещё раз.");
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  const stop = () => { abortRef.current?.abort(); setBusy(false); setDone(true); };
  const copy = async () => { try { await navigator.clipboard.writeText(out); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* noop */ } };
  const clear = () => { setIdea(""); setOut(""); setDone(false); setError(""); };

  const canRun = !!idea.trim() && !busy;

  return (
    <div
      style={{
        borderRadius: 20, overflow: "hidden", position: "relative",
        border: "1px solid rgba(255,255,255,0.08)",
        background: `linear-gradient(180deg, rgba(${tool.rgb},0.05), rgba(255,255,255,0.015) 40%)`,
        display: "flex", flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Accent top line */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${tool.color}, transparent 85%)` }} />

      {/* Header */}
      <div style={{ padding: "18px 20px 14px", display: "flex", gap: 13, alignItems: "flex-start" }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(145deg, rgba(${tool.rgb},0.22), rgba(${tool.rgb},0.08))`, border: `1px solid rgba(${tool.rgb},0.32)`, boxShadow: `0 0 24px rgba(${tool.rgb},0.14)` }}>
          <Icon size={20} style={{ color: tool.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>{tool.title}</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "rgba(255,255,255,0.48)", marginTop: 3 }}>{tool.desc}</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 11 }}>
        {/* Example chips */}
        {!out && !busy && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {tool.examples.map(ex => (
              <button key={ex} onClick={() => setIdea(ex)}
                style={{ fontSize: 11, fontWeight: 500, padding: "5px 10px", borderRadius: 8, cursor: "pointer", color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", transition: "all .15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(${tool.rgb},0.4)`; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
              >{ex}</button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ position: "relative" }}>
          <textarea
            value={idea}
            onChange={e => setIdea(e.target.value)}
            onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); run(); } }}
            placeholder={tool.placeholder}
            rows={3}
            maxLength={4000}
            disabled={busy}
            style={{
              width: "100%", resize: "vertical", minHeight: 76,
              background: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 13, color: "#fff", fontSize: 14, padding: "12px 13px 26px", outline: "none",
              fontFamily: "inherit", lineHeight: 1.5,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = `rgba(${tool.rgb},0.5)`; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(${tool.rgb},0.08)`; }}
            onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.boxShadow = "none"; }}
          />
          <span style={{ position: "absolute", right: 12, bottom: 9, fontSize: 10.5, color: "rgba(255,255,255,0.28)", fontVariantNumeric: "tabular-nums", pointerEvents: "none" }}>{idea.length}/4000</span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!busy ? (
            <button
              onClick={() => run()}
              disabled={!canRun}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 11, border: "1px solid transparent",
                fontSize: 13.5, fontWeight: 700, color: "#fff", cursor: canRun ? "pointer" : "not-allowed", opacity: canRun ? 1 : 0.5,
                background: `linear-gradient(135deg, ${tool.color}, #4f46e5)`,
                boxShadow: `0 6px 20px rgba(${tool.rgb},0.3), inset 0 1px 0 rgba(255,255,255,0.16)`, transition: "opacity .15s",
              }}
            >
              <Sparkles size={14} /> {tool.cta}
            </button>
          ) : (
            <button onClick={stop} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 11, fontSize: 13.5, fontWeight: 700, color: "#fff", cursor: "pointer", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)" }}>
              <Square size={12} fill="currentColor" /> Остановить
            </button>
          )}
          {out && !busy && (
            <>
              <button onClick={() => run()} title="Пересоздать" style={iconBtn}><RotateCcw size={15} /></button>
              <button onClick={copy} title="Копировать" style={iconBtn}>{copied ? <Check size={15} style={{ color: "#10b981" }} /> : <Copy size={15} />}</button>
              <button onClick={clear} title="Очистить" style={{ ...iconBtn, marginLeft: "auto", fontSize: 12, width: "auto", padding: "0 12px", color: "rgba(255,255,255,0.5)" }}>Очистить</button>
            </>
          )}
          {!busy && !out && (
            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
              <kbd style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 6px", borderRadius: 5, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 10 }}>⌘<CornerDownLeft size={9} /></kbd>
            </span>
          )}
        </div>

        {error && (
          <div style={{ fontSize: 12.5, color: "#f87171", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", borderRadius: 10, padding: "9px 12px" }}>{error}</div>
        )}

        {/* Result */}
        {(out || busy) && (
          <div style={{ marginTop: 2, padding: "15px 17px", borderRadius: 14, background: "rgba(0,0,0,0.28)", border: `1px solid rgba(${tool.rgb},0.14)`, maxHeight: 460, overflowY: "auto" }}>
            {out ? <Markdown text={out} color={tool.color} /> : null}
            {busy && !out && (
              <div style={{ display: "flex", alignItems: "center", gap: 9, color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.25)", borderTopColor: tool.color, display: "inline-block", animation: "toolspin 0.7s linear infinite" }} />
                AI анализирует…
              </div>
            )}
            {busy && out && <span style={{ display: "inline-block", width: 7, height: 15, background: tool.color, marginLeft: 1, verticalAlign: "text-bottom", animation: "toolblink 0.9s step-start infinite" }} />}
          </div>
        )}
      </div>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", color: "rgba(255,255,255,0.65)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", transition: "all .15s",
};

export default function ToolsPage() {
  return (
    <div style={{ padding: "28px 28px 60px", maxWidth: 1240, margin: "0 auto" }}>
      <style>{`
        @keyframes toolspin { to { transform: rotate(360deg); } }
        @keyframes toolblink { 50% { opacity: 0; } }
      `}</style>

      {/* Hero */}
      <div style={{ position: "relative", borderRadius: 22, overflow: "hidden", padding: "30px 32px", marginBottom: 26, border: "1px solid rgba(255,255,255,0.08)", background: "linear-gradient(120deg, rgba(99,102,241,0.14), rgba(168,85,247,0.06) 55%, transparent)" }}>
        <div aria-hidden style={{ position: "absolute", top: -60, right: -30, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.22), transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 11px", borderRadius: 999, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.28)", marginBottom: 14 }}>
            <Sparkles size={12} style={{ color: "#a5b4fc" }} />
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#a5b4fc" }}>AI-инструменты</span>
          </div>
          <h1 style={{ fontSize: "clamp(26px,3.4vw,36px)", fontWeight: 800, letterSpacing: "-0.025em", color: "#fff", margin: "0 0 8px", textWrap: "balance" }}>Быстрые AI-функции</h1>
          <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "rgba(255,255,255,0.55)", margin: 0, maxWidth: 560 }}>
            Пять сфокусированных инструментов. Опишите идею или выберите пример — AI сразу выдаст структурированный результат по выбранному направлению.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 18 }}>
        {TOOLS.map(t => <ToolCard key={t.id} tool={t} />)}
      </div>
    </div>
  );
}
