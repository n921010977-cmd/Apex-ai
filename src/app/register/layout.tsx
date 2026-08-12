import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Регистрация",
  description: "Создайте аккаунт Vertlix AI и соберите свой AI-совет директоров за минуту.",
  alternates: { canonical: "/register" },
  
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
