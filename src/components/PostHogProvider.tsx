"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { identifyUser, resetAnalytics } from "@/lib/analytics/events";

// Initialise once on the client, only when a key is configured. Without a key
// this is a complete no-op — the app runs identically with analytics disabled.
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY && !(posthog as unknown as { __loaded?: boolean }).__loaded) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    capture_pageview: false,   // App Router: we send $pageview manually on route change
    capture_pageleave: true,   // needed for accurate time-on-page / retention
    autocapture: true,         // click tracking out of the box
    persistence: "localStorage+cookie",
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

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      <SessionIdentifier />
      {children}
    </PHProvider>
  );
}
