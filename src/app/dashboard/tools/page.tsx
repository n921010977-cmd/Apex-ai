"use client";

import { useState } from "react";
import { Target, Lightbulb, Users, TrendingUp, Rocket } from "lucide-react";
import { track, EVENTS } from "@/lib/analytics/events";

// ─── AI-ИНСТРУМЕНТЫ ─────────────────────────────────────────────────────────────
// Пять сфокусированных AI-функций. Каждая — своя persona (system-prompt),
// который переопределяет промпт в /api/chat/direct. Пользователь вводит описание
// идеи/бизнеса, инструмент стримит структурированный результат. Паттерн чтения
// SSE-стрима повторяет src/components/landing/LiveDemo.tsx.

type Tool = {
  id: string;
  title: string;
  desc: string;
  icon: typeof Target;
  color: string;
  rgb: string;
  placeholder: string;
  cta: string;
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
    persona:
      "Ты — опытный CEO-стратег. По описанию бизнеса сформулируй: 1) главную цель на 12 месяцев (одним предложением, измеримо); 2) 3–5 ключевых целей (SMART); 3) пошаговый план на первые 90 дней с разбивкой по 30/60/90 дней; 4) 3 главных риска и как их снять. Пиши кратко, по делу, маркированными списками. Только на русском.",
  },
  {
    id: "ideas",
    title: "Новые идеи и инновации",
    desc: "Свежие идеи, фичи и способы отстроиться от конкурентов.",
    icon: Lightbulb, color: "#f59e0b", rgb: "245,158,11",
    placeholder: "Опишите ваш продукт или направление…",
    cta: "Сгенерировать идеи",
    persona:
      "Ты — директор по инновациям и продуктовый визионер. По описанию бизнеса предложи: 1) 5 сильных новых идей/фич с кратким обоснованием ценности; 2) 2 нестандартных (контринтуитивных) хода; 3) 1 способ отстроиться от конкурентов. Для каждой идеи — 1 строка «почему это сработает». Пиши конкретно, без воды. Только на русском.",
  },
  {
    id: "audience",
    title: "Понять свою ЦА",
    desc: "Портрет целевой аудитории, боли, сегменты и где их искать.",
    icon: Users, color: "#10b981", rgb: "16,185,129",
    placeholder: "Опишите продукт и кому он нужен…",
    cta: "Проанализировать ЦА",
    persona:
      "Ты — исследователь рынка и специалист по customer development. По описанию продукта опиши: 1) 2–3 сегмента ЦА с кратким портретом (кто, возраст/роль, контекст); 2) главные боли и желания каждого сегмента; 3) какой сегмент брать первым (ICP) и почему; 4) где искать этих людей (каналы). Структурируй по сегментам. Только на русском.",
  },
  {
    id: "trends",
    title: "Тенденции рынка",
    desc: "Ключевые тренды, драйверы роста и окно возможностей.",
    icon: TrendingUp, color: "#06b6d4", rgb: "6,182,212",
    placeholder: "Опишите нишу или рынок…",
    cta: "Разобрать тренды",
    persona:
      "Ты — аналитик рынка. По описанию ниши дай: 1) 4–6 ключевых трендов (что меняется и почему); 2) драйверы роста и барьеры; 3) оценку динамики рынка (растёт/стагнирует, ориентировочный CAGR-диапазон как экспертная оценка, отметь что это оценка); 4) «окно возможностей» — что делать сейчас. Помечай, где это экспертная оценка, а не факт. Только на русском.",
  },
  {
    id: "invest",
    title: "Упаковаться под инвестиции",
    desc: "Структура питча, метрики и что усилить перед раундом.",
    icon: Rocket, color: "#a855f7", rgb: "168,85,247",
    placeholder: "Опишите проект, стадию и текущие метрики…",
    cta: "Упаковать под инвестора",
    persona:
      "Ты — инвестор и советник по фандрейзингу. По описанию проекта собери: 1) структуру питча (проблема, решение, рынок, бизнес-модель, трекшн, команда, ask) — по одному ёмкому пункту на каждый блок; 2) какие метрики инвестор захочет увидеть на этой стадии; 3) 3 главных слабых места и как их усилить до раунда; 4) реалистичный тип раунда (pre-seed/seed/…). Кратко и по делу. Только на русском.",
  },
];

