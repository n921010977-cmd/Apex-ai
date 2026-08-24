"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot, Ticket, Activity, Mail, Send, ChevronDown,
  Plus, X, CheckCircle, Loader2, Sparkles,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

// ─── DATA ─────────────────────────────────────────────────────────────────────

const FAQS = [
  { q: "How does the AI Executive Board work?", a: "20 AI agents (CEO, CFO, CMO, CTO, COO and specialists from their departments) analyze your business from different angles. Each agent specializes in its own area and gives concrete, actionable recommendations tailored to your market." },
  { q: "How many projects can I create?", a: "On the Starter plan — up to 3 projects at a time. On the Pro plan — unlimited." },
  { q: "How long does AI analysis take?", a: "A standard analysis takes 2–5 minutes. A deep analysis with financial models and market research — up to 10–15 minutes." },
  { q: "Can I train the AI on my business?", a: "Yes. In Settings → AI Assistant, set personal instructions: industry, priorities, and communication style. The AI takes them into account in every session." },
  { q: "Can I export reports?", a: "All reports can be downloaded as PDF from each report's page." },
];

const SERVICES = [
  { name: "API", status: "ok" },
  { name: "AI Agents", status: "ok" },
  { name: "Report Generation", status: "ok" },
  { name: "Authentication", status: "ok" },
];

const AI_SUGGESTIONS = ["How do I create a project?", "How does the AI board work?", "How do I export a report?"];

