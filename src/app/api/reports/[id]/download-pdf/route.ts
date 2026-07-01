import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";

// ─── PDF generation via Puppeteer (server-side) ───────────────────────────────
// Requires: npm install puppeteer-core @sparticuz/chromium
// For Edge/Vercel: use @vercel/og or a hosted Puppeteer service instead.
//
// To use @react-pdf/renderer, create a React Document component and call
// renderToBuffer(), then return it as application/pdf.

async function buildHtml(report: {
  title: string;
  summary: string | null;
  overall_score: number | null;
  total_pages: number;
  created_at: string;
  report_sections: Array<{ type: string; title: string; content: { markdown?: string } }>;
}): Promise<string> {
  const sections = (report.report_sections ?? [])
    .map(
      (s) => `
      <section class="section">
        <h2>${s.title}</h2>
        <div class="content">${s.content?.markdown ?? ""}</div>
      </section>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Inter", system-ui, sans-serif; background: #0a0a0e; color: #e5e7eb; padding: 48px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 24px; }
  h1 { font-size: 22px; font-weight: 700; color: #fff; max-width: 520px; line-height: 1.3; }
  .score { font-size: 40px; font-weight: 800; color: #34d399; font-variant-numeric: tabular-nums; }
  .meta { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 4px; }
  .summary { background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.2); border-radius: 12px; padding: 20px; margin-bottom: 32px; font-size: 13px; line-height: 1.7; color: rgba(255,255,255,0.7); }
  .section { margin-bottom: 32px; page-break-inside: avoid; }
  .section h2 { font-size: 15px; font-weight: 700; color: #a78bfa; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid rgba(167,139,250,0.15); }
  .content { font-size: 12px; line-height: 1.75; color: rgba(255,255,255,0.6); white-space: pre-wrap; }
  .footer { margin-top: 48px; border-top: 1px solid rgba(255,255,255,0.07); padding-top: 16px; font-size: 10px; color: rgba(255,255,255,0.2); display: flex; justify-content: space-between; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="meta">Apex AI · Бизнес-отчёт</div>
      <h1>${report.title}</h1>
      <div class="meta" style="margin-top:8px">${report.total_pages} страниц · ${new Date(report.created_at).toLocaleDateString("ru")}</div>
    </div>
    ${report.overall_score != null ? `<div style="text-align:right"><div class="score">${report.overall_score}</div><div class="meta">Бизнес-балл</div></div>` : ""}
  </div>
  ${report.summary ? `<div class="summary">${report.summary}</div>` : ""}
  ${sections}
  <div class="footer"><span>Apex AI · Автоматически сгенерировано</span><span>${new Date().toLocaleDateString("ru")}</span></div>
</body>
</html>`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: report, error } = await db
    .from("reports")
    .select(`id, title, summary, overall_score, total_pages, created_at, report_sections ( type, title, content, sort_order )`)
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();

  if (error || !report) {
    return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
  }

  if (report.gen_status === "PROCESSING") {
    return NextResponse.json({ success: false, error: "Report is still generating" }, { status: 409 });
  }

  // Sort sections
  if (Array.isArray(report.report_sections)) {
    report.report_sections.sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order,
    );
  }

  const html = await buildHtml(report);

  // ── Puppeteer PDF generation ───────────────────────────────────────────────
  // In production, replace with: import puppeteer from 'puppeteer-core'
  // const browser = await puppeteer.launch({ executablePath: await chromium.executablePath() });
  // const page = await browser.newPage();
  // await page.setContent(html, { waitUntil: 'networkidle0' });
  // const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', bottom: '20px' } });
  // await browser.close();
  // return new NextResponse(pdfBuffer, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${report.title}.pdf"` } });

  // ── Fallback: return HTML for preview (replace with puppeteer in production) ─
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${encodeURIComponent(report.title)}.html"`,
    },
  });
}
