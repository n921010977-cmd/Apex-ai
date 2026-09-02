"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ minHeight: "100vh", background: "#05060A", color: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui,-apple-system,sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Что-то пошло не так</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 28 }}>
          Произошла непредвиденная ошибка. Попробуйте повторить действие — если проблема сохраняется, обновите страницу.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={reset}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 24px", borderRadius: 12, background: "linear-gradient(135deg, #7C3AED, #6D28D9)", color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)" }}>
            Повторить
          </button>
          <a href="/dashboard"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 24px", borderRadius: 12, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,255,255,0.1)" }}>
            На дашборд
          </a>
        </div>
      </div>
    </div>
  );
}
