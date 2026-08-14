import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import { CredentialsSignin } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { createClient } from "@/lib/supabase/server";
import { verifyTotpCode, matchBackupCode } from "@/lib/two-factor";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { getRpID, getRpOrigin } from "@/lib/webauthn";
import { authConfig } from "@/auth.config";
import { authLimiter, clientIp } from "@/lib/middleware/rate-limit";

// Thrown from authorize() when the account has 2FA enabled. The `code` is
// surfaced to the client as signIn()'s `error` field (redirect: false), so
// the login page can branch to a second-step code input instead of showing
// a generic "wrong credentials" message.
class TwoFactorRequiredError extends CredentialsSignin { code = "2FA_REQUIRED"; }
class TwoFactorInvalidError extends CredentialsSignin { code = "2FA_INVALID"; }
// Thrown when too many sign-in attempts have been made for this IP+email
// combination — without this, authorize() had no brute-force protection at
// all (only /api/auth/register did), so a password could be guessed with
// unlimited attempts straight through NextAuth's own credentials flow.
class RateLimitedError extends CredentialsSignin { code = "RATE_LIMITED"; }

// ─── Type augmentation ────────────────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      tier: string;
    } & DefaultSession["user"];
  }
  interface User {
    role?: string;
    tier?: string;
  }
}

// ─── Helper: look up a user by email via Supabase ─────────────────────────────

// Only http(s) images belong in the JWT — a data-URL avatar (stored in
// users.avatar_url) would blow past the ~4KB session-cookie limit and break
// auth. The profile page reads the real avatar from /api/user instead.
function httpImage(...vals: (string | null | undefined)[]): string | null {
  for (const v of vals) if (typeof v === "string" && /^https?:\/\//.test(v)) return v;
  return null;
}

async function findUserByEmail(email: string) {
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data } = await db
      .from("users")
      .select("id, email, name, image, avatar_url, password_hash, role, tier")
      .eq("email", email.toLowerCase())
      .maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}

// ─── NextAuth configuration ───────────────────────────────────────────────────

