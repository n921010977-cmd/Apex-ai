// ─── Письма жизненного цикла ──────────────────────────────────────────────────
// Единственная точка, из которой продукт пишет пользователю на почту.
// Правила: всё best-effort (сбой почты никогда не ломает оплату или AI-запрос),
// адрес берём только из БД по userId, без RESEND_API_KEY письмо пишется в лог —
// поток можно проверить локально без провайдера. Не спамим: у каждого письма
// есть естественный ограничитель (порог квоты срабатывает раз в месяц,
// напоминание о продлении — раз в три дня через ленту событий).

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { logEvent } from "@/lib/analytics/server";
import { PLAN_BY_ID, type PlanId } from "@/lib/plans";
import { siteUrl } from "@/lib/site";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function db(): Promise<any | null> {
  if (!isSupabaseConfigured()) return null;
  try { return await createClient(); } catch { return null; }
}

async function emailForUser(userId: string): Promise<string | null> {
  const client = await db();
  if (!client) return null;
  try {
    const { data } = await client.from("users").select("email").eq("id", userId).maybeSingle();
    const email = data?.email;
    // Гостевые аккаунты живут на псевдодомене — туда писать нечего.
    return typeof email === "string" && email.includes("@") && !email.endsWith("@vertlix.local") ? email : null;
  } catch { return null; }
}

/** Общая обёртка писем — в стиле письма подтверждения email. */
function wrap(title: string, bodyHtml: string, ctaLabel?: string, ctaPath?: string): string {
  const cta = ctaLabel && ctaPath ? `
    <p style="margin:20px 0">
      <a href="${siteUrl()}${ctaPath}" style="display:inline-block;padding:11px 20px;border-radius:10px;background:#4f46e5;color:#fff;font-weight:600;font-size:14px;text-decoration:none">
        ${ctaLabel}
      </a>
    </p>` : "";
  return `
  <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:480px;margin:0 auto;color:#1f2328">
    <h2 style="font-size:18px;margin:0 0 12px">${title}</h2>
    ${bodyHtml}
    ${cta}
    <p style="font-size:12px;line-height:1.6;color:#94a3b8">
      Vertlix AI · a service email about your account.
    </p>
  </div>`;
}

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }) : null;

/** Оплата подтверждена, тариф включён. Зовётся из webhook — через void. */
export async function notifySubscriptionActivated(userId: string, plan: PlanId, expiresAt?: string | null): Promise<void> {
  try {
    const to = await emailForUser(userId);
    if (!to) return;
    const name = PLAN_BY_ID[plan]?.name ?? plan;
    const until = fmtDate(expiresAt);
    await sendEmail({
      to,
      subject: `${name} plan activated · Vertlix AI`,
      html: wrap(
        `${name} plan activated`,
        `<p style="font-size:14px;line-height:1.6;color:#475569">
           Payment confirmed — everything in your plan is unlocked${until ? ` and active until ${until}` : ""}.
           Limits and remaining usage are visible in your dashboard.
         </p>`,
        "Open dashboard", "/dashboard",
      ),
    });
  } catch { /* почта не должна ломать оплату */ }
}

/** Порог месячной квоты: 80 — предупреждение, 100 — лимит исчерпан. */
export async function notifyUsageThreshold(userId: string, threshold: 80 | 100, used: number, limit: number): Promise<void> {
  try {
    const to = await emailForUser(userId);
    if (!to) return;
    const full = threshold === 100;
    await sendEmail({
      to,
      subject: full ? "Monthly limit reached · Vertlix AI" : "80% of your limit used · Vertlix AI",
      html: wrap(
        full ? "Monthly limit reached" : "80% of your monthly limit used",
        `<p style="font-size:14px;line-height:1.6;color:#475569">
           You have used ${used} of ${limit} AI requests this month.
           ${full ? "Upgrade your plan to continue without waiting for the new month." : "At this pace the limit will run out before the month ends."}
         </p>`,
        full ? "Upgrade plan" : "View plans", "/dashboard/billing",
      ),
    });
  } catch { /* no-op */ }
}

/** Подписка заканчивается через daysLeft дней. Email передаёт cron (он уже сделал выборку). */
export async function notifyExpiring(userId: string, to: string, plan: string, daysLeft: number, expiresAt: string): Promise<void> {
  try {
    const name = PLAN_BY_ID[plan as PlanId]?.name ?? plan;
    await sendEmail({
      to,
      subject: `Your ${name} plan ends ${daysLeft <= 1 ? "tomorrow" : `in ${daysLeft} days`} · Vertlix AI`,
      html: wrap(
        `Your ${name} plan is ending soon`,
        `<p style="font-size:14px;line-height:1.6;color:#475569">
           Your subscription is active until ${fmtDate(expiresAt)}. Renew it — remaining time is preserved,
           the new month is added on top of the current term.
         </p>`,
        "Renew subscription", "/dashboard/billing",
      ),
    });
    void logEvent("subscription_expiring", userId, { plan, days_left: daysLeft });
  } catch { /* no-op */ }
}
