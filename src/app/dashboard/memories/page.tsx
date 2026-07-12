"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, X, Pin, Trash2, Plus, Check, ZoomIn, ZoomOut, Maximize2, Pencil, Search, Link2 } from "lucide-react";

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

const AGENTS = [
  { id: "ceo",        label: "CEO / Orchestrator", role: "COMMAND LAYER",  desc: "Маршрутизирует работу, держит контекст системы и координирует агентов." },
  { id: "researcher", label: "Researcher",         role: "INTEL GATHERER", desc: "Собирает данные о рынке, конкурентах и клиентах." },
  { id: "cmo",        label: "CMO",                role: "MARKET VOICE",   desc: "Формирует бренд-нарратив и контент-стратегию." },
  { id: "sales",      label: "Sales Rep",          role: "REVENUE OPS",    desc: "Ведёт воронку и закрывает сделки." },
  { id: "dev",        label: "Dev",                role: "BUILD SYSTEM",   desc: "Проектирует архитектуру и собирает продукт." },
  { id: "data",       label: "Data Analyst",       role: "SIGNAL LAYER",   desc: "Строит метрики, прогнозы и следит за сигналами." },
];
const AGENT_COLOR = "#8b5cf6";
const HUB_AGENTS: Record<Category, string[]> = {
  idea: ["ceo", "researcher"], fact: ["researcher", "data"], decision: ["ceo", "dev"], task: ["sales", "dev"], note: ["cmo", "ceo"],
};

