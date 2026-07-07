"use client";

import { useState, useRef, useEffect } from "react";

// ─── Models (all routed to the Claude-powered backend for now) ────────────────
const MODELS = [
  { id: "apex",   name: "Apex AI",  sub: "Основная модель",  color: "#6366f1", rgb: "99,102,241" },
  { id: "claude", name: "Claude",   sub: "Anthropic",        color: "#d97757", rgb: "217,119,87" },
  { id: "gpt",    name: "GPT",      sub: "OpenAI-стиль",     color: "#10a37f", rgb: "16,163,127" },
  { id: "gemini", name: "Gemini",   sub: "Google-стиль",     color: "#4285f4", rgb: "66,133,244" },
  { id: "grok",   name: "Grok",     sub: "xAI-стиль",        color: "#94a3b8", rgb: "148,163,184" },
];

interface Msg { role: "user" | "assistant"; content: string; }

export function ApexChatWidget() {
  const [open, setOpen] = useState(false);
  const [model, setModel] = useState(MODELS[0]);
  const [modelOpen, setModelOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 200); }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const history = messages.slice(-12);
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setBusy(true);

    // add empty assistant message we stream into
    setMessages(m => [...m, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          persona: `Ты — Apex AI, дружелюбный русскоязычный бизнес-ассистент${model.id !== "apex" ? ` (стиль ${model.name})` : ""}. Отвечай кратко, ясно и по делу.`,
          history: history.map(h => ({ role: h.role, content: h.content })),
        }),
      });

      if (!res.ok || !res.body) {
        const errText = res.status === 503 ? "AI недоступен: не настроен API-ключ." : "Ошибка сервера. Попробуйте позже.";
        setMessages(m => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: errText }; return c; });
        setBusy(false);
        return;
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
          const m = line.match(/^data: (.*)$/m);
          if (!m) continue;
          try {
            const ev = JSON.parse(m[1]);
            if (ev.type === "token") {
              setMessages(cur => {
                const c = [...cur];
                c[c.length - 1] = { role: "assistant", content: c[c.length - 1].content + ev.token };
                return c;
              });
            } else if (ev.type === "error") {
              setMessages(cur => {
                const c = [...cur];
                c[c.length - 1] = { role: "assistant", content: "Ошибка: " + ev.message };
                return c;
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch {
      setMessages(m => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: "Не удалось связаться с ассистентом." }; return c; });
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Открыть Apex AI чат"
        style={{
          position: "fixed", right: 24, bottom: 24, zIndex: 60,
          width: 58, height: 58, borderRadius: 18, cursor: "pointer", border: "none",
          background: "linear-gradient(135deg,#6366f1,#4f46e5)",
          boxShadow: "0 10px 30px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.06)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" width="22" height="22"><path d="M18 6 6 18M6 6l12 12"/></svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="24" height="24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: "fixed", right: 24, bottom: 92, zIndex: 60,
          width: "min(400px, calc(100vw - 32px))", height: "min(600px, calc(100vh - 140px))",
          borderRadius: 22, overflow: "hidden", display: "flex", flexDirection: "column",
          background: "rgba(10,11,18,0.96)", backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 24px 70px rgba(0,0,0,0.6)",
          animation: "apex-chat-in 0.3s cubic-bezier(0.22,1,0.36,1)",
        }}>
          <style>{`
            @keyframes apex-chat-in { from{opacity:0;transform:translateY(16px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
            @keyframes apex-dot { 0%,80%,100%{transform:scale(0.5);opacity:0.4} 40%{transform:scale(1);opacity:1} }
            .apex-scroll::-webkit-scrollbar{width:6px}
            .apex-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:3px}
          `}</style>

          {/* Header */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" width="18" height="18">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Apex AI</div>
                <div style={{ fontSize: 10, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", display: "block" }} />
                  Онлайн
                </div>
              </div>

              {/* Model selector */}
              <div style={{ position: "relative" }}>
                <button onClick={() => setModelOpen(o => !o)} style={{
                  display: "flex", alignItems: "center", gap: 6, height: 30, padding: "0 10px",
                  borderRadius: 9, cursor: "pointer",
                  background: `rgba(${model.rgb},0.12)`, border: `1px solid rgba(${model.rgb},0.3)`,
                  color: model.color, fontSize: 11, fontWeight: 700,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: model.color, display: "block" }} />
                  {model.name}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="11" height="11"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                {modelOpen && (
                  <div style={{
                    position: "absolute", top: 36, right: 0, width: 180, zIndex: 5,
                    background: "#12131c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
                    boxShadow: "0 16px 40px rgba(0,0,0,0.6)", overflow: "hidden", padding: 4,
                  }}>
                    {MODELS.map(m => (
                      <button key={m.id} onClick={() => { setModel(m); setModelOpen(false); }} style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 10px",
                        borderRadius: 8, cursor: "pointer", border: "none", textAlign: "left",
                        background: model.id === m.id ? `rgba(${m.rgb},0.12)` : "transparent",
                      }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>
                          <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{m.name}</span>
                          <span style={{ display: "block", fontSize: 9.5, color: "rgba(255,255,255,0.35)" }}>{m.sub}</span>
                        </span>
                        {model.id === m.id && <svg viewBox="0 0 24 24" fill="none" stroke={m.color} strokeWidth="3" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="apex-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.length === 0 && (
              <div style={{ margin: "auto", textAlign: "center", padding: "20px" }}>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 16, lineHeight: 1.6 }}>
                  Привет! Я <b style={{ color: "#a5b4fc" }}>Apex AI</b> — задайте вопрос о бизнесе, стратегии или идее.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {["Как проверить бизнес-идею?", "Составь план запуска стартапа", "Как посчитать unit-экономику?"].map(q => (
                    <button key={q} onClick={() => setInput(q)} style={{
                      padding: "9px 12px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.6)", fontSize: 12,
                    }}>{q}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "82%", padding: "10px 13px", borderRadius: 14, fontSize: 13, lineHeight: 1.6,
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                  ...(m.role === "user"
                    ? { background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", borderBottomRightRadius: 4 }
                    : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.07)", borderBottomLeftRadius: 4 }),
                }}>
                  {m.content || (busy && i === messages.length - 1 ? (
                    <span style={{ display: "inline-flex", gap: 4, padding: "2px 0" }}>
                      {[0,1,2].map(d => <span key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.5)", animation: `apex-dot 1.2s ${d * 0.2}s infinite` }} />)}
                    </span>
                  ) : "")}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder="Спросите что-нибудь…"
                rows={1}
                style={{
                  flex: 1, resize: "none", maxHeight: 100, minHeight: 42, padding: "11px 14px",
                  borderRadius: 12, background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 13,
                  outline: "none", fontFamily: "inherit", lineHeight: 1.5,
                }}
              />
              <button onClick={send} disabled={busy || !input.trim()} style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0, cursor: busy || !input.trim() ? "default" : "pointer",
                border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                background: busy || !input.trim() ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#6366f1,#4f46e5)",
                boxShadow: busy || !input.trim() ? "none" : "0 4px 14px rgba(99,102,241,0.4)",
                transition: "background 0.2s",
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={busy || !input.trim() ? "rgba(255,255,255,0.3)" : "#fff"} strokeWidth="2" width="18" height="18">
                  <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", textAlign: "center", marginTop: 7 }}>
              Apex AI может ошибаться · на базе Claude
            </div>
          </div>
        </div>
      )}
    </>
  );
}
