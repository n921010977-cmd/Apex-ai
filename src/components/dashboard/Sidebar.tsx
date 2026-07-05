"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Zap, FolderOpen, FileText, Users, BarChart3,
  MessageSquare, Bot, BookOpen, Settings, HelpCircle, ChevronRight,
  TrendingUp, Shield, X,
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
      { label: "Рост & Рынок",    href: "/dashboard/growth",     icon: TrendingUp },
      { label: "Риски",           href: "/dashboard/risks",      icon: Shield },
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

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [projectCount, setProjectCount] = useState<number | null>(null);

  const planName = "Starter Plan";
  const projectLimit = 3;

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(d => {
        if (d.success) setProjectCount(d.data?.kpis?.projects?.total ?? 0);
      })
      .catch(() => {});
  }, []);

  const userName = session?.user?.name ?? "Founder";
  const userInitial = userName.charAt(0).toUpperCase();
  const usedPct = projectCount != null ? Math.min(100, (projectCount / projectLimit) * 100) : 33;

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleLinkClick = () => {
    onClose?.();
  };

  return (
    <aside
      className={cn("dashboard-sidebar w-[220px] flex flex-col", isOpen && "sidebar-open")}
      style={{
        background:  "linear-gradient(180deg, #090A0F 0%, #070809 100%)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Logo + mobile close */}
      <div
        className="h-[58px] flex items-center justify-between px-4 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <Link href="/" className="flex items-center gap-3 group" onClick={handleLinkClick}>
          <div
            className="size-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              boxShadow:  "0 4px 14px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            <svg className="size-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em", lineHeight: 1.1 }}>Apex AI</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", letterSpacing: "0.18em", textTransform: "uppercase" }}>Executive Board</div>
          </div>
        </Link>

        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden size-8 rounded-lg flex items-center justify-center"
          style={{ color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.05)" }}
          aria-label="Закрыть меню"
        >
          <X size={15} />
        </button>
      </div>

      {/* AI Status pill */}
      <div className="px-3 pt-3 pb-1 flex-shrink-0">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.12)" }}
        >
          <span
            className="size-2 rounded-full flex-shrink-0 pulse-dot"
            style={{ background: "#10b981", boxShadow: "0 0 6px rgba(16,185,129,0.7)" }}
          />
          <span style={{ fontSize: 10, fontWeight: 600, color: "#10b981", letterSpacing: "0.03em" }}>
            AI Online · 20 агентов
          </span>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-3 mb-1.5">
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.16)" }}>
                {group.label}
              </span>
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href, item.exact);
                const Icon   = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 group relative",
                      active
                        ? "text-white"
                        : item.accent
                        ? "text-indigo-400/80 hover:text-indigo-300"
                        : "text-white/38 hover:text-white/72"
                    )}
                    style={active ? {
                      background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(79,70,229,0.08))",
                      border:     "1px solid rgba(99,102,241,0.22)",
                    } : {
                      border: "1px solid transparent",
                    }}
                  >
                    {active && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                        style={{ background: "linear-gradient(180deg, #6366f1, #4f46e5)" }}
                      />
                    )}
                    <Icon
                      size={14}
                      className={cn(
                        "flex-shrink-0 transition-colors",
                        active       ? "text-indigo-400"
                        : item.accent ? "text-indigo-500"
                        : "text-white/22 group-hover:text-white/48"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                    {item.accent && (
                      <span
                        className="ml-auto size-1.5 rounded-full flex-shrink-0 pulse-dot"
                        style={{ background: "#6366f1", boxShadow: "0 0 5px rgba(99,102,241,0.7)" }}
                      />
                    )}
                    {active && (
                      <ChevronRight size={11} className="ml-auto text-indigo-400/40 flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Usage meter */}
      <div className="mx-3 mb-2 p-3 rounded-xl flex-shrink-0" style={{ background: "rgba(255,255,255,0.022)", border: "1px solid rgba(255,255,255,0.055)" }}>
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>Проекты использовано</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>
            {projectCount != null ? projectCount : "—"} / {projectLimit}
          </span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-full rounded-full" style={{ width: `${usedPct}%`, background: "linear-gradient(90deg, #6366f1, #4f46e5)" }} />
        </div>
        <Link
          href="/dashboard/settings"
          onClick={handleLinkClick}
          className="mt-2 block transition-colors hover:text-indigo-300"
          style={{ fontSize: 10, color: "rgba(99,102,241,0.75)" }}
        >
          Upgrade to Pro →
        </Link>
      </div>

      {/* Bottom items */}
      <div className="px-2 pb-3 space-y-0.5 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 8 }}>
        {BOTTOM_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon   = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 group",
                active ? "text-white" : "text-white/30 hover:text-white/62"
              )}
              style={active ? { background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.15)" } : { border: "1px solid transparent" }}
            >
              <Icon size={14} className={cn("flex-shrink-0", active ? "text-indigo-400" : "text-white/18 group-hover:text-white/42")} />
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
            style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", boxShadow: "0 2px 8px rgba(99,102,241,0.35)" }}
          >
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.22)" }}>{planName}</div>
          </div>
          <ChevronRight size={11} className="text-white/14 group-hover:text-white/32 flex-shrink-0" />
        </div>
      </div>
    </aside>
  );
}