type Memory = { id: string; text: string; cat: Category; tags: string[]; createdAt: number; pinned: boolean };
const SEED: Memory[] = [
  { id: "s1", text: "AI-компания как сервис: нанимаешь не бота, а команду C-level.", cat: "idea", tags: ["видение", "core"], createdAt: Date.now() - 86400000 * 4, pinned: true },
  { id: "s2", text: "Дизайн-система: enterprise dark, индиго-акцент, hairline-рамки.", cat: "decision", tags: ["design", "core"], createdAt: Date.now() - 86400000 * 3, pinned: false },
  { id: "s3", text: "Конкуренты дают одного агента — наш разрыв в «команде».", cat: "fact", tags: ["рынок"], createdAt: Date.now() - 86400000 * 2, pinned: false },
  { id: "s4", text: "Собрать Command Center с живой оркестрацией отделов.", cat: "task", tags: ["mvp", "core"], createdAt: Date.now() - 3600000 * 5, pinned: false },
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

type Kind = "agent" | "hub" | "memory";
type GNode = { id: string; kind: Kind; label: string; color: string; cat?: Category; mem?: Memory; role?: string; desc?: string };
type Edge = { s: string; t: string; kind: "struct" | "assoc" };

function buildGraph(mems: Memory[]): { nodes: GNode[]; edges: Edge[] } {
  const nodes: GNode[] = [];
  const edges: Edge[] = [];
  AGENTS.forEach(a => nodes.push({ id: a.id, kind: "agent", label: a.label, color: AGENT_COLOR, role: a.role, desc: a.desc }));
  AGENTS.forEach(a => { if (a.id !== "ceo") edges.push({ s: a.id, t: "ceo", kind: "struct" }); });
  CAT_KEYS.forEach(k => {
    nodes.push({ id: `hub_${k}`, kind: "hub", label: CATS[k].label, color: CATS[k].color, cat: k });
    HUB_AGENTS[k].forEach(ag => edges.push({ s: `hub_${k}`, t: ag, kind: "struct" }));
  });
  mems.forEach(m => {
    nodes.push({ id: m.id, kind: "memory", label: shortLabel(m.text), color: CATS[m.cat].color, cat: m.cat, mem: m });
    edges.push({ s: m.id, t: `hub_${m.cat}`, kind: "struct" });
  });
  // авто-связи: воспоминания с общим тегом связываются между собой
  const linkCount: Record<string, number> = {};
  for (let i = 0; i < mems.length; i++) for (let j = i + 1; j < mems.length; j++) {
    const a = mems[i], b = mems[j];
    const shared = a.tags.filter(t => b.tags.includes(t));
    if (shared.length && (linkCount[a.id] || 0) < 3 && (linkCount[b.id] || 0) < 3) {
      edges.push({ s: a.id, t: b.id, kind: "assoc" });
      linkCount[a.id] = (linkCount[a.id] || 0) + 1; linkCount[b.id] = (linkCount[b.id] || 0) + 1;
    }
  }
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
  const [draftTags, setDraftTags] = useState("");
  const [selected, setSelected] = useState<string | null>("ceo");
  const [justSaved, setJustSaved] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); setMemories(raw ? JSON.parse(raw) : SEED); }
    catch { setMemories(SEED); } setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(memories)); }, [memories, loaded]);

  const graph = useMemo(() => buildGraph(memories), [memories]);

  const focusRef = useRef<((id: string) => void) | null>(null);

  const save = useCallback(() => {
    const text = draft.trim(); if (!text) return;
    const tags = draftTags.split(",").map(t => t.trim().replace(/^#/, "")).filter(Boolean);
    const mem: Memory = { id: `m${Date.now()}`, text, cat: draftCat, tags, createdAt: Date.now(), pinned: false };
    setMemories(prev => [mem, ...prev]);
    setDraft(""); setDraftTags(""); setSelected(mem.id);
    setJustSaved(true); setTimeout(() => setJustSaved(false), 1300);
    setTimeout(() => focusRef.current?.(mem.id), 60);
  }, [draft, draftCat, draftTags]);

  const remove = (id: string) => { setMemories(prev => prev.filter(m => m.id !== id)); setSelected(null); setEditing(false); };
  const togglePin = (id: string) => setMemories(prev => prev.map(m => m.id === id ? { ...m, pinned: !m.pinned } : m));
  const commitEdit = (id: string) => { const t = editText.trim(); if (t) setMemories(prev => prev.map(m => m.id === id ? { ...m, text: t } : m)); setEditing(false); };

  const simRef = useRef<{ nodes: SimNode[]; edges: (Edge & { si: number; ti: number; ph: number })[]; index: Record<string, number> }>({ nodes: [], edges: [], index: {} });
  const alphaRef = useRef(1);
  const selRef = useRef(selected); useEffect(() => { selRef.current = selected; }, [selected]);
  const queryRef = useRef(query); useEffect(() => { queryRef.current = query; }, [query]);
  const neighborRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const prev = new Map(simRef.current.nodes.map(n => [n.id, n]));
    const deg: Record<string, number> = {};
    graph.edges.forEach(e => { deg[e.s] = (deg[e.s] || 0) + 1; deg[e.t] = (deg[e.t] || 0) + 1; });
    const nodes: SimNode[] = graph.nodes.map((n, i) => {
      const p = prev.get(n.id); let x: number, y: number;
      if (p) { x = p.x; y = p.y; }
      else if (n.kind === "memory" && n.cat) { const hub = prev.get(`hub_${n.cat}`); const a = Math.random() * Math.PI * 2, rr = 22 + Math.random() * 16; x = (hub?.x ?? 0) + Math.cos(a) * rr; y = (hub?.y ?? 0) + Math.sin(a) * rr; }
      else { const a = (i / graph.nodes.length) * Math.PI * 2, rr = 70 + (i % 5) * 22; x = Math.cos(a) * rr; y = Math.sin(a) * rr; }
      return { ...n, x, y, vx: p?.vx ?? 0, vy: p?.vy ?? 0, r: sizeFor(n.kind, deg[n.id] || 1), deg: deg[n.id] || 0 };
    });
    const index: Record<string, number> = {}; nodes.forEach((n, i) => index[n.id] = i);
    const edges = graph.edges.map(e => ({ ...e, si: index[e.s], ti: index[e.t], ph: Math.random() })).filter(e => e.si != null && e.ti != null);
    simRef.current = { nodes, edges, index };
    alphaRef.current = Math.max(alphaRef.current, 0.9);
  }, [graph]);

  const neighbors = useMemo(() => {
    const s = new Set<number>(); const sim = simRef.current;
    if (selected != null && sim.index[selected] != null) { const si = sim.index[selected]; sim.edges.forEach(e => { if (e.si === si) s.add(e.ti); if (e.ti === si) s.add(e.si); }); }
    return s;
  }, [selected, graph]);
  useEffect(() => { neighborRef.current = neighbors; }, [neighbors]);

  const selNode = selected ? graph.nodes.find(n => n.id === selected) ?? null : null;
  const selMem = selNode?.mem;
  useEffect(() => { setEditing(false); if (selMem) setEditText(selMem.text); }, [selected]); // eslint-disable-line

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const camRef = useRef({ x: 0, y: 0, s: 1, tx: 0, ty: 0, ts: 1, focus: false });

  // camera focus helper exposed to save()
  useEffect(() => {
    focusRef.current = (id: string) => {
      const n = simRef.current.nodes.find(nn => nn.id === id); if (!n) return;
      const c = camRef.current; c.tx = n.x; c.ty = n.y; c.ts = 1.6; c.focus = true;
    };
  }, []);
  // focus camera when selection changes via UI
  useEffect(() => {
    if (!selected) return; const n = simRef.current.nodes.find(nn => nn.id === selected); if (!n) return;
    const c = camRef.current; c.tx = n.x; c.ty = n.y; c.ts = Math.max(c.s, 1.4); c.focus = true;
  }, [selected]);

  const zoomBy = useCallback((f: number) => { const c = camRef.current; c.ts = Math.max(0.4, Math.min(3, (c.focus ? c.ts : c.s) * f)); c.tx = c.focus ? c.tx : c.x; c.ty = c.focus ? c.ty : c.y; c.focus = true; }, []);
  const resetView = useCallback(() => { const c = camRef.current; c.tx = 0; c.ty = 0; c.ts = 1; c.focus = true; }, []);

  useEffect(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current; if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0; const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => { const r = wrap.getBoundingClientRect(); W = r.width; H = r.height; canvas.width = W * DPR; canvas.height = H * DPR; canvas.style.width = W + "px"; canvas.style.height = H + "px"; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); };
    resize(); const ro = new ResizeObserver(resize); ro.observe(wrap);

    let raf = 0, hoverIdx = -1, dragIdx = -1, panning = false, lastX = 0, lastY = 0, downX = 0, downY = 0, moved = false, t = 0;
    const cam = camRef.current;
    const toScreen = (wx: number, wy: number) => ({ x: W / 2 + (wx - cam.x) * cam.s, y: H / 2 + (wy - cam.y) * cam.s });
    const toWorld = (px: number, py: number) => ({ x: (px - W / 2) / cam.s + cam.x, y: (py - H / 2) / cam.s + cam.y });
    const pick = (px: number, py: number) => { const { nodes } = simRef.current; const w = toWorld(px, py); let best = -1, bd = 1e9; for (let i = 0; i < nodes.length; i++) { const d = Math.hypot(nodes[i].x - w.x, nodes[i].y - w.y); if (d < nodes[i].r + 7 && d < bd) { bd = d; best = i; } } return best; };

    const step = () => {
      const { nodes, edges } = simRef.current; const alpha = alphaRef.current;
      for (let i = 0; i < nodes.length; i++) { const a = nodes[i]; for (let j = i + 1; j < nodes.length; j++) { const b = nodes[j]; let dx = a.x - b.x, dy = a.y - b.y; let d2 = dx * dx + dy * dy; if (d2 < 0.01) { d2 = 0.01; dx = Math.random(); } const d = Math.sqrt(d2); const f = (820 * alpha) / d2; const fx = (dx / d) * f, fy = (dy / d) * f; a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy; } }
      for (const e of edges) { const a = nodes[e.si], b = nodes[e.ti]; if (!a || !b) continue; const dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy) || 1; const tgt = e.kind === "assoc" ? 70 : (a.kind === "agent" || b.kind === "agent" ? 92 : 54); const f = ((d - tgt) / d) * (e.kind === "assoc" ? 0.01 : 0.022) * alpha; a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f; }
      for (let i = 0; i < nodes.length; i++) { const n = nodes[i]; if (i === dragIdx) { n.vx = 0; n.vy = 0; continue; } n.vx += -n.x * 0.0018 * alpha; n.vy += -n.y * 0.0018 * alpha; n.vx *= 0.85; n.vy *= 0.85; n.x += n.vx; n.y += n.vy; }
      if (alpha > 0.05) alphaRef.current *= 0.99;
      // camera tween
      if (cam.focus) { cam.x += (cam.tx - cam.x) * 0.09; cam.y += (cam.ty - cam.y) * 0.09; cam.s += (cam.ts - cam.s) * 0.09; if (Math.abs(cam.tx - cam.x) < 0.4 && Math.abs(cam.ty - cam.y) < 0.4 && Math.abs(cam.ts - cam.s) < 0.005) { cam.x = cam.tx; cam.y = cam.ty; cam.s = cam.ts; cam.focus = false; } }
    };

    const draw = () => {
      const { nodes, edges, index } = simRef.current; ctx.clearRect(0, 0, W, H);
      const sel = selRef.current != null && index[selRef.current] != null ? index[selRef.current] : -1;
      const hi = hoverIdx >= 0 ? hoverIdx : sel;
      const q = queryRef.current.trim().toLowerCase();
      // edges + particles
      for (const e of edges) {
        const a = nodes[e.si], b = nodes[e.ti]; if (!a || !b) continue;
        const A = toScreen(a.x, a.y), B = toScreen(b.x, b.y);
        const inc = hi >= 0 && (e.si === hi || e.ti === hi);
        ctx.strokeStyle = inc ? "rgba(129,140,248,0.5)" : e.kind === "assoc" ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.05)";
        ctx.lineWidth = inc ? 1.4 : 0.6; if (e.kind === "assoc" && !inc) ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); ctx.setLineDash([]);
        // flowing particle (only on structural edges, brighter when highlighted)
        if (e.kind === "struct") {
          const frac = ((t * 0.006) + e.ph) % 1;
          const px = A.x + (B.x - A.x) * frac, py = A.y + (B.y - A.y) * frac;
          ctx.globalAlpha = inc ? 0.9 : 0.32; ctx.fillStyle = a.color;
          ctx.beginPath(); ctx.arc(px, py, inc ? 2.4 : 1.6, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        }
      }
      // nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]; const isSel = i === sel; const near = i === hi || neighborRef.current.has(i);
        const matchQ = q ? n.label.toLowerCase().includes(q) : true;
        const dim = (hi >= 0 && !near && i !== hi) || !matchQ;
        const P = toScreen(n.x, n.y); const pulse = n.kind === "agent" ? 1 + Math.sin(t * 0.05 + i) * 0.06 : 1;
        const r = n.r * pulse * cam.s;
        if (n.kind === "agent" || isSel || (q && matchQ)) { const g = ctx.createRadialGradient(P.x, P.y, 0, P.x, P.y, r * 3.2); g.addColorStop(0, n.color + (dim ? "12" : "44")); g.addColorStop(1, n.color + "00"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(P.x, P.y, r * 3.2, 0, Math.PI * 2); ctx.fill(); }
        ctx.globalAlpha = dim ? 0.24 : 1; ctx.fillStyle = n.color; ctx.beginPath(); ctx.arc(P.x, P.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = isSel ? "#fff" : "rgba(255,255,255,0.16)"; ctx.lineWidth = isSel ? 2 : 1; ctx.stroke(); ctx.globalAlpha = 1;
        // маркер «закреплено» — точка в углу узла
        if (n.kind === "memory" && n.mem?.pinned) {
          const px = P.x + r * 0.72, py = P.y - r * 0.72;
          const pp = 1 + Math.sin(t * 0.09) * 0.18;
          const pr = Math.max(2.6, 3 * cam.s) * pp;
          ctx.globalAlpha = dim ? 0.4 : 1;
          ctx.beginPath(); ctx.arc(px, py, pr + 2.4, 0, Math.PI * 2); ctx.fillStyle = n.color + "55"; ctx.fill();
          ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill();
          ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.strokeStyle = n.color; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.globalAlpha = 1;
        }
        const showLabel = (n.kind !== "memory" || isSel || (hi >= 0 && near) || (q && matchQ)) && cam.s > 0.55;
        if (showLabel && !dim) { const fs = (n.kind === "agent" ? 12 : 10.5) * Math.min(cam.s, 1.3); ctx.font = `${n.kind === "agent" ? 600 : 500} ${fs}px ui-sans-serif, system-ui`; ctx.fillStyle = n.kind === "agent" ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.62)"; ctx.textAlign = "center"; ctx.fillText(n.label, P.x, P.y + r + fs + 1); }
      }
      // minimap
      const mmW = 116, mmH = 84, mmx = W - mmW - 12, mmy = H - mmH - 12;
      ctx.fillStyle = "rgba(10,11,18,0.7)"; ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 1;
      ctx.beginPath(); (ctx as any).roundRect?.(mmx, mmy, mmW, mmH, 8); ctx.fill(); ctx.stroke();
      let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
      for (const n of nodes) { minx = Math.min(minx, n.x); miny = Math.min(miny, n.y); maxx = Math.max(maxx, n.x); maxy = Math.max(maxy, n.y); }
      const span = Math.max(maxx - minx, maxy - miny, 1) * 1.15; const mcx = (minx + maxx) / 2, mcy = (miny + maxy) / 2;
      const m2s = (wx: number, wy: number) => ({ x: mmx + mmW / 2 + ((wx - mcx) / span) * mmW, y: mmy + mmH / 2 + ((wy - mcy) / span) * mmH });
      for (const n of nodes) { const p = m2s(n.x, n.y); ctx.fillStyle = n.color; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.arc(p.x, p.y, n.kind === "agent" ? 2.2 : 1.3, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1;
      // viewport rect on minimap
      const tl = toWorld(0, 0), br = toWorld(W, H); const a = m2s(tl.x, tl.y), b2 = m2s(br.x, br.y);
      ctx.strokeStyle = "rgba(129,140,248,0.7)"; ctx.lineWidth = 1; ctx.strokeRect(Math.max(mmx, a.x), Math.max(mmy, a.y), Math.min(b2.x - a.x, mmW), Math.min(b2.y - a.y, mmH));
    };

    const loop = () => { t++; if (!reduce) step(); draw(); raf = requestAnimationFrame(loop); };
    loop();

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect(); const px = e.clientX - r.left, py = e.clientY - r.top;
      if (dragIdx >= 0) { const w = toWorld(px, py); simRef.current.nodes[dragIdx].x = w.x; simRef.current.nodes[dragIdx].y = w.y; alphaRef.current = Math.max(alphaRef.current, 0.4); moved = true; return; }
      if (panning) { cam.x -= (px - lastX) / cam.s; cam.y -= (py - lastY) / cam.s; lastX = px; lastY = py; cam.focus = false; moved = true; return; }
      hoverIdx = pick(px, py); canvas.style.cursor = hoverIdx >= 0 ? "pointer" : "grab";
    };
    const onDown = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); const px = e.clientX - r.left, py = e.clientY - r.top; downX = px; downY = py; moved = false; const hit = pick(px, py); if (hit >= 0) { dragIdx = hit; alphaRef.current = Math.max(alphaRef.current, 0.4); } else { panning = true; lastX = px; lastY = py; canvas.style.cursor = "grabbing"; } };
    const onUp = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); const px = e.clientX - r.left, py = e.clientY - r.top; if (!moved && Math.hypot(px - downX, py - downY) < 5) { const hit = pick(px, py); setSelected(hit >= 0 ? simRef.current.nodes[hit].id : null); } dragIdx = -1; panning = false; canvas.style.cursor = "grab"; };
    const onWheel = (e: WheelEvent) => { e.preventDefault(); const r = canvas.getBoundingClientRect(); const px = e.clientX - r.left, py = e.clientY - r.top; const before = toWorld(px, py); const f = e.deltaY < 0 ? 1.12 : 0.89; cam.s = Math.max(0.4, Math.min(3, cam.s * f)); cam.focus = false; cam.x = before.x - (px - W / 2) / cam.s; cam.y = before.y - (py - H / 2) / cam.s; };
    canvas.addEventListener("mousemove", onMove); canvas.addEventListener("mousedown", onDown); window.addEventListener("mouseup", onUp); canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener("mousemove", onMove); canvas.removeEventListener("mousedown", onDown); window.removeEventListener("mouseup", onUp); canvas.removeEventListener("wheel", onWheel); };
  }, []);

  // keyboard: / focus search, Esc deselect
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = ["INPUT", "TEXTAREA"].includes((document.activeElement?.tagName ?? ""));
      if (e.key === "/" && !typing) { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "Escape") { setSelected(null); (document.activeElement as HTMLElement)?.blur?.(); }
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);

  // search focuses first match
  useEffect(() => {
    const q = query.trim().toLowerCase(); if (!q) return;
    const hit = graph.nodes.find(n => n.label.toLowerCase().includes(q));
    if (hit) focusRef.current?.(hit.id);
  }, [query, graph]);

  const relatedMems = useMemo(() => {
    if (!selMem) return [];
    return memories.filter(m => m.id !== selMem.id && m.tags.some(t => selMem.tags.includes(t))).slice(0, 5);
  }, [selMem, memories]);

  const stats = useMemo(() => { const c: Record<string, number> = {}; memories.forEach(m => c[m.cat] = (c[m.cat] || 0) + 1); return c; }, [memories]);

  return (
    <div className="mem-root">
      <div className="mem-main">
        <div className="mem-head">
          <div>
            <h1 className="mem-title">Топология памяти и базы данных</h1>
            <p className="mem-sub">Живой граф: агенты, воспоминания и топик-хабы. Родственные записи связываются автоматически по тегам.</p>
          </div>
          <div className="mem-head-right">
            <div className="mem-search"><Search size={14} /><input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Найти узел  /" spellCheck={false} />{query && <button onClick={() => setQuery("")}><X size={13} /></button>}</div>
            <div className="mem-count">{graph.nodes.length} узлов · {graph.edges.length} связей</div>
          </div>
        </div>

        <div className="mem-composer">
          <div className="mem-cat-pick">
            {CAT_KEYS.map(k => (
              <button key={k} className={`mem-cat-btn${draftCat === k ? " on" : ""}`} onClick={() => setDraftCat(k)}
                style={draftCat === k ? { background: `${CATS[k].color}22`, borderColor: `${CATS[k].color}66`, color: CATS[k].color } : undefined}>
                <span className="mem-dot" style={{ background: CATS[k].color }} />{CATS[k].label}
              </button>
            ))}
          </div>
          <input className="mem-in" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter") save(); }} placeholder="Что запомнить?" spellCheck={false} />
          <input className="mem-tags-in" value={draftTags} onChange={e => setDraftTags(e.target.value)} onKeyDown={e => { if (e.key === "Enter") save(); }} placeholder="теги" spellCheck={false} />
          <button className="mem-save" onClick={save} disabled={!draft.trim()}>{justSaved ? <><Check size={15} /> Готово</> : <><Plus size={15} /> Запомнить</>}</button>
        </div>

        <div className="mem-canvas-wrap" ref={wrapRef}>
          <canvas ref={canvasRef} />
          <div className="mem-zoom">
            <button onClick={() => zoomBy(1.25)} title="Приблизить"><ZoomIn size={15} /></button>
            <button onClick={() => zoomBy(0.8)} title="Отдалить"><ZoomOut size={15} /></button>
            <button onClick={resetView} title="Сброс вида"><Maximize2 size={14} /></button>
          </div>
        </div>

        <div className="mem-legend">
          <span className="mem-leg"><span className="mem-dot" style={{ background: AGENT_COLOR }} />Агенты</span>
          {CAT_KEYS.map(k => <span key={k} className="mem-leg"><span className="mem-dot" style={{ background: CATS[k].color }} />{CATS[k].label} <b>{stats[k] || 0}</b></span>)}
          <span className="mem-leg-hint">колесо — зум · тащи фон — панорама · клик — детали</span>
        </div>
      </div>

      <aside className="mem-panel">
        <AnimatePresence mode="wait">
          {selNode ? (
            <motion.div key={selNode.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
              <div className="mem-panel-tags">
                <span className="mem-chip" style={{ color: selNode.color, borderColor: `${selNode.color}55` }}><span className="mem-dot" style={{ background: selNode.color }} />{selNode.kind === "agent" ? "АГЕНТ" : selNode.kind === "hub" ? "ТОПИК-ХАБ" : "ПАМЯТЬ"}</span>
                {selNode.role && <span className="mem-chip ghost">{selNode.role}</span>}
                {selMem && <span className="mem-chip ghost">{CATS[selMem.cat].label}</span>}
                {selMem?.pinned && <span className="mem-chip" style={{ color: "#818cf8", borderColor: "rgba(99,102,241,0.5)" }}><Pin size={9} fill="currentColor" /> Закреплено</span>}
              </div>

              {editing && selMem ? (
                <div className="mem-edit">
                  <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3} autoFocus />
                  <div className="mem-edit-row"><button className="mem-mbtn on" onClick={() => commitEdit(selMem.id)}><Check size={13} /> Сохранить</button><button className="mem-mbtn" onClick={() => setEditing(false)}>Отмена</button></div>
                </div>
              ) : (
                <h2 className="mem-panel-title">{selMem ? selMem.text : selNode.label}</h2>
              )}
              {selNode.desc && <p className="mem-panel-desc">{selNode.desc}</p>}
              {selNode.kind === "hub" && <p className="mem-panel-desc">Хаб категории «{selNode.label}». Собирает связанные воспоминания и передаёт их агентам.</p>}

              <div className="mem-tiles">
                <div className="mem-tile"><span className="mem-tile-l">Тип</span><span className="mem-tile-v">{selNode.kind === "agent" ? "Агент" : selNode.kind === "hub" ? "Хаб" : "Память"}</span></div>
                <div className="mem-tile"><span className="mem-tile-l">Область</span><span className="mem-tile-v">{selNode.kind === "memory" ? "LOCAL" : "GLOBAL"}</span></div>
                <div className="mem-tile"><span className="mem-tile-l">{selMem ? "Записано" : "Размер"}</span><span className="mem-tile-v">{selMem ? timeAgo(selMem.createdAt) : selNode.kind === "agent" ? "0 B" : `${(selNode.label.length * 1.4).toFixed(0)} KB`}</span></div>
                <div className="mem-tile"><span className="mem-tile-l">Связей</span><span className="mem-tile-v">{neighbors.size}</span></div>
              </div>

              {selMem && (
                <>
                  {selMem.tags.length > 0 && <div className="mem-tagrow">{selMem.tags.map(tg => <span key={tg} className="mem-tag">#{tg}</span>)}</div>}
                  <div className="mem-mem-actions">
                    <button className="mem-mbtn" onClick={() => { setEditText(selMem.text); setEditing(true); }}><Pencil size={13} /> Изменить</button>
                    <button className={`mem-mbtn${selMem.pinned ? " on" : ""}`} onClick={() => togglePin(selMem.id)}><Pin size={13} fill={selMem.pinned ? "currentColor" : "none"} /></button>
                    <button className="mem-mbtn danger" onClick={() => remove(selMem.id)}><Trash2 size={13} /></button>
                  </div>
                </>
              )}

              {selMem && relatedMems.length > 0 && (
                <>
                  <div className="mem-rel-label"><Link2 size={12} /> Похожие по тегам</div>
                  <div className="mem-links">{relatedMems.map(rm => (
                    <button key={rm.id} className="mem-link" onClick={() => setSelected(rm.id)}><span className="mem-dot" style={{ background: CATS[rm.cat].color }} /><span className="mem-link-t">{shortLabel(rm.text)}</span></button>
                  ))}</div>
                </>
              )}

              <div className="mem-rel-label" style={{ marginTop: 16 }}>Связанные узлы</div>
              <div className="mem-links">
                {Array.from(neighbors).slice(0, 8).map(i => { const ln = simRef.current.nodes[i]; if (!ln) return null; return (
                  <button key={ln.id} className="mem-link" onClick={() => setSelected(ln.id)}><span className="mem-dot" style={{ background: ln.color }} /><span className="mem-link-t">{ln.label}</span></button>
                ); })}
                {neighbors.size === 0 && <div className="mem-empty-links">Нет связей</div>}
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mem-panel-empty">
              <Database size={26} /><p>Выберите узел на карте или запишите новое воспоминание.</p>
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
      .mem-root { background: #05060A; min-height: 100%; display: grid; grid-template-columns: 1fr 320px; }
      .mem-main { min-width: 0; padding: 22px 22px 18px; display: flex; flex-direction: column; }
      .mem-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
      .mem-title { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: #E5E7EB; margin: 0 0 4px; }
      .mem-sub { font-size: 12.5px; color: rgba(255,255,255,0.45); margin: 0; max-width: 62ch; line-height: 1.5; }
      .mem-head-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
      .mem-search { display: flex; align-items: center; gap: 8px; height: 34px; padding: 0 11px; border-radius: 10px; background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.08); }
      .mem-search:focus-within { border-color: rgba(99,102,241,0.5); }
      .mem-search svg { color: rgba(255,255,255,0.4); }
      .mem-search input { width: 130px; background: none; border: none; outline: none; color: #E5E7EB; font-size: 12.5px; }
      .mem-search input::placeholder { color: rgba(255,255,255,0.3); }
      .mem-search button { background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; display: flex; }
      .mem-count { font-family: var(--font-geist-mono), monospace; font-size: 11px; color: rgba(129,140,248,0.9); background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.25); border-radius: 9px; padding: 7px 11px; white-space: nowrap; }

      .mem-composer { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
      .mem-cat-pick { display: flex; gap: 5px; flex-wrap: wrap; }
      .mem-cat-btn { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 600; color: rgba(255,255,255,0.55); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 9px; padding: 6px 9px; cursor: pointer; transition: all .15s; }
      .mem-cat-btn:hover { background: rgba(255,255,255,0.07); }
      .mem-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
      .mem-in { flex: 1; min-width: 160px; height: 38px; background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.09); border-radius: 11px; padding: 0 13px; color: #E5E7EB; font-size: 13.5px; outline: none; transition: border-color .15s; }
      .mem-in:focus { border-color: rgba(99,102,241,0.5); }
      .mem-in::placeholder, .mem-tags-in::placeholder { color: rgba(255,255,255,0.3); }
      .mem-tags-in { width: 100px; height: 38px; background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.09); border-radius: 11px; padding: 0 12px; color: #E5E7EB; font-size: 12.5px; outline: none; }
      .mem-tags-in:focus { border-color: rgba(99,102,241,0.5); }
      .mem-save { display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 16px; border-radius: 11px; border: none; cursor: pointer; font-size: 12.5px; font-weight: 700; color: #fff; background: linear-gradient(135deg, #6366f1, #4f46e5); box-shadow: inset 0 1px 0 rgba(255,255,255,0.18); transition: transform .15s, opacity .15s; }
      .mem-save:hover:not(:disabled) { transform: translateY(-1px); } .mem-save:disabled { opacity: 0.45; cursor: not-allowed; }

      .mem-canvas-wrap { position: relative; flex: 1; min-height: 430px; border-radius: 20px; overflow: hidden;
        background: radial-gradient(120% 120% at 50% 45%, rgba(30,32,56,0.4), rgba(5,6,10,0) 62%), rgba(255,255,255,0.012);
        border: 1px solid rgba(255,255,255,0.06); box-shadow: inset 0 1px 0 rgba(255,255,255,0.04); }
      .mem-canvas-wrap canvas { display: block; }
      .mem-zoom { position: absolute; top: 12px; left: 12px; display: flex; flex-direction: column; gap: 6px; }
      .mem-zoom button { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; background: rgba(12,13,20,0.75); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.65); cursor: pointer; backdrop-filter: blur(6px); transition: all .15s; }
      .mem-zoom button:hover { background: rgba(255,255,255,0.1); color: #fff; }

      .mem-legend { display: flex; flex-wrap: wrap; align-items: center; gap: 13px; margin-top: 11px; }
      .mem-leg { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; color: rgba(255,255,255,0.55); }
      .mem-leg b { font-family: var(--font-geist-mono), monospace; font-weight: 700; color: rgba(255,255,255,0.4); font-size: 10px; }
      .mem-leg-hint { margin-left: auto; font-size: 11px; color: rgba(255,255,255,0.28); }

      .mem-panel { border-left: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.015); padding: 24px 20px; overflow-y: auto; }
      .mem-panel-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
      .mem-chip { display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-geist-mono), monospace; font-size: 9.5px; font-weight: 700; letter-spacing: 0.06em; padding: 4px 9px; border-radius: 7px; border: 1px solid; }
      .mem-chip.ghost { color: rgba(255,255,255,0.45); border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); }
      .mem-panel-title { font-size: 18px; font-weight: 800; letter-spacing: -0.01em; color: #fff; margin: 0 0 10px; line-height: 1.3; }
      .mem-panel-desc { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.58); margin: 0 0 18px; }

      .mem-edit textarea { width: 100%; resize: none; background: rgba(255,255,255,0.04); border: 1px solid rgba(99,102,241,0.4); border-radius: 10px; padding: 10px; color: #E5E7EB; font-size: 14px; line-height: 1.5; font-family: inherit; outline: none; margin-bottom: 8px; }
      .mem-edit-row { display: flex; gap: 7px; margin-bottom: 14px; }

      .mem-tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
      .mem-tile { display: flex; flex-direction: column; gap: 4px; padding: 10px 12px; border-radius: 11px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); }
      .mem-tile-l { font-family: var(--font-geist-mono), monospace; font-size: 9px; letter-spacing: 0.1em; color: rgba(255,255,255,0.35); text-transform: uppercase; }
      .mem-tile-v { font-size: 12.5px; font-weight: 700; color: rgba(255,255,255,0.85); }

      .mem-tagrow { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 12px; }
      .mem-tag { font-family: var(--font-geist-mono), monospace; font-size: 10px; color: rgba(255,255,255,0.42); background: rgba(255,255,255,0.05); border-radius: 6px; padding: 2px 6px; }

      .mem-mem-actions { display: flex; gap: 7px; margin-bottom: 18px; }
      .mem-mbtn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 34px; border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.65); transition: all .15s; }
      .mem-mbtn:hover { background: rgba(255,255,255,0.08); }
      .mem-mbtn.on { color: #818cf8; border-color: rgba(99,102,241,0.4); background: rgba(99,102,241,0.12); }
      .mem-mbtn.danger { flex: 0 0 40px; } .mem-mbtn.danger:hover { color: #f87171; border-color: rgba(248,113,113,0.3); background: rgba(248,113,113,0.1); }

      .mem-rel-label { display: flex; align-items: center; gap: 6px; font-family: var(--font-geist-mono), monospace; font-size: 9.5px; letter-spacing: 0.12em; color: rgba(255,255,255,0.35); text-transform: uppercase; margin-bottom: 10px; }
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
        .mem-head { flex-direction: column; } .mem-head-right { width: 100%; }
      }
    `}</style>
  );
}
