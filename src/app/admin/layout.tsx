import type { Metadata } from "next";

// Приватный раздел: из поиска исключаем полностью (дублирует robots.txt на
// уровне страницы — на случай прямых ссылок).
export const metadata: Metadata = {
  title: "Админка",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
