"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { TEAM_BY_SLUG } from "@/lib/team";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface ProjectData {
  name: string; subtitle: string; score: number; status: string;
  scores: { label: string; value: number }[];
  summary: string;
  financials: { label: string; value: string; numeric?: number }[];
  market: { label: string; value: string; numeric?: number }[];
  risks: { level: string; title: string; desc: string }[];
}

// ─── 20 DEMO AGENTS ───────────────────────────────────────────────────────────

const DEMO_AGENTS = [
  { id:"ceo", role:"CEO", name:TEAM_BY_SLUG["ceo"].name, color:TEAM_BY_SLUG["ceo"].c, title:TEAM_BY_SLUG["ceo"].title, score:82,
    opinion:"The project has clear strategic potential in a niche with growing demand. The business model is scalable and defensible thanks to network effects. I recommend focusing on a single ICP for the first 6 months of operation. The key risk is losing focus by trying to cover every segment at once. The team needs a clear division of roles before launch. Investment should be split proportionally between product and customer acquisition. Partnerships with complementary market players will significantly accelerate growth. OKRs must be tightly tied to financial goals every quarter. Reaching operating profit is realistic within 18-24 months with proper execution." },
  { id:"cfo", role:"CFO", name:TEAM_BY_SLUG["cfo"].name, color:TEAM_BY_SLUG["cfo"].c, title:TEAM_BY_SLUG["cfo"].title, score:79,
    opinion:"The project's financial structure is generally sound but needs refinement in revenue forecasting. Burn rate should be optimized to a maximum of 15% of monthly MRR. CAC needs to drop by 20% to hit profitability on schedule. Build a runway of at least 18 months before the next funding round. P&L should turn positive no later than month 20 after launch. Revenue-based financing is worth considering as an alternative to equity dilution. Unit economics become viable at a scale of 1000+ active customers. Financial KPIs need to be monitored weekly for fast response." },
  { id:"coo", role:"COO", name:TEAM_BY_SLUG["coo"].name, color:TEAM_BY_SLUG["coo"].c, title:TEAM_BY_SLUG["coo"].title, score:76,
    opinion:"The operational strategy needs immediate work on the processes that deliver value to customers. Without clear SOPs, the team will lose 30-40% of its efficiency when scaling. Automating routine tasks should start from the company's first month. Operational efficiency KPIs need to be tracked weekly at every level. Response time to customer requests is a critical NPS indicator. Operating expenses can realistically drop 18-25% once volume kicks in. The first 3 months are the critical period for building operational discipline. Suppliers and partners need formal contracts in place before launch." },
  { id:"cmo", role:"CMO", name:TEAM_BY_SLUG["cmo"].name, color:TEAM_BY_SLUG["cmo"].c, title:TEAM_BY_SLUG["cmo"].title, score:84,
    opinion:"Market positioning needs clearer differentiation from key competitors. I recommend content marketing as the primary acquisition channel at launch given the minimal budget. Brand voice must be documented before the first public contact with the audience. Organic CAC can run 3-5x lower than paid with the right SEO strategy. An email retention program can cut churn by 15-20% when done right. Partnering with niche influencers will deliver fast initial traction in the first 90 days. Retargeting should be set up from the first month of paid-channel presence. A/B testing is a mandatory practice for every acquisition hypothesis, no exceptions." },
  { id:"cto", role:"CTO", name:TEAM_BY_SLUG["cto"].name, color:TEAM_BY_SLUG["cto"].c, title:TEAM_BY_SLUG["cto"].title, score:71,
    opinion:"The tech stack chosen fits the project's current stage and scale well. The main risk is accumulating technical debt from aggressive growth without refactoring. The architecture should be designed for 10x the current system load. DevOps culture and CI/CD are mandatory from the team's first day of development. Data security needs prioritization, especially when handling user data. Monitoring and alerting must be set up before the product's production launch. An API-first approach will keep integrations and future scaling flexible. Investment in automated tests will pay off by the 3rd month of active development." },
  { id:"analyst", role:"Analyst", name:TEAM_BY_SLUG["analyst"].name, color:TEAM_BY_SLUG["analyst"].c, title:TEAM_BY_SLUG["analyst"].title, score:80,
    opinion:"Market analysis confirms real demand exists in the target audience segment. Competitors don't fully address the pain point this project targets. TAM is substantial, but a realistic 3-year target market share is 1-3%. Market trends are positive: CAGR of 15-25% is forecast over the next 5 years. Entry barriers are moderate — the window of opportunity is open for fast movement. Consumer behavior is shifting in favor of this solution across all key metrics. Seasonality needs separate accounting in the financial model when forecasting. Data should be collected from day one to train future analytical models." },
  { id:"legal", role:"Legal", name:TEAM_BY_SLUG["legal"].name, color:TEAM_BY_SLUG["legal"].c, title:TEAM_BY_SLUG["legal"].title, score:68,
    opinion:"The project's legal structure needs a compliance review against regulatory requirements. User personal data handling must comply with GDPR and local regulations. Trademark registration is needed before the product's public market launch. Contracts with contractors and employees must include full NDAs. Intellectual property should be assigned to the legal entity, not individuals. A user agreement and privacy policy are legal requirements. Potential regulatory risks in the industry need to be documented in advance. Set aside a legal reserve of 5-10% of the operating budget to minimize risk." },
  { id:"sales", role:"Sales", name:TEAM_BY_SLUG["sales"].name, color:TEAM_BY_SLUG["sales"].c, title:TEAM_BY_SLUG["sales"].title, score:77,
    opinion:"The sales funnel needs clearly defined metrics at every stage of the customer journey. Lead-to-customer conversion rate is the key KPI to track from day one. ICP segmentation will let the team focus effort on the most convertible leads. The pricing strategy looks competitive but needs market testing. A CRM system is mandatory from the moment the first prospect enters the pipeline. A referral program can drive up to 30% of new customers with the right mechanics. A sales playbook should be documented before hiring the first sales manager. Average deal-closing time needs to be optimized by the end of the second quarter." },
  { id:"hr", role:"HR", name:TEAM_BY_SLUG["hr"].name, color:TEAM_BY_SLUG["hr"].c, title:TEAM_BY_SLUG["hr"].title, score:72,
    opinion:"The team is the key competitive advantage in a business's early stage. Company culture is set permanently by the first 10 hires. The recruitment pipeline needs to stay active continuously, not just when urgently needed. Onboarding critically affects retention in the first 90 days and shapes loyalty. Compensation packages need to be competitive for the stage and labor market. Employee NPS is an important early indicator of culture problems inside the organization. Addressing burnout needs to be a leadership priority from month one. Team diversity correlates with decision quality and the level of innovation." },
  { id:"product", role:"Product", name:TEAM_BY_SLUG["product"].name, color:TEAM_BY_SLUG["product"].c, title:TEAM_BY_SLUG["product"].title, score:85,
    opinion:"Product-market fit is the only metric that critically matters at this stage. User research should happen weekly for the first 3 months, no exceptions. The MVP should launch as fast as possible to get real market feedback. Day-30 retention rate is the main indicator of reaching product-market fit. The roadmap should be built strictly on data and user feedback. ICE-score feature prioritization will prevent resources from spreading thin on unnecessary features. NPS should be tracked from the product's very first active user, without delay. Activation rate is a critical indicator of onboarding effectiveness." },
  { id:"risk", role:"Risk", name:TEAM_BY_SLUG["risk"].name, color:TEAM_BY_SLUG["risk"].c, title:TEAM_BY_SLUG["risk"].title, score:65,
    opinion:"The project's risk profile is classified as moderate-to-high for this idea stage. Financial risk is the main one: 60% of startups die specifically from running out of money. Market risk is reduced by good understanding of the competitive landscape and segmentation. Operational risk stems from critical dependency on key employees. Technology risk is moderate given the right stack and dev team choices. Regulatory risk needs monitoring over a 6-month planning horizon. Scenario analysis is a mandatory tool for financial and operational planning. A reserve fund of 20% of budget minimizes black-swan scenarios." },
  { id:"growth", role:"Growth", name:TEAM_BY_SLUG["growth"].name, color:TEAM_BY_SLUG["growth"].c, title:TEAM_BY_SLUG["growth"].title, score:88,
    opinion:"The fastest path to growth is finding one scalable acquisition channel in the first 3 months. A viral coefficient above 1.0 fundamentally transforms the whole project's economics. An experimental approach with weekly growth sprints delivers the best results in practice. Product-led growth is achievable with the right freemium funnel design. Community-led growth is the cheapest sustainable customer acquisition channel. SEO with the right strategy delivers 10x+ ROI over a 12-month horizon. The referral loop should be built directly into the product, not bolted on afterward. Data from the first 100 customers is gold for shaping long-term growth strategy." },
  { id:"data", role:"Data", name:TEAM_BY_SLUG["data"].name, color:TEAM_BY_SLUG["data"].c, title:TEAM_BY_SLUG["data"].title, score:74,
    opinion:"Data is the main asset, and collection needs to start from the very first day. The data structure should be designed with future machine learning use in mind. Behavioral customer segmentation will deliver a long-term competitive advantage. A churn prediction model starts paying off at 500+ active customers. A/B testing infrastructure is necessary to scale an experimentation culture. LTV prediction improves CAC optimization by 30-40% when done right. Data-driven personalization lifts retention by an average of 15-25% in the first year. A data-driven culture is a competitive moat that's hard for competitors to copy." },
  { id:"brand", role:"Brand", name:TEAM_BY_SLUG["brand"].name, color:TEAM_BY_SLUG["brand"].c, title:TEAM_BY_SLUG["brand"].title, score:79,
    opinion:"Brand positioning needs to be clear and distinct in a competitor-saturated market. Visual identity creates the first impression, and there's no second chance to fix it. Brand tone of voice must precisely match the target audience's values. Consistency across every touchpoint is critical for building trust and loyalty. Brand equity builds slowly but becomes a long-term strategic asset for the company. Storytelling around the founders and mission works far better than corporate content. Social proof in the form of reviews and case studies should appear within the first 3 months. Brand guidelines are mandatory before hiring the first marketer or content contractor." },
  { id:"ux", role:"CS", name:TEAM_BY_SLUG["ux"].name, color:TEAM_BY_SLUG["ux"].c, title:TEAM_BY_SLUG["ux"].title, score:73,
    opinion:"Customer success is the one department that directly drives retention metrics. Onboarding should get a customer to first value within 7 days max. Churn starts long before cancellation — triggers need to be identified in the first 3 months. Proactive outreach when activity drops reduces churn by 20-30% according to industry data. NPS surveys should run at 30, 60, and 90 days after a customer starts using the product. Customer feedback is the best source of ideas for the product roadmap. Expansion revenue through upsell requires the customer's success on their current plan first. The SLA needs to be documented and strictly honored from the very first customer." },
  { id:"pr", role:"Engineering", name:TEAM_BY_SLUG["pr"].name, color:TEAM_BY_SLUG["pr"].c, title:TEAM_BY_SLUG["pr"].title, score:70,
    opinion:"Technical debt is the biggest threat to development velocity after the first year of active growth. A CI/CD pipeline must be set up before the first production deploy, no matter what. A code review culture prevents critical production bugs early on. Minimum 70% test coverage is a mandatory quality standard for the team. Code documentation must be a mandatory practice for the whole engineering team from sprint one. Monitoring and observability are the top priority right after the production environment launches. A security-first approach in architectural decisions protects against costly incidents. An incident response playbook is needed before the first paying customer arrives." },
  { id:"invest", role:"Investment", name:TEAM_BY_SLUG["invest"].name, color:TEAM_BY_SLUG["invest"].c, title:TEAM_BY_SLUG["invest"].title, score:76,
    opinion:"From an investment attractiveness standpoint, the project sits in the green zone. Comparable companies show 5-15x revenue multiples with the right business model. ROI for seed investors is realistic on a 3-5 year exit at current metrics. The market has similar successful precedents with comparable starting parameters. EBITDA margin at scale needs to exceed 20% to stay attractive. A burn multiple below 2.0 signals efficient use of raised capital. M&A potential is significant once the company achieves leadership in its target niche. Investor updates should be monthly and cover 5 key operating metrics." },
  { id:"strategy", role:"Strategy", name:TEAM_BY_SLUG["strategy"].name, color:TEAM_BY_SLUG["strategy"].c, title:TEAM_BY_SLUG["strategy"].title, score:83,
    opinion:"The company's strategic positioning isn't sufficiently differentiated from key competitors. A sustainable competitive moat requires focusing on one of three: cost leadership, differentiation, or niche. A blue-ocean strategy is achievable with the right rethink of the value proposition. Strategic focus in the first 18 months is critical for survival and growth. Competitive analysis needs quarterly refreshes to keep strategic decisions relevant. Barriers to entry need to be actively built and reinforced from day one of operations. An ecosystem strategy through partnerships will meaningfully speed growth and cut acquisition costs. Long-term strategy needs to balance Horizon 1 and Horizon 2 business development." },
  { id:"supply", role:"Operations", name:TEAM_BY_SLUG["supply"].name, color:TEAM_BY_SLUG["supply"].c, title:TEAM_BY_SLUG["supply"].title, score:69,
    opinion:"Operational efficiency is the foundation of sustainable scaling for any business. Processes need to be documented and standardized before hiring employee number 5. Automating routine tasks will save the whole team 20-30% of operating time. Vendor management needs formalizing once the first significant contractor comes on board. The KPI tree needs to cascade down to every function and role in the organization. Operating rhythms — daily standups, weekly reviews — are critically important. Quality control processes have a direct, measurable impact on NPS and customer retention. Operating margin is the main indicator of business health at the unit-economics level." },
  { id:"market", role:"Research", name:TEAM_BY_SLUG["market"].name, color:TEAM_BY_SLUG["market"].c, title:TEAM_BY_SLUG["market"].title, score:77,
    opinion:"Market data confirms sustained consumer demand in the target segment. Market trends are favorable: growing category interest and lowering entry barriers. Consumer behavior is shifting in a direction that aligns with the company's value proposition. The competitive map shows an unoccupied niche in the mid-price category. A CAGR of 15-25% over the next 5 years creates a favorable launch window. Market seasonality needs to be factored into cash flow and marketing planning. Geographic expansion is possible once PMF is reached in the local home market. Research shows strong willingness to pay among the target audience with the right positioning." },
];

// ─── PROJECT STATIC DATA ─────────────────────────────────────────────────────

