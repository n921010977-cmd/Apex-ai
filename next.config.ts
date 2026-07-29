import type { NextConfig } from "next";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// ─── Секрет подписи сессий на этапе сборки ────────────────────────────────────
// Этим секретом подписывается session-JWT. Его читают ДВЕ разные среды: вход в
// аккаунт (Node-runtime) и middleware, проверяющий сессию (Edge-runtime). Если
// значение в них разное, токен, выданный при входе, не проходит проверку в
// middleware («no matching decryption secret») — пользователя выбрасывает на
// экран входа сразу после успешного входа.
//
// Секрет фиксируется здесь и через `env` ниже вшивается в ОБА бандла одинаковым.
// Тонкость: next.config загружается несколько раз за сборку (отдельно для Node и
// Edge), поэтому генерировать случайное значение прямо здесь нельзя — каждый
// проход получил бы своё. Сохраняем сгенерированное в кэш-файл и переиспользуем:
// в пределах одной сборки — одно значение для обеих сред; Vercel к тому же
// кэширует .next/cache между деплоями, поэтому сессии переживают редеплой.
function resolveBuildSecret(): string {
  const fromEnv = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (fromEnv && fromEnv.trim()) return fromEnv;

  // node_modules/.cache не вычищается `next build` (в отличие от .next),
  // поэтому значение доживает от загрузки Node-конфига до загрузки Edge-конфига.
  const cacheFile = path.join(process.cwd(), "node_modules", ".cache", "vertlix-auth-secret");
  try {
    if (fs.existsSync(cacheFile)) {
      const cached = fs.readFileSync(cacheFile, "utf8").trim();
      if (cached) return cached;
    }
  } catch { /* кэш недоступен — сгенерируем заново ниже */ }

  const secret = crypto.randomBytes(32).toString("base64");
  try {
    fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
    fs.writeFileSync(cacheFile, secret);
  } catch { /* нет прав на запись — секрет будет разным для сред, см. коммент */ }
  return secret;
}

const BUILD_AUTH_SECRET = resolveBuildSecret();

// ─── Content-Security-Policy ──────────────────────────────────────────────────
// Tuned to what this app actually loads:
//   • scripts/styles: self + inline (Next.js injects inline bootstrap; the UI
//     uses inline styles heavily). No external script/style CDNs are used.
//   • images: self + data/blob + the OAuth avatar hosts + Supabase storage.
//   • connect: self (own /api routes, SSE streaming, Vercel Analytics beacon)
//     + Supabase (browser client talks directly to *.supabase.co over https/wss).
//   • fonts: self (next/font self-hosts Geist at build time) + data URIs.
//   • frame-ancestors/base-uri/form-action/object-src locked down; HTTP asset
//     requests auto-upgraded to HTTPS.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://*.posthog.com https://*.i.posthog.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.posthog.com https://*.i.posthog.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Deny powerful features outright; disable ad-targeting cohort APIs.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), " +
           "magnetometer=(), gyroscope=(), accelerometer=(), interest-cohort=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Stop other origins from hotlinking/embedding our responses.
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  // Give this origin its own agent cluster (side-channel isolation).
  { key: "Origin-Agent-Cluster", value: "?1" },
  // No Adobe cross-domain policy files anywhere.
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  // Enforce HTTPS for 2 years incl. subdomains; eligible for the HSTS preload list.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // NOTE: Cross-Origin-Embedder-Policy (require-corp) is intentionally NOT set —
  // it would block the Google/GitHub OAuth avatar images (cross-origin, no CORP
  // header) and the OAuth popup flow, and we don't use SharedArrayBuffer. COOP +
  // CORP above already give the meaningful isolation without that breakage.
];

// Optional canonical host redirect (www.<domain> → <domain>). No-op unless
// SITE_DOMAIN is set in the environment (e.g. SITE_DOMAIN=vertlix.ai on Vercel).
// Vercel also serves all traffic over HTTPS and redirects HTTP→HTTPS at the edge,
// so no in-app HTTP→HTTPS redirect is needed — HSTS + upgrade-insecure-requests
// above harden it further.
const SITE_DOMAIN = process.env.SITE_DOMAIN;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Вшиваем секрет одинаково в Node- и Edge-бандлы. `env` инлайнит значение в
  // те места, где читается process.env.NEXTAUTH_SECRET — а это только серверный
  // код авторизации, в клиент оно не попадает.
  env: {
    NEXTAUTH_SECRET: BUILD_AUTH_SECRET,
  },

  // Remote avatars (Google / GitHub OAuth) — optimized via next/image
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  async redirects() {
    if (!SITE_DOMAIN) return [];
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: `www.${SITE_DOMAIN}` }],
        destination: `https://${SITE_DOMAIN}/:path*`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
