import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { authLimiter, rateLimitResponse } from "@/lib/middleware/rate-limit";

// The client resizes avatars to 256×256 JPEG before upload, so a valid payload
// is a few tens of KB. We store it as a data URL in users.avatar_url. The cap
// protects the row (and rejects anything that skipped the client resize).
const MAX_LEN = 200_000; // ~150 KB of base64
const DATA_URL_RE = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/;

// POST /api/user/avatar  { dataUrl }
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const limit = await authLimiter(`avatar:${session.user.id}`);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  let body: { dataUrl?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 }); }

  const dataUrl = body.dataUrl ?? "";
  if (!DATA_URL_RE.test(dataUrl)) return NextResponse.json({ success: false, error: "Загрузите изображение (PNG, JPEG или WebP)" }, { status: 400 });
  if (dataUrl.length > MAX_LEN) return NextResponse.json({ success: false, error: "Файл слишком большой — максимум ~150 КБ после сжатия" }, { status: 413 });

  // Demo mode — echo back so the UI updates without a database.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ success: true, avatarUrl: dataUrl });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { error } = await db.from("users").update({ avatar_url: dataUrl }).eq("id", session.user.id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, avatarUrl: dataUrl });
}

// DELETE /api/user/avatar — revert to the default (initial) avatar.
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ success: true });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  await db.from("users").update({ avatar_url: null }).eq("id", session.user.id);
  return NextResponse.json({ success: true });
}
