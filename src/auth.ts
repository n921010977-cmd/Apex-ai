import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import { CredentialsSignin } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { createClient } from "@/lib/supabase/server";
import { verifyTotpCode, matchBackupCode } from "@/lib/two-factor";
import { authConfig } from "@/auth.config";

// Thrown from authorize() when the account has 2FA enabled. The `code` is
// surfaced to the client as signIn()'s `error` field (redirect: false), so
// the login page can branch to a second-step code input instead of showing
// a generic "wrong credentials" message.
class TwoFactorRequiredError extends CredentialsSignin { code = "2FA_REQUIRED"; }
class TwoFactorInvalidError extends CredentialsSignin { code = "2FA_INVALID"; }

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
      async authorize(credentials) {
        const name     = (credentials?.name     as string | undefined)?.trim();
        const email    = (credentials?.email    as string | undefined)?.trim().toLowerCase();
        const password =  credentials?.password as string | undefined;
        const totpCode = (credentials?.totpCode as string | undefined)?.trim();

        if (!email || !password || password.length < 6) return null;

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
          image: user.image ?? user.avatar_url ?? null,
          role:  user.role  ?? "FREE",
          tier:  user.tier  ?? "FREE",
        };
      },
    }),
  ],

  callbacks: {
    // ── jwt: enrich token with custom fields on sign-in ───────────────────
    async jwt({ token, user, account }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as { role?: string }).role ?? "FREE";
        token.tier = (user as { tier?: string }).tier ?? "FREE";
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
