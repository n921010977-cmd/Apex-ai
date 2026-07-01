"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Zap, FolderOpen, FileText, Users, BarChart3,
  MessageSquare, Bot, BookOpen, Settings, HelpCircle, ChevronRight,
  TrendingUp, Shield,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Командный центр",
    items: [
      { label: "Dashboard",       href: "/dashboard",            exact: true, icon: LayoutDashboard },
      { label: "Новая стратегия", href: "/dashboard/new",        icon: Zap,   accent: true },
      { label: "Мои проекты",     href: "/dashboard/projects",   icon: FolderOpen },
      { label: "Отчёты",          href: "/dashboard/reports",    icon: FileText },
    ],
  },
  {
    label: "AI Система",
    items: [
      { label: "Исполн. совет",   href: "/dashboard/executives", icon: Users },
      { label: "Аналитика",       href: "/dashboard/analytics",  icon: BarChart3 },
      { label: "Рост & Рынок",    href: "/dashboard/analytics",  icon: TrendingUp },
      { label: "Риски",           href: "/dashboard/reports",    icon: Shield },
    ],
  },
  {
    label: "Инструменты",
    items: [
      { label: "AI Чат",          href: "/dashboard/chat",       icon: MessageSquare },
      { label: "AI Агенты",       href: "/dashboard/agents",     icon: Bot },
      { label: "Блокнот",         href: "/dashboard/notepad",    icon: BookOpen },
    ],
  },
];

const BOTTOM_ITEMS = [
  { label: "Настройки",  href: "/dashboard/settings", icon: Settings  },
  { label: "Поддержка",  href: "/dashboard/support",  icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside
      className="w-[220px] flex-shrink-0 flex flex-col h-screen sticky top-0"
      style={{
        background:   "linear-gradient(180deg, #0a0b0f 0%, #080909 100%)",
        borderRight:  "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Logo */}
      <div className="h-[58px] flex items-center px-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="flex items-center gap-3 group">
          <div
            className="size-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background:  "linear-gradient(135deg, #7A5CFF, #5A8DFF)",
              boxShadow:   "0 4px 16px rgba(122,92,255,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            <svg className="size-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div>
            <div className="text-[13px] font-bold text-white tracking-tight leading-tight">Apex AI</div>
            <div className="text-[9px] text-white/30 tracking-[0.18em] uppercase leading-tight">Executive Board</div>
          </div>
        </Link>
      </div>

      {/* AI Status pill */}
      <div className="px-3 pt-3 pb-1">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: "rgba(0,231,167,0.06)", border: "1px solid rgba(0,231,167,0.12)" }}
        >
          <span
            className="size-2 rounded-full flex-shrink-0"
            style={{
              background: "#00E7A7",
              boxShadow:  "0 0 8px rgba(0,231,167,0.8)",
              animation:  "sb-pulse 2s ease-in-out infinite",
            }}
          />
          <span style={{ fontSize: 10, fontWeight: 600, color: "#00E7A7", letterSpacing: "0.04em" }}>
            AI Online · 20 агентов
          </span>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-3 mb-1">
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
                {group.label}
              </span>
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href, item.exact);
                const Icon   = item.icon;
                return (
                  <Link
                    key={item.label + item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 group relative",
                      active
                        ? "text-white"
                        : item.accent
                        ? "text-violet-400/80 hover:text-violet-300"
                        : "text-white/38 hover:text-white/72"
                    )}
                    style={active ? {
                      background: "linear-gradient(135deg, rgba(122,92,255,0.16), rgba(90,141,255,0.08))",
                      border:     "1px solid rgba(122,92,255,0.22)",
                    } : {
                      border: "1px solid transparent",
                    }}
                  >
                    {active && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                        style={{ background: "linear-gradient(180deg, #7A5CFF, #5A8DFF)" }}
                      />
                    )}
                    <Icon
                      size={14}
                      className={cn(
                        "flex-shrink-0 transition-colors",
                        active       ? "text-violet-400"
                        : item.accent ? "text-violet-500"
                        : "text-white/22 group-hover:text-white/48"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                    {item.accent && (
                      <span
                        className="ml-auto size-1.5 rounded-full flex-shrink-0"
                        style={{ background: "#7A5CFF", boxShadow: "0 0 6px rgba(122,92,255,0.8)", animation: "sb-pulse 2s ease-in-out infinite" }}
                      />
                    )}
                    {active && (
                      <ChevronRight size={11} className="ml-auto text-violet-400/40 flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Usage meter */}
      <div className="mx-3 mb-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Использовано</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>1 / 3</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-full w-1/3 rounded-full" style={{ background: "linear-gradient(90deg, #7A5CFF, #5A8DFF)" }} />
        </div>
        <Link href="/dashboard/settings" className="mt-2 block" style={{ fontSize: 10, color: "rgba(122,92,255,0.8)" }}>
          Upgrade to Pro →
        </Link>
      </div>

      {/* Bottom */}
      <div className="px-2 pb-3 space-y-0.5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 8 }}>
        {BOTTOM_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon   = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 group",
                active ? "text-white" : "text-white/30 hover:text-white/62"
              )}
              style={active ? { background: "rgba(122,92,255,0.1)", border: "1px solid rgba(122,92,255,0.15)" } : { border: "1px solid transparent" }}
            >
              <Icon size={14} className={cn("flex-shrink-0", active ? "text-violet-400" : "text-white/18 group-hover:text-white/42")} />
              {item.label}
            </Link>
          );
        })}

        {/* User */}
        <div
          className="flex items-center gap-2.5 px-3 py-2 mt-1 rounded-xl hover:bg-white/[0.03] cursor-pointer transition-all group"
          style={{ border: "1px solid transparent" }}
        >
          <div
            className="size-7 rounded-xl flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #7A5CFF, #5A8DFF)", boxShadow: "0 2px 8px rgba(122,92,255,0.4)" }}
          >
            F
          </div>
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.62)" }}>Founder</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.24)" }}>Starter Plan</div>
          </div>
          <ChevronRight size={11} className="text-white/15 group-hover:text-white/35 flex-shrink-0" />
        </div>
      </div>

      <style>{`
        @keyframes sb-pulse { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
      `}</style>
    </aside>
  );
}
