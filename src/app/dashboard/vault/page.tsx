"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRef } from "react";
import { markVisit } from "@/components/dashboard/EngagementPanel";
import {
  Database, Search, Plus, FileText, FolderOpen, Brain, FileBarChart,
  StickyNote, X, Copy, Check, Clock, Filter, Sparkles, Trash2, HardDrive,
} from "lucide-react";

// ── Design tokens ──────────────────────────────────────────────────────────────
const BG     = "#05060A";
const SURF   = "rgba(255,255,255,0.03)";
const BORD   = "rgba(255,255,255,0.07)";
const BORD_H = "rgba(255,255,255,0.13)";
const TP     = "#E5E7EB";
const TS     = "rgba(255,255,255,0.5)";
const TM     = "rgba(255,255,255,0.3)";
const ACCENT = "#7C3AED";
const MONO   = "var(--font-geist-mono), ui-monospace, monospace";
const EASE   = [0.22, 1, 0.36, 1] as const;

// ── Model ────────────────────────────────────────────────────────────────────
type KType = "project" | "report" | "note" | "memory" | "doc";

interface KItem {
  id: string;
  type: KType;
  title: string;
  content: string;
  source: string;
  tags: string[];
  date: number;
  custom?: boolean;   // added by the user → deletable
}

const TYPE_META: Record<KType, { label: string; color: string; icon: React.ElementType }> = {
  project: { label: "Projects",  color: "#7C3AED", icon: FolderOpen   },
  report:  { label: "Reports",   color: "#D946EF", icon: FileBarChart },
  note:    { label: "Notes",  color: "#10b981", icon: StickyNote   },
  memory:  { label: "Memory",   color: "#f59e0b", icon: Brain        },
  doc:     { label: "Documents",color: "#3b82f6", icon: FileText     },
};

const VAULT_KEY = "vertlix-vault-items";

// Seeded institutional knowledge (canonical company docs + agent memory)
const SEED: KItem[] = [
  { id: "s-icp",   type: "doc",    title: "Ideal Customer Profile (ICP)",       source: "Knowledge Base",  tags: ["strategy", "canon"], date: Date.now() - 86400000 * 6,
    content: "The ideal customer is a founder of a SaaS/service business at the stage from idea to $1M ARR. Pain point: no team of C-level experts and no money for consultants. Values speed, specifics, and data. Decides quickly, dislikes fluff." },
  { id: "s-market",type: "doc",    title: "Market Map · Segments",       source: "Research Agent", tags: ["market", "competitors"], date: Date.now() - 86400000 * 4,
    content: "TAM of AI tools for founders is ~$4.2B, growing +24%/year. Main segments: solo founders, early-stage startups, agencies. Competitors cover individual features; the \"turnkey board of directors\" niche is underserved." },
  { id: "s-play",  type: "doc",    title: "Operational Playbook",         source: "Knowledge Base",  tags: ["ops", "process"], date: Date.now() - 86400000 * 9,
    content: "Strategy launch standard: 1) gather project context, 2) run through the board of 20 directors, 3) synthesize a verdict, 4) report + next step. Response SLA < 5 minutes. Every verdict contains a decision, risks, and a metric." },
  { id: "s-mem1",  type: "memory", title: "What the Company Already Knows",       source: "Meta-Memory", tags: ["memory", "meta"], date: Date.now() - 86400000 * 2,
    content: "Accumulated context: \"before/after\" cases and concrete numbers perform best. Content hooks with a direct CTA get higher engagement. Customers most often ask about pricing and entering new markets." },
  { id: "s-mem2",  type: "memory", title: "Qualified Leads · Scoring", source: "Sales Agent", tags: ["sales", "scoring"], date: Date.now() - 86400000 * 1,
    content: "Scoring model: segment revenue (40%), intent (30%), ICP fit (30%). High-value ≥ $100K/mo and a booked call — top priority. Churn triggers are detected within the first 3 weeks." },
];

