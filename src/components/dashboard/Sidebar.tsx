"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Zap, FolderOpen, FileText, Users,
  Bot, Settings, HelpCircle, BookOpen, Database,
  X, PanelLeftClose, PanelLeft, ChevronRight, History, CheckSquare,
} from "lucide-react";

// Pulse dot for live items
function PulseDot() {
  return (
    <span className="relative flex" style={{ width: 6, height: 6, flexShrink: 0 }}>
      <span className="absolute inline-flex h-full w-full rounded-full animate-ping" style={{ background: "#10b981", opacity: 0.6 }} />
      <span className="relative inline-flex rounded-full" style={{ width: 6, height: 6, background: "#10b981" }} />
    </span>
  );
}

// Badge (numeric count)
function Badge({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span style={{
      minWidth: 18, height: 18, borderRadius: 9,
      background: "rgba(99,102,241,0.85)",
      border: "1px solid rgba(99,102,241,0.4)",
      fontSize: 9.5, fontWeight: 800, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 4px", letterSpacing: "0.02em",
      flexShrink: 0,
    }}>{n > 99 ? "99+" : n}</span>
  );
}

// ─── Sectioned navigation (matches Command Center reference) ──────────────────
type NavItem = { key: string; label: string; href: string; exact?: boolean; icon: any; accent?: boolean; badge?: number; live?: boolean };
type NavSection = { title: string; items: NavItem[] };

const SECTIONS: NavSection[] = [
  {
    title: "Командный центр",
    items: [
      { key: "1", label: "Dashboard",        href: "/dashboard",            exact: true, icon: LayoutDashboard, live: true },
      { key: "2", label: "Новая стратегия",  href: "/dashboard/new",        icon: Zap, accent: true },
      { key: "3", label: "Мои проекты",      href: "/dashboard/projects",   icon: FolderOpen, badge: 2 },
      { key: "4", label: "Отчёты",           href: "/dashboard/reports",    icon: FileText, badge: 1 },
      { key: "5", label: "Задачи",           href: "/dashboard/tasks",      icon: CheckSquare },
    ],
  },
  {
    title: "AI система",
    items: [
      { key: "6", label: "Исполн. совет",    href: "/dashboard/executives", icon: Users, live: true },
      { key: "7", label: "История диалогов", href: "/dashboard/history",    icon: History },
    ],
  },
  {
    title: "Инструменты",
    items: [
      { key: "8", label: "AI Агенты",        href: "/dashboard/agents",     icon: Bot },
      { key: "9", label: "Knowledge Vault",  href: "/dashboard/vault",      icon: Database, accent: true },
      { key: "0", label: "Блокнот",          href: "/dashboard/notepad",    icon: BookOpen },
    ],
  },
];

