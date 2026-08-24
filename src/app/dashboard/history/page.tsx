"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { markVisit } from "@/components/dashboard/EngagementPanel";
import { loadAsks, deleteAsk, clearAsks, syncFromServer, type AskEntry } from "@/lib/ask-history";
import { addTask } from "@/lib/tasks";
import {
  History, Search, MessageSquare, MessagesSquare, Trash2, Clock,
  Filter, Crown, Sparkles, X, Copy, Check, ListPlus,
} from "lucide-react";

// ── Tokens ────────────────────────────────────────────────────────────────────
const BG     = "#05060A";
const SURF   = "rgba(255,255,255,0.03)";
const BORD   = "rgba(255,255,255,0.07)";
const BORD_H = "rgba(255,255,255,0.13)";
const TP     = "#E5E7EB";
const TS     = "rgba(255,255,255,0.5)";
const TM     = "rgba(255,255,255,0.3)";
const ACCENT = "#6366f1";
const MONO   = "var(--font-geist-mono), ui-monospace, monospace";
const EASE   = [0.22, 1, 0.36, 1] as const;

const fmt = (ts: number) => {
  const d = new Date(ts);
  const today = new Date();
  const same = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return same ? `today, ${time}` : `${d.toLocaleDateString("en-US", { day: "2-digit", month: "short" })}, ${time}`;
};

