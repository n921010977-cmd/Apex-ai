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
  { id: "all",      label: "All Notes",  icon: FileText, count: 0 },
  { id: "starred",  label: "Starred",    icon: Star,     count: 0 },
  { id: "recent",   label: "Recent",     icon: Clock,    count: 0 },
  { id: "pinned",   label: "Pinned", icon: Pin,      count: 0 },
  { id: "shared",   label: "Shared",        icon: Users,    count: 0 },
  { id: "ai",       label: "AI Notes",     icon: Bot,      count: 0 },
  { id: "archive",  label: "Archive",        icon: Archive,  count: 0 },
  { id: "trash",    label: "Trash",      icon: Trash2,   count: 0 },
];

const CUSTOM_FOLDERS = ["Strategy", "Finance", "Marketing", "Product", "Team"];

const TAGS = [
  { label: "Urgent",    color: "#ef4444" },
  { label: "Important",    color: "#f59e0b" },
  { label: "Ideas",      color: "#7C3AED" },
  { label: "Decisions",   color: "#10b981" },
  { label: "Tasks",    color: "#6D28D9" },
  { label: "Meetings",   color: "#D946EF" },
];

const TEMPLATES: { id: string; icon: string; name: string; content: string }[] = [
  { id: "meeting",  icon: "📄", name: "Meeting Notes",    content: "# Meeting\n\n**Date:** \n**Attendees:** \n**Agenda:**\n\n## Discussion\n\n## Decisions\n\n## Next Steps\n\n- [ ] \n- [ ] \n" },
  { id: "brain",    icon: "💡", name: "Brainstorm",       content: "# Brainstorm\n\n**Topic:** \n**Goal:** \n\n## Ideas\n\n- \n- \n- \n\n## Best Ideas\n\n## Next Steps\n" },
  { id: "biz",      icon: "📊", name: "Business Plan",    content: "# Business Plan\n\n## Executive Summary\n\n## Product / Service\n\n## Market\n\n## Competitors\n\n## Financial Model\n\n## Team\n\n## Risks\n" },
  { id: "okr",      icon: "🎯", name: "OKR",              content: "# OKR\n\n**Period:** Q_ 2026\n\n## Objective 1\n\n**Key Results:**\n- [ ] KR1: \n- [ ] KR2: \n- [ ] KR3: \n\n## Objective 2\n\n**Key Results:**\n- [ ] KR1: \n" },
  { id: "strategy", icon: "📈", name: "Strategy",         content: "# Strategy\n\n## Vision\n\n## Mission\n\n## SWOT Analysis\n\n### Strengths\n### Weaknesses\n### Opportunities\n### Threats\n\n## Priorities\n" },
  { id: "todo",     icon: "📋", name: "To-do",            content: "# Tasks\n\n## Today\n\n- [ ] \n- [ ] \n\n## This Week\n\n- [ ] \n- [ ] \n\n## Later\n\n- [ ] \n" },
  { id: "daily",    icon: "📝", name: "Daily Notes",      content: "# Daily Notes\n\n**Date:** \n\n## Morning Priorities\n\n- [ ] \n\n## Meeting Notes\n\n## Ideas of the Day\n\n## Summary\n" },
  { id: "startup",  icon: "🚀", name: "Startup Canvas",   content: "# Startup Canvas\n\n## Problem\n\n## Solution\n\n## Unique Value\n\n## Target Audience\n\n## Channels\n\n## Metrics\n\n## Cost Structure\n\n## Revenue Streams\n" },
  { id: "finance",  icon: "💰", name: "Financial Plan",  content: "# Financial Plan\n\n## Revenue\n\n| Month | Forecast | Actual |\n|-------|---------|------|\n| Jan   |         |      |\n\n## Expenses\n\n## P&L\n\n## Cash Flow\n" },
  { id: "research", icon: "📚", name: "Research",     content: "# Research\n\n**Topic:** \n**Date:** \n\n## Goal\n\n## Methodology\n\n## Key Findings\n\n## Conclusions\n\n## Recommendations\n\n## Sources\n\n- \n" },
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
  title: r.title ?? "Untitled",
  content: r.content ?? "",
  emoji: r.emoji ?? "📝",
  folder: r.folder ?? "all",
  tags: Array.isArray(r.tags) ? r.tags : [],
  color: r.color ?? "#7C3AED",
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
const fmt = (ts: number) => new Date(ts).toLocaleDateString("en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

// ─── AI Actions ───────────────────────────────────────────────────────────────

const AI_ACTIONS = [
  { icon: Sparkles, label: "Summarize",  color: "#7C3AED" },
  { icon: Brain,    label: "Key Ideas",    color: "#6D28D9" },
  { icon: PenTool,  label: "Rewrite Text", color: "#10b981" },
  { icon: Check,    label: "Fix Errors", color: "#10b981" },
  { icon: Languages,label: "Translate",        color: "#f59e0b" },
  { icon: LayoutList,label: "Create Plan",    color: "#ef4444" },
  { icon: BarChart2,label: "Make Report",   color: "#6D28D9" },
  { icon: Target,   label: "Extract Tasks",  color: "#f59e0b" },
  { icon: Lightbulb,label: "Suggest Ideas",  color: "#D946EF" },
  { icon: Bookmark, label: "Create Summary",   color: "#7C3AED" },
];

const TOOLBAR = [
  { icon: Bold,         tip: "Bold",     mark: "**" },
  { icon: Italic,       tip: "Italic",     mark: "_" },
  { icon: Underline,    tip: "Underline",   mark: "__" },
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
      title: template ? template.name : "Untitled",
      content: template ? template.content : "",
      emoji: template ? template.icon : "📝",
      folder: "all",
      tags: [],
      color: "#7C3AED",
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
      "Summarize": "Write a brief summary of the note in 3–4 sentences.",
      "Key Ideas":   "Extract 4–6 key ideas as a list.",
      "Extract Tasks": "Extract concrete tasks as a checklist - [ ] with priorities.",
      "Suggest Ideas": "Suggest 4–5 additional ideas expanding on the note.",
      "Create Summary":  "Write an executive summary for leadership: context, conclusions, next steps.",
    };
    const persona = "You are an AI notes editor at Vertlix. Reply in English, concisely and with structure, using markdown.";
    // Сервер принимает вопрос не длиннее 1000 символов — обрезаем фрагмент
    // заметки так, чтобы задание + заголовок + текст уложились в лимит.
    const head = `${tasks[action] ?? action}\n\nNote "${active.title.slice(0, 80)}":\n\n`;
    const message = head + active.content.slice(0, Math.max(0, 990 - head.length));
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
      if (!acc.trim()) setAiResult("Empty response. Please try again.");
    } catch {
      setAiResult(`**${action}: ${active.title}**\n\nDemo mode (AI unavailable). Note: ${active.wordCount} words, ~${readTime(active.wordCount)} min read. Configure ANTHROPIC_API_KEY for live analysis.`);
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

  const COLORS = ["#7C3AED","#6D28D9","#10b981","#ef4444","#f59e0b","#D946EF"];

  return (
    <div style={{ height: "100vh", display: "flex", background: "#05060A", overflow: "hidden" }}>

      {/* ── LEFT NAV ── */}
      <div style={{ width: 230, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ padding: "14px 12px 10px" }}>
          <button onClick={() => setShowTemplates(true)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 11, fontSize: 12, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #7C3AED, #6D28D9)", color: "#fff", cursor: "pointer", marginBottom: 10, boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}>
            <Plus size={13} />New Note
          </button>
          <div style={{ position: "relative" }}>
            <Search size={11} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", pointerEvents: "none" }} />
            <input value={sidebarSearch} onChange={e => setSidebarSearch(e.target.value)} placeholder="Search notes..."
              style={{ width: "100%", padding: "7px 10px 7px 28px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 11, outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
          {/* System folders */}
          <div style={{ marginBottom: 12 }}>
            {FOLDERS.map(f => (
              <button key={f.id} onClick={() => setFolder(f.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", borderRadius: 9, fontSize: 12, fontWeight: folder === f.id ? 700 : 500, border: `1px solid ${folder === f.id ? "rgba(124,58,237,0.25)" : "transparent"}`, background: folder === f.id ? "rgba(124,58,237,0.1)" : "transparent", color: folder === f.id ? "#fff" : "rgba(255,255,255,0.38)", cursor: "pointer", textAlign: "left", marginBottom: 1, transition: "all 0.15s" }}>
                <f.icon size={12} style={{ color: folder === f.id ? "#7C3AED" : "rgba(255,255,255,0.22)", flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{f.label}</span>
                {f.id === "all" && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{notes.length}</span>}
              </button>
            ))}
          </div>

          {/* Custom folders */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", padding: "0 6px", marginBottom: 5 }}>Folders</div>
            {CUSTOM_FOLDERS.map(f => (
              <button key={f} onClick={() => setFolder(f)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", borderRadius: 9, fontSize: 12, fontWeight: 500, border: "1px solid transparent", background: "transparent", color: folder === f ? "#fff" : "rgba(255,255,255,0.38)", cursor: "pointer", textAlign: "left", marginBottom: 1, transition: "all 0.15s" }}>
                <Folder size={11} style={{ color: folder === f ? "#7C3AED" : "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{f}</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.18)" }}>{notes.filter(n => n.folder === f).length}</span>
              </button>
            ))}
          </div>

          {/* Tags */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", padding: "0 6px", marginBottom: 5 }}>Tags</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, padding: "0 6px" }}>
              {TAGS.map(t => (
                <button key={t.label} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, border: `1px solid ${t.color}30`, background: `${t.color}12`, color: t.color, fontWeight: 600, cursor: "pointer" }}>{t.label}</button>
              ))}
            </div>
          </div>

          {/* Note list */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", padding: "0 6px", marginBottom: 6 }}>Notes ({filtered.length})</div>
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
                <span style={{ color: "rgba(124,58,237,0.5)" }}>/</span>
                <span>{active.folder || "all"}</span>
                <span style={{ color: "rgba(124,58,237,0.5)" }}>/</span>
                <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{active.title}</span>
              </div>

              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                {/* Save status */}
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: saved ? "#10b981" : "#f59e0b" }}>
                  {saved ? <Check size={10} /> : <Save size={10} />}
                  {saved ? "Saved" : "Saving..."}
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
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: "1px solid rgba(124,58,237,0.3)", background: showAI ? "rgba(124,58,237,0.15)" : "rgba(124,58,237,0.08)", color: "#D946EF", cursor: "pointer" }}>
                  <Sparkles size={11} />AI
                </button>
                <button onClick={() => setRightPanel(!rightPanel)}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.07)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                  <Columns size={11} />
                </button>
                <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.07)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                  <Share2 size={11} />Share
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
                { icon: Type,        tip: "Text" },
              ].map(b => (
                <button key={b.tip} title={b.tip} style={{ padding: "4px 8px", borderRadius: 6, background: "transparent", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700 }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
                  <b.icon size={14} />
                </button>
              ))}
              <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.08)", margin: "0 2px" }} />
              {[
                { icon: Bold,         tip: "Bold" },
                { icon: Italic,       tip: "Italic" },
                { icon: Underline,    tip: "Underline" },
                { icon: Code,         tip: "Code" },
              ].map(b => (
                <button key={b.tip} title={b.tip} style={{ width: 26, height: 26, borderRadius: 6, background: "transparent", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
                  <b.icon size={13} />
                </button>
              ))}
              <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.08)", margin: "0 2px" }} />
              {[
                { icon: List,         tip: "List" },
                { icon: ListOrdered,  tip: "Numbered" },
                { icon: CheckSquare,  tip: "Checklist" },
                { icon: Quote,        tip: "Quote" },
                { icon: Table,        tip: "Table" },
              ].map(b => (
                <button key={b.tip} title={b.tip} style={{ width: 26, height: 26, borderRadius: 6, background: "transparent", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
                  <b.icon size={13} />
                </button>
              ))}
              <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.08)", margin: "0 2px" }} />
              {[
                { icon: Link,         tip: "Link" },
                { icon: Image,        tip: "Image" },
                { icon: Paperclip,    tip: "File" },
                { icon: Minus,        tip: "Divider" },
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
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(124,58,237,0.15)", background: "rgba(124,58,237,0.04)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#D946EF", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                      <Sparkles size={12} />AI Assistant
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
                            style={{ width: 5, height: 5, borderRadius: "50%", background: "#7C3AED" }} />
                        ))}
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginLeft: 4 }}>AI is processing...</span>
                      </div>
                    )}
                    {aiResult && (
                      <div style={{ marginTop: 8, padding: "12px 14px", borderRadius: 10, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)" }}>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{aiResult}</div>
                        {!aiLoading && (
                          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                            <button onClick={() => { updateActive({ content: `${active.content}\n\n---\n\n${aiResult}` }); setAiResult(""); }}
                              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #7C3AED, #6D28D9)", color: "#fff", cursor: "pointer" }}>
                              <Plus size={11} /> Insert into Note
                            </button>
                            <button onClick={() => { navigator.clipboard?.writeText(aiResult).catch(() => {}); }}
                              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>
                              <Copy size={11} /> Copy
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
                  placeholder="Untitled" />
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
                  return <span key={t} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: `${tag?.color ?? "#7C3AED"}18`, color: tag?.color ?? "#7C3AED", fontWeight: 700, border: `1px solid ${tag?.color ?? "#7C3AED"}25` }}>{t}</span>;
                })}
                <button onClick={() => setShowTagMenu(!showTagMenu)} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}>
                  + tag
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
                placeholder="Start writing... Use # for headings, - for lists, [ ] for tasks"
                style={{ width: "100%", height: "100%", background: "transparent", border: "none", color: "rgba(255,255,255,0.82)", fontSize: 14, lineHeight: 1.85, outline: "none", resize: "none", fontFamily: "'Inter', monospace", boxSizing: "border-box" }} />
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={26} style={{ color: "#7C3AED" }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>Select a Note</div>
            <button onClick={() => setShowTemplates(true)}
              style={{ padding: "10px 20px", borderRadius: 11, fontSize: 13, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #7C3AED, #6D28D9)", color: "#fff", cursor: "pointer" }}>
              Create Note
            </button>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL ── */}
      <AnimatePresence>
        {active && rightPanel && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 240, opacity: 1 }} exit={{ width: 0, opacity: 0 }} style={{ flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.05)", overflowY: "auto", overflowX: "hidden" }}>
            <div style={{ width: 240, padding: "16px 16px 24px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Properties</div>

              {[
                { icon: User,     label: "Author",          val: "Founder" },
                { icon: Calendar, label: "Created",         val: fmt(active.createdAt) },
                { icon: Clock,    label: "Modified",        val: fmt(active.updatedAt) },
                { icon: Folder,   label: "Folder",           val: active.folder || "All Notes" },
                { icon: Hash,     label: "Words",            val: active.wordCount.toString() },
                { icon: Eye,      label: "Read Time",    val: `${readTime(active.wordCount)} min` },
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
                <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.14)", fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                  {active.content.length > 20
                    ? `The document "${active.title}" contains ${active.wordCount} words. Reads in ${readTime(active.wordCount)} min.`
                    : "Start writing to get an AI summary"}
                </div>
              </div>

              {/* Actions */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Actions</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {[
                    { icon: Copy,      label: "Duplicate" },
                    { icon: Share2,    label: "Share" },
                    { icon: Download,  label: "Export PDF" },
                    { icon: Printer,   label: "Print" },
                    { icon: Archive,   label: "Archive" },
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
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>History</div>
                {[
                  { time: "Just now",      user: "You" },
                  { time: "2 hours ago",user: "You" },
                  { time: "Yesterday",       user: "You" },
                ].map((h, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, padding: "5px 8px", borderRadius: 7, background: "rgba(255,255,255,0.02)" }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: "linear-gradient(135deg, #7C3AED, #6D28D9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff" }}>F</div>
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
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #7C3AED80, transparent)" }} />
              <div style={{ padding: "22px 28px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Templates</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>Start from a ready-made template</div>
                </div>
                <button onClick={() => setShowTemplates(false)} style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <X size={13} style={{ color: "rgba(255,255,255,0.5)" }} />
                </button>
              </div>
              <div style={{ padding: "18px 28px 24px" }}>
                <button onClick={() => createNote()}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, border: "1px dashed rgba(124,58,237,0.3)", background: "rgba(124,58,237,0.05)", color: "#D946EF", cursor: "pointer", marginBottom: 16, fontSize: 13, fontWeight: 700 }}>
                  <Plus size={16} />Blank Note
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
