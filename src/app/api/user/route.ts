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
