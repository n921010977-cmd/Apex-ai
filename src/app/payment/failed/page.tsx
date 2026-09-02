"use client";

import Link from "next/link";
import { XCircle, RotateCcw } from "lucide-react";

// ─── /payment/failed — оплата не прошла или истекла ───────────────────────────

const ACCENT = "#7C3AED";
const RGB = "124,58,237";

export default function PaymentFailedPage() {
  return (
    <main style={{ minHeight: "100dvh", background: "#05060A", color: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 460, width: "100%", borderRadius: 22, padding: "40px 32px", textAlign: "center", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <XCircle size={30} style={{ color: "#f87171" }} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 10px", color: "#fff" }}>Payment failed</h1>
        <p style={{ fontSize: 14.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, margin: "0 0 8px" }}>
          The payment was cancelled, the invoice expired or the transfer wasn\u2019t completed. No money was taken — or it will return to your wallet.
        </p>
        <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, margin: "0 0 24px" }}>
          Try again — a new invoice takes a couple of seconds.
        </p>
        <Link href="/dashboard/billing" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 48, padding: "0 26px", borderRadius: 13, fontSize: 15, fontWeight: 700, textDecoration: "none", color: "#fff", background: `linear-gradient(135deg,${ACCENT},#6D28D9)`, boxShadow: `0 8px 24px rgba(${RGB},0.4)` }}>
          <RotateCcw size={16} /> Try again
        </Link>
      </div>
    </main>
  );
}
