"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Search, X, Pin, Trash2, Plus, Check } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;
const STORAGE_KEY = "apex-memories-v1";

// ─── Категории памяти ─────────────────────────────────────────────────────────
type Category = "idea" | "fact" | "decision" | "task" | "note";
const CATS: Record<Category, { label: string; color: string }> = {
  idea:     { label: "Идея",     color: "#8b5cf6" },
  fact:     { label: "Факт",     color: "#3b82f6" },
  decision: { label: "Решение",  color: "#10b981" },
  task:     { label: "Задача",   color: "#f59e0b" },
  note:     { label: "Заметка",  color: "#94a3b8" },
};
const CAT_KEYS = Object.keys(CATS) as Category[];

type Memory = { id: string; text: string; cat: Category; tags: string[]; createdAt: number; pinned: boolean };

const SEED: Memory[] = [
  { id: "s1", text: "AI-компания как сервис: фаундер нанимает не одного бота, а целую команду C-level.", cat: "idea", tags: ["видение"], createdAt: Date.now() - 86400000 * 4, pinned: true },
  { id: "s2", text: "Дизайн-система: enterprise dark, индиго-акцент, hairline-рамки. Никакого неона.", cat: "decision", tags: ["design"], createdAt: Date.now() - 86400000 * 3, pinned: false },
  { id: "s3", text: "Конкуренты (ChatGPT, Notion AI, Devin) дают ОДНОГО агента. Наш разрыв — продаём «команду».", cat: "fact", tags: ["рынок"], createdAt: Date.now() - 86400000 * 2, pinned: false },
  { id: "s4", text: "Собрать Command Center: CEO планирует → отделы работают параллельно → синтез результата.", cat: "task", tags: ["mvp"], createdAt: Date.now() - 3600000 * 5, pinned: false },
];

