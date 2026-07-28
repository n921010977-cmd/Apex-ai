import type { Metadata } from "next";

// URL содержит токен подтверждения email — та же защита, что и на сбросе
// пароля: без индексации и без передачи реферера.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
