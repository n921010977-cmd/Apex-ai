"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { track, EVENTS } from "@/lib/analytics/events";

const BOOT_LINES = [
  "> vertlix kernel v2.0 · initializing…",
  "> executive board · 20 AI agents ready",
  "> secure registration channel · open",
  "> создайте аккаунт оператора_",
];

const STRENGTH_LABELS = ["", "Слабый", "Средний", "Хороший", "Сильный"];
const STRENGTH_COLORS = ["", "#ef4444", "#f59e0b", "#6366f1", "#10b981"];

function getStrength(p: string) {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return Math.min(s, 4);
}

export default function RegisterPage() {
  const router = useRouter();

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);
  const [bootCount, setBootCount] = useState(0);
  const [showPass,  setShowPass]  = useState(false);

  useEffect(() => {
    if (bootCount >= BOOT_LINES.length) return;
    const t = setTimeout(() => setBootCount(c => c + 1), 380);
    return () => clearTimeout(t);
  }, [bootCount]);

  const strength = getStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password) {
      setError("ACCESS DENIED · заполните все поля");
      return;
    }
    if (password.length < 8) {
      setError("ACCESS DENIED · пароль минимум 8 символов");
      return;
    }
    if (!/[a-zа-яё]/i.test(password) || !/[0-9]/.test(password)) {
      setError("ACCESS DENIED · пароль должен содержать буквы и цифры");
      return;
    }
    if (password !== confirm) {
      setError("ACCESS DENIED · пароли не совпадают");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(`ACCESS DENIED · ${data.error ?? "ошибка сервера"}`);
      setLoading(false);
      return;
    }

    setSuccess(true);
    track(EVENTS.SIGN_UP, { method: "credentials" });

    // Auto sign-in after registration
    await signIn("credentials", {
      name: name.trim(),
      email: email.trim(),
      password,
      redirect: false,
    });

    setTimeout(() => router.push("/dashboard"), 1400);
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%", height: 44, padding: "0 14px", borderRadius: 10,
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)",
    color: "#fff", fontSize: 14, outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.15s, box-shadow 0.15s",
    boxSizing: "border-box",
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "rgba(99,102,241,0.55)";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)";
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div style={{ minHeight: "100vh", background: "#05060A", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes scanline { from { transform: translateY(-100%); } to { transform: translateY(100vh); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes reg-in { from{opacity:0;transform:scale(1.3)} to{opacity:1;transform:scale(1)} }
        ::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>

      {/* Ambient glow */}
      <div aria-hidden style={{ position: "absolute", top: "38%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.09), transparent 70%)", filter: "blur(70px)", pointerEvents: "none" }} />
      <div aria-hidden style={{ position: "absolute", bottom: "10%", right: "15%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.06), transparent 70%)", filter: "blur(50px)", pointerEvents: "none" }} />

      {/* Scanline */}
      <div aria-hidden style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)", animation: "scanline 7s linear infinite", pointerEvents: "none", zIndex: 1 }} />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 420 }}
      >
        {/* Window */}
        <div style={{ borderRadius: 16, overflow: "hidden", background: "rgba(10,11,18,0.88)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 28px 80px rgba(0,0,0,0.65)" }}>

          {/* Title bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}>
            <span style={{ display: "flex", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", opacity: 0.7 }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b", opacity: 0.7 }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", opacity: 0.7 }} />
            </span>
            <span style={{ marginLeft: 6, fontSize: 11, letterSpacing: "0.14em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>vertlix — new operator</span>
            <Link href="/" style={{ marginLeft: "auto", fontSize: 10, color: "rgba(255,255,255,0.3)", textDecoration: "none", letterSpacing: "0.1em" }}>[esc] на главную</Link>
          </div>

          {/* Boot log */}
          <div style={{ padding: "16px 16px 8px", fontSize: 11.5, lineHeight: 1.9, color: "rgba(16,185,129,0.75)", minHeight: 96, fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}>
            {BOOT_LINES.slice(0, bootCount).map((l, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
                {l}{i === bootCount - 1 && i === BOOT_LINES.length - 1 && (
                  <span style={{ animation: "blink 1s step-end infinite" }}>▋</span>
                )}
              </motion.div>
            ))}
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ padding: "24px 24px 32px", textAlign: "center" }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </motion.div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Аккаунт создан</div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                  Входим в систему…
                </p>
                <div style={{ marginTop: 16, width: 24, height: 24, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "16px auto 0" }} />
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ padding: "8px 20px 24px", display: "flex", flexDirection: "column", gap: 14 }}
              >
                {/* Name */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 }}>
                  <label style={{ display: "block", marginBottom: 7, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(99,102,241,0.75)", fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}>
                    &gt; OPERATOR
                  </label>
                  <input
                    type="text" placeholder="никнейм"
                    value={name} onChange={e => setName(e.target.value)}
                    style={fieldStyle} onFocus={onFocus} onBlur={onBlur}
                    autoComplete="username"
                  />
                </motion.div>

                {/* Email */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}>
                  <label style={{ display: "block", marginBottom: 7, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(99,102,241,0.75)", fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}>
                    &gt; EMAIL
                  </label>
                  <input
                    type="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    style={fieldStyle} onFocus={onFocus} onBlur={onBlur}
                    autoComplete="email"
                  />
                </motion.div>

                {/* Password */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 }}>
                  <label style={{ display: "block", marginBottom: 7, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(99,102,241,0.75)", fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}>
                    &gt; PASSKEY
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPass ? "text" : "password"} placeholder="••••••••"
                      value={password} onChange={e => setPassword(e.target.value)}
                      style={{ ...fieldStyle, paddingRight: 42 }} onFocus={onFocus} onBlur={onBlur}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0, display: "flex" }}
                    >
                      {showPass ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {password && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 8 }}>
                      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} style={{ flex: 1, height: 2, borderRadius: 2, background: i <= strength ? STRENGTH_COLORS[strength] : "rgba(255,255,255,0.08)", transition: "background 0.3s" }} />
                        ))}
                      </div>
                      <div style={{ fontSize: 10, color: STRENGTH_COLORS[strength], fontWeight: 600 }}>{STRENGTH_LABELS[strength]}</div>
                    </motion.div>
                  )}
                </motion.div>

                {/* Confirm password */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.7 }}>
                  <label style={{ display: "block", marginBottom: 7, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(99,102,241,0.75)", fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}>
                    &gt; CONFIRM
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPass ? "text" : "password"} placeholder="повторите пароль"
                      value={confirm} onChange={e => setConfirm(e.target.value)}
                      style={{
                        ...fieldStyle,
                        borderColor: confirm && confirm !== password ? "rgba(239,68,68,0.4)" : confirm && confirm === password ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.09)",
                      }}
                      onFocus={onFocus} onBlur={onBlur}
                      autoComplete="new-password"
                    />
                    {confirm && (
                      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
                        {confirm === password ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" width="14" height="14"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        )}
                      </span>
                    )}
                  </div>
                </motion.div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", fontSize: 11, color: "#f87171", letterSpacing: "0.04em", fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  type="submit" disabled={loading}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.9 }}
                  whileHover={{ y: -1 }} whileTap={{ y: 0 }}
                  style={{
                    height: 46, borderRadius: 10, border: "none", cursor: loading ? "default" : "pointer",
                    background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff",
                    fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
                    boxShadow: "0 6px 20px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.16)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4,
                    fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                  }}
                >
                  {loading
                    ? <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    : <>▸ Создать аккаунт</>}
                </motion.button>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "2px 0" }}>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>ИЛИ</span>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
                </div>

                {/* Login link */}
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Уже есть аккаунт? </span>
                  <Link href="/login" style={{ fontSize: 12, color: "#818cf8", fontWeight: 600, textDecoration: "none" }}>
                    Войти →
                  </Link>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div style={{ textAlign: "center", marginTop: 14, fontSize: 10, color: "rgba(255,255,255,0.18)", letterSpacing: "0.1em", fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}>
          VERTLIX // COMMAND CENTER · SECURE REGISTRATION
        </div>
      </motion.div>
    </div>
  );
}
