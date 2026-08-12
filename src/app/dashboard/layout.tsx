import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

// Личный кабинет закрыт от индексации: содержимое персональное, в выдаче ему
// делать нечего. Сама разметка живёт в клиентском компоненте DashboardShell —
// серверный layout нужен, чтобы можно было объявить metadata.
export const metadata: Metadata = {
  title: "Дашборд",
  robots: { index: false, follow: false, nocache: true },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
