"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Search, Bell, Plus, Cpu } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard":            "Dashboard",
  "/dashboard/new":        "Новая стратегия",
  "/dashboard/projects":   "Мои проекты",
  "/dashboard/reports":    "Отчёты",
  "/dashboard/executives": "Исполнительный совет",
  "/dashboard/analytics":  "Аналитика",
  "/dashboard/notepad":    "Блокнот",
  "/dashboard/settings":   "Настройки",
  "/dashboard/support":    "Поддержка",
};

export function TopNav() {
  const pathname    = usePathname();
  const [focused,   setFocused]   = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const pageLabel = Object.entries(ROUTE_LABELS).find(([k]) =>
    k === pathname || pathname.startsWith(k + "/")
  )?.[1] ?? "Dashboard";

  return (
    <header
      className="h-[58px] flex-shrink-0 flex items-center gap-4 px-6 sticky top-0 z-20"
      style={{
        background:   "rgba(8,9,12,0.85)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-shrink-0" style={{ fontSize: 12, color: "rgba(255,255,255,0.28)" }}>
        <Cpu size={13} style={{ color: "rgba(122,92,255,0.6)" }} />
        <span>Apex AI</span>
        <span style={{ color: "rgba(255,255,255,0.14)" }}>›</span>
        <span style={{ color: "rgba(255,255,255,0.62)", fontWeight: 500 }}>{pageLabel}</span>
      </div>

      {/* AI Search */}
      <div className={`relative flex-1 max-w-xs transition-all duration-300 ${focused ? "max-w-md" : ""}`}>
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "rgba(255,255,255,0.22)" }}
        />
        <input
          type="text"
          placeholder="Поиск проектов, агентов, стратегий…"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full focus:outline-none transition-all"
          style={{
            height:          32,
            background:      focused ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
            border:          `1px solid ${focused ? "rgba(122,92,255,0.35)" : "rgba(255,255,255,0.06)"}`,
            borderRadius:    10,
            paddingLeft:     32,
            paddingRight:    48,
            fontSize:        12,
            color:           "rgba(255,255,255,0.7)",
          }}
        />
        <kbd
          className="absolute right-3 top-1/2 -translate-y-1/2 font-mono"
          style={{ fontSize: 9, color: "rgba(255,255,255,0.15)" }}
        >
          ⌘K
        </kbd>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 ml-auto">
        {/* New button */}
        <Link
          href="/dashboard/new"
          className="hidden sm:flex items-center gap-1.5 font-semibold text-white transition-all hover:-translate-y-px"
          style={{
            height:     30,
            padding:    "0 12px",
            borderRadius: 9,
            fontSize:   12,
            background: "linear-gradient(135deg, #7A5CFF, #5A8DFF)",
            boxShadow:  "0 4px 14px rgba(122,92,255,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
          }}
        >
          <Plus size={12} strokeWidth={2.5} />
          Новая
        </Link>

        {/* AI status dot */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 h-8 rounded-lg"
          style={{ background: "rgba(0,231,167,0.05)", border: "1px solid rgba(0,231,167,0.12)" }}
        >
          <span
            className="size-1.5 rounded-full"
            style={{ background: "#00E7A7", boxShadow: "0 0 6px rgba(0,231,167,0.8)", animation: "tn-pulse 2s ease-in-out infinite" }}
          />
          <span style={{ fontSize: 10, fontWeight: 600, color: "#00E7A7" }}>AI Active</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative size-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.05]"
            style={{ color: "rgba(255,255,255,0.32)" }}
          >
            <Bell size={15} />
            <span
              className="absolute top-1.5 right-1.5 size-1.5 rounded-full"
              style={{ background: "#7A5CFF", boxShadow: "0 0 5px rgba(122,92,255,0.8)" }}
            />
          </button>

          {notifOpen && (
            <div
              className="absolute right-0 top-11 w-80 overflow-hidden z-50"
              style={{
                background:   "#0E1015",
                border:       "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                boxShadow:    "0 24px 64px rgba(0,0,0,0.6)",
              }}
            >
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>Уведомления</span>
                <span style={{ fontSize: 10, color: "rgba(122,92,255,0.8)", cursor: "pointer" }}>Прочитать всё</span>
              </div>
              {[
                { title: "Стратегический анализ готов", desc: "AI-Powered Fitness Platform — 94 балла", time: "2ч", dot: "#00E7A7" },
                { title: "Новый конкурент обнаружен", desc: "Sector: B2B SaaS · Funding: $12M", time: "5ч", dot: "#FFB800" },
                { title: "Финансовая модель обновлена", desc: "SaaS Invoice Platform — Q2 прогноз", time: "Вчера", dot: "#5A8DFF" },
              ].map((n, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-all hover:bg-white/[0.03]"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <span className="size-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: n.dot, boxShadow: `0 0 6px ${n.dot}` }} />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{n.desc}</div>
                  </div>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", flexShrink: 0 }}>{n.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile */}
        <div
          className="flex items-center gap-2 pl-3 cursor-pointer"
          style={{ borderLeft: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div
            className="size-7 rounded-xl flex items-center justify-center text-[11px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, #7A5CFF, #5A8DFF)", boxShadow: "0 2px 10px rgba(122,92,255,0.4)" }}
          >
            F
          </div>
          <div className="hidden sm:block leading-tight">
            <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.72)" }}>Founder</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>Starter</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tn-pulse { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
      `}</style>
    </header>
  );
}
