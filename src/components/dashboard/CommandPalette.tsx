"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, CornerDownLeft, LayoutGrid, FolderKanban, FileText,
  Users, Bot, Settings, LifeBuoy, Sparkles, Zap, Command,
  TrendingUp, Brain, MessageSquare, Database, BookOpen,
} from "lucide-react";

type CmdItem = {
  id: string;
  label: string;
  hint: string;
  href: string;
  kind: "Страница" | "Действие" | "Агент";
  icon: typeof LayoutGrid;
  keywords: string;
  color?: string;
};

const ITEMS: CmdItem[] = [
  { id: "dash",    label: "Dashboard",             hint: "Главная панель",              href: "/dashboard",            kind: "Страница", icon: LayoutGrid,    keywords: "главная home overview" },
  { id: "new",     label: "Новая стратегия",       hint: "Запустить AI-анализ",         href: "/dashboard/new",        kind: "Действие", icon: Zap,           keywords: "создать анализ идея new strategy запустить", color: "#818cf8" },
  { id: "proj",    label: "Мои проекты",           hint: "Портфель стратегий",          href: "/dashboard/projects",   kind: "Страница", icon: FolderKanban,  keywords: "projects портфель" },
  { id: "rep",     label: "Отчёты",                hint: "AI-отчёты и PDF",             href: "/dashboard/reports",    kind: "Страница", icon: FileText,      keywords: "reports pdf отчёт" },
  { id: "exec",    label: "Исполнительный совет",  hint: "20 AI-директоров",            href: "/dashboard/executives", kind: "Страница", icon: Users,         keywords: "совет директора board ceo cfo cmo" },
  { id: "chat",    label: "AI Чат",                hint: "Чат с агентами",              href: "/dashboard/chat",       kind: "Страница", icon: MessageSquare, keywords: "чат chat спросить" },
  { id: "agents",  label: "AI Агенты",             hint: "Команда из 20 агентов",       href: "/dashboard/agents",     kind: "Страница", icon: Bot,           keywords: "agents команда team агенты" },
  { id: "vault",   label: "Knowledge Vault",       hint: "База знаний",                 href: "/dashboard/vault",      kind: "Страница", icon: Database,      keywords: "vault база знаний documents", color: "#818cf8" },
  { id: "note",    label: "Блокнот",               hint: "Заметки",                     href: "/dashboard/notepad",    kind: "Страница", icon: BookOpen,      keywords: "блокнот note заметки" },
  { id: "sett",    label: "Настройки",             hint: "Аккаунт и подписка",          href: "/dashboard/settings",   kind: "Страница", icon: Settings,      keywords: "settings профиль подписка аккаунт" },
  { id: "supp",    label: "Поддержка",             hint: "Помощь и тикеты",             href: "/dashboard/support",    kind: "Страница", icon: LifeBuoy,      keywords: "support помощь тикет" },
  { id: "a-ceo",   label: "Спросить CEO",          hint: "Sophia Rivers · Стратегия",   href: "/dashboard/executives", kind: "Агент",    icon: Brain,         keywords: "ceo sophia стратегия", color: "#818cf8" },
  { id: "a-cfo",   label: "Спросить CFO",          hint: "Marcus Chen · Финансы",       href: "/dashboard/executives", kind: "Агент",    icon: TrendingUp,    keywords: "cfo marcus финансы деньги", color: "#3b82f6" },
  { id: "a-cmo",   label: "Спросить CMO",          hint: "Elena Torres · Маркетинг",    href: "/dashboard/executives", kind: "Агент",    icon: Sparkles,      keywords: "cmo elena маркетинг рост", color: "#10b981" },
  { id: "a-cto",   label: "Спросить CTO",          hint: "Aiden Park · Технологии",     href: "/dashboard/executives", kind: "Агент",    icon: Bot,           keywords: "cto aiden технологии продукт", color: "#a855f7" },
];

const KIND_COLORS: Record<string, string> = {
  "Страница": "rgba(255,255,255,0.25)",
  "Действие": "#a5b4fc",
  "Агент":    "#34d399",
};

