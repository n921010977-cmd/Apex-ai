"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Search, X, Pin, Trash2, Plus, Check } from "lucide-react";

const STORAGE_KEY = "apex-memories-v1";

// ─── Категории ────────────────────────────────────────────────────────────────
type Category = "idea" | "fact" | "decision" | "task" | "note";
const CATS: Record<Category, { label: string; color: string }> = {
  idea:     { label: "Идея",     color: "#8b5cf6" },
  fact:     { label: "Факт",     color: "#3b82f6" },
  decision: { label: "Решение",  color: "#10b981" },
  task:     { label: "Задача",   color: "#f59e0b" },
  note:     { label: "Заметка",  color: "#94a3b8" },
};
const CAT_KEYS = Object.keys(CATS) as Category[];

// ─── Агенты (фиксированные узлы) ──────────────────────────────────────────────
const AGENTS = [
  { id: "ceo",        label: "CEO / Orchestrator", role: "COMMAND LAYER",  desc: "Маршрутизирует работу, держит контекст системы и координирует агентов." },
  { id: "researcher", label: "Researcher",         role: "INTEL GATHERER", desc: "Собирает данные о рынке, конкурентах и клиентах." },
  { id: "cmo",        label: "CMO",                role: "MARKET VOICE",   desc: "Формирует бренд-нарратив и контент-стратегию." },
  { id: "sales",      label: "Sales Rep",          role: "REVENUE OPS",    desc: "Ведёт воронку и закрывает сделки." },
  { id: "dev",        label: "Dev",                role: "BUILD SYSTEM",   desc: "Проектирует архитектуру и собирает продукт." },
  { id: "data",       label: "Data Analyst",       role: "SIGNAL LAYER",   desc: "Строит метрики, прогнозы и следит за сигналами." },
];
const AGENT_COLOR = "#8b5cf6";

// какие агенты «слушают» категорию
const HUB_AGENTS: Record<Category, string[]> = {
  idea:     ["ceo", "researcher"],
  fact:     ["researcher", "data"],
  decision: ["ceo", "dev"],
  task:     ["sales", "dev"],
  note:     ["cmo", "ceo"],
};

type Memory = { id: string; text: string; cat: Category; tags: string[]; createdAt: number; pinned: boolean };

const SEED: Memory[] = [
  { id: "s1", text: "AI-компания как сервис: нанимаешь не бота, а команду C-level.", cat: "idea", tags: ["видение"], createdAt: Date.now() - 86400000 * 4, pinned: true },
  { id: "s2", text: "Дизайн-система: enterprise dark, индиго-акцент, hairline-рамки.", cat: "decision", tags: ["design"], createdAt: Date.now() - 86400000 * 3, pinned: false },
  { id: "s3", text: "Конкуренты дают одного агента — наш разрыв в «команде».", cat: "fact", tags: ["рынок"], createdAt: Date.now() - 86400000 * 2, pinned: false },
  { id: "s4", text: "Собрать Command Center с живой оркестрацией отделов.", cat: "task", tags: ["mvp"], createdAt: Date.now() - 3600000 * 5, pinned: false },
  { id: "s5", text: "У каждого агента свой характер, мотто и цвет.", cat: "note", tags: ["агенты"], createdAt: Date.now() - 3600000 * 2, pinned: false },
];

function timeAgo(ts: number): string {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return "только что";
  if (s < 3600) return `${Math.floor(s / 60)} мин назад`;
  if (s < 86400) return `${Math.floor(s / 3600)} ч назад`;
  if (s < 172800) return "вчера";
  return new Date(ts).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}
const shortLabel = (t: string) => (t.length > 26 ? t.slice(0, 24).trimEnd() + "…" : t);

// ─── Узлы графа ───────────────────────────────────────────────────────────────
type Kind = "agent" | "hub" | "memory";
type GNode = { id: string; kind: Kind; label: string; color: string; cat?: Category; mem?: Memory; role?: string; desc?: string };

