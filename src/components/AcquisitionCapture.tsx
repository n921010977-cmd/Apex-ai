"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// ─── Захват источника привлечения ─────────────────────────────────────────────
// Первое касание сохраняем в cookie (живёт 90 дней) ДО регистрации — чтобы путь
// «TikTok → лендинг → регистрация» не потерялся. При появлении сессии сервер
// перенесёт источник в профиль (см. /api/track/ping).
// Никаких сторонних трекеров: только собственная cookie.

const COOKIE = "vertlix_acq";

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

export function AcquisitionCapture() {
  const pathname = usePathname();

  useEffect(() => {
    if (readCookie(COOKIE)) return; // первое касание уже записано

    const q = new URLSearchParams(window.location.search);
    const acq = {
      utm_source: q.get("utm_source") ?? undefined,
      utm_medium: q.get("utm_medium") ?? undefined,
      utm_campaign: q.get("utm_campaign") ?? undefined,
      utm_content: q.get("utm_content") ?? undefined,
      utm_term: q.get("utm_term") ?? undefined,
      // Реферальная ссылка вида /?ref=CODE — код попадает в тот же cookie
      // первого касания и привязывается к профилю при регистрации.
      ref: q.get("ref")?.slice(0, 16).toUpperCase() ?? undefined,
      landing_page: window.location.pathname,
      // Внешний реферер (переходы внутри сайта не считаем источником).
      referrer: document.referrer && !document.referrer.includes(window.location.host)
        ? document.referrer : undefined,
    };

    const hasAny = Object.entries(acq).some(([k, v]) => v && k !== "landing_page");
    // Пишем даже «прямой» заход — тогда в статистике он станет "direct".
    document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(acq))}; path=/; max-age=${90 * 24 * 3600}; SameSite=Lax`;

    // Событие визита (для верха воронки) — анонимно, с меткой первого касания.
    fetch("/api/track/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: window.location.pathname,
        hasUtm: hasAny,
        // На публичных страницах визит — это верх воронки (landing_view).
        landing: window.location.pathname === "/" || window.location.pathname === "/pricing",
      }),
      keepalive: true,
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
