"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Search, Bell, Plus, Cpu, Menu, X, Command } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard":            "Dashboard",
  "/dashboard/new":        "Новая стратегия",
  "/dashboard/projects":   "Мои проекты",
  "/dashboard/reports":    "Отчёты",
  "/dashboard/executives": "Исполнительный совет",
  "/dashboard/analytics":  "Аналитика",
  "/dashboard/growth":     "Рост & Рынок",
  "/dashboard/risks":      "Риски",
  "/dashboard/chat":       "AI Чат",
  "/dashboard/agents":     "AI Агенты",
  "/dashboard/notepad":    "Блокнот",
  "/dashboard/settings":   "Настройки",
  "/dashboard/support":    "Поддержка",
};

const NOTIFICATIONS = [
  { title: "Стратегический анализ готов", desc: "AI Fitness Platform — 94 балла", time: "2ч",   dot: "#10b981", read: false },
  { title: "Новый конкурент обнаружен",   desc: "Sector: B2B SaaS · Funding: $12M", time: "5ч",  dot: "#f59e0b", read: false },
  { title: "Финансовая модель обновлена", desc: "SaaS Invoice Platform — Q2 прогноз", time: "Вчера", dot: "#6366f1", read: true },
];

interface TopNavProps {
  onMenuClick?: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const pathname    = usePathname();
  const [focused,   setFocused]   = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [allRead,   setAllRead]   = useState(false);
  const [query,     setQuery]     = useState("");
  const notifRef    = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  const pageLabel = Object.entries(ROUTE_LABELS).find(([k]) =>
    k === pathname || pathname.startsWith(k + "/")
  )?.[1] ?? "Dashboard";

  const unread = allRead ? 0 : NOTIFICATIONS.filter(n => !n.read).length;

  // Close notif dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Global keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <header
      className="flex-shrink-0 flex items-center gap-3 px-4"
      style={{
        height:       "58px",
        background:   "rgba(5,6,10,0.88)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        position:     "sticky",
        top:          0,
        zIndex:       20,
        paddingLeft:  "max(16px, env(safe-area-inset-left))",
        paddingRight: "max(16px, env(safe-area-inset-right))",
      }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden size-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
        style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        aria-label="Открыть меню"
      >
        <Menu size={16} />
      </button>

      {/* Breadcrumb — hidden on small mobile */}
      <div className="hidden sm:flex items-center gap-2 flex-shrink-0" style={{ fontSize: 12, color: "rgba(255,255,255,0.28)" }}>
        <Cpu size={13} style={{ color: "rgba(99,102,241,0.7)" }} />
        <span>Apex AI</span>
        <span style={{ color: "rgba(255,255,255,0.14)" }}>›</span>
        <span style={{ color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>{pageLabel}</span>
      </div>

      {/* Mobile page title */}
      <span
        className="sm:hidden font-semibold truncate flex-1"
        style={{ fontSize: 14, color: "rgba(255,255,255,0.85)" }}
      >
        {pageLabel}
      </span>

      {/* Search — expands on focus */}
      <div
        className="hidden md:block relative flex-1 max-w-xs transition-all duration-300"
        style={{ maxWidth: focused ? 400 : 280 }}
      >
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "rgba(255,255,255,0.22)" }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Поиск проектов, агентов…"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full focus:outline-none transition-all"
          style={{
            height:       34,
            background:   focused ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.03)",
            border:       `1px solid ${focused ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.06)"}`,
            borderRadius: 10,
            paddingLeft:  32,
            paddingRight: 44,
            fontSize:     12,
            color:        "rgba(255,255,255,0.78)",
            boxShadow:    focused ? "0 0 0 3px rgba(99,102,241,0.08)" : "none",
          }}
        />
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5"
          style={{ fontSize: 9, color: "rgba(255,255,255,0.18)" }}
        >
          <Command size={9} />
          <span>K</span>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 ml-auto">
        {/* New Strategy button */}
        <Link
          href="/dashboard/new"
          className="hidden sm:flex items-center gap-1.5 font-semibold text-white transition-all hover:-translate-y-px active:translate-y-0"
          style={{
            height:       32,
            padding:      "0 14px",
            borderRadius: 10,
            fontSize:     12,
            background:   "linear-gradient(135deg, #6366f1, #4f46e5)",
            boxShadow:    "0 4px 14px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.14)",
            whiteSpace:   "nowrap",
          }}
        >
          <Plus size={12} strokeWidth={2.5} />
          Новая
        </Link>

        {/* AI status */}
        <div
          className="hidden lg:flex items-center gap-1.5 px-2.5 h-8 rounded-lg flex-shrink-0"
          style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.12)" }}
        >
          <span
            className="size-1.5 rounded-full pulse-dot flex-shrink-0"
            style={{ background: "#10b981", boxShadow: "0 0 6px rgba(16,185,129,0.7)" }}
          />
          <span style={{ fontSize: 10, fontWeight: 600, color: "#10b981" }}>AI Active</span>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="relative size-9 rounded-xl flex items-center justify-center transition-all"
            style={{
              color:      "rgba(255,255,255,0.4)",
              background: notifOpen ? "rgba(255,255,255,0.06)" : "transparent",
            }}
            aria-label="Уведомления"
          >
            <Bell size={15} />
            {unread > 0 && (
              <span
                className="absolute top-1.5 right-1.5 size-1.5 rounded-full pulse-dot"
                style={{ background: "#6366f1", boxShadow: "0 0 5px rgba(99,102,241,0.8)" }}
              />
            )}
          </button>

          {notifOpen && (
            <div
              className="absolute right-0 top-12 w-80 overflow-hidden z-50 scale-in"
              style={{
                background:   "#0E0F16",
                border:       "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                boxShadow:    "0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)",
              }}
            >
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Уведомления</span>
                  {unread > 0 && (
                    <span className="chip chip-blue" style={{ padding: "1px 7px", fontSize: 10 }}>{unread}</span>
                  )}
                </div>
                <button
                  onClick={() => setAllRead(true)}
                  style={{ fontSize: 10, color: "rgba(99,102,241,0.8)", cursor: "pointer", background: "none", border: "none" }}
                  className="hover:text-indigo-300 transition-colors"
                >
                  Прочитать всё
                </button>
              </div>
              {NOTIFICATIONS.map((n, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-all hover:bg-white/[0.025]"
                  style={{
                    borderBottom: i < NOTIFICATIONS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    opacity: (allRead || n.read) ? 0.5 : 1,
                  }}
                >
                  <span className="size-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: n.dot, boxShadow: `0 0 5px ${n.dot}80` }} />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{n.desc}</div>
                  </div>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", flexShrink: 0 }}>{n.time}</span>
                </div>
              ))}
              <div className="px-4 py-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <button style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "center" }}>
                  Все уведомления →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div
          className="flex items-center gap-2 pl-3 cursor-pointer"
          style={{ borderLeft: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div
            className="size-7 rounded-xl flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", boxShadow: "0 2px 10px rgba(99,102,241,0.35)" }}
          >
            F
          </div>
          <div className="hidden sm:block leading-tight">
            <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>Founder</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>Starter</div>
          </div>
        </div>
      </div>
    </header>
  );
}
