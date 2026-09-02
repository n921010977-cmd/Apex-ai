"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Clock, ArrowRight } from "lucide-react";
import { PLAN_BY_ID, type PlanId } from "@/lib/plans";

// ─── /payment/success — возврат с OxaPay после оплаты ─────────────────────────
// ВАЖНО: сам факт возврата сюда успехом НЕ считается. Страница опрашивает
// сервер (/api/usage) и объявляет успех только когда webhook реально включил
// тариф. До этого показывает «подтверждаем в сети».

const ACCENT = "#7C3AED";
const RGB = "124,58,237";

type State = "checking" | "active" | "slow" | "unauthed";

export default function PaymentSuccessPage() {
  const [state, setState] = useState<State>("checking");
  const [plan, setPlan] = useState<PlanId | null>(null);
  const tries = useRef(0);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const poll = async () => {
      tries.current++;
      try {
        const r = await fetch("/api/usage", { cache: "no-store" });
        if (r.status === 401) { setState("unauthed"); if (timer) clearInterval(timer); return; }
        const d = await r.json();
        if (d?.success && d.plan && d.plan !== "none") {
          setPlan(d.plan); setState("active");
          if (timer) clearInterval(timer);
          return;
        }
      } catch { /* сеть мигнула — продолжаем опрашивать */ }
      if (tries.current >= 40) { setState("slow"); if (timer) clearInterval(timer); } // ~2 минуты
    };
    poll();
    timer = setInterval(poll, 3000);
    return () => { if (timer) clearInterval(timer); };
  }, []);

  return (
    <main style={{ minHeight: "100dvh", background: "#05060A", color: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "inherit" }}>
      <div style={{ maxWidth: 460, width: "100%", borderRadius: 22, padding: "40px 32px", textAlign: "center", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}>

        {state === "checking" && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: 18, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${RGB},0.12)`, border: `1px solid rgba(${RGB},0.3)` }}>
              <Loader2 size={28} style={{ color: "#a5b4fc", animation: "spin 1s linear infinite" }} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 10px", color: "#fff" }}>Confirming your payment…</h1>
            <p style={{ fontSize: 14.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: 0 }}>
              Crypto payments take 1–3 minutes to confirm on-chain. Your plan will activate automatically — no need to refresh.
            </p>
          </>
        )}

        {state === "active" && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: 18, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)" }}>
              <CheckCircle2 size={30} style={{ color: "#34d399" }} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 10px", color: "#fff" }}>
              Payment confirmed — {plan ? PLAN_BY_ID[plan].name : ""} plan is active 🎉
            </h1>
            <p style={{ fontSize: 14.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: "0 0 24px" }}>
              Everything in your plan is now unlocked. Thanks for being with us!
            </p>
            <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 48, padding: "0 26px", borderRadius: 13, fontSize: 15, fontWeight: 700, textDecoration: "none", color: "#fff", background: `linear-gradient(135deg,${ACCENT},#6D28D9)`, boxShadow: `0 8px 24px rgba(${RGB},0.4)` }}>
              Go to dashboard <ArrowRight size={16} />
            </Link>
          </>
        )}

        {state === "slow" && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: 18, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)" }}>
              <Clock size={28} style={{ color: "#fbbf24" }} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 10px", color: "#fff" }}>Payment is still confirming</h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: "0 0 20px" }}>
              The network can be slow — confirmation sometimes takes up to 30 minutes. Your plan will activate on its own once the payment confirms. Check back shortly.
            </p>
            <Link href="/payment/pending" style={{ fontSize: 13.5, fontWeight: 600, color: "#a5b4fc" }}>What\u2019s happening with my payment →</Link>
          </>
        )}

        {state === "unauthed" && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 10px", color: "#fff" }}>Sign in to see the status</h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: "0 0 20px" }}>
              Your payment is processed on the server regardless of sign-in. Sign in with the account you paid from and you\u2019ll see the plan active.
            </p>
            <Link href="/login?callbackUrl=/payment/success" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 46, padding: "0 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none", color: "#fff", background: `linear-gradient(135deg,${ACCENT},#6D28D9)` }}>
              Sign in
            </Link>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
