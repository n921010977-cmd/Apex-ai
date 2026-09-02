"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, ChevronDown, ChevronUp, X } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

const EVENTS = [
  { agent: "CEO",      color: "#7C3AED", msg: "Анализирует рыночную позицию" },
  { agent: "CFO",      color: "#3b82f6", msg: "Обновляет финансовую модель" },
  { agent: "CMO",      color: "#10b981", msg: "Исследует каналы привлечения" },
  { agent: "Risk",     color: "#f43f5e", msg: "Оценивает регуляторные риски" },
  { agent: "Growth",   color: "#84cc16", msg: "Строит воронку конверсии" },
  { agent: "CTO",      color: "#a855f7", msg: "Архитектура технического стека" },
  { agent: "COO",      color: "#f59e0b", msg: "Оптимизирует операционный план" },
  { agent: "Data",     color: "#7c3aed", msg: "Агрегирует данные о рынке" },
  { agent: "Brand",    color: "#d946ef", msg: "Формирует бренд-нарратив" },
  { agent: "PR",       color: "#fb7185", msg: "Мониторит инфо-пространство" },
  { agent: "Analyst",  color: "#0ea5e9", msg: "Считает unit-экономику" },
  { agent: "Strategy", color: "#818cf8", msg: "Формирует стратегический отчёт" },
];

interface TickEvent {
  id: number;
  agent: string;
  color: string;
  msg: string;
  ts: string;
}

let idCounter = 0;
function makeEvent(): TickEvent {
  const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  const now = new Date();
  const ts = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
  return { id: idCounter++, ...ev, ts };
}

const STORAGE_KEY = "apex-ticker-dismissed";

export function AgentTicker() {
  // Start empty so server and client render identically (no Math.random / Date
  // during SSR → no hydration mismatch). Events are generated after mount.
  const [events, setEvents] = useState<TickEvent[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) { setDismissed(true); return; }
    setEvents([makeEvent(), makeEvent(), makeEvent()]);
    setMounted(true);
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    sessionStorage.setItem(STORAGE_KEY, "1");
  }, []);

  // Emit a new event every 3–6s
  useEffect(() => {
    if (dismissed) return;
    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = 3000 + Math.random() * 3000;
      timeout = setTimeout(() => {
        setEvents(prev => [makeEvent(), ...prev].slice(0, 8));
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(timeout);
  }, [dismissed]);

  // Render nothing until events exist on the client — avoids SSR/client drift.
  if (dismissed || !mounted || events.length === 0) return null;

  const latest = events[0];

  return (
    <motion.div
      className="agent-ticker"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 2, duration: 0.4, ease: EASE }}
      style={{
        position: "fixed", bottom: 20, right: 20, zIndex: 100,
        width: expanded ? 300 : 240,
        background: "rgba(10,11,18,0.96)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 16,
        boxShadow: "0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03)",
        backdropFilter: "blur(20px)",
        overflow: "hidden",
        transition: "width 0.3s ease",
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 12px",
        borderBottom: expanded ? "1px solid rgba(255,255,255,0.06)" : "none",
      }}>
        {/* Live pulse */}
        <span className="relative flex" style={{ width: 8, height: 8, flexShrink: 0 }}>
          <span className="absolute inline-flex h-full w-full rounded-full animate-ping" style={{ background: "#10b981", opacity: 0.5 }} />
          <span className="relative inline-flex rounded-full" style={{ width: 8, height: 8, background: "#10b981" }} />
        </span>
        <Bot size={13} color="#10b981" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#34d399", letterSpacing: "0.06em", flex: 1 }}>20 АГЕНТОВ · LIVE</span>
        <button onClick={() => setExpanded(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 2 }}>
          {expanded ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        </button>
        <button onClick={dismiss} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.25)", padding: 2 }}>
          <X size={12} />
        </button>
      </div>

      {/* Latest event (always visible) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={latest.id}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
          style={{ padding: "9px 12px", display: "flex", alignItems: "flex-start", gap: 8 }}
        >
          <div style={{
            width: 24, height: 24, borderRadius: 7, flexShrink: 0,
            background: `${latest.color}1a`, border: `1px solid ${latest.color}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 8, fontWeight: 800, color: latest.color,
            marginTop: 1,
          }}>
            {latest.agent.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>{latest.msg}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2, fontFamily: "monospace" }}>{latest.agent} · {latest.ts}</div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Expanded: full log */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", maxHeight: 200, overflowY: "auto" }}>
              {events.slice(1).map(ev => (
                <div key={ev.id} style={{
                  display: "flex", alignItems: "flex-start", gap: 8,
                  padding: "7px 12px", opacity: 0.55,
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                    background: `${ev.color}18`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 7, fontWeight: 800, color: ev.color,
                    marginTop: 1,
                  }}>
                    {ev.agent.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>{ev.msg}</div>
                    <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>{ev.agent} · {ev.ts}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: "8px 12px", borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>Работают в фоне 24/7</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
