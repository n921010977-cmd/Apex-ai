"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) return { toast: () => {} }; // no-op if provider is absent
  return ctx;
}

const STYLES: Record<ToastKind, { color: string; bg: string; Icon: typeof CheckCircle }> = {
  success: { color: "#10b981", bg: "rgba(16,185,129,0.12)", Icon: CheckCircle },
  error:   { color: "#ef4444", bg: "rgba(239,68,68,0.12)",  Icon: AlertTriangle },
  info:    { color: "#6366f1", bg: "rgba(99,102,241,0.12)", Icon: Info },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, kind, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10, maxWidth: "calc(100vw - 40px)" }}>
        <AnimatePresence>
          {toasts.map(t => {
            const s = STYLES[t.kind];
            const Icon = s.Icon;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  display: "flex", alignItems: "center", gap: 12, minWidth: 260, maxWidth: 380,
                  padding: "12px 14px", borderRadius: 12, background: "#0e0f17",
                  border: `1px solid ${s.color}33`,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.045)",
                }}
              >
                <div style={{ width: 30, height: 30, borderRadius: 9, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={15} color={s.color} />
                </div>
                <span style={{ flex: 1, fontSize: 13, color: "#E5E7EB", lineHeight: 1.4, fontFamily: "system-ui,-apple-system,sans-serif" }}>{t.message}</span>
                <button onClick={() => dismiss(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 2, flexShrink: 0 }}>
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