const PROJECTS_DATA: Record<string, ProjectData> = {
  demo: {
    name: "AI-Powered Fitness Platform", subtitle: "SaaS · Mobile App · 8 AI Executives", score: 87, status: "Complete",
    scores: [{ label: "Market Potential", value: 91 }, { label: "Financial Stability", value: 83 }, { label: "Feasibility", value: 87 }, { label: "Competitive Advantage", value: 79 }],
    summary: "AI-Powered Fitness Platform is a high-potential product in the fast-growing personal training market ($4.2B). Strong differentiation through AI personalization. A B2C model with a freemium funnel and Premium subscription monetization ($19.99/mo) is recommended.",
    financials: [{ label: "Revenue Forecast (Year 1)", value: "$240K", numeric: 240 }, { label: "Revenue Forecast (Year 3)", value: "$2.4M", numeric: 2400 }, { label: "Breakeven Point", value: "18 months" }, { label: "User LTV", value: "$180" }, { label: "CAC", value: "$22" }, { label: "LTV/CAC", value: "8.2x" }],
    market: [{ label: "TAM (Total Market)", value: "$4.2B", numeric: 4200 }, { label: "SAM (Serviceable)", value: "$840M", numeric: 840 }, { label: "SOM (Target)", value: "$42M", numeric: 42 }, { label: "Market Growth", value: "+24%/yr" }],
    risks: [{ level: "high", title: "High Competition", desc: "MyFitnessPal, Noom, Peloton are major players with big budgets." }, { level: "medium", title: "Acquisition Cost", desc: "CAC could rise as paid channels scale." }, { level: "low", title: "Technical Risk", desc: "AI models require ongoing training and quality data." }],
  },
  "2": {
    name: "SaaS Invoice Platform", subtitle: "SaaS · FinTech · 8 AI Executives", score: 91, status: "Complete",
    scores: [{ label: "Market Potential", value: 94 }, { label: "Financial Stability", value: 90 }, { label: "Feasibility", value: 88 }, { label: "Competitive Advantage", value: 85 }],
    summary: "SaaS Invoice Platform solves a real pain point for 59M freelancers in the US. High category retention (78%), predictable MRR. Launch is recommended with a focus on design agencies and IT consultants as the primary ICP.",
    financials: [{ label: "Revenue Forecast (Year 1)", value: "$180K", numeric: 180 }, { label: "Revenue Forecast (Year 3)", value: "$1.8M", numeric: 1800 }, { label: "Breakeven Point", value: "12 months" }, { label: "User LTV", value: "$540" }, { label: "CAC", value: "$48" }, { label: "LTV/CAC", value: "11.2x" }],
    market: [{ label: "TAM (Total Market)", value: "$2.1B", numeric: 2100 }, { label: "SAM (Serviceable)", value: "$420M", numeric: 420 }, { label: "SOM (Target)", value: "$21M", numeric: 21 }, { label: "Market Growth", value: "+18%/yr" }],
    risks: [{ level: "medium", title: "FreshBooks / QuickBooks", desc: "Dominant players with high brand recognition." }, { level: "low", title: "Integrations", desc: "Bank and payment system integrations are needed." }, { level: "low", title: "Regulatory Requirements", desc: "Invoicing requirements vary by country." }],
  },
  "3": {
    name: "Local Restaurant Chain", subtitle: "Restaurant · Food · 5 AI Executives", score: 72, status: "In Progress",
    scores: [{ label: "Market Potential", value: 75 }, { label: "Financial Stability", value: 68 }, { label: "Feasibility", value: 74 }, { label: "Competitive Advantage", value: 70 }],
    summary: "Restaurant chain expansion strategy is being analyzed. Moderate potential in the competitive fast-casual market.",
    financials: [{ label: "Startup Investment", value: "$350K" }, { label: "Margin", value: "~15-20%" }, { label: "Food Cost %", value: "~28-32%" }],
    market: [{ label: "TAM (Total Market)", value: "$890M", numeric: 890 }, { label: "SAM (Serviceable)", value: "$89M", numeric: 89 }, { label: "SOM (Target)", value: "$4.5M", numeric: 4.5 }, { label: "Market Growth", value: "+9%/yr" }],
    risks: [{ level: "high", title: "Operational Complexity", desc: "Managing multiple locations requires systems." }, { level: "high", title: "High Competition", desc: "Saturated market with low entry barriers." }, { level: "medium", title: "Rising Rent", desc: "Commercial real estate costs are increasing." }],
  },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function buildProjectFromUser(raw: Record<string, unknown>): ProjectData {
  const score = Number(raw.score) || 78;
  const rawRevenue = raw.revenue ? String(raw.revenue) : null;
  const revenueDisplay = rawRevenue && rawRevenue.length > 0 && rawRevenue !== "0"
    ? rawRevenue.startsWith("$") ? rawRevenue : `$${rawRevenue}` : `$${(score * 3).toFixed(0)}K`;
  return {
    name: String(raw.name || "Project"),
    subtitle: `${raw.industry || "Business"} · ${raw.stage || "Idea"} · AI Executive Board`,
    score, status: "Complete",
    scores: [
      { label: "Market Potential", value: Math.min(99, score + 4) },
      { label: "Financial Stability", value: Math.max(50, score - 6) },
      { label: "Feasibility", value: Math.min(99, score + 1) },
      { label: "Competitive Advantage", value: Math.max(50, score - 8) },
    ],
    summary: `${raw.name} is a business idea in ${raw.industry || "your industry"}. ${raw.description ? String(raw.description).slice(0, 200) : ""} The AI team has analyzed the project and prepared a strategy.`,
    financials: [
      { label: "Revenue Forecast (Year 1)", value: revenueDisplay, numeric: score * 3 },
      { label: "Revenue Forecast (Year 3)", value: `$${(score * 0.03).toFixed(1)}M`, numeric: score * 30 },
      { label: "Breakeven Point", value: score > 80 ? "14 months" : "20 months" },
      { label: "User LTV", value: `$${(score * 2).toFixed(0)}` },
      { label: "CAC", value: `$${Math.floor(score / 3)}` },
      { label: "LTV/CAC", value: `${(score / 15).toFixed(1)}x` },
      { label: "Timeframe", value: `${raw.timeframe || "12"} months` },
    ],
    market: [
      { label: "TAM (Total Market)", value: raw.market ? String(raw.market) : `$${(score * 50).toFixed(0)}M`, numeric: score * 50 },
      { label: "SAM (Serviceable)", value: `$${(score * 10).toFixed(0)}M`, numeric: score * 10 },
      { label: "SOM (Target)", value: `$${score}M`, numeric: score },
      { label: "Market Growth", value: raw.growth ? String(raw.growth) : `+${Math.floor(score / 7)}%/yr` },
    ],
    risks: [
      { level: "medium", title: "Competitive Environment", desc: `The ${raw.industry || "your industry"} space has established players with resources.` },
      { level: score > 80 ? "low" : "medium", title: "Customer Acquisition", desc: "Acquisition cost could rise as the business scales." },
      { level: "low", title: "Operational Risks", desc: "Processes and team need to be built out before scaling." },
    ],
  };
}

// ─── ANIMATION HOOK ───────────────────────────────────────────────────────────

function useAnimated(delay = 0) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return ready;
}

// ─── ANIMATED GAUGE ───────────────────────────────────────────────────────────

function AnimatedGauge({ score, color, size = 72, delay = 0, showLabel = true }:
  { score: number; color: string; size?: number; delay?: number; showLabel?: boolean }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setVal(score), delay + 80);
    return () => clearTimeout(t);
  }, [score, delay]);

  const cx = size / 2, cy = size / 2;
  const r = size * 0.37;
  const circ = 2 * Math.PI * r;
  const maxDash = circ * 0.75;
  const drawn = (val / 100) * maxDash;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ overflow: "visible" }}>
      <g transform={`rotate(-135 ${cx} ${cy})`}>
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="rgba(255,255,255,0.07)" strokeWidth={size * 0.075}
          strokeDasharray={`${maxDash} ${circ}`} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color}
          strokeWidth={size * 0.075}
          strokeDasharray={`${drawn} ${circ}`} strokeLinecap="round"
          style={{
            transition: `stroke-dasharray 1.4s cubic-bezier(0.34,1.1,0.64,1) ${delay}ms`,
            filter: `drop-shadow(0 0 ${size * 0.04}px ${color})`,
          }} />
      </g>
      <text x={cx} y={cy + (showLabel ? size * 0.06 : size * 0.09)} textAnchor="middle"
        fontSize={size * 0.26} fontWeight="800" fill="white"
        fontFamily="ui-monospace,monospace">{val}</text>
      {showLabel && (
        <text x={cx} y={cy + size * 0.22} textAnchor="middle"
          fontSize={size * 0.09} fill="rgba(255,255,255,0.25)"
          fontFamily="system-ui" letterSpacing="1">SCORE</text>
      )}
    </svg>
  );
}

// ─── ANIMATED BAR ─────────────────────────────────────────────────────────────

function AnimatedBar({ value, color, delay = 0, height = 6 }:
  { value: number; color: string; delay?: number; height?: number }) {
  const animated = useAnimated(delay + 100);
  return (
    <div style={{ height, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
      <div style={{
        height: "100%", width: animated ? `${value}%` : "0%",
        background: `linear-gradient(90deg, ${color}, ${color}99)`,
        transition: `width 1.3s cubic-bezier(0.34,1.1,0.64,1) ${delay}ms`,
        borderRadius: 99,
        boxShadow: `0 0 8px ${color}50`,
      }} />
    </div>
  );
}

// ─── ANIMATED AREA CHART ──────────────────────────────────────────────────────

function DetailedRevenueChart({ financials, timeframe }: {
  financials: { label: string; value: string; numeric?: number }[];
  timeframe?: string;
}) {
  const animated = useAnimated(100);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const yr1 = financials.find(f => f.label.toLowerCase().includes("year 1"));
  const yr3 = financials.find(f => f.label.toLowerCase().includes("year 3"));
  const v1 = yr1?.numeric ?? 100;
  const v3 = yr3?.numeric ?? v1 * 10;

  // Generate 28 monthly data points with accelerating growth curve
  const months = 28;
  const pts28 = Array.from({ length: months }, (_, i) => {
    const t = i / (months - 1);
    const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    return Math.round(v1 + (v3 - v1) * eased);
  });

  // Date labels starting 6 months before "now"
  const now = new Date(2026, 0, 1);
  const EN_MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const dateLabels = Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i - 2, 1);
    return `${EN_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  });

  const W = 600, H = 220;
  const PL = 54, PR = 18, PT = 16, PB = 36;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;
  const maxV = Math.max(...pts28);
  const yTicks = 5;

  const toX = (i: number) => PL + (i / (months - 1)) * chartW;
  const toY = (v: number) => PT + chartH - (v / maxV) * chartH;

  const linePath = pts28.map((v, i) => {
    const x = toX(i), y = toY(v);
    if (i === 0) return `M ${x} ${y}`;
    const px = toX(i - 1), py = toY(pts28[i - 1]);
    const cx = (px + x) / 2;
    return `C ${cx} ${py} ${cx} ${y} ${x} ${y}`;
  }).join(" ");
  const areaPath = `${linePath} L ${toX(months - 1)} ${PT + chartH} L ${toX(0)} ${PT + chartH} Z`;

  const xTickIdxs = [0, 4, 8, 12, 16, 20, 24, 27];

  const formatVal = (v: number) => {
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}M`;
    return `$${v}K`;
  };

  const hovered = hoverIdx !== null ? { x: toX(hoverIdx), y: toY(pts28[hoverIdx]), val: pts28[hoverIdx], label: dateLabels[hoverIdx] } : null;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    const chartX = relX - PL;
    const idx = Math.max(0, Math.min(months - 1, Math.round((chartX / chartW) * (months - 1))));
    setHoverIdx(idx);
  };

  return (
    <div style={{
      background: "rgba(14,16,26,0.9)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16, overflow: "hidden", position: "relative",
    }}>
      <div style={{ padding: "16px 20px 0" }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.22em", color: "rgba(255,255,255,0.28)", textTransform: "uppercase", marginBottom: 4 }}>
          Detailed Revenue Forecast
        </div>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block", cursor: "crosshair" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="fin-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#D946EF" />
          </linearGradient>
          <linearGradient id="fin-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D946EF" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
          <clipPath id="fin-clip">
            <rect x={PL} y={PT} width={chartW} height={chartH} />
          </clipPath>
        </defs>

        {/* Y-axis grid + labels */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const frac = i / yTicks;
          const v = maxV * frac;
          const y = PT + chartH * (1 - frac);
          return (
            <g key={i}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x={PL - 6} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="ui-monospace,monospace">
                {formatVal(v)}
              </text>
            </g>
          );
        })}

        {/* Y-axis label rotated */}
        <text x={10} y={H / 2} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="8"
          fontFamily="ui-monospace,monospace" transform={`rotate(-90, 10, ${H / 2})`}>
          REVENUE ($)
        </text>

        {/* X-axis labels */}
        {xTickIdxs.map(i => (
          <text key={i} x={toX(i)} y={H - 6} textAnchor="middle" fill="rgba(255,255,255,0.22)" fontSize="8" fontFamily="ui-monospace,monospace">
            {dateLabels[i]}
          </text>
        ))}
        <text x={W / 2} y={H - 0} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="7.5" fontFamily="ui-monospace,monospace">
          TIME (MONTHS/YEARS)
        </text>

        {/* Area + line (clipped) */}
        <g clipPath="url(#fin-clip)">
          <path d={areaPath} fill="url(#fin-area)"
            style={{ opacity: animated ? 1 : 0, transition: "opacity 1.1s ease-out 0.6s" }} />
          <path d={linePath} fill="none" stroke="url(#fin-line)" strokeWidth="2.2" strokeLinecap="round"
            strokeDasharray="3000" strokeDashoffset={animated ? "0" : "3000"}
            style={{ transition: "stroke-dashoffset 2.4s cubic-bezier(0.25,0.46,0.45,0.94) 0.2s" }} />
        </g>

        {/* Data dots every 4th */}
        {pts28.map((v, i) => {
          if (i % 4 !== 0 && i !== months - 1) return null;
          const x = toX(i), y = toY(v);
          return (
            <g key={i} style={{ opacity: animated ? 1 : 0, transition: `opacity 0.3s ${0.9 + i * 0.03}s` }}>
              <circle cx={x} cy={y} r="4" fill="#070912" stroke={i === months - 1 ? "#D946EF" : "#3b82f6"} strokeWidth="1.5" />
              <circle cx={x} cy={y} r="1.8" fill={i === months - 1 ? "#D946EF" : "#3b82f6"} />
            </g>
          );
        })}

        {/* Peak label */}
        {animated && (
          <g style={{ opacity: animated ? 1 : 0, transition: "opacity 0.5s 2s" }}>
            <text x={toX(months - 1) - 6} y={toY(pts28[months - 1]) - 10}
              textAnchor="end" fill="#D946EF" fontSize="11" fontWeight="700" fontFamily="ui-monospace,monospace">
              {yr3?.value ?? formatVal(v3)}
            </text>
          </g>
        )}

        {/* Hover cursor */}
        {hovered && (
          <g>
            <line x1={hovered.x} y1={PT} x2={hovered.x} y2={PT + chartH}
              stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 3" />
            <circle cx={hovered.x} cy={hovered.y} r="5" fill="#070912" stroke="#3b82f6" strokeWidth="2" />
            <circle cx={hovered.x} cy={hovered.y} r="2.5" fill="#3b82f6" />
            {/* Tooltip */}
            <g transform={`translate(${Math.min(hovered.x + 10, W - 130)}, ${Math.max(hovered.y - 46, PT + 4)})`}>
              <rect width="118" height="38" rx="7" fill="rgba(14,18,34,0.95)" stroke="rgba(59,130,246,0.3)" strokeWidth="1" />
              <text x="10" y="14" fill="rgba(255,255,255,0.5)" fontSize="8.5" fontFamily="ui-monospace,monospace">{hovered.label}</text>
              <text x="10" y="28" fill="#3b82f6" fontSize="11" fontWeight="700" fontFamily="ui-monospace,monospace">
                {formatVal(hovered.val)}
              </text>
            </g>
          </g>
        )}

        {/* Start label */}
        {animated && (
          <text x={toX(0)} y={toY(pts28[0]) - 10} textAnchor="start"
            fill="#3b82f6" fontSize="11" fontWeight="700" fontFamily="ui-monospace,monospace"
            style={{ opacity: animated ? 1 : 0, transition: "opacity 0.5s 2s" }}>
            {yr1?.value ?? formatVal(v1)}
          </text>
        )}
      </svg>
    </div>
  );
}

// ─── ANIMATED RINGS (TAM/SAM/SOM) ────────────────────────────────────────────

