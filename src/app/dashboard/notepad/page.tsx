"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Star, Clock, Folder, Tag, Pin, Trash2,
  Archive, Users, Bot, FileText, ChevronRight, MoreHorizontal,
  Bold, Italic, Underline, List, ListOrdered, CheckSquare,
  Code, Quote, Minus, Link, Image, Paperclip, Smile,
  Share2, Download, Printer, Copy, Sparkles, Brain,
  PenTool, Languages, LayoutList, BarChart2, Target,
  Lightbulb, Bookmark, Eye, AlignLeft, Type, Heading1,
  Heading2, Hash, X, Check, ChevronDown, Mic, Video,
  Table, Columns, RotateCcw, RotateCw, Save, ExternalLink,
  Calendar, User, Globe, Zap, Crown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Note {
  id: string;
  title: string;
  content: string;
  emoji: string;
  folder: string;
  tags: string[];
  color: string;
  pinned: boolean;
  starred: boolean;
  wordCount: number;
  createdAt: number;
  updatedAt: number;
  template?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "apex-notepad-v3";

const FOLDERS = [
  { id: "all",      label: "Все заметки",  icon: FileText, count: 0 },
  { id: "starred",  label: "Избранное",    icon: Star,     count: 0 },
  { id: "recent",   label: "Недавние",     icon: Clock,    count: 0 },
  { id: "pinned",   label: "Закреплённые", icon: Pin,      count: 0 },
  { id: "shared",   label: "Общие",        icon: Users,    count: 0 },
  { id: "ai",       label: "AI Notes",     icon: Bot,      count: 0 },
  { id: "archive",  label: "Архив",        icon: Archive,  count: 0 },
  { id: "trash",    label: "Корзина",      icon: Trash2,   count: 0 },
];

const CUSTOM_FOLDERS = ["Стратегия", "Финансы", "Маркетинг", "Продукт", "Команда"];

const TAGS = [
  { label: "Срочно",    color: "#ef4444" },
  { label: "Важное",    color: "#f59e0b" },
  { label: "Идеи",      color: "#6366f1" },
  { label: "Решения",   color: "#10b981" },
  { label: "Задачи",    color: "#4f46e5" },
  { label: "Встречи",   color: "#8b5cf6" },
];

const TEMPLATES: { id: string; icon: string; name: string; content: string }[] = [
  { id: "meeting",  icon: "📄", name: "Meeting Notes",    content: "# Встреча\n\n**Дата:** \n**Участники:** \n**Повестка:**\n\n## Обсуждение\n\n## Решения\n\n## Следующие шаги\n\n- [ ] \n- [ ] \n" },
  { id: "brain",    icon: "💡", name: "Brainstorm",       content: "# Брейншторм\n\n**Тема:** \n**Цель:** \n\n## Идеи\n\n- \n- \n- \n\n## Лучшие идеи\n\n## Следующие шаги\n" },
  { id: "biz",      icon: "📊", name: "Business Plan",    content: "# Бизнес-план\n\n## Executive Summary\n\n## Продукт / Услуга\n\n## Рынок\n\n## Конкуренты\n\n## Финансовая модель\n\n## Команда\n\n## Риски\n" },
  { id: "okr",      icon: "🎯", name: "OKR",              content: "# OKR\n\n**Период:** Q_ 2026\n\n## Objective 1\n\n**Key Results:**\n- [ ] KR1: \n- [ ] KR2: \n- [ ] KR3: \n\n## Objective 2\n\n**Key Results:**\n- [ ] KR1: \n" },
  { id: "strategy", icon: "📈", name: "Strategy",         content: "# Стратегия\n\n## Видение\n\n## Миссия\n\n## SWOT-анализ\n\n### Сильные стороны\n### Слабые стороны\n### Возможности\n### Угрозы\n\n## Приоритеты\n" },
  { id: "todo",     icon: "📋", name: "To-do",            content: "# Задачи\n\n## Сегодня\n\n- [ ] \n- [ ] \n\n## На неделе\n\n- [ ] \n- [ ] \n\n## В будущем\n\n- [ ] \n" },
  { id: "daily",    icon: "📝", name: "Daily Notes",      content: "# Заметки дня\n\n**Дата:** \n\n## Утренние приоритеты\n\n- [ ] \n\n## Заметки встреч\n\n## Идеи дня\n\n## Итоги\n" },
  { id: "startup",  icon: "🚀", name: "Startup Canvas",   content: "# Startup Canvas\n\n## Проблема\n\n## Решение\n\n## Уникальная ценность\n\n## Целевая аудитория\n\n## Каналы\n\n## Метрики\n\n## Структура затрат\n\n## Источники дохода\n" },
  { id: "finance",  icon: "💰", name: "Финансовый план",  content: "# Финансовый план\n\n## Выручка\n\n| Месяц | Прогноз | Факт |\n|-------|---------|------|\n| Янв   |         |      |\n\n## Расходы\n\n## P&L\n\n## Cash Flow\n" },
  { id: "research", icon: "📚", name: "Исследование",     content: "# Исследование\n\n**Тема:** \n**Дата:** \n\n## Цель\n\n## Методология\n\n## Ключевые находки\n\n## Выводы\n\n## Рекомендации\n\n## Источники\n\n- \n" },
];


// ─── Helpers ──────────────────────────────────────────────────────────────────

const load = (): Note[] => {
  if (typeof window === "undefined") return [];
  try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
};
const save = (n: Note[]) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(n)); } catch {} };

