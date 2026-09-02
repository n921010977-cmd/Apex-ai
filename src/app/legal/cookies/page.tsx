import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site";

// ─── COOKIE POLICY VERTLIX AI ───────────────────────────────────────────────────
// Описывает фактически используемые cookies: необходимые (сессия NextAuth),
// безопасности (CSRF, rate-limit), аналитические (PostHog — управляются баннером
// согласия; Vercel Analytics — бескуковый). Управление согласием реализовано в
// src/components/CookieBanner.tsx + src/lib/consent.ts.



type Block =
  | { kind: "p"; text: string }
  | { kind: "list"; intro?: string; items: string[] }
  | { kind: "table"; head: string[]; rows: string[][] }
  | { kind: "callout"; text: string }
  | { kind: "sub"; title: string };

type Section = { id: string; num: string; title: string; blocks: Block[] };

const SECTIONS: Section[] = [
  {
    id: "what", num: "1", title: "Что такое cookies",
    blocks: [
      { kind: "p", text: "Cookies — это небольшие текстовые файлы, которые сайт сохраняет в вашем браузере, когда вы им пользуетесь. При следующем визите сайт может прочитать эти файлы — например, чтобы вспомнить, что вы уже вошли в аккаунт. Похожие технологии (localStorage, идентификаторы устройства) работают аналогично; в этом документе мы называем их все «cookies» для простоты." },
      { kind: "p", text: "Cookies не являются вирусами и не содержат ваших паролей в открытом виде. Но некоторые из них могут использоваться для анализа поведения на сайте — поэтому мы даём вам возможность управлять ими." },
    ],
  },
  {
    id: "types", num: "2", title: "Какие cookies мы используем",
    blocks: [
      { kind: "p", text: "На Vertlix AI используются три категории cookies:" },
      { kind: "sub", title: "2.1. Необходимые cookies" },
      { kind: "p", text: "Обязательны для работы сайта. Без них вы не сможете войти в аккаунт и пользоваться Сервисом. Их нельзя отключить, оставаясь авторизованным." },
      { kind: "list", items: [
        "Сессионные cookies аутентификации (NextAuth) — «помнят», что вы вошли, чтобы не запрашивать пароль на каждой странице.",
        "Настройки интерфейса — например, сохранение вашего выбора в самом баннере cookies.",
      ] },
      { kind: "sub", title: "2.2. Cookies безопасности" },
      { kind: "p", text: "Защищают вас и Сервис от атак. Тоже относятся к необходимым и не отключаются." },
      { kind: "list", items: [
        "CSRF-токен — защищает от подделки запросов от вашего имени.",
        "Технические метки для защиты от подбора паролей и злоупотреблений (rate-limiting).",
      ] },
      { kind: "sub", title: "2.3. Аналитические cookies" },
      { kind: "p", text: "Необязательные. Помогают нам понять, какими функциями пользуются и где возникают трудности, чтобы улучшать продукт. Устанавливаются только с вашего согласия — вы можете их отклонить, и Сервис продолжит работать в полном объёме." },
      { kind: "list", items: [
        "PostHog — продуктовая аналитика (какие страницы и функции используются). Ставит cookies и работает только после вашего согласия в баннере.",
        "Vercel Analytics — измерение посещаемости и производительности. Работает без cookies (не сохраняет идентификаторы в вашем браузере), поэтому не отслеживает вас между сайтами.",
      ] },
    ],
  },
  {
    id: "table", num: "3", title: "Сводная таблица",
    blocks: [
      { kind: "table",
        head: ["Категория", "Назначение", "Согласие"],
        rows: [
          ["Необходимые", "Вход в аккаунт, сессия, настройки", "Не требуется (обязательные)"],
          ["Безопасность", "Защита от CSRF и атак подбора", "Не требуется (обязательные)"],
          ["Аналитические", "Улучшение продукта (PostHog)", "Требуется — можно отклонить"],
        ],
      },
      { kind: "callout", text: "Мы не используем рекламные cookies и не передаём данные рекламным сетям для показа вам сторонней рекламы." },
    ],
  },
  {
    id: "why", num: "4", title: "Зачем мы используем cookies",
    blocks: [
      { kind: "list", intro: "Cookies нужны, чтобы:", items: [
        "держать вас в аккаунте между страницами и визитами;",
        "защищать ваш аккаунт и Сервис от мошенничества и атак;",
        "запоминать ваши настройки, включая выбор в этом баннере;",
        "с вашего согласия — понимать, как используется продукт, и делать его удобнее.",
      ] },
    ],
  },
  {
    id: "manage", num: "5", title: "Как управлять cookies",
    blocks: [
      { kind: "sub", title: "В нашем баннере согласия" },
      { kind: "p", text: "При первом визите мы показываем баннер, где вы можете:" },
      { kind: "list", items: [
        "«Принять» — согласиться на все cookies, включая аналитические;",
        "«Настроить» — включить или выключить аналитические cookies отдельно;",
        "«Отклонить необязательные» — оставить только необходимые cookies и cookies безопасности.",
      ] },
      { kind: "p", text: "Ваш выбор сохраняется, и до его изменения мы уважаем его. Если вы отклонили аналитику, мы не устанавливаем аналитические cookies и не отслеживаем ваши действия для аналитики." },
      { kind: "sub", title: "В настройках браузера" },
      { kind: "p", text: "Вы можете в любой момент удалить уже сохранённые cookies или заблокировать их в настройках вашего браузера (раздел «Конфиденциальность» / «Cookies»). Учтите: если удалить или заблокировать необходимые cookies, вы автоматически выйдете из аккаунта и часть функций перестанет работать." },
      { kind: "p", text: "Инструкции для популярных браузеров обычно доступны в их справке по запросу «управление cookies» (Chrome, Safari, Firefox, Edge)." },
    ],
  },
  {
    id: "changes", num: "6", title: "Изменения и контакты",
    blocks: [
      { kind: "p", text: "Мы можем обновлять эту Cookie Policy — например, при добавлении новых функций. Актуальная версия всегда доступна на этой странице, дата обновления указана вверху. Если изменится состав cookies, требующих согласия, мы можем снова показать баннер." },
      { kind: "p", text: "Вопросы о cookies и данных — пишите на " + CONTACT_EMAIL + ". Подробнее об обработке данных — в нашей Политике конфиденциальности." },
    ],
  },
];

