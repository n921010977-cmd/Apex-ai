// ─── Статичные платёжные ссылки OxaPay ────────────────────────────────────────
// Публичные URL страниц оплаты (создаются в кабинете OxaPay → «Ссылка на
// оплату»). Это НЕ секреты — их видит каждый покупатель, поэтому их можно
// хранить прямо в коде. Нужны как рабочий путь оплаты, пока merchant-API ключ
// не добрался до Production-окружения (или мерчант не одобрен).
//
// Приоритет в /api/payments/create:
//   1) API-счёт по OXAPAY_MERCHANT_KEY (автоактивация по webhook) — если работает;
//   2) переменная NEXT_PUBLIC_PAYLINK_<PLAN> — если задана;
//   3) ссылка из этого файла.
// Тариф после оплаты по ссылке выдаёт админ: /admin → «Выдать тариф» (email).

import type { PlanId } from "@/lib/plans";

export const PAYLINKS: Record<PlanId, string> = {
  basic:   "https://pay.oxapay.com/11072714", // Vertlix Basic — $5
  starter: "https://pay.oxapay.com/16728329", // Vertlix Starter — $29
  pro:     "https://pay.oxapay.com/13847766", // Vertlix Pro — $39
  max:     "https://pay.oxapay.com/16314539", // Vertlix Max — $49
};
