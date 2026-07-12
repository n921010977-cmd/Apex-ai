"use client";

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Search, X } from "lucide-react";

// ─── Типы узлов ───────────────────────────────────────────────────────────────
type NodeType = "agent" | "topic" | "memory" | "doc" | "artifact" | "config";

const TYPE_META: Record<NodeType, { color: string; label: string; rel: string[] }> = {
  agent:    { color: "#8b5cf6", label: "Агент",      rel: ["SPECIALIST-AGENT", "ORCHESTRATES", "OWNS_CONTEXT"] },
  topic:    { color: "#06b6d4", label: "Топик-хаб",  rel: ["TOPIC_HUB", "GROUPS", "SHARED_CONTEXT"] },
  memory:   { color: "#f59e0b", label: "Память",     rel: ["MEMORY_RECORD", "RECALLED_BY", "LOCAL"] },
  doc:      { color: "#3b82f6", label: "Документ",   rel: ["VAULT_DOC", "REFERENCED_BY", "INDEXED"] },
  artifact: { color: "#10b981", label: "Артефакт",   rel: ["DATA_ARTIFACT", "PRODUCED_BY", "VERSIONED"] },
  config:   { color: "#94a3b8", label: "Конфиг",     rel: ["CONFIG_NODE", "READ_BY", "SYSTEM"] },
};

// ─── Данные графа ─────────────────────────────────────────────────────────────
type RawNode = { id: string; label: string; type: NodeType; desc: string; scope: "LOCAL" | "GLOBAL"; role?: string; status?: "working" | "idle" };

function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const AGENTS: RawNode[] = [
  { id: "ceo",        label: "CEO / Orchestrator", type: "agent", scope: "GLOBAL", role: "COMMAND LAYER", status: "working", desc: "Маршрутизирует работу, держит контекст системы и координирует агентов-специалистов." },
  { id: "researcher", label: "Researcher",         type: "agent", scope: "GLOBAL", role: "INTEL GATHERER", status: "working", desc: "Собирает данные о рынке, конкурентах и клиентах, наполняет память фактами." },
  { id: "cmo",        label: "CMO",                type: "agent", scope: "GLOBAL", role: "MARKET VOICE", status: "working", desc: "Формирует бренд-нарратив, позиционирование и контент-стратегию." },
  { id: "sales",      label: "Sales Rep",          type: "agent", scope: "GLOBAL", role: "REVENUE OPS", status: "working", desc: "Ведёт воронку, квалифицирует лиды и закрывает сделки." },
  { id: "dev",        label: "Dev",                type: "agent", scope: "GLOBAL", role: "BUILD SYSTEM", status: "idle", desc: "Проектирует архитектуру и собирает продукт." },
  { id: "data",       label: "Data Analyst",       type: "agent", scope: "GLOBAL", role: "SIGNAL LAYER", status: "idle", desc: "Строит метрики, прогнозы и следит за сигналами." },
];

const TOPICS: { id: string; label: string; agents: string[] }[] = [
  { id: "t_pipeline", label: "Lead Pipeline",   agents: ["sales", "cmo", "ceo"] },
  { id: "t_content",  label: "Content Engine",  agents: ["cmo", "researcher"] },
  { id: "t_research", label: "Research Base",   agents: ["researcher", "data", "ceo"] },
  { id: "t_memory",   label: "Memory Store",    agents: ["ceo", "data"] },
  { id: "t_config",   label: "System Config",   agents: ["dev", "ceo"] },
  { id: "t_signals",  label: "Analytics",       agents: ["data", "sales"] },
];

