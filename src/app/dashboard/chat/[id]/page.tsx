"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { TEAM, TEAM_BY_SLUG, reportsOf } from "@/lib/team";
import { saveAsk } from "@/lib/ask-history";

// участник обсуждения (сотрудник команды директора или сам директор)
interface Speaker {
  slug?: string;
  name: string;
  role: string;
  color: string;
  ab: string;
  verdict?: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  speaker?: Speaker;
  metadata?: { tools?: { tool: string; input: unknown; result: unknown }[] };
}

interface ToolCall {
  tool: string;
  input: unknown;
  result: unknown;
}

const TOOL_ICONS: Record<string, string> = {
  create_task: "✅",
  search_web: "🌐",
  generate_report: "📄",
  get_project_data: "📊",
  calculate_metrics: "🧮",
};

function MarkdownText({ text }: { text: string }) {
  // Simple markdown: **bold**, *italic*, `code`, ```blocks```, # headers, - lists
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} className="bg-white/[0.04] border border-white/[0.08] rounded-lg p-3 text-xs font-mono text-white/80 overflow-x-auto my-2">
          {codeLines.join("\n")}
        </pre>
      );
      i++;
      continue;
    }

    // Header
    if (line.startsWith("### ")) { elements.push(<h3 key={i} className="text-sm font-bold text-white mt-3 mb-1">{line.slice(4)}</h3>); i++; continue; }
    if (line.startsWith("## ")) { elements.push(<h2 key={i} className="text-base font-bold text-white mt-4 mb-1.5">{line.slice(3)}</h2>); i++; continue; }
    if (line.startsWith("# ")) { elements.push(<h1 key={i} className="text-lg font-bold text-white mt-4 mb-2">{line.slice(2)}</h1>); i++; continue; }

    // List item
    if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <div key={i} className="flex gap-2 my-0.5">
          <span className="text-violet-400 mt-0.5 flex-shrink-0">•</span>
          <span className="text-sm text-white/80">{formatInline(line.slice(2))}</span>
        </div>
      );
      i++; continue;
    }

    // Numbered list
    if (/^\d+\. /.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1];
      elements.push(
        <div key={i} className="flex gap-2 my-0.5">
          <span className="text-violet-400 font-mono text-xs mt-0.5 flex-shrink-0 w-5">{num}.</span>
          <span className="text-sm text-white/80">{formatInline(line.replace(/^\d+\.\s/, ""))}</span>
        </div>
      );
      i++; continue;
    }

    // Empty line
    if (line.trim() === "") { elements.push(<div key={i} className="h-2" />); i++; continue; }

    // Paragraph
    elements.push(<p key={i} className="text-sm text-white/80 leading-relaxed">{formatInline(line)}</p>);
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={i} className="italic text-white/70">{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i} className="bg-white/[0.06] px-1.5 py-0.5 rounded text-xs font-mono text-violet-300">{part.slice(1, -1)}</code>;
    return part;
  });
}

const AGENT_NAMES: Record<string, string> = {
  ceo: "CEO — Strategist",
  cfo: "CFO — Finance",
  cmo: "CMO — Marketing",
  coo: "COO — Operations",
  analyst: "Business Analyst",
  general: "AI Assistant",
};

// Профиль агента, переданный со страницы «AI Агенты» или собранный из TEAM (директора)
interface AgentProfile {
  id: string; name: string; role: string; emoji?: string; color?: string; ab?: string;
  prompt?: string; model?: string; dept?: string; description?: string;
  speed?: string; rating?: number; tools?: string[];
  team?: { slug: string; name: string; role: string; title: string; color: string; ab: string }[];
}

const SPEED_RU: Record<string, string> = { fast: "Fast", medium: "Medium", slow: "Slow" };

