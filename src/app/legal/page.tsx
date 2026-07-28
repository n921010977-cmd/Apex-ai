import Link from "next/link";

const SECTIONS = [
  {
    id: "privacy", title: "Политика конфиденциальности",
    body: [
      "Мы собираем только те данные, которые необходимы для работы сервиса: email, имя, содержимое ваших проектов и запросов к AI-ассистенту.",
      "Данные используются исключительно для предоставления сервиса и не передаются третьим лицам в маркетинговых целях.",
      "Запросы к AI обрабатываются через провайдера модели (Anthropic). Не отправляйте в чат конфиденциальные данные, которые не должны покидать вашу организацию.",
      "Вы можете запросить удаление своего аккаунта и связанных данных, написав на контактный email.",
    ],
  },
  {
    id: "terms", title: "Условия использования",
    body: [
      "Vertlix AI предоставляет аналитические и стратегические рекомендации на базе искусственного интеллекта. Это инструмент поддержки принятия решений, а не замена профессиональной консультации.",
      "Вы несёте ответственность за решения, принятые на основе рекомендаций сервиса.",
      "Запрещено использовать сервис для незаконной деятельности, генерации вредоносного контента или нарушения прав третьих лиц.",
      "Мы можем изменять функциональность и тарифы сервиса, уведомляя об этом заранее.",
    ],
  },
  {
    id: "cookies", title: "Использование Cookies",
    body: [
      "Мы используем необходимые cookies для авторизации (сессия) и сохранения настроек интерфейса, а также аналитические cookies (PostHog, Vercel Analytics), чтобы улучшать продукт.",
      "Мы не используем рекламные cookies для показа вам сторонней рекламы.",
      "Вы можете очистить cookies в настройках браузера, но это приведёт к выходу из аккаунта.",
    ],
  },
  {
    id: "disclaimer", title: "Оговорка об ответственности",
    body: [
      "Рекомендации AI-агентов, включая финансовые прогнозы, оценки рынка и юридические заметки, носят информационный характер и могут содержать ошибки.",
      "Юридический советник и финансовые модели не являются юридической или финансовой консультацией. Перед важными решениями проконсультируйтесь с квалифицированным специалистом.",
      "Мы не гарантируем достижение конкретных бизнес-результатов при использовании сервиса.",
    ],
  },
];

export default function LegalPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#05060A", color: "#fff" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 24px", height: 58, display: "flex", alignItems: "center", position: "sticky", top: 0, background: "rgba(5,6,10,0.85)", backdropFilter: "blur(20px)", zIndex: 10 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" width="16" height="16"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 800 }}>Vertlix AI</span>
        </Link>
      </header>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 12px" }}>Правовая информация</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: "0 0 20px" }}>Последнее обновление: июль 2026</p>
        <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "rgba(255,255,255,0.6)", margin: "0 0 32px" }}>
          Полные документы: <Link href="/legal/offer" style={{ color: "#a5b4fc", textDecoration: "none", fontWeight: 600 }}>Публичная оферта</Link>, <Link href="/legal/privacy" style={{ color: "#a5b4fc", textDecoration: "none", fontWeight: 600 }}>Политика конфиденциальности</Link>, <Link href="/legal/terms" style={{ color: "#a5b4fc", textDecoration: "none", fontWeight: 600 }}>Пользовательское соглашение</Link>, <Link href="/legal/cookies" style={{ color: "#a5b4fc", textDecoration: "none", fontWeight: 600 }}>Cookie Policy</Link> и <Link href="/legal/consent" style={{ color: "#a5b4fc", textDecoration: "none", fontWeight: 600 }}>Согласие на обработку данных</Link>. Ниже — краткий обзор.
        </p>

        {/* Anchor nav */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 40 }}>
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`} style={{
              fontSize: 12.5, fontWeight: 600, padding: "7px 14px", borderRadius: 999, textDecoration: "none",
              background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.22)", color: "#a5b4fc",
            }}>{s.title}</a>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {SECTIONS.map(s => (
            <section key={s.id} id={s.id} style={{ scrollMarginTop: 76 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em", margin: "0 0 14px", color: "#fff" }}>{s.title}</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {s.body.map((p, i) => (
                  <p key={i} style={{ fontSize: 14.5, lineHeight: 1.75, color: "rgba(255,255,255,0.6)", margin: 0 }}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.07)", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
          Вопросы? Напишите на <a href="mailto:n921010977@gmail.com" style={{ color: "#a5b4fc" }}>n921010977@gmail.com</a>
        </div>
      </div>
    </div>
  );
}
