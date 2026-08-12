import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { validateBody, UpdateSettingsSchema } from "@/lib/validators";
import { safeErrorResponse, dbErrorResponse } from "@/lib/errors";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  // Avatar lives on the users row (kept out of the session token to stay under
  // the cookie size limit), so read it directly. Best-effort — falls back to
  // whatever image the session carries (e.g. an OAuth picture).
  let avatarUrl: string | null = session.user.image ?? null;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && session.user.id) {
    try {
      const supabase = await createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const { data } = await db.from("users").select("avatar_url").eq("id", session.user.id).maybeSingle();
      if (data?.avatar_url) avatarUrl = data.avatar_url;
    } catch { /* keep the session fallback */ }
  }

  return NextResponse.json({
    success: true,
    data: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      avatar_url: avatarUrl,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  let rawBody: unknown;
  try { rawBody = await req.json(); } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  // Имя профиля обрабатываем отдельно — оно живёт в таблице users, а не в
  // user_settings. В демо-режиме (без Supabase) сервер его не хранит: клиент
  // сохраняет имя в сессию через session.update(), и оно живёт в cookie-токене.
  const rawName = (rawBody as { name?: unknown })?.name;
  const name = typeof rawName === "string" ? rawName.trim().slice(0, 80) : undefined;

  const { data, error } = validateBody(UpdateSettingsSchema, rawBody);
  if (error) return NextResponse.json({ success: false, error }, { status: 422 });

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = await createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;

      if (name) {
        await db.from("users").update({ name }).eq("id", session.user.id);
      }
      if (data && Object.keys(data).length) {
        await db.from("user_settings").upsert({
          user_id: session.user.id,
          ...data,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      }
    }
    return NextResponse.json({ success: true, data, name });
  } catch {
    // Демо-режим или сбой БД — не блокируем: клиент отразит имя в сессии.
    return NextResponse.json({ success: true, data, name });
  }
}

// DELETE /api/user — GDPR right to erasure (Art. 17).
// Permanently deletes the signed-in user's account and all personal data.
// Rows in child tables are removed by user_id first (in case FK cascade is not
// configured), then the users row itself.
const USER_OWNED_TABLES = [
  "activity_logs", "usage_stats", "user_settings", "notes", "tasks",
  "ask_history", "messages", "conversations", "reports", "strategies", "projects",
];

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const uid = session.user.id;

    for (const table of USER_OWNED_TABLES) {
      // Best-effort: not every table exists in every deployment. Ignore misses.
      await db.from(table).delete().eq("user_id", uid).then(
        () => {}, () => {}
      );
    }
    const { error } = await db.from("users").delete().eq("id", uid);
    if (error) return dbErrorResponse(error, "/api/user");

    return NextResponse.json({ success: true, deleted: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка удаления";
    return safeErrorResponse(e, { endpoint: "/api/user", publicMessage: "Не удалось выполнить операцию с профилем." });
  }
}
