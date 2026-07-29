// ─── Единый источник секрета подписи ──────────────────────────────────────────
// Этим секретом подписываются session-JWT, ссылки сброса пароля и ссылки
// подтверждения email. Раньше при отсутствии переменной окружения код молча
// подставлял строку-заглушку прямо из репозитория. В продакшене это означало бы
// полный захват любого аккаунта: зная секрет, атакующий подделывает и cookie
// сессии, и ссылку сброса пароля.
//
// Правила:
//   • продакшен без NEXTAUTH_SECRET — работаем на случайном секрете процесса:
//     подделать его нельзя, но сессии не переживают перезапуск. Сайт при этом
//     остаётся доступным, а в логах висит явное предупреждение;
//   • сборка (`next build`) — не падает: на этом этапе запросы не обслуживаются
//     и ничего не подписывается, модуль лишь импортируется при сборе страниц.
//     Иначе деплой невозможен даже для того, чтобы потом добавить переменную;
//   • dev/test — разрешена заглушка, чтобы поднять локально без настройки.
//
// Edge-safe: только process.env, никаких node-модулей.

const DEV_FALLBACK = "vertlix-dev-only-secret-not-for-production";

// Значение живёт только внутри процесса сборки и никогда не подписывает
// пользовательские токены: на этапе build нет ни одного HTTP-запроса.
const BUILD_PLACEHOLDER = "vertlix-build-time-placeholder-never-signs-tokens";

/** Идёт ли сейчас `next build` (Next.js выставляет NEXT_PHASE сам). */
function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

// Секрет на время жизни процесса, если переменная не задана. Он случайный,
// поэтому подделать им токен нельзя — в отличие от строки из репозитория, с
// которой всё началось. Расплата другая: при перезапуске (и на каждом инстансе
// Vercel свой) сессии перестают распознаваться, то есть пользователей будет
// разлогинивать. Это заметная, но чинимая неприятность — в отличие от падения
// всего сайта, которым оборачивался прежний вариант с исключением.
let ephemeral: string | null = null;

function ephemeralSecret(): string {
  if (!ephemeral) {
    const rnd = globalThis.crypto?.randomUUID?.() ?? String(Math.random());
    ephemeral = `ephemeral-${rnd}-${Date.now()}`;
    console.error(
      "[auth] NEXTAUTH_SECRET не задан. Использую случайный секрет на время " +
      "работы процесса: вход будет работать нестабильно (пользователей будет " +
      "разлогинивать), пока переменная не появится в окружении. " +
      "Сгенерировать: openssl rand -base64 32"
    );
  }
  return ephemeral;
}

export function authSecret(): string {
  const fromEnv = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (fromEnv && fromEnv.trim()) return fromEnv;

  if (isBuildPhase()) return BUILD_PLACEHOLDER;
  if (process.env.NODE_ENV === "production") return ephemeralSecret();

  return DEV_FALLBACK;
}

/**
 * Настроен ли секрет по-настоящему. Нужен там, где хочется мягко сообщить о
 * проблеме конфигурации вместо падения — например, на странице здоровья.
 */
export function authSecretConfigured(): boolean {
  const fromEnv = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  return Boolean(fromEnv && fromEnv.trim());
}
