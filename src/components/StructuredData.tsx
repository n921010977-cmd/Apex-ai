import { siteUrl, SITE_NAME } from "@/lib/site";
import { PLANS } from "@/lib/plans";

// ─── JSON-LD для публичных страниц ────────────────────────────────────────────
// Только факты, которые действительно есть на сайте: название, описание,
// адрес, поиск по сайту и реальные цены тарифов из конфига. Рейтинги и отзывы
// не выдумываем — их у продукта пока нет.

export function StructuredData() {
  const url = siteUrl();

  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url,
      logo: `${url}/icon`,
      description: "AI-совет директоров: стратегия, планирование и питч-деки для предпринимателей.",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url,
      inLanguage: "ru-RU",
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url,
      description: "CEO, CFO, CMO, COO и ещё 16 AI-агентов работают над стратегией вашего бизнеса.",
      // Цены берутся из того же конфига, что и страница тарифов.
      offers: PLANS.map(p => ({
        "@type": "Offer",
        name: p.name,
        price: p.priceMonthly,
        priceCurrency: "USD",
        category: "SubscriptionMonthly",
        url: `${url}/pricing`,
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      // Данные статичные и собраны на сервере из собственного конфига.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
