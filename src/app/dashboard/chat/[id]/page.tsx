"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
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
  ceo: "CEO — Стратег",
  cfo: "CFO — Финансист",
  cmo: "CMO — Маркетолог",
  coo: "COO — Операционист",
  analyst: "Business Analyst",
  general: "AI Assistant",
};

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = params.id as string;
  const agentId = searchParams.get("agent") ?? undefined;
  const isLocal = conversationId.startsWith("local-");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

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
            history: messages.map(m => ({ role: m.role, content: m.content })),
          })
        : JSON.stringify({ message: userMessage });

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: abortRef.current.signal,
      });

      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let fullContent = "";
      const currentToolCalls: ToolCall[] = [];

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
              setMessages(prev => {
                const filtered = prev.filter(m => m.id !== tempId);
                return [...filtered, {
                  id: `ai-${Date.now()}`,
                  role: "assistant",
                  content: fullContent,
                  created_at: new Date().toISOString(),
                  metadata: currentToolCalls.length > 0 ? { tools: currentToolCalls } : undefined,
                }];
              });
              setStreamingContent("");
              setToolCalls([]);
            }
          } catch {}
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setMessages(prev => [...prev, {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Произошла ошибка. Проверьте подключение и попробуйте снова.",
          created_at: new Date().toISOString(),
        }]);
        setStreamingContent("");
      }
    } finally {
      setSending(false);
      setStreamingContent("");
      inputRef.current?.focus();
    }
  }, [input, sending, conversationId]);

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
      <div className="flex items-center gap-3 px-6 py-3 border-b border-white/[0.06] bg-[#080808]/80 backdrop-blur-sm flex-shrink-0">
        <button
          onClick={() => router.push("/dashboard/chat")}
          className="size-7 rounded-lg hover:bg-white/[0.06] transition-colors flex items-center justify-center text-white/40 hover:text-white/70"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div className="size-7 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
          <svg className="size-3.5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{agentId ? (AGENT_NAMES[agentId] ?? "AI Assistant") : "AI Assistant"}</div>
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400">{isLocal ? "Локальный режим" : "Онлайн"}</span>
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
            <div className="size-20 rounded-3xl bg-gradient-to-br from-violet-600/15 to-blue-600/15 border border-violet-500/15 flex items-center justify-center mb-5">
              <svg className="size-9 text-violet-400/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div className="text-base font-semibold text-white mb-2">Готов к работе</div>
            <div className="text-sm text-white/35 max-w-sm leading-relaxed">
              Задайте любой вопрос о бизнесе, стратегии, финансах или попросите создать задачу
            </div>
            <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-md">
              {[
                "Сделай SWOT-анализ моего стартапа",
                "Посчитай LTV и CAC",
                "Создай задачу: исследование рынка",
                "Какие каналы привлечения лучше?",
              ].map((suggestion) => (
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
              {msg.role === "assistant" && (
                <div className="size-7 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-violet-500/20">
                  <svg className="size-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
              )}
              <div className={`max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                {/* Tool calls in message */}
                {msg.metadata?.tools && msg.metadata.tools.length > 0 && (
                  <div className="space-y-1 mb-1">
                    {msg.metadata.tools.map((tc, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-[11px] text-white/50">
                        <span>{TOOL_ICONS[tc.tool] ?? "🔧"}</span>
                        <span className="font-medium text-white/70">{tc.tool}</span>
                        <span className="text-white/30">выполнен</span>
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
                >
                  {msg.role === "user" ? (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <MarkdownText text={msg.content} />
                  )}
                </div>
                <div className="text-[10px] text-white/20 px-1">
                  {new Date(msg.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Active tool calls */}
        {activeTools.length > 0 && (
          <div className="flex justify-start gap-3">
            <div className="size-7 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="size-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            </div>
            <div className="space-y-1">
              {activeTools.map((tool) => (
                <div key={tool} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px]">
                  <div className="size-3 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                  <span className="text-amber-400">{TOOL_ICONS[tool] ?? "🔧"} Выполняю {tool}...</span>
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
            <div className="size-7 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-violet-500/20">
              <svg className="size-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            </div>
            <div className="max-w-[75%] px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/[0.08]">
              <MarkdownText text={streamingContent} />
              <span className="inline-block w-0.5 h-4 bg-violet-400 animate-pulse ml-0.5 align-text-bottom" />
            </div>
          </motion.div>
        )}

        {/* Typing indicator */}
        {sending && !isStreaming && (
          <div className="flex gap-3 justify-start">
            <div className="size-7 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="size-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            </div>
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
      <div className="flex-shrink-0 p-4 border-t border-white/[0.06] bg-[#080808]/80 backdrop-blur-sm">
        <div className="flex items-end gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] focus-within:border-violet-500/30 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите сообщение... (Enter для отправки, Shift+Enter для новой строки)"
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
          <span>AI может ошибаться. Проверяйте важные данные.</span>
        </div>
      </div>
    </div>
  );
}
