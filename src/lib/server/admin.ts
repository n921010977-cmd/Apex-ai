// ─── Проверка администратора (только на сервере) ──────────────────────────────
// Источник истины — колонка users.is_admin в БД (назначается SQL'ом, из
// фронтенда её не выставить: RLS запрещает anon любые записи, а API обновления
// профиля это поле не принимает). ADMIN_EMAIL из окружения остаётся запасным
// входом для первичной настройки и демо-режима без БД.

import { auth } from "@/auth";
import { headers } from "next/headers";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { apiLimiter, clientIp } from "@/lib/middleware/rate-limit";

// Bootstrap admin by email. The hardcoded address is a DEVELOPMENT-ONLY
// convenience: in production the grant comes from ADMIN_EMAIL, and if that is
// unset the email path is disabled entirely so a committed address can never
// confer admin. The database column users.is_admin remains the real source of
// truth in every environment.
const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL?.trim() ||
  (process.env.NODE_ENV === "production" ? "" : "n921010977@gmail.com");

export interface AdminCheck {
  ok: boolean;
  status: 401 | 403 | 429 | 200;
  userId?: string;
  email?: string;
}

export async function requireAdmin(): Promise<AdminCheck> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, status: 401 };

  // Ограничение частоты для всей админской зоны: перебирать её эндпоинты
  // (в том числе с валидной сессией обычного пользователя) не получится.
  try {
    const h = await headers();
    const rl = await apiLimiter(`admin:${session.user.id}:${clientIp({ headers: h })}`);
    if (!rl.allowed) return { ok: false, status: 429 };
  } catch { /* нет контекста запроса — пропускаем ограничение */ }

  const email = session.user.email ?? "";

  // Запасной вход (bootstrap/демо): email из серверного окружения.
  if (ADMIN_EMAIL && email && email === ADMIN_EMAIL) {
    return { ok: true, status: 200, userId: session.user.id, email };
  }

  // Основной путь: роль из БД.
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const { data } = await db.from("users").select("is_admin").eq("id", session.user.id).maybeSingle();
      if (data?.is_admin === true) return { ok: true, status: 200, userId: session.user.id, email };
    } catch { /* ниже отдадим 403 */ }
  }

  return { ok: false, status: 403 };
}