const STATUS_RU: Record<string, { label: string; color: string; bg: string }> = {
  open:        { label: "Open",     color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
  in_progress: { label: "In Progress", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  resolved:    { label: "Resolved", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  closed:      { label: "Closed",   color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
};

interface TicketRow {
  id: string;
  subject: string;
  status: string;
  priority: string;
  ai_response?: string | null;
  created_at: string;
}

// ─── SHARED STYLES ─────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "10px 14px",
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12, color: "#E5E7EB",
  fontSize: 13, outline: "none",
  fontFamily: "inherit",
};

// ─── AI CHAT (реальный стриминг) ──────────────────────────────────────────────

function AIChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  const send = useCallback(async (text: string) => {
    const q = (text || input).trim();
    if (!q || typing) return;
    setInput("");
    setTyping(true);
    setMessages(prev => [...prev, { role: "user", text: q }, { role: "ai", text: "" }]);
    const put = (t: string) => setMessages(prev => {
      const next = [...prev];
      next[next.length - 1] = { role: "ai", text: t };
      return next;
    });
    const persona = "You are a Vertlix AI support agent (a platform with an AI team: 20 agents, strategies, reports, analytics, notepad). Reply in English, friendly and concise (3–5 sentences), with concrete steps. If the question is about billing — point to Settings. If it's a technical issue that can't be resolved — suggest creating a ticket on this page.";
    let acc = "";
    try {
      const res = await fetch("/api/chat/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, agentId: "support", persona, history: [] }),
      });
      if (!res.ok || !res.body) throw new Error("offline");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          try {
            const ev = JSON.parse(line.slice(5).trim());
            if (ev.type === "token") { acc += ev.token; put(acc); }
          } catch { /* ignore */ }
        }
      }
    } catch { /* fallback below */ }
    if (!acc.trim()) {
      put("I'm ready to help! Describe your question in more detail — or create a ticket on the right, and the team will reply by email. (Live AI answers turn on once ANTHROPIC_API_KEY is configured.)");
    }
    setTyping(false);
  }, [input, typing]);

  return (
    <div style={{ ...card, display: "flex", flexDirection: "column", height: 420 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Bot size={15} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>AI Assistant</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#10b981" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981" }} />online · replies instantly
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ margin: "auto", textAlign: "center" }}>
            <Sparkles size={22} style={{ color: "rgba(99,102,241,0.6)", marginBottom: 10 }} />
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 14 }}>Ask a question — I'll answer right away</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
              {AI_SUGGESTIONS.map(s => (
                <button key={s} onClick={() => void send(s)}
                  style={{ padding: "7px 12px", borderRadius: 999, fontSize: 11.5, cursor: "pointer", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "82%", padding: "9px 13px", borderRadius: 13, fontSize: 12.5, lineHeight: 1.6, whiteSpace: "pre-wrap",
              background: m.role === "user" ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "rgba(255,255,255,0.05)",
              border: m.role === "user" ? "none" : "1px solid rgba(255,255,255,0.07)",
              color: m.role === "user" ? "#fff" : "rgba(255,255,255,0.82)",
            }}>
              {m.text || (typing && i === messages.length - 1 ? "…" : "")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: 8, padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") void send(""); }}
          placeholder="Your question…"
          disabled={typing}
          style={{ ...inputStyle, flex: 1 }}
          spellCheck={false}
        />
        <button onClick={() => void send("")} disabled={typing || !input.trim()}
          style={{ width: 42, height: 40, borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", opacity: typing || !input.trim() ? 0.5 : 1 }}>
          {typing ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={14} />}
        </button>
      </div>
    </div>
  );
}

// ─── TICKET MODAL (реальный POST) ─────────────────────────────────────────────

function TicketModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [subject, setSubject] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ ai?: string | null } | null>(null);

  const submit = async () => {
    if (!subject.trim() || !desc.trim()) { setError("Fill in the subject and description"); return; }
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, description: desc, category, priority }),
      });
      const d = await r.json();
      if (d.success) { setResult({ ai: d.data?.ai_response }); onCreated(); }
      else setError(d.error || "Could not create ticket");
    } catch { setError("Network error — please try again"); }
    finally { setLoading(false); }
  };

  const selStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(5,6,10,0.72)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }} transition={{ duration: 0.24, ease: EASE }}
        onClick={e => e.stopPropagation()}
        style={{ width: "min(560px, 100%)", maxHeight: "86vh", overflowY: "auto", borderRadius: 20, padding: 24, background: "#0a0c15", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)", position: "relative" }}>
        <button onClick={onClose} aria-label="Close"
          style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>
          <X size={15} />
        </button>

        {result ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <CheckCircle size={20} style={{ color: "#10b981" }} />
              <div style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>Ticket Created</div>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: "0 0 14px" }}>
              We've received your request and will get back to you. You can track its status in the "My Tickets" list.
            </p>
            {result.ai && (
              <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.2)", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#a5b4fc", marginBottom: 8 }}>
                  <Bot size={12} /> Instant AI Reply
                </div>
                <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.75)", lineHeight: 1.65, margin: 0, whiteSpace: "pre-wrap" }}>{result.ai}</p>
              </div>
            )}
            <button onClick={onClose}
              style={{ padding: "10px 18px", borderRadius: 11, fontSize: 12.5, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff", cursor: "pointer" }}>
              Done
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Create Ticket</div>
            <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.45)", margin: "0 0 18px" }}>Describe the issue — AI will give an instant reply, and the team will follow up.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Ticket subject" style={inputStyle} spellCheck={false} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <select value={category} onChange={e => setCategory(e.target.value)} style={selStyle}>
                  <option value="general">General question</option>
                  <option value="technical">Technical issue</option>
                  <option value="billing">Billing</option>
                  <option value="feature">Feature request</option>
                  <option value="bug">Bug</option>
                </select>
                <select value={priority} onChange={e => setPriority(e.target.value)} style={selStyle}>
                  <option value="low">Low priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="high">High priority</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe in detail: what you did, what you expected, what happened…" rows={5}
                style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }} />
              {error && <div style={{ fontSize: 12, color: "#f87171" }}>{error}</div>}
              <button onClick={() => void submit()} disabled={loading}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 0", borderRadius: 12, fontSize: 13, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff", cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
                {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={14} />}
                {loading ? "Sending…" : "Send Ticket"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const [showTicket, setShowTicket] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  const loadTickets = useCallback(() => {
    setTicketsLoading(true);
    fetch("/api/support/tickets?limit=5")
      .then(r => r.json())
      .then(d => { if (d.success) setTickets(d.data ?? []); })
      .catch(() => {})
      .finally(() => setTicketsLoading(false));
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  return (
    <div style={{ minHeight: "100vh", background: "#05060A", padding: "36px 24px 72px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} style={{ marginBottom: 26 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em", color: "#F3F4F6", margin: "0 0 8px" }}>Support</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: 0, maxWidth: 560, lineHeight: 1.6 }}>
            AI replies instantly. If you need a human — create a ticket, and we'll get back to you with a solution.
          </p>
        </motion.div>

        {/* Main grid: chat + tickets/status */}
        <div className="sup-grid" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, marginBottom: 28 }}>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.08 }}>
            <AIChat />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.14 }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Мои тикеты */}
            <div style={{ ...card, padding: 16, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#fff" }}>
                  <Ticket size={14} style={{ color: "#818cf8" }} /> My Tickets
                </div>
                <button onClick={() => setShowTicket(true)}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 9, fontSize: 11, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff", cursor: "pointer" }}>
                  <Plus size={11} /> Create
                </button>
              </div>

              {ticketsLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "18px 0", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                  <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Loading…
                </div>
              ) : tickets.length === 0 ? (
                <div style={{ padding: "16px 0", fontSize: 12.5, color: "rgba(255,255,255,0.38)", lineHeight: 1.6 }}>
                  No tickets yet. If something isn't working — create a ticket, and AI will respond instantly.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {tickets.map(t => {
                    const st = STATUS_RU[t.status] ?? STATUS_RU.open;
                    return (
                      <div key={t.id} style={{ padding: "10px 12px", borderRadius: 11, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.subject}</span>
                          <span style={{ flexShrink: 0, fontSize: 9.5, fontWeight: 700, padding: "2px 8px", borderRadius: 6, color: st.color, background: st.bg }}>{st.label}</span>
                        </div>
                        <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)" }}>
                          {new Date(t.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                          {t.ai_response ? " · AI already replied" : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Статус системы */}
            <div style={{ ...card, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
                <Activity size={14} style={{ color: "#10b981" }} /> System Status
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {SERVICES.map(s => (
                  <div key={s.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{s.name}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#10b981" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
                      operational
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Написать нам */}
            <a href="mailto:support@apex-ai.app"
              style={{ ...card, padding: "13px 16px", display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "rgba(255,255,255,0.65)", fontSize: 12.5, fontWeight: 600 }}>
              <Mail size={14} style={{ color: "#818cf8" }} /> support@apex-ai.app
            </a>
          </motion.div>
        </div>

        {/* FAQ */}
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.5, ease: EASE }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em", color: "#E5E7EB", margin: "0 0 14px" }}>Frequently Asked Questions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={i} style={{ ...card, overflow: "hidden" }}>
                  <button onClick={() => setOpenFaq(open ? null : i)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                    <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: open ? "#fff" : "rgba(255,255,255,0.75)" }}>{f.q}</span>
                    <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} style={{ color: "rgba(255,255,255,0.35)", display: "flex" }}>
                      <ChevronDown size={15} />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: EASE }} style={{ overflow: "hidden" }}>
                        <p style={{ padding: "0 18px 16px", margin: 0, fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.55)", maxWidth: "68ch" }}>{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showTicket && <TicketModal onClose={() => setShowTicket(false)} onCreated={loadTickets} />}
      </AnimatePresence>

      <style>{`
        @media (max-width: 860px) { .sup-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
