"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Zap, FolderOpen, FileText, Users,
  MessageSquare, Bot, BookOpen, Settings, HelpCircle,
  X, ChevronRight, TrendingUp,
} from "lucide-react";

const NAV = [
  { label: "Обзор",          href: "/dashboard",            exact: true, icon: LayoutDashboard },
  { label: "Новый анализ",   href: "/dashboard/new",        icon: Zap,   accent: true },
  { label: "Проекты",        href: "/dashboard/projects",   icon: FolderOpen },
  { label: "Отчёты",         href: "/dashboard/reports",    icon: FileText },
  { label: "AI Директора",   href: "/dashboard/executives", icon: Users },
  { label: "AI Чат",         href: "/dashboard/chat",       icon: MessageSquare },
  { label: "AI Агенты",      href: "/dashboard/agents",     icon: Bot },
  { label: "Блокнот",        href: "/dashboard/notepad",    icon: BookOpen },
];

const BOTTOM = [
  { label: "Настройки",  href: "/dashboard/settings", icon: Settings  },
  { label: "Поддержка",  href: "/dashboard/support",  icon: HelpCircle },
];

interface SidebarProps { isOpen?: boolean; onClose?: () => void; }

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [projectCount, setProjectCount] = useState<number | null>(null);

  const projectLimit = 3;

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(d => { if (d.success) setProjectCount(d.data?.kpis?.projects?.total ?? 0); })
      .catch(() => {});
  }, []);

  const userName    = session?.user?.name ?? "Founder";
  const userInitial = userName.charAt(0).toUpperCase();
  const usedPct     = projectCount != null ? Math.min(100, (projectCount / projectLimit) * 100) : 33;
  const usedCount   = projectCount ?? 1;

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className={cn("dashboard-sidebar flex flex-col", isOpen && "sidebar-open")}
      style={{
        width: 240,
        background: "#07080D",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Logo */}
      <div style={{ height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
        <Link href="/" onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 30, height: 30, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            boxShadow: "0 4px 12px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>Apex AI</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 2 }}>Executive Board</div>
          </div>
        </Link>
        <button onClick={onClose} className="lg:hidden" style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
          <X size={14} />
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>

        {/* Primary actions */}
        <div style={{ marginBottom: 4 }}>
          {NAV.slice(0, 2).map(item => {
            const active = isActive(item.href, item.exact);
            const Icon   = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={onClose} style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "9px 12px", borderRadius: 10, marginBottom: 2,
                fontSize: 13, fontWeight: active ? 600 : 500, textDecoration: "none",
                color: active ? "#fff" : item.accent ? "rgba(99,102,241,0.85)" : "rgba(255,255,255,0.45)",
                background: active ? "rgba(99,102,241,0.12)" : item.accent ? "rgba(99,102,241,0.06)" : "transparent",
                border: `1px solid ${active ? "rgba(99,102,241,0.2)" : item.accent ? "rgba(99,102,241,0.1)" : "transparent"}`,
                transition: "all 0.15s",
                position: "relative",
              }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = item.accent ? "rgba(99,102,241,0.85)" : "rgba(255,255,255,0.45)"; }}
              >
                {active && <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 18, borderRadius: 2, background: "#6366f1" }} />}
                <Icon size={14} style={{ color: active ? "#6366f1" : item.accent ? "#6366f1" : "rgba(255,255,255,0.28)", flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.accent && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#6366f1", animation: "sb-pulse 2s ease-in-out infinite" }} />}
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "8px 4px 10px" }} />

        {/* Other items */}
        <div>
          {NAV.slice(2).map(item => {
            const active = isActive(item.href, item.exact);
            const Icon   = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={onClose} style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "8px 12px", borderRadius: 10, marginBottom: 1,
                fontSize: 13, fontWeight: active ? 600 : 400, textDecoration: "none",
                color: active ? "#fff" : "rgba(255,255,255,0.4)",
                background: active ? "rgba(99,102,241,0.1)" : "transparent",
                border: `1px solid ${active ? "rgba(99,102,241,0.18)" : "transparent"}`,
                transition: "all 0.15s", position: "relative",
              }}
                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; } }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; (e.currentTarget as HTMLElement).style.background = "transparent"; } }}
              >
                {active && <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 16, borderRadius: 2, background: "#6366f1" }} />}
                <Icon size={13} style={{ color: active ? "#6366f1" : "rgba(255,255,255,0.22)", flexShrink: 0 }} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Upgrade card */}
      <div style={{ margin: "0 10px 10px", padding: "12px 14px", borderRadius: 12, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.14)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>Проекты</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", fontVariantNumeric: "tabular-nums" }}>{usedCount} / {projectLimit}</span>
        </div>
        <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
          <div style={{ width: `${usedPct}%`, height: "100%", background: "linear-gradient(90deg, #6366f1, #8b5cf6)", borderRadius: 4, transition: "width 0.8s ease" }} />
        </div>
        <Link href="/dashboard/settings" onClick={onClose} style={{
          display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600,
          color: "#6366f1", textDecoration: "none",
        }}>
          <TrendingUp size={11} />
          Перейти на Pro →
        </Link>
      </div>

      {/* Bottom */}
      <div style={{ padding: "8px 10px 12px", borderTop: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
        {BOTTOM.map(item => {
          const active = isActive(item.href);
          const Icon   = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={onClose} style={{
              display: "flex", alignItems: "center", gap: 9, padding: "8px 12px", borderRadius: 10, marginBottom: 1,
              fontSize: 13, fontWeight: active ? 600 : 400, textDecoration: "none",
              color: active ? "#fff" : "rgba(255,255,255,0.35)",
              background: active ? "rgba(99,102,241,0.1)" : "transparent",
              border: `1px solid ${active ? "rgba(99,102,241,0.18)" : "transparent"}`,
              transition: "all 0.15s",
            }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"; }}
            >
              <Icon size={13} style={{ color: active ? "#6366f1" : "rgba(255,255,255,0.2)", flexShrink: 0 }} />
              {item.label}
            </Link>
          );
        })}

        {/* User row */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 12px", marginTop: 4, borderRadius: 10, cursor: "pointer" }}>
          <div style={{ width: 28, height: 28, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg, #6366f1, #4f46e5)", flexShrink: 0 }}>
            {userInitial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.65)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", marginTop: 1 }}>Starter Plan</div>
          </div>
          <ChevronRight size={12} style={{ color: "rgba(255,255,255,0.15)", flexShrink: 0 }} />
        </div>
      </div>

      <style>{`@keyframes sb-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </aside>
  );
}
