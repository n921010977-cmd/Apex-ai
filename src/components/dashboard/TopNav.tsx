"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, Bell, Plus, Cpu, Menu, Command, CornerDownLeft, LayoutGrid, FolderKanban, FileText, Users, Bot, Sparkles, Settings, LifeBuoy } from "lucide-react";

// ─── Command palette targets ────────────────────────────────────────────────
type CmdTarget = { label: string; hint: string; href: string; kind: "Page" | "Action" | "Agent"; icon: typeof LayoutGrid; keywords?: string };
const CMD_TARGETS: CmdTarget[] = [
  { label: "Overview",             hint: "Dashboard",            href: "/dashboard",            kind: "Page", icon: LayoutGrid,   keywords: "dashboard home overview" },
  { label: "New strategy",         hint: "Validate an idea",     href: "/dashboard/new",        kind: "Action", icon: Sparkles,     keywords: "create analysis idea new strategy" },
  { label: "My projects",          hint: "Strategy portfolio",   href: "/dashboard/projects",   kind: "Page", icon: FolderKanban, keywords: "projects portfolio" },
  { label: "Reports",              hint: "Finished reports",     href: "/dashboard/reports",    kind: "Page", icon: FileText,     keywords: "reports pdf" },
  { label: "Executive board",      hint: "Ask the board",        href: "/dashboard/executives", kind: "Page", icon: Users,        keywords: "board directors council" },
  { label: "AI Agents",            hint: "20 directors",         href: "/dashboard/agents",     kind: "Page", icon: Bot,          keywords: "agents team" },
  { label: "Settings",             hint: "Account & billing",    href: "/dashboard/settings",   kind: "Page", icon: Settings,     keywords: "settings profile billing" },
  { label: "Support",              hint: "Help",                 href: "/dashboard/support",    kind: "Page", icon: LifeBuoy,     keywords: "support help ticket" },
  { label: "Ask the CFO",          hint: "Chief Financial Officer", href: "/dashboard/executives", kind: "Agent",    icon: Bot,          keywords: "finance money cfo" },
  { label: "Ask the CMO",          hint: "Chief Marketing Officer", href: "/dashboard/executives", kind: "Agent",  icon: Bot,          keywords: "marketing growth cmo" },
  { label: "Ask the CTO",          hint: "Chief Technology Officer", href: "/dashboard/executives", kind: "Agent",    icon: Bot,          keywords: "technology product cto" },
];

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard":            "Dashboard",
  "/dashboard/new":        "New strategy",
  "/dashboard/projects":   "My projects",
  "/dashboard/reports":    "Reports",
  "/dashboard/executives": "Executive board",
  "/dashboard/chat":       "AI Chat",
  "/dashboard/agents":     "AI Agents",
  "/dashboard/notepad":    "Notepad",
  "/dashboard/settings":   "Settings",
  "/dashboard/support":    "Support",
};

// Fallback shown while the API loads or if the user has no notifications yet
const DEMO_NOTIFICATIONS: Notification[] = [];  // Демо-уведомления удалены: показываем только настоящие.

const TYPE_DOT: Record<string, string> = {
  success: "#10b981", warning: "#f59e0b", danger: "#ef4444", error: "#ef4444", info: "#7C3AED",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "Yesterday" : `${d}d`;
}

interface Notification {
  id: string;
  title: string;
  body?: string | null;
  type?: string;
  is_read: boolean;
  created_at: string;
}