// ─── API ⇄ local mapping ────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapFromApi = (r: any): Note => ({
  id: String(r.id),
  title: r.title ?? "Без названия",
  content: r.content ?? "",
  emoji: r.emoji ?? "📝",
  folder: r.folder ?? "all",
  tags: Array.isArray(r.tags) ? r.tags : [],
  color: r.color ?? "#6366f1",
  pinned: !!r.is_pinned,
  starred: !!r.is_starred,
  wordCount: r.word_count ?? 0,
  createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
  updatedAt: r.updated_at ? new Date(r.updated_at).getTime() : Date.now(),
});

const api = {
  list: () => fetch("/api/notepad?limit=100").then(r => r.json()),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: (n: Partial<Note>) => fetch("/api/notepad", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: n.title, content: n.content, emoji: n.emoji, tags: n.tags, folder: n.folder, is_pinned: n.pinned }),
  }).then(r => r.json()),
  update: (id: string, patch: Partial<Note>) => fetch(`/api/notepad/${id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: patch.title, content: patch.content, emoji: patch.emoji, tags: patch.tags, folder: patch.folder, is_pinned: patch.pinned }),
  }).then(r => r.json()).catch(() => null),
  remove: (id: string) => fetch(`/api/notepad/${id}`, { method: "DELETE" }).catch(() => null),
};

const wordCount = (t: string) => t.split(/\s+/).filter(Boolean).length;
const readTime = (wc: number) => Math.max(1, Math.ceil(wc / 200));
const fmt = (ts: number) => new Date(ts).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

// ─── AI Actions ───────────────────────────────────────────────────────────────

const AI_ACTIONS = [
  { icon: Sparkles, label: "Суммаризировать",  color: "#6366f1" },
  { icon: Brain,    label: "Ключевые идеи",    color: "#4f46e5" },
  { icon: PenTool,  label: "Переписать текст", color: "#10b981" },
  { icon: Check,    label: "Исправить ошибки", color: "#10b981" },
  { icon: Languages,label: "Перевести",        color: "#f59e0b" },
  { icon: LayoutList,label: "Создать план",    color: "#ef4444" },
  { icon: BarChart2,label: "Сделать отчёт",   color: "#4f46e5" },
  { icon: Target,   label: "Выделить задачи",  color: "#f59e0b" },
  { icon: Lightbulb,label: "Предложить идеи",  color: "#8b5cf6" },
  { icon: Bookmark, label: "Создать резюме",   color: "#6366f1" },
];

const TOOLBAR = [
  { icon: Bold,         tip: "Жирный",     mark: "**" },
  { icon: Italic,       tip: "Курсив",     mark: "_" },
  { icon: Underline,    tip: "Подчёрк.",   mark: "__" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function NotepadPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [active, setActive] = useState<Note | null>(null);
  const [folder, setFolder] = useState("all");
  const [search, setSearch] = useState("");
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [saved, setSaved] = useState(true);
  const [rightPanel, setRightPanel] = useState(true);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const apiMode = useRef(false);

  useEffect(() => {
    // Start from localStorage cache for instant paint, then reconcile with the server
    const cached = load();
    setNotes(cached);
    setActive(cached[0] ?? null);

    api.list()
      .then(res => {
        if (res?.success && Array.isArray(res.data)) {
          apiMode.current = true;
          if (res.data.length > 0) {
            const mapped = res.data.map(mapFromApi);
            setNotes(mapped);
            setActive(mapped[0] ?? null);
            save(mapped);
          }
        }
      })
      .catch(() => { /* offline — stay on localStorage */ });
  }, []);

  const persistNotes = useCallback((next: Note[]) => {
    setNotes(next);
    save(next);
  }, []);

  const updateActive = useCallback((patch: Partial<Note>) => {
    if (!active) return;
    const wc = patch.content !== undefined ? wordCount(patch.content) : active.wordCount;
    const updated = { ...active, ...patch, wordCount: wc, updatedAt: Date.now() };
    setActive(updated);
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      persistNotes(notes.map(n => n.id === updated.id ? updated : n));
      setSaved(true);
      if (apiMode.current) api.update(updated.id, updated);
    }, 800);
  }, [active, notes, persistNotes]);

  const createNote = (template?: typeof TEMPLATES[0]) => {
    const n: Note = {
      id: Date.now().toString(),
      title: template ? template.name : "Без названия",
      content: template ? template.content : "",
      emoji: template ? template.icon : "📝",
      folder: "all",
      tags: [],
      color: "#6366f1",
      pinned: false,
      starred: false,
      wordCount: template ? wordCount(template.content) : 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      template: template?.id,
    };
    setNotes(prev => { const next = [n, ...prev]; save(next); return next; });
    setActive(n);
    setShowTemplates(false);
    // Make sure the new note is actually visible — drop any active filter/search.
    setFolder("all");
    setSidebarSearch("");
    setSearch("");

    // Persist to server and swap the temporary id for the real one
    if (apiMode.current) {
      api.create(n).then(res => {
        if (res?.success && res.data) {
          const real = mapFromApi(res.data);
          setNotes(prev => {
            const swapped = prev.map(x => x.id === n.id ? real : x);
            save(swapped);
            return swapped;
          });
          setActive(prev => prev?.id === n.id ? real : prev);
        }
      });
    }
  };

  const deleteNote = (id: string) => {
    const next = notes.filter(n => n.id !== id);
    persistNotes(next);
    setActive(next[0] ?? null);
    if (apiMode.current) api.remove(id);
  };

  const toggleStar = (id: string) => {
    persistNotes(notes.map(n => n.id === id ? { ...n, starred: !n.starred } : n));
  };
  const togglePin  = (id: string) => {
    const target = notes.find(n => n.id === id);
    persistNotes(notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
    if (apiMode.current && target) api.update(id, { pinned: !target.pinned });
  };

  // Реальный AI: стримим ответ через /api/chat/direct; при офлайне — краткий фолбэк
  const runAI = async (action: string) => {
    if (!active || aiLoading) return;
    setAiLoading(true);
    setAiResult("");
    const tasks: Record<string, string> = {
      "Суммаризировать": "Сделай краткое резюме заметки в 3–4 предложениях.",
      "Ключевые идеи":   "Выдели 4–6 ключевых идей списком.",
      "Выделить задачи": "Извлеки конкретные задачи в виде чек-листа - [ ] с приоритетами.",
      "Предложить идеи": "Предложи 4–5 дополнительных идей, развивающих заметку.",
      "Создать резюме":  "Составь executive summary для руководства: контекст, выводы, следующие шаги.",
    };
    const persona = "Ты — AI-редактор заметок в Vertlix. Отвечай по-русски, кратко и структурно, используй markdown.";
    const message = `${tasks[action] ?? action}\n\nЗаметка «${active.title}»:\n\n${active.content.slice(0, 6000)}`;
    try {
      const res = await fetch("/api/chat/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, agentId: "notepad-ai", persona, history: [] }),
      });
      if (!res.ok || !res.body) throw new Error("offline");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "", acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          try {
            const ev = JSON.parse(line.slice(5).trim());
            if (ev.type === "token") { acc += ev.token; setAiResult(acc); }
          } catch { /* ignore */ }
        }
      }
      if (!acc.trim()) setAiResult("Пустой ответ. Попробуйте ещё раз.");
    } catch {
      setAiResult(`**${action}: ${active.title}**\n\nДемо-режим (AI недоступен). Заметка: ${active.wordCount} слов, ~${readTime(active.wordCount)} мин чтения. Настройте ANTHROPIC_API_KEY для живого анализа.`);
    } finally {
      setAiLoading(false);
    }
  };

  const filtered = notes.filter(n => {
    const matchSearch = !sidebarSearch || n.title.toLowerCase().includes(sidebarSearch.toLowerCase()) || n.content.toLowerCase().includes(sidebarSearch.toLowerCase());
    if (folder === "starred") return n.starred && matchSearch;
    if (folder === "pinned")  return n.pinned && matchSearch;
    if (folder === "ai")      return n.template && matchSearch;
    if (folder === "recent")  return matchSearch;
    return matchSearch;
  }).sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });

  const COLORS = ["#6366f1","#4f46e5","#10b981","#ef4444","#f59e0b","#8b5cf6"];

  return (
    <div style={{ height: "100vh", display: "flex", background: "#05060A", overflow: "hidden" }}>

      {/* ── LEFT NAV ── */}
      <div style={{ width: 230, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ padding: "14px 12px 10px" }}>
          <button onClick={() => setShowTemplates(true)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 11, fontSize: 12, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff", cursor: "pointer", marginBottom: 10, boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}>
            <Plus size={13} />Новая заметка
          </button>
          <div style={{ position: "relative" }}>
            <Search size={11} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", pointerEvents: "none" }} />
            <input value={sidebarSearch} onChange={e => setSidebarSearch(e.target.value)} placeholder="Поиск заметок..."
              style={{ width: "100%", padding: "7px 10px 7px 28px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 11, outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
          {/* System folders */}
          <div style={{ marginBottom: 12 }}>
            {FOLDERS.map(f => (
              <button key={f.id} onClick={() => setFolder(f.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", borderRadius: 9, fontSize: 12, fontWeight: folder === f.id ? 700 : 500, border: `1px solid ${folder === f.id ? "rgba(99,102,241,0.25)" : "transparent"}`, background: folder === f.id ? "rgba(99,102,241,0.1)" : "transparent", color: folder === f.id ? "#fff" : "rgba(255,255,255,0.38)", cursor: "pointer", textAlign: "left", marginBottom: 1, transition: "all 0.15s" }}>
                <f.icon size={12} style={{ color: folder === f.id ? "#6366f1" : "rgba(255,255,255,0.22)", flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{f.label}</span>
                {f.id === "all" && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{notes.length}</span>}
              </button>
            ))}
          </div>

          {/* Custom folders */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", padding: "0 6px", marginBottom: 5 }}>Папки</div>
            {CUSTOM_FOLDERS.map(f => (
              <button key={f} onClick={() => setFolder(f)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", borderRadius: 9, fontSize: 12, fontWeight: 500, border: "1px solid transparent", background: "transparent", color: folder === f ? "#fff" : "rgba(255,255,255,0.38)", cursor: "pointer", textAlign: "left", marginBottom: 1, transition: "all 0.15s" }}>
                <Folder size={11} style={{ color: folder === f ? "#6366f1" : "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{f}</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.18)" }}>{notes.filter(n => n.folder === f).length}</span>
              </button>
            ))}
          </div>

          {/* Tags */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", padding: "0 6px", marginBottom: 5 }}>Теги</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, padding: "0 6px" }}>
              {TAGS.map(t => (
                <button key={t.label} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, border: `1px solid ${t.color}30`, background: `${t.color}12`, color: t.color, fontWeight: 600, cursor: "pointer" }}>{t.label}</button>
              ))}
            </div>
          </div>

          {/* Note list */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", padding: "0 6px", marginBottom: 6 }}>Заметки ({filtered.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {filtered.map(n => (
                <button key={n.id} onClick={() => setActive(n)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 10, border: `1px solid ${active?.id === n.id ? n.color + "30" : "transparent"}`, background: active?.id === n.id ? `${n.color}10` : "transparent", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                  onMouseEnter={e => { if (active?.id !== n.id) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.035)"; }}
                  onMouseLeave={e => { if (active?.id !== n.id) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                    <span style={{ fontSize: 14 }}>{n.emoji}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: active?.id === n.id ? "#fff" : "rgba(255,255,255,0.65)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{n.title}</span>
                    {n.pinned && <Pin size={9} style={{ color: "#f59e0b", flexShrink: 0 }} />}
                    {n.starred && <Star size={9} style={{ color: "#f59e0b", flexShrink: 0 }} />}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {n.content.replace(/[#*\-\[\]`]/g,"").substring(0,50)}
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.18)", marginTop: 3 }}>{fmt(n.updatedAt)}</div>
                </button>
              ))}
            </div>
          </div>
        </nav>
      </div>

      {/* ── EDITOR ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        {active ? (
          <>
            {/* Doc Toolbar */}
            <div style={{ padding: "11px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              {/* Breadcrumb — terminal path */}
              <div className="term-mono" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.28)", letterSpacing: "0.03em" }}>
                <span>notepad</span>
                <span style={{ color: "rgba(99,102,241,0.5)" }}>/</span>
                <span>{active.folder || "все"}</span>
                <span style={{ color: "rgba(99,102,241,0.5)" }}>/</span>
                <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{active.title}</span>
              </div>

              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                {/* Save status */}
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: saved ? "#10b981" : "#f59e0b" }}>
                  {saved ? <Check size={10} /> : <Save size={10} />}
                  {saved ? "Сохранено" : "Сохранение..."}
                </div>

                <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />

                {[
                  { icon: RotateCcw, tip: "Undo" },
                  { icon: RotateCw,  tip: "Redo" },
                ].map(b => (
                  <button key={b.tip} title={b.tip} style={{ width: 28, height: 28, borderRadius: 7, background: "transparent", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.35)" }}>
                    <b.icon size={12} />
                  </button>
                ))}

                <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />

                <button onClick={() => setShowAI(!showAI)}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: "1px solid rgba(99,102,241,0.3)", background: showAI ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)", color: "#8b5cf6", cursor: "pointer" }}>
                  <Sparkles size={11} />AI
                </button>
                <button onClick={() => setRightPanel(!rightPanel)}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.07)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                  <Columns size={11} />
                </button>
                <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.07)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                  <Share2 size={11} />Поделиться
                </button>
                <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.07)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                  <Download size={11} />PDF
                </button>
              </div>
            </div>

            {/* Format Bar */}
            <div style={{ padding: "7px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 4, flexShrink: 0, background: "rgba(255,255,255,0.01)" }}>
              {[
                { icon: Heading1,    tip: "H1" },
                { icon: Heading2,    tip: "H2" },
                { icon: Type,        tip: "Текст" },
              ].map(b => (
                <button key={b.tip} title={b.tip} style={{ padding: "4px 8px", borderRadius: 6, background: "transparent", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700 }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
                  <b.icon size={14} />
                </button>
              ))}
              <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.08)", margin: "0 2px" }} />
              {[
                { icon: Bold,         tip: "Жирный" },
                { icon: Italic,       tip: "Курсив" },
                { icon: Underline,    tip: "Подчёрк." },
                { icon: Code,         tip: "Код" },
              ].map(b => (
                <button key={b.tip} title={b.tip} style={{ width: 26, height: 26, borderRadius: 6, background: "transparent", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
                  <b.icon size={13} />
                </button>
              ))}
              <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.08)", margin: "0 2px" }} />
              {[
                { icon: List,         tip: "Список" },
                { icon: ListOrdered,  tip: "Нумер." },
                { icon: CheckSquare,  tip: "Чеклист" },
                { icon: Quote,        tip: "Цитата" },
                { icon: Table,        tip: "Таблица" },
              ].map(b => (
                <button key={b.tip} title={b.tip} style={{ width: 26, height: 26, borderRadius: 6, background: "transparent", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
                  <b.icon size={13} />
                </button>
              ))}
              <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.08)", margin: "0 2px" }} />
              {[
                { icon: Link,         tip: "Ссылка" },
                { icon: Image,        tip: "Изображение" },
                { icon: Paperclip,    tip: "Файл" },
                { icon: Minus,        tip: "Разделитель" },
              ].map(b => (
                <button key={b.tip} title={b.tip} style={{ width: 26, height: 26, borderRadius: 6, background: "transparent", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
                  <b.icon size={13} />
                </button>
              ))}

              {/* Color dots */}
              <div style={{ marginLeft: "auto", display: "flex", gap: 5, alignItems: "center" }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => updateActive({ color: c })}
                    style={{ width: 14, height: 14, borderRadius: "50%", background: c, border: active.color === c ? `2px solid #fff` : "2px solid transparent", cursor: "pointer", flexShrink: 0 }} />
                ))}
              </div>
            </div>

            {/* AI Panel */}
            <AnimatePresence>
              {showAI && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", flexShrink: 0 }}>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(99,102,241,0.15)", background: "rgba(99,102,241,0.04)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#8b5cf6", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                      <Sparkles size={12} />AI Ассистент
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: aiResult ? 12 : 0 }}>
                      {AI_ACTIONS.map(a => (
                        <button key={a.label} onClick={() => runAI(a.label)} disabled={aiLoading}
                          style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: `1px solid ${a.color}25`, background: `${a.color}0d`, color: a.color, cursor: "pointer", opacity: aiLoading ? 0.5 : 1 }}>
                          <a.icon size={11} />{a.label}
                        </button>
                      ))}
                    </div>
                    {aiLoading && (
                      <div style={{ display: "flex", gap: 5, alignItems: "center", marginTop: 8 }}>
                        {[0,1,2].map(i => (
                          <motion.div key={i} animate={{ opacity: [0.3,1,0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i*0.3 }}
                            style={{ width: 5, height: 5, borderRadius: "50%", background: "#6366f1" }} />
                        ))}
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginLeft: 4 }}>AI обрабатывает...</span>
                      </div>
                    )}
                    {aiResult && (
                      <div style={{ marginTop: 8, padding: "12px 14px", borderRadius: 10, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{aiResult}</div>
                        {!aiLoading && (
                          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                            <button onClick={() => { updateActive({ content: `${active.content}\n\n---\n\n${aiResult}` }); setAiResult(""); }}
                              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff", cursor: "pointer" }}>
                              <Plus size={11} /> Вставить в заметку
                            </button>
                            <button onClick={() => { navigator.clipboard?.writeText(aiResult).catch(() => {}); }}
                              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>
                              <Copy size={11} /> Копировать
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Title */}
            <div style={{ padding: "28px 60px 10px", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                <button style={{ fontSize: 28, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>{active.emoji}</button>
                <input value={active.title} onChange={e => updateActive({ title: e.target.value })}
                  style={{ flex: 1, background: "transparent", border: "none", color: "#fff", fontSize: 26, fontWeight: 900, outline: "none", letterSpacing: "-0.5px" }}
                  placeholder="Без названия" />
                <button onClick={() => toggleStar(active.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: active.starred ? "#f59e0b" : "rgba(255,255,255,0.2)" }}>
                  <Star size={16} />
                </button>
                <button onClick={() => togglePin(active.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: active.pinned ? "#f59e0b" : "rgba(255,255,255,0.2)" }}>
                  <Pin size={14} />
                </button>
                <button onClick={() => deleteNote(active.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.2)" }}>
                  <Trash2 size={14} />
                </button>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {active.tags.map(t => {
                  const tag = TAGS.find(tg => tg.label === t);
                  return <span key={t} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: `${tag?.color ?? "#6366f1"}18`, color: tag?.color ?? "#6366f1", fontWeight: 700, border: `1px solid ${tag?.color ?? "#6366f1"}25` }}>{t}</span>;
                })}
                <button onClick={() => setShowTagMenu(!showTagMenu)} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}>
                  + тег
                </button>
                {showTagMenu && (
                  <div style={{ position: "absolute", zIndex: 50, background: "#14161d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 8, display: "flex", flexWrap: "wrap", gap: 5, maxWidth: 200 }}>
                    {TAGS.map(t => (
                      <button key={t.label} onClick={() => { updateActive({ tags: active.tags.includes(t.label) ? active.tags.filter(x=>x!==t.label) : [...active.tags, t.label] }); setShowTagMenu(false); }}
                        style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: `${t.color}18`, color: t.color, border: `1px solid ${t.color}30`, cursor: "pointer", fontWeight: 700 }}>{t.label}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Editor textarea */}
            <div style={{ flex: 1, overflow: "hidden", padding: "8px 60px 24px" }}>
              <textarea ref={editorRef} value={active.content} onChange={e => updateActive({ content: e.target.value })}
                placeholder="Начните писать... Используйте # для заголовков, - для списков, [ ] для задач"
                style={{ width: "100%", height: "100%", background: "transparent", border: "none", color: "rgba(255,255,255,0.82)", fontSize: 14, lineHeight: 1.85, outline: "none", resize: "none", fontFamily: "'Inter', monospace", boxSizing: "border-box" }} />
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={26} style={{ color: "#6366f1" }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>Выберите заметку</div>
            <button onClick={() => setShowTemplates(true)}
              style={{ padding: "10px 20px", borderRadius: 11, fontSize: 13, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff", cursor: "pointer" }}>
              Создать заметку
            </button>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL ── */}
      <AnimatePresence>
        {active && rightPanel && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 240, opacity: 1 }} exit={{ width: 0, opacity: 0 }} style={{ flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.05)", overflowY: "auto", overflowX: "hidden" }}>
            <div style={{ width: 240, padding: "16px 16px 24px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Свойства</div>

              {[
                { icon: User,     label: "Автор",          val: "Founder" },
                { icon: Calendar, label: "Создано",         val: fmt(active.createdAt) },
                { icon: Clock,    label: "Изменено",        val: fmt(active.updatedAt) },
                { icon: Folder,   label: "Папка",           val: active.folder || "Все заметки" },
                { icon: Hash,     label: "Слов",            val: active.wordCount.toString() },
                { icon: Eye,      label: "Время чтения",    val: `${readTime(active.wordCount)} мин` },
              ].map(p => (
                <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
                  <p.icon size={12} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", flex: 1 }}>{p.label}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{p.val}</span>
                </div>
              ))}

              <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "14px 0" }} />

              {/* AI Summary */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>AI Summary</div>
                <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.14)", fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                  {active.content.length > 20
                    ? `Документ «${active.title}» содержит ${active.wordCount} слов. Читается за ${readTime(active.wordCount)} мин.`
                    : "Начните писать, чтобы получить AI-резюме"}
                </div>
              </div>

              {/* Actions */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Действия</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {[
                    { icon: Copy,      label: "Дублировать" },
                    { icon: Share2,    label: "Поделиться" },
                    { icon: Download,  label: "Экспорт PDF" },
                    { icon: Printer,   label: "Печать" },
                    { icon: Archive,   label: "Архивировать" },
                  ].map(a => (
                    <button key={a.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, fontSize: 11, fontWeight: 500, border: "1px solid rgba(255,255,255,0.06)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", textAlign: "left" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.4)"; }}>
                      <a.icon size={11} />{a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* History */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>История</div>
                {[
                  { time: "Сейчас",      user: "Вы" },
                  { time: "2 часа назад",user: "Вы" },
                  { time: "Вчера",       user: "Вы" },
                ].map((h, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, padding: "5px 8px", borderRadius: 7, background: "rgba(255,255,255,0.02)" }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: "linear-gradient(135deg, #6366f1, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff" }}>F</div>
                    <div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{h.user}</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.22)" }}>{h.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TEMPLATES MODAL ── */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={e => e.target === e.currentTarget && setShowTemplates(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ width: "100%", maxWidth: 680, borderRadius: 22, background: "#0d0f14", border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #6366f180, transparent)" }} />
              <div style={{ padding: "22px 28px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Шаблоны</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>Начните с готового шаблона</div>
                </div>
                <button onClick={() => setShowTemplates(false)} style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <X size={13} style={{ color: "rgba(255,255,255,0.5)" }} />
                </button>
              </div>
              <div style={{ padding: "18px 28px 24px" }}>
                <button onClick={() => createNote()}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, border: "1px dashed rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.05)", color: "#8b5cf6", cursor: "pointer", marginBottom: 16, fontSize: 13, fontWeight: 700 }}>
                  <Plus size={16} />Пустая заметка
                </button>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                  {TEMPLATES.map(t => (
                    <motion.button key={t.id} onClick={() => createNote(t)} whileHover={{ scale: 1.03 }}
                      style={{ borderRadius: 14, padding: "16px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer", textAlign: "center" }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>{t.icon}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{t.name}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
