"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const CARD = { width: "min(420px, 100%)", borderRadius: 20, background: "rgba(13,15,23,0.9)", border: "1px solid rgba(255,255,255,0.09)", padding: 28, boxShadow: "0 32px 80px rgba(0,0,0,0.6)" } as const;
const field: React.CSSProperties = { width: "100%", height: 46, padding: "0 14px", borderRadius: 11, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" };

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    try {
      await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    } catch { /* ignore */ }
    setBusy(false);
    setSent(true);
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#05060A", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} style={CARD}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#7C3AED,#6D28D9)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 18px rgba(124,58,237,0.4)" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </span>
          <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 14, fontWeight: 700, color: "#fff" }}>VERTLIX AI</span>
        </div>

        {sent ? (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: "14px 0 8px" }}>Проверьте почту</h1>
            <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: 0 }}>
              Если аккаунт с адресом <b style={{ color: "rgba(255,255,255,0.8)" }}>{email}</b> существует, мы отправили ссылку для сброса пароля. Она действует 1 час.
            </p>
            <Link href="/login" style={{ display: "inline-block", marginTop: 20, fontSize: 13, color: "#818cf8", fontWeight: 600, textDecoration: "none" }}>← Вернуться ко входу</Link>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: "14px 0 6px" }}>Забыли пароль?</h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: "0 0 20px" }}>
              Введите email — пришлём ссылку для установки нового пароля.
            </p>
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={field}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)")} onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")} />
              <button type="submit" disabled={busy || !email.trim()}
                style={{ height: 46, borderRadius: 11, border: "none", cursor: busy || !email.trim() ? "default" : "pointer", fontSize: 14, fontWeight: 700, color: "#fff",
                  background: busy || !email.trim() ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#7C3AED,#6D28D9)", boxShadow: busy || !email.trim() ? "none" : "0 6px 20px rgba(124,58,237,0.35)" }}>
                {busy ? "Отправляем…" : "Отправить ссылку"}
              </button>
            </form>
            <p style={{ fontSize: 11, lineHeight: 1.6, color: "rgba(255,255,255,0.3)", margin: "12px 0 0" }}>
              Отправляя форму, вы соглашаетесь на обработку email для восстановления доступа —{" "}
              <Link href="/legal/privacy" style={{ color: "rgba(165,180,252,0.8)", textDecoration: "none" }}>политика конфиденциальности</Link>.
            </p>
            <Link href="/login" style={{ display: "inline-block", marginTop: 16, fontSize: 12.5, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>← Вернуться ко входу</Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
