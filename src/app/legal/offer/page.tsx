import Link from "next/link";

// ─── ПУБЛИЧНАЯ ОФЕРТА VERTLIX AI ────────────────────────────────────────────────
// Договор-оферта на оказание услуг доступа к платформе. Написан под фактический
// продукт: подписки Starter ($0) / Pro ($49/мес) / Agency ($149/мес), приём
// платежей через LemonSqueezy (merchant of record), AI-обработка через Anthropic.
// Плейсхолдеры [В КВАДРАТНЫХ СКОБКАХ] нужно заменить на реальные реквизиты
// исполнителя (наименование, ИНН/ОГРН, адрес) перед публикацией.

const CONTACT_EMAIL = "n921010977@gmail.com";
const link = { color: "#a5b4fc", textDecoration: "none" } as const;

type Block =
  | { kind: "p"; text: string }
  | { kind: "list"; intro?: string; items: string[] }
  | { kind: "callout"; text: string }
  | { kind: "sub"; title: string };

type Section = { id: string; num: string; title: string; blocks: Block[] };

const SECTIONS: Section[] = [
  {
    id: "general", num: "1", title: "Общие положения",
    blocks: [
      { kind: "p", text: "Настоящий документ является официальным предложением (публичной офертой) [ПОЛНОЕ НАИМЕНОВАНИЕ ИСПОЛНИТЕЛЯ, ИНН/ОГРН(ИП), АДРЕС] (далее — «Исполнитель») заключить договор оказания услуг доступа к онлайн-платформе Vertlix AI (далее — «Сервис») на изложенных ниже условиях с любым дееспособным лицом, которое примет это предложение (далее — «Заказчик»)." },
      { kind: "p", text: "Акцептом (принятием) оферты считается любое из действий: регистрация аккаунта в Сервисе, оформление подписки или оплата услуг. С момента акцепта договор считается заключённым в электронной форме без подписания бумажного экземпляра." },
      { kind: "callout", text: "Совершая акцепт, Заказчик подтверждает, что ознакомился и согласен с настоящей офертой, Пользовательским соглашением и Политикой конфиденциальности." },
    ],
  },
  {
    id: "subject", num: "2", title: "Предмет договора",
    blocks: [
      { kind: "p", text: "Исполнитель предоставляет Заказчику удалённый доступ к функциональности Сервиса: аналитическим инструментам на базе искусственного интеллекта для анализа бизнес-идей, генерации стратегий, планов, финансовых и рыночных оценок, а Заказчик обязуется оплачивать услуги по выбранному тарифу (кроме бесплатного тарифа)." },
      { kind: "p", text: "Результаты работы AI-инструментов носят информационно-аналитический характер, являются инструментом поддержки принятия решений и не являются юридической, финансовой, налоговой или инвестиционной консультацией." },
    ],
  },
  {
    id: "tariffs", num: "3", title: "Тарифы и порядок оплаты",
    blocks: [
      { kind: "list", intro: "Действующие тарифы:", items: [
        "«Starter» — бесплатно, с ограничением количества стратегий в месяц;",
        "«Pro» — $49/мес (или $39/мес при оплате за год);",
        "«Agency» — $149/мес (или $119/мес при оплате за год).",
      ] },
      { kind: "p", text: "Актуальные тарифы и состав каждого тарифа публикуются на странице «Тарифы». Оплата производится через платёжного провайдера LemonSqueezy, выступающего продавцом-регистратором (merchant of record); чек/квитанцию Заказчик получает от провайдера на email." },
      { kind: "p", text: "Подписка продлевается автоматически на следующий период до её отмены Заказчиком в настройках аккаунта. Отмена вступает в силу с окончания оплаченного периода; ранее уплаченные суммы за начатый период не возвращаются, если иное не предусмотрено политикой возвратов или применимым законом." },
    ],
  },
  {
    id: "rights", num: "4", title: "Права и обязанности сторон",
    blocks: [
      { kind: "list", intro: "Исполнитель обязуется:", items: [
        "предоставлять доступ к Сервису в режиме 24/7, за исключением времени технических работ;",
        "обеспечивать конфиденциальность данных Заказчика в соответствии с Политикой конфиденциальности;",
        "уведомлять о существенных изменениях условий по email или внутри Сервиса.",
      ] },
      { kind: "list", intro: "Заказчик обязуется:", items: [
        "предоставлять достоверные данные при регистрации и поддерживать их актуальность;",
        "не использовать Сервис для незаконной деятельности, не нарушать права третьих лиц;",
        "не передавать доступ к аккаунту третьим лицам и самостоятельно обеспечивать сохранность пароля;",
        "своевременно оплачивать выбранный платный тариф.",
      ] },
    ],
  },
  {
    id: "liability", num: "5", title: "Ответственность и ограничения",
    blocks: [
      { kind: "p", text: "Сервис предоставляется «как есть». Исполнитель не гарантирует достижение конкретных бизнес-результатов от использования рекомендаций AI-инструментов и не несёт ответственности за решения, принятые Заказчиком на их основе." },
      { kind: "p", text: "Совокупная ответственность Исполнителя по договору ограничена суммой, фактически уплаченной Заказчиком за последние 12 месяцев использования Сервиса." },
      { kind: "p", text: "Стороны освобождаются от ответственности за неисполнение обязательств вследствие обстоятельств непреодолимой силы (форс-мажор)." },
    ],
  },
  {
    id: "data", num: "6", title: "Персональные данные",
    blocks: [
      { kind: "p", text: "Обработка персональных данных Заказчика осуществляется в соответствии с Политикой конфиденциальности и Согласием на обработку персональных данных, размещёнными в разделе «Правовая информация». Запросы к AI-инструментам обрабатываются через провайдера модели (Anthropic) без использования для обучения моделей." },
    ],
  },
  {
    id: "term", num: "7", title: "Срок действия и изменение оферты",
    blocks: [
      { kind: "p", text: "Договор действует с момента акцепта до окончания оплаченного периода (для бесплатного тарифа — до удаления аккаунта любой из сторон). Исполнитель вправе изменять условия оферты; новая редакция публикуется на этой странице и применяется к отношениям, возникшим после её публикации. О существенных изменениях Исполнитель уведомляет заранее." },
      { kind: "p", text: "Заказчик вправе в любой момент прекратить использование Сервиса и удалить аккаунт в настройках; Исполнитель вправе приостановить или прекратить доступ при нарушении Заказчиком условий договора." },
    ],
  },
  {
    id: "requisites", num: "8", title: "Реквизиты и контакты Исполнителя",
    blocks: [
      { kind: "list", items: [
        "Наименование: [ПОЛНОЕ НАИМЕНОВАНИЕ ЮРЛИЦА / ИП]",
        "ИНН: [ИНН] · ОГРН/ОГРНИП: [ОГРН]",
        "Адрес: [ЮРИДИЧЕСКИЙ АДРЕС]",
        `Email: ${CONTACT_EMAIL}`,
      ] },
      { kind: "callout", text: "Редакция оферты от июля 2026 года. Перед публикацией сайта плейсхолдеры в квадратных скобках должны быть заменены на реальные реквизиты." },
    ],
  },
];

