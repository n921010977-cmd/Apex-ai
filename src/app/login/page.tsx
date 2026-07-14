"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Орбитальная сеть агентов — фирменный визуал из hero (координаты в боксе 500×500, центр 250,250)
const AGENTS = [
  { label: "Ops", color: "#8b5cf6", cx: 170, cy: 75, delay: 0.0 },
  { label: "PM", color: "#f59e0b", cx: 262, cy: 52, delay: 0.4 },
  { label: "SEO", color: "#f59e0b", cx: 352, cy: 92, delay: 0.8 },
  { label: "Growth", color: "#ec4899", cx: 430, cy: 78, delay: 1.2 },
  { label: "HR", color: "#8b5cf6", cx: 92, cy: 122, delay: 1.6 },
  { label: "DevOps", color: "#3b82f6", cx: 330, cy: 160, delay: 2.0 },
  { label: "Legal", color: "#a855f7", cx: 446, cy: 182, delay: 2.4 },
  { label: "Sales", color: "#38bdf8", cx: 148, cy: 202, delay: 0.6 },
  { label: "AI", color: "#06b6d4", cx: 366, cy: 256, delay: 1.0 },
  { label: "CS", color: "#8b5cf6", cx: 58, cy: 266, delay: 1.4 },
  { label: "Data", color: "#14b8a6", cx: 452, cy: 300, delay: 1.8 },
  { label: "Brand", color: "#2dd4bf", cx: 108, cy: 352, delay: 2.2 },
  { label: "UX", color: "#22c55e", cx: 186, cy: 332, delay: 0.5 },
  { label: "Research", color: "#f43f5e", cx: 438, cy: 386, delay: 0.9 },
  { label: "Finance", color: "#3b82f6", cx: 328, cy: 406, delay: 1.3 },
  { label: "COO", color: "#2dd4bf", cx: 150, cy: 420, delay: 1.7 },
  { label: "CEO", color: "#a855f7", cx: 256, cy: 456, delay: 2.1 },
];

