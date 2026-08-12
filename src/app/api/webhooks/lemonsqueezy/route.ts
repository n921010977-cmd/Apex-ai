import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { dbErrorResponse } from "@/lib/errors";

// ─── Lemon Squeezy webhook ────────────────────────────────────────────────────
// Flips an organization's plan when a subscription is created/updated/cancelled.
//
// Setup: in Lemon Squeezy → Settings → Webhooks, add this URL
//   https://<your-domain>/api/webhooks/lemonsqueezy
// subscribe to subscription_created / subscription_updated / subscription_cancelled,
// and set LEMONSQUEEZY_WEBHOOK_SECRET to the signing secret shown there.

export const runtime = "nodejs";

function verifySignature(raw: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const digest = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Map a Lemon Squeezy variant/product name to our internal plan id.
function planFromEvent(payload: Record<string, unknown>): "pro" | "agency" | null {
  // Prefer the custom data we set on the checkout URL (checkout[custom][plan]).
  const meta = (payload.meta ?? {}) as Record<string, unknown>;
  const custom = (meta.custom_data ?? {}) as Record<string, unknown>;
  const fromCustom = String(custom.plan ?? "").toLowerCase();
  if (fromCustom === "pro" || fromCustom === "agency") return fromCustom;

  // Fallback: infer from the product/variant name.
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const attrs = (data.attributes ?? {}) as Record<string, unknown>;
  const name = `${attrs.product_name ?? ""} ${attrs.variant_name ?? ""}`.toLowerCase();
  if (name.includes("agency")) return "agency";
  if (name.includes("pro")) return "pro";
  return null;
}

export async function POST(req: NextRequest) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const raw = await req.text();
  const signature = req.headers.get("x-signature");
  if (!verifySignature(raw, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const meta = (payload.meta ?? {}) as Record<string, unknown>;
  const eventName = String(meta.event_name ?? "");
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const attrs = (data.attributes ?? {}) as Record<string, unknown>;
  const email = String(attrs.user_email ?? attrs.email ?? "").toLowerCase();

  if (!email) {
    return NextResponse.json({ ok: true, note: "no email in payload" });
  }

  // Determine the target plan: downgrade to free on cancel/expire, else the paid plan.
  const isCancel = eventName.includes("cancelled") || eventName.includes("expired") ||
    String(attrs.status ?? "") === "cancelled" || String(attrs.status ?? "") === "expired";
  const plan = isCancel ? "free" : (planFromEvent(payload) ?? "pro");

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Find the user by email, then their owned organization, and update its plan.
  const { data: userRow } = await db
    .from("users").select("id").eq("email", email).maybeSingle();
  if (!userRow) {
    return NextResponse.json({ ok: true, note: "no matching user" });
  }

  const { error } = await db
    .from("organizations")
    .update({ plan })
    .eq("owner_id", userRow.id);

  if (error) {
    return dbErrorResponse(error, "/api/webhooks/lemonsqueezy");
  }

  return NextResponse.json({ ok: true, event: eventName, plan });
}
