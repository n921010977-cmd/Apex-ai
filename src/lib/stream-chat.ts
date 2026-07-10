// Клиент SSE-стриминга для /api/chat/direct — общий для дашборд-страниц.
export async function streamChat(
  message: string,
  persona: string,
  onToken: (t: string) => void,
): Promise<string> {
  const res = await fetch("/api/chat/direct", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, persona }),
  });
  if (!res.ok || !res.body) throw new Error("api_unavailable");
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const l of lines) {
      if (!l.startsWith("data: ")) continue;
      let ev: { type?: string; token?: string };
      try { ev = JSON.parse(l.slice(6)); } catch { continue; }
      if (ev.type === "token" && ev.token) { full += ev.token; onToken(ev.token); }
      if (ev.type === "error") throw new Error("api_unavailable");
    }
  }
  if (!full.trim()) throw new Error("api_unavailable");
  return full;
}
