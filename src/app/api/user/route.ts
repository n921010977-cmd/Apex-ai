import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { validateBody, UpdateSettingsSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    success: true,
    data: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
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

  const { data, error } = validateBody(UpdateSettingsSchema, rawBody);
  if (error) return NextResponse.json({ success: false, error }, { status: 422 });

  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    await db.from("user_settings").upsert({
      user_id: session.user.id,
      ...data,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: true, data });
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
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, deleted: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка удаления";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
