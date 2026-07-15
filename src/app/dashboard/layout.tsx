"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopNav } from "@/components/dashboard/TopNav";
import { ToastProvider } from "@/components/ui/Toast";
import { OnboardingModal } from "@/components/dashboard/OnboardingModal";
import { CommandPalette } from "@/components/dashboard/CommandPalette";
import { AgentTicker } from "@/components/dashboard/AgentTicker";

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
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                style={{ minHeight: "100%" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* First-run onboarding */}
        <OnboardingModal />
        {/* Global command palette ⌘K */}
        <CommandPalette />
        {/* Live agent activity ticker */}
        <AgentTicker />
      </div>
    </ToastProvider>
  );
}