function MarketSphereChart({ items }: { items: { label: string; value: string; numeric?: number }[] }) {
  const animated = useAnimated(120);

  const tam  = items.find(m => m.label.toLowerCase().includes("tam") || m.label.toLowerCase().includes("total"));
  const sam  = items.find(m => m.label.toLowerCase().includes("sam") || m.label.toLowerCase().includes("serviceable"));
  const som  = items.find(m => m.label.toLowerCase().includes("som") || m.label.toLowerCase().includes("target"));
  const cagr = items.find(m => m.label.toLowerCase().includes("growth") || m.label.toLowerCase().includes("cagr"));

  // ── Concentric radii (area ∝ market value) ──
  const nTam = tam?.numeric || 1000;
  const nSam = sam?.numeric || nTam * 0.2;
  const nSom = som?.numeric || nTam * 0.02;
  const R = 118; // outer TAM radius
  const rSam = Math.max(64, R * Math.sqrt(Math.min(1, nSam / nTam)));
  const rSom = Math.max(30, R * Math.sqrt(Math.min(1, nSom / nTam)));

  const cards = [
    { key: "TAM", label: "TAM: " + (tam?.value ?? "—"), sub: "(Total addressable market)", color: "#818cf8", rgb: "129,140,248",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{width:26,height:26}}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
    { key: "SAM", label: "SAM: " + (sam?.value ?? "—"), sub: "(Serviceable available market)", color: "#7C3AED", rgb: "124,58,237",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{width:26,height:26}}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg> },
    { key: "SOM", label: "SOM: " + (som?.value ?? "—"), sub: "(Serviceable obtainable market)", color: "#10b981", rgb: "16,185,129",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{width:26,height:26}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><path d="M17 3l1 4-4 1"/></svg> },
    { key: "CAGR", label: "CAGR: " + (cagr?.value ?? "+25%"), sub: "(Compound annual growth rate)", color: "#f59e0b", rgb: "245,158,11",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{width:26,height:26}}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/><rect x="2" y="14" width="4" height="7" rx="1"/><rect x="9" y="10" width="4" height="11" rx="1"/><rect x="16" y="6" width="4" height="15" rx="1"/></svg> },
  ];

  return (
    <div style={{
      background: "rgba(8,10,20,0.95)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16, overflow: "hidden", position: "relative",
    }}>
      <div style={{ padding: "14px 20px 0", fontSize: 9, fontWeight: 800, letterSpacing: "0.22em", color: "rgba(255,255,255,0.28)", textTransform: "uppercase" }}>
        Market Size Analysis (TAM / SAM / SOM)
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center" }}>
        {/* Concentric nested circles (TAM ⊃ SAM ⊃ SOM) */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 0" }}>
          <svg viewBox="0 0 300 300" style={{ width: "100%", maxWidth: 300, height: "auto", overflow: "visible" }}>
            <defs>
              <radialGradient id="mkt-tam" cx="50%" cy="42%" r="60%">
                <stop offset="0%" stopColor="rgba(124,58,237,0.16)" />
                <stop offset="100%" stopColor="rgba(124,58,237,0.03)" />
              </radialGradient>
              <radialGradient id="mkt-sam" cx="50%" cy="42%" r="60%">
                <stop offset="0%" stopColor="rgba(124,58,237,0.28)" />
                <stop offset="100%" stopColor="rgba(124,58,237,0.08)" />
              </radialGradient>
              <radialGradient id="mkt-som" cx="50%" cy="40%" r="65%">
                <stop offset="0%" stopColor="rgba(16,185,129,0.4)" />
                <stop offset="100%" stopColor="rgba(16,185,129,0.14)" />
              </radialGradient>
            </defs>

            {/* TAM */}
            <g style={{ transformOrigin: "150px 150px", transform: animated ? "scale(1)" : "scale(0.3)", opacity: animated ? 1 : 0, transition: "transform 0.9s cubic-bezier(0.22,1,0.36,1), opacity 0.9s" }}>
              <circle cx="150" cy="150" r={R} fill="url(#mkt-tam)" stroke="rgba(124,58,237,0.4)" strokeWidth="1.5" />
              <text x="150" y={150 - R + 20} textAnchor="middle" fontSize="11" fontWeight="800" fill="#818cf8" fontFamily="ui-monospace,monospace">TAM {tam?.value ?? "—"}</text>
            </g>
            {/* SAM */}
            <g style={{ transformOrigin: "150px 150px", transform: animated ? "scale(1)" : "scale(0.3)", opacity: animated ? 1 : 0, transition: "transform 0.9s cubic-bezier(0.22,1,0.36,1) 0.15s, opacity 0.9s 0.15s" }}>
              <circle cx="150" cy={150 + (R - rSam)} r={rSam} fill="url(#mkt-sam)" stroke="rgba(124,58,237,0.6)" strokeWidth="1.5" />
              <text x="150" y={150 + (R - rSam) - rSam + 18} textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#a5b4fc" fontFamily="ui-monospace,monospace">SAM {sam?.value ?? "—"}</text>
            </g>
            {/* SOM (target core) */}
            <g style={{ transformOrigin: "150px 150px", transform: animated ? "scale(1)" : "scale(0.3)", opacity: animated ? 1 : 0, transition: "transform 0.9s cubic-bezier(0.22,1,0.36,1) 0.3s, opacity 0.9s 0.3s" }}>
              <circle cx="150" cy={150 + (R - rSom)} r={rSom} fill="url(#mkt-som)" stroke="#10b981" strokeWidth="1.8" />
              <text x="150" y={150 + (R - rSom) + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="#34d399" fontFamily="ui-monospace,monospace">SOM</text>
              <text x="150" y={150 + (R - rSom) + 17} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="rgba(52,211,153,0.85)" fontFamily="ui-monospace,monospace">{som?.value ?? "—"}</text>
            </g>
          </svg>
        </div>

        {/* Cards right */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "16px 20px 16px 0" }}>
          {cards.map((c, i) => (
            <div key={c.key} style={{
              background: `rgba(${c.rgb},0.07)`,
              border: `1px solid rgba(${c.rgb},0.22)`,
              borderRadius: 14, padding: "14px 14px",
              display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8,
              opacity: 0, animation: `mkt-fadein 0.55s cubic-bezier(0.22,1,0.36,1) ${150 + i * 110}ms forwards`,
            }}>
              <div>
                {c.key === "SOM" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.color, boxShadow: `0 0 6px ${c.color}`, display: "inline-block" }} />
                    <span style={{ fontSize: 11, fontWeight: 800, color: c.color }}>{c.label}</span>
                  </div>
                )}
                {c.key !== "SOM" && (
                  <div style={{ fontSize: 11, fontWeight: 800, color: c.color, marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
                    {c.key === "TAM" && <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.color, display: "inline-block" }} />}
                    {c.label}
                  </div>
                )}
                <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>{c.sub}</div>
              </div>
              <div style={{ color: c.color, opacity: 0.6, flexShrink: 0, marginTop: 1 }}>{c.icon}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes mkt-fadein { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}

// ─── ANIMATED RADAR ───────────────────────────────────────────────────────────

function AnimatedRadar({ risks }: { risks: { level: string; title: string }[] }) {
  const animated = useAnimated(150);
  const axes = risks.length >= 3 ? risks.slice(0, 6) : [
    { title: "Competition", level: "high" }, { title: "Market", level: "medium" },
    { title: "Finance", level: "high" }, { title: "Team", level: "medium" },
    { title: "Regulatory", level: "low" }, { title: "Technology", level: "medium" },
  ];
  const n = axes.length;
  const cx = 110, cy = 110, r = 78;
  const lv: Record<string, number> = { high: 0.88, medium: 0.55, low: 0.28 };
  const lc: Record<string, string> = { high: "#f43f5e", medium: "#f59e0b", low: "#10b981" };

  const pts = axes.map((ax, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const frac = lv[ax.level] ?? 0.5;
    return {
      x: cx + Math.cos(angle) * r * frac,
      y: cy + Math.sin(angle) * r * frac,
      lx: cx + Math.cos(angle) * (r + 24),
      ly: cy + Math.sin(angle) * (r + 24),
      color: lc[ax.level] ?? "#a78bfa",
    };
  });
  const poly = pts.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <div style={{
      background: "linear-gradient(135deg,rgba(244,63,94,0.05) 0%,rgba(10,10,18,0.88) 100%)",
      border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 20, position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.02, backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.4) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
      <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 4 }}>Threat Matrix</div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg viewBox="0 0 220 220" width={200} height={200}>
          <defs>
            <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.04" />
            </radialGradient>
          </defs>
          {[0.28, 0.55, 0.88].map((frac, gi) => {
            const ringPts = Array.from({ length: n }, (_, i) => {
              const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
              return `${cx + Math.cos(angle) * r * frac},${cy + Math.sin(angle) * r * frac}`;
            }).join(" ");
            const cs = ["rgba(16,185,129,0.1)", "rgba(245,158,11,0.1)", "rgba(244,63,94,0.1)"];
            return <polygon key={gi} points={ringPts} fill={cs[gi]} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />;
          })}
          {axes.map((_, i) => {
            const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
            return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(angle)*r} y2={cy + Math.sin(angle)*r} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />;
          })}
          <polygon points={poly} fill="url(#radarFill)" stroke="rgba(244,63,94,0.6)" strokeWidth="1.5" strokeLinejoin="round"
            style={{ opacity: animated ? 1 : 0, transition: "opacity 0.8s ease-out 0.3s" }} />
          {pts.map((p, i) => (
            <g key={i} style={{ opacity: animated ? 1 : 0, transition: `opacity 0.3s ${0.5 + i * 0.07}s` }}>
              <circle cx={p.x} cy={p.y} r="5" fill="#05060A" stroke={p.color} strokeWidth="1.5"
                style={{ filter: `drop-shadow(0 0 4px ${p.color}80)` }} />
              <circle cx={p.x} cy={p.y} r="2" fill={p.color} />
              <text x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="middle"
                fontSize="7" fill="rgba(255,255,255,0.3)" fontFamily="system-ui">
                {axes[i].title.slice(0, 10)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ─── SCORE GAUGE (big) ────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => { const t = setTimeout(() => setVal(score), 200); return () => clearTimeout(t); }, [score]);
  const color = score >= 85 ? "#10b981" : score >= 70 ? "#f59e0b" : "#f43f5e";
  const cx = 65, cy = 65, r = 50;
  const circ = 2 * Math.PI * r;
  const maxDash = circ * 0.75;
  const drawn = (val / 100) * maxDash;

  return (
    <svg viewBox="0 0 130 104" width={130} height={104}>
      <g transform="rotate(-135 65 65)">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8"
          strokeDasharray={`${maxDash} ${circ}`} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${drawn} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.5s cubic-bezier(0.34,1.1,0.64,1) 0.2s", filter: `drop-shadow(0 0 6px ${color})` }} />
      </g>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="26" fontWeight="800" fill="white" fontFamily="ui-monospace,monospace">{val}</text>
      <text x={cx} y={cy + 23} textAnchor="middle" fontSize="7.5" fill="rgba(255,255,255,0.28)" fontFamily="system-ui" letterSpacing="1.5">BUSINESS SCORE</text>
    </svg>
  );
}

// ─── AGENT PANEL ──────────────────────────────────────────────────────────────

function AgentPanel({ letter, name, subtitle, color, score, opinion, delay = 0, agentId, projectContext }:
  { letter: string; name: string; subtitle: string; color: string; score: number; opinion: string; delay?: number; agentId?: string; projectContext?: string }) {
  const animated = useAnimated(delay);
  const scoreColor = score >= 85 ? "#10b981" : score >= 70 ? "#f59e0b" : "#f43f5e";

  const [streamedText, setStreamedText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [done, setDone] = useState(false);
  const started = useRef(false);

  const streamOpinion = useCallback(async () => {
    if (!projectContext || started.current) return;
    started.current = true;
    setStreaming(true);

    const persona = `You are ${name}, ${subtitle}. Respond strictly in character as this specialist, in English, without markdown symbols, concretely and professionally.`;
    const message = `${projectContext}\n\nGive your assessment of the project from your perspective (${subtitle}). Exactly 7-10 sentences. IMPORTANT: each sentence must be a maximum of 5-7 words, very short and crisp. Facts and conclusions only. In English, no lists or markdown.`;

    try {
      const res = await fetch("/api/chat/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, agentId: agentId ?? "general", persona, history: [] }),
      });
      if (!res.ok || !res.body) throw new Error("offline");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "", acc = "";
      while (true) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === "token") { acc += evt.token; setStreamedText(acc); }
          } catch { /* ignore */ }
        }
      }
      if (acc.trim()) { setDone(true); } else { setStreamedText(opinion); setDone(true); }
    } catch {
      setStreamedText(opinion);
      setDone(true);
    } finally {
      setStreaming(false);
    }
  }, [projectContext, name, subtitle, agentId, opinion]);

  useEffect(() => {
    if (!projectContext) return;
    const t = setTimeout(streamOpinion, delay + 200);
    return () => clearTimeout(t);
  }, [streamOpinion, delay, projectContext]);

  const displayText = projectContext ? streamedText : opinion;

  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14, padding: "16px 18px",
      opacity: animated ? 1 : 0, transform: animated ? "translateY(0)" : "translateY(12px)",
      transition: `opacity 0.45s ${delay}ms, transform 0.45s ${delay}ms`,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: color, borderRadius: "14px 0 0 14px" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, paddingLeft: 4 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 800, flexShrink: 0,
          background: `${color}15`, border: `1px solid ${color}25`, color,
        }}>{letter}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.9)", lineHeight: 1.2 }}>{name}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: scoreColor, fontFamily: "ui-monospace,monospace", lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em" }}>SCORE</div>
        </div>
      </div>
      <div style={{ paddingLeft: 4 }}>
        {streaming && !displayText && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 0" }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                width: 5, height: 5, borderRadius: "50%", background: color,
                animation: `ap-dot 1.2s ease-in-out ${i * 0.18}s infinite`,
              }} />
            ))}
          </div>
        )}
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.75, margin: 0, whiteSpace: "pre-wrap" }}>
          {displayText}
          {streaming && displayText && (
            <span style={{ display: "inline-block", width: 2, height: 13, background: color, marginLeft: 2, verticalAlign: "text-bottom", animation: "ap-cursor 0.8s ease-in-out infinite" }} />
          )}
        </p>
      </div>
      <style>{`
        @keyframes ap-dot { 0%,80%,100%{transform:scale(0.6);opacity:0.3} 40%{transform:scale(1);opacity:1} }
        @keyframes ap-cursor { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}

// ─── AGENT BRIEF (voice business assistant) ───────────────────────────────────
// Компактный «голосовой ассистент» раздела: аватар агента + короткое ясное
// объяснение того, что хотела донести команда, с озвучкой через Web Speech API.

function AgentBrief({ letter, name, role, color, rgb, text }:
  { letter: string; name: string; role: string; color: string; rgb: string; text: string }) {
  const animated = useAnimated(60);
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) { setSupported(false); return; }
    // Prime the voice list (loads async in Chrome)
    const warm = () => window.speechSynthesis.getVoices();
    warm();
    window.speechSynthesis.addEventListener("voiceschanged", warm);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", warm);
      window.speechSynthesis.cancel();
    };
  }, []);

  // Rank all available Russian voices and pick the best FEMALE one.
  // Network/neural voices (Google, Microsoft Online, "Natural") sound far
  // cleaner than the local robotic ones, so they score highest.
  const pickBestVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const ru = voices.filter(v => v.lang?.toLowerCase().startsWith("ru"));
    if (ru.length === 0) return null;
    const female = ["irina","svetlana","dariya","milena","alyona","katya","tatyana","elena","female"];
    const male   = ["pavel","dmitry","yuri","maxim","male","aleksandr"];
    const quality = ["google","natural","online","neural","premium","enhanced"];
    const score = (v: SpeechSynthesisVoice) => {
      const n = v.name.toLowerCase();
      let s = 0;
      if (quality.some(q => n.includes(q))) s += 10;   // neural/network = best
      if (female.some(f => n.includes(f)))  s += 5;    // female preferred
      if (male.some(m => n.includes(m)))    s -= 4;    // avoid male
      if (!v.localService)                  s += 3;    // remote voices are richer
      return s;
    };
    return [...ru].sort((a, b) => score(b) - score(a))[0];
  };

  // Chrome stops speechSynthesis after ~15s — speak sentence-by-sentence and
  // keep the engine alive with a periodic pause/resume so it never stutters out.
  const keepAlive = useRef<ReturnType<typeof setInterval> | null>(null);

  const speakSentences = (sentences: string[], voice: SpeechSynthesisVoice | null) => {
    let i = 0;
    const next = () => {
      if (i >= sentences.length) { setSpeaking(false); return; }
      const u = new SpeechSynthesisUtterance(sentences[i]);
      u.lang = "en-US";
      u.rate = 0.98;
      u.pitch = 1.12;
      if (voice) u.voice = voice;
      u.onend = () => { i++; next(); };
      u.onerror = () => { i++; next(); };
      window.speechSynthesis.speak(u);
    };
    next();
  };

  const toggleSpeak = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      if (keepAlive.current) clearInterval(keepAlive.current);
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const sentences = text.match(/[^.!?]+[.!?]*/g)?.map(s => s.trim()).filter(Boolean) ?? [text];
    setSpeaking(true);
    speakSentences(sentences, pickBestVoice());
    // keep-alive against Chrome's cutoff bug
    if (keepAlive.current) clearInterval(keepAlive.current);
    keepAlive.current = setInterval(() => {
      if (!window.speechSynthesis.speaking) { if (keepAlive.current) clearInterval(keepAlive.current); return; }
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 9000);
  };

  useEffect(() => () => { if (keepAlive.current) clearInterval(keepAlive.current); }, []);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      background: `linear-gradient(135deg, rgba(${rgb},0.08), rgba(255,255,255,0.02))`,
      border: `1px solid rgba(${rgb},0.22)`,
      borderRadius: 16, padding: "14px 16px",
      opacity: animated ? 1 : 0, transform: animated ? "translateY(0)" : "translateY(10px)",
      transition: "opacity 0.5s, transform 0.5s",
      position: "relative", overflow: "hidden",
    }}>
      {/* Avatar */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 13,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, fontWeight: 800, color,
          background: `rgba(${rgb},0.14)`, border: `1px solid rgba(${rgb},0.35)`,
        }}>{letter}</div>
        {/* speaking ring */}
        {speaking && (
          <span style={{
            position: "absolute", inset: -4, borderRadius: 16,
            border: `2px solid ${color}`, animation: "brief-ping 1.2s ease-out infinite",
          }} />
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{name}</span>
          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: `rgba(${rgb},0.14)`, border: `1px solid rgba(${rgb},0.25)`, color, letterSpacing: "0.04em" }}>{role}</span>
          {/* live voice waveform */}
          {speaking && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 2, marginLeft: 2 }}>
              {[0, 1, 2, 3].map(i => (
                <span key={i} style={{
                  width: 2.5, borderRadius: 2, background: color,
                  animation: `brief-wave 0.9s ease-in-out ${i * 0.12}s infinite`,
                }} />
              ))}
            </span>
          )}
        </div>
        <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.72)", lineHeight: 1.6, margin: 0 }}>{text}</p>
      </div>

      {/* Speak button */}
      {supported && (
        <button onClick={toggleSpeak} title={speaking ? "Stop" : "Play"} style={{
          flexShrink: 0, height: 38, padding: "0 14px", borderRadius: 11,
          display: "flex", alignItems: "center", gap: 7, cursor: "pointer",
          background: speaking ? `rgba(${rgb},0.22)` : `rgba(${rgb},0.12)`,
          border: `1px solid rgba(${rgb},0.35)`, color,
          fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap",
          transition: "background 0.15s",
        }}>
          {speaking ? (
            <>
              <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 12, height: 12 }}><rect x="3" y="3" width="10" height="10" rx="2"/></svg>
              Stop
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}>
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>
              </svg>
              Play
            </>
          )}
        </button>
      )}

      <style>{`
        @keyframes brief-ping { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(1.25);opacity:0} }
        @keyframes brief-wave { 0%,100%{height:5px} 50%{height:15px} }
      `}</style>
    </div>
  );
}

// ─── CIRCULAR SCORE (small) ───────────────────────────────────────────────────

function CircularScore({ score, color }: { score: number; color: string }) {
  const r = 22; const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg viewBox="0 0 60 60" width={40} height={40}>
      <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
      <circle cx="30" cy="30" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ * 0.25}
        strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color}80)` }} />
      <text x="30" y="35" textAnchor="middle" fontSize="11" fontWeight="700" fill="white" fontFamily="ui-monospace,monospace">{score}</text>
    </svg>
  );
}

