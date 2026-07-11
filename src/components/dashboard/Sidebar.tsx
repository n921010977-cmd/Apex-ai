"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Zap, FolderOpen, FileText, Users,
  Bot, Settings, HelpCircle, Cpu,
  X, Search, PanelLeftClose, PanelLeft, ChevronRight,
} from "lucide-react";

// ─── Flat navigation (one list, hotkeys 1–7) ──────────────────────────────────
const NAV = [
  { key: "1", label: "Обзор",     href: "/dashboard",            exact: true, icon: LayoutDashboard },
  { key: "2", label: "Проекты",   href: "/dashboard/projects",   icon: FolderOpen },
  { key: "3", label: "Отчёты",    href: "/dashboard/reports",    icon: FileText },
  { key: "4", label: "Совет",     href: "/dashboard/executives", icon: Users },
  { key: "5", label: "Агенты",    href: "/dashboard/agents",     icon: Bot },
  { key: "6", label: "Apex OS",   href: "/dashboard/os",         icon: Cpu },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const projectLimit = 3;

  // Persist collapse
  useEffect(() => {
    setCollapsed(localStorage.getItem("apex-sidebar-collapsed") === "1");
  }, []);
  const toggleCollapse = () => {
    setCollapsed(c => {
      localStorage.setItem("apex-sidebar-collapsed", c ? "0" : "1");
      return !c;
    });
  };

  // Usage
  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(d => { if (d.success) setProjectCount(d.data?.kpis?.projects?.total ?? 0); })
      .catch(() => setProjectCount(0));
  }, []);

  // Hotkeys: ⌘/Ctrl+B collapse · "/" focus search · digits 1–7 navigate
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = ["INPUT", "TEXTAREA"].includes((document.activeElement?.tagName ?? "")) ||
        (document.activeElement as HTMLElement)?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") { e.preventDefault(); toggleCollapse(); return; }
      if (typing) return;
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); return; }
      const item = NAV.find(n => n.key === e.key);
      if (item && !e.metaKey && !e.ctrlKey && !e.altKey) router.push(item.href);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const q = query.trim().toLowerCase();
  const visible = q ? NAV.filter(n => n.label.toLowerCase().includes(q)) : NAV;

  const userName = session?.user?.name ?? "Founder";
  const userInitial = userName.charAt(0).toUpperCase();
  const usedPct = projectCount != null ? Math.min(100, (projectCount / projectLimit) * 100) : 0;

  const W = collapsed ? 64 : 224;

  return (
    <aside
      className={cn("dashboard-sidebar flex flex-col", isOpen && "sidebar-open")}
      style={{
        width: W, minWidth: W,
        transition: "width 0.25s cubic-bezier(0.22,1,0.36,1), min-width 0.25s cubic-bezier(0.22,1,0.36,1)",
        background: "linear-gradient(180deg, #090A0F 0%, #070809 100%)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* ── Header: brand + collapse ── */}
      <div className="h-[58px] flex items-center justify-between flex-shrink-0"
        style={{ padding: collapsed ? "0 14px" : "0 14px 0 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="flex items-center gap-2.5 min-w-0" onClick={onClose} title="Apex — Command Center">
          <div className="size-8 rounded-[10px] flex items-center justify-center flex-shrink-0 relative"
            style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", boxShadow: "0 4px 14px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)" }}>
            <svg className="size-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            {/* live status — replaces the decorative "20 AGENTS ONLINE" row */}
            <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full"
              style={{ background: "#10b981", border: "2px solid #090A0F" }} title="AI онлайн · 20 агентов" />
          </div>
          {!collapsed && (
            <span className="term-mono truncate" style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", letterSpacing: "0.02em" }}>
              APEX <span style={{ color: "rgba(255,255,255,0.22)" }}>//</span> CMD
            </span>
          )}
        </Link>
        <div className="flex items-center gap-1">
          <button onClick={toggleCollapse} title={collapsed ? "Развернуть (⌘B)" : "Свернуть (⌘B)"}
            className="hidden lg:flex size-7 rounded-lg items-center justify-center transition-colors"
            style={{ color: "rgba(255,255,255,0.3)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
            {collapsed ? <PanelLeft size={14} /> : <PanelLeftClose size={14} />}
          </button>
          <button onClick={onClose} aria-label="Закрыть меню"
            className="lg:hidden size-7 rounded-lg flex items-center justify-center"
            style={{ color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.05)" }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Search (filters nav, "/" to focus) ── */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1 flex-shrink-0">
          <div style={{ position: "relative" }}>
            <Search size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", pointerEvents: "none" }} />
            <input
              ref={searchRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Escape") { setQuery(""); (e.target as HTMLInputElement).blur(); } }}
              placeholder="Поиск…"
              className="w-full"
              style={{
                height: 32, borderRadius: 9, padding: "0 30px 0 28px",
                background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)",
                color: "#fff", fontSize: 12, outline: "none", transition: "border-color 0.15s",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.45)")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
            />
            <kbd className="term-mono" style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", fontSize: 9, color: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 4, padding: "1px 5px" }}>/</kbd>
          </div>
        </div>
      )}

      {/* ── Primary action ── */}
      <div className="flex-shrink-0" style={{ padding: collapsed ? "10px 12px 4px" : "10px 12px 4px" }}>
        <Link href="/dashboard/new" onClick={onClose} title="Новая стратегия"
          className="flex items-center justify-center gap-2 transition-all hover:-translate-y-px active:translate-y-0"
          style={{
            height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            boxShadow: "0 4px 14px rgba(99,102,241,0.28), inset 0 1px 0 rgba(255,255,255,0.14)",
            color: "#fff", fontSize: 12.5, fontWeight: 700, textDecoration: "none",
          }}>
          <Zap size={13} strokeWidth={2.5} />
          {!collapsed && "Новая стратегия"}
        </Link>
      </div>

      {/* ── Flat nav ── */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {visible.map(item => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              className="group relative flex items-center rounded-[10px] transition-all duration-150"
              style={{
                height: 36,
                padding: collapsed ? "0" : "0 10px",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: 10,
                background: active ? "rgba(99,102,241,0.12)" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.45)",
                fontSize: 13, fontWeight: 500, textDecoration: "none",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              {/* active indicator */}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-4 rounded-full"
                  style={{ background: "linear-gradient(180deg, #6366f1, #4f46e5)", boxShadow: "0 0 8px rgba(99,102,241,0.6)" }} />
              )}
              <Icon size={15} strokeWidth={active ? 2.2 : 1.8}
                style={{ flexShrink: 0, color: active ? "#818cf8" : undefined, transition: "color 0.15s" }} />
              {!collapsed && <span className="truncate flex-1">{item.label}</span>}
              {!collapsed && (
                <kbd className="term-mono opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 4, padding: "1px 5px" }}>
                  {item.key}
                </kbd>
              )}
            </Link>
          );
        })}
        {q && visible.length === 0 && (
          <div className="term-mono" style={{ padding: "14px 10px", fontSize: 10.5, color: "rgba(255,255,255,0.25)", letterSpacing: "0.05em" }}>
            // ничего не найдено
          </div>
        )}
      </nav>

      {/* ── Bottom: one merged block — profile + plan + usage + actions ── */}
      <div className="flex-shrink-0 p-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {!collapsed ? (
          <div style={{ borderRadius: 12, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.055)", padding: 10 }}>
            {/* user + plan */}
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="relative size-8 rounded-[10px] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
                {userInitial}
                <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full" style={{ background: "#10b981", border: "2px solid #0B0C11" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate" style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{userName}</div>
                <div className="term-mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>STARTER</div>
              </div>
              <div className="flex items-center gap-0.5">
                <Link href="/dashboard/settings" onClick={onClose} title="Настройки"
                  className="size-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
                  <Settings size={14} />
                </Link>
                <Link href="/dashboard/support" onClick={onClose} title="Поддержка"
                  className="size-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
                  <HelpCircle size={14} />
                </Link>
              </div>
            </div>
            {/* usage */}
            <div className="flex items-center justify-between mb-1.5">
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Проекты</span>
              <span className="term-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
                {projectCount != null
                  ? `${projectCount} / ${projectLimit}`
                  : <span style={{ opacity: 0.5 }}>загрузка…</span>}
              </span>
            </div>
            <div className="h-1 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full" style={{
                width: `${usedPct}%`,
                background: "linear-gradient(90deg, #6366f1, #4f46e5)",
                transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
              }} />
            </div>
            <Link href="/dashboard/settings" onClick={onClose}
              className="flex items-center justify-between transition-colors group"
              style={{ fontSize: 10.5, color: "rgba(129,140,248,0.8)", textDecoration: "none" }}>
              <span>Перейти на Pro</span>
              <ChevronRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <Link href="/dashboard/settings" onClick={onClose} title="Настройки"
              className="size-8 rounded-lg flex items-center justify-center" style={{ color: "rgba(255,255,255,0.35)" }}>
              <Settings size={14} />
            </Link>
            <div className="relative size-8 rounded-[10px] flex items-center justify-center text-[11px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }} title={`${userName} · Starter`}>
              {userInitial}
              <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full" style={{ background: "#10b981", border: "2px solid #0B0C11" }} />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
