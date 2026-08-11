"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// ─── Пинг активности ──────────────────────────────────────────────────────────
// Шлёт /api/track/ping при смене страницы (не чаще раза в 15 сек на путь) —
// сервер сам решает, продлить сессию или открыть новую. Никаких mouse-move и
// пиксельного трекинга; ошибки сети молча игнорируются.

export function AnalyticsPing() {
  const pathname = usePathname();
  const last = useRef<{ path: string; ts: number }>({ path: "", ts: 0 });

  useEffect(() => {
    const now = Date.now();
    if (last.current.path === pathname && now - last.current.ts < 15_000) return;
    last.current = { path: pathname, ts: now };
    fetch("/api/track/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
