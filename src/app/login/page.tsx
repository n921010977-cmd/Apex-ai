"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { startAuthentication } from "@simplewebauthn/browser";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { track, EVENTS } from "@/lib/analytics/events";

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

  // OAuth providers redirect back with `?error=...` on failure (they don't use
  // signIn's redirect:false path the credentials form does) — without this,
  // a failed Google/GitHub sign-in silently dropped the user back on a blank
  // form with no explanation at all.
  useEffect(() => {
    const code = searchParams.get("code") || searchParams.get("error");
    if (!code) return;
    if (code === "RATE_LIMITED") setError("Too many sign-in attempts, try again in 15 minutes");
    else if (code === "OAuthAccountNotLinked") setError("This email is already registered with a different sign-in method");
    else if (code === "AccessDenied") setError("Access denied");
    else if (code === "Configuration") setError("Sign-in provider temporarily unavailable");
    else setError("Sign-in failed, please try again");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (needsTotp) {
      if (!/^\d{6}$/.test(totpCode)) { setError("Enter the 6-digit code"); return; }
      setLoading("credentials");
      setError("");
      const res = await signIn("credentials", { name, email, password, totpCode, redirect: false, callbackUrl });
      setLoading(null);
      if (res?.error === "2FA_INVALID") { setError("Invalid 2FA code"); setTotpCode(""); }
      else if (res?.error === "RATE_LIMITED") setError("Too many sign-in attempts, try again in 15 minutes");
      else if (res?.error) setError("Sign-in failed, please try again");
      else { track(EVENTS.SIGN_IN, { method: "credentials" }); router.push(callbackUrl); router.refresh(); }
      return;
    }

    if (!name || !email || !password) { setError("Please fill in all fields"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading("credentials");
    setError("");
    const res = await signIn("credentials", { name, email, password, redirect: false, callbackUrl });
    setLoading(null);
    if (res?.error === "2FA_REQUIRED") { setNeedsTotp(true); setError(""); }
    else if (res?.error === "RATE_LIMITED") setError("Too many sign-in attempts, try again in 15 minutes");
    else if (res?.error) setError("Invalid email or password");
    else { track(EVENTS.SIGN_IN, { method: "credentials" }); router.push(callbackUrl); router.refresh(); }
  };

  // ── Вход без регистрации ──────────────────────────────────────────────
  const handleGuest = async () => {
    setLoading("guest");
    setError("");
    const res = await signIn("guest", { redirect: false, callbackUrl });
    setLoading(null);
    if (res?.error) {
      setError(res.error === "RATE_LIMITED"
        ? "Too many attempts, try again later"
        : "Guest sign-in unavailable");
      return;
    }
    track(EVENTS.SIGN_IN, { method: "guest" });
    router.push(callbackUrl);
    router.refresh();
  };

  // ── Passkey (WebAuthn) sign-in ────────────────────────────────────────
  const handlePasskey = async () => {
    const target = email.trim().toLowerCase();
    if (!target) { setError("Enter your email to sign in with a passkey"); return; }
    setLoading("passkey");
    setError("");
    try {
      const optRes = await fetch("/api/auth/passkey/auth/options", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: target }),
      });
      const optData = await optRes.json();
      if (!optRes.ok || !optData.success) {
        setLoading(null);
        setError(optRes.status === 404 ? "This account has no passkey" : "Could not start sign-in");
        return;
      }
      const assertion = await startAuthentication(optData.options);
      const res = await signIn("passkey", { email: target, response: JSON.stringify(assertion), redirect: false, callbackUrl });
      setLoading(null);
      if (res?.error) { setError("Passkey not confirmed"); return; }
      track(EVENTS.SIGN_IN, { method: "passkey" });
      router.push(callbackUrl); router.refresh();
    } catch {
      setLoading(null);
      setError("Passkey sign-in cancelled");
    }
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%", height: 44, padding: "0 14px", borderRadius: 10,
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)",
    color: "#fff", fontSize: 14, outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.55)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.boxShadow = "none"; };

  return (
    <div style={{ minHeight: "100vh", background: "#05060A", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px", position: "relative", overflow: "hidden" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Мягкое амбиентное свечение — единственный декоративный элемент */}
      <div aria-hidden style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 640, height: 640, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.09), transparent 70%)", filter: "blur(70px)", pointerEvents: "none" }} />

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 400 }}
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
          <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em", color: "#fff", margin: "0 0 4px", textAlign: "center" }}>Welcome back</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "0 0 22px", textAlign: "center" }}>Sign in to your AI executive board</p>

          {/* Способы входа */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button type="button" onClick={() => { track(EVENTS.SIGN_IN, { method: "google" }); signIn("google", { callbackUrl }); }}
              style={{ height: 46, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <svg width="17" height="17" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C39.9 36.3 44 30.8 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
              Continue with Google
            </button>
            <button type="button" onClick={() => { track(EVENTS.SIGN_IN, { method: "github" }); signIn("github", { callbackUrl }); }}
              style={{ height: 46, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2 0 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 016 0C17 4.6 18 5 18 5c.6 1.6.2 2.8 0 3.2.9.8 1.3 1.9 1.3 3.1 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1 .9 2.2v3.3c0 .3.1.7.8.6A12 12 0 0012 .3"/></svg>
              Continue with GitHub
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
            <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>or with email</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
          </div>

          {/* Форма — без анимационных задержек: поля видны сразу */}
          <form onSubmit={handleCredentials} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {needsTotp ? (
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 11.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>2FA code</label>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 10, lineHeight: 1.5 }}>
                  Enter the code from your authenticator app or a backup code
                </div>
                <input type="text" inputMode="numeric" placeholder="000000" value={totpCode}
                  onChange={e => setTotpCode(e.target.value.replace(/[^0-9A-Za-z-]/g, "").slice(0, 12))}
                  style={{ ...fieldStyle, textAlign: "center", letterSpacing: "0.3em", fontSize: 18 }}
                  onFocus={onFocus} onBlur={onBlur} autoFocus />
                <button type="button" onClick={() => { setNeedsTotp(false); setTotpCode(""); setError(""); }}
                  style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.45)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  ← Back to password
                </button>
              </div>
            ) : (
              <>
                {[
                  { key: "name", label: "Name", type: "text", ph: "Your name", val: name, set: setName, ac: "name" },
                  { key: "email", label: "Email", type: "email", ph: "you@example.com", val: email, set: setEmail, ac: "email" },
                  { key: "pass", label: "Password", type: "password", ph: "••••••••", val: password, set: setPassword, ac: "current-password" },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 11.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>{f.label}</label>
                    <input type={f.type} placeholder={f.ph} value={f.val} autoComplete={f.ac}
                      onChange={e => f.set(e.target.value)} style={fieldStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                ))}
              </>
            )}

            {error && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", fontSize: 12.5, lineHeight: 1.5, color: "#f87171" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error.replace(/^ACCESS DENIED · /, "")}
              </div>
            )}

            <button type="submit" disabled={!!loading}
              style={{ height: 48, borderRadius: 12, border: "none", cursor: loading ? "default" : "pointer", background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", fontSize: 14.5, fontWeight: 700, boxShadow: "0 6px 20px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 2 }}>
              {loading === "credentials"
                ? <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                : (needsTotp ? "Confirm 2FA code" : "Sign in")}
            </button>
          </form>

          {/* Вторичные способы */}
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button type="button" onClick={handleGuest} disabled={!!loading}
              style={{ flex: 1, height: 42, borderRadius: 11, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.65)", fontSize: 12.5, fontWeight: 600, cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {loading === "guest"
                ? <span style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                : "Continue as guest"}
            </button>
            <button type="button" onClick={handlePasskey} disabled={!!loading}
              style={{ flex: 1, height: 42, borderRadius: 11, border: "1px solid rgba(99,102,241,0.28)", background: "rgba(99,102,241,0.07)", color: "#c7d2fe", fontSize: 12.5, fontWeight: 600, cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {loading === "passkey"
                ? <span style={{ width: 13, height: 13, border: "2px solid rgba(199,210,254,0.35)", borderTopColor: "#c7d2fe", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                : "Use a passkey"}
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>No account? </span>
          <Link href="/register" style={{ fontSize: 13, color: "#a5b4fc", fontWeight: 600, textDecoration: "none" }}>Sign up →</Link>
          <span style={{ margin: "0 8px", color: "rgba(255,255,255,0.15)" }}>·</span>
          <Link href="/forgot-password" style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Forgot password?</Link>
        </div>
        <p style={{ textAlign: "center", marginTop: 14, fontSize: 11, lineHeight: 1.6, color: "rgba(255,255,255,0.3)" }}>
          By signing in you agree to the{" "}
          <Link href="/legal/offer" style={{ color: "rgba(165,180,252,0.8)", textDecoration: "none" }}>public offer</Link>,{" "}
          <Link href="/legal/terms" style={{ color: "rgba(165,180,252,0.8)", textDecoration: "none" }}>terms</Link> and{" "}
          <Link href="/legal/privacy" style={{ color: "rgba(165,180,252,0.8)", textDecoration: "none" }}>privacy policy</Link>.
        </p>
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
