"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const EXECUTIVES = [
  { role: "CEO", color: "#7c3aed", x: 15, y: 20, delay: 0 },
  { role: "CFO", color: "#3b82f6", x: 80, y: 15, delay: 0.8 },
  { role: "CMO", color: "#10b981", x: 88, y: 70, delay: 1.6 },
  { role: "CTO", color: "#ec4899", x: 10, y: 75, delay: 2.4 },
  { role: "COO", color: "#f59e0b", x: 50, y: 88, delay: 3.2 },
  { role: "CPO", color: "#06b6d4", x: 75, y: 40, delay: 1.2 },
  { role: "CMO", color: "#8b5cf6", x: 22, y: 50, delay: 2.0 },
];

function FloatingTag({ role, color, x, y, delay }: { role: string; color: string; x: number; y: number; delay: number }) {
  return (
    <div
      className="absolute flex items-center gap-1.5 px-3 py-1.5 rounded-full border animate-float pointer-events-none select-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        borderColor: `${color}40`,
        background: `${color}12`,
        backdropFilter: "blur(8px)",
        animationDelay: `${delay}s`,
        boxShadow: `0 0 16px ${color}25`,
      }}
    >
      <span className="size-1.5 rounded-full animate-pulse" style={{ background: color }} />
      <span className="text-xs font-bold tracking-wider" style={{ color }}>{role}</span>
    </div>
  );
}

function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノ";
    const fontSize = 11;
    const cols = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(cols).fill(1);

    let animId: number;
    const draw = () => {
      ctx.fillStyle = "rgba(8, 8, 8, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(124, 58, 237, 0.15)";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 opacity-40 pointer-events-none" />;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    await new Promise((r) => setTimeout(r, 400));
    window.location.href = "/dashboard";
  };

  const statusLabels: Record<string, string> = {
    idle: "",
    connecting: "Подключение к серверу...",
    auth: "Верификация личности...",
    done: "Доступ разрешён",
  };

  return (
    <div className="relative min-h-screen bg-[#080808] flex items-center justify-center overflow-hidden">
      {/* Matrix rain background */}
      <MatrixRain />

      {/* Grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/3 size-[500px] rounded-full bg-violet-600/8 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 size-[350px] rounded-full bg-blue-600/6 blur-[100px] pointer-events-none" />
      <div className="absolute top-2/3 left-1/4 size-[250px] rounded-full bg-emerald-600/4 blur-[80px] pointer-events-none" />

      {/* Floating executive tags */}
      {EXECUTIVES.map((exec, i) => (
        <FloatingTag key={i} {...exec} />
      ))}

      {/* Navbar */}
      <header className="fixed top-0 inset-x-0 z-50 py-4 glass border-b border-white/[0.06]">
        <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="size-8 rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <svg className="size-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-300" />
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">APEX</div>
              <div className="text-[9px] text-white/35 tracking-widest uppercase">// Command Center</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-300 font-medium tracking-wide">20 AGENTS ONLINE</span>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 h-8 px-4 text-xs font-medium bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-500 hover:to-blue-500 transition-all duration-200"
            >
              НАЧАТЬ БЕСПЛАТНО
            </Link>
          </div>
        </nav>
      </header>

      {/* Login card */}
      <div
        className={`relative z-10 w-full max-w-md mx-4 transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Terminal header */}
        <div className="rounded-t-2xl border border-white/[0.08] border-b-0 bg-[#0a0a0a] px-4 py-3 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="size-3 rounded-full bg-[#ff5f57]" />
            <div className="size-3 rounded-full bg-[#febc2e]" />
            <div className="size-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="flex-1 text-center text-xs text-white/30 font-mono tracking-widest">
            APEX — АВТОРИЗАЦИЯ
          </span>
          <span className="text-xs text-white/20 font-mono">v2.4.1</span>
        </div>

        {/* Main card */}
        <div className="rounded-b-2xl border border-white/[0.08] bg-[#0c0c0c]/90 backdrop-blur-xl p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="size-16 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-2xl shadow-violet-500/40 animate-pulse-glow">
                <svg className="size-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 blur-2xl opacity-40" />
            </div>
            <h1 className="text-xl font-bold text-white mb-1">Войти в систему</h1>
            <p className="text-sm text-white/35 font-mono">
              <span className="text-violet-400">$</span> apex auth --login
            </p>
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button className="flex items-center justify-center gap-2 h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/60 text-sm font-medium hover:bg-white/[0.06] hover:text-white hover:border-white/[0.15] transition-all duration-200 group">
              <svg className="size-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button className="flex items-center justify-center gap-2 h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/60 text-sm font-medium hover:bg-white/[0.06] hover:text-white hover:border-white/[0.15] transition-all duration-200 group">
              <svg className="size-4 fill-white/60 group-hover:fill-white transition-colors" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-white/20 font-mono tracking-wider">или войти через email</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div>
              <label className="block text-xs text-white/35 font-mono mb-2 tracking-wider">
                <span className="text-violet-400/70">›</span> EMAIL
              </label>
              <div className={`relative rounded-xl border transition-all duration-200 ${
                focused === "email"
                  ? "border-violet-500/50 shadow-lg shadow-violet-500/10"
                  : "border-white/[0.08]"
              }`}>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20">
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-10 7L2 7" />
                  </svg>
                </div>
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

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-white/35 font-mono tracking-wider">
                  <span className="text-violet-400/70">›</span> ПАРОЛЬ
                </label>
                <Link href="/forgot-password" className="text-xs text-violet-400/60 hover:text-violet-400 transition-colors font-mono">
                  забыли?
                </Link>
              </div>
              <div className={`relative rounded-xl border transition-all duration-200 ${
                focused === "password"
                  ? "border-violet-500/50 shadow-lg shadow-violet-500/10"
                  : "border-white/[0.08]"
              }`}>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20">
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <circle cx="12" cy="16" r="1" fill="currentColor" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
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

            {/* Status bar */}
            {step !== "idle" && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/5 border border-violet-500/15">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="size-1.5 rounded-full bg-violet-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-violet-300 font-mono">{statusLabels[step]}</span>
                {step === "done" && (
                  <svg className="size-3 text-emerald-400 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold text-sm hover:from-violet-500 hover:to-blue-500 transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/30 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2 group"
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
                  <svg className="size-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
                  </svg>
                  Войти в Apex
                </>
              )}
            </button>
          </form>

          {/* Register link */}
          <div className="mt-6 text-center">
            <span className="text-sm text-white/25 font-mono">нет аккаунта? </span>
            <Link href="/dashboard" className="text-sm text-violet-400 hover:text-violet-300 transition-colors font-mono font-medium">
              начать бесплатно →
            </Link>
          </div>

          {/* Footer note */}
          <div className="mt-6 pt-5 border-t border-white/[0.05]">
            <p className="text-center text-xs text-white/15 font-mono">
              <span className="text-emerald-400/50">●</span> все системы работают · apex v2.4.1
            </p>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#080808] to-transparent pointer-events-none" />
    </div>
  );
}
