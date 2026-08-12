import { log, describeError } from "@/lib/logger";

// Единая точка сбора серверных ошибок Next.js (route handlers, серверные
// компоненты, middleware). Пишем структурную строку без секретов и без тела
// запроса — пользовательский контент и ключи в мониторинг не уходят.
//
// Внешний мониторинг (Sentry и т.п.) подключается здесь же: если в окружении
// появится SENTRY_DSN и установлен SDK, событие можно переслать туда. Пока SDK
// в проекте нет — не притворяемся, что мониторинг подключён.
export async function onRequestError(
  err: unknown,
  request: { path?: string; method?: string },
  context: { routerKind?: string; routeType?: string },
) {
  const { message, name } = describeError(err);
  log.error({
    event: "server_error",
    endpoint: request?.path,
    method: request?.method,
    routeType: context?.routeType,
    errorName: name,
    message,
  });
}

export async function register() {
  // Без process.version: register() выполняется в том числе в Edge-рантайме,
  // где Node-API недоступны.
  log.info({ event: "app_start", env: process.env.NODE_ENV, runtime: process.env.NEXT_RUNTIME ?? "nodejs" });
}
