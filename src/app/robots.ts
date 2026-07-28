import type { MetadataRoute } from "next";

// ─── robots.txt ───────────────────────────────────────────────────────────────
// Страницы со ссылками-токенами (сброс пароля, подтверждение email) и весь
// личный кабинет закрыты от индексации. Токен в URL — это право войти в
// аккаунт: попав в индекс поисковика или в чужой краулер, он перестаёт быть
// секретом. Публичная часть сайта индексируется как обычно.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/admin", "/reset-password", "/verify-email", "/chat", "/api/"],
      },
    ],
  };
}
