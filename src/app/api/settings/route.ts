import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
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

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const allowed = ["language", "timezone", "theme", "ai_model", "email_notifs", "push_notifs", "two_fa", "preferences"];
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Upsert — create settings row if it doesn't exist
  const { data, error } = await db
    .from("user_settings")
    .upsert({ user_id: session.user.id, ...update }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) return dbErrorResponse(error, "/api/settings");
  return NextResponse.json({ success: true, data });
}
