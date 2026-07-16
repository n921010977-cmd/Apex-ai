// ─── Billing / checkout configuration ─────────────────────────────────────────
// Powered by Lemon Squeezy (Merchant of Record — handles global tax/VAT).
//
// To go live: create a product + variant for each paid plan in the Lemon
// Squeezy dashboard, copy each "Buy" / checkout URL, and set the env vars below
// (they are public — checkout URLs are safe to expose):
//
//   NEXT_PUBLIC_LS_CHECKOUT_PRO=https://your-store.lemonsqueezy.com/buy/xxxx
//   NEXT_PUBLIC_LS_CHECKOUT_AGENCY=https://your-store.lemonsqueezy.com/buy/yyyy
//
// The server-side webhook (src/app/api/webhooks/lemonsqueezy/route.ts) flips the
// organization's plan once payment succeeds; it needs LEMONSQUEEZY_WEBHOOK_SECRET.

export type PaidPlanId = "pro" | "agency";

const CHECKOUT_URLS: Record<PaidPlanId, string | undefined> = {
  pro: process.env.NEXT_PUBLIC_LS_CHECKOUT_PRO,
  agency: process.env.NEXT_PUBLIC_LS_CHECKOUT_AGENCY,
};

/**
 * Returns the checkout URL for a paid plan, or `/register` as a graceful
 * fallback while checkout links are not yet configured. Passing the user's
 * email pre-fills the Lemon Squeezy checkout.
 */
export function checkoutUrl(plan: PaidPlanId, email?: string | null): string {
  const base = CHECKOUT_URLS[plan];
  if (!base) return "/register";
  try {
    const url = new URL(base);
    // Lemon Squeezy prefill params
    if (email) url.searchParams.set("checkout[email]", email);
    url.searchParams.set("checkout[custom][plan]", plan);
    return url.toString();
  } catch {
    return base;
  }
}

/** True once at least one paid checkout link is configured. */
export function checkoutConfigured(): boolean {
  return Boolean(CHECKOUT_URLS.pro || CHECKOUT_URLS.agency);
}