// Follow-up suggestions per C-level role (matched by TEAM slug) and per
// department (fallback for specialists loaded from the Agent Studio, who
// don't carry a slug from TEAM). Without this every agent — CFO, CMO, COO,
// CTO, CEO — showed the exact same three generic prompts.
const ROLE_SUGGESTIONS: Record<string, string[]> = {
  ceo: [
    "What's our biggest strategic risk right now?",
    "How should we prioritize this quarter?",
    "Draft a 90-day roadmap",
  ],
  cfo: [
    "Calculate our burn rate and runway",
    "What's our LTV to CAC ratio?",
    "Where can we cut costs without hurting growth?",
  ],
  cmo: [
    "Which acquisition channel should we double down on?",
    "Draft a go-to-market plan",
    "How do we improve conversion rate?",
  ],
  coo: [
    "Where are the bottlenecks in our process?",
    "What KPIs should we track weekly?",
    "Draft a hiring plan for next quarter",
  ],
  cto: [
    "What's our biggest technical risk?",
    "Should we rebuild or refactor this system?",
    "Draft a 90-day engineering roadmap",
  ],
};

const DEPT_SUGGESTIONS: Record<string, string[]> = {
  finance:    ROLE_SUGGESTIONS.cfo,
  marketing:  ROLE_SUGGESTIONS.cmo,
  operations: ROLE_SUGGESTIONS.coo,
  tech:       ROLE_SUGGESTIONS.cto,
  leadership: ROLE_SUGGESTIONS.ceo,
  product: [
    "What should the next release focus on?",
    "Draft a product roadmap for this quarter",
    "What's the biggest friction point for users?",
  ],
  sales: [
    "Draft a sales pitch for this product",
    "What objections should we prepare for?",
    "How do we shorten the sales cycle?",
  ],
};

const DEFAULT_SUGGESTIONS = [
  "Give me 3 concrete recommendations",
  "What metrics should I track?",
  "Draft a 30-day plan",
];

