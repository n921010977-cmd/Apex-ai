"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

// ─── Models (all routed to Claude backend for now; real keys added later) ─────
const MODELS = [
  { id: "apex",   name: "Apex AI",  sub: "Основная",   color: "#6366f1", rgb: "99,102,241" },
  { id: "claude", name: "Claude",   sub: "Anthropic",  color: "#d97757", rgb: "217,119,87" },
  { id: "gpt",    name: "GPT",      sub: "OpenAI",     color: "#10a37f", rgb: "16,163,127" },
  { id: "gemini", name: "Gemini",   sub: "Google",     color: "#4285f4", rgb: "66,133,244" },
  { id: "grok",   name: "Grok",     sub: "xAI",        color: "#94a3b8", rgb: "148,163,184" },
];

const SUGGESTIONS = [
  { t: "Проверь мою бизнес-идею", s: "Задай уточняющие вопросы и оцени потенциал" },
  { t: "План запуска стартапа", s: "Составь пошаговый план на первые 90 дней" },
  { t: "Посчитай unit-экономику", s: "Объясни LTV, CAC и точку безубыточности" },
  { t: "Стратегия маркетинга", s: "Каналы привлечения для раннего этапа" },
];

interface Msg { role: "user" | "assistant"; content: string; }

export default function ChatPage() {
  const [model, setModel] = useState(MODELS[0]);
  const [modelOpen, setModelOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, busy]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const send = async (preset?: string) => {
    const text = (preset ?? input).trim();
    if (!text || busy) return;
    setInput("");
    const history = messages.slice(-12);
    setMessages(m => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setBusy(true);

    try {
      const res = await fetch("/api/chat/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          persona: `Ты — Apex AI, дружелюбный русскоязычный бизнес-ассистент${model.id !== "apex" ? ` (стиль ${model.name})` : ""}. Отвечай ясно, структурно и по делу.`,
          history: history.map(h => ({ role: h.role, content: h.content })),
        }),
      });

      if (!res.ok || !res.body) {
        const errText = res.status === 503 ? "AI недоступен: не настроен API-ключ." : "Ошибка сервера. Попробуйте позже.";
        setMessages(m => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: errText }; return c; });
        setBusy(false); return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const mm = line.match(/^data: (.*)$/m);
          if (!mm) continue;
          try {
            const ev = JSON.parse(mm[1]);
            if (ev.type === "token") {
              setMessages(cur => { const c = [...cur]; c[c.length - 1] = { role: "assistant", content: c[c.length - 1].content + ev.token }; return c; });
            } else if (ev.type === "error") {
              setMessages(cur => { const c = [...cur]; c[c.length - 1] = { role: "assistant", content: "Ошибка: " + ev.message }; return c; });
            }
          } catch { /* ignore */ }
        }
      }
    } catch {
      setMessages(m => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: "Не удалось связаться с ассистентом." }; return c; });
    } finally { setBusy(false); }
  };

  const onKey = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };
  const empty = messages.length === 0;

  return (
    <div style={{ minHeight: "100vh", background: "#05060A", display: "flex", flexDirection: "column", color: "#fff" }}>
      <style>{`
        @keyframes chat-dot { 0%,80%,100%{transform:scale(0.5);opacity:0.4} 40%{transform:scale(1);opacity:1} }
        @keyframes chat-fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .chat-scroll::-webkit-scrollbar{width:8px}
        .chat-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
      `}</style>

      {/* Top bar */}
      <header style={{
        height: 58, flexShrink: 0, display: "flex", alignItems: "center", gap: 12, padding: "0 18px",
        borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(5,6,10,0.9)",
        backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 10,
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(99,102,241,0.4)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" width="16" height="16"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>Apex AI</span>
        </Link>

        {/* Model selector */}
        <div style={{ position: "relative", marginLeft: 4 }}>
          <button onClick={() => setModelOpen(o => !o)} style={{
            display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 12px", borderRadius: 10, cursor: "pointer",
            background: `rgba(${model.rgb},0.12)`, border: `1px solid rgba(${model.rgb},0.3)`, color: model.color, fontSize: 12, fontWeight: 700,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: model.color, display: "block" }} />
            {model.name}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          {modelOpen && (
            <div style={{ position: "absolute", top: 38, left: 0, width: 190, zIndex: 20, background: "#12131c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, boxShadow: "0 16px 40px rgba(0,0,0,0.6)", padding: 4 }}>
              {MODELS.map(m => (
                <button key={m.id} onClick={() => { setModel(m); setModelOpen(false); }} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                  border: "none", textAlign: "left", background: model.id === m.id ? `rgba(${m.rgb},0.12)` : "transparent",
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{m.name}</span>
                    <span style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{m.sub}</span>
                  </span>
                  {model.id === m.id && <svg viewBox="0 0 24 24" fill="none" stroke={m.color} strokeWidth="3" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} style={{
              height: 32, padding: "0 12px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)",
            }}>Новый чат</button>
          )}
          <Link href="/dashboard" style={{
            height: 32, padding: "0 14px", borderRadius: 10, display: "flex", alignItems: "center", fontSize: 12, fontWeight: 700,
            background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", textDecoration: "none",
          }}>Дашборд</Link>
        </div>
      </header>

      {/* Conversation */}
      <div ref={scrollRef} className="chat-scroll" style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", padding: empty ? "0 20px" : "28px 20px 40px", minHeight: "100%", display: empty ? "flex" : "block", alignItems: "center", justifyContent: "center" }}>

          {empty ? (
            <div style={{ textAlign: "center", width: "100%", animation: "chat-fade 0.5s" }}>
              <div style={{ width: 60, height: 60, borderRadius: 18, margin: "0 auto 20px", background: "linear-gradient(135deg,#6366f1,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 30px rgba(99,102,241,0.5)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="26" height="26"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.02em" }}>Чем помочь?</h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: "0 0 28px" }}>Apex AI — ваш бизнес-ассистент. Спросите о стратегии, финансах или идее.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10, maxWidth: 520, margin: "0 auto" }}>
                {SUGGESTIONS.map(s => (
                  <button key={s.t} onClick={() => send(s.t + ". " + s.s)} style={{
                    padding: "14px 16px", borderRadius: 14, cursor: "pointer", textAlign: "left",
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", transition: "background 0.15s, border-color 0.15s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.06)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.28)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 3 }}>{s.t}</div>
                    <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)" }}>{s.s}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: "flex", gap: 12, animation: "chat-fade 0.3s", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    background: m.role === "user" ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#6366f1,#4f46e5)",
                    fontSize: 12, fontWeight: 700,
                  }}>
                    {m.role === "user" ? "Вы" : <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" width="15" height="15"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
                  </div>
                  <div style={{
                    maxWidth: "84%", padding: "11px 15px", borderRadius: 16, fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word",
                    ...(m.role === "user"
                      ? { background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", borderTopRightRadius: 4 }
                      : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.88)", border: "1px solid rgba(255,255,255,0.07)", borderTopLeftRadius: 4 }),
                  }}>
                    {m.content || (busy && i === messages.length - 1
                      ? <span style={{ display: "inline-flex", gap: 4 }}>{[0,1,2].map(d => <span key={d} style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.5)", animation: `chat-dot 1.2s ${d * 0.2}s infinite` }} />)}</span>
                      : "")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Input bar */}
      <div style={{ flexShrink: 0, padding: "12px 20px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,6,10,0.9)", backdropFilter: "blur(20px)" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", padding: 8, borderRadius: 18, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <textarea
              ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey}
              placeholder="Спросите Apex AI…" rows={1}
              style={{ flex: 1, resize: "none", maxHeight: 160, minHeight: 40, padding: "10px 12px", background: "transparent", border: "none", color: "#fff", fontSize: 14, outline: "none", fontFamily: "inherit", lineHeight: 1.5 }}
            />
            <button onClick={() => send()} disabled={busy || !input.trim()} style={{
              width: 44, height: 44, borderRadius: 13, flexShrink: 0, border: "none",
              cursor: busy || !input.trim() ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              background: busy || !input.trim() ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#6366f1,#4f46e5)",
              boxShadow: busy || !input.trim() ? "none" : "0 4px 14px rgba(99,102,241,0.4)", transition: "background 0.2s",
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={busy || !input.trim() ? "rgba(255,255,255,0.3)" : "#fff"} strokeWidth="2" width="19" height="19"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </button>
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textAlign: "center", marginTop: 8 }}>
            Apex AI может ошибаться · сейчас на базе Claude · отдельные модели подключим позже
          </div>
        </div>
      </div>
    </div>
  );
}