function AgentOrbit() {
  return (
    <div className="relative size-[500px] max-w-full">
      {/* Свечение позади */}
      <div className="absolute inset-0 rounded-full bg-violet-600/10 blur-[100px]" />

      {/* Соединительные линии + вращающиеся кольца */}
      <svg viewBox="0 0 500 500" className="absolute inset-0 size-full">
        <defs>
          <radialGradient id="ringFade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.15" />
          </radialGradient>
        </defs>
        {AGENTS.map((a) => (
          <line
            key={a.label}
            x1="250"
            y1="250"
            x2={a.cx}
            y2={a.cy}
            stroke={a.color}
            strokeOpacity="0.15"
            strokeWidth="1"
          />
        ))}
        {AGENTS.map((a) => (
          <circle key={`d-${a.label}`} cx={a.cx} cy={a.cy} r="2" fill={a.color} fillOpacity="0.5" />
        ))}
        <circle cx="250" cy="250" r="130" fill="none" stroke="url(#ringFade)" strokeWidth="1" />
      </svg>

      {/* Вращающиеся орбитальные кольца */}
      <div className="absolute inset-[70px] rounded-full border border-white/[0.05] animate-spin-slow" />
      <div className="absolute inset-[20px] rounded-full border border-violet-500/[0.08]" />

      {/* Центральный узел APEX AI */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          <div className="size-28 rounded-3xl bg-gradient-to-br from-violet-600 to-blue-600 flex flex-col items-center justify-center shadow-2xl shadow-violet-500/40 animate-pulse-glow">
            <svg className="size-9 text-white mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="text-white/90 text-[11px] font-semibold tracking-[0.2em]">APEX AI</span>
          </div>
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-600 to-blue-600 blur-2xl opacity-40" />
        </div>
      </div>

      {/* Теги агентов */}
      {AGENTS.map((a) => (
        <div
          key={`t-${a.label}`}
          className="absolute flex items-center gap-1.5 px-2.5 py-1 rounded-lg border animate-float select-none"
          style={{
            left: a.cx,
            top: a.cy,
            transform: "translate(-50%, -50%)",
            borderColor: `${a.color}40`,
            background: `${a.color}14`,
            backdropFilter: "blur(6px)",
            boxShadow: `0 0 14px ${a.color}22`,
            animationDelay: `${a.delay}s`,
          }}
        >
          <span className="size-1.5 rounded-full" style={{ background: a.color }} />
          <span className="text-[11px] font-semibold" style={{ color: a.color }}>{a.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"idle" | "connecting" | "auth" | "done">("idle");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStep("connecting");
    await new Promise((r) => setTimeout(r, 700));
    setStep("auth");
    await new Promise((r) => setTimeout(r, 800));
    setStep("done");
    await new Promise((r) => setTimeout(r, 450));
    window.location.href = "/dashboard";
  };

  const statusLabels: Record<string, string> = {
    idle: "",
    connecting: "› подключение к серверу apex...",
    auth: "› верификация личности...",
    done: "› доступ разрешён",
  };

  return (
    <div className="relative min-h-screen bg-[#080808] overflow-hidden">
      {/* Фон: сетка + свечения */}
      <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-violet-600/8 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 size-[400px] rounded-full bg-blue-600/6 blur-[100px] pointer-events-none" />

      {/* Хедер — точно как на скриншотах */}
      <header className="fixed top-0 inset-x-0 z-50 py-5 glass border-b border-white/[0.06]">
        <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="size-9 rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <svg className="size-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-300" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-white tracking-tight">APEX</span>
              <span className="text-[11px] text-white/35 tracking-[0.25em] uppercase font-mono">// Command Center</span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {["Продукт", "AI Команда", "Отзывы", "Тарифы", "FAQ"].map((item) => (
              <Link key={item} href="/" className="text-xs text-white/45 hover:text-white transition-colors duration-200 uppercase tracking-widest font-mono">
                {item}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/5">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-emerald-300 font-medium tracking-widest font-mono">20 AGENTS ONLINE</span>
            </div>
            <Link href="/login" className="inline-flex items-center h-9 px-4 text-xs font-medium text-white/80 rounded-xl border border-white/[0.1] hover:border-white/[0.2] hover:text-white transition-all duration-200 uppercase tracking-wider">
              Войти
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center h-9 px-5 text-xs font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-500 hover:to-blue-500 transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/25 uppercase tracking-wider"
            >
              Начать бесплатно
            </Link>
          </div>
        </nav>
      </header>

      {/* Контент */}
      <main className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-28 pb-16">
        <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          {/* Левая колонка — вход */}
          <div
            className={`flex-1 w-full max-w-md transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 mb-6">
              <span className="size-1.5 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-[11px] text-violet-300 font-medium tracking-widest uppercase font-mono">Защищённый вход</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold leading-[1.05] mb-4 tracking-tight">
              <span className="text-white">С возвращением в</span><br />
              <span className="gradient-text">командный центр.</span>
            </h1>
            <p className="text-white/45 mb-8 leading-relaxed">
              Войдите — и 20 AI-директоров снова в вашем распоряжении.
            </p>

            {/* Панель в стиле терминала */}
            <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0c0c0c]/90 backdrop-blur-xl shadow-2xl shadow-black/50">
              {/* Верхняя строка со «светофором» */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-white/[0.015]">
                <div className="flex gap-1.5">
                  <div className="size-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="size-2.5 rounded-full bg-[#febc2e]" />
                  <div className="size-2.5 rounded-full bg-[#28c840]" />
                </div>
                <span className="flex-1 text-[11px] text-white/30 font-mono tracking-widest uppercase">
                  Apex — Авторизация
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-emerald-400/70 font-mono">
                  <span className="size-1.5 rounded-full bg-emerald-400" /> Online
                </span>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Email */}
                <div>
                  <label className="block text-[11px] text-white/35 font-mono mb-2 tracking-widest uppercase">
                    // Email
                  </label>
                  <div className={`relative rounded-xl border transition-all duration-200 ${
                    focused === "email" ? "border-violet-500/50 shadow-lg shadow-violet-500/10" : "border-white/[0.08]"
                  }`}>
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20">
                      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-10 7L2 7" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocused("email")}
                      onBlur={() => setFocused(null)}
                      placeholder="you@company.com"
                      required
                      className="w-full h-11 pl-10 pr-4 bg-white/[0.03] rounded-xl text-white text-sm placeholder-white/20 outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Пароль */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] text-white/35 font-mono tracking-widest uppercase">
                      // Пароль
                    </label>
                    <Link href="/login" className="text-[11px] text-violet-400/60 hover:text-violet-400 transition-colors font-mono">
                      забыли?
                    </Link>
                  </div>
                  <div className={`relative rounded-xl border transition-all duration-200 ${
                    focused === "password" ? "border-violet-500/50 shadow-lg shadow-violet-500/10" : "border-white/[0.08]"
                  }`}>
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20">
                      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <circle cx="12" cy="16" r="1" fill="currentColor" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocused("password")}
                      onBlur={() => setFocused(null)}
                      placeholder="••••••••••••"
                      required
                      className="w-full h-11 pl-10 pr-10 bg-white/[0.03] rounded-xl text-white text-sm placeholder-white/20 outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                    >
                      {showPass ? (
                        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Запомнить */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
                  <span
                    onClick={() => setRemember(!remember)}
                    className={`size-4 rounded flex items-center justify-center border transition-all duration-200 ${
                      remember ? "bg-violet-600 border-violet-600" : "border-white/20 bg-white/[0.03]"
                    }`}
                  >
                    {remember && (
                      <svg className="size-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <span className="text-xs text-white/40 font-mono">запомнить меня на этом устройстве</span>
                </label>

                {/* Статус авторизации */}
                {step !== "idle" && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/5 border border-violet-500/15">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="size-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                    <span className="text-[11px] text-violet-300 font-mono">{statusLabels[step]}</span>
                    {step === "done" && (
                      <svg className="size-3 text-emerald-400 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                )}

                {/* Кнопка входа */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold text-sm hover:from-violet-500 hover:to-blue-500 transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/30 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2 group uppercase tracking-wider"
                >
                  {loading ? (
                    <>
                      <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Авторизация...
                    </>
                  ) : (
                    <>
                      <span className="text-violet-200 group-hover:translate-x-0.5 transition-transform">▸</span>
                      Войти в Apex
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Регистрация */}
            <div className="mt-6 text-center">
              <span className="text-sm text-white/25 font-mono">нет аккаунта? </span>
              <Link href="/dashboard" className="text-sm text-violet-400 hover:text-violet-300 transition-colors font-mono font-medium">
                начать бесплатно →
              </Link>
            </div>
          </div>

          {/* Правая колонка — орбитальная сеть */}
          <div
            className={`flex-1 hidden lg:flex items-center justify-center transition-all duration-1000 delay-200 ${
              mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          >
            <AgentOrbit />
          </div>
        </div>
      </main>

      {/* Нижнее затемнение */}
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#080808] to-transparent pointer-events-none" />
    </div>
  );
}
