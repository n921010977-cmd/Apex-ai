"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg> },
  { label: "New Strategy", href: "/dashboard/new", accent: true, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg> },
  { label: "My Projects", href: "/dashboard/projects", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" /></svg> },
  { label: "Reports", href: "/dashboard/reports", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg> },
  { label: "Executive Board", href: "/dashboard/executives", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
  { label: "Analytics", href: "/dashboard/analytics", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg> },
  { label: "Блокнот", href: "/dashboard/notepad", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg> },
];

const BOTTOM_ITEMS = [
  { label: "Settings", href: "/dashboard/settings", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg> },
  { label: "Help & Support", href: "/dashboard/support", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg> },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-screen sticky top-0 border-r border-white/[0.06] bg-[#0a0a0a]">
      <div className="h-16 flex items-center px-5 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <svg className="size-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-bold text-white leading-tight">Business CC</div>
            <div className="text-[9px] text-white/30 tracking-wider uppercase">Command Center</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group",
                isActive ? "bg-violet-500/15 text-violet-300 border border-violet-500/20"
                  : item.accent ? "text-violet-400 hover:bg-violet-500/10 hover:text-violet-300"
                  : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
              )}
            >
              <span className={cn(isActive ? "text-violet-400" : item.accent ? "text-violet-500" : "text-white/30 group-hover:text-white/60")}>
                {item.icon}
              </span>
              {item.label}
              {item.accent && <span className="ml-auto size-1.5 rounded-full bg-violet-500 animate-pulse" />}
            </Link>
          );
        })}
      </nav>

      <div className="mx-3 mb-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/40">Monthly Reports</span>
          <span className="text-xs font-semibold text-white">1 / 3</span>
        </div>
        <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-violet-600 to-blue-500 rounded-full" />
        </div>
        <a href="#" className="mt-2 text-[10px] text-violet-400 hover:text-violet-300 transition-colors block">Upgrade to Pro →</a>
      </div>

      <div className="px-3 pb-4 space-y-0.5 border-t border-white/[0.06] pt-3">
        {BOTTOM_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-all duration-200 group">
            <span className="text-white/25 group-hover:text-white/50">{item.icon}</span>
            {item.label}
          </Link>
        ))}
        <div className="flex items-center gap-3 px-3 py-2.5 mt-2 rounded-xl hover:bg-white/[0.04] cursor-pointer transition-all duration-200 group">
          <div className="size-7 rounded-full bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">F</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white/70 truncate">Founder</div>
            <div className="text-[10px] text-white/25 truncate">Starter Plan</div>
          </div>
          <svg className="size-3.5 text-white/20 group-hover:text-white/40 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
        </div>
      </div>
    </aside>
  );
}
