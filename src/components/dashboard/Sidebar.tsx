"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const CMD_NAV = [
  { label: "Dashboard", href: "/dashboard", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> },
  { label: "Новая стратегия", href: "/dashboard/new", dot: true, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
  { label: "Мои проекты", href: "/dashboard/projects", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg> },
  { label: "Отчёты", href: "/dashboard/reports", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
];

const AI_NAV = [
  { label: "Исполн. совет", href: "/dashboard/executives", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
];

const TOOLS_NAV = [
  { label: "AI Агенты", href: "/dashboard/analytics", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
  { label: "Knowledge Vault", href: "/dashboard/knowledge", dot: true, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
  { label: "Блокнот", href: "/dashboard/notes", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
];

const BOTTOM_ITEMS = [
  { label: "Настройки", href: "/dashboard/settings", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg> },
  { label: "Поддержка", href: "/dashboard/support", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
];

function NavGroup({ label, items, pathname }: { label: string; items: typeof CMD_NAV; pathname: string }) {
  return (
    <div className="mb-4">
      <div className="px-3 mb-1">
        <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-white/20">// {label}</span>
      </div>
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group",
              isActive
                ? "bg-violet-500/15 text-white border border-violet-500/20"
                : "text-white/40 hover:text-white/75 hover:bg-white/[0.04]"
            )}
          >
            <span className={cn("flex-shrink-0", isActive ? "text-violet-400" : "text-white/25 group-hover:text-white/50")}>
              {item.icon}
            </span>
            <span className="flex-1 truncate">{item.label}</span>
            {item.dot && <span className="size-1.5 rounded-full bg-blue-400 flex-shrink-0" />}
            {isActive && (
              <svg className="size-3 text-white/30 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-screen sticky top-0 border-r border-white/[0.06] bg-[#0a0a0a]">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <svg className="size-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div>
            <div className="text-xs font-black text-white leading-tight tracking-wide">APEX // CMD</div>
            <div className="text-[9px] text-white/30 tracking-widest uppercase">Command Center</div>
          </div>
        </Link>
      </div>

      {/* Agents online badge */}
      <div className="px-5 py-3 border-b border-white/[0.04]">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 tracking-wider">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          20 AGENTS · ONLINE
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto space-y-0">
        <NavGroup label="Командный центр" items={CMD_NAV} pathname={pathname} />
        <NavGroup label="AI Система" items={AI_NAV} pathname={pathname} />
        <NavGroup label="Инструменты" items={TOOLS_NAV} pathname={pathname} />
      </nav>

      {/* Projects usage */}
      <div className="mx-3 mb-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-white/35">Проекты использовано</span>
          <span className="text-[10px] font-semibold text-white/60">0 / 3</span>
        </div>
        <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden mb-2">
          <div className="h-full w-0 bg-gradient-to-r from-violet-600 to-blue-500 rounded-full" />
        </div>
        <Link href="#" className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors flex items-center justify-between">
          <span>Upgrade to Pro</span>
          <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </Link>
      </div>

      {/* Bottom */}
      <div className="px-2 pb-3 border-t border-white/[0.06] pt-3 space-y-0.5">
        {BOTTOM_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-all duration-200 group">
            <span className="text-white/25 group-hover:text-white/50">{item.icon}</span>
            {item.label}
          </Link>
        ))}
        <div className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl hover:bg-white/[0.04] cursor-pointer transition-all duration-200 group">
          <div className="size-7 rounded-full bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">1</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white/60 truncate">1</div>
            <div className="text-[9px] text-white/25 uppercase tracking-wider truncate">Starter Plan</div>
          </div>
          <svg className="size-3.5 text-white/20 group-hover:text-white/40 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>
    </aside>
  );
}
