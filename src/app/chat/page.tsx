"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

// ─── Models (all routed to Claude backend for now; real keys added later) ─────
const MODELS = [
  { id: "vertlix",   name: "Vertlix AI",  sub: "Основная",   color: "#6366f1", rgb: "99,102,241" },
  { id: "claude", name: "Claude",   sub: "Anthropic",  color: "#d97757", rgb: "217,119,87" },
  { id: "gpt",    name: "GPT",      sub: "OpenAI",     color: "#10a37f", rgb: "16,163,127" },
  { id: "gemini", name: "Gemini",   sub: "Google",     color: "#4285f4", rgb: "66,133,244" },
  { id: "grok",   name: "Grok",     sub: "xAI",        color: "#94a3b8", rgb: "148,163,184" },
];

const SUGGESTIONS = [
  { t: "Проверь мою бизнес-идею", s: "Задай уточняющие вопросы и оцени потенциал", icon: "M9 11l3 3L22 4" },
  { t: "План запуска стартапа", s: "Пошаговый план на первые 90 дней", icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
  { t: "Посчитай unit-экономику", s: "LTV, CAC и точка безубыточности", icon: "M3 3v18h18M18 9l-5 5-3-3-4 4" },
  { t: "Стратегия маркетинга", s: "Каналы привлечения для раннего этапа", icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
];

interface Attach { data: string; mediaType: string; preview: string; }
interface Msg { role: "user" | "assistant"; content: string; image?: string; }

export default function ChatPage() {
  const [model, setModel] = useState(MODELS[0]);
  const [modelOpen, setModelOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [research, setResearch] = useState(false);
  const [attach, setAttach] = useState<Attach | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, busy]);
  useEffect(() => {
    inputRef.current?.focus();
    const agent = new URLSearchParams(window.location.search).get("agent");
    if (agent) setMessages([{ role: "assistant", content: `Здравствуйте! Я ваш ${agent} из совета Vertlix AI. Расскажите о задаче или идее — помогу разобраться.` }]);
  }, []);

  const pickImage = () => fileRef.current?.click();
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Изображение до 5 МБ"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const data = url.split(",")[1] ?? "";
      setAttach({ data, mediaType: file.type, preview: url });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const send = async (preset?: string) => {
    const text = (preset ?? input).trim();
    if ((!text && !attach) || busy) return;
    setInput("");
    const img = attach;
    setAttach(null);
    const history = messages.slice(-12);
    setMessages(m => [...m, { role: "user", content: text, image: img?.preview }, { role: "assistant", content: "" }]);
    setBusy(true);

    const persona = research
      ? `Ты — Vertlix AI в режиме «Глубокое исследование». Дай развёрнутый, структурированный ответ с разделами, фактами, цифрами, плюсами/минусами и конкретными рекомендациями. Пиши по-русски.`
      : `Ты — Vertlix AI, дружелюбный русскоязычный бизнес-ассистент${model.id !== "vertlix" ? ` (стиль ${model.name})` : ""}. Отвечай ясно, структурно и по делу.`;

    try {
      const res = await fetch("/api/chat/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text || (img ? "Проанализируй это изображение." : ""),
          persona,
          history: history.map(h => ({ role: h.role, content: h.content })),
          ...(img ? { image: { data: img.data, mediaType: img.mediaType } } : {}),
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
            if (ev.type === "token") setMessages(cur => { const c = [...cur]; c[c.length - 1] = { role: "assistant", content: c[c.length - 1].content + ev.token }; return c; });
            else if (ev.type === "error") setMessages(cur => { const c = [...cur]; c[c.length - 1] = { role: "assistant", content: "Ошибка: " + ev.message }; return c; });
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
    <div style={{ minHeight: "100vh", background: "#05060A", display: "flex", flexDirection: "column", color: "#fff", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes chat-dot { 0%,80%,100%{transform:scale(0.5);opacity:0.4} 40%{transform:scale(1);opacity:1} }
        @keyframes chat-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes chat-orb { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-20px) scale(1.1)} }
        @keyframes chat-pop { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
        .chat-scroll::-webkit-scrollbar{width:10px}
        .chat-scroll::-webkit-scrollbar-track{background:transparent}
        .chat-scroll::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.25);border-radius:6px;border:3px solid transparent;background-clip:content-box}
        .chat-scroll:hover::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.45);background-clip:content-box}
        .chat-scroll{scrollbar-width:thin;scrollbar-color:rgba(99,102,241,0.35) transparent}
        textarea::-webkit-scrollbar{width:6px}
        textarea::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:3px}
      `}</style>

      {/* Ambient animated background */}
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", left: "20%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.10), transparent 70%)", filter: "blur(40px)", animation: "chat-orb 14s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "10%", width: 460, height: 460, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%)", filter: "blur(40px)", animation: "chat-orb 18s ease-in-out infinite reverse" }} />
      </div>

      {/* Top bar */}
      <header style={{ height: 58, flexShrink: 0, display: "flex", alignItems: "center", gap: 12, padding: "0 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(5,6,10,0.8)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 10 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(99,102,241,0.4)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" width="16" height="16"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>Vertlix AI</span>
        </Link>

        <div style={{ position: "relative", marginLeft: 4 }}>
          <button onClick={() => setModelOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 12px", borderRadius: 10, cursor: "pointer", background: `rgba(${model.rgb},0.12)`, border: `1px solid rgba(${model.rgb},0.3)`, color: model.color, fontSize: 12, fontWeight: 700 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: model.color, display: "block" }} />
            {model.name}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          {modelOpen && (
            <div style={{ position: "absolute", top: 38, left: 0, width: 190, zIndex: 20, background: "#12131c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, boxShadow: "0 16px 40px rgba(0,0,0,0.6)", padding: 4, animation: "chat-pop 0.18s" }}>
              {MODELS.map(m => (
                <button key={m.id} onClick={() => { setModel(m); setModelOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 8, cursor: "pointer", border: "none", textAlign: "left", background: model.id === m.id ? `rgba(${m.rgb},0.12)` : "transparent" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{m.name}</span>
                    <span style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{m.sub}</span>
                  </span>
                  {(m.id === "gpt" || m.id === "gemini" || m.id === "grok") && (
                    <span style={{ fontSize: 8.5, fontWeight: 700, padding: "2px 6px", borderRadius: 20, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", letterSpacing: "0.04em" }}>СКОРО</span>
                  )}
                  {model.id === m.id && <svg viewBox="0 0 24 24" fill="none" stroke={m.color} strokeWidth="3" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} style={{ height: 32, padding: "0 12px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>Новый чат</button>
          )}
          <Link href="/dashboard" style={{ height: 32, padding: "0 14px", borderRadius: 10, display: "flex", alignItems: "center", fontSize: 12, fontWeight: 700, background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", textDecoration: "none" }}>Дашборд</Link>
        </div>
      </header>

      {/* Conversation */}
      <div ref={scrollRef} className="chat-scroll" style={{ flex: 1, overflowY: "auto", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 780, margin: "0 auto", padding: empty ? "0 20px" : "28px 20px 40px", minHeight: "100%", display: empty ? "flex" : "block", alignItems: "center", justifyContent: "center" }}>
          {empty ? (
            <div style={{ textAlign: "center", width: "100%", animation: "chat-in 0.5s" }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, margin: "0 auto 20px", background: "linear-gradient(135deg,#6366f1,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 34px rgba(99,102,241,0.5)", animation: "chat-orb 6s ease-in-out infinite" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="28" height="28"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <h1 style={{ fontSize: 27, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.02em" }}>Чем помочь?</h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: "0 0 28px" }}>Vertlix AI — ваш бизнес-ассистент. Спросите о стратегии, финансах или прикрепите изображение.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 10, maxWidth: 540, margin: "0 auto" }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={s.t} onClick={() => send(s.t + ". " + s.s)} style={{
                    display: "flex", alignItems: "center", gap: 11, padding: "14px 16px", borderRadius: 14, cursor: "pointer", textAlign: "left",
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", transition: "all 0.18s",
                    animation: `chat-in 0.5s ${0.1 + i * 0.07}s both`,
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.07)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d={s.icon}/></svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 2 }}>{s.t}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{s.s}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: "flex", gap: 12, animation: "chat-in 0.35s", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: m.role === "user" ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#6366f1,#4f46e5)", fontSize: 12, fontWeight: 700 }}>
                    {m.role === "user" ? "Вы" : <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" width="15" height="15"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
                  </div>
                  <div style={{ maxWidth: "84%", display: "flex", flexDirection: "column", gap: 8, alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                    {m.image && <img src={m.image} alt="" style={{ maxWidth: 220, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)" }} />}
                    {(m.content || (busy && i === messages.length - 1)) && (
                      <div style={{ padding: "11px 15px", borderRadius: 16, fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word",
                        ...(m.role === "user"
                          ? { background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", borderTopRightRadius: 4 }
                          : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.88)", border: "1px solid rgba(255,255,255,0.07)", borderTopLeftRadius: 4 }) }}>
                        {m.content || <span style={{ display: "inline-flex", gap: 4 }}>{[0,1,2].map(d => <span key={d} style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.5)", animation: `chat-dot 1.2s ${d * 0.2}s infinite` }} />)}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Input bar */}
      <div style={{ flexShrink: 0, padding: "12px 20px 18px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,6,10,0.8)", backdropFilter: "blur(20px)", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          {/* Attach preview */}
          {attach && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "6px 10px 6px 6px", borderRadius: 10, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", animation: "chat-pop 0.2s" }}>
              <img src={attach.preview} alt="" style={{ width: 34, height: 34, borderRadius: 7, objectFit: "cover" }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Изображение прикреплено</span>
              <button onClick={() => setAttach(null)} style={{ width: 20, height: 20, borderRadius: 6, border: "none", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 12 }}>×</button>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", padding: 8, borderRadius: 18, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {/* Attach image */}
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={onFile} style={{ display: "none" }} />
            <button onClick={pickImage} title="Прикрепить изображение" style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#818cf8")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            </button>
            {/* Research toggle */}
            <button onClick={() => setResearch(r => !r)} title="Режим глубокого исследования" style={{ height: 40, padding: "0 12px", borderRadius: 12, flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, transition: "all 0.15s",
              background: research ? "rgba(99,102,241,0.16)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${research ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.1)"}`,
              color: research ? "#a5b4fc" : "rgba(255,255,255,0.55)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Исследование
            </button>

            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey} placeholder="Спросите Vertlix AI…" rows={1} maxLength={1000}
              style={{ flex: 1, resize: "none", maxHeight: 160, minHeight: 40, padding: "10px 12px", background: "transparent", border: "none", color: "#fff", fontSize: 14, outline: "none", fontFamily: "inherit", lineHeight: 1.5 }} />

            <button onClick={() => send()} disabled={busy || (!input.trim() && !attach)} style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, border: "none", cursor: busy || (!input.trim() && !attach) ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              background: busy || (!input.trim() && !attach) ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#6366f1,#4f46e5)",
              boxShadow: busy || (!input.trim() && !attach) ? "none" : "0 4px 14px rgba(99,102,241,0.4)", transition: "background 0.2s" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={busy || (!input.trim() && !attach) ? "rgba(255,255,255,0.3)" : "#fff"} strokeWidth="2" width="19" height="19"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </button>
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textAlign: "center", marginTop: 8 }}>
            {research ? "Режим исследования включён · " : ""}Vertlix AI может ошибаться · на базе Claude
          </div>
        </div>
      </div>
    </div>
  );
}
