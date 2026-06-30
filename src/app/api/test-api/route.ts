import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, error: "ANTHROPIC_API_KEY not set" });
  }

  try {
    const client = new Anthropic({ apiKey: key });
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 20,
      messages: [{ role: "user", content: "Say: OK" }],
    });
    const text = res.content[0].type === "text" ? res.content[0].text : "";
    return NextResponse.json({ ok: true, response: text, keyPrefix: key.slice(0, 20) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err), keyPrefix: key.slice(0, 20) });
  }
}
