"use client";

import Link from "next/link";
import { XCircle, RotateCcw } from "lucide-react";

// ─── /payment/failed — оплата не прошла или истекла ───────────────────────────

const ACCENT = "#6366f1";
const RGB = "99,102,241";

export default function PaymentFailedPage() {
  return (
    <main style={{ minHeight: "100dvh", background: "#05060A", color: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 460, width: "100%", borderRadius: 22, padding: "40px 32px", textAlign: "center", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <XCircle size={30} style={{ color: "#f87171" }} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 10px", color: "#fff" }}>Оплата не прошла</h1>
        <p style={{ fontSize: 14.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, margin: "0 0 8px" }}>
          Платёж отменён, истёк срок счёта или перевод не был завершён. Деньги не списаны — либо вернутся на твой кошелёк.
        </p>
        <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, margin: "0 0 24px" }}>
          Попробуй ещё раз — счёт создаётся заново за пару секунд.
        </p>
        <Link href="/dashboard/billing" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 48, padding: "0 26px", borderRadius: 13, fontSize: 15, fontWeight: 700, textDecoration: "none", color: "#fff", background: `linear-gradient(135deg,${ACCENT},#4f46e5)`, boxShadow: `0 8px 24px rgba(${RGB},0.4)` }}>
          <RotateCcw size={16} /> Попробовать снова
        </Link>
      </div>
    </main>
  );
}
