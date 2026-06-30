"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Agent {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  model: string;
  temperature: number;
  tools_enabled: string[];
  status: string;
  created_at: string;
}

const PRESET_AGENTS = [
  { name: "CEO — Стратег", description: "Стратегическое видение, приоритеты, ключевые решения", model: "claude-haiku-4-5-20251001", icon: "⭐", color: "#7c3aed", system_prompt: "You are a strategic CEO advisor. Help with strategic planning, business priorities, and key decisions. Be concise and action-oriented." },
  { name: "CFO — Финансист", description: "Финансовые модели, ROI, инвестиции, бюджетирование", model: "claude-haiku-4-5-20251001", icon: "💰", color: "#3b82f6", system_prompt: "You are a CFO advisor. Help with financial modeling, ROI calculations, investment decisions, and budgeting. Provide data-driven insights." },
  { name: "CMO — Маркетолог", description: "Go-to-market, бренд, привлечение клиентов", model: "claude-haiku-4-5-20251001", icon: "📣", color: "#10b981", system_prompt: "You are a CMO advisor. Help with go-to-market strategy, brand development, and customer acquisition. Focus on growth and engagement." },
  { name: "COO — Операционист", description: "Процессы, команда, запуск, операционный план", model: "claude-haiku-4-5-20251001", icon: "⚙️", color: "#f59e0b", system_prompt: "You are a COO advisor. Help with operational processes, team management, product launches, and operational planning." },
];

