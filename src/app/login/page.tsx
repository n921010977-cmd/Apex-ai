"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

const BOOT_LINES = [
  "> initializing apex kernel…",
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

  // Boot sequence reveal
  const [bootCount, setBootCount] = useState(0);
  useEffect(() => {
    if (bootCount >= BOOT_LINES.length) return;
    const t = setTimeout(() => setBootCount(c => c + 1), 380);
    return () => clearTimeout(t);
  }, [bootCount]);

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { setError("ACCESS DENIED · заполните все поля"); return; }
    if (password.length < 6) { setError("ACCESS DENIED · пароль минимум 6 символов"); return; }
    setLoading("credentials");
    setError("");
    const res = await signIn("credentials", { name, email, password, redirect: false, callbackUrl });
    setLoading(null);
    if (res?.error) setError("ACCESS DENIED · неверный email или пароль");
    else { router.push(callbackUrl); router.refresh(); }
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
            <span style={{ marginLeft: 6, fontSize: 11, letterSpacing: "0.14em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>apex — access console</span>
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

          {/* Form */}
          <form onSubmit={handleCredentials} style={{ padding: "8px 20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
            {[
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
                : <>▸ Authenticate</>}
            </motion.button>
          </form>
        </div>

        <div className="term-mono" style={{ textAlign: "center", marginTop: 14, fontSize: 10, color: "rgba(255,255,255,0.22)", letterSpacing: "0.1em" }}>
          APEX // COMMAND CENTER · SECURE SESSION
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
