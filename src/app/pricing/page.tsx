import type { Metadata } from "next";
import Link from "next/link";
import { PricingCards } from "@/components/landing/PricingCards";

export const metadata: Metadata = {
  // Шаблон корневого layout сам добавит « | Vertlix AI» — дублировать не нужно.
  title: "Pricing",
  description: "Three Vertlix AI plans: Starter $29, Pro $39, Max $49. Transparent limits, cancel anytime.",
  alternates: { canonical: "/pricing" },
};

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ limit?: string }> }) {
  const { limit } = await searchParams;
  return (
    <main style={{ minHeight: "100dvh", background: "#05060A", color: "#fff" }}>
      {limit && (
        <div style={{ background: "rgba(245,158,11,0.1)", borderBottom: "1px solid rgba(245,158,11,0.25)", padding: "12px 24px", textAlign: "center", color: "#fbbf24", fontSize: 13.5, fontWeight: 600 }}>
          You have reached your plan limit. Upgrade to continue.
        </div>
      )}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#6366f1,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(99,102,241,0.35)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "0.02em" }}>VERTLIX AI</span>
        </Link>
        <Link href="/dashboard" style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>
          ← Back to dashboard
        </Link>
      </header>
      <PricingCards asPageHeading />
    </main>
  );
}