// ── localStorage readers (real user data) ──────────────────────────────────────
function loadUserItems(): KItem[] {
  if (typeof window === "undefined") return [];
  const out: KItem[] = [];

  // Projects → knowledge
  try {
    const projects = JSON.parse(localStorage.getItem("apex-user-projects") || "[]");
    for (const p of projects) {
      const verdicts = Array.isArray(p.aiResults)
        ? p.aiResults.slice(0, 3).map((r: { role?: string; opinion?: string; verdict?: string }) => `${r.role ?? ""}: ${r.opinion ?? r.verdict ?? ""}`).join("\n")
        : "";
      out.push({
        id: `proj-${p.id}`, type: "project", title: p.name ?? "Project",
        source: "My Projects", tags: [p.industry, p.stage].filter(Boolean),
        date: typeof p.createdAt === "number" ? p.createdAt : Date.now(),
        content: `${p.description ?? ""}\n\nScore: ${p.score ?? "—"} · Forecast: ${p.revenue ?? "—"} · Market: ${p.market ?? "—"}\n\n${verdicts}`.trim(),
      });
    }
  } catch { /* ignore */ }

  // Notes → knowledge
  try {
    const notes = JSON.parse(localStorage.getItem("apex-notepad-v3") || "[]");
    for (const n of notes) {
      out.push({
        id: `note-${n.id}`, type: "note", title: n.title ?? "Note",
        source: "Notepad", tags: Array.isArray(n.tags) ? n.tags : [],
        date: typeof n.updatedAt === "number" ? n.updatedAt : Date.now(),
        content: (n.content ?? "").replace(/[#*`]/g, ""),
      });
    }
  } catch { /* ignore */ }

  // User-added vault items
  try {
    const custom = JSON.parse(localStorage.getItem(VAULT_KEY) || "[]");
    for (const c of custom) out.push({ ...c, custom: true });
  } catch { /* ignore */ }

  return out;
}

const bytesOf = (s: string) => {
  const b = new Blob([s]).size;
  return b < 1024 ? `${b} B` : `${(b / 1024).toFixed(1)} KB`;
};
const fmtDate = (ts: number) => new Date(ts).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });

