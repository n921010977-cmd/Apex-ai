"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    exact: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-[15px]">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: "Новая стратегия",
    href: "/dashboard/new",
    accent: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-[15px]">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    label: "Мои проекты",
    href: "/dashboard/projects",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-[15px]">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      </svg>
    ),
  },
  {
    label: "Отчёты",
    href: "/dashboard/reports",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-[15px]">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    label: "Исполн. совет",
    href: "/dashboard/executives",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-[15px]">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Аналитика",
    href: "/dashboard/analytics",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-[15px]">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: "AI Чат",
    href: "/dashboard/chat",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-[15px]">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: "AI Агенты",
    href: "/dashboard/agents",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-[15px]">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        <path d="M15 8h.01M9 8h.01" />
      </svg>
    ),
  },
  {
    label: "Блокнот",
    href: "/dashboard/notepad",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-[15px]">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
];

const BOTTOM_ITEMS = [
  {
    label: "Настройки",
    href: "/dashboard/settings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-[15px]">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
  },
  {
    label: "Поддержка",
    href: "/dashboard/support",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-[15px]">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col h-screen sticky top-0 border-r border-white/[0.05] bg-[#0a0a0a]">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-white/[0.05]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="size-6 rounded-lg bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <svg className="size-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div>
            <div className="text-[11px] font-bold text-white tracking-wide">Apex AI</div>
            <div className="text-[9px] text-white/25 tracking-widest uppercase">Command Center</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        <div className="px-2 mb-2">
          <span className="text-[9px] font-semibold text-white/20 tracking-widest uppercase">Workspace</span>
        </div>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group relative",
                active
                  ? "bg-violet-500/12 text-violet-300"
                  : item.accent
                  ? "text-violet-400/80 hover:text-violet-300 hover:bg-violet-500/8"
                  : "text-white/40 hover:text-white/75 hover:bg-white/[0.04]"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-violet-500 rounded-full" />
              )}
              <span className={cn(
                "flex-shrink-0 transition-colors",
                active ? "text-violet-400" : item.accent ? "text-violet-500" : "text-white/25 group-hover:text-white/50"
              )}>
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
              {item.accent && (
                <span className="ml-auto size-1.5 rounded-full bg-violet-500/80 animate-pulse flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Usage meter */}
      <div className="mx-2 mb-2 p-3 rounded-xl bg-white/[0.025] border border-white/[0.05]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-white/35">Использовано</span>
          <span className="text-[10px] font-semibold text-white/60">1 / 3</span>
        </div>
        <div className="h-0.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-violet-600 to-blue-500 rounded-full" />
        </div>
        <Link
          href="/dashboard/settings"
          className="mt-2 text-[10px] text-violet-400/80 hover:text-violet-300 transition-colors block"
        >
          Upgrade to Pro →
        </Link>
      </div>

      {/* Bottom */}
      <div className="px-2 pb-3 border-t border-white/[0.05] pt-2 space-y-0.5">
        {BOTTOM_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group relative",
                active
                  ? "bg-violet-500/12 text-violet-300"
                  : "text-white/30 hover:text-white/65 hover:bg-white/[0.04]"
              )}
            >
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-violet-500 rounded-full" />}
              <span className={cn(active ? "text-violet-400" : "text-white/20 group-hover:text-white/45")}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        {/* User */}
        <div className="flex items-center gap-2.5 px-2.5 py-2 mt-1 rounded-lg hover:bg-white/[0.04] cursor-pointer transition-all group">
          <div className="size-6 rounded-full bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">F</div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium text-white/60 truncate">Founder</div>
            <div className="text-[9px] text-white/25 truncate">Starter Plan</div>
          </div>
          <svg className="size-3 text-white/15 group-hover:text-white/35 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
        </div>
      </div>
    </aside>
  );
}