interface TopNavProps {
  onMenuClick?: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const pathname    = usePathname();
  const router      = useRouter();
  const { data: session } = useSession();
  const [focused,   setFocused]   = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [query,     setQuery]     = useState("");
  const [active,    setActive]    = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);
  const notifRef    = useRef<HTMLDivElement>(null);
  const searchRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CMD_TARGETS.filter(t => t.kind !== "Agent");
    return CMD_TARGETS.filter(t =>
      t.label.toLowerCase().includes(q) || t.hint.toLowerCase().includes(q) || (t.keywords ?? "").includes(q)
    );
  }, [query]);

  const paletteOpen = focused;
  useEffect(() => { setActive(0); }, [query, focused]);

  const goTo = (t: CmdTarget) => {
    setFocused(false); setQuery(""); inputRef.current?.blur();
    router.push(t.href);
  };

  // Match the most specific (longest) route prefix, otherwise the generic
  // "/dashboard" entry shadows every sub-page and the breadcrumb always
  // reads "Dashboard".
  const pageLabel = Object.entries(ROUTE_LABELS)
    .filter(([k]) => k === pathname || pathname.startsWith(k + "/"))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? "Dashboard";

  const userName = session?.user?.name ?? "Founder";
  const userInitial = userName.charAt(0).toUpperCase();
  const unread = notifications.filter(n => !n.is_read).length;

  // Load real notifications
  useEffect(() => {
    fetch("/api/notifications?limit=8")
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data) && d.data.length > 0) setNotifications(d.data);
      })
      .catch(() => {});
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => {});
  };

  // Close notif dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setFocused(false);
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
        aria-label="Open menu"
      >
        <Menu size={16} />
      </button>

      {/* Breadcrumb — terminal path */}
      <div className="hidden sm:flex items-center gap-2 flex-shrink-0 term-mono" style={{ fontSize: 11.5, color: "rgba(255,255,255,0.28)", letterSpacing: "0.04em" }}>
        <Cpu size={13} style={{ color: "rgba(124,58,237,0.7)" }} />
        <span style={{ color: "rgba(255,255,255,0.4)" }}>vertlix</span>
        <span style={{ color: "rgba(124,58,237,0.5)" }}>/</span>
        <span style={{ color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{pageLabel}</span>
        <span className="term-blink" style={{ color: "rgba(124,58,237,0.8)" }}>▋</span>
      </div>

      {/* Mobile page title */}
      <span
        className="sm:hidden truncate flex-1 term-mono"
        style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", letterSpacing: "0.02em" }}
      >
        {pageLabel}
      </span>

      {/* Search + command palette */}
      <div
        ref={searchRef}
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
          placeholder="Search commands, pages, agents…"
          onFocus={() => setFocused(true)}
          onKeyDown={e => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
            else if (e.key === "Enter") { e.preventDefault(); if (results[active]) goTo(results[active]); }
            else if (e.key === "Escape") { setFocused(false); inputRef.current?.blur(); }
          }}
          className="w-full focus:outline-none transition-all"
          style={{
            height:       34,
            background:   focused ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.03)",
            border:       `1px solid ${focused ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.06)"}`,
            borderRadius: 10,
            paddingLeft:  32,
            paddingRight: 44,
            fontSize:     12,
            color:        "rgba(255,255,255,0.78)",
            boxShadow:    focused ? "0 0 0 3px rgba(124,58,237,0.08)" : "none",
          }}
        />
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5"
          style={{ fontSize: 9, color: "rgba(255,255,255,0.18)" }}
        >
          <Command size={9} />
          <span>K</span>
        </div>

        {/* Results dropdown */}
        {paletteOpen && (
          <div
            className="absolute left-0 right-0 top-full mt-2 overflow-hidden"
            style={{
              background: "rgba(10,11,18,0.98)", border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 12, boxShadow: "0 16px 48px rgba(0,0,0,0.55)", backdropFilter: "blur(20px)",
              maxHeight: 380, overflowY: "auto", zIndex: 40,
            }}
          >
            {results.length === 0 ? (
              <div className="term-mono" style={{ padding: "16px", fontSize: 11.5, color: "rgba(255,255,255,0.35)" }}>
                Nothing found for \u201c{query}\u201d
              </div>
            ) : (
              <>
                <div className="term-label" style={{ padding: "10px 14px 6px", fontSize: 9, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)" }}>
                  {query.trim() ? "RESULTS" : "QUICK JUMP"}
                </div>
                {results.map((t, i) => {
                  const Icon = t.icon;
                  const sel = i === active;
                  return (
                    <button
                      key={t.label + i}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => goTo(t)}
                      className="w-full flex items-center gap-3 text-left transition-colors"
                      style={{
                        padding: "9px 14px",
                        background: sel ? "rgba(124,58,237,0.14)" : "transparent",
                        borderLeft: `2px solid ${sel ? "#7C3AED" : "transparent"}`,
                      }}
                    >
                      <span style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <Icon size={13} style={{ color: sel ? "#a5b4fc" : "rgba(255,255,255,0.5)" }} />
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{t.label}</span>
                        <span style={{ display: "block", fontSize: 10.5, color: "rgba(255,255,255,0.4)" }}>{t.hint}</span>
                      </span>
                      <span className="term-mono" style={{ fontSize: 8.5, color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>{t.kind}</span>
                      {sel && <CornerDownLeft size={12} style={{ color: "rgba(255,255,255,0.35)", flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </>
            )}
            <div className="term-mono" style={{ display: "flex", gap: 12, padding: "8px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 9, color: "rgba(255,255,255,0.28)" }}>
              <span>↑↓ navigate</span><span>↵ open</span><span>esc close</span>
            </div>
          </div>
        )}
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
            background:   "linear-gradient(135deg, #7C3AED, #6D28D9)",
            boxShadow:    "0 4px 14px rgba(124,58,237,0.3), inset 0 1px 0 rgba(255,255,255,0.14)",
            whiteSpace:   "nowrap",
          }}
        >
          <Plus size={12} strokeWidth={2.5} />
          New
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
            aria-label="Notifications"
          >
            <Bell size={15} />
            {unread > 0 && (
              <span
                className="absolute top-1.5 right-1.5 size-1.5 rounded-full pulse-dot"
                style={{ background: "#7C3AED", boxShadow: "0 0 5px rgba(124,58,237,0.8)" }}
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
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Notifications</span>
                  {unread > 0 && (
                    <span className="chip chip-blue" style={{ padding: "1px 7px", fontSize: 10 }}>{unread}</span>
                  )}
                </div>
                <button
                  onClick={markAllRead}
                  style={{ fontSize: 10, color: "rgba(124,58,237,0.8)", cursor: "pointer", background: "none", border: "none" }}
                  className="hover:text-indigo-300 transition-colors"
                >
                  Mark all read
                </button>
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: "28px 16px", textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                  No notifications
                </div>
              ) : notifications.map((n, i) => {
                const dot = TYPE_DOT[n.type ?? "info"] ?? "#7C3AED";
                return (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-all hover:bg-white/[0.025]"
                    style={{
                      borderBottom: i < notifications.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      opacity: n.is_read ? 0.5 : 1,
                    }}
                  >
                    <span className="size-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: dot, boxShadow: `0 0 5px ${dot}80` }} />
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>{n.title}</div>
                      {n.body && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{n.body}</div>}
                    </div>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", flexShrink: 0 }}>{timeAgo(n.created_at)}</span>
                  </div>
                );
              })}
              <div className="px-4 py-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <button style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "center" }}>
                  All notifications →
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
            style={{ background: "linear-gradient(135deg, #7C3AED, #6D28D9)", boxShadow: "0 2px 10px rgba(124,58,237,0.35)" }}
          >
            {userInitial}
          </div>
          <div className="hidden sm:block leading-tight">
            <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.7)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>Starter</div>
          </div>
        </div>
      </div>
    </header>
  );
}