function timeAgo(ts: number): string {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return "только что";
  if (s < 3600) return `${Math.floor(s / 60)} мин назад`;
  if (s < 86400) return `${Math.floor(s / 3600)} ч назад`;
  if (s < 172800) return "вчера";
  return new Date(ts).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftCat, setDraftCat] = useState<Category>("idea");
  const [draftTags, setDraftTags] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Category | "all">("all");
  const [justSaved, setJustSaved] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // load once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setMemories(raw ? JSON.parse(raw) : SEED);
    } catch { setMemories(SEED); }
    setLoaded(true);
  }, []);

  // persist
  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
  }, [memories, loaded]);

  const save = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    const tags = draftTags.split(",").map(t => t.trim().replace(/^#/, "")).filter(Boolean);
    const mem: Memory = { id: `m${Date.now()}`, text, cat: draftCat, tags, createdAt: Date.now(), pinned: false };
    setMemories(prev => [mem, ...prev]);
    setDraft(""); setDraftTags("");
    setJustSaved(true); setTimeout(() => setJustSaved(false), 1400);
    taRef.current?.focus();
  }, [draft, draftCat, draftTags]);

  const remove = (id: string) => setMemories(prev => prev.filter(m => m.id !== id));
  const togglePin = (id: string) => setMemories(prev => prev.map(m => m.id === id ? { ...m, pinned: !m.pinned } : m));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return memories
      .filter(m => (filter === "all" || m.cat === filter))
      .filter(m => !q || m.text.toLowerCase().includes(q) || m.tags.some(t => t.toLowerCase().includes(q)))
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt);
  }, [memories, query, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    memories.forEach(m => { c[m.cat] = (c[m.cat] || 0) + 1; });
    return c;
  }, [memories]);

  return (
    <div className="mem-root">
      <div className="mem-wrap">
        {/* Header */}
        <header className="mem-head">
          <div className="mem-eyebrow"><Brain size={13} strokeWidth={2} /> ПАМЯТЬ AI-КОМПАНИИ</div>
          <h1 className="mem-title">Мемрис</h1>
          <p className="mem-sub">Долговременная память вашей команды. Всё, что вы запишете, сохраняется навсегда и доступно агентам в любой момент — они это помнят.</p>
        </header>

        {/* Composer */}
        <div className="mem-composer">
          <textarea
            ref={taRef}
            className="mem-ta"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); save(); } }}
            placeholder="Что запомнить? Идея, факт, решение, задача…"
            rows={3}
            spellCheck={false}
          />
          <div className="mem-composer-row">
            <div className="mem-cat-pick">
              {CAT_KEYS.map(k => (
                <button key={k} className={`mem-cat-btn${draftCat === k ? " on" : ""}`} onClick={() => setDraftCat(k)}
                  style={draftCat === k ? { background: `${CATS[k].color}22`, borderColor: `${CATS[k].color}66`, color: CATS[k].color } : undefined}>
                  <span className="mem-dot" style={{ background: CATS[k].color }} />{CATS[k].label}
                </button>
              ))}
            </div>
            <input className="mem-tags-in" value={draftTags} onChange={e => setDraftTags(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") save(); }} placeholder="теги через запятую" spellCheck={false} />
            <button className="mem-save" onClick={save} disabled={!draft.trim()}>
              {justSaved ? <><Check size={15} /> Запомнил</> : <><Plus size={15} /> Запомнить</>}
            </button>
          </div>
          <div className="mem-hint">
            <kbd>⌘</kbd><kbd>↵</kbd> сохранить · хранится локально в вашем браузере
          </div>
        </div>

        {/* Stats + filters */}
        <div className="mem-bar">
          <div className="mem-filters">
            <button className={`mem-fil${filter === "all" ? " on" : ""}`} onClick={() => setFilter("all")}>
              Все <span className="mem-fil-n">{memories.length}</span>
            </button>
            {CAT_KEYS.map(k => (
              <button key={k} className={`mem-fil${filter === k ? " on" : ""}`} onClick={() => setFilter(filter === k ? "all" : k)}
                style={filter === k ? { borderColor: `${CATS[k].color}66`, color: CATS[k].color } : undefined}>
                <span className="mem-dot" style={{ background: CATS[k].color }} />{CATS[k].label}
                <span className="mem-fil-n">{counts[k] || 0}</span>
              </button>
            ))}
          </div>
          <div className="mem-search">
            <Search size={14} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск в памяти…" spellCheck={false} />
            {query && <button onClick={() => setQuery("")} aria-label="Очистить"><X size={13} /></button>}
          </div>
        </div>

        {/* Memories */}
        <div className="mem-grid">
          <AnimatePresence mode="popLayout">
            {filtered.map((m, i) => (
              <motion.div key={m.id} layout className="mem-card"
                initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.28, ease: EASE, delay: Math.min(i * 0.02, 0.2) }}
                style={{ borderColor: `${CATS[m.cat].color}22` }}>
                <span className="mem-card-spine" style={{ background: CATS[m.cat].color }} />
                <div className="mem-card-top">
                  <span className="mem-cat-chip" style={{ background: `${CATS[m.cat].color}1e`, color: CATS[m.cat].color }}>
                    <span className="mem-dot" style={{ background: CATS[m.cat].color }} />{CATS[m.cat].label}
                  </span>
                  <div className="mem-card-actions">
                    <button className={`mem-act${m.pinned ? " on" : ""}`} onClick={() => togglePin(m.id)} title={m.pinned ? "Открепить" : "Закрепить"}>
                      <Pin size={13} fill={m.pinned ? "currentColor" : "none"} />
                    </button>
                    <button className="mem-act danger" onClick={() => remove(m.id)} title="Удалить"><Trash2 size={13} /></button>
                  </div>
                </div>
                <p className="mem-card-text">{m.text}</p>
                <div className="mem-card-foot">
                  <div className="mem-card-tags">{m.tags.map(t => <span key={t} className="mem-tag">#{t}</span>)}</div>
                  <span className="mem-card-time">{timeAgo(m.createdAt)}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loaded && filtered.length === 0 && (
            <div className="mem-empty">
              <Brain size={26} />
              <p>{memories.length === 0 ? "Память пуста. Запишите первую мысль выше — она сохранится навсегда." : "Ничего не найдено. Смени фильтр или запрос."}</p>
            </div>
          )}
        </div>
      </div>
      <MemStyles />
    </div>
  );
}

function MemStyles() {
  return (
    <style jsx global>{`
      .mem-root { background: #05060A; min-height: 100%; }
      .mem-wrap { max-width: 880px; margin: 0 auto; padding: 38px 24px 72px; }

      .mem-head { margin-bottom: 24px; }
      .mem-eyebrow { display: inline-flex; align-items: center; gap: 7px; font-family: var(--font-geist-mono), monospace; font-size: 10.5px; letter-spacing: 0.14em; color: rgba(129,140,248,0.85); margin-bottom: 12px; }
      .mem-title { font-size: 34px; font-weight: 800; letter-spacing: -0.03em; color: #E5E7EB; margin: 0 0 10px; }
      .mem-sub { font-size: 14.5px; line-height: 1.65; color: rgba(255,255,255,0.52); max-width: 66ch; margin: 0; }

      /* Composer */
      .mem-composer { border-radius: 18px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 16px; margin-bottom: 26px; box-shadow: 0 1px 2px rgba(0,0,0,0.4), 0 12px 40px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.05); }
      .mem-ta { width: 100%; resize: none; background: none; border: none; outline: none; color: #E5E7EB; font-size: 15px; line-height: 1.6; font-family: inherit; }
      .mem-ta::placeholder { color: rgba(255,255,255,0.3); }
      .mem-composer-row { display: flex; align-items: center; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
      .mem-cat-pick { display: flex; gap: 6px; flex-wrap: wrap; }
      .mem-cat-btn { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.55); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 9px; padding: 6px 10px; cursor: pointer; transition: all .15s; }
      .mem-cat-btn:hover { background: rgba(255,255,255,0.07); }
      .mem-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
      .mem-tags-in { flex: 1; min-width: 120px; height: 34px; background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.08); border-radius: 9px; padding: 0 11px; color: #E5E7EB; font-size: 12.5px; outline: none; transition: border-color .15s; }
      .mem-tags-in:focus { border-color: rgba(99,102,241,0.5); }
      .mem-tags-in::placeholder { color: rgba(255,255,255,0.3); }
      .mem-save { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 16px; border-radius: 10px; border: none; cursor: pointer; font-size: 12.5px; font-weight: 700; color: #fff; background: linear-gradient(135deg, #6366f1, #4f46e5); box-shadow: inset 0 1px 0 rgba(255,255,255,0.18); transition: transform .15s, opacity .15s; }
      .mem-save:hover:not(:disabled) { transform: translateY(-1px); }
      .mem-save:disabled { opacity: 0.45; cursor: not-allowed; }
      .mem-hint { display: flex; align-items: center; gap: 6px; margin-top: 12px; font-size: 11px; color: rgba(255,255,255,0.32); }
      .mem-hint kbd { font-family: var(--font-geist-mono), monospace; font-size: 10px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.09); border-radius: 4px; padding: 1px 5px; color: rgba(255,255,255,0.5); }

      /* Bar */
      .mem-bar { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 18px; flex-wrap: wrap; }
      .mem-filters { display: flex; gap: 7px; flex-wrap: wrap; }
      .mem-fil { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.55); background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 9px; padding: 6px 11px; cursor: pointer; transition: all .15s; }
      .mem-fil:hover { background: rgba(255,255,255,0.06); }
      .mem-fil.on { background: rgba(99,102,241,0.12); border-color: rgba(99,102,241,0.35); color: #a5b4fc; }
      .mem-fil-n { font-family: var(--font-geist-mono), monospace; font-size: 10px; opacity: 0.6; }
      .mem-search { display: flex; align-items: center; gap: 8px; height: 34px; padding: 0 11px; border-radius: 10px; background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.08); }
      .mem-search:focus-within { border-color: rgba(99,102,241,0.5); }
      .mem-search svg { color: rgba(255,255,255,0.4); }
      .mem-search input { width: 150px; background: none; border: none; outline: none; color: #E5E7EB; font-size: 12.5px; }
      .mem-search input::placeholder { color: rgba(255,255,255,0.3); }
      .mem-search button { background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; display: flex; }

      /* Cards */
      .mem-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
      .mem-card { position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 12px; padding: 15px 15px 13px 18px; border-radius: 15px; background: rgba(255,255,255,0.028); border: 1px solid rgba(255,255,255,0.07); box-shadow: 0 1px 2px rgba(0,0,0,0.3); transition: background .2s, box-shadow .2s; }
      .mem-card:hover { background: rgba(255,255,255,0.05); box-shadow: 0 1px 2px rgba(0,0,0,0.4), 0 12px 34px rgba(0,0,0,0.28); }
      .mem-card-spine { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; opacity: 0.85; }
      .mem-card-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      .mem-cat-chip { display: inline-flex; align-items: center; gap: 6px; font-size: 10.5px; font-weight: 700; padding: 3px 9px; border-radius: 7px; }
      .mem-card-actions { display: flex; gap: 3px; opacity: 0; transition: opacity .15s; }
      .mem-card:hover .mem-card-actions { opacity: 1; }
      .mem-act { width: 26px; height: 26px; border-radius: 7px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.5); cursor: pointer; transition: all .15s; }
      .mem-act:hover { background: rgba(255,255,255,0.09); color: rgba(255,255,255,0.85); }
      .mem-act.on { color: #818cf8; border-color: rgba(99,102,241,0.4); background: rgba(99,102,241,0.12); opacity: 1; }
      .mem-card:has(.mem-act.on) .mem-card-actions { opacity: 1; }
      .mem-act.danger:hover { color: #f87171; border-color: rgba(248,113,113,0.3); background: rgba(248,113,113,0.1); }
      .mem-card-text { font-size: 13.5px; line-height: 1.6; color: rgba(255,255,255,0.82); margin: 0; }
      .mem-card-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; }
      .mem-card-tags { display: flex; flex-wrap: wrap; gap: 5px; }
      .mem-tag { font-family: var(--font-geist-mono), monospace; font-size: 10px; color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.05); border-radius: 6px; padding: 2px 6px; }
      .mem-card-time { font-size: 11px; color: rgba(255,255,255,0.3); white-space: nowrap; flex-shrink: 0; }

      .mem-empty { grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; padding: 56px 0; color: rgba(255,255,255,0.35); }
      .mem-empty p { font-size: 13.5px; line-height: 1.6; margin: 0; max-width: 40ch; }

      @media (max-width: 560px) {
        .mem-title { font-size: 27px; }
        .mem-grid { grid-template-columns: 1fr; }
        .mem-composer-row { flex-direction: column; align-items: stretch; }
        .mem-save { justify-content: center; }
      }
      @media (prefers-reduced-motion: reduce) { .mem-card { transition: none; } }
    `}</style>
  );
}
