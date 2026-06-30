"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const INDUSTRIES = ["SaaS / Software","E-commerce","Mobile App","Marketplace","Agency / Services","Healthcare","FinTech","EdTech","Real Estate","Restaurant / Food","Fitness / Wellness","Media / Content","Manufacturing","Consulting","Other"];
const STAGES = [
  { id: "idea", label: "Just an idea", desc: "Haven't started yet" },
  { id: "planning", label: "Planning phase", desc: "Doing research" },
  { id: "building", label: "Building MVP", desc: "In development" },
  { id: "launched", label: "Already launched", desc: "Need growth strategy" },
];
const GOALS = ["Raise investment","Launch fast","Find product-market fit","Scale revenue","Enter new market","Reduce costs","Hire a team","Exit strategy"];

export default function NewStrategyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", description: "", industry: "", stage: "", goals: [] as string[], targetRevenue: "", timeframe: "12" });
  const [loading, setLoading] = useState(false);
  const totalSteps = 3;

  const handleGoalToggle = (goal: string) => setForm((f) => ({ ...f, goals: f.goals.includes(goal) ? f.goals.filter((g) => g !== goal) : [...f.goals, goal] }));

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2500));

    // Генерируем уникальный ID и сохраняем проект в localStorage
    const id = `proj_${Date.now()}`;
    const score = Math.floor(70 + Math.random() * 25);
    const newProject = {
      id,
      name: form.name,
      description: form.description,
      industry: form.industry,
      stage: form.stage,
      goals: form.goals,
      targetRevenue: form.targetRevenue,
      timeframe: form.timeframe,
      score,
      status: "complete",
      date: "Только что",
      revenue: `$${(score * 25000 / 1000).toFixed(1)}M`,
      market: `$${(score * 50).toFixed(0)}M`,
      growth: `+${Math.floor(10 + score / 5)}%/год`,
    };

    // Загружаем существующие пользовательские проекты
    const existing = JSON.parse(localStorage.getItem("apex-user-projects") || "[]");
    localStorage.setItem("apex-user-projects", JSON.stringify([newProject, ...existing]));

    router.push(`/dashboard/projects/${id}`);
  };

  const canNext = () => { if (step === 1) return form.name.trim().length > 0 && form.description.trim().length > 20; if (step === 2) return form.industry && form.stage; return true; };

  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 mb-4 shadow-xl shadow-violet-500/30">
            <svg className="size-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Brief Your Executive Board</h1>
          <p className="text-sm text-white/40">The more detail you provide, the better your strategy will be.</p>
        </div>

        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-white/[0.06]">
              <div className="h-full bg-gradient-to-r from-violet-600 to-blue-500 rounded-full transition-all duration-500" style={{ width: i < step ? "100%" : "0%" }} />
            </div>
          ))}
          <span className="text-xs text-white/30 flex-shrink-0">{step}/{totalSteps}</span>
        </div>

        <div className="glass-strong rounded-2xl p-8 border border-white/[0.08]">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <div className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-1">Step 1</div>
                <h2 className="text-lg font-bold text-white mb-4">Tell us about your business</h2>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/60">Project Name</label>
                <input type="text" placeholder="e.g. AI-Powered Fitness Platform" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 px-4 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/60">Business Description</label>
                <textarea placeholder="Describe your business idea in detail. What problem does it solve? Who are your customers? What makes it unique? What's your business model?" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={7} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 p-4 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all resize-none" />
                <div className="text-right">
                  <span className={`text-xs ${form.description.length > 20 ? "text-emerald-400" : "text-white/25"}`}>
                    {form.description.length} characters{form.description.length < 50 && " (add more detail for better results)"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <div className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-1">Step 2</div>
                <h2 className="text-lg font-bold text-white mb-4">Business context</h2>
              </div>
              <div>
                <label className="text-sm font-medium text-white/60 block mb-3">Industry</label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((ind) => (
                    <button key={ind} onClick={() => setForm((f) => ({ ...f, industry: ind }))} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${form.industry === ind ? "bg-violet-600 text-white border border-violet-500" : "bg-white/[0.04] text-white/40 border border-white/[0.06] hover:text-white/70 hover:border-white/[0.12]"}`}>{ind}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-white/60 block mb-3">Current Stage</label>
                <div className="grid grid-cols-2 gap-3">
                  {STAGES.map((stage) => (
                    <button key={stage.id} onClick={() => setForm((f) => ({ ...f, stage: stage.id }))} className={`p-4 rounded-xl border text-left transition-all duration-200 ${form.stage === stage.id ? "border-violet-500/50 bg-violet-500/10" : "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12]"}`}>
                      <div className={`text-sm font-semibold mb-0.5 ${form.stage === stage.id ? "text-violet-300" : "text-white/70"}`}>{stage.label}</div>
                      <div className="text-xs text-white/30">{stage.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <div className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-1">Step 3</div>
                <h2 className="text-lg font-bold text-white mb-4">Goals & parameters</h2>
              </div>
              <div>
                <label className="text-sm font-medium text-white/60 block mb-3">Primary Goals <span className="text-white/25">(select all that apply)</span></label>
                <div className="flex flex-wrap gap-2">
                  {GOALS.map((goal) => (
                    <button key={goal} onClick={() => handleGoalToggle(goal)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${form.goals.includes(goal) ? "bg-violet-600 text-white border border-violet-500" : "bg-white/[0.04] text-white/40 border border-white/[0.06] hover:text-white/70 hover:border-white/[0.12]"}`}>{goal}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white/60">Revenue Target (optional)</label>
                  <input type="text" placeholder="e.g. $1M ARR" value={form.targetRevenue} onChange={(e) => setForm((f) => ({ ...f, targetRevenue: e.target.value }))} className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 px-4 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white/60">Timeframe</label>
                  <select value={form.timeframe} onChange={(e) => setForm((f) => ({ ...f, timeframe: e.target.value }))} className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white/70 px-4 focus:outline-none focus:border-violet-500/50 transition-all appearance-none cursor-pointer">
                    <option value="3">3 months</option><option value="6">6 months</option><option value="12">12 months</option><option value="24">24 months</option><option value="36">36 months</option>
                  </select>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">Strategy Brief Summary</div>
                <div className="space-y-1.5">
                  {[["Project",form.name||"—"],["Industry",form.industry||"—"],["Stage",STAGES.find((s)=>s.id===form.stage)?.label||"—"],["Goals",form.goals.join(", ")||"—"]].map(([k,v])=>(
                    <div key={k} className="flex gap-2 text-xs"><span className="text-white/30 w-20 flex-shrink-0">{k}:</span><span className="text-white/70">{v}</span></div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.06]">
            <button onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1} className="h-10 px-5 text-sm text-white/40 hover:text-white/70 disabled:opacity-0 transition-all">← Back</button>
            {step < totalSteps ? (
              <button onClick={() => setStep((s) => s + 1)} disabled={!canNext()} className="h-10 px-7 text-sm font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-500 hover:to-blue-500 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed">Continue →</button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="h-10 px-7 text-sm font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-500 hover:to-blue-500 transition-all duration-200 disabled:opacity-70 flex items-center gap-2">
                {loading ? (<><span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Briefing executives…</>) : (<><svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>Launch Strategy</>)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
