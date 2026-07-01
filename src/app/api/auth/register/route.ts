/**
 * POST /api/auth/register
 *
 * Creates a new user account with email + hashed password.
 * Initialises the FREE tier with a 3 report/month limit.
 * Returns 409 if the email is already taken.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createClient } from "@/lib/supabase/server";

// ─── Request schema ───────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  email:    z.string().email("Некорректный email"),
  password: z.string().min(8, "Пароль должен содержать не менее 8 символов").max(128),
  name:     z.string().min(2, "Имя слишком короткое").max(100).optional(),
});

// ─── Tier defaults ────────────────────────────────────────────────────────────

const TIER_DEFAULTS = {
  FREE: { maxReportsPerMonth: 3,  role: "FREE",     tier: "FREE" },
  PRO:  { maxReportsPerMonth: 20, role: "PRO",      tier: "PRO"  },
  MAX:  { maxReportsPerMonth: 100, role: "BUSINESS", tier: "MAX"  },
} as const;

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── 1. Parse & validate body ───────────────────────────────────────────
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON in request body" },
      { status: 400 },
    );
  }

  const parsed = RegisterSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => i.message).join("; ");
    return NextResponse.json({ success: false, error: msg }, { status: 422 });
  }

  const { email, password, name } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  // ── 2. Check for duplicate email ───────────────────────────────────────
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: existing } = await db
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { success: false, error: "Пользователь с этим email уже зарегистрирован", code: "EMAIL_IN_USE" },
      { status: 409 },
    );
  }

  // ── 3. Hash password (12 rounds = ~250ms, good tradeoff) ───────────────
  const passwordHash = await bcrypt.hash(password, 12);

  // ── 4. Create user with FREE tier defaults ─────────────────────────────
  const defaults = TIER_DEFAULTS.FREE;
  const displayName = name?.trim() || normalizedEmail.split("@")[0];
  const now = new Date();
  // Monthly limit resets on the 1st of next month
  const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const { data: created, error: insertErr } = await db
    .from("users")
    .insert({
      email:                    normalizedEmail,
      name:                     displayName,
      password_hash:            passwordHash,
      role:                     defaults.role,
      tier:                     defaults.tier,
      max_reports_per_month:    defaults.maxReportsPerMonth,
      reports_generated_month:  0,
      limit_reset_date:         nextReset.toISOString(),
      created_at:               now.toISOString(),
      updated_at:               now.toISOString(),
    })
    .select("id, email, name, role, tier, max_reports_per_month")
    .single();

  if (insertErr || !created) {
    console.error("[register] DB insert error:", insertErr);
    return NextResponse.json(
      { success: false, error: "Не удалось создать аккаунт. Попробуйте позже." },
      { status: 500 },
    );
  }

  // ── 5. Return minimal user data (never return passwordHash) ───────────
  return NextResponse.json(
    {
      success: true,
      data: {
        id:    created.id,
        email: created.email,
        name:  created.name,
        role:  created.role,
        tier:  created.tier,
        limits: { reportsPerMonth: created.max_reports_per_month },
      },
    },
    { status: 201 },
  );
}
