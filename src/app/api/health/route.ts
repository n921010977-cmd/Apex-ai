import { NextResponse } from "next/server";

/**
 * GET /api/health
 * Lightweight readiness probe: reports which integrations are configured
 * (presence of env vars only — never exposes the values). Handy for
 * verifying a deployment before going live.
 */
export async function GET() {
  const has = (v?: string) => Boolean(v && v.trim().length > 0);

  const integrations = {
    anthropic:  has(process.env.ANTHROPIC_API_KEY),
    gemini:     has(process.env.GEMINI_API_KEY),
    supabase:   has(process.env.NEXT_PUBLIC_SUPABASE_URL) && has(process.env.SUPABASE_SERVICE_ROLE_KEY),
    nextauth:   has(process.env.NEXTAUTH_SECRET),
    oauthGoogle: has(process.env.GOOGLE_CLIENT_ID) && has(process.env.GOOGLE_CLIENT_SECRET),
    oauthGithub: has(process.env.GITHUB_CLIENT_ID) && has(process.env.GITHUB_CLIENT_SECRET),
    openai:     has(process.env.OPENAI_API_KEY),
    grok:       has(process.env.XAI_API_KEY),
    braveSearch: has(process.env.BRAVE_SEARCH_API_KEY),
    stripe:     has(process.env.STRIPE_SECRET_KEY),
    email:      has(process.env.RESEND_API_KEY),
  };

  // Core = the minimum needed to run the product for real
  const coreReady = integrations.anthropic && integrations.supabase && integrations.nextauth;

  return NextResponse.json({
    status: coreReady ? "ready" : "degraded",
    mode: integrations.supabase ? "production" : "demo",
    coreReady,
    integrations,
    timestamp: new Date().toISOString(),
  });
}
