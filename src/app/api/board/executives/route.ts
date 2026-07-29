import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { MODEL_HEAVY } from "@/lib/ai/model-config";

const EXECUTIVES = [
  {
    id: "ceo",
    role: "CEO",
    name: "Sophia Rivers",
    title: "Chief Executive Officer",
    emoji: "👑",
    color: "#6366f1",
    model: MODEL_HEAVY,
    description: "Стратегическое руководство, принятие ключевых решений и управление исполнительной командой.",
    expertise: ["Стратегия", "Лидерство", "M&A", "Инвесторы", "Культура"],
    risk_tolerance: "moderate-aggressive",
    decision_style: "analytical",
  },
  {
    id: "cfo",
    role: "CFO",
    name: "Marcus Chen",
    title: "Chief Financial Officer",
    emoji: "💼",
    color: "#3b82f6",
    model: MODEL_HEAVY,
    description: "Финансовое планирование, бюджет, риски и инвестиционные решения.",
    expertise: ["P&L", "Cashflow", "Unit Economics", "Fundraising", "ROI"],
    risk_tolerance: "conservative",
    decision_style: "data-driven",
  },
  {
    id: "coo",
    role: "COO",
    name: "James Wright",
    title: "Chief Operating Officer",
    emoji: "⚙️",
    color: "#f59e0b",
    description: "Оптимизация операций, KPI, процессы и операционная эффективность.",
    expertise: ["Процессы", "Масштабирование", "Team", "OKR", "Supply Chain"],
    risk_tolerance: "moderate",
    decision_style: "process-oriented",
    model: MODEL_HEAVY,
  },
  {
    id: "cmo",
    role: "CMO",
    name: "Elena Torres",
    title: "Chief Marketing Officer",
    emoji: "📣",
    color: "#10b981",
    description: "Бренд-стратегия, маркетинг-микс, рост и удержание аудитории.",
    expertise: ["Growth", "Brand", "Content", "Performance", "Community"],
    risk_tolerance: "moderate-aggressive",
    decision_style: "creative-analytical",
    model: MODEL_HEAVY,
  },
  {
    id: "cto",
    role: "CTO",
    name: "Aiden Park",
    title: "Chief Technology Officer",
    emoji: "🔬",
    color: "#a855f7",
    description: "Технологическая стратегия, архитектура, R&D и инновации.",
    expertise: ["Architecture", "AI/ML", "Security", "DevOps", "R&D"],
    risk_tolerance: "moderate",
    decision_style: "technical",
    model: MODEL_HEAVY,
  },
];

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ success: true, data: EXECUTIVES });
}
