"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getConsent, setConsent } from "@/lib/consent";

// Баннер согласия на cookies. Появляется только если выбор ещё не сделан
// (getConsent() === null). Три действия по ТЗ: Принять / Настроить / Отклонить
// необязательные. «Настроить» раскрывает панель с переключателем аналитики —
// необходимые cookies и cookies безопасности всегда включены. Любой выбор
// сохраняется в localStorage и скрывает баннер; провайдер аналитики реагирует
// на изменение сразу (opt-in / opt-out), без перезагрузки.

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  useEffect(() => {
    // Показываем только если выбор ещё не сделан.
    if (getConsent() === null) {
      setVisible(true);
      // следующий тик — чтобы сработала CSS-анимация появления
      requestAnimationFrame(() => requestAnimationFrame(() => setMounted(true)));
    }
  }, []);

  if (!visible) return null;

  const decide = (analyticsChoice: boolean) => {
    setConsent(analyticsChoice);
    setMounted(false);
    setTimeout(() => setVisible(false), 260); // дать доиграть анимации ухода
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 100000,
        display: "flex", justifyContent: "center", padding: "0 16px 16px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          pointerEvents: "auto",
          width: "100%", maxWidth: 560,
          background: "rgba(12,13,20,0.92)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18,
          boxShadow: "0 24px 70px rgba(0,0,0,0.6)",
          padding: 22,
          transform: mounted ? "translateY(0) scale(1)" : "translateY(16px) scale(0.98)",
          opacity: mounted ? 1 : 0,
          transition: "opacity .26s cubic-bezier(0.22,1,0.36,1), transform .26s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Заголовок */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#6366f1,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="15" height="15"><circle cx="12" cy="12" r="9" /><circle cx="9" cy="10" r="1" fill="#fff" /><circle cx="14" cy="14" r="1" fill="#fff" /><circle cx="15" cy="9" r="1" fill="#fff" /></svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Cookies on Vertlix AI</span>
        </div>

        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "rgba(255,255,255,0.65)", margin: "0 0 4px" }}>
          We use cookies to run the site, keep it secure and improve the service.
        </p>
        <p style={{ fontSize: 12.5, lineHeight: 1.55, color: "rgba(255,255,255,0.4)", margin: "0 0 16px" }}>
          Learn more in the <Link href="/legal/cookies" style={{ color: "#a5b4fc", textDecoration: "none" }}>Cookie Policy</Link>.
        </p>

        {/* Панель настроек */}
        {expanded && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16, padding: 14, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <Row
              title="Essential & security"
              desc="Sign-in, attack protection, core site functions. Always on."
              locked
              on
            />
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
            <Row
              title="Analytics"
              desc="Help us understand how the product is used so we can improve it."
              on={analytics}
              onToggle={() => setAnalytics(a => !a)}
            />
          </div>
        )}

        {/* Кнопки */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {!expanded ? (
            <>
              <button onClick={() => decide(true)} style={btnPrimary}>Accept</button>
              <button onClick={() => setExpanded(true)} style={btnGhost}>Customize</button>
              <button onClick={() => decide(false)} style={btnGhost}>Reject non-essential</button>
            </>
          ) : (
            <>
              <button onClick={() => decide(analytics)} style={btnPrimary}>Save choices</button>
              <button onClick={() => decide(true)} style={btnGhost}>Accept all</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ title, desc, on, locked, onToggle }: { title: string; desc: string; on: boolean; locked?: boolean; onToggle?: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{title}</div>
        <div style={{ fontSize: 12, lineHeight: 1.5, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{desc}</div>
      </div>
      <button
        onClick={onToggle}
        disabled={locked}
        aria-pressed={on}
        aria-label={`${title}: ${on ? "on" : "off"}`}
        style={{
          flexShrink: 0, width: 42, height: 24, borderRadius: 999, border: "none",
          background: on ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "rgba(255,255,255,0.14)",
          cursor: locked ? "not-allowed" : "pointer", opacity: locked ? 0.6 : 1,
          position: "relative", transition: "background .2s", padding: 0, marginTop: 2,
        }}
      >
        <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .2s cubic-bezier(0.22,1,0.36,1)" }} />
      </button>
    </div>
  );
}

const btnBase: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, padding: "10px 16px", borderRadius: 11, cursor: "pointer",
  border: "1px solid transparent", transition: "opacity .15s, background .15s, border-color .15s",
};
const btnPrimary: React.CSSProperties = {
  ...btnBase, color: "#fff",
  background: "linear-gradient(135deg,#6366f1,#4f46e5)",
  boxShadow: "0 6px 20px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.16)",
};
const btnGhost: React.CSSProperties = {
  ...btnBase, color: "rgba(255,255,255,0.8)",
  background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.12)",
};
