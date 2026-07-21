import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";

// GET /api/user/export — GDPR right to data portability (Art. 20).
// Returns everything we hold about the signed-in user as a downloadable JSON
// bundle. Secrets (password_hash and any encrypted columns) are never included.
const EXPORT_TABLES: { table: string; column: string }[] = [
  { table: "projects", column: "user_id" },
  { table: "strategies", column: "user_id" },
  { table: "reports", column: "user_id" },
  { table: "conversations", column: "user_id" },
  { table: "messages", column: "user_id" },
  { table: "notes", column: "user_id" },
  { table: "tasks", column: "user_id" },
  { table: "ask_history", column: "user_id" },
  { table: "user_settings", column: "user_id" },
  { table: "activity_logs", column: "user_id" },
  { table: "usage_stats", column: "user_id" },
];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const uid = session.user.id;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Profile — explicit column list so password_hash can never leak.
  const { data: profile } = await db
    .from("users")
    .select("id, name, email, avatar_url, is_verified, created_at, updated_at, last_login")
    .eq("id", uid)
    .maybeSingle()
    .then((r: { data: unknown }) => r, () => ({ data: null }));

  const bundle: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    format: "vertlix-gdpr-export-v1",
    profile: profile ?? { id: uid, email: session.user.email, name: session.user.name },
  };

  for (const { table, column } of EXPORT_TABLES) {
    const { data } = await db.from(table).select("*").eq(column, uid).then(
      (r: { data: unknown }) => r, () => ({ data: [] })
    );
    bundle[table] = data ?? [];
  }

  return new NextResponse(JSON.stringify(bundle, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="vertlix-data-export-${uid}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