const link = { color: "#a5b4fc", textDecoration: "none" } as const;

export default function CookiePolicyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#05060A", color: "#fff" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "rgba(5,6,10,0.85)", backdropFilter: "blur(20px)", zIndex: 10 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#7C3AED,#6D28D9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" width="16" height="16"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 800 }}>Vertlix AI</span>
        </Link>
        <Link href="/legal" style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Вся правовая информация →</Link>
      </header>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "48px 24px 80px" }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#a5b4fc", margin: "0 0 12px" }}>Правовой документ</p>
        <h1 style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 12px", textWrap: "balance" }}>Политика использования Cookies</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: "0 0 8px" }}>Последнее обновление: июль 2026</p>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.6)", margin: "0 0 36px" }}>Какие cookies использует Vertlix AI, зачем они нужны и как вы можете ими управлять.</p>

        <nav style={{ padding: "18px 20px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 44 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", margin: "0 0 12px" }}>Содержание</p>
          <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gridTemplateColumns: "1fr", gap: 7 }}>
            {SECTIONS.map(s => (
              <li key={s.id}>
                <a href={`#${s.id}`} style={{ fontSize: 14, color: "rgba(255,255,255,0.72)", textDecoration: "none", display: "flex", gap: 10 }}>
                  <span style={{ color: "#818cf8", fontVariantNumeric: "tabular-nums", minWidth: 20 }}>{s.num}.</span>
                  <span>{s.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div style={{ display: "flex", flexDirection: "column", gap: 44 }}>
          {SECTIONS.map(s => (
            <section key={s.id} id={s.id} style={{ scrollMarginTop: 76 }}>
              <h2 style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.01em", margin: "0 0 16px", color: "#fff", display: "flex", gap: 12, alignItems: "baseline" }}>
                <span style={{ color: "#818cf8", fontSize: 16, fontVariantNumeric: "tabular-nums" }}>{s.num}</span>
                <span>{s.title}</span>
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {s.blocks.map((b, i) => {
                  if (b.kind === "sub") return <h3 key={i} style={{ fontSize: 15.5, fontWeight: 700, color: "rgba(255,255,255,0.92)", margin: "6px 0 0" }}>{b.title}</h3>;
                  if (b.kind === "callout") return (
                    <div key={i} style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)" }}>
                      <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "#c7d2fe", margin: 0, fontWeight: 500 }}>{b.text}</p>
                    </div>
                  );
                  if (b.kind === "table") return (
                    <div key={i} style={{ overflowX: "auto", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 480 }}>
                        <thead>
                          <tr>{b.head.map((h, j) => <th key={j} style={{ textAlign: "left", padding: "11px 14px", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: 11.5, letterSpacing: "0.06em", textTransform: "uppercase", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {b.rows.map((r, ri) => (
                            <tr key={ri}>{r.map((c, ci) => <td key={ci} style={{ padding: "11px 14px", color: ci === 0 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.6)", fontWeight: ci === 0 ? 600 : 400, borderBottom: ri < b.rows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", verticalAlign: "top" }}>{c}</td>)}</tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                  if (b.kind === "list") return (
                    <div key={i}>
                      {b.intro && <p style={{ fontSize: 14.5, lineHeight: 1.75, color: "rgba(255,255,255,0.6)", margin: "0 0 8px" }}>{b.intro}</p>}
                      <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 9 }}>
                        {b.items.map((it, j) => (
                          <li key={j} style={{ fontSize: 14.5, lineHeight: 1.65, color: "rgba(255,255,255,0.6)", display: "flex", gap: 11 }}>
                            <span style={{ color: "#7C3AED", flexShrink: 0, marginTop: 1 }}>—</span>
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                  return <p key={i} style={{ fontSize: 14.5, lineHeight: 1.75, color: "rgba(255,255,255,0.6)", margin: 0 }}>{b.text}</p>;
                })}
              </div>
            </section>
          ))}
        </div>

        <div style={{ marginTop: 52, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.07)", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
          Вопросы о cookies? Напишите на <a href={`mailto:${CONTACT_EMAIL}`} style={link}>{CONTACT_EMAIL}</a>. См. также <Link href="/legal/privacy" style={link}>Политику конфиденциальности</Link>.
        </div>
      </div>
    </div>
  );
}
