"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock } from "lucide-react";

// ─── /payment/pending — платёж отправлен, ждём подтверждения сети ─────────────
// Тихо опрашивает сервер и, как только webhook включит тариф, уводит на success.

export default function PaymentPendingPage() {
  const router = useRouter();
  const tries = useRef(0);

  useEffect(() => {
    const t = setInterval(async () => {
      tries.current++;
      try {
        const r = await fetch("/api/usage", { cache: "no-store" });
        const d = await r.json().catch(() => null);
        if (d?.success && d.plan && d.plan !== "none") { clearInterval(t); router.replace("/payment/success"); }
      } catch { /* продолжаем */ }
      if (tries.current > 200) clearInterval(t); // ~10 минут
    }, 3000);
    return () => clearInterval(t);
  }, [router]);

  return (
    <main style={{ minHeight: "100dvh", background: "#05060A", color: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 460, width: "100%", borderRadius: 22, padding: "40px 32px", textAlign: "center", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)" }}>
          <Clock size={28} style={{ color: "#fbbf24" }} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 10px", color: "#fff" }}>Payment in progress</h1>
        <p style={{ fontSize: 14.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, margin: "0 0 8px" }}>
          The transfer has been sent and is waiting for blockchain confirmation. Usually 1–3 minutes; up to 30 when the network is busy.
        </p>
        <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, margin: "0 0 22px" }}>
          As soon as the network confirms the payment, your plan activates automatically — we check every few seconds.
        </p>
        <Link href="/dashboard/billing" style={{ fontSize: 13.5, fontWeight: 600, color: "#a5b4fc" }}>← Back to pricing</Link>
      </div>
    </main>
  );
}