const config: NextAuthConfig = {
  ...authConfig,
  providers: [
    // ── Google OAuth ──────────────────────────────────────────────────────
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: { params: { prompt: "consent", access_type: "offline" } },
          }),
        ]
      : []),

    // ── GitHub OAuth ──────────────────────────────────────────────────────
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHub({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),

    // ── Nickname + Email + Password ───────────────────────────────────────
    Credentials({
      name: "credentials",
      credentials: {
        name:     { label: "Nickname", type: "text"     },
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
        totpCode: { label: "2FA code", type: "text"      },
      },
      async authorize(credentials, request) {
        const name     = (credentials?.name     as string | undefined)?.trim();
        const email    = (credentials?.email    as string | undefined)?.trim().toLowerCase();
        const password =  credentials?.password as string | undefined;
        const totpCode = (credentials?.totpCode as string | undefined)?.trim();

        if (!email || !password || password.length < 6) return null;

        // ── Brute-force protection ───────────────────────────────────────────
        // Keyed by IP+email so one attacker can't grind a single account, and
        // one compromised account list can't be sprayed from one IP either.
        const ip = clientIp(request);
        const attempt = await authLimiter(`login:${ip}:${email}`);
        if (!attempt.allowed) throw new RateLimitedError();

        // ── Demo mode: no database configured → accept any valid input ──────
        // Lets users sign in with nickname + email + password when Supabase
        // env vars are not set (local / preview deployments).
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
          return {
            id:    `demo-${Buffer.from(email).toString("hex").slice(0, 16)}`,
            email,
            name:  name || email.split("@")[0],
            image: null,
            role:  "FREE",
            tier:  "FREE",
          };
        }

        const user = await findUserByEmail(email);
        if (!user) return null;

        // User may have registered via OAuth — no password set
        if (!user.password_hash) return null;

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return null;

        // ── 2FA gate ────────────────────────────────────────────────────────
        const supabase = await createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = supabase as any;
        const { data: settings } = await db
          .from("user_settings")
          .select("two_fa, two_fa_secret_enc, two_fa_backup_codes")
          .eq("user_id", user.id)
          .maybeSingle();

        if (settings?.two_fa && settings.two_fa_secret_enc) {
          if (!totpCode) throw new TwoFactorRequiredError();

          const validTotp = await verifyTotpCode(settings.two_fa_secret_enc, totpCode);
          if (!validTotp) {
            const codes: string[] = settings.two_fa_backup_codes ?? [];
            const idx = await matchBackupCode(codes, totpCode);
            if (idx === -1) throw new TwoFactorInvalidError();
            // Backup codes are one-time use — remove the consumed one.
            const remaining = codes.filter((_, i) => i !== idx);
            await db.from("user_settings").update({ two_fa_backup_codes: remaining }).eq("user_id", user.id);
          }
        }

        return {
          id:    user.id,
          email: user.email,
          name:  user.name ?? name ?? email.split("@")[0],
          image: httpImage(user.image, user.avatar_url),
          role:  user.role  ?? "FREE",
          tier:  user.tier  ?? "FREE",
        };
      },
    }),

    // ── Гостевой вход (без регистрации) ───────────────────────────────────
    // Пускает в продукт одним нажатием: аккаунт не создаётся, выдаётся сессия
    // со случайным идентификатором. Всё скоупится по этому id так же, как по
    // обычному пользователю, поэтому гости не видят чужих данных и не мешают
    // друг другу — но и данные гостя живут только до конца сессии.
    //
    // Выключается переменной ALLOW_GUEST_ACCESS=false. Это важно: гостевой
    // вход открыт всему интернету, а за каждым AI-запросом стоят наши деньги.
    ...(process.env.ALLOW_GUEST_ACCESS !== "false"
      ? [
          Credentials({
            id: "guest",
            name: "guest",
            credentials: {},
            async authorize(_credentials, request) {
              // Тот же лимитер, что и на обычном входе: иначе гостевые сессии
              // можно печь пачками и через них жечь квоту на AI.
              const ip = clientIp(request);
              const attempt = await authLimiter(`guest:${ip}`);
              if (!attempt.allowed) throw new RateLimitedError();

              const rnd = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
              const short = rnd.replace(/-/g, "").slice(0, 12);
              return {
                id:    `guest-${short}`,
                email: `guest-${short}@vertlix.local`,
                name:  "Гость",
                image: null,
                role:  "FREE",
                tier:  "FREE",
              };
            },
          }),
        ]
      : []),

    // ── Passkey (WebAuthn) ────────────────────────────────────────────────
    // The browser has already run the authentication ceremony; here we verify
    // the signed assertion server-side against the stored challenge + public
    // key, bump the signature counter, and mint the session.
    Credentials({
      id: "passkey",
      name: "passkey",
      credentials: {
        email:    { label: "Email",    type: "email" },
        response: { label: "Response", type: "text"  },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase();
        const raw   =  credentials?.response as string | undefined;
        if (!email || !raw) return null;

        // Passkeys require a real database — no demo fallback.
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let response: any;
        try { response = JSON.parse(raw); } catch { return null; }

        const supabase = await createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = supabase as any;

        const user = await findUserByEmail(email);
        if (!user) return null;

        // Match the credential the browser used.
        const { data: cred } = await db
          .from("webauthn_credentials")
          .select("id, public_key, counter")
          .eq("id", response.id)
          .eq("user_id", user.id)
          .maybeSingle();
        if (!cred) return null;

        // Load the freshest authentication challenge for this email.
        const { data: ch } = await db
          .from("webauthn_challenges")
          .select("id, challenge")
          .eq("email", email)
          .eq("kind", "authenticate")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!ch?.challenge) return null;

        let verification;
        try {
          verification = await verifyAuthenticationResponse({
            response,
            expectedChallenge: ch.challenge,
            expectedOrigin: getRpOrigin(),
            expectedRPID: getRpID(),
            authenticator: {
              credentialID: isoBase64URL.toBuffer(cred.id),
              credentialPublicKey: isoBase64URL.toBuffer(cred.public_key),
              counter: Number(cred.counter) || 0,
            },
          });
        } catch {
          return null;
        }

        if (!verification.verified) return null;

        // Bump the counter (clone-detection) and mark the passkey used.
        await db
          .from("webauthn_credentials")
          .update({ counter: verification.authenticationInfo.newCounter, last_used_at: new Date().toISOString() })
          .eq("id", cred.id);
        await db.from("webauthn_challenges").delete().eq("id", ch.id);

        return {
          id:    user.id,
          email: user.email,
          name:  user.name ?? email.split("@")[0],
          image: httpImage(user.image, user.avatar_url),
          role:  user.role  ?? "FREE",
          tier:  user.tier  ?? "FREE",
        };
      },
    }),
  ],

  callbacks: {
    // ── jwt: enrich token with custom fields on sign-in ───────────────────
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as { role?: string }).role ?? "FREE";
        token.tier = (user as { tier?: string }).tier ?? "FREE";
      }

      // Client-initiated session.update({ name }) — persist the new display
      // name into the token (works even without a database, e.g. demo/guest).
      if (trigger === "update" && session && typeof (session as { name?: unknown }).name === "string") {
        token.name = (session as { name: string }).name;
      }

      // On OAuth sign-in, upsert the user into Supabase + fetch role/tier
      if (account && account.provider !== "credentials") {
        try {
          const supabase = await createClient();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const db = supabase as any;

          const { data: existing } = await db
            .from("users")
            .select("id, role, tier")
            .eq("email", token.email)
            .maybeSingle();

          if (existing) {
            token.id   = existing.id;
            token.role = existing.role ?? "FREE";
            token.tier = existing.tier ?? "FREE";
            // Отмечаем способ входа и подтверждённость: OAuth-провайдер сам
            // удостоверил владельца почты. Отдельным update и в своём catch —
            // чтобы отсутствие колонки (миграция 017 не применена) не ломало вход.
            try {
              await db.from("users")
                .update({ auth_provider: account.provider, is_verified: true, last_login_at: new Date().toISOString() })
                .eq("id", existing.id);
            } catch { /* колонок ещё нет — не критично */ }
          } else {
            // Create new user on first OAuth login
            const { data: created } = await db
              .from("users")
              .insert({
                email:                  token.email,
                name:                   token.name,
                image:                  token.picture,
                role:                   "FREE",
                tier:                   "FREE",
                max_reports_per_month:  3,
                reports_generated_month: 0,
              })
              .select("id, role, tier")
              .single();

            if (created) {
              token.id   = created.id;
              token.role = created.role;
              token.tier = created.tier;
              try {
                await db.from("users")
                  .update({ auth_provider: account.provider, is_verified: true })
                  .eq("id", created.id);
              } catch { /* миграция 017 ещё не применена */ }
            }
          }
        } catch (err) {
          console.error("[auth/jwt] OAuth upsert error:", err);
        }
      }

      return token;
    },

    // ── session: expose id, role, tier to the client ──────────────────────
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id   = (token.id  ?? token.sub) as string;
        session.user.role = (token.role as string) ?? "FREE";
        session.user.tier = (token.tier as string) ?? "FREE";
        if (typeof token.name === "string") session.user.name = token.name;
      }
      return session;
    },

    // ── signIn: block sign-in if the user is banned ───────────────────────
    async signIn({ user }) {
      // Add ban-check here if needed:
      // if (user.role === "BANNED") return false;
      return !!user;
    },
  },

  // Debug NextAuth in development only
  debug: process.env.NODE_ENV === "development",
};

export const { handlers, signIn, signOut, auth } = NextAuth(config);
