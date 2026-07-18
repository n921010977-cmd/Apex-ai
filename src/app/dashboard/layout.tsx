"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopNav } from "@/components/dashboard/TopNav";
import { ToastProvider } from "@/components/ui/Toast";
import { OnboardingModal } from "@/components/dashboard/OnboardingModal";
import { CommandPalette } from "@/components/dashboard/CommandPalette";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const openSidebar  = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const pathname = usePathname();

  return (
    <ToastProvider>
      <div style={{ display: "flex", height: "100dvh", background: "#05060A", overflow: "hidden" }}>
        {/* Mobile backdrop */}
        <div
          className={`sidebar-backdrop ${sidebarOpen ? "visible" : ""}`}
          onClick={closeSidebar}
          aria-hidden="true"
        />

        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

        {/* Main content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          <TopNav onMenuClick={openSidebar} />
          <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden", position: "relative" }}>
            {/* Keyed by pathname so a CSS fade replays on each navigation.
                No AnimatePresence/mode="wait" — the incoming page must never be
                blocked by an outgoing page's exit animation (that left tabs blank). */}
            <div key={pathname} className="dash-page-enter" style={{ minHeight: "100%" }}>
              {children}
            </div>
          </main>
        </div>

        {/* First-run onboarding */}
        <OnboardingModal />
        {/* Global command palette ⌘K */}
        <CommandPalette />
      </div>
    </ToastProvider>
  );
}
