import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { MODEL_HEAVY } from "@/lib/ai/model-config";
import { dbErrorResponse } from "@/lib/errors";

const DEFAULTS = {
  language: "ru",
  timezone: "Europe/Moscow",
  theme: "dark",
  ai_model: MODEL_HEAVY,
  email_notifs: true,
  push_notifs: false,
  two_fa: false,
  preferences: {},
};

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from("user_settings")
    .select("*")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error) return dbErrorResponse(error, "/api/settings");

  // Return defaults merged with stored settings
  return NextResponse.json({ success: true, data: { ...DEFAULTS, ...(data ?? {}), user_id: session.user.id } });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  // Without a database there is nothing to write to. Saying "saved" here is a
  // lie the UI would faithfully repeat, so fail loudly instead.
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: "Settings can't be saved: no database is configured for this environment." },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const allowed = ["language", "timezone", "theme", "ai_model", "email_notifs", "push_notifs", "two_fa"];
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // `preferences` is one JSONB column shared by every settings tab, so writing
  // the incoming object straight in would delete the keys owned by the other
  // tabs — saving Notifications used to wipe the AI panel's settings. Merge
  // shallowly onto what is already stored instead.
  if ("preferences" in body) {
    const incoming = body.preferences;
    if (typeof incoming !== "object" || incoming === null || Array.isArray(incoming)) {
      return NextResponse.json({ success: false, error: "preferences must be an object" }, { status: 422 });
    }
    const { data: existing } = await db
      .from("user_settings")
      .select("preferences")
      .eq("user_id", session.user.id)
      .maybeSingle();
    update.preferences = { ...(existing?.preferences ?? {}), ...(incoming as Record<string, unknown>) };
  }

  // Upsert — create settings row if it doesn't exist
  const { data, error } = await db
    .from("user_settings")
    .upsert({ user_id: session.user.id, ...update }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) return dbErrorResponse(error, "/api/settings");

  // A successful call that wrote no row means the save silently did nothing.
  if (!data) {
    console.error("[settings] upsert returned no row for user", session.user.id);
    return NextResponse.json({ success: false, error: "Settings were not saved — please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
