"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

type Status = "verifying" | "success" | "error" | "idle";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>(token ? "verifying" : "idle");
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/auth/verify-email", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }),
        });
        const d = await r.json();
        if (cancelled) return;
        if (r.ok && d.success) { setStatus("success"); setMessage(d.email ? `Email ${d.email} подтверждён` : "Email подтверждён"); }
        else { setStatus("error"); setMessage(d.error || "Ссылка недействительна или истекла"); }
      } catch {
        if (!cancelled) { setStatus("error"); setMessage("Ошибка сети — попробуйте ещё раз"); }
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const resend = async () => {
    if (!resendEmail.trim()) return;
    setResending(true);
    try {
      await fetch("/api/auth/verify-email/resend", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: resendEmail.trim() }),
      });
      setResent(true);
    } catch { /* generic — stay quiet */ }
    finally { setResending(false); }
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%", height: 44, padding: "0 14px", borderRadius: 10,
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)",
    color: "#fff", fontSize: 14, outline: "none",
    fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#05060A", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, position: "relative", overflow: "hidden" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div aria-hidden style={{ position: "absolute", top: "38%", left: "50%", transform: "translate(-50%,-50%)", width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.10), transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 400 }}
      >
        <div style={{ borderRadius: 16, overflow: "hidden", background: "rgba(10,11,18,0.85)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 70px rgba(0,0,0,0.6)" }}>
          <div className="term-mono" style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            <span style={{ display: "flex", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", opacity: 0.7 }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b", opacity: 0.7 }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", opacity: 0.7 }} />
            </span>
            <span style={{ marginLeft: 6, fontSize: 11, letterSpacing: "0.14em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>vertlix — email verification</span>
          </div>

          <div style={{ padding: "32px 24px 28px", textAlign: "center" }}>
            {status === "verifying" && (
              <>
                <span style={{ width: 42, height: 42, display: "inline-block", border: "3px solid rgba(124,58,237,0.25)", borderTopColor: "#7C3AED", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: 18 }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: "#E5E7EB" }}>Подтверждаем email…</div>
              </>
            )}

            {status === "success" && (
              <>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#E5E7EB", letterSpacing: "-0.01em", marginBottom: 8 }}>Email подтверждён</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 22 }}>{message}. Аккаунт активирован — можно входить.</div>
                <Link href="/login" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 44, padding: "0 22px", borderRadius: 10, background: "linear-gradient(135deg,#7C3AED,#6D28D9)", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none", boxShadow: "0 6px 20px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.16)" }}>
                  Перейти ко входу →
                </Link>
              </>
            )}

            {(status === "error" || status === "idle") && (
              <>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z" opacity="0" /><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#E5E7EB", letterSpacing: "-0.01em", marginBottom: 8 }}>
                  {status === "error" ? "Не удалось подтвердить" : "Подтверждение email"}
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 20 }}>
                  {status === "error" ? message : "Введите ваш email, и мы отправим ссылку для подтверждения ещё раз."}
                </div>

                {resent ? (
                  <div className="term-mono" style={{ fontSize: 12, color: "#10b981", padding: "10px 12px", borderRadius: 10, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
                    ✓ Если аккаунт существует и не подтверждён — письмо отправлено. Проверьте почту.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <input type="email" placeholder="you@example.com" value={resendEmail}
                      onChange={e => setResendEmail(e.target.value)} style={fieldStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.55)"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; }} />
                    <button onClick={resend} disabled={resending || !resendEmail.trim()}
                      className="term-mono"
                      style={{ height: 44, borderRadius: 10, border: "none", cursor: resending || !resendEmail.trim() ? "default" : "pointer",
                        background: resendEmail.trim() ? "linear-gradient(135deg,#7C3AED,#6D28D9)" : "rgba(255,255,255,0.06)", color: "#fff",
                        fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      {resending ? <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> : "Отправить ссылку"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 12 }}>
          <Link href="/login" style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>← Назад ко входу</Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}
