import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PLANS } from "@/lib/plans";
import { CONTACT_EMAIL } from "@/lib/site";

// ─── Страница для инвесторов ──────────────────────────────────────────────────
// Правило №1: ни одной выдуманной цифры. Трекшн у продукта ранний — так и
// написано. Скриншоты в /public/investors/ сняты с работающего продукта.
// Цены берутся из того же конфига, что и страница тарифов.

export const metadata: Metadata = {
  title: "Investors",
  description: "Vertlix AI — an AI board of directors for entrepreneurs. The product is live, payments work, metrics stream in real time.",
  alternates: { canonical: "/investors" },
};

const T = {
  bg: "#05060A",
  surf: "rgba(255,255,255,0.025)",
  bord: "1px solid rgba(255,255,255,0.07)",
  tp: "#E5E7EB",
  ts: "rgba(255,255,255,0.55)",
  tm: "rgba(255,255,255,0.35)",
  accent: "#6366f1",
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#a5b4fc", marginBottom: 14 }}>
      {children}
    </div>
  );
}

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ padding: "56px 0", borderTop: T.bord }}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 style={{ fontSize: "clamp(24px,3.4vw,36px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 20px", color: "#fff", textWrap: "balance" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 16, padding: "20px 22px", background: T.surf, border: T.bord }}>
      {title && <div style={{ fontSize: 14.5, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{title}</div>}
      <div style={{ fontSize: 13.5, lineHeight: 1.65, color: T.ts }}>{children}</div>
    </div>
  );
}