function suggestionsFor(agent: AgentProfile | null): string[] {
  if (!agent) return [];
  const specific = ROLE_SUGGESTIONS[agent.id] ?? (agent.dept ? DEPT_SUGGESTIONS[agent.dept] : undefined) ?? DEFAULT_SUGGESTIONS;
  return [`Quick analysis for: ${agent.role}`, ...specific];
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = params.id as string;
  const agentId = searchParams.get("agent") ?? undefined;
  const isLocal = conversationId.startsWith("local-");

  // Профиль агента: директора собираем из TEAM (имя, титул, цвет + команда),
  // остальных — из localStorage (передан со страницы «AI Агенты»)
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  useEffect(() => {
    if (!agentId) return;
    const tm = TEAM_BY_SLUG[agentId];
    if (tm && tm.tier === "c-level") {
      // CEO совещается со всеми агентами компании, директор — со всеми своими
      const team = tm.slug === "ceo"
        ? TEAM.filter(x => x.slug !== "ceo")
        : reportsOf(tm.slug);
      setAgent({
        id: tm.slug, name: tm.name, role: `${tm.role} · ${tm.title}`, color: tm.c, ab: tm.ab,
        description: tm.slug === "ceo"
          ? `CEO. Your question will be discussed by all ${team.length} agents in the company, after which ${tm.name} will deliver the final verdict.`
          : `${tm.title}. Your question will be discussed by a team of ${team.length} agents, after which ${tm.name} will deliver the final verdict.`,
        team: team.map(t => ({ slug: t.slug, name: t.name, role: t.role, title: t.title, color: t.c, ab: t.ab })),
      });
      return;
    }
    try {
      const raw = localStorage.getItem("apex-chat-agent");
      if (raw) {
        const p: AgentProfile = JSON.parse(raw);
        if (p.id === agentId) setAgent(p);
      }
    } catch { /* ignore */ }
  }, [agentId]);

  const agentColor = agent?.color ?? "#D946EF";
  const persona = agent
    ? `${agent.prompt ?? `You are ${agent.name}, ${agent.role}.`}\n\nYour role: ${agent.role}. Reply in English, professionally, in character for your role, concretely and to the point.`
    : undefined;

  // единый аватар ассистента: эмодзи агента в его цвете, иначе — звезда Vertlix
  const assistantAvatar = (
    <div className="size-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-sm"
      style={agent
        ? { background: `linear-gradient(135deg, ${agentColor}e6, ${agentColor}99)`, boxShadow: `0 4px 12px ${agentColor}33` }
        : { background: "linear-gradient(135deg, #7c3aed, #2563eb)", boxShadow: "0 4px 12px rgba(217,70,239,0.2)" }}>
      {agent?.emoji ?? (
        <svg className="size-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      )}
    </div>
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<{ stop(): void } | null>(null);

  type AnySpeechRecognition = {
    lang: string; continuous: boolean; interimResults: boolean;
    onresult: ((e: { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null;
    onend: (() => void) | null;
    onerror: (() => void) | null;
    start(): void; stop(): void;
  };

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    setVoiceSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  const toggleVoice = useCallback(() => {
    const w = window as unknown as Record<string, { new(): AnySpeechRecognition }>;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return;

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = true;

    const baseText = input;

    rec.onresult = (e) => {
      let final = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      const spoken = final || interim;
      setInput(baseText + (baseText && spoken ? " " : "") + spoken);
    };

    rec.onend = () => { setIsRecording(false); inputRef.current?.focus(); };
    rec.onerror = () => { setIsRecording(false); };

    recognitionRef.current = rec as unknown as { stop(): void };
    rec.start();
    setIsRecording(true);
  }, [isRecording, input]);

  // Load messages from DB (only for real conversations)
  useEffect(() => {
    if (isLocal) return;
    fetch(`/api/chat/${conversationId}/messages`)
      .then(r => r.json())
      .then(d => { if (d.messages) setMessages(d.messages); })
      .catch(() => {});
  }, [conversationId, isLocal]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // стримим реплику одного участника в отдельное сообщение с его подписью
  const streamSpeaker = useCallback(async (question: string, personaText: string, speaker: Speaker): Promise<string> => {
    const id = `sp-${Date.now()}-${speaker.ab}`;
    setMessages(prev => [...prev, { id, role: "assistant", content: "", created_at: new Date().toISOString(), speaker }]);
    let acc = "";
    const put = (text: string) => setMessages(prev => prev.map(m => m.id === id ? { ...m, content: text } : m));
    try {
      const res = await fetch("/api/chat/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, agentId: speaker.slug ?? agentId, persona: personaText.slice(0, 4000), history: [] }),
      });
      if (!res.ok || !res.body) throw new Error("offline");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === "token") { acc += evt.token; put(acc); }
          } catch { /* ignore */ }
        }
      }
    } catch { /* fallthrough to fallback */ }
    if (!acc.trim()) {
      acc = `From my side (${speaker.role}): more input is needed, but the direction is workable. Live discussion turns on once ANTHROPIC_API_KEY is configured.`;
      put(acc);
    }
    return acc;
  }, [agentId]);

  // «совещание»: агенты высказываются по очереди, руководитель выносит вердикт.
  // Для больших совещаний (CEO со всеми 20) — короткие реплики и сжатый контекст.
  const runBoard = useCallback(async (question: string) => {
    if (!agent?.team?.length) return;
    const big = agent.team.length > 6;
    const opinions: { name: string; title: string; text: string; color: string }[] = [];
    for (const m of agent.team) {
      const prev = opinions.slice(-5).map(o => `${o.name} (${o.title}): ${o.text.slice(0, big ? 200 : 400)}`).join("\n\n");
      const persona = `You are ${m.name}, ${m.title} at Vertlix AI, on ${agent.name}'s team (${agent.role}). The lead has convened ${big ? "a company-wide meeting" : "the team"} to discuss the founder's question.${prev ? `\n\nColleagues' latest remarks:\n${prev}\n\nAdd a new angle or push back with reasoning, don't repeat.` : "\nYou speak first."}\nGive your opinion strictly from your own area: ${big ? "1–2 sentences, only what matters most" : "2–4 sentences, specifics and numbers where relevant"}, in English, plain text without markdown.`;
      const text = await streamSpeaker(question, persona, { slug: m.slug, name: m.name, role: m.title, color: m.color, ab: m.ab });
      opinions.push({ name: m.name, title: m.title, text, color: m.color });
      await new Promise(r => setTimeout(r, big ? 120 : 250));
    }
    const verdictPersona = `You are ${agent.name}, ${agent.role} at Vertlix AI. ${big ? "The whole company" : "Your team"} has discussed the founder's question:\n\n${opinions.map(o => `${o.name} (${o.title}): ${o.text.slice(0, big ? 140 : 400)}`).join("\n\n")}\n\nAs the lead, deliver the FINAL VERDICT: a short decision (1–2 sentences), then 3 concrete steps (1., 2., 3.). Take the team's opinions into account and reconcile them. In English, without markdown asterisks.`;
    const verdict = await streamSpeaker(question, verdictPersona, { slug: agent.id, name: agent.name, role: "Final Verdict", color: agentColor, ab: agent.ab ?? "AI", verdict: true });
    // Save the whole team meeting to История диалогов.
    saveAsk({ id: `chat-council-${Date.now()}`, kind: "council", question, date: Date.now(),
      responses: opinions.map(o => ({ role: o.title, name: o.name, text: o.text, color: o.color })),
      verdict });
  }, [agent, agentColor, streamSpeaker]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || sending) return;
    const userMessage = input.trim();
    setInput("");
    setSending(true);
    setStreamingContent("");
    setToolCalls([]);
    setActiveTools([]);

    // Add user message optimistically
    const tempId = `temp-${Date.now()}`;
    const currentMessages = [...messages, { id: tempId, role: "user" as const, content: userMessage, created_at: new Date().toISOString() }];
    setMessages(currentMessages);

    // Режим совещания: команда директора обсуждает и директор выносит вердикт
    if (agent?.team?.length) {
      try { await runBoard(userMessage); }
      finally { setSending(false); inputRef.current?.focus(); }
      return;
    }

    try {
      abortRef.current = new AbortController();

      // Local mode: call direct API (no Supabase auth needed), pass full history
      // DB mode: call chat send endpoint
      const endpoint = isLocal
        ? `/api/chat/direct`
        : `/api/chat/${conversationId}/send`;

      const body = isLocal
        ? JSON.stringify({
            message: userMessage,
            agentId,
            persona,
            history: messages.map(m => ({ role: m.role, content: m.content })),
          })
        : JSON.stringify({ message: userMessage });

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "Unknown error");
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let fullContent = "";
      let messageSaved = false;
      const currentToolCalls: ToolCall[] = [];

      const saveMessage = (content: string) => {
        if (messageSaved || !content.trim()) return;
        messageSaved = true;
        // Mirror the exchange into the unified История диалогов.
        if (agent && !content.startsWith("❌")) {
          saveAsk({ id: `chat-${Date.now()}`, kind: "agent", question: userMessage, date: Date.now(),
            agentSlug: agent.id, agentName: agent.name, agentRole: agent.role, color: agent.color, answer: content });
        }
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== tempId);
          return [...filtered, {
            id: `ai-${Date.now()}`,
            role: "assistant" as const,
            content,
            created_at: new Date().toISOString(),
            metadata: currentToolCalls.length > 0 ? { tools: currentToolCalls } : undefined,
          }];
        });
        setStreamingContent("");
        setToolCalls([]);
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === "token") {
              fullContent += evt.token;
              setStreamingContent(fullContent);
            }
            if (evt.type === "tool_call") {
              setActiveTools(prev => [...prev, evt.tool]);
              const tc = { tool: evt.tool, input: evt.input, result: evt.result };
              currentToolCalls.push(tc);
              setToolCalls([...currentToolCalls]);
              setActiveTools(prev => prev.filter(t => t !== evt.tool));
            }
            if (evt.type === "done" || evt.type === "complete") {
              saveMessage(fullContent);
            }
            if (evt.type === "error") {
              throw new Error(evt.message ?? "Stream error");
            }
          } catch (parseErr) {
            // ignore JSON parse errors on non-data lines
          }
        }
      }

      // Process remaining buffer after stream closes
      if (buf.startsWith("data: ")) {
        try {
          const evt = JSON.parse(buf.slice(6));
          if (evt.type === "token") fullContent += evt.token;
        } catch {}
      }

      // Fallback: stream closed without explicit done event
      saveMessage(fullContent);

    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        const errMsg = (e as Error).message ?? "Unknown error";
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== tempId);
          return [...filtered, {
            id: `err-${Date.now()}`,
            role: "assistant" as const,
            content: `❌ Error: ${errMsg}`,
            created_at: new Date().toISOString(),
          }];
        });
        setStreamingContent("");
      }
    } finally {
      setSending(false);
      setStreamingContent("");
      inputRef.current?.focus();
    }
  }, [input, sending, conversationId, persona, agent, runBoard]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const isStreaming = sending && streamingContent.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-white/[0.06] bg-[#05060A]/80 backdrop-blur-sm flex-shrink-0">
        <button
          onClick={() => router.push("/dashboard/agents")}
          title="Back to agents"
          className="size-7 rounded-lg hover:bg-white/[0.06] transition-colors flex items-center justify-center text-white/40 hover:text-white/70"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div className="size-8 rounded-lg flex items-center justify-center text-base"
          style={{ background: `linear-gradient(135deg, ${agentColor}2e, ${agentColor}12)`, border: `1px solid ${agentColor}45` }}>
          {agent?.emoji ?? (agent?.ab ? (
            <span className="text-[11px] font-bold" style={{ color: agentColor }}>{agent.ab}</span>
          ) : (
            <svg className="size-3.5" style={{ color: agentColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-white truncate">{agent?.name ?? (agentId ? (AGENT_NAMES[agentId] ?? "AI Assistant") : "AI Assistant")}</span>
            {agent?.role && <span className="text-[11px] text-white/40 truncate hidden sm:inline">· {agent.role}</span>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400">Online</span>
            </span>
            {agent?.model && (
              <span className="text-[9.5px] font-mono px-1.5 py-px rounded border border-white/10 bg-white/[0.04] text-white/40">
                {agent.model.split("-").slice(0, 2).join("-")}
              </span>
            )}
            {agent?.speed && <span className="text-[10px] text-white/35">{SPEED_RU[agent.speed] ?? agent.speed}</span>}
            {typeof agent?.rating === "number" && <span className="text-[10px] text-amber-400">★ {agent.rating}</span>}
            {agent?.team && agent.team.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="flex -space-x-1.5">
                  {agent.team.map(t => (
                    <span key={t.slug} title={`${t.name} — ${t.title}`}
                      className="size-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white border border-[#05060A]"
                      style={{ background: t.color }}>
                      {t.ab}
                    </span>
                  ))}
                </span>
                <span className="text-[10px] text-white/35">team of {agent.team.length}</span>
              </span>
            )}
          </div>
        </div>
        <button className="size-7 rounded-lg hover:bg-white/[0.06] transition-colors flex items-center justify-center text-white/30 hover:text-white/60">
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && !sending && (
          <motion.div
            className="flex flex-col items-center justify-center h-full text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="size-20 rounded-3xl flex items-center justify-center mb-5 text-4xl"
              style={{ background: `linear-gradient(135deg, ${agentColor}22, ${agentColor}0d)`, border: `1px solid ${agentColor}30`, boxShadow: `0 8px 32px ${agentColor}1a` }}>
              {agent?.emoji ?? (agent?.ab ? (
                <span className="text-2xl font-black" style={{ color: agentColor }}>{agent.ab}</span>
              ) : (
                <svg className="size-9 text-violet-400/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
            <div className="text-base font-semibold text-white mb-1">{agent ? agent.name : "Ready to Work"}</div>
            {agent?.role && <div className="text-xs font-medium mb-2" style={{ color: agentColor }}>{agent.role}</div>}
            <div className="text-sm text-white/35 max-w-sm leading-relaxed">
              {agent?.description ?? "Ask any question about business, strategy, finance, or ask me to create a task"}
            </div>
            {/* director's team: who will discuss */}
            {agent?.team && agent.team.length > 0 && (
              <div className="mt-5 w-full max-w-md">
                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2.5 font-semibold">Your Question Will Be Discussed By</div>
                <div className="grid grid-cols-2 gap-2">
                  {agent.team.map(t => (
                    <div key={t.slug} className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-white/[0.07] bg-white/[0.03] text-left">
                      <span className="size-7 rounded-lg flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${t.color}e6, ${t.color}99)` }}>
                        {t.ab}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[11.5px] font-semibold text-white/85 truncate">{t.name}</span>
                        <span className="block text-[10px] text-white/40 truncate">{t.title}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 text-[11px] text-white/35 flex items-center justify-center gap-1.5">
                  <span className="size-1 rounded-full" style={{ background: agentColor }} />
                  then {agent.name} will deliver the final verdict
                </div>
              </div>
            )}
            {/* agent characteristics */}
            {agent && (
              <div className="mt-4 flex flex-wrap gap-1.5 justify-center max-w-md">
                {agent.model && (
                  <span className="text-[10px] font-mono px-2 py-1 rounded-md border border-white/10 bg-white/[0.04] text-white/45">
                    {agent.model.split("-").slice(0, 2).join("-")}
                  </span>
                )}
                {agent.speed && (
                  <span className="text-[10px] px-2 py-1 rounded-md border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 font-medium">
                    {SPEED_RU[agent.speed] ?? agent.speed}
                  </span>
                )}
                {typeof agent.rating === "number" && (
                  <span className="text-[10px] px-2 py-1 rounded-md border border-amber-500/25 bg-amber-500/10 text-amber-400 font-medium">★ {agent.rating}</span>
                )}
                {(agent.tools ?? []).slice(0, 4).map(t => (
                  <span key={t} className="text-[10px] px-2 py-1 rounded-md border border-white/10 bg-white/[0.04] text-white/40 capitalize">{t}</span>
                ))}
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-md">
              {(agent ? suggestionsFor(agent) : [
                "Do a SWOT analysis of my startup",
                "Calculate LTV and CAC",
                "Create a task: market research",
                "Which acquisition channels are best?",
              ]).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                  className="px-3 py-1.5 text-xs text-white/50 border border-white/[0.08] rounded-full hover:border-violet-500/30 hover:text-white/70 hover:bg-violet-500/[0.05] transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (msg.speaker ? (
                <div className="size-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${msg.speaker.color}e6, ${msg.speaker.color}99)`, boxShadow: `0 4px 12px ${msg.speaker.color}33` }}>
                  {msg.speaker.ab}
                </div>
              ) : assistantAvatar)}
              <div className={`max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                {msg.speaker && (
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="text-[11px] font-semibold" style={{ color: msg.speaker.color }}>{msg.speaker.name}</span>
                    <span className={`text-[10px] ${msg.speaker.verdict ? "font-bold uppercase tracking-wide" : "text-white/30"}`}
                      style={msg.speaker.verdict ? { color: msg.speaker.color } : undefined}>
                      {msg.speaker.verdict ? "★ Final Verdict" : `· ${msg.speaker.role}`}
                    </span>
                  </div>
                )}
                {/* Tool calls in message */}
                {msg.metadata?.tools && msg.metadata.tools.length > 0 && (
                  <div className="space-y-1 mb-1">
                    {msg.metadata.tools.map((tc, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-[11px] text-white/50">
                        <span>{TOOL_ICONS[tc.tool] ?? "🔧"}</span>
                        <span className="font-medium text-white/70">{tc.tool}</span>
                        <span className="text-white/30">completed</span>
                      </div>
                    ))}
                  </div>
                )}
                <div
                  className={`px-4 py-3 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-violet-600 to-blue-600 text-white ml-auto"
                      : "bg-white/[0.05] border border-white/[0.08]"
                  }`}
                  style={msg.speaker?.verdict ? { borderColor: `${msg.speaker.color}55`, background: `${msg.speaker.color}0f` } : undefined}
                >
                  {msg.role === "user" ? (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <MarkdownText text={msg.content} />
                  )}
                </div>
                <div className="text-[10px] text-white/20 px-1">
                  {new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Active tool calls */}
        {activeTools.length > 0 && (
          <div className="flex justify-start gap-3">
            {assistantAvatar}
            <div className="space-y-1">
              {activeTools.map((tool) => (
                <div key={tool} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px]">
                  <div className="size-3 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                  <span className="text-amber-400">{TOOL_ICONS[tool] ?? "🔧"} Running {tool}...</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Streaming response */}
        {isStreaming && (
          <motion.div
            className="flex gap-3 justify-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {assistantAvatar}
            <div className="max-w-[75%] px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/[0.08]">
              <MarkdownText text={streamingContent} />
              <span className="inline-block w-0.5 h-4 animate-pulse ml-0.5 align-text-bottom" style={{ background: agentColor }} />
            </div>
          </motion.div>
        )}

        {/* Typing indicator */}
        {sending && !isStreaming && (
          <div className="flex gap-3 justify-start">
            {assistantAvatar}
            <div className="px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="size-1.5 rounded-full bg-white/40" style={{ animation: `typing-dot 1.4s ${i * 0.2}s ease-in-out infinite` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-white/[0.06] bg-[#05060A]/80 backdrop-blur-sm">
        <div className="flex items-end gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] focus-within:border-violet-500/30 transition-colors">
          <textarea maxLength={1000}
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for a new line)"
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder-white/25 resize-none outline-none leading-relaxed max-h-32 overflow-y-auto"
            style={{ minHeight: "24px" }}
            disabled={sending}
          />
          <div className="flex items-center gap-2 flex-shrink-0">
            {sending && (
              <button
                onClick={() => abortRef.current?.abort()}
                className="size-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
              </button>
            )}
            {voiceSupported && !sending && (
              <button
                onClick={toggleVoice}
                title={isRecording ? "Stop recording" : "Voice input"}
                className="size-8 rounded-xl flex items-center justify-center transition-all relative"
                style={isRecording
                  ? { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", color: "#ef4444" }
                  : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }
                }
              >
                {isRecording && (
                  <span className="absolute inset-0 rounded-xl animate-ping" style={{ background: "rgba(239,68,68,0.2)" }} />
                )}
                <svg className="size-4 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="2" width="6" height="11" rx="3"/>
                  <path d="M5 10a7 7 0 0 0 14 0"/>
                  <line x1="12" y1="19" x2="12" y2="22"/>
                  <line x1="8" y1="22" x2="16" y2="22"/>
                </svg>
              </button>
            )}
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="size-8 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 flex items-center justify-center text-white transition-all hover:shadow-lg hover:shadow-violet-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
        <div className="flex items-center justify-center mt-2 gap-2 text-[10px] text-white/20">
          <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span>AI can make mistakes. Verify important data.</span>
        </div>
      </div>
    </div>
  );
}
