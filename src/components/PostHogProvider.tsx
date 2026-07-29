"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { identifyUser, resetAnalytics } from "@/lib/analytics/events";
import { analyticsAllowed, onConsentChange } from "@/lib/consent";

// Initialise once on the client, only when a key is configured. Without a key
// this is a complete no-op — the app runs identically with analytics disabled.
//
// Consent-gated: we init with `opt_out_capturing_by_default: true`, so PostHog
// sets NO analytics cookies and captures NOTHING until the visitor explicitly
// accepts analytics in the cookie banner. The banner calls setConsent(), which
// fires an event we listen for below to opt the visitor in or out live —
// no page reload needed, and a "Reject optional" choice keeps analytics fully off.
// Инициализация в try/catch и не на верхнем уровне модуля по одной причине:
// этот провайдер оборачивает всё приложение. Исключение при загрузке модуля
// (кривой ключ, заблокированный домен, недоступный localStorage в приватном
// режиме) не логируется в интерфейсе никак — просто перестаёт работать весь
// клиентский JavaScript, и пользователь видит отрисованную страницу, на которой
// не нажимается ни одна кнопка. Аналитика такого права не имеет.
function initPostHog(): void {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  if ((posthog as unknown as { __loaded?: boolean }).__loaded) return;
  try {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      capture_pageview: false,   // App Router: we send $pageview manually on route change
      capture_pageleave: true,   // needed for accurate time-on-page / retention
      autocapture: true,         // click tracking out of the box
      persistence: "localStorage+cookie",
      opt_out_capturing_by_default: true, // никакой аналитики без явного согласия
      loaded: (ph) => { try { if (analyticsAllowed()) ph.opt_in_capturing(); } catch { /* no-op */ } },
    });
  } catch (err) {
    console.warn("[analytics] PostHog не инициализирован, продолжаем без аналитики", err);
  }
}

// Параметры, которые нельзя отправлять в аналитику ни при каком согласии:
// ссылка сброса пароля и ссылка подтверждения email содержат подписанный токен,
// то есть право войти в аккаунт. Раньше $pageview слал полный URL, и такой
// токен оседал в PostHog — этого достаточно для захвата аккаунта тем, у кого
// есть доступ к аналитике. Значения вырезаем, сам факт параметра сохраняем.
const SENSITIVE_PARAMS = new Set(["token", "code", "secret", "key", "email", "access_token", "refresh_token"]);

function sanitizeQuery(qs: string | undefined): string {
  if (!qs) return "";
  try {
    const params = new URLSearchParams(qs);
    for (const key of [...params.keys()]) {
      if (SENSITIVE_PARAMS.has(key.toLowerCase())) params.set(key, "hidden");
    }
    const out = params.toString();
    return out ? `?${out}` : "";
  } catch {
    // Разобрать строку запроса не удалось — в аналитику уйдёт путь без неё.
    // Аналитика не имеет права ломать страницу, поэтому здесь только молчание.
    return "";
  }
}

// Manual $pageview on every App Router navigation (searchParams included).
// `ready` приходит из родителя: инициализация теперь в его эффекте, а эффекты
// детей React выполняет раньше родительских — без этого флага первый просмотр
// страницы всегда терялся бы.
function PageviewTracker({ ready }: { ready: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (!ready) return;
    if (!(posthog as unknown as { __loaded?: boolean }).__loaded) return;
    // Весь вызов в try/catch: этот компонент обёрнут вокруг всего приложения,
    // и любое исключение здесь снимает интерактивность со всей страницы —
    // кнопки перестают реагировать, хотя разметка отрисована.
    try {
      posthog.capture("$pageview", { $current_url: window.location.origin + pathname + sanitizeQuery(searchParams?.toString()) });
    } catch { /* аналитика не должна ронять UX */ }
  }, [ready, pathname, searchParams]);
  return null;
}

// Tie the anonymous visitor to the signed-in user so funnels & retention work,
// and reset on sign-out so sessions don't bleed together.
function SessionIdentifier() {
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      identifyUser(session.user.id, { email: session.user.email ?? undefined, name: session.user.name ?? undefined });
    } else if (status === "unauthenticated") {
      resetAnalytics();
    }
  }, [status, session?.user?.id, session?.user?.email, session?.user?.name]);
  return null;
}

// Live-react to consent changes from the cookie banner: opt in/out of capturing
// without a reload. Opting out also drops the analytics cookies PostHog set.
function ConsentSync() {
  useEffect(() => {
    return onConsentChange((state) => {
      if (!(posthog as unknown as { __loaded?: boolean }).__loaded) return;
      if (state.analytics) posthog.opt_in_capturing();
      else posthog.opt_out_capturing();
    });
  }, []);
  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  // Инициализируем после монтирования, а не при импорте модуля: так проблема с
  // аналитикой не может помешать гидратации приложения.
  const [ready, setReady] = useState(false);
  useEffect(() => { initPostHog(); setReady(true); }, []);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageviewTracker ready={ready} />
      </Suspense>
      <SessionIdentifier />
      <ConsentSync />
      {children}
    </PHProvider>
  );
}
