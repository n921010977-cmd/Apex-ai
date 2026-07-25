"use client";

import { useEffect, Suspense } from "react";
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
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY && !(posthog as unknown as { __loaded?: boolean }).__loaded) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    capture_pageview: false,   // App Router: we send $pageview manually on route change
    capture_pageleave: true,   // needed for accurate time-on-page / retention
    autocapture: true,         // click tracking out of the box
    persistence: "localStorage+cookie",
    opt_out_capturing_by_default: true, // никакой аналитики без явного согласия
    loaded: (ph) => { if (analyticsAllowed()) ph.opt_in_capturing(); },
  });
}

// Manual $pageview on every App Router navigation (searchParams included).
function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (!(posthog as unknown as { __loaded?: boolean }).__loaded) return;
    const qs = searchParams?.toString();
    posthog.capture("$pageview", { $current_url: window.location.origin + pathname + (qs ? `?${qs}` : "") });
  }, [pathname, searchParams]);
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
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      <SessionIdentifier />
      <ConsentSync />
      {children}
    </PHProvider>
  );
}
