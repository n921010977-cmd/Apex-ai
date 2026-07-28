import type { NextAuthConfig } from "next-auth";
import { authSecret } from "@/lib/auth-secret";

/**
 * Edge-safe subset of the NextAuth config — no Credentials provider, no
 * bcrypt/otplib/Node `crypto` imports, no Supabase calls. This is the only
 * config `src/middleware.ts` may import: middleware runs on the Edge
 * Runtime, which doesn't support Node's `crypto` module, so pulling in the
 * full config (with 2FA verification via `src/lib/two-factor.ts`) breaks the
 * edge bundle. Middleware only needs to decode the session cookie to check
 * `req.auth` — it never signs users in — so this minimal config (same
 * `secret`, no providers) is sufficient for that.
 *
 * The full config in `src/auth.ts` spreads this object and adds providers +
 * callbacks; keep the two in sync for anything that affects session shape
 * (session strategy, maxAge, pages).
 */
export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [],
  pages: {
    signIn:  "/login",
    error:   "/login",
    signOut: "/login",
    newUser: "/dashboard",
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 days
  secret: authSecret(),
};
