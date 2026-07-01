import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const userId = session.user.id!;

    const [projects, messages, tasks] = await Promise.allSettled([
      db.from("projects").select("id, status").eq("user_id", userId),
      db.from("messages").select("id, tokens_used, created_at").eq("user_id", userId).gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
      db.from("tasks").select("id, status").eq("user_id", userId),
    ]);

    const projectsData = projects.status === "fulfilled" ? projects.value.data ?? [] : [];
    const messagesData = messages.status === "fulfilled" ? messages.value.data ?? [] : [];
    const tasksData = tasks.status === "fulfilled" ? tasks.value.data ?? [] : [];

    const totalTokens = messagesData.reduce((s: number, m: { tokens_used: number }) => s + (m.tokens_used ?? 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        projects: {
          total: projectsData.length,
          active: projectsData.filter((p: { status: string }) => p.status === "ACTIVE").length,
        },
        messages: {
          total: messagesData.length,
          tokensUsed: totalTokens,
        },
        tasks: {
          total: tasksData.length,
          todo: tasksData.filter((t: { status: string }) => t.status === "TODO").length,
          done: tasksData.filter((t: { status: string }) => t.status === "DONE").length,
        },
      },
    });
  } catch {
    return NextResponse.json({ success: true, data: { projects: { total: 0, active: 0 }, messages: { total: 0, tokensUsed: 0 }, tasks: { total: 0, todo: 0, done: 0 } } });
  }
}