const CHILD_LABELS: Record<Exclude<NodeType, "agent" | "topic">, string[]> = {
  memory: ["Latest Dry Run", "Stage 4 Looping Prompt", "Qualified Leads", "Meta Memory", "Last Sync Snapshot", "Daily HQ Sync", "Superuser Flow", "Latest", "Working Memory", "Recall Buffer", "Session State", "Context Window", "Stage 2 Draft", "Reflection Note"],
  doc: ["Content Intelligence DB", "Weekly Pipeline Brief", "Stage 3 Research Prompt", "Writing Prompt", "Playbook Base Spec", "Objection Handbook", "ICP Definition", "Brand Guidelines", "Market Map", "Onboarding Doc"],
  artifact: ["Analytics Signal", "Pipeline Config", "Qualified Leads Set", "Forecast v3", "Cohort Export", "Funnel Snapshot", "Content Batch", "Lead Scoring Model"],
  config: ["Server", "Index", "Config", "Router Rules", "Rate Limits", "Vault Keys", "Schema", "Cron Jobs"],
};

function buildGraph() {
  const rnd = mulberry32(42);
  const nodes: RawNode[] = [...AGENTS];
  const edges: { s: string; t: string }[] = [];

  // topics
  for (const tp of TOPICS) {
    nodes.push({ id: tp.id, label: tp.label, type: "topic", scope: "GLOBAL", desc: `Топик-хаб, объединяющий память и документы по теме «${tp.label}».` });
    for (const a of tp.agents) edges.push({ s: tp.id, t: a });
  }
  // agents all report into CEO
  for (const a of AGENTS) if (a.id !== "ceo") edges.push({ s: a.id, t: "ceo" });

  // child nodes (memory / doc / artifact / config)
  const owners = AGENTS.map(a => a.id);
  const topicIds = TOPICS.map(t => t.id);
  let idx = 0;
  (["memory", "doc", "artifact", "config"] as const).forEach(type => {
    for (const label of CHILD_LABELS[type]) {
      const id = `${type}_${idx++}`;
      const owner = owners[Math.floor(rnd() * owners.length)];
      const topic = topicIds[Math.floor(rnd() * topicIds.length)];
      nodes.push({ id, label, type, scope: rnd() > 0.4 ? "LOCAL" : "GLOBAL", desc: `${TYPE_META[type].label} «${label}», принадлежит агенту и связан с топиком.` });
      edges.push({ s: id, t: owner });
      edges.push({ s: id, t: topic });
      // sometimes a second agent link
      if (rnd() > 0.55) edges.push({ s: id, t: owners[Math.floor(rnd() * owners.length)] });
    }
  });

  // densify: extra cross links between memory/doc/artifact nodes
  const linkable = nodes.filter(n => n.type !== "config").map(n => n.id);
  const target = 300;
  let guard = 0;
  while (edges.length < target && guard < 4000) {
    guard++;
    const s = linkable[Math.floor(rnd() * linkable.length)];
    const t = linkable[Math.floor(rnd() * linkable.length)];
    if (s !== t) edges.push({ s, t });
  }

  return { nodes, edges };
}

const GRAPH = buildGraph();

// simulation node
type SimNode = RawNode & { x: number; y: number; vx: number; vy: number; r: number; deg: number };

function sizeFor(type: NodeType, deg: number): number {
  if (type === "agent") return 15 + Math.min(deg, 10) * 0.9;
  if (type === "topic") return 11 + Math.min(deg, 8) * 0.7;
  return 5 + Math.min(deg, 6) * 0.8;
}

