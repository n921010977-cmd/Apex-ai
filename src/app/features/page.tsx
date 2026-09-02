import type { Metadata } from "next";
import Link from "next/link";
import { Users, FileText, Presentation, Target, Bot, Globe, Flag, MessageSquare } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

// SEO-страница по РЕАЛЬНЫМ возможностям продукта. Каждый пункт ниже —
// работающий инструмент в кабинете, а не обещание из будущего роадмапа.

export const metadata: Metadata = {
  title: "Features",
  description: "What Vertlix AI can do: a board of 20 AI directors, strategy, pitch deck with PDF export, 30/60/90 plan, weekly focus, agent library and AI chat.",
  alternates: { canonical: "/features" },
};

const FEATURES = [
  { icon: Users,         title: "Board of 20 AI directors",  what: "A meeting where CEO, CFO, CMO, COO, CTO, lawyer and analyst each examine your project from their own position.", benefit: "You see risks and opportunities invisible to one person." },
  { icon: FileText,      title: "Strategy generation",         what: "Positioning, market, competitors, monetization model and priorities — one coherent document.",           benefit: "Something to take to your team, partners and investors." },
  { icon: Presentation,  title: "Investor pitch deck",      what: "Slides in the classic structure: language and style options, in-browser editing, PDF export.", benefit: "A deck in one evening instead of a week of slides." },
  { icon: Target,        title: "Goals & Plan studio",        what: "A goal becomes a 30/60/90 plan with concrete steps and a completion checklist.",                    benefit: "You know what to do next Monday." },
  { icon: Flag,          title: "Weekly Focus",                what: "The goal tracker picks what to concentrate on this week and shows your velocity.",          benefit: "Tasks stay contained and progress stays visible." },
  { icon: Bot,           title: "AI agent library",       what: "20+ roles — from growth hacker to tax specialist; you can create your own agent.",       benefit: "You ask a specialist, not a generic chatbot." },
  { icon: MessageSquare, title: "AI chat and project review",     what: "Conversations with saved context, notes with summaries, request history.",                               benefit: "Work is never lost between sessions." },
  { icon: Globe,         title: "Fresh market data",       what: "On Pro and Max, answers are enriched with current information from web search.",                          benefit: "Fewer outdated conclusions." },
];

export default function FeaturesPage() {
  return (
    <main style={{ minHeight: "100dvh", background: "#05060A", color: "#fff" }}>
      <Navbar />
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "120px 24px 80px" }}>
        <h1 style={{ fontSize: "clamp(30px,5vw,48px)", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 14px", textWrap: "balance" }}>
          What Vertlix AI can do
        </h1>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)", maxWidth: 640, lineHeight: 1.65, margin: "0 0 48px" }}>
          Eight tools that already work in the dashboard. Nothing on this list is \u201ccoming soon\u201d.
        </p>

        <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 14 }}>
          {FEATURES.map(f => (
            <section key={f.title} style={{ borderRadius: 16, padding: "22px 24px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}>
                <f.icon size={18} color="#a5b4fc" />
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.01em" }}>{f.title}</h2>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "rgba(255,255,255,0.5)", margin: "0 0 10px" }}>{f.what}</p>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: "#a5b4fc", fontWeight: 600, margin: 0 }}>{f.benefit}</p>
            </section>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 40 }}>
          <Link href="/register" style={{ display: "inline-flex", alignItems: "center", height: 50, padding: "0 28px", borderRadius: 13, fontSize: 15, fontWeight: 700, color: "#fff", textDecoration: "none", background: "linear-gradient(135deg,#7C3AED,#6D28D9)", boxShadow: "0 8px 24px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.16)" }}>
            Start free
          </Link>
          <Link href="/pricing" style={{ display: "inline-flex", alignItems: "center", height: 50, padding: "0 26px", borderRadius: 13, fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.75)", textDecoration: "none", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            View pricing
          </Link>
          <Link href="/use-cases" style={{ display: "inline-flex", alignItems: "center", height: 50, padding: "0 26px", borderRadius: 13, fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.75)", textDecoration: "none", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            Use cases
          </Link>
        </div>
      </div>
      <Footer />
      <style>{`@media (max-width: 820px){ .features-grid { grid-template-columns: 1fr !important; } }`}</style>
    </main>
  );
}
