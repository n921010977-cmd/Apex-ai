import Link from "next/link";
import { LEGAL_ENTITY, LEGAL_JURISDICTION, LEGAL_ADDRESS, LEGAL_LAW, LEGAL_VENUE } from "@/lib/legal-entity";
import { CONTACT_EMAIL } from "@/lib/site";


// ─── СОГЛАСИЕ НА ОБРАБОТКУ ПЕРСОНАЛЬНЫХ ДАННЫХ VERTLIX AI ────────────────────────
// Полный текст согласия, которое пользователь подтверждает при регистрации
// (чекбокс на /register ссылается на эту страницу). Описывает фактически
// обрабатываемые данные: email, имя, технические данные, запросы к AI.
// Реквизиты оператора — из src/lib/legal-entity.ts (переменные окружения).



type Block =
  | { kind: "p"; text: string }
  | { kind: "list"; intro?: string; items: string[] }
  | { kind: "callout"; text: string }
  | { kind: "sub"; title: string };

type Section = { id: string; num: string; title: string; blocks: Block[] };

const SECTIONS: Section[] = [
  {
    id: "subject", num: "1", title: "Предмет согласия",
    blocks: [
      { kind: "p", text: "Создавая аккаунт в Vertlix AI (далее — «Сервис»), вы даёте оператору — " + LEGAL_ENTITY + " (далее — «Оператор», «мы») — согласие на обработку ваших персональных данных на условиях, описанных ниже и в Политике конфиденциальности." },
      { kind: "p", text: "Согласие является добровольным. Оно необходимо для предоставления вам Сервиса — без обработки этих данных мы не сможем создать и вести ваш аккаунт." },
    ],
  },
  {
    id: "scope", num: "2", title: "На что вы даёте согласие",
    blocks: [
      { kind: "p", text: "Подтверждая согласие, вы соглашаетесь на:" },
      { kind: "sub", title: "2.1. Создание и ведение аккаунта" },
      { kind: "p", text: "Регистрацию учётной записи в Сервисе, её хранение и обслуживание, включая авторизацию и восстановление доступа." },
      { kind: "sub", title: "2.2. Использование email" },
      { kind: "p", text: "Обработку вашего адреса электронной почты для входа в аккаунт, подтверждения email, сброса пароля и отправки важных сервисных уведомлений об аккаунте. Email не используется для рекламных рассылок без вашего отдельного согласия." },
      { kind: "sub", title: "2.3. Обработку технических данных" },
      { kind: "p", text: "Автоматический сбор и обработку технических данных, которые передаёт ваш браузер (IP-адрес, тип браузера и устройства, операционная система, дата и время входа), — для обеспечения работы, безопасности и защиты Сервиса от мошенничества и атак." },
      { kind: "sub", title: "2.4. Работу AI-функций" },
      { kind: "p", text: "Обработку текстовых данных, которые вы вводите или загружаете, и ваших запросов к AI-агентам — для формирования результатов анализа. Для этого запросы передаются провайдеру AI-модели (Anthropic). Вы понимаете, что не следует вводить в Сервис конфиденциальные данные, которые не должны покидать вашу организацию." },
    ],
  },
  {
    id: "actions", num: "3", title: "Действия с данными и срок",
    blocks: [
      { kind: "list", intro: "Обработка включает: сбор, запись, хранение, использование, уточнение, передачу привлечённым провайдерам (хостинг, база данных, AI, почта, платежи) исключительно для работы Сервиса, а также удаление и обезличивание.", items: [] },
      { kind: "p", text: "Данные обрабатываются, пока действует ваш аккаунт и это необходимо для предоставления Сервиса, либо до отзыва вами согласия — в зависимости от того, что наступит раньше. Отдельные данные могут храниться дольше, если этого требует закон (например, сведения о платежах)." },
    ],
  },
  {
    id: "withdraw", num: "4", title: "Отзыв согласия",
    blocks: [
      { kind: "callout", text: "Пользователь может отозвать согласие путём удаления аккаунта или обращения в службу поддержки." },
      { kind: "p", text: "Удалить аккаунт можно самостоятельно в разделе настроек — при этом ваши персональные данные удаляются (за исключением того, что мы обязаны хранить по закону). Также вы можете направить запрос на отзыв согласия и удаление данных на " + CONTACT_EMAIL + "." },
      { kind: "p", text: "Отзыв согласия не влияет на законность обработки, совершённой до его отзыва. После отзыва согласия предоставление Сервиса прекращается, так как обработка данных для него становится невозможной." },
    ],
  },
  {
    id: "rights", num: "5", title: "Ваши права и контакты",
    blocks: [
      { kind: "p", text: "Вы имеете право запросить доступ к своим данным, их исправление или удаление, а также экспорт данных — подробнее в Политике конфиденциальности. По вопросам обработки данных пишите на " + CONTACT_EMAIL + "." },
      { kind: "p", text: "Оператор: " + LEGAL_ENTITY + ", адрес: " + LEGAL_ADDRESS + "." },
    ],
  },
];

const link = { color: "#a5b4fc", textDecoration: "none" } as const;

export default function ConsentPage() {
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
        <h1 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 12px", textWrap: "balance" }}>Согласие на обработку персональных данных</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: "0 0 8px" }}>Последнее обновление: июль 2026</p>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.6)", margin: "0 0 36px" }}>Текст согласия, которое вы подтверждаете при создании аккаунта в Vertlix AI.</p>

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
                  if (b.kind === "list" && b.items.length > 0) return (
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
                  if (b.kind === "list") return b.intro ? <p key={i} style={{ fontSize: 14.5, lineHeight: 1.75, color: "rgba(255,255,255,0.6)", margin: 0 }}>{b.intro}</p> : null;
                  return <p key={i} style={{ fontSize: 14.5, lineHeight: 1.75, color: "rgba(255,255,255,0.6)", margin: 0 }}>{b.text}</p>;
                })}
              </div>
            </section>
          ))}
        </div>

        <div style={{ marginTop: 52, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.07)", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
          Вопросы? Напишите на <a href={`mailto:${CONTACT_EMAIL}`} style={link}>{CONTACT_EMAIL}</a>. См. также <Link href="/legal/privacy" style={link}>Политику конфиденциальности</Link> и <Link href="/legal/terms" style={link}>Пользовательское соглашение</Link>.
        </div>
      </div>
    </div>
  );
}
