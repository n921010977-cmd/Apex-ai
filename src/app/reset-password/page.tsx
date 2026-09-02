"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

const CARD = { width: "min(420px, 100%)", borderRadius: 20, background: "rgba(13,15,23,0.9)", border: "1px solid rgba(255,255,255,0.09)", padding: 28, boxShadow: "0 32px 80px rgba(0,0,0,0.6)" } as const;
const field: React.CSSProperties = { width: "100%", height: 46, padding: "0 14px", borderRadius: 11, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" };

function ResetForm() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") ?? "";
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (pw.length < 6) { setError("Пароль минимум 6 символов"); return; }
    if (pw !== pw2) { setError("Пароли не совпадают"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password: pw }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setError(j.error || "Не удалось сбросить пароль"); setBusy(false); return; }
      setDone(true);
      setTimeout(() => router.push("/login"), 2200);
    } catch {
      setError("Ошибка соединения");
      setBusy(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} style={CARD}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#7C3AED,#6D28D9)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 18px rgba(124,58,237,0.4)" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </span>
        <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 14, fontWeight: 700, color: "#fff" }}>VERTLIX AI</span>
      </div>

      {done ? (
        <>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: "14px 0 8px" }}>Пароль обновлён ✓</h1>
          <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: 0 }}>Перенаправляем ко входу…</p>
        </>
      ) : !token ? (
        <>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: "14px 0 8px" }}>Ссылка некорректна</h1>
          <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: 0 }}>Токен отсутствует. Запросите сброс пароля заново.</p>
          <Link href="/forgot-password" style={{ display: "inline-block", marginTop: 18, fontSize: 13, color: "#818cf8", fontWeight: 600, textDecoration: "none" }}>Запросить ссылку →</Link>
        </>
      ) : (
        <>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: "14px 0 6px" }}>Новый пароль</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: "0 0 20px" }}>Придумайте новый пароль для вашего аккаунта.</p>
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input type="password" required value={pw} onChange={e => setPw(e.target.value)} placeholder="Новый пароль" style={field}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)")} onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")} />
            <input type="password" required value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Повторите пароль" style={field}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)")} onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")} />
            {error && (
              <div style={{ fontSize: 12, color: "#f87171", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "9px 12px" }}>{error}</div>
            )}
            <button type="submit" disabled={busy}
              style={{ height: 46, borderRadius: 11, border: "none", cursor: busy ? "default" : "pointer", fontSize: 14, fontWeight: 700, color: "#fff",
                background: busy ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#7C3AED,#6D28D9)", boxShadow: busy ? "none" : "0 6px 20px rgba(124,58,237,0.35)" }}>
              {busy ? "Сохраняем…" : "Установить пароль"}
            </button>
          </form>
        </>
      )}
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div style={{ minHeight: "100dvh", background: "#05060A", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