function ToolCard({ tool }: { tool: Tool }) {
  const [idea, setIdea] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const Icon = tool.icon;

  const run = async () => {
    const text = idea.trim();
    if (!text || busy) return;
    setOut(""); setDone(false); setError(""); setBusy(true);
    track(EVENTS.CHAT_MESSAGE_SENT, { source: "ai_tool", tool: tool.id });

    try {
      const res = await fetch("/api/chat/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Вводные от пользователя:\n${text}`, persona: tool.persona, history: [] }),
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
      if (!got && !out) setError("Пустой ответ. Попробуйте переформулировать.");
      setDone(true);
    } catch {
      setError("Сбой соединения. Попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ borderRadius: 18, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "18px 20px", display: "flex", gap: 13, alignItems: "flex-start", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${tool.rgb},0.12)`, border: `1px solid rgba(${tool.rgb},0.28)` }}>
          <Icon size={19} style={{ color: tool.color }} />
        </div>
        <div>
          <div style={{ fontSize: 15.5, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>{tool.title}</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>{tool.desc}</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <textarea
          value={idea}
          onChange={e => setIdea(e.target.value)}
          placeholder={tool.placeholder}
          rows={3}
          maxLength={4000}
          style={{
            width: "100%", resize: "vertical", minHeight: 74,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 12, color: "#fff", fontSize: 14, padding: "11px 13px", outline: "none",
            fontFamily: "inherit", lineHeight: 1.5,
          }}
          onFocus={e => { e.currentTarget.style.borderColor = `rgba(${tool.rgb},0.5)`; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(${tool.rgb},0.08)`; }}
          onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.boxShadow = "none"; }}
        />

        <button
          onClick={run}
          disabled={busy || !idea.trim()}
          style={{
            alignSelf: "flex-start", padding: "10px 20px", borderRadius: 11, border: "1px solid transparent",
            fontSize: 13.5, fontWeight: 700, color: "#fff", cursor: busy || !idea.trim() ? "not-allowed" : "pointer",
            opacity: busy || !idea.trim() ? 0.55 : 1,
            background: `linear-gradient(135deg, ${tool.color}, #4f46e5)`,
            boxShadow: `0 6px 20px rgba(${tool.rgb},0.3), inset 0 1px 0 rgba(255,255,255,0.16)`,
            transition: "opacity .15s, transform .15s",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          {busy ? (
            <>
              <span style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", display: "inline-block", animation: "toolspin 0.7s linear infinite" }} />
              Думает…
            </>
          ) : tool.cta}
        </button>

        {error && (
          <div style={{ fontSize: 12.5, color: "#f87171", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", borderRadius: 10, padding: "9px 12px" }}>{error}</div>
        )}

        {(out || busy) && (
          <div style={{ marginTop: 2, padding: "14px 16px", borderRadius: 12, background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 13.5, lineHeight: 1.7, color: "rgba(255,255,255,0.82)", whiteSpace: "pre-wrap", maxHeight: 420, overflowY: "auto" }}>
            {out}
            {busy && <span style={{ display: "inline-block", width: 7, height: 15, background: tool.color, marginLeft: 2, verticalAlign: "text-bottom", animation: "toolblink 0.9s step-start infinite" }} />}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ToolsPage() {
  return (
    <div style={{ padding: "28px 28px 60px", maxWidth: 1180, margin: "0 auto" }}>
      <style>{`
        @keyframes toolspin { to { transform: rotate(360deg); } }
        @keyframes toolblink { 50% { opacity: 0; } }
      `}</style>

      <div style={{ marginBottom: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(99,102,241,0.85)", margin: 0 }}>// AI-инструменты</p>
      </div>
      <h1 style={{ fontSize: "clamp(24px,3vw,32px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#fff", margin: "6px 0 8px" }}>Быстрые AI-функции</h1>
      <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "rgba(255,255,255,0.5)", margin: "0 0 28px", maxWidth: 620 }}>
        Пять сфокусированных инструментов. Опишите идею — AI сразу выдаст результат по выбранному направлению.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 18 }}>
        {TOOLS.map(t => <ToolCard key={t.id} tool={t} />)}
      </div>
    </div>
  );
}