// ── Count-up ───────────────────────────────────────────────────────────────
function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0; const t0 = performance.now();
    const step = (ts: number) => { const p = Math.min(1, (ts - t0) / 900); setV(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return <span ref={ref}>{v}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function KnowledgeVaultPage() {
  const [items, setItems]   = useState<KItem[]>(SEED);
  const [query, setQuery]   = useState("");
  const [filter, setFilter] = useState<KType | "all">("all");
  const [selected, setSelected] = useState<KItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [draft, setDraft]   = useState({ title: "", content: "" });

  useEffect(() => { markVisit("vault"); }, []);

  // Load real data on mount (client-only → no hydration mismatch).
  // Server-stored custom items take priority; localStorage acts as an offline
  // cache/fallback, and the seeded institutional docs always show.
  useEffect(() => {
    const localMerged = [...loadUserItems(), ...SEED];
    setItems(localMerged);
    setSelected(localMerged[0] ?? null);

    (async () => {
      try {
        const r = await fetch("/api/vault");
        if (!r.ok) return; // 401 in demo/no-session → keep local
        const d = await r.json();
        if (!d.success || !Array.isArray(d.data)) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const serverItems: KItem[] = d.data.map((x: any) => ({
          id: x.id, type: (x.type ?? "doc") as KType, title: x.title ?? "Untitled",
          content: x.content ?? "", source: x.source ?? "Knowledge Base",
          tags: Array.isArray(x.tags) ? x.tags : [],
          date: new Date(x.updated_at ?? x.created_at ?? Date.now()).getTime(), custom: true,
        }));
        // Replace localStorage-only custom items with the authoritative server list.
        const nonCustom = [...loadUserItems().filter(i => !i.custom), ...SEED];
        const merged = [...serverItems, ...nonCustom];
        setItems(merged);
        setSelected(s => merged.find(m => m.id === s?.id) ?? merged[0] ?? null);
      } catch { /* offline → keep local */ }
    })();
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const it of items) c[it.type] = (c[it.type] ?? 0) + 1;
    return c;
  }, [items]);

  const totalBytes = useMemo(() => {
    const b = items.reduce((s, it) => s + new Blob([it.content]).size, 0);
    return b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter(it => filter === "all" || it.type === filter)
      .filter(it => !q || it.title.toLowerCase().includes(q) || it.content.toLowerCase().includes(q) || it.tags.some(t => t.toLowerCase().includes(q)))
      .sort((a, b) => b.date - a.date);
  }, [items, query, filter]);

  const persistLocal = (list: KItem[]) => {
    try { localStorage.setItem(VAULT_KEY, JSON.stringify(list.filter(x => x.custom))); } catch { /* ignore */ }
  };

  const addItem = useCallback(async () => {
    if (!draft.title.trim()) return;
    const item: KItem = {
      id: `k-${Date.now()}`, type: "doc", title: draft.title.trim(),
      content: draft.content.trim(), source: "Added manually", tags: [], date: Date.now(), custom: true,
    };
    // Optimistic insert
    setItems(prev => { const next = [item, ...prev]; persistLocal(next); return next; });
    setSelected(item);
    setDraft({ title: "", content: "" });
    setAdding(false);

    // Persist to server; swap the optimistic id for the server id on success.
    try {
      const r = await fetch("/api/vault", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: item.title, content: item.content, type: item.type }) });
      const d = await r.json();
      if (d.success && d.data?.id) {
        setItems(prev => prev.map(x => x.id === item.id ? { ...x, id: d.data.id } : x));
        setSelected(s => (s?.id === item.id ? { ...s, id: d.data.id } : s));
      }
    } catch { /* offline — stays in localStorage */ }
  }, [draft]);

  const removeItem = useCallback(async (id: string) => {
    setItems(prev => { const next = prev.filter(x => x.id !== id); persistLocal(next); return next; });
    setSelected(s => (s?.id === id ? null : s));
    // Server-stored items have UUID ids (not the local "k-…" prefix).
    if (!id.startsWith("k-")) {
      try { await fetch(`/api/vault/${id}`, { method: "DELETE" }); } catch { /* ignore */ }
    }
  }, []);

  const copy = useCallback((text: string) => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: "100%", background: BG, padding: "28px 32px 60px" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }}
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 36, height: 36, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg,#7C3AED,#6D28D9)", boxShadow: "0 6px 18px rgba(124,58,237,0.4)" }}>
              <Database size={18} color="#fff" />
            </span>
            <h1 style={{ fontSize: "clamp(22px,2.6vw,30px)", fontWeight: 800, color: TP, letterSpacing: "-0.02em", margin: 0 }}>Knowledge Vault</h1>
          </div>
          <p style={{ fontSize: 13.5, color: TS, marginTop: 8, maxWidth: 560, lineHeight: 1.6 }}>
            A single company knowledge base: projects, reports, notes, and agent memory — search, filters, and preview.
          </p>
        </div>
        <button onClick={() => setAdding(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, height: 42, padding: "0 18px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg,#7C3AED,#6D28D9)", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 6px 20px rgba(124,58,237,0.32), inset 0 1px 0 rgba(255,255,255,0.18)" }}>
          <Plus size={15} /> Add to Vault
        </button>
      </motion.div>

      {/* Stat row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 22 }}>
        {[
          { label: "Total Entries", value: items.length, color: ACCENT, icon: Database },
          { label: "Projects", value: counts.project ?? 0, color: TYPE_META.project.color, icon: FolderOpen },
          { label: "Notes", value: counts.note ?? 0, color: TYPE_META.note.color, icon: StickyNote },
          { label: "Memory + Docs", value: (counts.memory ?? 0) + (counts.doc ?? 0), color: TYPE_META.doc.color, icon: Brain },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.05 + i * 0.05 }}
            className="surface-card" style={{ padding: "14px 16px", borderRadius: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `${s.color}15`, border: `1px solid ${s.color}28` }}>
              <s.icon size={16} style={{ color: s.color }} />
            </span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: TP, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}><CountUp to={s.value} /></div>
              <div style={{ fontSize: 11, color: TM, marginTop: 3 }}>{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 260px", minWidth: 220 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: TM, pointerEvents: "none" }} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search the knowledge base…"
            style={{ width: "100%", height: 42, padding: "0 12px 0 36px", borderRadius: 12, border: `1px solid ${BORD}`, background: "rgba(255,255,255,0.035)", color: TP, fontSize: 13, outline: "none", boxSizing: "border-box" }}
            onFocus={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)")} onBlur={e => (e.currentTarget.style.borderColor = BORD)} />
        </div>
        <span style={{ fontFamily: MONO, fontSize: 11, color: TM, display: "flex", alignItems: "center", gap: 6 }}>
          <HardDrive size={12} /> {totalBytes}
        </span>
      </div>

      {/* Type filter pills */}
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {([["all", "All", ACCENT] as const, ...(Object.keys(TYPE_META) as KType[]).map(t => [t, TYPE_META[t].label, TYPE_META[t].color] as const)]).map(([key, label, color]) => {
          const active = filter === key;
          const n = counts[key] ?? 0;
          return (
            <button key={key} onClick={() => setFilter(key as KType | "all")}
              style={{ display: "flex", alignItems: "center", gap: 7, height: 34, padding: "0 13px", borderRadius: 10, cursor: "pointer",
                border: `1px solid ${active ? color + "50" : BORD}`, background: active ? `${color}15` : "transparent", color: active ? color : TS, fontSize: 12.5, fontWeight: 600 }}>
              {key === "all" && <Filter size={12} />}
              {label}
              <span style={{ fontFamily: MONO, fontSize: 10, opacity: 0.7 }}>{n}</span>
            </button>
          );
        })}
      </div>

      {/* Main: list + preview */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(0, 1fr)", gap: 16, marginTop: 20 }} className="vault-grid">
        {/* List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.length === 0 && (
            <div style={{ padding: "50px 0", textAlign: "center", color: TM, fontSize: 13 }}>
              <Sparkles size={22} style={{ color: ACCENT, opacity: 0.6, marginBottom: 10 }} /><br />
              Nothing found. Create projects and notes — they will appear here.
            </div>
          )}
          {filtered.map((it, i) => {
            const meta = TYPE_META[it.type];
            const active = selected?.id === it.id;
            return (
              <motion.div key={it.id} layout
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE, delay: Math.min(i * 0.03, 0.3) }}
                onClick={() => setSelected(it)} whileHover={{ x: 2 }}
                style={{ padding: 14, borderRadius: 14, cursor: "pointer", position: "relative",
                  background: active ? `linear-gradient(150deg, ${meta.color}12, rgba(255,255,255,0.02) 60%)` : "rgba(255,255,255,0.022)",
                  border: `1px solid ${active ? meta.color + "50" : BORD}`, transition: "border-color 0.2s, background 0.2s" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    background: `linear-gradient(140deg, ${meta.color}2e, ${meta.color}0d)`, border: `1px solid ${meta.color}40` }}>
                    <meta.icon size={17} style={{ color: meta.color }} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: TP, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</span>
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: meta.color, background: `${meta.color}14`, border: `1px solid ${meta.color}2e`, borderRadius: 5, padding: "1px 6px", flexShrink: 0 }}>{meta.label.replace(/s$/, "")}</span>
                    </div>
                    <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.42)", lineHeight: 1.5, margin: "5px 0 0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {it.content || "Empty"}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, fontFamily: MONO, fontSize: 9.5, color: TM }}>
                      <span>{it.source}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={9} /> {fmtDate(it.date)}</span>
                      <span>{bytesOf(it.content)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Preview panel */}
        <div style={{ position: "sticky", top: 20, alignSelf: "start" }}>
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div key={selected.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE }}
                className="surface-card" style={{ borderRadius: 18, overflow: "hidden" }}>
                <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${TYPE_META[selected.type].color}, transparent)` }} />
                <div style={{ padding: "18px 20px 20px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                    <span style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      background: `linear-gradient(140deg, ${TYPE_META[selected.type].color}30, ${TYPE_META[selected.type].color}0d)`, border: `1px solid ${TYPE_META[selected.type].color}40` }}>
                      {(() => { const I = TYPE_META[selected.type].icon; return <I size={20} style={{ color: TYPE_META[selected.type].color }} />; })()}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: TP, letterSpacing: "-0.01em", lineHeight: 1.25 }}>{selected.title}</div>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: TM, marginTop: 4 }}>{selected.source} · {fmtDate(selected.date)} · {bytesOf(selected.content)}</div>
                    </div>
                  </div>

                  {selected.tags.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                      {selected.tags.map(t => (
                        <span key={t} style={{ fontSize: 10, color: TS, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORD}`, borderRadius: 6, padding: "2px 8px" }}>{t}</span>
                      ))}
                    </div>
                  )}

                  <div style={{ maxHeight: 340, overflowY: "auto", fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.72)", whiteSpace: "pre-wrap",
                    padding: 14, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: `1px solid ${BORD}` }}>
                    {selected.content || "Empty entry."}
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <button onClick={() => copy(selected.content)}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 38, borderRadius: 10, cursor: "pointer",
                        background: "rgba(255,255,255,0.05)", border: `1px solid ${BORD_H}`, color: TS, fontSize: 12.5, fontWeight: 600 }}>
                      {copied ? <><Check size={13} style={{ color: "#10b981" }} /> Copied</> : <><Copy size={13} /> Copy</>}
                    </button>
                    {selected.custom && (
                      <button onClick={() => removeItem(selected.id)} title="Delete"
                        style={{ width: 38, display: "flex", alignItems: "center", justifyContent: "center", height: 38, borderRadius: 10, cursor: "pointer",
                          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="surface-card" style={{ borderRadius: 18, padding: "48px 24px", textAlign: "center" }}>
                <Database size={26} style={{ color: ACCENT, opacity: 0.5, marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: TS }}>Select an entry</div>
                <div style={{ fontSize: 12, color: TM, marginTop: 4 }}>Click a card on the left to preview</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add modal */}
      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setAdding(false)}
            style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(5,6,10,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <motion.div onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.24, ease: EASE }}
              style={{ width: "min(560px, 100%)", borderRadius: 20, background: "#0a0c15", border: `1px solid ${BORD_H}`, padding: 24, position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, borderRadius: "20px 20px 0 0", background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.7), transparent)" }} />
              <button onClick={() => setAdding(false)} style={{ position: "absolute", top: 16, right: 16, width: 30, height: 30, borderRadius: 9, background: SURF, border: `1px solid ${BORD}`, color: TS, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={14} />
              </button>
              <div style={{ fontSize: 17, fontWeight: 800, color: TP, marginBottom: 4 }}>Add to Knowledge Base</div>
              <div style={{ fontSize: 12.5, color: TS, marginBottom: 18 }}>Save a document, insight, or note to the company's shared memory.</div>
              <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Title"
                style={{ width: "100%", height: 42, padding: "0 14px", borderRadius: 11, border: `1px solid ${BORD}`, background: "rgba(255,255,255,0.035)", color: TP, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 10 }}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)")} onBlur={e => (e.currentTarget.style.borderColor = BORD)} />
              <textarea value={draft.content} onChange={e => setDraft(d => ({ ...d, content: e.target.value }))} placeholder="Content…" rows={6}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 11, border: `1px solid ${BORD}`, background: "rgba(255,255,255,0.035)", color: TP, fontSize: 13.5, lineHeight: 1.6, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)")} onBlur={e => (e.currentTarget.style.borderColor = BORD)} />
              <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
                <button onClick={() => setAdding(false)} style={{ height: 40, padding: "0 18px", borderRadius: 11, background: "transparent", border: `1px solid ${BORD}`, color: TS, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button onClick={addItem} disabled={!draft.title.trim()}
                  style={{ height: 40, padding: "0 20px", borderRadius: 11, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: draft.title.trim() ? "pointer" : "default",
                    background: draft.title.trim() ? "linear-gradient(135deg,#7C3AED,#6D28D9)" : "rgba(255,255,255,0.06)", boxShadow: draft.title.trim() ? "0 4px 14px rgba(124,58,237,0.32)" : "none" }}>
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @media (max-width: 860px) {
          :global(.vault-grid) { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
