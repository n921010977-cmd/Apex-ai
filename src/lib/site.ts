// Канонический адрес сайта — один источник для sitemap, robots, canonical и
// Open Graph. Берётся из окружения; локально и в превью падает на localhost,
// чтобы ссылки в разработке не указывали на прод.
export function siteUrl(): string {
  const env =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.SITE_DOMAIN ? `https://${process.env.SITE_DOMAIN}` : "") ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
  return (env || "http://localhost:3000").replace(/\/$/, "");
}

export const SITE_NAME = "Vertlix AI";

// Публичный контакт для футера, FAQ и юридических страниц. Значение можно
// переопределить через окружение, не трогая код.
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "n921010977@gmail.com";
