import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

// Сценарии описаны через инструменты, которые реально есть в продукте.
// Никаких кейсов «клиент вырос в 3 раза» — таких данных у нас нет.

export const metadata: Metadata = {
  title: "Use cases",
  description: "How entrepreneurs use Vertlix AI: idea validation, investor prep, launch planning, diagnosing falling metrics and weekly prioritization.",
  alternates: { canonical: "/use-cases" },
};

const CASES = [
  {
    who: "Validating an idea before starting",
    pain: "Unclear whether it deserves your money and six months of your life.",
    how: ["Describe the idea in a project review", "The board delivers a verdict with risks", "The strategy maps the market and the revenue model"],
    tools: "Project review · Board of directors · Strategy",
  },
  {
    who: "Preparing to talk to investors",
    pain: "You need a deck and solid answers to uncomfortable questions.",
    how: ["Build a pitch deck with a style of your choice", "Edit the slides right in the browser", "Export to PDF and send it off"],
    tools: "Pitch deck · PDF export",
  },
  {
    who: "Launching a product, drowning in tasks",
    pain: "The to-do list is endless, but what to do on Monday is unclear.",
    how: ["Set a goal in the planning studio", "Get a 30/60/90 plan with steps", "Pick a weekly focus every week"],
    tools: "Goals & Plan · Weekly Focus",
  },
  {
    who: "Figuring out why metrics dropped",
    pain: "Numbers are falling, hypotheses are many, evidence is scarce.",
    how: ["Ask the right specialist agent — marketer, finance, analyst", "Compare views at the board of directors", "Lock the decision into the plan"],
    tools: "Agent library · Board of directors",
  },
];

export default function UseCasesPage() {
  return (
    <main style={{ minHeight: "100dvh", background: "#05060A", color: "#fff" }}>
      <Navbar />
      <div style={{ maxWidth: 940, margin: "0 auto", padding: "120px 24px 80px" }}>
        <h1 style={{ fontSize: "clamp(30px,5vw,48px)", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 14px", textWrap: "balance" }}>
          When Vertlix AI actually helps
        </h1>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)", maxWidth: 620, lineHeight: 1.65, margin: "0 0 48px" }}>
          Four situations the product was built for — and exactly which tools to reach for in each.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {CASES.map(c => (
            <section key={c.who} style={{ borderRadius: 16, padding: "24px 26px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h2 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.01em" }}>{c.who}</h2>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", margin: "0 0 16px", lineHeight: 1.6 }}>{c.pain}</p>
              <ol style={{ margin: "0 0 16px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {c.how.map((step, i) => (
                  <li key={step} style={{ display: "flex", gap: 11, alignItems: "flex-start", fontSize: 13.5, color: "rgba(255,255,255,0.72)", lineHeight: 1.5 }}>
                    <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 6, background: "rgba(124,58,237,0.14)", border: "1px solid rgba(124,58,237,0.28)", color: "#a5b4fc", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", letterSpacing: "0.02em" }}>{c.tools}</div>
            </section>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 40 }}>
          <Link href="/register" style={{ display: "inline-flex", alignItems: "center", height: 50, padding: "0 28px", borderRadius: 13, fontSize: 15, fontWeight: 700, color: "#fff", textDecoration: "none", background: "linear-gradient(135deg,#7C3AED,#6D28D9)", boxShadow: "0 8px 24px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.16)" }}>
            Try it free
          </Link>
          <Link href="/features" style={{ display: "inline-flex", alignItems: "center", height: 50, padding: "0 26px", borderRadius: 13, fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.75)", textDecoration: "none", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            All features
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  );
}