// ─── AGENT COLORS ─────────────────────────────────────────────────────────────

const AGENT_COLORS: Record<string, string> = {
  "CEO": "#D946EF", "CFO": "#3b82f6", "CMO": "#f43f5e", "COO": "#10b981",
  "Business Analyst": "#f59e0b", "CTO": "#a78bfa", "Legal Advisor": "#94a3b8",
  "Sales Director": "#fb923c", "HR Director": "#f472b6",
};
function agentColor(role: string) {
  return AGENT_COLORS[role] ?? DEMO_AGENTS.find(a => a.id === role?.toLowerCase().slice(0,3))?.color ?? "#D946EF";
}

// ─── SCORE BANNER ─────────────────────────────────────────────────────────────

const SCORE_METRICS = [
  {
    key: 0, label: "MARKET POTENTIAL", color: "#D946EF", rgb: "217,70,239",
    icon: (
      <svg viewBox="0 0 48 48" width={44} height={44} fill="none">
        <circle cx="24" cy="24" r="22" fill="url(#mg1)" opacity={0.18}/>
        <defs><radialGradient id="mg1" cx="50%" cy="30%" r="70%"><stop offset="0%" stopColor="#D946EF"/><stop offset="100%" stopColor="#3a1cff" stopOpacity="0"/></radialGradient></defs>
        <ellipse cx="24" cy="24" rx="14" ry="14" stroke="#D946EF" strokeWidth="1.5" opacity={0.5}/>
        <ellipse cx="24" cy="24" rx="14" ry="6" stroke="#D946EF" strokeWidth="1" opacity={0.4}/>
        <line x1="10" y1="24" x2="38" y2="24" stroke="#D946EF" strokeWidth="1" opacity={0.4}/>
        <line x1="24" y1="10" x2="24" y2="38" stroke="#D946EF" strokeWidth="1" opacity={0.4}/>
        <path d="M18 30 L24 16 L30 26 L26 22 L24 30" stroke="#a78bfa" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
        <circle cx="24" cy="16" r="2" fill="#D946EF"/>
        <path d="M28 32 l4 4" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="32" cy="36" r="3" stroke="#f59e0b" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    desc: "Assessment of market size and growth rate.",
  },
  {
    key: 1, label: "FINANCIAL STABILITY", color: "#3b82f6", rgb: "59,130,246",
    icon: (
      <svg viewBox="0 0 48 48" width={44} height={44} fill="none">
        <defs><radialGradient id="mg2" cx="50%" cy="30%" r="70%"><stop offset="0%" stopColor="#3b82f6"/><stop offset="100%" stopColor="#1c4fff" stopOpacity="0"/></radialGradient></defs>
        <circle cx="24" cy="24" r="22" fill="url(#mg2)" opacity={0.18}/>
        <path d="M14 34 L20 26 L26 30 L34 18" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <circle cx="34" cy="18" r="2.5" fill="#3b82f6"/>
        <path d="M12 38 L12 20 M18 38 L18 28 M24 38 L24 24 M30 38 L30 16 M36 38 L36 10" stroke="#3b82f6" strokeWidth="3.5" strokeLinecap="round" opacity={0.35}/>
        <path d="M24 8 v6 M24 38 v4 M20 12 c0-2.2 1.8-4 4-4 s4 1.8 4 4 c0 2-1.2 3.5-3 4 v2 h-2 v-2 c-1.8-.5-3-2-3-4z" stroke="#f59e0b" strokeWidth="1.2" fill="none"/>
      </svg>
    ),
    desc: "Liquidity ratio and debt load.",
  },
  {
    key: 2, label: "FEASIBILITY", color: "#10b981", rgb: "16,185,129",
    icon: (
      <svg viewBox="0 0 48 48" width={44} height={44} fill="none">
        <defs><radialGradient id="mg3" cx="50%" cy="30%" r="70%"><stop offset="0%" stopColor="#10b981"/><stop offset="100%" stopColor="#00e7a7" stopOpacity="0"/></radialGradient></defs>
        <circle cx="24" cy="24" r="22" fill="url(#mg3)" opacity={0.15}/>
        <circle cx="24" cy="24" r="14" stroke="#10b981" strokeWidth="1.5" opacity={0.4}/>
        <circle cx="24" cy="24" r="10" stroke="#10b981" strokeWidth="1" opacity={0.3}/>
        <path d="M16 24 l5 5 l9-9" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M24 10 a14 14 0 0 1 9.9 4.1" stroke="#10b981" strokeWidth="1.5" opacity={0.6} strokeLinecap="round"/>
        <circle cx="33.9" cy="14.1" r="2" fill="#10b981" opacity={0.8}/>
      </svg>
    ),
    desc: "Technical and operational readiness.",
  },
  {
    key: 3, label: "COMPETITIVE ADVANTAGE", color: "#f59e0b", rgb: "245,158,11",
    icon: (
      <svg viewBox="0 0 48 48" width={44} height={44} fill="none">
        <defs><radialGradient id="mg4" cx="50%" cy="30%" r="70%"><stop offset="0%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#ff8800" stopOpacity="0"/></radialGradient></defs>
        <circle cx="24" cy="24" r="22" fill="url(#mg4)" opacity={0.15}/>
        <path d="M24 10 l2.4 7.2 h7.6 l-6 4.4 2.2 7-6.2-4.4-6.2 4.4 2.2-7-6-4.4h7.6z" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(245,158,11,0.12)"/>
        <path d="M18 32 l-2 6 M30 32 l2 6 M16 38 l8-3 8 3" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.7}/>
        <text x="24" y="40" textAnchor="middle" fontSize="7" fill="#f59e0b" fontWeight="700" letterSpacing="0.5" opacity={0.6}>MARKET</text>
      </svg>
    ),
    desc: "Product uniqueness and entry barriers.",
  },
];

