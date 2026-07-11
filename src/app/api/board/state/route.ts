import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBoardAgents, getBoardMetrics, BOARD_DEBATE, BOARD_TIMELINE, BOARD_RECS } from "@/lib/board";

// GET /api/board/state — снимок состояния AI Board Core.
// Demo-safe: не требует БД, отдаёт каноническую команду + метрики с лёгким
// «живым» разбросом, чтобы дашборд ощущался работающим в реальном времени.
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const jitter = (base: number, amp: number, lo = 0, hi = 100) =>
    Math.max(lo, Math.min(hi, Math.round(base + (Math.random() - 0.5) * 2 * amp)));

  const agents = getBoardAgents().map(a => ({
    ...a,
    tokensPerSec: jitter(a.tokensPerSec, 2, 6, 20),
    confidence: jitter(a.confidence, 1, 80, 99),
    progress: jitter(a.progress, 3, 40, 99),
  }));

  const metrics = getBoardMetrics();

  return NextResponse.json({
    success: true,
    data: {
      status: "ACTIVE // OPTIMIZING",
      agents,
      metrics: { ...metrics, decisionLatency: jitter(metrics.decisionLatency, 20, 100, 900) },
      debate: BOARD_DEBATE,
      timeline: BOARD_TIMELINE,
      recommendations: BOARD_RECS,
      updatedAt: new Date().toISOString(),
    },
  });
}