export default function OfferPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#05060A", color: "#fff" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "rgba(5,6,10,0.85)", backdropFilter: "blur(20px)", zIndex: 10 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" width="16" height="16"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 800 }}>Vertlix AI</span>
        </Link>
        <Link href="/legal" style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Вся правовая информация →</Link>
      </header>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "48px 24px 80px" }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#a5b4fc", margin: "0 0 12px" }}>Правовой документ</p>
        <h1 style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 12px", textWrap: "balance" }}>Публичная оферта</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: "0 0 8px" }}>Последнее обновление: июль 2026</p>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.6)", margin: "0 0 36px" }}>Договор оказания услуг доступа к платформе Vertlix AI. Регистрируясь или оплачивая подписку, вы принимаете условия этого договора.</p>

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
                  if (b.kind === "sub") {
                    return <h3 key={i} style={{ fontSize: 15.5, fontWeight: 700, color: "rgba(255,255,255,0.92)", margin: "6px 0 0" }}>{b.title}</h3>;
                  }
                  if (b.kind === "callout") {
                    return (
                      <div key={i} style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)" }}>
                        <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "#c7d2fe", margin: 0, fontWeight: 500 }}>{b.text}</p>
                      </div>
                    );
                  }
                  if (b.kind === "list") {
                    return (
                      <div key={i}>
                        {b.intro && <p style={{ fontSize: 14.5, lineHeight: 1.75, color: "rgba(255,255,255,0.6)", margin: "0 0 8px" }}>{b.intro}</p>}
                        <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 9 }}>
                          {b.items.map((it, j) => (
                            <li key={j} style={{ fontSize: 14.5, lineHeight: 1.65, color: "rgba(255,255,255,0.6)", display: "flex", gap: 11 }}>
                              <span style={{ color: "#6366f1", flexShrink: 0, marginTop: 1 }}>—</span>
                              <span>{it}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                  return <p key={i} style={{ fontSize: 14.5, lineHeight: 1.75, color: "rgba(255,255,255,0.6)", margin: 0 }}>{b.text}</p>;
                })}
              </div>
            </section>
          ))}
        </div>

        <div style={{ marginTop: 52, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.07)", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
          Вопросы по договору? Напишите на <a href={`mailto:${CONTACT_EMAIL}`} style={link}>{CONTACT_EMAIL}</a>.
        </div>
      </div>
    </div>
  );
}
