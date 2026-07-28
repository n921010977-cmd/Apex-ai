"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_COLUMNS = [
  {
    heading: "Продукт",
    links: [
      { label: "Возможности", href: "#product" },
      { label: "AI команда", href: "#executives" },
      { label: "Отзывы", href: "#testimonials" },
      { label: "Тарифы", href: "#pricing" },
      { label: "AI Чат", href: "/chat" },
    ],
  },
  {
    heading: "Компания",
    links: [
      { label: "Как это работает", href: "#product" },
      { label: "Тарифы", href: "#pricing" },
      { label: "Контакты", href: "mailto:n921010977@gmail.com" },
      { label: "Начать бесплатно", href: "/register" },
    ],
  },
  {
    heading: "Ресурсы",
    links: [
      { label: "AI команда", href: "#executives" },
      { label: "Справочный центр", href: "#faq" },
      { label: "Поддержка", href: "mailto:n921010977@gmail.com" },
      { label: "Войти", href: "/login" },
    ],
  },
  {
    heading: "Правовая информация",
    links: [
      { label: "Публичная оферта", href: "/legal/offer" },
      { label: "Конфиденциальность", href: "/legal#privacy" },
      { label: "Условия использования", href: "/legal#terms" },
      { label: "Cookies", href: "/legal#cookies" },
      { label: "Оговорка об ответственности", href: "/legal#disclaimer" },
    ],
  },
];

const SOCIALS = [
  {
    name: "Email",
    href: "mailto:n921010977@gmail.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "mailto:n921010977@gmail.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.554V9h3.565v11.452z" />
      </svg>
    ),
  },
  {
    name: "GitHub",
    href: "https://github.com/n921010977-cmd/apex-ai",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden>
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
  },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;
    setSubscribed(true);
    setEmail("");
  };

  return (
    <footer className="relative px-6 pt-20 pb-10" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-7xl mx-auto">

        {/* ── Top: brand + newsletter ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div
                className="size-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                  boxShadow: "0 2px 12px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.16)",
                }}
              >
                <svg className="size-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div>
                <div className="text-[15px] font-bold text-white tracking-tight">Центр управления бизнесом</div>
                <div className="text-[10px] text-white/35 tracking-[0.18em] uppercase">Совет ИИ-директоров</div>
              </div>
            </div>
            <p className="text-sm text-white/40 leading-relaxed max-w-sm mb-6">
              AI-операционная система для предпринимателей, основателей и компаний,
              готовых масштабироваться. Полная бизнес-стратегия за минуты.
            </p>
            {/* System status */}
            <div
              className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl"
              style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full rounded-full bg-emerald-400 opacity-60 animate-ping" style={{ animationDuration: "2.5s" }} />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs font-medium text-emerald-400/90">Все системы работают</span>
            </div>
          </div>

          {/* Newsletter */}
          <div className="lg:justify-self-end w-full max-w-md">
            <h3 className="text-sm font-semibold text-white mb-2">Будьте в курсе</h3>
            <p className="text-sm text-white/40 leading-relaxed mb-4">
              Новые AI-агенты, стратегии роста и обновления продукта — раз в месяц, без спама.
            </p>
            {subscribed ? (
              <div
                className="flex items-center gap-2.5 h-12 px-4 rounded-xl text-sm text-emerald-400"
                style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)" }}
                role="status"
              >
                <svg className="size-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Вы подписаны. Спасибо!
              </div>
            ) : (
              <form onSubmit={subscribe} className="flex gap-2.5">
                <label htmlFor="footer-email" className="sr-only">Электронная почта</label>
                <input
                  id="footer-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="flex-1 h-12 px-4 rounded-xl text-sm text-white placeholder:text-white/25 outline-none transition-colors duration-200 focus:border-indigo-400/50"
                  style={{
                    background: "rgba(255,255,255,0.035)",
                    border: "1px solid rgba(255,255,255,0.09)",
                  }}
                />
                <button
                  type="submit"
                  className="h-12 px-5 rounded-xl text-sm font-semibold text-white flex-shrink-0 transition-all duration-200 hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(99,102,241,0.35)]"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                    boxShadow: "0 4px 16px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
                  }}
                >
                  Подписаться
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Middle: navigation columns ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-14">
          {NAV_COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h4 className="text-[11px] font-semibold text-white/45 uppercase tracking-[0.14em] mb-4">{col.heading}</h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/35 hover:text-white/80 transition-colors duration-200"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div
          className="pt-7 flex flex-col sm:flex-row items-center justify-between gap-5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p className="text-xs text-white/25">© 2026 Business Command Center. Все права защищены.</p>
          <div className="flex items-center gap-2">
            {SOCIALS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                aria-label={s.name}
                className="inline-flex items-center justify-center size-9 rounded-xl text-white/30 hover:text-white/80 transition-all duration-200 hover:-translate-y-px"
                style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
