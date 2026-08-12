"use client";

// Отправка событий интерфейса на сервер. Сервер сам берёт user_id из сессии и
// проверяет имя события по белому списку — из браузера подделать нельзя.
export function trackEvent(event: "upgrade_clicked" | "upgrade_started" | "pricing_view", metadata: Record<string, string | number | boolean> = {}) {
  try {
    fetch("/api/track/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, metadata }),
      keepalive: true,
    }).catch(() => {});
  } catch { /* аналитика не мешает работе */ }
}
