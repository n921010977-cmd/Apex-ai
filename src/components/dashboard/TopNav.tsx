"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/new": "Новая стратегия",
  "/dashboard/projects": "Мои проекты",
  "/dashboard/reports": "Отчёты",
  "/dashboard/executives": "Исполнительный совет",
  "/dashboard/analytics": "Аналитика",
  "/dashboard/notepad": "Блокнот",
  "/dashboard/settings": "Настройки",
  "/dashboard/support": "Поддержка",
};

export function TopNav() {
  const pathname = usePathname();
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const pageLabel = Object.entries(ROUTE_LABELS).find(([k]) =>
    k === pathname || pathname.startsWith(k + "/")
  )?.[1] ?? "Dashboard";

  return (
    <header className="h-14 flex-shrink-0 flex items-center gap-4 px-6 border-b border-white/[0.05] bg-[#080808]/80 backdrop-blur-xl sticky top-0 z-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-white/30 flex-shrink-0">
        <span>Apex AI</span>
        <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        <span className="text-white/60 font-medium">{pageLabel}</span>
      </div>

      {/* Search */}
      <div className={`relative flex-1 max-w-sm transition-all duration-200 ${searchFocused ? "max-w-md" : ""}`}>
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-white/25 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          type="text"
          placeholder="Поиск проектов…"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="w-full h-8 bg-white/[0.04] border border-white/[0.06] rounded-lg text-xs text-white/70 placeholder:text-white/20 pl-9 pr-4 focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.06] transition-all"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-white/15 font-mono">⌘K</kbd>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* New Strategy shortcut */}
        <Link
          href="/dashboard/new"
          className="hidden sm:flex items-center gap-1.5 h-7 px-3 text-xs font-medium bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-lg hover:from-violet-500 hover:to-blue-500 transition-all"
        >
          <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Новая
        </Link>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative size-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-violet-500" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-10 w-80 bg-[#111] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Уведомления</span>
                <span className="text-[10px] text-violet-400 cursor-pointer hover:text-violet-300">Все прочитаны</span>
              </div>
              {[
                { title: "Анализ завершён", desc: "AI-Powered Fitness Platform готов", time: "2ч назад", dot: "bg-emerald-500" },
                { title: "Новый отчёт доступен", desc: "SaaS Invoice Platform — финансовый анализ", time: "Вчера", dot: "bg-blue-500" },
              ].map((n, i) => (
                <div key={i} className="px-4 py-3 hover:bg-white/[0.03] cursor-pointer flex items-start gap-3 border-b border-white/[0.04] last:border-0">
                  <span className={`mt-1.5 size-1.5 rounded-full flex-shrink-0 ${n.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white mb-0.5">{n.title}</div>
                    <div className="text-[11px] text-white/40 truncate">{n.desc}</div>
                  </div>
                  <span className="text-[10px] text-white/25 flex-shrink-0">{n.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="flex items-center gap-2 pl-2 ml-1 border-l border-white/[0.06]">
          <div className="size-7 rounded-full bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center text-xs font-bold text-white">F</div>
          <div className="hidden sm:block">
            <div className="text-xs font-medium text-white/70 leading-tight">Founder</div>
            <div className="text-[10px] text-white/25">Starter</div>
          </div>
          <svg className="size-3.5 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
        </div>
      </div>
    </header>
  );
}
