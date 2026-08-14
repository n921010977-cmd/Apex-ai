import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PLANS } from "@/lib/plans";
import { CONTACT_EMAIL } from "@/lib/site";

// ─── Страница для инвесторов ──────────────────────────────────────────────────
// Правило №1: ни одной выдуманной цифры. Трекшн у продукта ранний — так и
// написано. Скриншоты в /public/investors/ сняты с работающего продукта.
// Цены берутся из того же конфига, что и страница тарифов.

export const metadata: Metadata = {
  title: "Инвесторам",
  description: "Vertlix AI — AI-совет директоров для предпринимателей. Продукт запущен, платежи работают, метрики собираются в реальном времени.",
  alternates: { canonical: "/investors" },
};

const T = {
  bg: "#05060A",
  surf: "rgba(255,255,255,0.025)",
  bord: "1px solid rgba(255,255,255,0.07)",
  tp: "#E5E7EB",
  ts: "rgba(255,255,255,0.55)",
  tm: "rgba(255,255,255,0.35)",
  accent: "#6366f1",
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#a5b4fc", marginBottom: 14 }}>
      {children}
    </div>
  );
}

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ padding: "56px 0", borderTop: T.bord }}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 style={{ fontSize: "clamp(24px,3.4vw,36px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 20px", color: "#fff", textWrap: "balance" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 16, padding: "20px 22px", background: T.surf, border: T.bord }}>
      {title && <div style={{ fontSize: 14.5, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{title}</div>}
      <div style={{ fontSize: 13.5, lineHeight: 1.65, color: T.ts }}>{children}</div>
    </div>
  );
}

