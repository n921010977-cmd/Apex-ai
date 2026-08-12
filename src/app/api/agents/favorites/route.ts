import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { dbErrorResponse } from "@/lib/errors";

// GET /api/agents/favorites — the user's favorited agent ids.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ success: true, favorites: [] });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data } = await db.from("user_settings").select("fav_agents").eq("user_id", session.user.id).maybeSingle();

  return NextResponse.json({ success: true, favorites: data?.fav_agents ?? [] });
}

// PUT /api/agents/favorites  { favorites: string[] } — replace the favorites set.
export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  let body: { favorites?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 }); }
  const favorites = Array.isArray(body.favorites) ? body.favorites.filter((x): x is string => typeof x === "string").slice(0, 500) : [];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ success: true, favorites });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { error } = await db.from("user_settings").upsert(
    { user_id: session.user.id, fav_agents: favorites, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  if (error) return dbErrorResponse(error, "/api/agents/favorites");

  return NextResponse.json({ success: true, favorites });
}