// Explains WHY a category earned its score (transparency)
const SCORE_REASONS: Record<number, { hi: string; mid: string; lo: string }> = {
  0: { hi: "Large growing market, demand confirmed",       mid: "Market exists, but competition is high",        lo: "Narrow or saturated niche" },
  1: { hi: "Healthy unit economics, LTV/CAC > 3:1",          mid: "Model works, burn rate needs control",   lo: "Weak economics, high CAC" },
  2: { hi: "Achievable with the current team and stack",            mid: "Doable, but needs process and hiring",        lo: "High operational complexity" },
  3: { hi: "Clear differentiation and entry barriers",           mid: "There is an advantage, but it's easily copied",      lo: "Weak differentiation from leaders" },
};
function scoreReason(key: number, val: number): string {
  const r = SCORE_REASONS[key];
  if (!r) return "";
  return val >= 82 ? r.hi : val >= 68 ? r.mid : r.lo;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ScoreBanner({ project, aiResults }: { project: ProjectData; aiResults: any[] }) {
  const animated = useAnimated(120);

  const r = 56; const circ = 2 * Math.PI * r;
  const [scoreVal, setScoreVal] = useState(0);
  useEffect(() => { const t = setTimeout(() => setScoreVal(project.score), 300); return () => clearTimeout(t); }, [project.score]);
  const dash = (scoreVal / 100) * circ * 0.75;
  const scoreColor = project.score >= 85 ? "#10b981" : project.score >= 70 ? "#f59e0b" : "#f43f5e";

  const ceoSummary = aiResults.find(r => r.role === "CEO")?.recommendations ||
    aiResults.find(r => r.role === "Strategy Advisor")?.recommendations || "";
  const recLines = ceoSummary
    ? ceoSummary.replace(/\d+\./g, "|").split("|").map((s: string) => s.trim()).filter((s: string) => s.length > 12).slice(0, 3)
    : ["Optimize CAC to improve financial stability.", "Strengthen entry barriers.", "Accelerate market entry."];

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20,
      overflow: "hidden", marginBottom: 20,
      opacity: animated ? 1 : 0, transform: animated ? "translateY(0)" : "translateY(16px)",
      transition: "opacity 0.5s, transform 0.5s",
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 0, alignItems: "stretch" }}>

        {/* Left: score gauge */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "28px 32px", borderRight: "1px solid rgba(255,255,255,0.06)",
          background: `radial-gradient(ellipse at center, ${scoreColor}08 0%, transparent 70%)`,
        }}>
          <svg viewBox="0 0 130 110" width={130} height={110}>
            <g transform="rotate(-135 65 65)">
              <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7"
                strokeDasharray={`${circ * 0.75} ${circ}`} strokeLinecap="round" />
              <circle cx="65" cy="65" r={r} fill="none" stroke={scoreColor} strokeWidth="7"
                strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                style={{ transition: "stroke-dasharray 1.5s cubic-bezier(0.22,1,0.36,1) 0.4s", filter: `drop-shadow(0 0 8px ${scoreColor})` }} />
            </g>
            <text x="65" y="60" textAnchor="middle" fontSize="30" fontWeight="900" fill={scoreColor} fontFamily="ui-monospace,monospace">{scoreVal}</text>
            <text x="65" y="76" textAnchor="middle" fontSize="7" fontWeight="700" fill="rgba(255,255,255,0.35)" letterSpacing="1.5">BUSINESS SCORE</text>
          </svg>
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", textAlign: "center", marginTop: -4 }}>
            {project.score >= 85 ? "EXCELLENT" : project.score >= 70 ? "GOOD" : "NEEDS WORK"}
          </div>
          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.28)", textAlign: "center", marginTop: 8, lineHeight: 1.5, maxWidth: 150 }}>
            Weighted average across 4 categories →
          </div>
        </div>

        {/* Middle: 4 metric cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0, padding: "20px 16px", alignItems: "center" }}>
          {SCORE_METRICS.map((m, i) => {
            const val = project.scores[m.key]?.value ?? project.score;
            return (
              <div key={m.key} style={{
                padding: "0 16px",
                borderRight: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none",
                opacity: animated ? 1 : 0, transform: animated ? "translateY(0)" : "translateY(10px)",
                transition: `opacity 0.4s ${100 + i * 60}ms, transform 0.4s ${100 + i * 60}ms`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ filter: `drop-shadow(0 0 6px rgba(${m.rgb},0.6))`, flexShrink: 0 }}>{m.icon}</div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: m.color, fontFamily: "ui-monospace,monospace", lineHeight: 1, marginBottom: 4 }}>{val}<span style={{ fontSize: 12, opacity: 0.4 }}>/100</span></div>
                <div style={{ fontSize: 8, fontWeight: 800, color: m.color, letterSpacing: "0.1em", lineHeight: 1.3, marginBottom: 8, opacity: 0.85 }}>{m.label}</div>
                <div style={{ height: 3, borderRadius: 2, background: `rgba(${m.rgb},0.1)`, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 2,
                    width: animated ? `${val}%` : "0%",
                    background: m.color,
                    transition: `width 1.3s cubic-bezier(0.22,1,0.36,1) ${200 + i * 80}ms`,
                  }}/>
                </div>
                {/* WHY — transparency */}
                <div style={{ marginTop: 8, fontSize: 9.5, color: "rgba(255,255,255,0.42)", lineHeight: 1.45, display: "flex", gap: 5 }}>
                  <span style={{ color: `rgba(${m.rgb},0.7)`, flexShrink: 0 }}>&gt;</span>
                  <span>{scoreReason(m.key, val)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: AI recommendations */}
        <div style={{
          width: 200, borderLeft: "1px solid rgba(255,255,255,0.06)",
          padding: "20px 18px", display: "flex", flexDirection: "column", gap: 10,
          background: "rgba(124,58,237,0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7C3AED", flexShrink: 0 }} />
            <span style={{ fontSize: 8.5, fontWeight: 800, color: "#818cf8", letterSpacing: "0.14em" }}>AI RECOMMENDATIONS</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            {recLines.map((line: string, i: number) => (
              <div key={i} style={{
                fontSize: 10, color: "rgba(255,255,255,0.5)", lineHeight: 1.55,
                paddingLeft: 10, borderLeft: "2px solid rgba(124,58,237,0.35)",
              }}>
                {line.slice(0, 88)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────

const TABS = ["Diagnostics", "AI Team", "Finance", "Market", "Risks"];

// ─── DIAGNOSTICS TAB ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DiagnosticsTab({ project, aiResults }: { project: ProjectData; aiResults: any[] }) {
  const agents = aiResults.length > 0
    ? aiResults.map(r => ({
        id: r.role, role: r.role, name: r.name || r.role,
        color: agentColor(r.role), title: r.title || r.role, score: r.score,
        opinion: [r.summary, r.analysis, r.recommendations].filter(Boolean).join(" ").slice(0, 600),
      }))
    : DEMO_AGENTS;

  // Сервер принимает вопрос не длиннее 1000 символов: контекст проекта режем,
  // оставляя место инструкции (~250 символов) в самом сообщении.
  const projectContext = `Project: "${project.name}". ${project.subtitle}. Description: ${project.summary}. Key financial metrics: ${project.financials.map(f => `${f.label} — ${f.value}`).join(", ")}.`.slice(0, 700);

  const avgScore = Math.round(agents.reduce((s, a) => s + a.score, 0) / agents.length);

  const diagBrief = `Board summary: the project scored ${project.score} out of 100 — ${project.score >= 85 ? "a strong idea, ready to launch" : project.score >= 70 ? "viable, but there's room to refine" : "needs serious work"}. Strongest area — market potential, weakest — competitive advantage. Below, each executive gives their own assessment.`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <AgentBrief letter="S" name="Sophia Rivers" role="CEO" color="#7C3AED" rgb="124,58,237" text={diagBrief} />
      {/* Summary strip */}
      <div style={{
        display: "flex", alignItems: "center", gap: 24,
        padding: "14px 20px", borderRadius: 12,
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "white", fontFamily: "ui-monospace,monospace" }}>{agents.length}</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}>SPECIALISTS</div>
        </div>
        <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.07)" }} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#7C3AED", fontFamily: "ui-monospace,monospace" }}>{avgScore}</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}>AVG SCORE</div>
        </div>
        <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.07)" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
            Full analysis from {agents.length} AI specialists. Each expert assessed the project within their area of expertise.
          </div>
        </div>
      </div>

      {/* Agents grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
        {agents.map((agent, i) => (
          <AgentPanel
            key={agent.id}
            letter={(agent.name || agent.role)[0]}
            name={agent.name || agent.role}
            subtitle={agent.title}
            color={agent.color}
            score={agent.score}
            opinion={agent.opinion || "Project analysis complete."}
            delay={80 + i * 50}
            agentId={agent.id}
            projectContext={projectContext}
          />
        ))}
      </div>
    </div>
  );
}

// ─── AI TEAM TAB — organized roster (design-system rewrite) ─────────────────

// Division = a C-level lead + their direct reports, matching the org reality
// described by AGENT_META in src/lib/agents.ts.
const DIVISIONS: { lead: string; badge: string; reports: string[] }[] = [
  { lead: "CMO", badge: "CMO", reports: ["Brand Strategist", "PR Director", "Market Research"] },
  { lead: "COO", badge: "COO", reports: ["Supply Chain", "HR Director", "UX Researcher"] },
  { lead: "CFO", badge: "CFO", reports: ["Investor Relations", "Risk Manager"] },
  { lead: "CTO", badge: "CTO", reports: ["Product Manager", "Data Scientist"] },
  { lead: "Sales Director", badge: "SALES", reports: ["Growth Hacker", "Business Analyst"] },
  { lead: "Strategy Advisor", badge: "STRAT", reports: ["Legal Advisor"] },
];

const TEAM_AGENT_COLORS: Record<string, string> = {
  "CEO": "#7C3AED", "CFO": "#3b82f6", "CMO": "#f43f5e", "COO": "#10b981",
  "CTO": "#D946EF", "Sales Director": "#f59e0b", "Strategy Advisor": "#a78bfa",
  "Legal Advisor": "#94a3b8", "Brand Strategist": "#f472b6", "PR Director": "#fb7185",
  "Market Research": "#f59e0b", "Supply Chain": "#34d399", "HR Director": "#f472b6",
  "UX Researcher": "#a78bfa", "Investor Relations": "#60a5fa", "Risk Manager": "#f87171",
  "Product Manager": "#a78bfa", "Data Scientist": "#38bdf8", "Growth Hacker": "#fb923c",
  "Business Analyst": "#f59e0b",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AITeamTab({ aiResults, isUserProject, isReanalyzing, reanalyzeProgress, onReanalyze }:
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { aiResults: any[]; isUserProject: boolean; isReanalyzing: boolean; reanalyzeProgress: number; onReanalyze: () => void }) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const animated = useAnimated(150);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agentMap: Record<string, any> = {};
  aiResults.forEach(a => { agentMap[a.role] = a; });

  const ceo = agentMap["CEO"];
  const selAgent = selectedRole ? agentMap[selectedRole] : null;
  const selColor = selectedRole ? (TEAM_AGENT_COLORS[selectedRole] ?? "#7C3AED") : "#7C3AED";
  const emptyState = aiResults.length === 0;

  function agentStats(role: string) {
    const seed = role.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return {
      tasks: 80 + (seed % 120),
      accuracy: (94 + (seed % 59) / 10).toFixed(1),
      avgTime: (8 + (seed % 12)).toFixed(1),
      tokPerSec: 60 + (seed % 50),
    };
  }

  // Small roster chip — used for both division leads and their reports.
  function AgentChip({ role, small }: { role: string; small?: boolean }) {
    const color = TEAM_AGENT_COLORS[role] ?? "#7C3AED";
    const hasData = !!agentMap[role];
    const isSelected = role === selectedRole;
    const score = agentMap[role]?.score;
    return (
      <button
        onClick={() => setSelectedRole(isSelected ? null : role)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: small ? "8px 12px" : "10px 14px",
          borderRadius: 12, cursor: "pointer", textAlign: "left", width: "100%",
          background: isSelected ? `${color}14` : "rgba(255,255,255,0.025)",
          border: `1px solid ${isSelected ? `${color}55` : "rgba(255,255,255,0.07)"}`,
          transition: "background 0.2s, border-color 0.2s",
        }}
      >
        <span style={{
          width: small ? 26 : 32, height: small ? 26 : 32, borderRadius: 9, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: `${color}18`, border: `1px solid ${color}35`,
          fontSize: small ? 10 : 12, fontWeight: 800, color,
        }}>{role[0]}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: small ? 11.5 : 12.5, fontWeight: 700, color: "#E5E7EB", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{role}</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {hasData ? (
            <span style={{ fontSize: 11, fontWeight: 800, fontFamily: "ui-monospace,monospace", color }}>{score}</span>
          ) : (
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f43f5e" }} />
          )}
        </span>
      </button>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <div style={{ marginBottom: 14 }}>
        <AgentBrief letter="S" name="Sophia Rivers" role="CEO" color="#7C3AED" rgb="124,58,237"
          text="This is your AI team — 20 specialists, each has broken down the project from their angle. Click any agent to see their full analysis. Press \u201cPlay\u201d and I'll walk you through the highlights." />
      </div>

      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.16em", textTransform: "uppercase" }}>
            Executive Board — Organizational Structure
          </div>
          <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>
            {aiResults.length} of 20 agents active · click a card for the full analysis
          </div>
        </div>
        {isUserProject && (
          <button onClick={onReanalyze} disabled={isReanalyzing} style={{
            height: 38, padding: "0 18px", borderRadius: 11, fontSize: 12.5, fontWeight: 700, cursor: isReanalyzing ? "default" : "pointer",
            background: isReanalyzing ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#7C3AED,#6D28D9)",
            color: isReanalyzing ? "rgba(255,255,255,0.4)" : "#fff",
            border: "none", display: "flex", alignItems: "center", gap: 8,
            boxShadow: isReanalyzing ? "none" : "0 6px 18px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.16)",
          }}>
            <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 11, height: 11 }}><polygon points="3,2 14,8 3,14"/></svg>
            {isReanalyzing ? `Analyzing… ${reanalyzeProgress}/8` : "Run Analysis"}
          </button>
        )}
      </div>

      {emptyState ? (
        <div style={{
          borderRadius: 18, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)",
          padding: "56px 24px", textAlign: "center",
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 8 }}>AI analysis hasn't been run yet</div>
          <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)", marginBottom: 20, lineHeight: 1.6, maxWidth: 320, marginInline: "auto" }}>
            Run the analysis to activate all 20 board agents.
          </p>
          {isUserProject && (
            <button onClick={onReanalyze} disabled={isReanalyzing}
              style={{ height: 42, padding: "0 28px", fontSize: 13, fontWeight: 700, background: "linear-gradient(135deg,#7C3AED,#6D28D9)", color: "#fff", border: "none", borderRadius: 11, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
              <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 12, height: 12 }}><polygon points="3,2 14,8 3,14"/></svg>
              {isReanalyzing ? `Starting… ${reanalyzeProgress}/8` : "Run Analysis"}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* CEO hero row */}
          <div style={{ marginBottom: 14, opacity: animated ? 1 : 0, transition: "opacity 0.4s" }}>
            <button onClick={() => setSelectedRole(selectedRole === "CEO" ? null : "CEO")}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 16, textAlign: "left", cursor: "pointer",
                borderRadius: 16, padding: "16px 20px",
                background: selectedRole === "CEO" ? "rgba(124,58,237,0.12)" : "linear-gradient(160deg, rgba(124,58,237,0.08), rgba(255,255,255,0.02) 65%)",
                border: `1px solid ${selectedRole === "CEO" ? "rgba(124,58,237,0.5)" : "rgba(124,58,237,0.22)"}`,
              }}>
              <span style={{ width: 48, height: 48, borderRadius: 13, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                background: "linear-gradient(135deg,#7C3AED,#6D28D9)", color: "#fff", fontSize: 18, fontWeight: 800, boxShadow: "0 6px 18px rgba(124,58,237,0.4)" }}>C</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 14.5, fontWeight: 800, color: "white" }}>CEO — Chief Executive Officer</span>
                <span style={{ display: "block", fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Synthesizes every director's findings into a single strategy</span>
              </span>
              {ceo && <span style={{ fontSize: 26, fontWeight: 900, fontFamily: "ui-monospace,monospace", color: "#818cf8" }}>{ceo.score}</span>}
            </button>
          </div>

          {/* Division grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            {DIVISIONS.map((div, di) => {
              const leadColor = TEAM_AGENT_COLORS[div.lead] ?? "#7C3AED";
              return (
                <div key={div.lead} style={{
                  borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)",
                  padding: 12, opacity: animated ? 1 : 0, transform: animated ? "none" : "translateY(8px)",
                  transition: `opacity 0.4s ${di * 40}ms, transform 0.4s ${di * 40}ms`,
                }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: leadColor, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8, paddingLeft: 2 }}>
                    {div.badge} · division
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <AgentChip role={div.lead} />
                    {div.reports.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 14, marginTop: 2, borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
                        {div.reports.map(r => <AgentChip key={r} role={r} small />)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Selected agent — full analysis panel */}
      {selAgent && (() => {
        const stats = agentStats(selectedRole!);
        return (
          <div style={{
            marginTop: 16, borderRadius: 18, padding: "20px 22px",
            background: `linear-gradient(160deg, ${selColor}0e, rgba(255,255,255,0.02) 60%)`,
            border: `1px solid ${selColor}35`,
            boxShadow: `0 1px 2px rgba(0,0,0,0.4), 0 16px 44px rgba(0,0,0,0.28)`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${selColor}18`, border: `1px solid ${selColor}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: selColor }}>{selAgent.role[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: "white" }}>{selAgent.role}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{selAgent.title || selAgent.role}</div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: selColor, fontFamily: "monospace" }}>{selAgent.score}</div>
            </div>

            {/* Compact stat row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
              {[
                ["Model", "Claude Haiku 4.5"],
                ["Accuracy", `${stats.accuracy}%`],
                ["Tasks Completed", `${stats.tasks}`],
                ["Avg. Time", `${stats.avgTime} min`],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: "9px 11px", borderRadius: 10, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em", marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "#E5E7EB", fontVariantNumeric: "tabular-nums" }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Summary", text: selAgent.summary },
                { label: "Analysis", text: selAgent.analysis },
                { label: "Recommendations", text: selAgent.recommendations },
                { label: "Risks", text: selAgent.risks },
              ].filter(s => s.text).map((sec, si) => (
                <div key={si} style={{ padding: "13px 15px", borderRadius: 12, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 7 }}>{sec.label}</div>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.72)", lineHeight: 1.75, margin: 0, whiteSpace: "pre-wrap" }}>{sec.text}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
// ─── WHAT-IF SIMULATOR ────────────────────────────────────────────────────────
// Live recompute of the financial model when the operator changes assumptions.
function parseMoney(s?: string): number {
  if (!s) return 0;
  const m = s.replace(/\s/g, "").match(/([\d.]+)\s*([KkMm]?)/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const u = m[2].toLowerCase();
  if (u === "m") return n * 1000;   // → in thousands
  if (u === "k") return n;
  return n / 1000;
}
const fmtMoney = (k: number) => k >= 1000 ? `$${(k / 1000).toFixed(1)}M` : `$${Math.round(k)}K`;

function WhatIfPanel({ financials }: { financials: { label: string; value: string; numeric?: number }[] }) {
  const yr1  = financials.find(f => f.label.toLowerCase().includes("year 1"))?.numeric ?? 240;
  const yr3  = financials.find(f => f.label.toLowerCase().includes("year 3"))?.numeric ?? 2400;
  const ltv0 = parseMoney(financials.find(f => f.label.toLowerCase().includes("ltv"))?.value) * 1000 || 180;
  const cac0 = parseMoney(financials.find(f => f.label.toLowerCase() === "cac" || f.label.toLowerCase().includes("cac"))?.value) * 1000 || 22;

  const [price, setPrice]   = useState(1);   // price
  const [cost, setCost]     = useState(1);   // costs/CAC
  const [volume, setVolume] = useState(1);   // volume/customers

  // Recompute
  const rev1 = yr1 * price * volume;
  const rev3 = yr3 * price * volume;
  const ltv  = ltv0 * price;
  const cac  = cac0 * cost;
  const ratio = cac > 0 ? ltv / cac : 0;
  const beBase = 18;
  const be = Math.max(4, Math.round(beBase * cost / (price * Math.sqrt(volume))));
  const changed = price !== 1 || cost !== 1 || volume !== 1;

  const Slider = ({ label, val, set, min, max, unit }: { label: string; val: number; set: (v: number) => void; min: number; max: number; unit: string }) => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{label}</span>
        <span className="term-mono" style={{ fontSize: 11, fontWeight: 700, color: val === 1 ? "rgba(255,255,255,0.5)" : "#a5b4fc" }}>
          {val > 1 ? "+" : ""}{Math.round((val - 1) * 100)}% <span style={{ opacity: 0.4 }}>{unit}</span>
        </span>
      </div>
      <input type="range" min={min} max={max} step={0.05} value={val} onChange={e => set(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: "#7C3AED", cursor: "pointer" }} />
    </div>
  );

  const out = [
    { label: "REVENUE YEAR 1", base: yr1,  now: rev1, fmt: fmtMoney },
    { label: "REVENUE YEAR 3", base: yr3,  now: rev3, fmt: fmtMoney },
    { label: "LTV / CAC",     base: ltv0 / cac0, now: ratio, fmt: (n: number) => `${n.toFixed(1)}x` },
    { label: "BREAKEVEN",   base: beBase, now: be, fmt: (n: number) => `${Math.round(n)} mo`, invert: true },
  ];

  return (
    <div style={{ borderRadius: 16, border: "1px solid rgba(124,58,237,0.2)", background: "rgba(124,58,237,0.03)", overflow: "hidden" }}>
      <div className="term-mono" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ fontSize: 11, letterSpacing: "0.14em", color: "#a5b4fc" }}>// WHAT-IF SIMULATOR</span>
        {changed && (
          <button onClick={() => { setPrice(1); setCost(1); setVolume(1); }} style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "3px 9px", cursor: "pointer", letterSpacing: "0.08em" }}>RESET</button>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(220px,1fr) minmax(240px,1.1fr)", gap: 0 }}>
        {/* Controls */}
        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16, borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <Slider label="Product Price"     val={price}  set={setPrice}  min={0.5} max={2} unit="price" />
          <Slider label="Costs / CAC"     val={cost}   set={setCost}   min={0.5} max={2} unit="costs" />
          <Slider label="Volume / Customers"   val={volume} set={setVolume} min={0.5} max={2.5} unit="scale" />
          <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)", lineHeight: 1.5, margin: 0 }}>
            Move the sliders — the model recalculates instantly. This is an estimated projection, not a guarantee.
          </p>
        </div>
        {/* Outputs */}
        <div style={{ padding: "18px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {out.map(o => {
            const better = o.invert ? o.now < o.base : o.now > o.base;
            const same = Math.abs(o.now - o.base) < 0.01;
            const col = same ? "rgba(255,255,255,0.85)" : better ? "#34d399" : "#f87171";
            return (
              <div key={o.label} style={{ borderRadius: 12, padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="term-mono" style={{ fontSize: 8.5, letterSpacing: "0.12em", color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>{o.label}</div>
                <div className="term-value" style={{ fontSize: 21, fontWeight: 800, color: col, lineHeight: 1 }}>{o.fmt(o.now)}</div>
                {!same && (
                  <div className="term-mono" style={{ fontSize: 9.5, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                    was {o.fmt(o.base)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── SCENARIOS (crisis / base / growth) ───────────────────────────────────────
function ScenariosPanel({ financials }: { financials: { label: string; value: string; numeric?: number }[] }) {
  const animated = useAnimated(150);
  const yr3 = financials.find(f => f.label.toLowerCase().includes("year 3"))?.numeric ?? 2400;
  const be0 = 18;

  const SC = [
    { key: "crisis", label: "PESSIMISTIC", tone: "#f87171", rgb: "248,113,113", rev: 0.55, be: 1.6,
      note: "Slow growth, high CAC, market contraction. Requires runway and tight burn control." },
    { key: "base",   label: "BASE",        tone: "#a5b4fc", rgb: "124,58,237", rev: 1.0,  be: 1.0,
      note: "Realistic scenario under current assumptions and steady plan execution." },
    { key: "growth", label: "OPTIMISTIC",  tone: "#34d399", rgb: "52,211,153", rev: 1.7,  be: 0.65,
      note: "PMF found, organic growth and network effects kick in, acquisition gets cheaper at scale." },
  ];

  return (
    <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", overflow: "hidden" }}>
      <div className="term-mono" style={{ padding: "13px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 11, letterSpacing: "0.14em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>
        // scenario analysis — year 3 revenue
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 0 }}>
        {SC.map((s, i) => {
          const rev = yr3 * s.rev;
          const be = Math.round(be0 * s.be);
          return (
            <div key={s.key} style={{
              padding: "20px", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
              background: s.key === "base" ? `rgba(${s.rgb},0.04)` : "transparent",
              opacity: animated ? 1 : 0, transform: animated ? "translateY(0)" : "translateY(12px)",
              transition: `opacity 0.5s ${i * 100}ms, transform 0.5s ${i * 100}ms`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.tone, boxShadow: `0 0 6px ${s.tone}` }} />
                <span className="term-mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: s.tone }}>{s.label}</span>
              </div>
              <div className="term-value" style={{ fontSize: 30, fontWeight: 800, color: "#fff", lineHeight: 1, marginBottom: 4 }}>{fmtMoney(rev)}</div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", marginBottom: 14 }}>breakeven ≈ {be} mo</div>
              {/* bar */}
              <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 14 }}>
                <div style={{ height: "100%", borderRadius: 2, background: s.tone, width: animated ? `${Math.min(100, s.rev / 1.7 * 100)}%` : "0%", transition: `width 1.2s cubic-bezier(0.22,1,0.36,1) ${200 + i * 100}ms` }} />
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", lineHeight: 1.55, margin: 0 }}>{s.note}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── FINANCE TAB ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FinanceTab({ project, aiResults }: { project: ProjectData; aiResults: any[] }) {
  const animated = useAnimated(100);
  const cfo = aiResults.find((r: { role: string }) => r.role === "CFO" || r.role?.toLowerCase().includes("financ"));
  const coo = aiResults.find((r: { role: string }) => r.role === "COO" || r.role?.toLowerCase().includes("operatio"));
  const ceo = aiResults.find((r: { role: string }) => r.role === "CEO" || r.role?.toLowerCase().includes("ceo"));

  const FIN_AGENTS = [
    cfo ? { ...cfo, color: "#3b82f6", letter: "J", subtitle: "Chief Financial Officer — forecast", opinion: [cfo.analysis, cfo.recommendations, cfo.forecast].filter(Boolean).join(" ").slice(0, 500) } : null,
    coo ? { ...coo, color: "#10b981", letter: "E", subtitle: "Chief Operating Officer — budget", opinion: [coo.analysis, coo.recommendations].filter(Boolean).join(" ").slice(0, 450) } : null,
    ceo ? { ...ceo, color: "#D946EF", letter: "V", subtitle: "Chief Executive Officer — strategy", opinion: [ceo.summary, ceo.forecast].filter(Boolean).join(" ").slice(0, 450) } : null,
  ].filter(Boolean) as { role: string; name: string; color: string; letter: string; subtitle: string; score: number; opinion: string }[];

  const yr1 = project.financials.find(f => f.label.toLowerCase().includes("year 1"));
  const yr3 = project.financials.find(f => f.label.toLowerCase().includes("year 3"));
  const breakeven = project.financials.find(f => f.label.toLowerCase().includes("breakeven"));
  const ltv = project.financials.find(f => f.label.toLowerCase().includes("ltv"));
  const cac = project.financials.find(f => f.label.toLowerCase().includes("cac") && !f.label.toLowerCase().includes("/"));
  const ltvcac = project.financials.find(f => f.label.toLowerCase().includes("ltv/cac") || f.label.toLowerCase().includes("ltv/"));
  const timeframeVal = project.financials.find(f => f.label.toLowerCase().includes("timeframe"));

  // Icon SVGs as inline components
  const IconRevYear = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
      <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
      <path d="M7 7h10M7 11h6" />
    </svg>
  );
  const IconTrendUp = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
    </svg>
  );
  const IconClock = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
  const IconUser = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
  const IconFilter = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
  const IconCalc = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
      <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="8" y2="10" strokeLinecap="round" strokeWidth="2" />
      <line x1="12" y1="10" x2="12" y2="10" strokeLinecap="round" strokeWidth="2" />
      <line x1="16" y1="10" x2="16" y2="10" strokeLinecap="round" strokeWidth="2" />
      <line x1="8" y1="14" x2="8" y2="14" strokeLinecap="round" strokeWidth="2" />
      <line x1="12" y1="14" x2="16" y2="14" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
  const IconCalendar = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );

  const IND = "#7C3AED", INDRGB = "124,58,237";
  const rightCards = [
    { label: "FORECAST (YEAR 1):", value: yr1?.value ?? "—", color: IND, rgb: INDRGB, Icon: IconRevYear },
    { label: "FORECAST (YEAR 3):", value: yr3?.value ?? "—", color: IND, rgb: INDRGB, Icon: IconTrendUp },
    { label: "BREAKEVEN POINT:", value: breakeven?.value ?? "—", color: IND, rgb: INDRGB, Icon: IconClock },
  ];
  const bottomCards = [
    { label: "USER LTV:", value: ltv?.value ?? "—", color: IND, rgb: INDRGB, Icon: IconUser },
    { label: "CAC:", value: cac?.value ?? "—", color: IND, rgb: INDRGB, Icon: IconFilter },
    { label: "LTV/CAC RATIO:", value: ltvcac?.value ?? "—", suffix: true, color: "#10b981", rgb: "16,185,129", Icon: IconCalc },
    { label: "TIMEFRAME:", value: timeframeVal?.value ?? (project.financials[5]?.value ?? "—"), color: IND, rgb: INDRGB, Icon: IconCalendar },
  ];

  const finBrief = `Quick financial rundown: revenue grows from ${project.financials[0]?.value ?? ""} to ${project.financials[1]?.value ?? ""} over 3 years, breakeven is ${project.financials.find(f => f.label.toLowerCase().includes("breakeven"))?.value ?? "around 18 months"}. The LTV-to-CAC ratio is healthy. Keep burn under control and maintain a runway of at least 18 months.`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      <AgentBrief letter="M" name="Marcus Chen" role="CFO" color="#3b82f6" rgb="59,130,246" text={finBrief} />

      {/* ── KPI Strip (top 3 + bottom 4 merged into single row) ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(7,1fr)",
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16, overflow: "hidden",
      }}>
        {[...rightCards, ...bottomCards].map((c, i) => (
          <div key={i} style={{
            padding: "18px 16px",
            borderRight: i < 6 ? "1px solid rgba(255,255,255,0.05)" : "none",
            position: "relative", overflow: "hidden",
            opacity: animated ? 1 : 0, transform: animated ? "translateY(0)" : "translateY(8px)",
            transition: `opacity 0.4s ${60 + i * 50}ms, transform 0.4s ${60 + i * 50}ms`,
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: c.color, opacity: 0.7 }} />
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 8, lineHeight: 1.3 }}>{c.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: c.color, fontFamily: "ui-monospace,monospace", lineHeight: 1, display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
              {c.value}
            </div>
            <div style={{ color: c.color, opacity: 0.35 }}><c.Icon /></div>
          </div>
        ))}
      </div>

      {/* ── Revenue Chart ── */}
      <DetailedRevenueChart financials={project.financials} />

      {/* ── What-if simulator ── */}
      <WhatIfPanel financials={project.financials} />

      {/* ── Scenario analysis ── */}
      <ScenariosPanel financials={project.financials} />

      {/* ── AGENT PANELS ── */}
      {FIN_AGENTS.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {FIN_AGENTS.map((ag, i) => (
            <AgentPanel key={i} letter={ag.letter} name={ag.role} subtitle={ag.subtitle}
              color={ag.color} score={ag.score} opinion={ag.opinion || "Financial analysis unavailable. Run the AI analysis."} delay={i * 120} />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { letter: "J", name: "CFO", subtitle: "Chief Financial Officer's assessment", color: "#3b82f6", score: 79,
              opinion: "The project's financial structure is generally sound and only needs refinement in revenue forecasting. Burn rate should be optimized to a maximum of 15% of monthly MRR from day one. CAC needs to drop 20% to hit profitability on schedule. Build a runway of at least 18 months before the next funding round. P&L should turn positive no later than month 20 from launch. Revenue-based financing is worth considering as an early-stage alternative to equity dilution. Unit economics become viable at a scale of 1000+ active customers. Financial KPIs need weekly monitoring to catch deviations early." },
            { letter: "E", name: "COO", subtitle: "Chief Operating Officer — operating expenses", color: "#10b981", score: 76,
              opinion: "Operationally, the project has a realistic cost structure for its current stage. Operating expenses can be optimized by 20-25% by introducing automation from the early months. COGS should be tracked weekly and kept under 35% of revenue. Operating leverage will start showing once the system reaches 500 paying customers. Fixed costs need to stay minimal through the first 18 months of operations." },
            { letter: "V", name: "CEO", subtitle: "Chief Executive Officer — growth strategy", color: "#D946EF", score: 82,
              opinion: "Strategically the project is moving in the right direction, but needs clear prioritization. The next funding round should be raised upon reaching $100K MRR. Investment attractiveness is high when demonstrating sustained growth of over 15% per month. Capital efficiency should exceed 1.5x MRR/burn throughout the period up to profitability." },
          ].map((ag, i) => (
            <AgentPanel key={i} letter={ag.letter} name={ag.name} subtitle={ag.subtitle}
              color={ag.color} score={ag.score} opinion={ag.opinion} delay={i * 120} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MARKET TAB ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MarketTab({ project, aiResults }: { project: ProjectData; aiResults: any[] }) {
  const animated = useAnimated(100);
  const ba = aiResults.find((r: { role: string }) => r.role === "Business Analyst" || r.role?.toLowerCase().includes("analyst"));
  const cmo = aiResults.find((r: { role: string }) => r.role === "CMO" || r.role?.toLowerCase().includes("marketing"));
  const ceo = aiResults.find((r: { role: string }) => r.role === "CEO" || r.role?.toLowerCase().includes("ceo"));

  const MKT_AGENTS = [
    ba ? { letter: "M", name: "Business Analyst", subtitle: "Business Analyst — market analysis", color: "#f59e0b", score: ba.score, opinion: [ba.analysis, ba.facts].filter(Boolean).join(" ").slice(0, 500) } : null,
    cmo ? { letter: "S", name: "CMO", subtitle: "Chief Marketing Officer — strategy", color: "#f43f5e", score: cmo.score, opinion: [cmo.analysis, cmo.recommendations].filter(Boolean).join(" ").slice(0, 500) } : null,
    ceo ? { letter: "V", name: "CEO", subtitle: "Chief Executive Officer — market position", color: "#D946EF", score: ceo.score, opinion: [ceo.summary, ceo.analysis].filter(Boolean).join(" ").slice(0, 450) } : null,
  ].filter(Boolean) as { letter: string; name: string; subtitle: string; color: string; score: number; opinion: string }[];

  const fallbackAgents = [
    { letter: "M", name: "Business Analyst", subtitle: "Market analysis and competitive landscape", color: "#f59e0b", score: 80,
      opinion: "Market analysis confirms real demand exists in the target audience segment. Competitors don't fully address the key pain point this project targets. Market trends are positive: CAGR of 15-25% is forecast over the next 5 years. Entry barriers are moderate — the window of opportunity is open for fast market entry. Consumer behavior is shifting in favor of this solution across all key metrics. The competitive map shows an unoccupied niche in the mid-price category. Seasonality needs separate accounting when planning cashflow and marketing activity. Geographic expansion is possible once PMF is reached in the local home market." },
    { letter: "S", name: "CMO", subtitle: "Marketing strategy and GTM", color: "#f43f5e", score: 84,
      opinion: "Market positioning needs clearer differentiation from key competitors in the segment. Content marketing is the optimal primary acquisition channel for this type of product. Brand voice must be strictly documented before the first public contact with the audience. Organic CAC can run 3-5x lower than paid with the right long-term SEO strategy. An email retention program can cut churn by 15-20% when executed well. Partnering with niche opinion leaders will deliver fast initial traction in the first 90 days. A/B testing the landing page and onboarding is mandatory from the first day of traffic acquisition. Community-building around the product creates an organic acquisition loop with zero CAC." },
    { letter: "V", name: "CEO", subtitle: "Strategic market position", color: "#D946EF", score: 82,
      opinion: "The project's market position looks strong given the right niche positioning. Timely market entry creates a first-mover advantage over potential competitors. Partnerships with complementary products will accelerate market penetration without significant cost. An ecosystem strategy through integrations creates high switching costs for the company's customers. Geographic scaling should only start after reaching unit economics in the first location. Network effects need to be deliberately built into the product roadmap from version one. Dominating a single niche beats a weak presence across several directions at once. A strategic distribution partner can accelerate market share better than organic growth." },
  ];

  const agents = MKT_AGENTS.length >= 2 ? MKT_AGENTS : fallbackAgents;

  const briefText = `The market is big — total size ${project.market[0]?.value ?? ""}, but our real target is the core ${project.market[2]?.value ?? ""}. Demand is confirmed, the niche isn't fully taken, growth rate is ${project.market[3]?.value ?? ""}. The key is to focus on one segment and own it.`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <AgentBrief letter="K" name="Kim Park" role="Business Analyst" color="#0ea5e9" rgb="14,165,233" text={briefText} />
      <MarketSphereChart items={project.market} />

      {/* Market metrics row */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4,1fr)",
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14,
        overflow: "hidden",
        opacity: animated ? 1 : 0, transition: "opacity 0.5s 200ms",
      }}>
        {project.market.map((m, i) => {
          // Single indigo accent; SOM (target) stays green as the semantic goal
          const color = i === 2 ? "#10b981" : "#7C3AED";
          return (
            <div key={i} style={{
              padding: "18px 16px",
              borderRight: i < project.market.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
              position: "relative",
            }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color }} />
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>{m.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: "ui-monospace,monospace", marginBottom: 10 }}>{m.value}</div>
              {m.numeric && <AnimatedBar value={Math.min(100, (m.numeric / (project.market[0]?.numeric || 1)) * 100)} color={color} delay={200 + i * 80} height={3} />}
            </div>
          );
        })}
      </div>

      {/* Agent opinions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {agents.map((ag, i) => (
          <AgentPanel key={i} letter={ag.letter} name={ag.name} subtitle={ag.subtitle}
            color={ag.color} score={ag.score} opinion={ag.opinion} delay={i * 120} />
        ))}
      </div>
    </div>
  );
}

// ─── RISKS TAB ────────────────────────────────────────────────────────────────

// ─── RISK CARD ILLUSTRATIONS ─────────────────────────────────────────────────

function RiskIllustration({ index, color, rgb }: { index: number; color: string; rgb: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const [r, g, b] = rgb.split(",").map(Number);

    // Background glow
    const bg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.7);
    bg.addColorStop(0, `rgba(${r},${g},${b},0.18)`);
    bg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    if (index === 0) {
      // Shield + chess pieces — competitive dynamics
      const drawShield = (cx: number, cy: number, size: number, alpha: number) => {
        ctx.save(); ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(cx, cy - size);
        ctx.lineTo(cx + size * 0.7, cy - size * 0.3);
        ctx.lineTo(cx + size * 0.7, cy + size * 0.3);
        ctx.lineTo(cx, cy + size);
        ctx.lineTo(cx - size * 0.7, cy + size * 0.3);
        ctx.lineTo(cx - size * 0.7, cy - size * 0.3);
        ctx.closePath();
        const sg = ctx.createLinearGradient(cx - size, cy - size, cx + size, cy + size);
        sg.addColorStop(0, `rgba(${r},${g},${b},0.6)`);
        sg.addColorStop(1, `rgba(${r},${g},${b},0.15)`);
        ctx.fillStyle = sg; ctx.fill();
        ctx.strokeStyle = `rgba(${r},${g},${b},0.8)`; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.restore();
      };
      drawShield(W/2, H/2 - 8, 38, 1);
      drawShield(W/2, H/2 - 8, 48, 0.3);
      // Crown on shield
      ctx.save(); ctx.globalAlpha = 0.9;
      ctx.fillStyle = color;
      ctx.font = "bold 28px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("♛", W/2, H/2 - 6);
      // Chess pieces around
      ctx.font = "18px serif"; ctx.globalAlpha = 0.5;
      ctx.fillText("♟", W*0.2, H*0.3); ctx.fillText("♟", W*0.78, H*0.7);
      ctx.fillText("♜", W*0.75, H*0.28); ctx.fillText("♞", W*0.22, H*0.7);
      ctx.restore();
      // Globe grid lines
      ctx.save(); ctx.globalAlpha = 0.15; ctx.strokeStyle = color; ctx.lineWidth = 0.8;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.ellipse(W/2, H/2, 65, 20 + i * 12, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    } else if (index === 1) {
      // Funnel + magnet — acquisition optimization
      // Magnet
      ctx.save(); ctx.globalAlpha = 0.85;
      ctx.strokeStyle = color; ctx.lineWidth = 7; ctx.lineCap = "round";
      ctx.beginPath(); ctx.arc(W/2 - 18, H/2 - 12, 22, Math.PI, 0); ctx.stroke();
      ctx.strokeStyle = color; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(W/2 - 40, H/2 - 12); ctx.lineTo(W/2 - 40, H/2 + 16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W/2 + 4, H/2 - 12); ctx.lineTo(W/2 + 4, H/2 + 16); ctx.stroke();
      // Magnet tips
      ctx.fillStyle = "#f43f5e";
      ctx.fillRect(W/2 - 47, H/2 + 10, 14, 10);
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(W/2 - 3, H/2 + 10, 14, 10);
      ctx.restore();
      // Funnel
      ctx.save(); ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.moveTo(W*0.28, H*0.62); ctx.lineTo(W*0.72, H*0.62);
      ctx.lineTo(W*0.55, H*0.85); ctx.lineTo(W*0.45, H*0.85);
      ctx.closePath();
      const fg = ctx.createLinearGradient(0, H*0.62, 0, H*0.85);
      fg.addColorStop(0, `rgba(${r},${g},${b},0.5)`); fg.addColorStop(1, `rgba(${r},${g},${b},0.1)`);
      ctx.fillStyle = fg; ctx.fill();
      ctx.strokeStyle = `rgba(${r},${g},${b},0.8)`; ctx.lineWidth = 1.5; ctx.stroke();
      // Metrics bubbles
      [[W*0.68, H*0.38, "350"], [W*0.76, H*0.56, "975"], [W*0.62, H*0.68, "6"]].forEach(([x, y, t]) => {
        ctx.beginPath(); ctx.arc(x as number, y as number, 14, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${r},${g},${b},0.25)`; ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = "white"; ctx.font = "bold 9px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(t as string, x as number, y as number);
      });
      ctx.restore();
    } else {
      // Server stack + AI — infrastructure
      ctx.save();
      const drawServer = (y: number, h: number, alpha: number) => {
        ctx.globalAlpha = alpha;
        ctx.beginPath(); ctx.roundRect(W*0.2, y, W*0.6, h, 4);
        const sg = ctx.createLinearGradient(0, y, 0, y + h);
        sg.addColorStop(0, `rgba(${r},${g},${b},0.3)`); sg.addColorStop(1, `rgba(${r},${g},${b},0.08)`);
        ctx.fillStyle = sg; ctx.fill();
        ctx.strokeStyle = `rgba(${r},${g},${b},0.5)`; ctx.lineWidth = 1; ctx.stroke();
        // LED dots
        for (let d = 0; d < 3; d++) {
          ctx.beginPath(); ctx.arc(W*0.25 + d * 10, y + h/2, 2.5, 0, Math.PI*2);
          ctx.fillStyle = d === 0 ? "#10b981" : d === 1 ? "#f59e0b" : `rgba(${r},${g},${b},0.8)`;
          ctx.globalAlpha = alpha * 0.9; ctx.fill();
        }
      };
      drawServer(H*0.1, 20, 0.9);
      drawServer(H*0.2, 20, 0.8);
      drawServer(H*0.3, 20, 0.7);
      // AI brain
      ctx.globalAlpha = 0.85;
      ctx.font = "36px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = color; ctx.fillText("🧠", W/2, H*0.64);
      // Shield
      ctx.font = "22px serif"; ctx.globalAlpha = 0.7;
      ctx.fillText("🛡️", W*0.28, H*0.64); ctx.fillText("🔒", W*0.72, H*0.64);
      ctx.restore();
      // Connection lines
      ctx.save(); ctx.globalAlpha = 0.2; ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(W/2, H*0.4); ctx.lineTo(W/2, H*0.55); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
    }
  }, [index, color, rgb]);
  return <canvas ref={canvasRef} width={160} height={150} style={{ width: 160, height: 150, borderRadius: 8 }} />;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RisksTab({ project, aiResults }: { project: ProjectData; aiResults: any[] }) {
  const animated = useAnimated(80);
  const [period, setPeriod] = useState<"month"|"quarter"|"year">("quarter");

  const RISK_META: Record<string, { color: string; rgb: string; label: string; badge: string; badgeColor: string }> = {
    high:   { color: "#f43f5e", rgb: "244,63,94",  label: "HIGH",  badge: "Needs Attention",  badgeColor: "#f43f5e" },
    medium: { color: "#f59e0b", rgb: "245,158,11",   label: "MEDIUM",  badge: "Priority",          badgeColor: "#f59e0b" },
    low:    { color: "#10b981", rgb: "16,185,129",   label: "LOW",   badge: "Stable",          badgeColor: "#10b981" },
  };

  const risks = project.risks.length >= 2 ? project.risks : [
    { level: "medium", title: "Competitive Dynamics",    desc: "High competitor activity. Risk of losing market share without a clear USP." },
    { level: "medium", title: "Acquisition Optimization",  desc: "CAC is rising. Channel diversification and retention improvements are needed." },
    { level: "low",    title: "Infrastructure Resilience", desc: "The tech stack is stable. Disaster recovery planning is required." },
  ];

  const lv: Record<string, number> = { high: 72, medium: 55, low: 28 };
  const riskManager = aiResults.find((r: { role: string }) => r.role === "Risk Manager");
  const ceo         = aiResults.find((r: { role: string }) => r.role === "CEO");
  const legal       = aiResults.find((r: { role: string }) => r.role === "Legal Advisor");

  // Build actionable plans from AI data or use defaults
  const riskPlans = risks.map((risk, i) => {
    const source = i === 0 ? ceo : i === 1 ? riskManager : legal;
    const rawRecs = source?.recommendations || "";
    const steps = rawRecs
      .split(/\d+\.\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((s: string) => s.trim().slice(0, 80));
    const defaultSteps = [
      ["Formalize USP: Review the value proposition.", "Optimize LTV: Launch a loyalty program.", "Competitive intel: Weekly monitoring."],
      ["CAC audit: Analyze channel efficiency.", "Remarketing: Launch A/B tests for retention.", "AI chatbot: Roll out AI-powered support."],
      ["Proactive monitoring: AI-based failure prediction.", "Cloud redundancy: Test disaster recovery.", "Cyber audit: Regular audits and team training."],
    ];
    return steps.length >= 2 ? steps : defaultSteps[i] ?? defaultSteps[0];
  });

  const globalScore = Math.round(risks.reduce((s, r) => s + (lv[r.level] ?? 50), 0) / risks.length);

  // Bar chart icons (SVG glyphs for each risk type)
  const barIcons = [
    <svg key="0" viewBox="0 0 32 32" fill="none" style={{width:28,height:28}}>
      <path d="M16 4l-10 8v16h7v-8h6v8h7V12L16 4z" stroke="#f43f5e" strokeWidth="1.5" fill="rgba(244,63,94,0.1)"/>
      <path d="M12 20h8M12 15h8" stroke="#f43f5e" strokeWidth="1" opacity="0.6"/>
    </svg>,
    <svg key="1" viewBox="0 0 32 32" fill="none" style={{width:28,height:28}}>
      <circle cx="16" cy="12" r="6" stroke="#f59e0b" strokeWidth="1.5" fill="rgba(245,158,11,0.1)"/>
      <path d="M10 24c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#f59e0b" strokeWidth="1.5"/>
      <path d="M22 8l3-3M10 8l-3-3" stroke="#f59e0b" strokeWidth="1" opacity="0.6"/>
    </svg>,
    <svg key="2" viewBox="0 0 32 32" fill="none" style={{width:28,height:28}}>
      <rect x="6" y="8" width="20" height="16" rx="2" stroke="#10b981" strokeWidth="1.5" fill="rgba(16,185,129,0.08)"/>
      <path d="M10 14h12M10 18h8" stroke="#10b981" strokeWidth="1.2" opacity="0.7"/>
      <circle cx="24" cy="10" r="3" fill="rgba(16,185,129,0.3)" stroke="#10b981" strokeWidth="1"/>
    </svg>,
  ];

  const now = new Date();
  const dateStr = `Q${Math.ceil((now.getMonth()+1)/3)}.${String(now.getDate()).padStart(2,"0")}.${now.getFullYear()}`;

  const highCount = risks.filter(r => r.level === "high").length;
  const riskBrief = `Overall risk level is ${globalScore >= 65 ? "elevated" : globalScore >= 45 ? "moderate" : "low"}. ${highCount > 0 ? `The main focus is ${risks.find(r => r.level === "high")?.title.toLowerCase()}.` : "No critical threats."} Financial risk is usually the most dangerous: keep a 20% budget reserve. Below is the action plan for each item.`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <style>{`
        @keyframes bar-rise { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes risk-card-in { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }
        @keyframes rsk-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      <AgentBrief letter="O" name="Omar Hassan" role="Risk Manager" color="#f43f5e" rgb="244,63,94" text={riskBrief} />

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f43f5e", boxShadow: "0 0 8px #f43f5e" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>Project Risk Assessment</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", padding: "2px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>{dateStr}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {(["month","quarter","year"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: "5px 12px", borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: "pointer",
              background: period === p ? "rgba(124,58,237,0.18)" : "rgba(255,255,255,0.03)",
              border: period === p ? "1px solid rgba(124,58,237,0.4)" : "1px solid rgba(255,255,255,0.07)",
              color: period === p ? "#a5b4fc" : "rgba(255,255,255,0.35)",
              transition: "all 0.15s",
            }}>
              {p === "month" ? "Month" : p === "quarter" ? "Quarter" : "Year"}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN GRID: chart left + cards right ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" }}>

        {/* LEFT: nested-rect bar chart */}
        <div style={{
          background: "rgba(6,8,18,0.97)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, padding: "20px 16px 16px", position: "relative", overflow: "hidden",
        }}>
          {/* Grid */}
          <svg style={{ position: "absolute", left: 44, right: 12, top: 20, bottom: 80, width: "calc(100% - 56px)", height: "calc(100% - 120px)", pointerEvents: "none" }} preserveAspectRatio="none">
            {[0,25,50,75,100].map(pct => (
              <g key={pct}>
                <line x1="0" y1={`${(1-pct/100)*100}%`} x2="100%" y2={`${(1-pct/100)*100}%`} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                <text x="-4" y={`${(1-pct/100)*100}%`} textAnchor="end" dominantBaseline="middle" fontSize="8" fill="rgba(255,255,255,0.2)" fontFamily="ui-monospace,monospace">{pct}%</text>
              </g>
            ))}
          </svg>

          {/* Bars */}
          <div style={{ display: "flex", alignItems: "flex-end", height: 260, paddingLeft: 40, paddingRight: 4, gap: 20, position: "relative" }}>
            {risks.map((risk, i) => {
              const meta = RISK_META[risk.level] ?? RISK_META.medium;
              const pct = lv[risk.level] ?? 50;
              const barH = `${pct}%`;
              const layers = [
                { shrink: 0,  opacity: 0.12, blur: "12px" },
                { shrink: 4,  opacity: 0.22, blur: "0"    },
                { shrink: 8,  opacity: 0.35, blur: "0"    },
                { shrink: 13, opacity: 0.55, blur: "0"    },
                { shrink: 18, opacity: 0.80, blur: "0"    },
              ];
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end", gap: 8 }}>
                  {/* % label */}
                  <div style={{
                    fontSize: 20, fontWeight: 900, color: meta.color, fontFamily: "ui-monospace,monospace",
                    textShadow: `0 0 20px rgba(${meta.rgb},1), 0 0 40px rgba(${meta.rgb},0.5)`,
                    opacity: animated ? 1 : 0, transition: `opacity 0.4s ${180 + i*130}ms`,
                  }}>{pct}%</div>

                  {/* Nested rect bar */}
                  <div style={{ width: "100%", height: barH, position: "relative" }}>
                    {layers.map((lay, li) => (
                      <div key={li} style={{
                        position: "absolute",
                        left: lay.shrink, right: lay.shrink, top: 0, bottom: 0,
                        borderRadius: 6 + lay.shrink * 0.3,
                        background: `linear-gradient(180deg, rgba(${meta.rgb},${lay.opacity}) 0%, rgba(${meta.rgb},${lay.opacity * 0.2}) 100%)`,
                        border: li > 0 ? `1px solid rgba(${meta.rgb},${lay.opacity * 0.8})` : "none",
                        filter: lay.blur !== "0" ? `blur(${lay.blur})` : "none",
                        boxShadow: li === 4 ? `inset 0 0 12px rgba(${meta.rgb},0.3), 0 0 24px rgba(${meta.rgb},0.4)` : "none",
                        transformOrigin: "bottom",
                        animation: animated ? `bar-rise ${0.7 + li*0.08}s cubic-bezier(0.34,1.4,0.64,1) ${60 + i*160 + li*30}ms both` : "none",
                      }}>
                        {li === 4 && (
                          <>
                            {/* Highlight streak */}
                            <div style={{ position:"absolute", top:0, left:"18%", width:"16%", bottom:0, borderRadius:3, background:"rgba(255,255,255,0.15)" }}/>
                            {/* Top dot */}
                            <div style={{
                              position:"absolute", top:-5, left:"50%", transform:"translateX(-50%)",
                              width:9, height:9, borderRadius:"50%",
                              background:meta.color, boxShadow:`0 0 14px rgba(${meta.rgb},1), 0 0 30px rgba(${meta.rgb},0.6)`,
                              animation:"rsk-pulse 1.8s ease-in-out infinite",
                            }}/>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Connecting bezier curve */}
            <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none", overflow:"visible" }} preserveAspectRatio="none">
              <defs>
                <linearGradient id="rsk-curve-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={risks[0] ? (RISK_META[risks[0].level]?.color ?? "#f59e0b") : "#f43f5e"} stopOpacity="0.7"/>
                  <stop offset="50%" stopColor={risks[1] ? (RISK_META[risks[1].level]?.color ?? "#f59e0b") : "#f59e0b"} stopOpacity="0.7"/>
                  <stop offset="100%" stopColor={risks[2] ? (RISK_META[risks[2].level]?.color ?? "#10b981") : "#10b981"} stopOpacity="0.7"/>
                </linearGradient>
                <filter id="rsk-glow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>
              {animated && (() => {
                const p0y = (1 - (lv[risks[0]?.level??"medium"]/100)) * 100;
                const p1y = (1 - (lv[risks[1]?.level??"medium"]/100)) * 100;
                const p2y = (1 - (lv[risks[2]?.level??"low"]/100)) * 100;
                return (
                  <path
                    d={`M 16% ${p0y}% C 35% ${p0y}% 48% ${p1y}% 50% ${p1y}% C 52% ${p1y}% 65% ${p2y}% 84% ${p2y}%`}
                    fill="none" stroke="url(#rsk-curve-grad)" strokeWidth="2"
                    filter="url(#rsk-glow)"
                    style={{ opacity: animated ? 0.9 : 0, transition: "opacity 1s 1.2s", strokeDasharray:"none" }}
                  />
                );
              })()}
            </svg>
          </div>

          {/* X-axis labels */}
          <div style={{ display:"flex", paddingLeft:40, paddingRight:4, gap:20, marginTop:12 }}>
            {risks.map((risk, i) => {
              const meta = RISK_META[risk.level] ?? RISK_META.medium;
              return (
                <div key={i} style={{ flex:1, textAlign:"center" }}>
                  <div style={{ fontSize:8, fontWeight:800, letterSpacing:"0.12em", color:"rgba(255,255,255,0.5)", textTransform:"uppercase", lineHeight:1.3 }}>
                    {risk.title.toUpperCase()}
                  </div>
                  <div style={{ marginTop:3, fontSize:7.5, fontWeight:700, color:meta.color, letterSpacing:"0.1em" }}>{meta.label}</div>
                </div>
              );
            })}
          </div>

          {/* Global Risk Index */}
          <div style={{ marginTop:14, padding:"12px 14px", borderRadius:10, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <div>
                <span style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.75)" }}>
                  Global Risk Index: <span style={{ color:"#f59e0b" }}>{globalScore}/100</span>
                </span>
                <span style={{ marginLeft:8, fontSize:9, color:"rgba(255,255,255,0.3)" }}>(Down 3 pts)</span>
              </div>
              <svg viewBox="0 0 28 28" fill="none" style={{ width:24, height:24 }}>
                <circle cx="14" cy="14" r="11" stroke="rgba(245,158,11,0.2)" strokeWidth="2.5"/>
                <circle cx="14" cy="14" r="11" stroke="#f59e0b" strokeWidth="2.5"
                  strokeDasharray={`${2*Math.PI*11*globalScore/100} ${2*Math.PI*11}`}
                  strokeLinecap="round" strokeDashoffset={2*Math.PI*11*0.25}
                  style={{ filter:"drop-shadow(0 0 4px #f59e0b)", transition:"stroke-dasharray 1.5s ease-out 0.8s" }}/>
              </svg>
            </div>
            <div style={{ fontSize:9.5, fontWeight:700, color:"rgba(255,255,255,0.45)", marginBottom:6 }}>AI Risk Recommendations</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5 }}>
              {(() => {
                const src = aiResults.find((r: {role:string}) => r.role==="Risk Manager")?.recommendations ||
                            aiResults.find((r: {role:string}) => r.role==="CEO")?.recommendations || "";
                const lines = src ? src.split(/[.!]\s+/).filter((s:string) => s.length > 15).slice(0,4)
                  : ["Increase LTV focus in the SMB segment.", "Optimize competitive positioning in key channels.", "Introduce a quarterly risk-review process.", "Strengthen reach growth in key segments."];
                return lines.map((rec:string, i:number) => (
                  <div key={i} style={{ fontSize:9, color:"rgba(255,255,255,0.3)", display:"flex", gap:5, alignItems:"flex-start" }}>
                    <span style={{ color:"#D946EF", fontWeight:700, flexShrink:0 }}>AI:</span>
                    <span>{rec.slice(0,60)}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* RIGHT: risk cards */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {risks.slice(0,3).map((risk, i) => {
            const meta = RISK_META[risk.level] ?? RISK_META.medium;
            const plans = riskPlans[i] ?? [];
            return (
              <div key={i} style={{
                background: "rgba(255,255,255,0.025)",
                border: `1px solid rgba(${meta.rgb},0.2)`,
                borderRadius: 14, overflow:"hidden",
                opacity: 0,
                animation: `risk-card-in 0.55s cubic-bezier(0.22,1,0.36,1) ${120 + i*110}ms forwards`,
                position:"relative",
              }}>
                <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:meta.color }} />

                <div style={{ padding:"16px 18px", paddingLeft: 22 }}>
                  {/* Header */}
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.9)" }}>{risk.title}</span>
                    <span style={{
                      fontSize:8, fontWeight:700, padding:"2px 8px", borderRadius:5,
                      background:`rgba(${meta.rgb},0.12)`, border:`1px solid rgba(${meta.rgb},0.3)`,
                      color:meta.color, letterSpacing:"0.1em", textTransform:"uppercase",
                    }}>
                      {meta.label}
                    </span>
                  </div>

                  {/* Desc */}
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", lineHeight:1.6, marginBottom:12 }}>
                    {risk.desc || `Threat level: ${meta.label.toLowerCase()}. Monitoring and control are the priority.`}
                  </div>

                  {/* Action plan */}
                  <div style={{ fontSize:8, fontWeight:700, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:8 }}>ACTION PLAN</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {plans.map((step:string, si:number) => (
                      <div key={si} style={{ fontSize:10.5, color:"rgba(255,255,255,0.55)", display:"flex", gap:8, alignItems:"flex-start" }}>
                        <span style={{
                          fontSize:9, fontWeight:800, color:meta.color, flexShrink:0,
                          width:18, height:18, borderRadius:4, background:`rgba(${meta.rgb},0.12)`,
                          display:"flex", alignItems:"center", justifyContent:"center",
                        }}>{si+1}</span>
                        <span style={{ lineHeight:1.5 }}>
                          <strong style={{ color:"rgba(255,255,255,0.8)", fontWeight:600 }}>{step.split(":")[0]}</strong>
                          {step.includes(":") ? ": " + step.split(":").slice(1).join(":") : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "demo";
  const [activeTab, setActiveTab] = useState("Diagnostics");
  const [project, setProject] = useState<ProjectData>(PROJECTS_DATA[id] ?? PROJECTS_DATA["demo"]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [aiResults, setAiResults] = useState<any[]>([]);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [reanalyzeProgress, setReanalyzeProgress] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rawProject, setRawProject] = useState<Record<string, any> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isUserProject = !PROJECTS_DATA[id];

  useEffect(() => {
    if (!isUserProject) return;
    fetch(`/api/projects/${id}`).then(r => r.json()).then(data => {
      if (data.project) {
        const p = data.project;
        const mapped = { id: p.id, name: p.name, description: p.description, industry: p.industry, stage: p.stage, goals: p.goals, targetRevenue: p.target_revenue, timeframe: p.timeframe, score: p.overall_score, aiResults: Array.isArray(p.ai_results) ? p.ai_results : [] };
        setRawProject(mapped);
        setProject(buildProjectFromUser(mapped));
        if (mapped.aiResults?.length > 0) setAiResults(mapped.aiResults);
        return;
      }
      throw new Error("not found");
    }).catch(() => {
      try {
        const stored = JSON.parse(localStorage.getItem("apex-user-projects") || "[]");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const found = stored.find((p: any) => p.id === id);
        if (found) { setRawProject(found); setProject(buildProjectFromUser(found)); if (found.aiResults?.length > 0) setAiResults(found.aiResults); }
      } catch { /* noop */ }
    });
  }, [id, isUserProject]);

  async function handleReanalyze() {
    if (!rawProject) return;
    setIsReanalyzing(true); setReanalyzeProgress(0); setActiveTab("AI Team");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const collected: any[] = [];
    abortRef.current = new AbortController();
    try {
      const res = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: rawProject.name, description: rawProject.description, industry: rawProject.industry, stage: rawProject.stage, goals: rawProject.goals, targetRevenue: rawProject.targetRevenue, timeframe: rawProject.timeframe }),
        signal: abortRef.current.signal,
      });
      const reader = res.body!.getReader(); const dec = new TextDecoder(); let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === "agent_done") { collected.push(evt.result); setReanalyzeProgress(collected.length); setAiResults([...collected]); }
            if (evt.type === "complete") {
              setProject(prev => ({ ...prev, score: evt.overallScore }));
              try {
                const stored = JSON.parse(localStorage.getItem("apex-user-projects") || "[]");
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                localStorage.setItem("apex-user-projects", JSON.stringify(stored.map((p: any) => p.id === id ? { ...p, aiResults: evt.results, score: evt.overallScore } : p)));
              } catch { /* noop */ }
            }
          } catch { /* noop */ }
        }
      }
    } catch (e) { if ((e as Error).name !== "AbortError") console.error(e); }
    finally { setIsReanalyzing(false); }
  }

  const headerBg = "linear-gradient(135deg,rgba(217,70,239,0.07) 0%,rgba(10,10,18,0.95) 100%)";
  const scoreColor = project.score >= 85 ? "#10b981" : project.score >= 70 ? "#f59e0b" : "#f43f5e";

  return (
    <div style={{ padding: "24px 24px 64px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Back */}
      <button onClick={() => router.push("/dashboard/projects")}
        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", marginBottom: 24, padding: 0, transition: "color 0.15s" }}
        onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Back to projects
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "white", margin: 0, letterSpacing: "-0.02em" }}>{project.name}</h1>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99, letterSpacing: "0.08em",
              background: project.status === "Complete" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
              color: project.status === "Complete" ? "#10b981" : "#f59e0b",
              border: `1px solid ${project.status === "Complete" ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}`,
            }}>● {project.status}</span>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>{project.subtitle}</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {isUserProject && (
            <button onClick={() => handleReanalyze()} disabled={isReanalyzing}
              style={{
                height: 36, padding: "0 16px", fontSize: 11, fontWeight: 600,
                border: "1px solid rgba(124,58,237,0.3)", color: "#a5b4fc",
                background: "rgba(124,58,237,0.06)", borderRadius: 10, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s",
              }}>
              {isReanalyzing ? `↻ ${reanalyzeProgress}/8 agents` : "↻ Refresh Analysis"}
            </button>
          )}
          <button style={{
            height: 36, padding: "0 16px", fontSize: 11, fontWeight: 600,
            border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)",
            background: "rgba(255,255,255,0.03)", borderRadius: 10, cursor: "pointer",
          }}>Export PDF</button>
          <button style={{
            height: 36, padding: "0 18px", fontSize: 11, fontWeight: 600,
            background: "linear-gradient(135deg,#7C3AED,#6D28D9)",
            color: "white", border: "none", borderRadius: 10, cursor: "pointer",
            boxShadow: "0 0 20px rgba(124,58,237,0.25)",
          }}>Refine Strategy</button>
        </div>
      </div>

      {/* Score banner */}
      <ScoreBanner project={project} aiResults={aiResults} />

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{
              padding: "10px 20px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
              background: "transparent", color: activeTab === t ? "white" : "rgba(255,255,255,0.35)",
              borderBottom: activeTab === t ? "2px solid #7C3AED" : "2px solid transparent",
              transition: "all 0.15s", marginBottom: -1,
            }}>{t}</button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Diagnostics" && <DiagnosticsTab project={project} aiResults={aiResults} />}
      {activeTab === "AI Team" && (
        <AITeamTab aiResults={aiResults} isUserProject={isUserProject} isReanalyzing={isReanalyzing}
          reanalyzeProgress={reanalyzeProgress} onReanalyze={handleReanalyze} />
      )}
      {activeTab === "Finance" && <FinanceTab project={project} aiResults={aiResults} />}
      {activeTab === "Market" && <MarketTab project={project} aiResults={aiResults} />}
      {activeTab === "Risks" && <RisksTab project={project} aiResults={aiResults} />}
    </div>
  );
}
