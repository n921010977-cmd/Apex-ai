"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", agree: false });
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { setError("Заполните все поля"); return; }
    if (!form.agree) { setError("Примите условия использования"); return; }
    if (form.password.length < 8) { setError("Пароль должен быть не менее 8 символов"); return; }
    setLoading("credentials");
    setError("");
    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      name: form.name,
      redirect: false,
      callbackUrl: "/dashboard",
    });
    setLoading(null);
    if (res?.error) {
      setError("Не удалось создать аккаунт");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  const handleOAuth = (provider: "google" | "github") => {
    setLoading(provider);
    signIn(provider, { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-[#05060A] flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/8 rounded-full blur-[140px]" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
            <div className="size-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-xl shadow-indigo-500/30">
              <svg className="size-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <span className="text-sm font-bold text-white">Apex AI</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1.5">Начните бесплатно</h1>
          <p className="text-sm text-white/35">3 полных анализа бесплатно. Карта не нужна.</p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
          <div className="space-y-2 mb-5">
            <button
              onClick={() => handleOAuth("google")}
              disabled={!!loading}
              className="w-full h-10 flex items-center justify-center gap-3 text-sm font-medium text-white/70 border border-white/[0.08] rounded-xl hover:border-white/[0.15] hover:bg-white/[0.04] transition-all disabled:opacity-50"
            >
              {loading === "google"
                ? <span className="size-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                : <svg className="size-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              }
              Продолжить через Google
            </button>
            <button
              onClick={() => handleOAuth("github")}
              disabled={!!loading}
              className="w-full h-10 flex items-center justify-center gap-3 text-sm font-medium text-white/70 border border-white/[0.08] rounded-xl hover:border-white/[0.15] hover:bg-white/[0.04] transition-all disabled:opacity-50"
            >
              {loading === "github"
                ? <span className="size-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                : <svg className="size-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
              }
              Продолжить через GitHub
            </button>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[11px] text-white/25">или по email</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-white/40 block mb-1.5">Имя</label>
              <input
                type="text"
                placeholder="Ваше имя"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 px-3.5 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-white/40 block mb-1.5">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 px-3.5 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-white/40 block mb-1.5">Пароль</label>
              <input
                type="password"
                placeholder="Минимум 8 символов"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 px-3.5 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
              />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer mt-1">
              <div
                onClick={() => setForm((f) => ({ ...f, agree: !f.agree }))}
                className={`size-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border transition-all cursor-pointer ${form.agree ? "bg-indigo-500 border-indigo-500" : "border-white/[0.15] bg-white/[0.04]"}`}
              >
                {form.agree && <svg className="size-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <span className="text-[11px] text-white/35 leading-relaxed">
                Я принимаю{" "}
                <Link href="#" className="text-indigo-400/70 hover:text-indigo-300 transition-colors">Условия использования</Link>
                {" "}и{" "}
                <Link href="#" className="text-indigo-400/70 hover:text-indigo-300 transition-colors">Политику конфиденциальности</Link>
              </span>
            </label>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/8 border border-red-500/20">
                <svg className="size-3.5 text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!!loading}
              className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-indigo-500 to-indigo-700 text-white rounded-xl hover:from-indigo-400 hover:to-indigo-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
            >
              {loading === "credentials"
                ? <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : "Создать аккаунт"
              }
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] text-white/30 mt-5">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-indigo-400/80 hover:text-indigo-300 transition-colors">Войти</Link>
        </p>
      </div>
    </div>
  );
}
