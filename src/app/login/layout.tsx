import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Вход в аккаунт",
  description: "Войдите в Vertlix AI — AI-совет директоров для вашего бизнеса.",
  alternates: { canonical: "/login" },
  
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
