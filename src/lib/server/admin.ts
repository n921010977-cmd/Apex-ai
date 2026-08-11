// ─── Проверка администратора (только на сервере) ──────────────────────────────
// Источник истины — колонка users.is_admin в БД (назначается SQL'ом, из
// фронтенда её не выставить: RLS запрещает anon любые записи, а API обновления
// профиля это поле не принимает). ADMIN_EMAIL из окружения остаётся запасным
// входом для первичной настройки и демо-режима без БД.

import { auth } from "@/auth";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "n921010977@gmail.com";

export interface AdminCheck {
  ok: boolean;
  status: 401 | 403 | 200;
  userId?: string;
  email?: string;
}

export async function requireAdmin(): Promise<AdminCheck> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, status: 401 };

  const email = session.user.email ?? "";

  // Запасной вход (bootstrap/демо): email из серверного окружения.
  if (email && email === ADMIN_EMAIL) {
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
