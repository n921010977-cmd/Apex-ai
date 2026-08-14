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
      Vertlix AI · это служебное письмо о вашем аккаунте.
    </p>
  </div>`;
}

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) : null;

/** Оплата подтверждена, тариф включён. Зовётся из webhook — через void. */
export async function notifySubscriptionActivated(userId: string, plan: PlanId, expiresAt?: string | null): Promise<void> {
  try {
    const to = await emailForUser(userId);
    if (!to) return;
    const name = PLAN_BY_ID[plan]?.name ?? plan;
    const until = fmtDate(expiresAt);
    await sendEmail({
      to,
      subject: `Тариф ${name} активирован · Vertlix AI`,
      html: wrap(
        `Тариф ${name} активирован`,
        `<p style="font-size:14px;line-height:1.6;color:#475569">
           Оплата подтверждена, все возможности тарифа уже открыты${until ? ` — действует до ${until}` : ""}.
           Лимиты и остаток видны в кабинете.
         </p>`,
        "Открыть кабинет", "/dashboard",
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
      subject: full ? "Месячный лимит исчерпан · Vertlix AI" : "Использовано 80% лимита · Vertlix AI",
      html: wrap(
        full ? "Месячный лимит исчерпан" : "Использовано 80% месячного лимита",
        `<p style="font-size:14px;line-height:1.6;color:#475569">
           Израсходовано ${used} из ${limit} AI-запросов за месяц.
           ${full ? "Чтобы продолжить без ожидания нового месяца, обновите тариф." : "Если темп сохранится, лимит закончится до конца месяца."}
         </p>`,
        full ? "Обновить тариф" : "Посмотреть тарифы", "/dashboard/billing",
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
      subject: `Тариф ${name} заканчивается ${daysLeft <= 1 ? "завтра" : `через ${daysLeft} дн.`} · Vertlix AI`,
      html: wrap(
        `Тариф ${name} скоро закончится`,
        `<p style="font-size:14px;line-height:1.6;color:#475569">
           Подписка действует до ${fmtDate(expiresAt)}. Продлите её — оставшееся время не сгорит,
           новый месяц прибавится к текущему сроку.
         </p>`,
        "Продлить подписку", "/dashboard/billing",
      ),
    });
    void logEvent("subscription_expiring", userId, { plan, days_left: daysLeft });
  } catch { /* no-op */ }
}
