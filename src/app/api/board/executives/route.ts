import { NextResponse } from "next/server";
import { auth } from "@/auth";

const EXECUTIVES = [
  {
    id: "ceo",
    role: "CEO",
    name: "Victoria Sterling",
    title: "Chief Executive Officer",
    emoji: "👑",
    color: "#7A5CFF",
    model: "claude-sonnet-5",
    description: "Стратегическое руководство, принятие ключевых решений и управление исполнительной командой.",
    expertise: ["Стратегия", "Лидерство", "M&A", "Инвесторы", "Культура"],
    risk_tolerance: "moderate-aggressive",
    decision_style: "analytical",
  },
  {
    id: "cfo",
    role: "CFO",
    name: "James Hartley",
    title: "Chief Financial Officer",
    emoji: "💼",
    color: "#FFB800",
    model: "claude-sonnet-5",
    description: "Финансовое планирование, бюджет, риски и инвестиционные решения.",
    expertise: ["P&L", "Cashflow", "Unit Economics", "Fundraising", "ROI"],
    risk_tolerance: "conservative",
    decision_style: "data-driven",
  },
  {
    id: "coo",
    role: "COO",
    name: "Elena Vasquez",
    title: "Chief Operating Officer",
    emoji: "⚙️",
    color: "#00E7A7",
    description: "Оптимизация операций, KPI, процессы и операционная эффективность.",
    expertise: ["Процессы", "Масштабирование", "Team", "OKR", "Supply Chain"],
    risk_tolerance: "moderate",
    decision_style: "process-oriented",
    model: "claude-sonnet-5",
  },
  {
    id: "cmo",
    role: "CMO",
    name: "Sarah Chen",
    title: "Chief Marketing Officer",
    emoji: "📣",
    color: "#FF5470",
    description: "Бренд-стратегия, маркетинг-микс, рост и удержание аудитории.",
    expertise: ["Growth", "Brand", "Content", "Performance", "Community"],
    risk_tolerance: "moderate-aggressive",
    decision_style: "creative-analytical",
    model: "claude-sonnet-5",
  },
  {
    id: "cto",
    role: "CTO",
    name: "David Park",
    title: "Chief Technology Officer",
    emoji: "🔬",
    color: "#a78bfa",
    description: "Технологическая стратегия, архитектура, R&D и инновации.",
    expertise: ["Architecture", "AI/ML", "Security", "DevOps", "R&D"],
    risk_tolerance: "moderate",
    decision_style: "technical",
    model: "claude-sonnet-5",
  },
];

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ success: true, data: EXECUTIVES });
}
