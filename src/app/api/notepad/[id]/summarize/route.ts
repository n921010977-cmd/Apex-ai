import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { chatLimiter, rateLimitResponse } from "@/lib/middleware/rate-limit";
import { requireFeature, denyResponse } from "@/lib/server/access";
import Anthropic from "@anthropic-ai/sdk";
import { safeErrorResponse, dbErrorResponse } from "@/lib/errors";

export const maxDuration = 60;

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const limit = await chatLimiter(`note-summary:${session.user.id}`);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  // Пересказ заметки — обычный AI-запрос: тратит месячную квоту сообщений.
  const access = await requireFeature(null, "aiMessages");
  if (!access.allowed) return denyResponse(access);

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: note, error: fetchErr } = await db
    .from("notes")
    .select("*")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .eq("is_deleted", false)
    .maybeSingle();

  if (fetchErr || !note) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ success: false, error: "AI not configured" }, { status: 503 });

  if (!note.content?.trim()) {
    return NextResponse.json({ success: false, error: "Note is empty" }, { status: 422 });
  }

  const client = new Anthropic({ apiKey });

  let summary = "";
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      temperature: 0.3,
      messages: [{
        role: "user",
        content: `Summarize the following note in 1-3 concise sentences. Capture the key points and main idea. Respond in the same language as the note.\n\nTitle: ${note.title}\n\nContent:\n${note.content.slice(0, 4000)}`,
      }],
    });
    summary = response.content
      .filter(b => b.type === "text")
      .map(b => (b as { type: "text"; text: string }).text)
      .join("");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI error";
    return safeErrorResponse(err, { endpoint: "/api/notepad/summarize", userId: session.user.id, publicMessage: "Не удалось составить пересказ." });
  }

  const { data, error } = await db
    .from("notes")
    .update({ ai_summary: summary, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", session.user.id)
    .select()
    .single();

  if (error) return dbErrorResponse(error, "/api/notepad/[id]/summarize");
  return NextResponse.json({ success: true, data });
}