function buildGraph(mems: Memory[]): { nodes: GNode[]; edges: { s: string; t: string }[] } {
  const nodes: GNode[] = [];
  const edges: { s: string; t: string }[] = [];
  AGENTS.forEach(a => nodes.push({ id: a.id, kind: "agent", label: a.label, color: AGENT_COLOR, role: a.role, desc: a.desc }));
  AGENTS.forEach(a => { if (a.id !== "ceo") edges.push({ s: a.id, t: "ceo" }); });
  CAT_KEYS.forEach(k => {
    nodes.push({ id: `hub_${k}`, kind: "hub", label: CATS[k].label, color: CATS[k].color, cat: k });
    HUB_AGENTS[k].forEach(ag => edges.push({ s: `hub_${k}`, t: ag }));
  });
  mems.forEach(m => {
    nodes.push({ id: m.id, kind: "memory", label: shortLabel(m.text), color: CATS[m.cat].color, cat: m.cat, mem: m });
    edges.push({ s: m.id, t: `hub_${m.cat}` });
  });
  return { nodes, edges };
}

type SimNode = GNode & { x: number; y: number; vx: number; vy: number; r: number; deg: number };
function sizeFor(kind: Kind, deg: number) {
  if (kind === "agent") return 15 + Math.min(deg, 10) * 0.9;
  if (kind === "hub") return 11 + Math.min(deg, 8) * 0.7;
  return 6 + Math.min(deg, 5);
}

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftCat, setDraftCat] = useState<Category>("idea");
  const [selected, setSelected] = useState<string | null>("ceo");
  const [justSaved, setJustSaved] = useState(false);

  // load / persist
  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); setMemories(raw ? JSON.parse(raw) : SEED); }
    catch { setMemories(SEED); }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(memories)); }, [memories, loaded]);

  const graph = useMemo(() => buildGraph(memories), [memories]);

  const save = useCallback(() => {
    const text = draft.trim(); if (!text) return;
    const mem: Memory = { id: `m${Date.now()}`, text, cat: draftCat, tags: [], createdAt: Date.now(), pinned: false };
    setMemories(prev => [mem, ...prev]);
    setDraft(""); setSelected(mem.id);
    setJustSaved(true); setTimeout(() => setJustSaved(false), 1300);
  }, [draft, draftCat]);

  const remove = (id: string) => { setMemories(prev => prev.filter(m => m.id !== id)); setSelected(null); };
  const togglePin = (id: string) => setMemories(prev => prev.map(m => m.id === id ? { ...m, pinned: !m.pinned } : m));

  // ── sim data (positions preserved across memory changes) ──
  const simRef = useRef<{ nodes: SimNode[]; edges: [number, number][]; index: Record<string, number> }>({ nodes: [], edges: [], index: {} });
  const alphaRef = useRef(1);
  const selRef = useRef(selected); useEffect(() => { selRef.current = selected; }, [selected]);
  const neighborRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const prev = new Map(simRef.current.nodes.map(n => [n.id, n]));
    const deg: Record<string, number> = {};
    graph.edges.forEach(e => { deg[e.s] = (deg[e.s] || 0) + 1; deg[e.t] = (deg[e.t] || 0) + 1; });
    const nodes: SimNode[] = graph.nodes.map((n, i) => {
      const p = prev.get(n.id);
      let x: number, y: number;
      if (p) { x = p.x; y = p.y; }
      else if (n.kind === "memory" && n.cat) {
        const hub = prev.get(`hub_${n.cat}`); const a = Math.random() * Math.PI * 2; const rr = 24 + Math.random() * 18;
        x = (hub?.x ?? 0) + Math.cos(a) * rr; y = (hub?.y ?? 0) + Math.sin(a) * rr;
      } else { const a = (i / graph.nodes.length) * Math.PI * 2; const rr = 70 + (i % 5) * 22; x = Math.cos(a) * rr; y = Math.sin(a) * rr; }
      return { ...n, x, y, vx: p?.vx ?? 0, vy: p?.vy ?? 0, r: sizeFor(n.kind, deg[n.id] || 1), deg: deg[n.id] || 0 };
    });
    const index: Record<string, number> = {}; nodes.forEach((n, i) => index[n.id] = i);
    const edges = graph.edges.map(e => [index[e.s], index[e.t]] as [number, number]).filter(e => e[0] != null && e[1] != null);
    simRef.current = { nodes, edges, index };
    alphaRef.current = Math.max(alphaRef.current, 0.9);
  }, [graph]);

  // neighbors of selected
  const neighbors = useMemo(() => {
    const s = new Set<number>(); const sim = simRef.current;
    if (selected != null && sim.index[selected] != null) {
      const si = sim.index[selected];
      sim.edges.forEach(e => { if (e[0] === si) s.add(e[1]); if (e[1] === si) s.add(e[0]); });
    }
    return s;
  }, [selected, graph]);
  useEffect(() => { neighborRef.current = neighbors; }, [neighbors]);

  const selNode = selected ? graph.nodes.find(n => n.id === selected) ?? null : null;

  // ── Canvas loop ──
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current; if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0; const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => { const r = wrap.getBoundingClientRect(); W = r.width; H = r.height; canvas.width = W * DPR; canvas.height = H * DPR; canvas.style.width = W + "px"; canvas.style.height = H + "px"; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); };
    resize(); const ro = new ResizeObserver(resize); ro.observe(wrap);

    let raf = 0, hoverIdx = -1, dragIdx = -1, downX = 0, downY = 0, moved = false, t = 0;
    const cx = () => W / 2, cy = () => H / 2;
    const pick = (px: number, py: number) => {
      const { nodes } = simRef.current; const wx = px - cx(), wy = py - cy(); let best = -1, bd = 1e9;
      for (let i = 0; i < nodes.length; i++) { const d = Math.hypot(nodes[i].x - wx, nodes[i].y - wy); if (d < nodes[i].r + 6 && d < bd) { bd = d; best = i; } }
      return best;
    };
    const step = () => {
      const { nodes, edges } = simRef.current; const alpha = alphaRef.current;
      for (let i = 0; i < nodes.length; i++) { const a = nodes[i]; for (let j = i + 1; j < nodes.length; j++) { const b = nodes[j]; let dx = a.x - b.x, dy = a.y - b.y; let d2 = dx * dx + dy * dy; if (d2 < 0.01) { d2 = 0.01; dx = Math.random(); } const d = Math.sqrt(d2); const f = (820 * alpha) / d2; const fx = (dx / d) * f, fy = (dy / d) * f; a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy; } }
      for (const e of edges) { const a = nodes[e[0]], b = nodes[e[1]]; if (!a || !b) continue; const dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy) || 1; const tgt = a.kind === "agent" || b.kind === "agent" ? 92 : 54; const f = ((d - tgt) / d) * 0.022 * alpha; a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f; }
      for (let i = 0; i < nodes.length; i++) { const n = nodes[i]; if (i === dragIdx) { n.vx = 0; n.vy = 0; continue; } n.vx += -n.x * 0.0018 * alpha; n.vy += -n.y * 0.0018 * alpha; n.vx *= 0.85; n.vy *= 0.85; n.x += n.vx; n.y += n.vy; }
      if (alpha > 0.05) alphaRef.current *= 0.99;
    };
    const draw = () => {
      const { nodes, edges, index } = simRef.current; ctx.clearRect(0, 0, W, H); const ox = cx(), oy = cy();
      const sel = selRef.current != null && index[selRef.current] != null ? index[selRef.current] : -1;
      const hi = hoverIdx >= 0 ? hoverIdx : sel;
      // edges
      for (const e of edges) { const a = nodes[e[0]], b = nodes[e[1]]; if (!a || !b) continue; const inc = hi >= 0 && (e[0] === hi || e[1] === hi); ctx.strokeStyle = inc ? "rgba(129,140,248,0.5)" : "rgba(255,255,255,0.045)"; ctx.lineWidth = inc ? 1.3 : 0.6; ctx.beginPath(); ctx.moveTo(ox + a.x, oy + a.y); ctx.lineTo(ox + b.x, oy + b.y); ctx.stroke(); }
      // nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]; const isSel = i === sel; const near = i === hi || neighborRef.current.has(i);
        const dim = hi >= 0 && !near && i !== hi;
        const pulse = n.kind === "agent" ? 1 + Math.sin(t * 0.05 + i) * 0.06 : 1;
        const x = ox + n.x, y = oy + n.y, r = n.r * pulse;
        if (n.kind === "agent" || isSel) { const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3.2); g.addColorStop(0, n.color + (dim ? "14" : "40")); g.addColorStop(1, n.color + "00"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, Math.PI * 2); ctx.fill(); }
        ctx.globalAlpha = dim ? 0.26 : 1; ctx.fillStyle = n.color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = isSel ? "#fff" : "rgba(255,255,255,0.16)"; ctx.lineWidth = isSel ? 2 : 1; ctx.stroke(); ctx.globalAlpha = 1;
        const showLabel = n.kind !== "memory" || isSel || (hi >= 0 && near);
        if (showLabel && !dim) { ctx.font = `${n.kind === "agent" ? 600 : 500} ${n.kind === "agent" ? 12 : 10.5}px ui-sans-serif, system-ui`; ctx.fillStyle = n.kind === "agent" ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.62)"; ctx.textAlign = "center"; ctx.fillText(n.label, x, y + r + 12); }
      }
    };
    const loop = () => { t++; if (!reduce) step(); draw(); raf = requestAnimationFrame(loop); };
    loop();
    const onMove = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); const px = e.clientX - r.left, py = e.clientY - r.top; if (dragIdx >= 0) { simRef.current.nodes[dragIdx].x = px - cx(); simRef.current.nodes[dragIdx].y = py - cy(); alphaRef.current = Math.max(alphaRef.current, 0.5); moved = true; return; } hoverIdx = pick(px, py); canvas.style.cursor = hoverIdx >= 0 ? "pointer" : "grab"; };
    const onDown = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); const px = e.clientX - r.left, py = e.clientY - r.top; downX = px; downY = py; moved = false; const hit = pick(px, py); if (hit >= 0) { dragIdx = hit; alphaRef.current = Math.max(alphaRef.current, 0.4); } };
    const onUp = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); const px = e.clientX - r.left, py = e.clientY - r.top; if (!moved && Math.hypot(px - downX, py - downY) < 5) { const hit = pick(px, py); setSelected(hit >= 0 ? simRef.current.nodes[hit].id : null); } dragIdx = -1; };
    canvas.addEventListener("mousemove", onMove); canvas.addEventListener("mousedown", onDown); window.addEventListener("mouseup", onUp);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener("mousemove", onMove); canvas.removeEventListener("mousedown", onDown); window.removeEventListener("mouseup", onUp); };
  }, []);

  const selMem = selNode?.mem;

  return (
    <div className="mem-root">
      <div className="mem-main">
        {/* Header */}
        <div className="mem-head">
          <div>
            <h1 className="mem-title">Топология памяти и базы данных</h1>
            <p className="mem-sub">Агенты, воспоминания и топик-хабы. Всё, что вы запомните, появляется здесь узлом и сохраняется навсегда.</p>
          </div>
          <div className="mem-count">{graph.nodes.length} узлов · {graph.edges.length} связей</div>
        </div>

        {/* Composer */}
        <div className="mem-composer">
          <div className="mem-cat-pick">
            {CAT_KEYS.map(k => (
              <button key={k} className={`mem-cat-btn${draftCat === k ? " on" : ""}`} onClick={() => setDraftCat(k)}
                style={draftCat === k ? { background: `${CATS[k].color}22`, borderColor: `${CATS[k].color}66`, color: CATS[k].color } : undefined}>
                <span className="mem-dot" style={{ background: CATS[k].color }} />{CATS[k].label}
              </button>
            ))}
          </div>
          <input className="mem-in" value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") save(); }} placeholder="Что запомнить? Enter — сохранить" spellCheck={false} />
          <button className="mem-save" onClick={save} disabled={!draft.trim()}>
            {justSaved ? <><Check size={15} /> Готово</> : <><Plus size={15} /> Запомнить</>}
          </button>
        </div>

        {/* Graph */}
        <div className="mem-canvas-wrap" ref={wrapRef}>
          <canvas ref={canvasRef} />
        </div>

        {/* Legend */}
        <div className="mem-legend">
          <span className="mem-leg"><span className="mem-dot" style={{ background: AGENT_COLOR }} />Агенты</span>
          {CAT_KEYS.map(k => <span key={k} className="mem-leg"><span className="mem-dot" style={{ background: CATS[k].color }} />{CATS[k].label}</span>)}
          <span className="mem-leg-hint">клик — детали · тащи узлы мышью</span>
        </div>
      </div>

      {/* Detail panel */}
      <aside className="mem-panel">
        <AnimatePresence mode="wait">
          {selNode ? (
            <motion.div key={selNode.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
              <div className="mem-panel-tags">
                <span className="mem-chip" style={{ color: selNode.color, borderColor: `${selNode.color}55` }}>
                  <span className="mem-dot" style={{ background: selNode.color }} />
                  {selNode.kind === "agent" ? "АГЕНТ" : selNode.kind === "hub" ? "ТОПИК-ХАБ" : "ПАМЯТЬ"}
                </span>
                {selNode.role && <span className="mem-chip ghost">{selNode.role}</span>}
                {selMem && <span className="mem-chip ghost">{CATS[selMem.cat].label}</span>}
              </div>

              <h2 className="mem-panel-title">{selMem ? selMem.text : selNode.label}</h2>
              {selNode.desc && <p className="mem-panel-desc">{selNode.desc}</p>}
              {selNode.kind === "hub" && <p className="mem-panel-desc">Хаб категории «{selNode.label}». Собирает связанные воспоминания и передаёт их агентам.</p>}

              <div className="mem-tiles">
                <div className="mem-tile"><span className="mem-tile-l">Тип</span><span className="mem-tile-v">{selNode.kind === "agent" ? "Агент" : selNode.kind === "hub" ? "Хаб" : "Память"}</span></div>
                <div className="mem-tile"><span className="mem-tile-l">Область</span><span className="mem-tile-v">{selNode.kind === "memory" ? "LOCAL" : "GLOBAL"}</span></div>
                <div className="mem-tile"><span className="mem-tile-l">{selMem ? "Записано" : "Размер"}</span><span className="mem-tile-v">{selMem ? timeAgo(selMem.createdAt) : selNode.kind === "agent" ? "0 B" : `${(selNode.label.length * 1.4).toFixed(0)} KB`}</span></div>
                <div className="mem-tile"><span className="mem-tile-l">Связей</span><span className="mem-tile-v">{neighbors.size}</span></div>
              </div>

              {selMem && (
                <div className="mem-mem-actions">
                  <button className={`mem-mbtn${selMem.pinned ? " on" : ""}`} onClick={() => togglePin(selMem.id)}><Pin size={13} fill={selMem.pinned ? "currentColor" : "none"} /> {selMem.pinned ? "Закреплено" : "Закрепить"}</button>
                  <button className="mem-mbtn danger" onClick={() => remove(selMem.id)}><Trash2 size={13} /> Забыть</button>
                </div>
              )}

              <div className="mem-rel-label">Связанные узлы</div>
              <div className="mem-links">
                {Array.from(neighbors).slice(0, 8).map(i => { const ln = simRef.current.nodes[i]; if (!ln) return null; return (
                  <button key={ln.id} className="mem-link" onClick={() => setSelected(ln.id)}>
                    <span className="mem-dot" style={{ background: ln.color }} /><span className="mem-link-t">{ln.label}</span>
                  </button>
                ); })}
                {neighbors.size === 0 && <div className="mem-empty-links">Нет связей</div>}
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mem-panel-empty">
              <Database size={26} />
              <p>Выберите узел на карте или запишите новое воспоминание.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>

      <MemStyles />
    </div>
  );
}

function MemStyles() {
  return (
    <style jsx global>{`
      .mem-root { background: #05060A; min-height: 100%; display: grid; grid-template-columns: 1fr 316px; }
      .mem-main { min-width: 0; padding: 24px 24px 20px; display: flex; flex-direction: column; }
      .mem-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
      .mem-title { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: #E5E7EB; margin: 0 0 4px; }
      .mem-sub { font-size: 12.5px; color: rgba(255,255,255,0.45); margin: 0; max-width: 62ch; line-height: 1.5; }
      .mem-count { flex-shrink: 0; font-family: var(--font-geist-mono), monospace; font-size: 11px; color: rgba(129,140,248,0.9); background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.25); border-radius: 9px; padding: 6px 11px; white-space: nowrap; }

      .mem-composer { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
      .mem-cat-pick { display: flex; gap: 5px; flex-wrap: wrap; }
      .mem-cat-btn { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 600; color: rgba(255,255,255,0.55); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 9px; padding: 6px 9px; cursor: pointer; transition: all .15s; }
      .mem-cat-btn:hover { background: rgba(255,255,255,0.07); }
      .mem-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
      .mem-in { flex: 1; min-width: 180px; height: 38px; background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.09); border-radius: 11px; padding: 0 13px; color: #E5E7EB; font-size: 13.5px; outline: none; transition: border-color .15s; }
      .mem-in:focus { border-color: rgba(99,102,241,0.5); }
      .mem-in::placeholder { color: rgba(255,255,255,0.3); }
      .mem-save { display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 16px; border-radius: 11px; border: none; cursor: pointer; font-size: 12.5px; font-weight: 700; color: #fff; background: linear-gradient(135deg, #6366f1, #4f46e5); box-shadow: inset 0 1px 0 rgba(255,255,255,0.18); transition: transform .15s, opacity .15s; }
      .mem-save:hover:not(:disabled) { transform: translateY(-1px); }
      .mem-save:disabled { opacity: 0.45; cursor: not-allowed; }

      .mem-canvas-wrap { position: relative; flex: 1; min-height: 440px; border-radius: 20px; overflow: hidden; cursor: grab;
        background: radial-gradient(120% 120% at 50% 45%, rgba(30,32,56,0.4), rgba(5,6,10,0) 62%), rgba(255,255,255,0.012);
        border: 1px solid rgba(255,255,255,0.06); box-shadow: inset 0 1px 0 rgba(255,255,255,0.04); }
      .mem-canvas-wrap canvas { display: block; }

      .mem-legend { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; margin-top: 12px; }
      .mem-leg { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; color: rgba(255,255,255,0.55); }
      .mem-leg-hint { margin-left: auto; font-size: 11px; color: rgba(255,255,255,0.28); }

      .mem-panel { border-left: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.015); padding: 26px 20px; overflow-y: auto; }
      .mem-panel-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
      .mem-chip { display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-geist-mono), monospace; font-size: 9.5px; font-weight: 700; letter-spacing: 0.06em; padding: 4px 9px; border-radius: 7px; border: 1px solid; }
      .mem-chip.ghost { color: rgba(255,255,255,0.45); border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); }
      .mem-panel-title { font-size: 18px; font-weight: 800; letter-spacing: -0.01em; color: #fff; margin: 0 0 10px; line-height: 1.3; }
      .mem-panel-desc { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.58); margin: 0 0 18px; }

      .mem-tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
      .mem-tile { display: flex; flex-direction: column; gap: 4px; padding: 10px 12px; border-radius: 11px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); }
      .mem-tile-l { font-family: var(--font-geist-mono), monospace; font-size: 9px; letter-spacing: 0.1em; color: rgba(255,255,255,0.35); text-transform: uppercase; }
      .mem-tile-v { font-size: 12.5px; font-weight: 700; color: rgba(255,255,255,0.85); }

      .mem-mem-actions { display: flex; gap: 7px; margin-bottom: 18px; }
      .mem-mbtn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 34px; border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.65); transition: all .15s; }
      .mem-mbtn:hover { background: rgba(255,255,255,0.08); }
      .mem-mbtn.on { color: #818cf8; border-color: rgba(99,102,241,0.4); background: rgba(99,102,241,0.12); }
      .mem-mbtn.danger:hover { color: #f87171; border-color: rgba(248,113,113,0.3); background: rgba(248,113,113,0.1); }

      .mem-rel-label { font-family: var(--font-geist-mono), monospace; font-size: 9.5px; letter-spacing: 0.12em; color: rgba(255,255,255,0.35); text-transform: uppercase; margin-bottom: 10px; }
      .mem-links { display: flex; flex-direction: column; gap: 6px; }
      .mem-link { display: flex; align-items: center; gap: 9px; padding: 9px 11px; border-radius: 10px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); cursor: pointer; transition: all .15s; text-align: left; }
      .mem-link:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12); }
      .mem-link-t { font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,0.78); }
      .mem-empty-links { font-size: 12px; color: rgba(255,255,255,0.3); }

      .mem-panel-empty { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; padding-top: 56px; color: rgba(255,255,255,0.35); }
      .mem-panel-empty p { font-size: 13px; line-height: 1.6; margin: 0; max-width: 24ch; }

      @media (max-width: 900px) {
        .mem-root { grid-template-columns: 1fr; }
        .mem-panel { border-left: none; border-top: 1px solid rgba(255,255,255,0.06); }
      }
    `}</style>
  );
}