const ALL_ITEMS = SECTIONS.flatMap(s => s.items);

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const [collapsed, setCollapsed] = useState(false);
  const [projectCount, setProjectCount] = useState<number | null>(null);

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

  // Hotkeys: ⌘/Ctrl+B collapse · digits 1–9 navigate
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = ["INPUT", "TEXTAREA"].includes((document.activeElement?.tagName ?? "")) ||
        (document.activeElement as HTMLElement)?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") { e.preventDefault(); toggleCollapse(); return; }
      if (typing) return;
      const item = ALL_ITEMS.find(n => n.key === e.key);
      if (item && !e.metaKey && !e.ctrlKey && !e.altKey) router.push(item.href);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

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
      <div className="flex items-center justify-between flex-shrink-0"
        style={{ height: 58, padding: collapsed ? "0 14px" : "0 14px 0 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="flex items-center gap-2.5 min-w-0" onClick={onClose} title="Vertlix — Command Center">
          <div className="size-8 rounded-[10px] flex items-center justify-center flex-shrink-0 relative"
            style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", boxShadow: "0 4px 14px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)" }}>
            <svg className="size-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-none">
              <div className="term-mono truncate" style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", letterSpacing: "0.02em" }}>
                VERTLIX <span style={{ color: "rgba(255,255,255,0.22)" }}>//</span> CMD
              </div>
              <div className="term-mono truncate" style={{ fontSize: 8.5, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.14em", marginTop: 3 }}>
                COMMAND CENTER
              </div>
            </div>
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

      {/* ── Live status badge: 20 AGENTS · ONLINE ── */}
      {!collapsed && (
        <div className="px-3 pt-3 flex-shrink-0">
          <div className="flex items-center gap-2"
            style={{
              height: 30, padding: "0 12px", borderRadius: 9,
              background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)",
            }}>
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: "#10b981" }} />
              <span className="relative inline-flex rounded-full size-1.5" style={{ background: "#10b981" }} />
            </span>
            <span className="term-mono" style={{ fontSize: 10, fontWeight: 600, color: "rgba(52,211,153,0.9)", letterSpacing: "0.1em" }}>
              20 AGENTS · ONLINE
            </span>
          </div>
        </div>
      )}

      {/* ── Sectioned nav ── */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {SECTIONS.map(section => (
          <div key={section.title} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {!collapsed && (
              <div className="term-mono" style={{ padding: "0 10px 4px", fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.22)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                // {section.title}
              </div>
            )}
            {section.items.map(item => {
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
                    color: active ? "#fff" : item.accent ? "rgba(129,140,248,0.9)" : "rgba(255,255,255,0.45)",
                    fontSize: 13, fontWeight: active ? 600 : 500, textDecoration: "none",
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  {/* active indicator bar */}
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-4 rounded-full"
                      style={{ background: "linear-gradient(180deg, #6366f1, #4f46e5)", boxShadow: "0 0 8px rgba(99,102,241,0.6)" }} />
                  )}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <Icon size={15} strokeWidth={active ? 2.2 : 1.8}
                      style={{ color: active ? "#818cf8" : item.accent ? "#818cf8" : undefined, transition: "color 0.15s", display: "block" }} />
                    {/* collapsed badge dot */}
                    {collapsed && item.badge && item.badge > 0 && (
                      <span style={{
                        position: "absolute", top: -4, right: -4,
                        width: 12, height: 12, borderRadius: "50%",
                        background: "#6366f1", border: "2px solid #090A0F",
                        fontSize: 7, fontWeight: 800, color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>{item.badge}</span>
                    )}
                    {/* collapsed live dot */}
                    {collapsed && item.live && !active && (
                      <span style={{
                        position: "absolute", top: -3, right: -3,
                        width: 6, height: 6, borderRadius: "50%",
                        background: "#10b981", border: "2px solid #090A0F",
                      }} />
                    )}
                  </div>
                  {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                  {/* badges */}
                  {!collapsed && !active && item.badge && <Badge n={item.badge} />}
                  {!collapsed && !active && item.live && !item.badge && <PulseDot />}
                  {/* accent dot for special items (no badge) */}
                  {!collapsed && item.accent && !active && !item.badge && !item.live && (
                    <span className="size-1.5 rounded-full flex-shrink-0" style={{ background: "#6366f1", boxShadow: "0 0 6px rgba(99,102,241,0.7)" }} />
                  )}
                  {/* active chevron */}
                  {!collapsed && active && (
                    <ChevronRight size={13} style={{ flexShrink: 0, color: "rgba(129,140,248,0.7)" }} />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Bottom: profile + plan + usage + actions ── */}
      <div className="flex-shrink-0 p-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {!collapsed ? (
          <div style={{ borderRadius: 12, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.055)", padding: 10 }}>
            {/* usage */}
            <div className="flex items-center justify-between mb-1.5">
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Проекты использовано</span>
              <span className="term-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
                {projectCount != null
                  ? `${projectCount} / ${projectLimit}`
                  : <span style={{ opacity: 0.5 }}>— / {projectLimit}</span>}
              </span>
            </div>
            <div className="h-1 rounded-full overflow-hidden mb-2.5" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full" style={{
                width: `${usedPct}%`,
                background: "linear-gradient(90deg, #6366f1, #4f46e5)",
                transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
              }} />
            </div>
            <Link href="/pricing" onClick={onClose}
              className="flex items-center justify-between transition-colors group mb-2.5"
              style={{ fontSize: 10.5, color: "rgba(129,140,248,0.85)", textDecoration: "none" }}>
              <span>Upgrade to Pro</span>
              <ChevronRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "0 -10px 8px" }} />

            {/* quick actions */}
            <div className="flex items-center gap-1 mb-2.5">
              <Link href="/dashboard/settings" onClick={onClose} title="Настройки"
                className="flex-1 flex items-center gap-2 rounded-lg transition-colors"
                style={{ height: 30, padding: "0 8px", color: "rgba(255,255,255,0.4)", fontSize: 11.5 }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <Settings size={13} /> Настройки
              </Link>
            </div>
            <Link href="/dashboard/support" onClick={onClose} title="Поддержка"
              className="flex items-center gap-2 rounded-lg transition-colors mb-2.5"
              style={{ height: 30, padding: "0 8px", color: "rgba(255,255,255,0.4)", fontSize: 11.5 }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <HelpCircle size={13} /> Поддержка
            </Link>

            {/* user + plan */}
            <div className="flex items-center gap-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 8 }}>
              <div className="relative size-8 rounded-[10px] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
                {userInitial}
                <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full" style={{ background: "#10b981", border: "2px solid #0B0C11" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate" style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{userName}</div>
                <div className="term-mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>STARTER PLAN</div>
              </div>
              <ChevronRight size={13} style={{ color: "rgba(255,255,255,0.25)" }} />
            </div>
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
