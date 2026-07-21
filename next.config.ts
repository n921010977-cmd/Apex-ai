import type { NextConfig } from "next";

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
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Enforce HTTPS for 2 years incl. subdomains; eligible for the HSTS preload list.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
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