export default function HistoryPage() {
  const [items, setItems]   = useState<AskEntry[]>([]);
  const [query, setQuery]   = useState("");
  const [filter, setFilter] = useState<"all" | "agent" | "council">("all");
  const [selected, setSelected] = useState<AskEntry | null>(null);
  const [copied, setCopied] = useState(false);
  const [addedTask, setAddedTask] = useState(false);

  const refresh = useCallback(() => {
    const a = loadAsks();
    setItems(a);
    setSelected(s => a.find(x => x.id === s?.id) ?? a[0] ?? null);
  }, []);

  useEffect(() => {
    markVisit("history");
    refresh();                                  // instant paint from local cache
    syncFromServer().then(merged => {           // then reconcile with the account
      setItems(merged);
      setSelected(s => merged.find(x => x.id === s?.id) ?? merged[0] ?? null);
    });
    const on = () => refresh();
    window.addEventListener("vertlix-ask-saved", on);
    return () => window.removeEventListener("vertlix-ask-saved", on);
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter(it => filter === "all" || it.kind === filter)
      .filter(it => !q || it.question.toLowerCase().includes(q)
        || (it.answer ?? "").toLowerCase().includes(q)
        || (it.verdict ?? "").toLowerCase().includes(q)
        || (it.agentName ?? "").toLowerCase().includes(q));
  }, [items, query, filter]);

  const counts = useMemo(() => ({
    all: items.length,
    agent: items.filter(i => i.kind === "agent").length,
    council: items.filter(i => i.kind === "council").length,
  }), [items]);

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
  };
  const remove = (id: string) => { deleteAsk(id); };

  return (
    <div style={{ minHeight: "100%", background: BG, padding: "28px 32px 60px" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }}
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 36, height: 36, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg,#6366f1,#4f46e5)", boxShadow: "0 6px 18px rgba(99,102,241,0.4)" }}>
              <History size={18} color="#fff" />
            </span>
            <h1 style={{ fontSize: "clamp(22px,2.6vw,30px)", fontWeight: 800, color: TP, letterSpacing: "-0.02em", margin: 0 }}>Conversation History</h1>
          </div>
          <p style={{ fontSize: 13.5, color: TS, marginTop: 8, maxWidth: 560, lineHeight: 1.6 }}>
            Every question you ask directors or the board is saved here — search, filter, and full answer text.
          </p>
        </div>
        {items.length > 0 && (
          <button onClick={() => { clearAsks(); }}
            style={{ display: "flex", alignItems: "center", gap: 7, height: 40, padding: "0 15px", borderRadius: 11, cursor: "pointer",
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", color: "#ef4444", fontSize: 12.5, fontWeight: 600 }}>
            <Trash2 size={13} /> Clear all
          </button>
        )}
      </motion.div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 260px", minWidth: 220 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: TM, pointerEvents: "none" }} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search history…"
            style={{ width: "100%", height: 42, padding: "0 12px 0 36px", borderRadius: 12, border: `1px solid ${BORD}`, background: "rgba(255,255,255,0.035)", color: TP, fontSize: 13, outline: "none", boxSizing: "border-box" }}
            onFocus={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")} onBlur={e => (e.currentTarget.style.borderColor = BORD)} />
        </div>
        {([["all", "All"], ["agent", "Directors"], ["council", "Board"]] as const).map(([key, label]) => {
          const active = filter === key;
          return (
            <button key={key} onClick={() => setFilter(key)}
              style={{ display: "flex", alignItems: "center", gap: 6, height: 42, padding: "0 14px", borderRadius: 11, cursor: "pointer",
                border: `1px solid ${active ? "rgba(99,102,241,0.5)" : BORD}`, background: active ? "rgba(99,102,241,0.14)" : "transparent",
                color: active ? "#a5b4fc" : TS, fontSize: 12.5, fontWeight: 600 }}>
              {key === "all" && <Filter size={12} />}
              {label}<span style={{ fontFamily: MONO, fontSize: 10, opacity: 0.7 }}>{counts[key]}</span>
            </button>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div style={{ marginTop: 70, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <Sparkles size={22} style={{ color: ACCENT }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: TS }}>Nothing here yet</div>
          <div style={{ fontSize: 13, color: TM, marginTop: 4, maxWidth: 380, marginInline: "auto", lineHeight: 1.6 }}>
            Ask a director a question ("Ask") or convene the board — the conversation will be saved here automatically.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.1fr)", gap: 16, marginTop: 20 }} className="hist-grid">
          {/* List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.length === 0 && <div style={{ padding: "40px 0", textAlign: "center", color: TM, fontSize: 13 }}>Nothing found</div>}
            <AnimatePresence mode="popLayout">
              {filtered.map((it, i) => {
                const active = selected?.id === it.id;
                const isCouncil = it.kind === "council";
                const color = isCouncil ? ACCENT : (it.color ?? ACCENT);
                return (
                  <motion.div key={it.id} layout
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3, ease: EASE, delay: Math.min(i * 0.03, 0.25) }}
                    onClick={() => setSelected(it)} whileHover={{ x: 2 }}
                    style={{ padding: 14, borderRadius: 14, cursor: "pointer",
                      background: active ? `linear-gradient(150deg, ${color}12, rgba(255,255,255,0.02) 60%)` : "rgba(255,255,255,0.022)",
                      border: `1px solid ${active ? color + "50" : BORD}`, transition: "border-color 0.2s, background 0.2s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                        background: `${color}18`, border: `1px solid ${color}30`, color }}>
                        {isCouncil ? <MessagesSquare size={15} /> : <MessageSquare size={15} />}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: "0.02em" }}>
                          {isCouncil ? "Board of Directors" : `${it.agentName} · ${it.agentRole}`}
                        </div>
                        <div style={{ fontFamily: MONO, fontSize: 9.5, color: TM, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                          <Clock size={9} /> {fmt(it.date)}
                        </div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); remove(it.id); }} title="Delete"
                        style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                          background: "transparent", border: "none", color: TM, cursor: "pointer" }}
                        onMouseOver={e => (e.currentTarget.style.color = "#ef4444")} onMouseOut={e => (e.currentTarget.style.color = TM)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TP, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {it.question}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Detail */}
          <div style={{ position: "sticky", top: 20, alignSelf: "start" }}>
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div key={selected.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE }}
                  className="surface-card" style={{ borderRadius: 18, overflow: "hidden" }}>
                  <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${selected.kind === "council" ? ACCENT : (selected.color ?? ACCENT)}, transparent)` }} />
                  <div style={{ padding: "18px 20px 20px", maxHeight: "72vh", overflowY: "auto" }}>
                    {/* question */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16 }}>
                      <span style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(99,102,241,0.14)", border: "1px solid rgba(99,102,241,0.28)", color: "#a5b4fc" }}>
                        <MessageSquare size={14} />
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", color: TM, textTransform: "uppercase", marginBottom: 4 }}>Question · {fmt(selected.date)}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: TP, lineHeight: 1.4 }}>{selected.question}</div>
                      </div>
                    </div>

                    {/* agent answer */}
                    {selected.kind === "agent" && (
                      <div style={{ borderRadius: 12, padding: 14, background: "rgba(255,255,255,0.02)", border: `1px solid ${BORD}` }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: selected.color ?? ACCENT, marginBottom: 8 }}>{selected.agentName} · {selected.agentRole}</div>
                        <p style={{ fontSize: 13.5, lineHeight: 1.7, color: "rgba(255,255,255,0.78)", margin: 0, whiteSpace: "pre-wrap" }}>{selected.answer}</p>
                      </div>
                    )}

                    {/* council answers + verdict */}
                    {selected.kind === "council" && (
                      <>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                          {(selected.responses ?? []).map((r, i) => (
                            <div key={i} style={{ borderRadius: 11, padding: "10px 12px", background: "rgba(255,255,255,0.02)", border: `1px solid ${BORD}` }}>
                              <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: r.color, marginBottom: 4 }}>{r.name} · {r.role}</div>
                              <p style={{ fontSize: 12.5, lineHeight: 1.6, color: "rgba(255,255,255,0.72)", margin: 0 }}>{r.text}</p>
                            </div>
                          ))}
                        </div>
                        {selected.verdict && (
                          <div style={{ borderRadius: 12, padding: 14, background: "linear-gradient(150deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))", border: "1px solid rgba(99,102,241,0.3)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                              <Crown size={13} style={{ color: "#fbbf24" }} />
                              <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em", color: "#a5b4fc", textTransform: "uppercase" }}>Board Verdict</span>
                            </div>
                            <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(255,255,255,0.82)", margin: 0, whiteSpace: "pre-wrap" }}>{selected.verdict}</p>
                          </div>
                        )}
                      </>
                    )}

                    {/* actions */}
                    <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                      <button onClick={() => copy(selected.kind === "council"
                        ? `Question: ${selected.question}\n\n${(selected.responses ?? []).map(r => `${r.name} (${r.role}): ${r.text}`).join("\n\n")}\n\nVerdict: ${selected.verdict ?? ""}`
                        : `Question: ${selected.question}\n\n${selected.agentName}: ${selected.answer ?? ""}`)}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 38, borderRadius: 10, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: `1px solid ${BORD_H}`, color: TS, fontSize: 12.5, fontWeight: 600 }}>
                        {copied ? <><Check size={13} style={{ color: "#10b981" }} /> Copied</> : <><Copy size={13} /> Copy</>}
                      </button>
                      <button onClick={() => {
                        const src = selected.kind === "council" ? "Board of Directors" : `${selected.agentName} · ${selected.agentRole}`;
                        addTask({ title: selected.question, priority: "medium", source: src, color: selected.color });
                        setAddedTask(true); setTimeout(() => setAddedTask(false), 1600);
                      }} title="Add to tasks"
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 38, borderRadius: 10, cursor: "pointer", background: addedTask ? "rgba(16,185,129,0.12)" : "rgba(99,102,241,0.1)", border: `1px solid ${addedTask ? "rgba(16,185,129,0.35)" : "rgba(99,102,241,0.3)"}`, color: addedTask ? "#10b981" : "#a5b4fc", fontSize: 12.5, fontWeight: 600 }}>
                        {addedTask ? <><Check size={13} /> In tasks</> : <><ListPlus size={13} /> To tasks</>}
                      </button>
                      <button onClick={() => remove(selected.id)} title="Delete"
                        style={{ width: 38, display: "flex", alignItems: "center", justifyContent: "center", height: 38, borderRadius: 10, cursor: "pointer", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="surface-card" style={{ borderRadius: 18, padding: "48px 24px", textAlign: "center" }}>
                  <History size={26} style={{ color: ACCENT, opacity: 0.5, marginBottom: 12 }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: TS }}>Select a conversation</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 860px) { :global(.hist-grid) { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
