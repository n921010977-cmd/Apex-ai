import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const SUPPORT_SYSTEM_PROMPT = `You are a helpful and empathetic support agent for Vertlix AI, an executive AI platform.
Your role is to assist users with their questions and issues about the platform.

Vertlix AI features:
- AI Agents: customizable AI agents for various business tasks
- Executive Board: AI-powered C-suite simulation (CEO, CFO, COO, CMO, CTO)
- Strategy Builder: AI-generated business strategies
- Analytics Dashboard: business metrics and KPIs
- Risk Management: risk tracking and mitigation
- Notepad: AI-enhanced note taking
- Reports: AI-generated business reports

Tone: Professional, helpful, concise. Provide actionable solutions when possible.
For technical issues: collect details and suggest steps. For billing: direct to account settings.
Always end with: "Is there anything else I can help you with?"`;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  let query = db
    .from("support_tickets")
    .select("*", { count: "exact" })
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (category) query = query.eq("category", category);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, data: data ?? [], total: count ?? 0 });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  let body: {
    subject?: string;
    description?: string;
    category?: string;
    priority?: string;
  };
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.subject?.trim()) {
    return NextResponse.json({ success: false, error: "Subject is required" }, { status: 422 });
  }
  if (!body.description?.trim()) {
    return NextResponse.json({ success: false, error: "Description is required" }, { status: 422 });
  }

  const VALID_CATEGORIES = ["general", "billing", "technical", "feature", "bug"];
  const VALID_PRIORITIES = ["low", "medium", "high", "urgent"];
  const category = VALID_CATEGORIES.includes(body.category ?? "") ? body.category : "general";
  const priority = VALID_PRIORITIES.includes(body.priority ?? "") ? body.priority : "medium";

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Generate AI response
  let aiResponse: string | null = null;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey) {
    try {
      const client = new Anthropic({ apiKey });
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        temperature: 0.4,
        system: SUPPORT_SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: `Ticket Subject: ${body.subject}\nCategory: ${category}\nPriority: ${priority}\n\nDescription:\n${body.description}`,
        }],
      });
      aiResponse = response.content
        .filter(b => b.type === "text")
        .map(b => (b as { type: "text"; text: string }).text)
        .join("");
    } catch {
      // Non-fatal: ticket still created without AI response
    }
  }

  const { data, error } = await db.from("support_tickets").insert({
    user_id: session.user.id,
    subject: body.subject.trim(),
    description: body.description.trim(),
    category,
    priority,
    status: "open",
    ai_response: aiResponse,
  }).select().single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data }, { status: 201 });
}