export default function MemoriesPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<{ nodes: SimNode[]; edges: { s: number; t: number }[]; index: Record<string, number> } | null>(null);

  const [selected, setSelected] = useState<string | null>("ceo");
  const [hidden, setHidden] = useState<Set<NodeType>>(new Set());
  const [query, setQuery] = useState("");

  const selectedRef = useRef(selected);
  const hiddenRef = useRef(hidden);
  const queryRef = useRef(query);
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { hiddenRef.current = hidden; }, [hidden]);
  useEffect(() => { queryRef.current = query; }, [query]);

  // build sim data once
  const sim = useMemo(() => {
    const deg: Record<string, number> = {};
    GRAPH.edges.forEach(e => { deg[e.s] = (deg[e.s] || 0) + 1; deg[e.t] = (deg[e.t] || 0) + 1; });
    const index: Record<string, number> = {};
    const nodes: SimNode[] = GRAPH.nodes.map((n, i) => {
      index[n.id] = i;
      const a = (i / GRAPH.nodes.length) * Math.PI * 2;
      const rad = 60 + (i % 7) * 26;
      const d = deg[n.id] || 1;
      return { ...n, x: Math.cos(a) * rad, y: Math.sin(a) * rad, vx: 0, vy: 0, r: sizeFor(n.type, d), deg: d };
    });
    const edges = GRAPH.edges.map(e => ({ s: index[e.s], t: index[e.t] })).filter(e => e.s != null && e.t != null);
    return { nodes, edges, index };
  }, []);
  simRef.current = sim;

  const selectedNode = selected ? sim.nodes[sim.index[selected]] : null;

  // neighbor set of selected (memo for panel + mirrored to ref for canvas)
  const neighbors = useMemo(() => {
    const s = new Set<number>();
    if (selected != null) {
      const si = sim.index[selected];
      sim.edges.forEach(e => { if (e.s === si) s.add(e.t); if (e.t === si) s.add(e.s); });
    }
    return s;
  }, [selected, sim]);
  const neighborRef = useRef<Set<number>>(neighbors);
  useEffect(() => { neighborRef.current = neighbors; }, [neighbors]);

  // ── Canvas: force simulation + render ──
  useEffect(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
    const nodes = sim.nodes, edges = sim.edges;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = W * DPR; canvas.height = H * DPR;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let alpha = 1, raf = 0, hoverIdx = -1, dragIdx = -1;
    let downX = 0, downY = 0, moved = false;

    const cx = () => W / 2, cy = () => H / 2;
    const toWorld = (px: number, py: number) => ({ x: px - cx(), y: py - cy() });
    const pick = (px: number, py: number) => {
      const w = toWorld(px, py); let best = -1, bd = 1e9;
      for (let i = 0; i < nodes.length; i++) {
        if (hiddenRef.current.has(nodes[i].type)) continue;
        const dx = nodes[i].x - w.x, dy = nodes[i].y - w.y, d = Math.hypot(dx, dy);
        if (d < nodes[i].r + 6 && d < bd) { bd = d; best = i; }
      }
      return best;
    };

    const step = () => {
      // repulsion
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          let dx = a.x - b.x, dy = a.y - b.y; let d2 = dx * dx + dy * dy;
          if (d2 < 0.01) { d2 = 0.01; dx = Math.random(); }
          const f = (900 * alpha) / d2;
          const d = Math.sqrt(d2);
          const fx = (dx / d) * f, fy = (dy / d) * f;
          a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
        }
      }
      // springs
      for (const e of edges) {
        const a = nodes[e.s], b = nodes[e.t];
        const dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy) || 1;
        const target = a.type === "agent" || b.type === "agent" ? 90 : 62;
        const f = ((d - target) / d) * 0.02 * alpha;
        a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
      }
      // gravity to center + integrate
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (i === dragIdx) { n.vx = 0; n.vy = 0; continue; }
        n.vx += -n.x * 0.0016 * alpha; n.vy += -n.y * 0.0016 * alpha;
        n.vx *= 0.86; n.vy *= 0.86;
        n.x += n.vx; n.y += n.vy;
      }
      if (alpha > 0.04) alpha *= 0.992;
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const ox = cx(), oy = cy();
      const sel = selectedRef.current != null ? sim.index[selectedRef.current] : -1;
      const hi = hoverIdx >= 0 ? hoverIdx : sel;
      const hidden = hiddenRef.current;
      const q = queryRef.current.trim().toLowerCase();

      // edges
      for (const e of edges) {
        const a = nodes[e.s], b = nodes[e.t];
        if (hidden.has(a.type) || hidden.has(b.type)) continue;
        const inc = hi >= 0 && (e.s === hi || e.t === hi);
        ctx.strokeStyle = inc ? "rgba(129,140,248,0.55)" : "rgba(255,255,255,0.05)";
        ctx.lineWidth = inc ? 1.3 : 0.6;
        ctx.beginPath(); ctx.moveTo(ox + a.x, oy + a.y); ctx.lineTo(ox + b.x, oy + b.y); ctx.stroke();
      }
      // nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (hidden.has(n.type)) continue;
        const meta = TYPE_META[n.type];
        const isSel = i === sel, isHi = i === hi || neighborRef.current.has(i);
        const dim = (hi >= 0 && !isHi && i !== hi) || (q && !n.label.toLowerCase().includes(q));
        const x = ox + n.x, y = oy + n.y;
        // glow for agents / selected
        if (n.type === "agent" || isSel) {
          const g = ctx.createRadialGradient(x, y, 0, x, y, n.r * 3);
          g.addColorStop(0, meta.color + (dim ? "18" : "3a")); g.addColorStop(1, meta.color + "00");
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, n.r * 3, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = dim ? 0.28 : 1;
        ctx.fillStyle = meta.color;
        ctx.beginPath(); ctx.arc(x, y, n.r, 0, Math.PI * 2); ctx.fill();
        if (isSel) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke(); }
        else { ctx.strokeStyle = "rgba(255,255,255,0.14)"; ctx.lineWidth = 1; ctx.stroke(); }
        ctx.globalAlpha = 1;
        // labels: agents, topics, selected neighborhood
        const showLabel = n.type === "agent" || n.type === "topic" || isSel || (hi >= 0 && isHi);
        if (showLabel && !dim) {
          ctx.font = `${n.type === "agent" ? 600 : 500} ${n.type === "agent" ? 12 : 10.5}px ui-sans-serif, system-ui`;
          ctx.fillStyle = n.type === "agent" ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.6)";
          ctx.textAlign = "center";
          ctx.fillText(n.label, x, y + n.r + 12);
        }
      }
    };

    const loop = () => { if (!reduce) step(); draw(); raf = requestAnimationFrame(loop); };
    loop();

    // interaction
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      if (dragIdx >= 0) {
        const w = toWorld(px, py); nodes[dragIdx].x = w.x; nodes[dragIdx].y = w.y; alpha = Math.max(alpha, 0.5); moved = true;
        return;
      }
      hoverIdx = pick(px, py);
      canvas.style.cursor = hoverIdx >= 0 ? "pointer" : "default";
    };
    const onDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      downX = px; downY = py; moved = false;
      const hit = pick(px, py);
      if (hit >= 0) { dragIdx = hit; alpha = Math.max(alpha, 0.4); }
    };
    const onUp = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      if (!moved && Math.hypot(px - downX, py - downY) < 5) {
        const hit = pick(px, py);
        setSelected(hit >= 0 ? nodes[hit].id : null);
      }
      dragIdx = -1;
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, [sim]);

  const toggleType = useCallback((t: NodeType) => {
    setHidden(prev => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; });
  }, []);

  const bytesFor = (n: SimNode) => n.type === "agent" ? "0 B" : `${(n.label.length * 1.3 + n.deg * 12).toFixed(0)} KB`;
  const visibleCount = sim.nodes.filter(n => !hidden.has(n.type)).length;

  return (
    <div className="mem-root">
      {/* Center: graph */}
      <div className="mem-main">
        <div className="mem-head">
          <div>
            <h1 className="mem-title">Цветная топология памяти и базы данных</h1>
            <p className="mem-sub">Агенты, память, документы vault, артефакты данных, конфиги и топик-хабы.</p>
          </div>
          <div className="mem-count">{visibleCount} узлов · {sim.edges.length} связей</div>
        </div>

        <div className="mem-canvas-wrap" ref={wrapRef}>
          <canvas ref={canvasRef} />
        </div>

        {/* legend / filters */}
        <div className="mem-legend">
          {(Object.keys(TYPE_META) as NodeType[]).map(t => {
            const off = hidden.has(t);
            return (
              <button key={t} className={`mem-leg${off ? " off" : ""}`} onClick={() => toggleType(t)}>
                <span className="mem-leg-dot" style={{ background: TYPE_META[t].color }} />
                {TYPE_META[t].label}
              </button>
            );
          })}
          <div className="mem-search">
            <Search size={13} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Подсветить узел…" spellCheck={false} />
            {query && <button onClick={() => setQuery("")}><X size={13} /></button>}
          </div>
        </div>
      </div>

      {/* Right: node detail */}
      <aside className="mem-panel">
        <AnimatePresence mode="wait">
          {selectedNode ? (
            <motion.div key={selectedNode.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
              <div className="mem-panel-tags">
                <span className="mem-chip" style={{ color: TYPE_META[selectedNode.type].color, borderColor: `${TYPE_META[selectedNode.type].color}55` }}>
                  <span className="mem-leg-dot" style={{ background: TYPE_META[selectedNode.type].color }} />
                  {TYPE_META[selectedNode.type].label.toUpperCase()}
                </span>
                {selectedNode.role && <span className="mem-chip ghost">{selectedNode.role}</span>}
              </div>
              <h2 className="mem-panel-title">{selectedNode.label}</h2>
              <p className="mem-panel-desc">{selectedNode.desc}</p>

              <div className="mem-tiles">
                <div className="mem-tile"><span className="mem-tile-l">Тип</span><span className="mem-tile-v">{TYPE_META[selectedNode.type].label}</span></div>
                <div className="mem-tile"><span className="mem-tile-l">Область</span><span className="mem-tile-v">{selectedNode.scope}</span></div>
                <div className="mem-tile"><span className="mem-tile-l">Размер</span><span className="mem-tile-v">{bytesFor(selectedNode)}</span></div>
                <div className="mem-tile"><span className="mem-tile-l">Связей</span><span className="mem-tile-v">{selectedNode.deg}</span></div>
              </div>

              <div className="mem-rel-label">Отношения</div>
              <div className="mem-rels">
                {TYPE_META[selectedNode.type].rel.map(r => <span key={r} className="mem-rel">{r}</span>)}
              </div>

              {/* linked nodes */}
              <div className="mem-rel-label" style={{ marginTop: 18 }}>Связанные узлы</div>
              <div className="mem-links">
                {Array.from(neighbors).slice(0, 8).map(i => {
                  const ln = sim.nodes[i];
                  return (
                    <button key={ln.id} className="mem-link" onClick={() => setSelected(ln.id)}>
                      <span className="mem-leg-dot" style={{ background: TYPE_META[ln.type].color }} />
                      <span className="mem-link-t">{ln.label}</span>
                    </button>
                  );
                })}
                {neighbors.size === 0 && <div className="mem-empty-links">Нет связей</div>}
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mem-panel-empty">
              <Database size={26} />
              <p>Выберите узел на карте, чтобы увидеть детали памяти.</p>
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
      .mem-root { background: #05060A; min-height: 100%; display: grid; grid-template-columns: 1fr 320px; gap: 0; }
      .mem-main { min-width: 0; padding: 28px 24px; display: flex; flex-direction: column; }
      .mem-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
      .mem-title { font-size: 21px; font-weight: 800; letter-spacing: -0.02em; color: #E5E7EB; margin: 0 0 5px; }
      .mem-sub { font-size: 13px; color: rgba(255,255,255,0.45); margin: 0; max-width: 60ch; }
      .mem-count { flex-shrink: 0; font-family: var(--font-geist-mono), monospace; font-size: 11px; color: rgba(129,140,248,0.9); background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.25); border-radius: 9px; padding: 6px 11px; white-space: nowrap; }

      .mem-canvas-wrap { position: relative; flex: 1; min-height: 460px; border-radius: 20px; overflow: hidden;
        background: radial-gradient(120% 120% at 50% 45%, rgba(30,32,56,0.35), rgba(5,6,10,0) 62%), rgba(255,255,255,0.015);
        border: 1px solid rgba(255,255,255,0.06); box-shadow: inset 0 1px 0 rgba(255,255,255,0.04); }
      .mem-canvas-wrap canvas { display: block; }

      .mem-legend { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 14px; }
      .mem-leg { display: inline-flex; align-items: center; gap: 7px; font-size: 11.5px; font-weight: 600; color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 9px; padding: 6px 11px; cursor: pointer; transition: all .16s; }
      .mem-leg:hover { background: rgba(255,255,255,0.06); }
      .mem-leg.off { opacity: 0.38; }
      .mem-leg-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
      .mem-search { margin-left: auto; display: flex; align-items: center; gap: 8px; height: 34px; padding: 0 11px; border-radius: 10px; background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.08); }
      .mem-search:focus-within { border-color: rgba(99,102,241,0.5); }
      .mem-search svg { color: rgba(255,255,255,0.4); }
      .mem-search input { width: 150px; background: none; border: none; outline: none; color: #E5E7EB; font-size: 12.5px; }
      .mem-search input::placeholder { color: rgba(255,255,255,0.3); }
      .mem-search button { background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; display: flex; }

      .mem-panel { border-left: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.015); padding: 28px 22px; overflow-y: auto; }
      .mem-panel-tags { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 14px; }
      .mem-chip { display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-geist-mono), monospace; font-size: 9.5px; font-weight: 700; letter-spacing: 0.08em; padding: 4px 9px; border-radius: 7px; border: 1px solid; }
      .mem-chip.ghost { color: rgba(255,255,255,0.45); border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); }
      .mem-panel-title { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: #fff; margin: 0 0 10px; line-height: 1.2; }
      .mem-panel-desc { font-size: 13.5px; line-height: 1.65; color: rgba(255,255,255,0.6); margin: 0 0 20px; }

      .mem-tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px; }
      .mem-tile { display: flex; flex-direction: column; gap: 4px; padding: 11px 13px; border-radius: 11px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); }
      .mem-tile-l { font-family: var(--font-geist-mono), monospace; font-size: 9px; letter-spacing: 0.1em; color: rgba(255,255,255,0.35); text-transform: uppercase; }
      .mem-tile-v { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.85); }

      .mem-rel-label { font-family: var(--font-geist-mono), monospace; font-size: 9.5px; letter-spacing: 0.12em; color: rgba(255,255,255,0.35); text-transform: uppercase; margin-bottom: 10px; }
      .mem-rels { display: flex; flex-wrap: wrap; gap: 6px; }
      .mem-rel { font-family: var(--font-geist-mono), monospace; font-size: 9.5px; font-weight: 600; color: rgba(255,255,255,0.55); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 6px; padding: 4px 8px; }

      .mem-links { display: flex; flex-direction: column; gap: 6px; }
      .mem-link { display: flex; align-items: center; gap: 9px; padding: 9px 11px; border-radius: 10px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); cursor: pointer; transition: all .15s; text-align: left; }
      .mem-link:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12); }
      .mem-link-t { font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,0.78); }
      .mem-empty-links { font-size: 12px; color: rgba(255,255,255,0.3); }

      .mem-panel-empty { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; padding-top: 60px; color: rgba(255,255,255,0.35); }
      .mem-panel-empty p { font-size: 13px; line-height: 1.6; margin: 0; max-width: 24ch; }

      @media (max-width: 900px) {
        .mem-root { grid-template-columns: 1fr; }
        .mem-panel { border-left: none; border-top: 1px solid rgba(255,255,255,0.06); }
      }
    `}</style>
  );
}
