import type { Metadata } from "next";

// URL этой страницы содержит токен сброса пароля. Запрещаем индексацию и
// передачу реферера, чтобы токен не утёк ни в поисковый индекс, ни в заголовке
// Referer на сторонние домены при переходе по ссылке со страницы.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
