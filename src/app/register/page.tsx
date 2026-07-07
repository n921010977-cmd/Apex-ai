"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function RegisterPage() {
  return (
    <div className="term-grid" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#05060A", padding: 16, position: "relative", overflow: "hidden" }}>
      <style>{`@keyframes scanline2 { from { transform: translateY(-100%); } to { transform: translateY(100vh); } }`}</style>
      <div aria-hidden style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.09), transparent 70%)", filter: "blur(60px)" }} />
      <div aria-hidden style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)", animation: "scanline2 7s linear infinite", zIndex: 1 }} />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 420, borderRadius: 16, overflow: "hidden", background: "rgba(10,11,18,0.85)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 70px rgba(0,0,0,0.6)" }}
      >
        <div className="term-mono" style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
          <span style={{ display: "flex", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", opacity: 0.7 }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b", opacity: 0.7 }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", opacity: 0.7 }} />
          </span>
          <span style={{ marginLeft: 6, fontSize: 11, letterSpacing: "0.14em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>apex — registry</span>
        </div>

        <div style={{ padding: "32px 32px 34px", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, margin: "0 auto 20px", background: "linear-gradient(135deg,#6366f1,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(99,102,241,0.4)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="22" height="22"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div className="term-mono" style={{ fontSize: 11, letterSpacing: "0.16em", color: "rgba(245,158,11,0.85)", marginBottom: 12 }}>
            &gt; STATUS: <span className="term-blink">REGISTRATION_LOCKED</span>
          </div>
          <h1 style={{ fontSize: 21, fontWeight: 800, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
            Регистрация временно закрыта
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, margin: "0 0 26px" }}>
            Мы готовимся к запуску.<br/>Новые операторы получат доступ совсем скоро.
          </p>
          <Link href="/login" className="term-mono" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 46, padding: "0 26px", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#4f46e5)", boxShadow: "0 6px 20px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.16)", color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none" }}>
            ▸ Войти в аккаунт
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
