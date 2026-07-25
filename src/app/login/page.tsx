"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { startAuthentication } from "@simplewebauthn/browser";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { track, EVENTS } from "@/lib/analytics/events";

const BOOT_LINES = [
  "> initializing vertlix kernel…",
  "> loading executive board · 20 agents",
  "> secure channel established ✓",
  "> awaiting operator credentials_",
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [totpCode, setTotpCode] = useState("");

  // Boot sequence reveal
  const [bootCount, setBootCount] = useState(0);
  useEffect(() => {
    if (bootCount >= BOOT_LINES.length) return;
    const t = setTimeout(() => setBootCount(c => c + 1), 380);
    return () => clearTimeout(t);
  }, [bootCount]);

  // OAuth providers redirect back with `?error=...` on failure (they don't use
  // signIn's redirect:false path the credentials form does) — without this,
  // a failed Google/GitHub sign-in silently dropped the user back on a blank
  // form with no explanation at all.
  useEffect(() => {
    const code = searchParams.get("code") || searchParams.get("error");
    if (!code) return;
    if (code === "RATE_LIMITED") setError("ACCESS DENIED · слишком много попыток входа, попробуйте через 15 минут");
    else if (code === "OAuthAccountNotLinked") setError("ACCESS DENIED · этот email уже зарегистрирован другим способом входа");
    else if (code === "AccessDenied") setError("ACCESS DENIED · доступ отклонён");
    else if (code === "Configuration") setError("ACCESS DENIED · провайдер входа временно недоступен");
    else setError("ACCESS DENIED · вход не выполнен, попробуйте снова");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (needsTotp) {
      if (!/^\d{6}$/.test(totpCode)) { setError("ACCESS DENIED · введите 6-значный код"); return; }
      setLoading("credentials");
      setError("");
      const res = await signIn("credentials", { name, email, password, totpCode, redirect: false, callbackUrl });
      setLoading(null);
      if (res?.error === "2FA_INVALID") { setError("ACCESS DENIED · неверный код 2FA"); setTotpCode(""); }
      else if (res?.error === "RATE_LIMITED") setError("ACCESS DENIED · слишком много попыток входа, попробуйте через 15 минут");
      else if (res?.error) setError("ACCESS DENIED · вход не выполнен, попробуйте снова");
      else { track(EVENTS.SIGN_IN, { method: "credentials" }); router.push(callbackUrl); router.refresh(); }
      return;
    }

    if (!name || !email || !password) { setError("ACCESS DENIED · заполните все поля"); return; }
    if (password.length < 6) { setError("ACCESS DENIED · пароль минимум 6 символов"); return; }
    setLoading("credentials");
    setError("");
    const res = await signIn("credentials", { name, email, password, redirect: false, callbackUrl });
    setLoading(null);
    if (res?.error === "2FA_REQUIRED") { setNeedsTotp(true); setError(""); }
    else if (res?.error === "RATE_LIMITED") setError("ACCESS DENIED · слишком много попыток входа, попробуйте через 15 минут");
    else if (res?.error) setError("ACCESS DENIED · неверный email или пароль");
    else { track(EVENTS.SIGN_IN, { method: "credentials" }); router.push(callbackUrl); router.refresh(); }
  };

  // ── Passkey (WebAuthn) sign-in ────────────────────────────────────────
  const handlePasskey = async () => {
    const target = email.trim().toLowerCase();
    if (!target) { setError("ACCESS DENIED · введите email для входа по passkey"); return; }
    setLoading("passkey");
    setError("");
    try {
      const optRes = await fetch("/api/auth/passkey/auth/options", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: target }),
      });
      const optData = await optRes.json();
      if (!optRes.ok || !optData.success) {
        setLoading(null);
        setError(optRes.status === 404 ? "ACCESS DENIED · у этого аккаунта нет passkey" : "ACCESS DENIED · не удалось начать вход");
        return;
      }
      const assertion = await startAuthentication(optData.options);
      const res = await signIn("passkey", { email: target, response: JSON.stringify(assertion), redirect: false, callbackUrl });
      setLoading(null);
      if (res?.error) { setError("ACCESS DENIED · passkey не подтверждён"); return; }
      track(EVENTS.SIGN_IN, { method: "passkey" });
      router.push(callbackUrl); router.refresh();
    } catch {
      setLoading(null);
      setError("ACCESS DENIED · вход по passkey отменён");
    }
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%", height: 44, padding: "0 14px", borderRadius: 10,
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)",
    color: "#fff", fontSize: 14, outline: "none",
    fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.55)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.boxShadow = "none"; };

  return (
    <div className="term-grid" style={{ minHeight: "100vh", background: "#05060A", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes scanline { from { transform: translateY(-100%); } to { transform: translateY(100vh); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ambient + scanline */}
      <div aria-hidden style={{ position: "absolute", top: "38%", left: "50%", transform: "translate(-50%,-50%)", width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.10), transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />
      <div aria-hidden style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.35), transparent)", animation: "scanline 6s linear infinite", pointerEvents: "none", zIndex: 1 }} />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 400 }}
      >
        {/* Terminal window */}
        <div style={{ borderRadius: 16, overflow: "hidden", background: "rgba(10,11,18,0.85)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 70px rgba(0,0,0,0.6)" }}>
          {/* Title bar */}
          <div className="term-mono" style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            <span style={{ display: "flex", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", opacity: 0.7 }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b", opacity: 0.7 }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", opacity: 0.7 }} />
            </span>
            <span style={{ marginLeft: 6, fontSize: 11, letterSpacing: "0.14em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>vertlix — access console</span>
            <Link href="/" style={{ marginLeft: "auto", fontSize: 10, color: "rgba(255,255,255,0.3)", textDecoration: "none", letterSpacing: "0.1em" }}>[esc] на главную</Link>
          </div>

          {/* Boot log */}
          <div className="term-mono" style={{ padding: "16px 16px 8px", fontSize: 11.5, lineHeight: 1.9, color: "rgba(16,185,129,0.75)", minHeight: 92 }}>
            {BOOT_LINES.slice(0, bootCount).map((l, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
                {l}{i === bootCount - 1 && i === BOOT_LINES.length - 1 && <span className="term-blink">▋</span>}
              </motion.div>
            ))}
          </div>

          {/* OAuth */}
          <div style={{ padding: "8px 20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
            <button type="button" onClick={() => { track(EVENTS.SIGN_IN, { method: "google" }); signIn("google", { callbackUrl }); }}
              style={{ height: 46, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "#fff", color: "#1f2328", fontSize: 13.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <svg width="17" height="17" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C39.9 36.3 44 30.8 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
              Продолжить с Google
            </button>
            <button type="button" onClick={() => { track(EVENTS.SIGN_IN, { method: "github" }); signIn("github", { callbackUrl }); }}
              style={{ height: 46, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2 0 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 016 0C17 4.6 18 5 18 5c.6 1.6.2 2.8 0 3.2.9.8 1.3 1.9 1.3 3.1 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1 .9 2.2v3.3c0 .3.1.7.8.6A12 12 0 0012 .3"/></svg>
              Продолжить с GitHub
            </button>
            <button type="button" onClick={handlePasskey} disabled={!!loading}
              style={{ height: 46, borderRadius: 10, border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.08)", color: "#c7d2fe", fontSize: 13.5, fontWeight: 600, cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              {loading === "passkey"
                ? <span style={{ width: 15, height: 15, border: "2px solid rgba(199,210,254,0.35)", borderTopColor: "#c7d2fe", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="8" r="5"/><path d="M2 21a8 8 0 0 1 10.434-7.62"/><circle cx="18" cy="18" r="3"/><path d="M18 14v1M18 21v1M22 18h-1M15 18h-1M20.5 15.5l-.7.7M16.2 19.8l-.7.7M20.5 20.5l-.7-.7M16.2 16.2l-.7-.7"/></svg>}
              Войти по passkey
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              <span className="term-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>ИЛИ EMAIL</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleCredentials} style={{ padding: "0 20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
            {needsTotp ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <label className="term-label" style={{ display: "block", marginBottom: 7, color: "rgba(99,102,241,0.75)" }}>&gt; 2FA CODE</label>
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginBottom: 10, lineHeight: 1.5 }}>
                  Введите код из приложения-аутентификатора или резервный код
                </div>
                <input type="text" inputMode="numeric" placeholder="000000" value={totpCode}
                  onChange={e => setTotpCode(e.target.value.replace(/[^0-9A-Za-z-]/g, "").slice(0, 12))}
                  style={{ ...fieldStyle, textAlign: "center", letterSpacing: "0.3em", fontSize: 18 }}
                  onFocus={onFocus} onBlur={onBlur} autoFocus />
                <button type="button" onClick={() => { setNeedsTotp(false); setTotpCode(""); setError(""); }}
                  style={{ marginTop: 10, fontSize: 11.5, color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  ← Назад к паролю
                </button>
              </motion.div>
            ) : [
              { key: "name", label: "> OPERATOR", type: "text", ph: "никнейм", val: name, set: setName },
              { key: "email", label: "> EMAIL", type: "email", ph: "you@example.com", val: email, set: setEmail },
              { key: "pass", label: "> PASSKEY", type: "password", ph: "••••••••", val: password, set: setPassword },
            ].map((f, i) => (
              <motion.div key={f.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 + i * 0.1 }}>
                <label className="term-label" style={{ display: "block", marginBottom: 7, color: "rgba(99,102,241,0.75)" }}>{f.label}</label>
                <input type={f.type} placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} style={fieldStyle} onFocus={onFocus} onBlur={onBlur} />
              </motion.div>
            ))}

            {error && (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                className="term-mono" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", fontSize: 11, color: "#f87171", letterSpacing: "0.04em" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit" disabled={!!loading}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8 }}
              whileHover={{ y: -1 }} whileTap={{ y: 0 }}
              className="term-mono"
              style={{
                height: 46, borderRadius: 10, border: "none", cursor: loading ? "default" : "pointer",
                background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff",
                fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
                boxShadow: "0 6px 20px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.16)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4,
              }}
            >
              {loading === "credentials"
                ? <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                : <>▸ {needsTotp ? "Confirm 2FA" : "Authenticate"}</>}
            </motion.button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: 10 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Нет аккаунта? </span>
          <Link href="/register" style={{ fontSize: 12, color: "#818cf8", fontWeight: 600, textDecoration: "none" }}>
            Зарегистрироваться →
          </Link>
        </div>
        <div style={{ textAlign: "center", marginTop: 6 }}>
          <Link href="/forgot-password" style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>
            Забыли пароль?
          </Link>
        </div>
        <div className="term-mono" style={{ textAlign: "center", marginTop: 10, fontSize: 10, color: "rgba(255,255,255,0.22)", letterSpacing: "0.1em" }}>
          VERTLIX // COMMAND CENTER · SECURE SESSION
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