const MODELS = [
  { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (Fast)" },
  { value: "claude-sonnet-5", label: "Claude Sonnet 5 (Smart)" },
  { value: "claude-opus-4-8", label: "Claude Opus 4.8 (Powerful)" },
];

const TOOLS = [
  { id: "create_task", label: "Создание задач" },
  { id: "search_web", label: "Поиск в интернете" },
  { id: "generate_report", label: "Генерация отчётов" },
  { id: "get_project_data", label: "Данные проектов" },
  { id: "calculate_metrics", label: "Расчёт метрик" },
];

const DEFAULT_FORM = {
  name: "",
  description: "",
  system_prompt: "",
  model: "claude-haiku-4-5-20251001",
  temperature: 0.7,
  tools_enabled: [] as string[],
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAgents();
  }, []);

  async function loadAgents() {
    setLoading(true);
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      setAgents(data.agents ?? []);
    } catch {
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditAgent(null);
    setForm({ ...DEFAULT_FORM });
    setError("");
    setShowModal(true);
  }

  function openEdit(agent: Agent) {
    setEditAgent(agent);
    setForm({
      name: agent.name,
      description: agent.description,
      system_prompt: agent.system_prompt,
      model: agent.model,
      temperature: agent.temperature,
      tools_enabled: agent.tools_enabled ?? [],
    });
    setError("");
    setShowModal(true);
  }

  function applyPreset(preset: typeof PRESET_AGENTS[0]) {
    setForm(f => ({
      ...f,
      name: preset.name,
      description: preset.description,
      system_prompt: preset.system_prompt,
      model: preset.model,
    }));
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Укажите название агента"); return; }
    if (!form.system_prompt.trim()) { setError("Укажите системный промпт"); return; }
    setSaving(true);
    setError("");
    try {
      const url = editAgent ? `/api/agents/${editAgent.id}` : "/api/agents";
      const method = editAgent ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка сохранения");
      setShowModal(false);
      await loadAgents();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/agents/${id}`, { method: "DELETE" });
      setAgents(a => a.filter(ag => ag.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  function toggleTool(toolId: string) {
    setForm(f => ({
      ...f,
      tools_enabled: f.tools_enabled.includes(toolId)
        ? f.tools_enabled.filter(t => t !== toolId)
        : [...f.tools_enabled, toolId],
    }));
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div>
          <h1 className="text-base font-bold text-white">AI Агенты</h1>
          <p className="text-xs text-white/35 mt-0.5">Создавайте и настраивайте персонализированных AI-агентов</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 h-8 px-4 text-xs font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-500 hover:to-blue-500 transition-all"
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Создать агента
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-16 rounded-2xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center mb-4">
              <svg className="size-7 text-violet-400/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </div>
            <div className="text-sm font-medium text-white/50 mb-1">Нет агентов</div>
            <div className="text-xs text-white/25 max-w-xs mb-6">Создайте первого AI-агента с уникальным промптом и настройками</div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 h-8 px-4 text-xs font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-500 hover:to-blue-500 transition-all"
            >
              Создать агента
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {agents.map((agent, i) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04] transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="size-9 rounded-xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center text-base">
                      🤖
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(agent)}
                        className="size-7 flex items-center justify-center rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white/70 transition-all"
                      >
                        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button
                        onClick={() => handleDelete(agent.id)}
                        disabled={deleting === agent.id}
                        className="size-7 flex items-center justify-center rounded-lg bg-white/[0.04] hover:bg-red-500/15 text-white/40 hover:text-red-400 transition-all disabled:opacity-50"
                      >
                        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  </div>

                  <div className="text-[13px] font-semibold text-white mb-1 truncate">{agent.name}</div>
                  <div className="text-[11px] text-white/35 line-clamp-2 mb-3">{agent.description || agent.system_prompt.slice(0, 80) + "..."}</div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/15 text-[10px] text-blue-300/70">
                      {MODELS.find(m => m.value === agent.model)?.label?.split(" ")[1] ?? "Haiku"}
                    </span>
                    {(agent.tools_enabled ?? []).length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/15 text-[10px] text-green-300/70">
                        {agent.tools_enabled.length} инструм.
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] ${agent.status === "active" ? "bg-emerald-500/10 border border-emerald-500/15 text-emerald-300/70" : "bg-white/[0.04] border border-white/[0.06] text-white/30"}`}>
                      {agent.status === "active" ? "Активен" : "Неактивен"}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#0e0e14] border border-white/[0.08] rounded-2xl shadow-2xl"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-sm font-bold text-white">{editAgent ? "Редактировать агента" : "Создать агента"}</h2>
                  <p className="text-xs text-white/35 mt-0.5">Настройте поведение AI-агента</p>
                </div>
                <button onClick={() => setShowModal(false)} className="size-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-all">
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Presets */}
                {!editAgent && (
                  <div>
                    <div className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Шаблоны</div>
                    <div className="grid grid-cols-2 gap-2">
                      {PRESET_AGENTS.map(p => (
                        <button
                          key={p.name}
                          onClick={() => applyPreset(p)}
                          className="p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04] text-left transition-all"
                        >
                          <div className="text-[11px] font-semibold text-white mb-0.5">{p.icon} {p.name.split(" — ")[0]}</div>
                          <div className="text-[10px] text-white/30 line-clamp-1">{p.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-white/40 mb-1.5">Название *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Например: CEO Стратег"
                    className="w-full h-9 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-semibold text-white/40 mb-1.5">Описание</label>
                  <input
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Краткое описание агента"
                    className="w-full h-9 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                </div>

                {/* System prompt */}
                <div>
                  <label className="block text-[11px] font-semibold text-white/40 mb-1.5">Системный промпт *</label>
                  <textarea
                    value={form.system_prompt}
                    onChange={e => setForm(f => ({ ...f, system_prompt: e.target.value }))}
                    placeholder="Вы — AI-агент, специализирующийся на..."
                    rows={5}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
                  />
                </div>

                {/* Model */}
                <div>
                  <label className="block text-[11px] font-semibold text-white/40 mb-1.5">Модель</label>
                  <select
                    value={form.model}
                    onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                    className="w-full h-9 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[13px] text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                  >
                    {MODELS.map(m => (
                      <option key={m.value} value={m.value} className="bg-[#0e0e14]">{m.label}</option>
                    ))}
                  </select>
                </div>

                {/* Temperature */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-white/40">Температура</label>
                    <span className="text-[11px] text-white/50">{form.temperature.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={form.temperature}
                    onChange={e => setForm(f => ({ ...f, temperature: parseFloat(e.target.value) }))}
                    className="w-full accent-violet-500"
                  />
                  <div className="flex justify-between text-[10px] text-white/20 mt-1">
                    <span>Точный</span>
                    <span>Креативный</span>
                  </div>
                </div>

                {/* Tools */}
                <div>
                  <label className="block text-[11px] font-semibold text-white/40 mb-2">Инструменты</label>
                  <div className="space-y-1.5">
                    {TOOLS.map(tool => (
                      <label key={tool.id} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={form.tools_enabled.includes(tool.id)}
                          onChange={() => toggleTool(tool.id)}
                          className="accent-violet-500 size-3.5"
                        />
                        <span className="text-[12px] text-white/60">{tool.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-300">{error}</div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 p-5 border-t border-white/[0.06]">
                <button
                  onClick={() => setShowModal(false)}
                  className="h-8 px-4 text-xs font-medium text-white/40 hover:text-white/70 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="h-8 px-5 text-xs font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Сохранение..." : editAgent ? "Сохранить" : "Создать"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
