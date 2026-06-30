"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface Conversation {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  agent_id: string | null;
  agents?: { name: string } | null;
}

const DEFAULT_AGENTS = [
  { id: "ceo", name: "CEO — Стратег", desc: "Стратегическое видение, приоритеты, ключевые решения", color: "#7c3aed", icon: "⭐" },
  { id: "cfo", name: "CFO — Финансист", desc: "Финансовые модели, ROI, инвестиции, бюджетирование", color: "#3b82f6", icon: "💰" },
  { id: "cmo", name: "CMO — Маркетолог", desc: "Go-to-market, бренд, привлечение клиентов", color: "#10b981", icon: "📣" },
  { id: "coo", name: "COO — Операционист", desc: "Процессы, команда, запуск, операционный план", color: "#f59e0b", icon: "⚙️" },
  { id: "analyst", name: "Business Analyst", desc: "Рынок, конкуренты, SWOT, customer persona", color: "#f97316", icon: "🔍" },
  { id: "general", name: "AI Assistant", desc: "Универсальный помощник для любых вопросов", color: "#6366f1", icon: "🤖" },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "Только что";
  if (m < 60) return `${m}м назад`;
  if (h < 24) return `${h}ч назад`;
  return `${d}д назад`;
}

export default function ChatListPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/chat")
      .then(r => r.json())
      .then(d => setConversations(d.conversations ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function startChat(agentId?: string) {
    setCreating(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat", agentId }),
      });
      const data = await res.json();
      if (data.conversation) router.push(`/dashboard/chat/${data.conversation.id}`);
    } catch {
      // Fallback: generate local ID and use AI in local mode
      const id = `local-${Date.now()}`;
      router.push(`/dashboard/chat/${id}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div>
          <h1 className="text-base font-bold text-white">AI Чат</h1>
          <p className="text-xs text-white/35 mt-0.5">Общайтесь с AI-агентами в реальном времени</p>
        </div>
        <button
          onClick={() => startChat()}
          disabled={creating}
          className="inline-flex items-center gap-2 h-8 px-4 text-xs font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-500 hover:to-blue-500 transition-all disabled:opacity-50"
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Новый чат
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Agent picker */}
        <div>
          <div className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Выберите агента</div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
            {DEFAULT_AGENTS.map((agent) => (
              <motion.button
                key={agent.id}
                onClick={() => startChat(agent.id)}
                disabled={creating}
                className={`relative p-3.5 rounded-xl border text-left transition-all group ${selectedAgent === agent.id ? "border-violet-500/40 bg-violet-500/10" : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"}`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className="size-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: `${agent.color}18`, border: `1px solid ${agent.color}22` }}
                  >
                    {agent.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold text-white leading-tight">{agent.name}</div>
                    <div className="text-[10px] text-white/35 mt-0.5 leading-relaxed line-clamp-2">{agent.desc}</div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Recent conversations */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        ) : conversations.length > 0 ? (
          <div>
            <div className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Недавние чаты</div>
            <div className="space-y-1.5">
              {conversations.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    href={`/dashboard/chat/${c.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-all group"
                  >
                    <div className="size-8 rounded-lg bg-violet-500/10 border border-violet-500/15 flex items-center justify-center flex-shrink-0">
                      <svg className="size-3.5 text-violet-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-white truncate">{c.title}</div>
                      <div className="text-[10px] text-white/30 mt-0.5">{c.agents?.name ?? "AI Assistant"} · {timeAgo(c.updated_at)}</div>
                    </div>
                    <svg className="size-3.5 text-white/15 group-hover:text-white/35 transition-colors flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Empty state */}
        {!loading && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="size-16 rounded-2xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center mb-4">
              <svg className="size-7 text-violet-400/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div className="text-sm font-medium text-white/50 mb-1">Нет чатов</div>
            <div className="text-xs text-white/25 max-w-xs">Выберите агента выше и начните общение</div>
          </div>
        )}
      </div>
    </div>
  );
}