export default function InvestorsPage() {
  return (
    <main style={{ minHeight: "100dvh", background: T.bg, color: T.tp }}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 24px 96px" }}>

        {/* ── Hero ── */}
        <header style={{ padding: "88px 0 56px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" aria-hidden>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.14em" }}>VERTLIX AI</span>
            <span style={{ marginLeft: "auto", fontSize: 12, color: T.tm }}>Investor materials</span>
          </div>

          <h1 style={{ fontSize: "clamp(32px,5.5vw,54px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, margin: "0 0 18px", textWrap: "balance" }}>
            An AI board of directors for entrepreneurs
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: T.ts, maxWidth: 640, margin: "0 0 28px" }}>
            Vertlix AI replaces expensive consulting: 20 AI roles — from CEO to lawyer — examine the user\u2019s
            business and deliver finished documents: a strategy, a pitch deck, a 30/60/90 plan.
            The product is live and taking payments.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <a href="https://vertlixai.com" style={{ display: "inline-flex", alignItems: "center", height: 48, padding: "0 26px", borderRadius: 12, fontSize: 14.5, fontWeight: 700, color: "#fff", textDecoration: "none", background: "linear-gradient(135deg,#6366f1,#4f46e5)", boxShadow: "0 8px 24px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.16)" }}>
              Open the live product
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ display: "inline-flex", alignItems: "center", height: 48, padding: "0 24px", borderRadius: 12, fontSize: 14.5, fontWeight: 600, color: "rgba(255,255,255,0.75)", textDecoration: "none", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
              Contact the founder
            </a>
          </div>
        </header>

        {/* ── Problem ── */}
        <Section id="problem" eyebrow="Problem" title="Entrepreneurs make their biggest decisions alone">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            <Card title="Consulting is out of reach">
              A strategy session with consultants costs thousands of dollars — money early-stage founders don\u2019t have.
            </Card>
            <Card title="Chatbots give transcripts, not results">
              A generic AI chat answers questions but never produces a coherent document: a strategy, a deck, an action plan.
            </Card>
            <Card title="Decisions without a second pair of eyes">
              Legal, financial and marketing risks go unnoticed until they blow up.
            </Card>
          </div>
        </Section>

        {/* ── Solution ── */}
        <Section id="solution" eyebrow="Solution" title="A board of 20 AI directors that delivers documents">
          <p style={{ fontSize: 15, lineHeight: 1.7, color: T.ts, maxWidth: 680, margin: "0 0 20px" }}>
            The user describes the business once. Then every AI role — CEO, CFO, CMO, COO, CTO,
            lawyer, analyst and more — examines the project from its own angle. The result is not a dialogue
            but four finished artifacts:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <Card title="Board verdict">Risks and opportunities by role, with a final conclusion.</Card>
            <Card title="Strategy">Positioning, market, competitors, monetization model.</Card>
            <Card title="Pitch deck">Investor slides edited in the browser, exported to PDF.</Card>
            <Card title="30/60/90 plan">Concrete steps with a checklist and a weekly focus.</Card>
          </div>
        </Section>

        {/* ── Product ── */}
        <Section id="product" eyebrow="Product" title="Screenshots of the live product">
          <p style={{ fontSize: 13.5, color: T.tm, margin: "0 0 18px" }}>
            These are not mockups: the shots are taken from the live app. You can open and verify the product right now.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {[
              { src: "/investors/executives.png", alt: "Executive council: 20 AI directors, boardroom", cap: "Executive council — ask a question, the directors confer and deliver a verdict" },
              { src: "/investors/agents.png", alt: "AI agent library by department", cap: "Agent library — finance, marketing, sales, legal, engineering" },
              { src: "/investors/dashboard.png", alt: "User dashboard with plan limits and next steps", cap: "Dashboard — plan, remaining limits and the next useful step" },
            ].map(s => (
              <figure key={s.src} style={{ margin: 0 }}>
                <div style={{ borderRadius: 16, overflow: "hidden", border: T.bord, background: "#0a0b12" }}>
                  <Image src={s.src} alt={s.alt} width={2160} height={1350} style={{ width: "100%", height: "auto", display: "block" }} />
                </div>
                <figcaption style={{ fontSize: 12.5, color: T.tm, marginTop: 8 }}>{s.cap}</figcaption>
              </figure>
            ))}
          </div>
        </Section>

        {/* ── How it works ── */}
        <Section id="how" eyebrow="How it works" title="From business description to documents in four steps">
          <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
            {[
              ["Describe", "The user describes the business or idea once."],
              ["Analyze", "20 AI roles analyze the project, each in its own area."],
              ["Documents", "Strategy, pitch deck and plan are assembled automatically."],
              ["Execute", "Weekly focus and the goal tracker bring the user back every week."],
            ].map(([t, d], i) => (
              <li key={t} style={{ borderRadius: 16, padding: "18px 20px", background: T.surf, border: T.bord }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(99,102,241,0.14)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", fontSize: 12.5, fontWeight: 700 }}>{i + 1}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{t}</div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: T.ts }}>{d}</div>
              </li>
            ))}
          </ol>
        </Section>

        {/* ── Business model ── */}
        <Section id="model" eyebrow="Business model" title="Monthly subscriptions with margin-protecting limits">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 18 }}>
            {PLANS.map(p => (
              <div key={p.id} style={{ borderRadius: 16, padding: "20px 22px", background: T.surf, border: p.highlight ? "1px solid rgba(99,102,241,0.45)" : T.bord }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "8px 0 10px" }}>
                  <span style={{ fontSize: 30, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>${p.priceMonthly}</span>
                  <span style={{ fontSize: 13, color: T.tm }}>/mo</span>
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.6, color: T.ts }}>{p.tagline}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            <Card title="Economics under control">
              Every plan is bounded by monthly AI request limits, decremented atomically on the server —
              AI provider spend structurally cannot exceed what the price includes.
            </Card>
            <Card title="Payments already work">
              Crypto payments via OxaPay: invoices are created server-side and a plan activates only
              after OxaPay confirms the payment. Renewal adds time to the remaining balance.
            </Card>
            <Card title="Low cost to serve">
              Serverless infrastructure (Vercel + Supabase): costs scale with usage,
              with no fixed server spend at the start.
            </Card>
          </div>
        </Section>

        {/* ── Market ── */}
        <Section id="market" eyebrow="Market" title="Who needs this">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            <Card title="Early-stage founders">
              Validate the idea before investing: a board verdict and strategy in one evening instead of months of uncertainty.
            </Card>
            <Card title="Small business">
              Owners without access to consultants: growth plans, diagnosing falling metrics, legal risks.
            </Card>
            <Card title="Founders before a round">
              A pitch deck and answers to the hard investor questions — before the meeting, not during it.
            </Card>
          </div>
          <p style={{ fontSize: 12.5, color: T.tm, marginTop: 14 }}>
            We deliberately cite no market-size figures: borrowed TAM numbers without our own methodology are noise.
            We are happy to walk through the funnel and unit-economics math in a meeting.
          </p>
        </Section>

        {/* ── Traction ── */}
        <Section id="traction" eyebrow="Traction" title="Early stage — and we don\u2019t hide it">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            <Card title="Product in production">
              Live at vertlixai.com: signup, every AI tool, plans and payments — a working service, not a prototype.
            </Card>
            <Card title="Metrics infrastructure ready">
              Our own analytics already records the full funnel (visit → signup → activation → payment),
              MRR, cohorts and retention — an investor sees live numbers, not a slide.
            </Card>
            <Card title="Payment loop verified">
              Invoice creation, signature-checked webhooks, idempotent subscription activation and renewal
              that preserves remaining time — covered by end-to-end tests.
            </Card>
          </div>
          <p style={{ fontSize: 12.5, color: T.tm, marginTop: 14 }}>
            We cite no user counts or revenue: the product is just entering the market.
            You won\u2019t find invented customers or ratings here — when real ones arrive, our own analytics will show them.
          </p>
        </Section>

        {/* ── Competition ── */}
        <Section id="competition" eyebrow="Competition" title="Between the chatbot and the consultant">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 560, borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["", "Generic AI chats", "Consulting", "Vertlix AI"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: T.tm, fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: T.bord }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Output", "A transcript", "Documents", "Documents"],
                  ["Monthly price", "$20–200", "Thousands of dollars", "$29–49"],
                  ["Speed", "Instant", "Weeks", "Minutes"],
                  ["Role-by-role review", "No", "Yes", "Yes — 20 roles"],
                  ["Return to product", "Low", "One-off project", "Plan and weekly focus"],
                ].map(row => (
                  <tr key={row[0]}>
                    {row.map((cell, i) => (
                      <td key={i} style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", color: i === 0 ? "#fff" : i === 3 ? "#a5b4fc" : T.ts, fontWeight: i === 0 ? 600 : i === 3 ? 600 : 400 }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── Go-to-market ── */}
        <Section id="gtm" eyebrow="Go-to-Market" title="Measurable acquisition from day one">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            <Card title="Performance channels">
              UTM attribution is built in: every source is tracked through to payment — which ads bring money and which bring traffic.
            </Card>
            <Card title="SEO and content">
              Public pages for real use cases are already indexed; a blog is the next step.
            </Card>
            <Card title="Referrals">
              Referral links work (the code is saved at signup); rewards switch on once there is a user base.
            </Card>
          </div>
        </Section>

        {/* ── Roadmap ── */}
        <Section id="roadmap" eyebrow="Roadmap" title="What\u2019s next">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["Done", "Product, plans, payment loop, funnel analytics, admin panel, SEO pages", true],
              ["Next", "Email notifications (events already collected), blog, conversion A/B tests", false],
              ["Later", "Integrations with work tools, localization, partner channels", false],
            ].map(([label, text, done]) => (
              <div key={label as string} style={{ display: "flex", gap: 14, alignItems: "flex-start", borderRadius: 14, padding: "14px 18px", background: T.surf, border: T.bord }}>
                <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 999, color: done ? "#34d399" : "#a5b4fc", background: done ? "rgba(16,185,129,0.1)" : "rgba(99,102,241,0.1)", border: done ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(99,102,241,0.3)" }}>{label}</span>
                <span style={{ fontSize: 13.5, lineHeight: 1.6, color: T.ts }}>{text}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Investment ── */}
        <Section id="invest" eyebrow="Investment" title="Let\u2019s talk">
          <p style={{ fontSize: 15, lineHeight: 1.7, color: T.ts, maxWidth: 640, margin: "0 0 24px" }}>
            Round terms are discussed individually — no invented valuations on a slide.
            We\u2019ll show the product live, real metrics in the admin panel and the unit-economics math.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ display: "inline-flex", alignItems: "center", height: 50, padding: "0 28px", borderRadius: 13, fontSize: 15, fontWeight: 700, color: "#fff", textDecoration: "none", background: "linear-gradient(135deg,#6366f1,#4f46e5)", boxShadow: "0 8px 24px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.16)" }}>
              Email us: {CONTACT_EMAIL}
            </a>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", height: 50, padding: "0 26px", borderRadius: 13, fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.75)", textDecoration: "none", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
              Back to home
            </Link>
          </div>
        </Section>

      </div>
    </main>
  );
}