export default function InvestorsPage() {
  return (
    <main style={{ minHeight: "100dvh", background: T.bg, color: T.tp }}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 24px 96px" }}>

        {/* ── Hero ── */}
        <header style={{ padding: "88px 0 56px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" aria-hidden>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.14em" }}>VERTLIX AI</span>
            <span style={{ marginLeft: "auto", fontSize: 12, color: T.tm }}>Материалы для инвесторов</span>
          </div>

          <h1 style={{ fontSize: "clamp(32px,5.5vw,54px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, margin: "0 0 18px", textWrap: "balance" }}>
            AI-совет директоров для предпринимателей
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: T.ts, maxWidth: 640, margin: "0 0 28px" }}>
            Vertlix AI заменяет дорогой консалтинг: 20 AI-ролей — от CEO до юриста — разбирают бизнес
            пользователя и выдают готовые документы: стратегию, питч-дек, план 30/60/90.
            Продукт запущен и принимает платежи.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <a href="https://vertlixai.com" style={{ display: "inline-flex", alignItems: "center", height: 48, padding: "0 26px", borderRadius: 12, fontSize: 14.5, fontWeight: 700, color: "#fff", textDecoration: "none", background: "linear-gradient(135deg,#6366f1,#4f46e5)", boxShadow: "0 8px 24px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.16)" }}>
              Открыть работающий продукт
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ display: "inline-flex", alignItems: "center", height: 48, padding: "0 24px", borderRadius: 12, fontSize: 14.5, fontWeight: 600, color: "rgba(255,255,255,0.75)", textDecoration: "none", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
              Связаться с основателем
            </a>
          </div>
        </header>

        {/* ── Problem ── */}
        <Section id="problem" eyebrow="Проблема" title="Предприниматель принимает ключевые решения в одиночку">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            <Card title="Консалтинг недоступен">
              Стратегическая сессия с консультантами стоит тысячи долларов — на ранней стадии таких денег нет.
            </Card>
            <Card title="Чат-боты дают переписку, а не результат">
              Универсальный AI-чат отвечает на вопросы, но не выдаёт связный документ: стратегию, презентацию, план действий.
            </Card>
            <Card title="Решения без второй пары глаз">
              Риски — юридические, финансовые, маркетинговые — остаются незамеченными, пока не выстрелят.
            </Card>
          </div>
        </Section>

        {/* ── Solution ── */}
        <Section id="solution" eyebrow="Решение" title="Совет из 20 AI-директоров, который выдаёт документы">
          <p style={{ fontSize: 15, lineHeight: 1.7, color: T.ts, maxWidth: 680, margin: "0 0 20px" }}>
            Пользователь описывает бизнес один раз. Дальше каждая AI-роль — CEO, CFO, CMO, COO, CTO,
            юрист, аналитик и другие — разбирает проект со своей стороны. Результат — не диалог,
            а четыре готовых артефакта:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <Card title="Вердикт совета">Риски и возможности по ролям, с итоговым заключением.</Card>
            <Card title="Стратегия">Позиционирование, рынок, конкуренты, модель монетизации.</Card>
            <Card title="Питч-дек">Слайды для инвестора с правкой в браузере и экспортом в PDF.</Card>
            <Card title="План 30/60/90">Конкретные шаги с чек-листом и еженедельным фокусом.</Card>
          </div>
        </Section>

        {/* ── Product ── */}
        <Section id="product" eyebrow="Продукт" title="Скриншоты работающего продукта">
          <p style={{ fontSize: 13.5, color: T.tm, margin: "0 0 18px" }}>
            Это не макеты: снимки сделаны с живого приложения. Продукт можно открыть и проверить прямо сейчас.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {[
              { src: "/investors/executives.png", alt: "Исполнительный совет: 20 AI-директоров, зал заседаний", cap: "Исполнительный совет — задаёте вопрос, директора совещаются и дают вердикт" },
              { src: "/investors/agents.png", alt: "Библиотека AI-агентов по направлениям", cap: "Библиотека агентов — финансы, маркетинг, продажи, право, разработка" },
              { src: "/investors/dashboard.png", alt: "Дашборд пользователя с лимитами тарифа и следующими шагами", cap: "Дашборд — тариф, остаток лимитов и следующий полезный шаг" },
            ].map(s => (
              <figure key={s.src} style={{ margin: 0 }}>
                <div style={{ borderRadius: 16, overflow: "hidden", border: T.bord, background: "#0a0b12" }}>
                  <Image src={s.src} alt={s.alt} width={2160} height={1350} style={{ width: "100%", height: "auto", display: "block" }} />
                </div>
                <figcaption style={{ fontSize: 12.5, color: T.tm, marginTop: 8 }}>{s.cap}</figcaption>
              </figure>
            ))}
          </div>
        </Section>

        {/* ── How it works ── */}
        <Section id="how" eyebrow="Как это работает" title="От описания бизнеса до документов — четыре шага">
          <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
            {[
              ["Описание", "Пользователь рассказывает о бизнесе или идее один раз."],
              ["Разбор", "20 AI-ролей анализируют проект, каждая — свою зону."],
              ["Документы", "Стратегия, питч-дек и план собираются автоматически."],
              ["Работа по плану", "Фокус недели и трекер целей возвращают пользователя каждую неделю."],
            ].map(([t, d], i) => (
              <li key={t} style={{ borderRadius: 16, padding: "18px 20px", background: T.surf, border: T.bord }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(99,102,241,0.14)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", fontSize: 12.5, fontWeight: 700 }}>{i + 1}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{t}</div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: T.ts }}>{d}</div>
              </li>
            ))}
          </ol>
        </Section>

        {/* ── Business model ── */}
        <Section id="model" eyebrow="Бизнес-модель" title="Помесячная подписка с лимитами, защищающими маржу">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 18 }}>
            {PLANS.map(p => (
              <div key={p.id} style={{ borderRadius: 16, padding: "20px 22px", background: T.surf, border: p.highlight ? "1px solid rgba(99,102,241,0.45)" : T.bord }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "8px 0 10px" }}>
                  <span style={{ fontSize: 30, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>${p.priceMonthly}</span>
                  <span style={{ fontSize: 13, color: T.tm }}>/мес</span>
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.6, color: T.ts }}>{p.tagline}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            <Card title="Экономика под контролем">
              Каждый тариф ограничен месячными лимитами AI-запросов, которые списываются атомарно на сервере —
              расход на AI-провайдера структурно не может превысить заложенный в цену.
            </Card>
            <Card title="Платежи уже работают">
              Оплата криптовалютой через OxaPay: счёт создаётся на сервере, тариф активируется только
              после подтверждения платежа со стороны OxaPay. Продление прибавляет срок к остатку.
            </Card>
            <Card title="Низкая стоимость доставки">
              Serverless-инфраструктура (Vercel + Supabase): затраты растут вместе с использованием,
              без фиксированных серверных расходов на старте.
            </Card>
          </div>
        </Section>

        {/* ── Market ── */}
        <Section id="market" eyebrow="Рынок" title="Кому это нужно">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            <Card title="Основатели на ранней стадии">
              Проверяют идею до вложений: вердикт совета и стратегия за вечер вместо месяцев неопределённости.
            </Card>
            <Card title="Малый бизнес">
              Владельцы без доступа к консультантам: план развития, разбор просевших метрик, юридические риски.
            </Card>
            <Card title="Фаундеры перед раундом">
              Питч-дек и ответы на неудобные вопросы инвестора — до встречи, а не на ней.
            </Card>
          </div>
          <p style={{ fontSize: 12.5, color: T.tm, marginTop: 14 }}>
            Оценки объёма рынка сознательно не приводим: чужие TAM-цифры без собственной методологии — это шум.
            Готовы разобрать расчёт воронки юнит-экономики на встрече.
          </p>
        </Section>

        {/* ── Traction ── */}
        <Section id="traction" eyebrow="Трекшн" title="Ранняя стадия — и мы это не прячем">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            <Card title="Продукт в продакшене">
              Сайт работает на vertlixai.com: регистрация, все AI-инструменты, тарифы и оплата — не прототип, а рабочий сервис.
            </Card>
            <Card title="Инфраструктура метрик готова">
              Собственная аналитика уже пишет полную воронку (визит → регистрация → активация → оплата),
              MRR, когорты и удержание — инвестор видит живые цифры, а не слайд.
            </Card>
            <Card title="Платёжный контур проверен">
              Создание счёта, webhook с проверкой подписи, идемпотентная активация подписки и продление
              без сгорания остатка — протестировано сквозными сценариями.
            </Card>
          </div>
          <p style={{ fontSize: 12.5, color: T.tm, marginTop: 14 }}>
            Пользовательскую базу и выручку не приводим: продукт только выходит на рынок.
            Здесь не будет выдуманных клиентов и рейтингов — когда появятся настоящие, их покажет наша же аналитика.
          </p>
        </Section>

        {/* ── Competition ── */}
        <Section id="competition" eyebrow="Конкуренция" title="Между чат-ботом и консультантом">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 560, borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["", "Универсальные AI-чаты", "Консалтинг", "Vertlix AI"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: T.tm, fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: T.bord }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Результат", "Переписка", "Документы", "Документы"],
                  ["Цена в месяц", "$20–200", "Тысячи долларов", "$29–49"],
                  ["Скорость", "Мгновенно", "Недели", "Минуты"],
                  ["Разбор по ролям", "Нет", "Да", "Да — 20 ролей"],
                  ["Возврат в продукт", "Низкий", "Разовый проект", "План и фокус недели"],
                ].map(row => (
                  <tr key={row[0]}>
                    {row.map((cell, i) => (
                      <td key={i} style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", color: i === 0 ? "#fff" : i === 3 ? "#a5b4fc" : T.ts, fontWeight: i === 0 ? 600 : i === 3 ? 600 : 400 }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── Go-to-market ── */}
        <Section id="gtm" eyebrow="Go-to-Market" title="Замеряемое привлечение с первого дня">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            <Card title="Перформанс-каналы">
              UTM-атрибуция встроена: каждый источник виден до оплаты — какая реклама приносит деньги, а какая трафик.
            </Card>
            <Card title="SEO и контент">
              Публичные страницы по реальным сценариям использования уже проиндексированы; блог — следующий шаг.
            </Card>
            <Card title="Рефералы">
              Реферальные ссылки работают (код сохраняется при регистрации); вознаграждение включим, когда появится база.
            </Card>
          </div>
        </Section>

        {/* ── Roadmap ── */}
        <Section id="roadmap" eyebrow="Роадмап" title="Что дальше">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["Сделано", "Продукт, тарифы, платёжный контур, аналитика воронки, админ-панель, SEO-страницы", true],
              ["Ближайшее", "Email-уведомления (события уже собираются), блог, A/B-тесты конверсии", false],
              ["Затем", "Интеграции с рабочими инструментами, английская версия, партнёрские каналы", false],
            ].map(([label, text, done]) => (
              <div key={label as string} style={{ display: "flex", gap: 14, alignItems: "flex-start", borderRadius: 14, padding: "14px 18px", background: T.surf, border: T.bord }}>
                <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 999, color: done ? "#34d399" : "#a5b4fc", background: done ? "rgba(16,185,129,0.1)" : "rgba(99,102,241,0.1)", border: done ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(99,102,241,0.3)" }}>{label}</span>
                <span style={{ fontSize: 13.5, lineHeight: 1.6, color: T.ts }}>{text}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Investment ── */}
        <Section id="invest" eyebrow="Инвестиции" title="Поговорим?">
          <p style={{ fontSize: 15, lineHeight: 1.7, color: T.ts, maxWidth: 640, margin: "0 0 24px" }}>
            Условия раунда обсуждаем индивидуально — без выдуманных оценок на слайде.
            Покажем продукт вживую, живые метрики в админ-панели и расчёт юнит-экономики.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ display: "inline-flex", alignItems: "center", height: 50, padding: "0 28px", borderRadius: 13, fontSize: 15, fontWeight: 700, color: "#fff", textDecoration: "none", background: "linear-gradient(135deg,#6366f1,#4f46e5)", boxShadow: "0 8px 24px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.16)" }}>
              Написать: {CONTACT_EMAIL}
            </a>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", height: 50, padding: "0 26px", borderRadius: 13, fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.75)", textDecoration: "none", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
              На главную
            </Link>
          </div>
        </Section>

      </div>
    </main>
  );
}
