"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const INDUSTRIES = ["SaaS / Software","E-commerce","Mobile App","Marketplace","Agency / Services","Healthcare","FinTech","EdTech","Real Estate","Restaurant / Food","Fitness / Wellness","Media / Content","Manufacturing","Consulting","Other"];
const STAGES = [
  { id: "idea", label: "Просто идея", desc: "Ещё не начинал" },
  { id: "planning", label: "Планирование", desc: "Изучаю рынок" },
  { id: "building", label: "Создаю MVP", desc: "В разработке" },
  { id: "launched", label: "Уже запущен", desc: "Нужна стратегия роста" },
];
const GOALS = ["Привлечь инвестиции","Быстрый запуск","Product-market fit","Масштабировать выручку","Выйти на новый рынок","Снизить расходы","Нанять команду","Exit стратегия"];

const AGENTS = [
  { role: "CEO", label: "Генеральный директор", color: "#7c3aed" },
  { role: "CFO", label: "Финансовый директор", color: "#3b82f6" },
  { role: "CMO", label: "Директор по маркетингу", color: "#10b981" },
  { role: "COO", label: "Операционный директор", color: "#f59e0b" },
  { role: "Business Analyst", label: "Бизнес-аналитик", color: "#f97316" },
  { role: "CTO", label: "Технический директор", color: "#ec4899" },
  { role: "Sales Director", label: "Директор по продажам", color: "#6366f1" },
  { role: "Legal Advisor", label: "Юридический советник", color: "#64748b" },
];

interface AgentResult {
  role: string; title: string; summary: string; analysis: string;
  facts: string; risks: string; recommendations: string;
  confidence: string; score: number;
}

