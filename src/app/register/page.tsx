"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { track, EVENTS } from "@/lib/analytics/events";

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
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
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);
  const [showPass,  setShowPass]  = useState(false);
  const [consent,   setConsent]   = useState(false);

  const strength = getStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!/[a-zа-яё]/i.test(password) || !/[0-9]/.test(password)) {
      setError("Password must contain letters and digits");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (!consent) {
      setError("Please confirm consent to data processing");
      return;
    }

    setLoading(true);

    // Без try/catch любой сбой сети, таймаут или не-JSON ответ сервера обрывал
    // выполнение здесь молча: setLoading(false) не вызывался, ошибка не
    // показывалась — пользователь видел, что кнопка «ничего не делает».
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      let data: { error?: string } = {};
      try {
        data = await res.json();
      } catch {
        // Сервер ответил не-JSON (например, HTML-страница ошибки с edge/proxy).
      }

      if (!res.ok) {
        setError(data.error ?? "Server error, please try again");
        setLoading(false);
        return;
      }

      setSuccess(true);
      track(EVENTS.SIGN_UP, { method: "credentials" });

      // Вход сразу после регистрации. redirect:true обязателен: при redirect:false
      // клиент next-auth в этой конфигурации не сохраняет cookie сессии, и человек
      // после регистрации оказывался снова на экране входа. С redirect:true сервер
      // отдаёт 302 с Set-Cookie и сам уводит на /dashboard — надёжно.
      await signIn("credentials", {
        name: name.trim(),
        email: email.trim(),
        password,
        callbackUrl: "/dashboard",
      });
    } catch {
      setError("Network error, please try again");
      setLoading(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%", height: 44, padding: "0 14px", borderRadius: 10,
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)",
    color: "#fff", fontSize: 14, outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.15s, box-shadow 0.15s",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", marginBottom: 6, fontSize: 11.5, fontWeight: 600,
    letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)",
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
    <div style={{ minHeight: "100vh", background: "#05060A", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        ::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>

      {/* Мягкое амбиентное свечение */}
      <div aria-hidden style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 640, height: 640, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.09), transparent 70%)", filter: "blur(70px)", pointerEvents: "none" }} />

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 420 }}
      >
        {/* Бренд */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#6366f1,#4f46e5)", boxShadow: "0 4px 16px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.18)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" aria-hidden>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.12em", color: "#fff" }}>VERTLIX AI</span>
        </div>

        <div style={{ borderRadius: 20, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 1px 2px rgba(0,0,0,0.4), 0 24px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.045)", padding: "26px 24px" }}>
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ padding: "16px 0 8px", textAlign: "center" }}
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
                <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Account created</div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>Signing you in…</p>
                <div style={{ marginTop: 16, width: 24, height: 24, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "16px auto 0" }} />
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em", color: "#fff", margin: "0 0 4px", textAlign: "center" }}>Create your account</h1>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "0 0 22px", textAlign: "center" }}>20 AI executives, ready to work for you</p>

                {/* OAuth */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
                  <button type="button" onClick={() => { track(EVENTS.SIGN_UP, { method: "google" }); signIn("google", { callbackUrl: "/dashboard" }); }}
                    style={{ height: 46, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <svg width="17" height="17" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C39.9 36.3 44 30.8 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
                    Continue with Google
                  </button>
                  <button type="button" onClick={() => { track(EVENTS.SIGN_UP, { method: "github" }); signIn("github", { callbackUrl: "/dashboard" }); }}
                    style={{ height: 46, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2 0 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 016 0C17 4.6 18 5 18 5c.6 1.6.2 2.8 0 3.2.9.8 1.3 1.9 1.3 3.1 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1 .9 2.2v3.3c0 .3.1.7.8.6A12 12 0 0012 .3"/></svg>
                    Continue with GitHub
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 18px" }}>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                  <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>or with email</span>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Name</label>
                    <input
                      type="text" placeholder="Your name"
                      value={name} onChange={e => setName(e.target.value)}
                      style={fieldStyle} onFocus={onFocus} onBlur={onBlur}
                      autoComplete="username"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Email</label>
                    <input
                      type="email" placeholder="you@example.com"
                      value={email} onChange={e => setEmail(e.target.value)}
                      style={fieldStyle} onFocus={onFocus} onBlur={onBlur}
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPass ? "text" : "password"} placeholder="••••••••"
                        value={password} onChange={e => setPassword(e.target.value)}
                        style={{ ...fieldStyle, paddingRight: 42 }} onFocus={onFocus} onBlur={onBlur}
                        autoComplete="new-password"
                      />
                      <button
                        type="button" aria-label={showPass ? "Hide password" : "Show password"}
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
                  </div>

                  <div>
                    <label style={labelStyle}>Confirm password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPass ? "text" : "password"} placeholder="Repeat password"
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
                  </div>

                  <label htmlFor="consent" style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", userSelect: "none" }}>
                    <input
                      id="consent" type="checkbox" checked={consent}
                      onChange={e => setConsent(e.target.checked)}
                      style={{ marginTop: 2, width: 16, height: 16, accentColor: "#6366f1", cursor: "pointer", flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 12, lineHeight: 1.55, color: "rgba(255,255,255,0.55)" }}>
                      I consent to the processing of my personal data (email, technical data and AI requests) to create an account and operate the Service, and I accept the{" "}
                      <Link href="/legal/consent" target="_blank" style={{ color: "#a5b4fc", textDecoration: "none" }}>Consent</Link>,{" "}
                      <Link href="/legal/terms" target="_blank" style={{ color: "#a5b4fc", textDecoration: "none" }}>Terms</Link> and{" "}
                      <Link href="/legal/privacy" target="_blank" style={{ color: "#a5b4fc", textDecoration: "none" }}>Privacy Policy</Link>.
                    </span>
                  </label>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                        style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", fontSize: 12.5, lineHeight: 1.5, color: "#f87171" }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit" disabled={loading}
                    style={{
                      height: 48, borderRadius: 12, border: "none", cursor: loading ? "default" : "pointer",
                      background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff",
                      fontSize: 14.5, fontWeight: 700,
                      boxShadow: "0 6px 20px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.16)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 2,
                    }}
                  >
                    {loading
                      ? <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                      : "Create account"}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Already have an account? </span>
          <Link href="/login" style={{ fontSize: 13, color: "#a5b4fc", fontWeight: 600, textDecoration: "none" }}>Sign in →</Link>
        </div>
      </motion.div>
    </div>
  );
}
