import { NextResponse } from "next/server";
import { createPayment, oxapayConfigured } from "@/lib/payments/oxapay";
import { checkSupabaseConnection } from "@/lib/supabase/server";

/**
 * GET /api/health
 * Lightweight readiness probe: reports which integrations are configured
 * (presence of env vars only — never exposes the values). Handy for
 * verifying a deployment before going live.
 *
 * GET /api/health?probe=oxapay
 * Additionally performs a real test-invoice against OxaPay and returns the
 * gateway's verdict (no secrets), so payment issues are diagnosable from a
 * browser: approved merchant → ok:true; rejected key/merchant → the exact
 * OxaPay message.
 */
export const dynamic = "force-dynamic"; // health всегда живой, никогда не пререндеренный

export async function GET(req: Request) {
  const has = (v?: string) => Boolean(v && v.trim().length > 0);

  // Supabase: не «env задан», а реальный запрос к базе (см. checkSupabaseConnection).
  const supa = await checkSupabaseConnection();

  const integrations = {
    anthropic:  has(process.env.ANTHROPIC_API_KEY),
    gemini:     has(process.env.GEMINI_API_KEY),
    supabase:   supa.connected,
    nextauth:   has(process.env.NEXTAUTH_SECRET),
    oxapay:     has(process.env.OXAPAY_MERCHANT_KEY),
    appUrl:     has(process.env.NEXT_PUBLIC_APP_URL),
    upstash:    has(process.env.UPSTASH_REDIS_REST_URL) && has(process.env.UPSTASH_REDIS_REST_TOKEN),
    posthog:    has(process.env.NEXT_PUBLIC_POSTHOG_KEY),
    oauthGoogle: has(process.env.GOOGLE_CLIENT_ID) && has(process.env.GOOGLE_CLIENT_SECRET),
    oauthGithub: has(process.env.GITHUB_CLIENT_ID) && has(process.env.GITHUB_CLIENT_SECRET),
    openai:     has(process.env.OPENAI_API_KEY),
    grok:       has(process.env.GROK_API_KEY) || has(process.env.XAI_API_KEY),
    braveSearch: has(process.env.BRAVE_SEARCH_API_KEY),
    stripe:     has(process.env.STRIPE_SECRET_KEY),
    email:      has(process.env.RESEND_API_KEY),
  };

  // Core = the minimum needed to run the product for real
  const coreReady = integrations.anthropic && integrations.supabase && integrations.nextauth;

  // ── Опциональная живая проверка OxaPay: ?probe=oxapay ─────────────────────
  // Создаёт тестовый счёт на $1 тем же кодом, что и реальная оплата, и
  // возвращает вердикт шлюза. Секреты не раскрываются.
  let paymentProbe: Record<string, unknown> | undefined;
  const probe = new URL(req.url).searchParams.get("probe");
  if (probe === "oxapay") {
    if (!oxapayConfigured()) {
      paymentProbe = { ok: false, reason: "OXAPAY_MERCHANT_KEY не задан в этом деплое" };
    } else {
      const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://vertlixai.com").replace(/\/$/, "");
      try {
        const p = await createPayment({
          amountUsd: 1,
          orderId: `probe::${Date.now()}`,
          description: "Vertlix — диагностика оплаты (тестовый счёт)",
          callbackUrl: `${base}/api/payments/webhook`,
          returnUrl: `${base}/dashboard/billing`,
        });
        paymentProbe = { ok: true, invoiceCreated: Boolean(p.payLink), note: "OxaPay принимает счета — оплата должна работать" };
      } catch (e) {
        paymentProbe = { ok: false, gatewayError: e instanceof Error ? e.message : String(e) };
      }
    }
  }

  return NextResponse.json({
    status: coreReady ? "ready" : "degraded",
    mode: integrations.supabase ? "production" : "demo",
    coreReady,
    integrations,
    // Детали по Supabase (без секретов): configured=env заданы, connected=живой
    // запрос прошёл; reason подсказывает, что чинить (no_env / no_tables /
    // auth_failed / unreachable).
    supabaseDetail: supa,
    // Какой код реально задеплоен (Vercel проставляет эти переменные сам)
    deploy: {
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    },
    ...(paymentProbe ? { paymentProbe } : {}),
    timestamp: new Date().toISOString(),
  });
}