export default function NewStrategyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", description: "", industry: "", stage: "",
    goals: [] as string[], targetRevenue: "", timeframe: "12",
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [doneAgents, setDoneAgents] = useState<Set<string>>(new Set());
  const [agentResults, setAgentResults] = useState<AgentResult[]>([]);
  const totalSteps = 3;

  const handleGoalToggle = (goal: string) =>
    setForm((f) => ({
      ...f,
      goals: f.goals.includes(goal) ? f.goals.filter((g) => g !== goal) : [...f.goals, goal],
    }));

  const handleSubmit = async () => {
    setAnalyzing(true);
    setDoneAgents(new Set());
    setAgentResults([]);

    const id = `proj_${Date.now()}`;
    const collectedResults: AgentResult[] = [];
    let finalScore = 0;

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.body) throw new Error("no stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "agent_done") {
              collectedResults.push(data.result);
              setDoneAgents((prev) => new Set([...prev, data.role]));
              setAgentResults([...collectedResults]);
            }
            if (data.type === "complete") {
              finalScore = data.overallScore;
            }
          } catch {}
        }
      }
    } catch {
      // API недоступен — генерируем fallback-результаты чтобы страница проекта работала
      const fallbackScore = Math.floor(70 + Math.random() * 20);
      const fallbackTitles: Record<string, string> = {
        CEO: "Генеральный директор", CFO: "Финансовый директор", CMO: "Директор по маркетингу",
        COO: "Операционный директор", "Business Analyst": "Бизнес-аналитик",
        CTO: "Технический директор", "Sales Director": "Директор по продажам", "Legal Advisor": "Юридический советник",
      };
      AGENTS.forEach((a) => {
        const s = Math.floor(fallbackScore - 5 + Math.random() * 15);
        collectedResults.push({
          role: a.role, title: fallbackTitles[a.role] ?? a.label,
          summary: `Анализ для "${form.name}" в сфере "${form.industry || "вашей индустрии"}". Для получения детального анализа убедитесь, что API-ключ настроен корректно.`,
          analysis: `Проект находится на стадии "${form.stage || "идеи"}". Рынок ${form.industry || "выбранной индустрии"} предоставляет возможности для роста.`,
          facts: "Анализ выполнен в офлайн-режиме. Данные носят ориентировочный характер.",
          risks: "Рекомендуется запустить полный AI-анализ после настройки API-ключа.",
          recommendations: "1. Настройте ANTHROPIC_API_KEY в переменных окружения.\n2. Нажмите «Обновить анализ» на странице проекта для получения полного анализа.",
          confidence: "низкая", score: s,
        });
        setDoneAgents((prev) => new Set([...prev, a.role]));
        setAgentResults([...collectedResults]);
      });
      finalScore = fallbackScore;
    }

    const score = finalScore || Math.floor(70 + Math.random() * 25);
    const newProject = {
      id, name: form.name, description: form.description,
      industry: form.industry, stage: form.stage,
      goals: form.goals, targetRevenue: form.targetRevenue, timeframe: form.timeframe,
      score, status: "complete", date: "Только что",
      revenue: form.targetRevenue || `$${(score * 25000 / 1000).toFixed(1)}M`,
      market: `$${(score * 50).toFixed(0)}M`,
      growth: `+${Math.floor(10 + score / 5)}%/год`,
      aiResults: collectedResults.length > 0 ? collectedResults : [],
    };

    const existing = JSON.parse(localStorage.getItem("apex-user-projects") || "[]");
    localStorage.setItem("apex-user-projects", JSON.stringify([newProject, ...existing]));

    // Also save to Supabase (best-effort)
    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, description: form.description, industry: form.industry,
        stage: form.stage, goals: form.goals, targetRevenue: form.targetRevenue,
        timeframe: form.timeframe, score, aiResults: newProject.aiResults,
        metadata: { localId: id },
      }),
    }).catch(() => {});

    router.push(`/dashboard/projects/${id}`);
  };

  const canNext = () => {
    if (step === 1) return form.name.trim().length > 0 && form.description.trim().length > 20;
    if (step === 2) return form.industry && form.stage;
    return true;
  };

  // ── Analysis loading screen ──────────────────────────────────────────────
  if (analyzing) {
    const doneCount = doneAgents.size;
    const progress = Math.round((doneCount / AGENTS.length) * 100);

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-lg">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 mb-5 shadow-xl shadow-violet-500/30">
              <svg className="size-7 text-white animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Команда работает над вашим проектом</h2>
            <p className="text-sm text-white/35">8 AI-специалистов анализируют бизнес параллельно</p>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/40">Прогресс анализа</span>
              <span className="text-xs font-semibold text-white">{doneCount} / {AGENTS.length}</span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-600 to-blue-500 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {AGENTS.map((agent) => {
              const done = doneAgents.has(agent.role);
              const result = agentResults.find((r) => r.role === agent.role);
              return (
                <div key={agent.role} className={`p-3 rounded-xl border transition-all duration-500 ${done ? "border-white/[0.1] bg-white/[0.04]" : "border-white/[0.04] bg-white/[0.015]"}`}>
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: `${agent.color}18`, border: `1px solid ${agent.color}30` }}>
                      {done ? (
                        <svg className="size-3.5" style={{ color: agent.color }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                        <span style={{ color: agent.color }}>{agent.role[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-white/60 truncate">{agent.label}</div>
                      <div className="text-[10px]">
                        {done
                          ? <span style={{ color: agent.color }}>Балл: {result?.score ?? "—"}</span>
                          : <span className="text-white/25 flex items-center gap-1"><span className="size-1 rounded-full bg-white/20 animate-pulse" />Анализирует…</span>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {doneCount === AGENTS.length && (
            <div className="mt-6 p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/20 text-center">
              <div className="text-sm font-semibold text-emerald-400 mb-0.5">Анализ завершён!</div>
              <div className="text-xs text-white/40">Перенаправляю на страницу результатов…</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Wizard ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 mb-4 shadow-xl shadow-violet-500/30">
            <svg className="size-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Брифинг исполнительного совета</h1>
          <p className="text-sm text-white/40">Чем подробнее описание — тем точнее анализ от 8 AI-специалистов.</p>
        </div>

        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/[0.06]">
              <div className="h-full bg-gradient-to-r from-violet-600 to-blue-500 rounded-full transition-all duration-500" style={{ width: i < step ? "100%" : "0%" }} />
            </div>
          ))}
          <span className="text-xs text-white/25 flex-shrink-0">{step}/{totalSteps}</span>
        </div>

        <div className="glass-strong rounded-2xl p-8 border border-white/[0.07]">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <div className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-1">Шаг 1</div>
                <h2 className="text-lg font-bold text-white mb-4">Расскажите о вашем бизнесе</h2>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/50">Название проекта</label>
                <input type="text" placeholder="например: AI-Powered Fitness Platform" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 px-4 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/50">Описание бизнеса</label>
                <textarea placeholder="Опишите идею подробно: какую проблему решаете, кто ваши клиенты, в чём уникальность, бизнес-модель? Чем больше деталей — тем точнее анализ AI-команды." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={7} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 p-4 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all resize-none" />
                <div className="text-right">
                  <span className={`text-xs ${form.description.length > 50 ? "text-emerald-400" : "text-white/20"}`}>
                    {form.description.length} симв.{form.description.length < 100 && " — добавьте больше деталей"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <div className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-1">Шаг 2</div>
                <h2 className="text-lg font-bold text-white mb-4">Контекст бизнеса</h2>
              </div>
              <div>
                <label className="text-sm font-medium text-white/50 block mb-3">Индустрия</label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((ind) => (
                    <button key={ind} onClick={() => setForm((f) => ({ ...f, industry: ind }))} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${form.industry === ind ? "bg-violet-600 text-white border border-violet-500" : "bg-white/[0.04] text-white/40 border border-white/[0.06] hover:text-white/70 hover:border-white/[0.12]"}`}>{ind}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-white/50 block mb-3">Текущая стадия</label>
                <div className="grid grid-cols-2 gap-3">
                  {STAGES.map((stage) => (
                    <button key={stage.id} onClick={() => setForm((f) => ({ ...f, stage: stage.id }))} className={`p-4 rounded-xl border text-left transition-all ${form.stage === stage.id ? "border-violet-500/50 bg-violet-500/10" : "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12]"}`}>
                      <div className={`text-sm font-semibold mb-0.5 ${form.stage === stage.id ? "text-violet-300" : "text-white/60"}`}>{stage.label}</div>
                      <div className="text-xs text-white/25">{stage.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <div className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-1">Шаг 3</div>
                <h2 className="text-lg font-bold text-white mb-4">Цели и параметры</h2>
              </div>
              <div>
                <label className="text-sm font-medium text-white/50 block mb-3">Ключевые цели <span className="text-white/20">(можно несколько)</span></label>
                <div className="flex flex-wrap gap-2">
                  {GOALS.map((goal) => (
                    <button key={goal} onClick={() => handleGoalToggle(goal)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${form.goals.includes(goal) ? "bg-violet-600 text-white border border-violet-500" : "bg-white/[0.04] text-white/40 border border-white/[0.06] hover:text-white/70 hover:border-white/[0.12]"}`}>{goal}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white/50">Целевая выручка</label>
                  <input type="text" placeholder="например: $1M ARR" value={form.targetRevenue} onChange={(e) => setForm((f) => ({ ...f, targetRevenue: e.target.value }))} className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 px-4 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white/50">Таймфрейм</label>
                  <select value={form.timeframe} onChange={(e) => setForm((f) => ({ ...f, timeframe: e.target.value }))} className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white/70 px-4 focus:outline-none focus:border-violet-500/50 transition-all appearance-none cursor-pointer">
                    <option value="3">3 месяца</option><option value="6">6 месяцев</option><option value="12">12 месяцев</option><option value="24">24 месяца</option><option value="36">36 месяцев</option>
                  </select>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-3">Резюме брифинга</div>
                <div className="space-y-1.5">
                  {[["Проект", form.name||"—"],["Индустрия",form.industry||"—"],["Стадия",STAGES.find((s)=>s.id===form.stage)?.label||"—"],["Цели",form.goals.join(", ")||"—"]].map(([k,v])=>(
                    <div key={k} className="flex gap-2 text-xs"><span className="text-white/25 w-20 flex-shrink-0">{k}:</span><span className="text-white/55">{v}</span></div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.06]">
            <button onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1} className="h-10 px-5 text-sm text-white/35 hover:text-white/60 disabled:opacity-0 transition-all">← Назад</button>
            {step < totalSteps ? (
              <button onClick={() => setStep((s) => s + 1)} disabled={!canNext()} className="h-10 px-7 text-sm font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-500 hover:to-blue-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed">Продолжить →</button>
            ) : (
              <button onClick={handleSubmit} className="h-10 px-7 text-sm font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-500 hover:to-blue-500 transition-all flex items-center gap-2">
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                Запустить анализ
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