const EASE = [0.22, 1, 0.36, 1] as const;

export function CommandPalette() {
  const [open, setOpen]     = useState(false);
  const [query, setQuery]   = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);
  const router   = useRouter();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ITEMS;
    return ITEMS.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.hint.toLowerCase().includes(q) ||
      item.keywords.includes(q)
    );
  }, [query]);

  useEffect(() => { setActive(0); }, [query]);

  // Global ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(v => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (item: CmdItem) => {
    setOpen(false);
    router.push(item.href);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (results[active]) go(results[active]); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  // Group by kind for empty query
  const grouped = useMemo(() => {
    if (query.trim()) return null;
    const g: Record<string, CmdItem[]> = {};
    ITEMS.forEach(item => { (g[item.kind] ||= []).push(item); });
    return g;
  }, [query]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 2000,
              background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
            }}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.22, ease: EASE }}
            style={{
              position: "fixed", left: "50%", top: "14vh",
              transform: "translateX(-50%)",
              zIndex: 2001,
              width: "min(560px, calc(100vw - 24px))",
              background: "rgba(10,11,18,0.98)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 18,
              boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
              backdropFilter: "blur(24px)",
              overflow: "hidden",
            }}
          >
            {/* Search bar */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
              <Search size={16} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={onKey}
                placeholder="Поиск команд, страниц, агентов…"
                style={{
                  flex: 1, background: "none", border: "none", outline: "none",
                  fontSize: 15, color: "rgba(255,255,255,0.85)",
                }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Command size={10} color="rgba(255,255,255,0.3)" />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>K</span>
              </div>
            </div>

            {/* Results */}
            <div ref={listRef} style={{ maxHeight: "min(420px, 60vh)", overflowY: "auto", padding: "8px 6px" }}>
              {results.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                  Ничего не найдено по «{query}»
                </div>
              ) : grouped ? (
                // Grouped view (empty query)
                Object.entries(grouped).map(([kind, items]) => (
                  <div key={kind}>
                    <div style={{ padding: "10px 12px 5px", fontSize: 9.5, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                      {kind}
                    </div>
                    {items.map(item => {
                      const idx = ITEMS.indexOf(item);
                      return <PaletteRow key={item.id} item={item} selected={idx === active} onHover={() => setActive(idx)} onClick={() => go(item)} />;
                    })}
                  </div>
                ))
              ) : (
                results.map((item, i) => (
                  <PaletteRow key={item.id} item={item} selected={i === active} onHover={() => setActive(i)} onClick={() => go(item)} />
                ))
              )}
            </div>

            {/* Footer shortcuts */}
            <div style={{
              display: "flex", gap: 16, padding: "8px 16px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              fontSize: 10, color: "rgba(255,255,255,0.22)",
              fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            }}>
              <span>↑↓ навигация</span>
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}><CornerDownLeft size={9} /> открыть</span>
              <span>esc закрыть</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function PaletteRow({ item, selected, onHover, onClick }: { item: CmdItem; selected: boolean; onHover: () => void; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      onMouseEnter={onHover}
      onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "9px 10px", borderRadius: 10, cursor: "pointer",
        background: selected ? "rgba(124,58,237,0.12)" : "transparent",
        border: `1px solid ${selected ? "rgba(124,58,237,0.25)" : "transparent"}`,
        textAlign: "left", transition: "all 0.1s",
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: selected ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}>
        <Icon size={14} style={{ color: selected ? (item.color ?? "#a5b4fc") : "rgba(255,255,255,0.4)" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: selected ? "#e5e7eb" : "rgba(255,255,255,0.7)", marginBottom: 1 }}>{item.label}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{item.hint}</div>
      </div>
      <span style={{ fontSize: 9, fontWeight: 700, color: KIND_COLORS[item.kind], flexShrink: 0, letterSpacing: "0.06em" }}>{item.kind}</span>
      {selected && <CornerDownLeft size={12} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />}
    </button>
  );
}
