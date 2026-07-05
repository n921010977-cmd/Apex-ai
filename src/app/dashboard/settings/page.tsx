"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Building2, Bot, Users, Bell, Shield, Key, Link2,
  CreditCard, BarChart2, Globe, Palette, Settings2,
  Camera, ChevronRight, Check, Copy, Eye, EyeOff,
  Plus, Trash2, ExternalLink, Crown,
  Smartphone, Monitor, Laptop, LogOut, AlertTriangle,
  Moon, Sun, Download, Loader2, X, CheckCircle2,
  MessageSquare, Phone,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Settings {
  language: string;
  timezone: string;
  theme: string;
  ai_model: string;
  email_notifs: boolean;
  push_notifs: boolean;
  two_fa: boolean;
  preferences: Record<string, unknown>;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 9999,
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 16px", borderRadius: 14,
        background: type === "success" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.1)",
        border: `1px solid ${type === "success" ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.3)"}`,
        backdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {type === "success"
        ? <CheckCircle2 size={15} style={{ color: "#10b981", flexShrink: 0 }} />
        : <AlertTriangle size={15} style={{ color: "#ef4444", flexShrink: 0 }} />}
      <span style={{ fontSize: 13, fontWeight: 600, color: type === "success" ? "#10b981" : "#ef4444" }}>{msg}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", marginLeft: 4 }}>
        <X size={12} />
      </button>
    </motion.div>
  );
}

// ─── Nav sections ─────────────────────────────────────────────────────────────

const NAV = [
  { id: "profile",       label: "Профиль",              icon: User,        group: "Аккаунт" },
  { id: "workspace",     label: "Рабочее пространство",  icon: Building2,   group: "Аккаунт" },
  { id: "ai",            label: "AI Ассистент",          icon: Bot,         group: "Аккаунт" },
  { id: "team",          label: "Команда",                icon: Users,       group: "Аккаунт" },
  { id: "notifications", label: "Уведомления",            icon: Bell,        group: "Система" },
  { id: "security",      label: "Безопасность",           icon: Shield,      group: "Система" },
  { id: "api",           label: "API & Webhooks",         icon: Key,         group: "Система" },
  { id: "integrations",  label: "Интеграции",             icon: Link2,       group: "Система" },
  { id: "subscription",  label: "Подписка",               icon: CreditCard,  group: "Биллинг" },
  { id: "usage",         label: "Использование",          icon: BarChart2,   group: "Биллинг" },
  { id: "language",      label: "Язык и регион",          icon: Globe,       group: "Настройки" },
  { id: "appearance",    label: "Внешний вид",            icon: Palette,     group: "Настройки" },
  { id: "advanced",      label: "Дополнительно",          icon: Settings2,   group: "Настройки" },
];

const DESCRIPTIONS: Record<string, string> = {
  profile:       "Управляй публичным профилем и личными данными",
  workspace:     "Настройки организации, бренда и рабочего пространства",
  ai:            "Конфигурация AI-ассистента и 20 агентов совета директоров",
  team:          "Управление участниками и правами доступа",
  notifications: "Контролируй как и когда ты получаешь уведомления",
  security:      "Защита аккаунта, сессии и двухфакторная аутентификация",
  api:           "API-ключи, вебхуки и интеграция через SDK",
  integrations:  "Подключи сторонние сервисы к Apex AI",
  subscription:  "Тарифный план, лимиты и история платежей",
  usage:         "Мониторинг потребления AI и ресурсов",
  language:      "Язык интерфейса, регион и форматы",
  appearance:    "Тема, цвета и визуальные настройки",
  advanced:      "Экспериментальные функции и управление данными",
};

// ─── UI atoms ─────────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{
        position: "relative", width: 44, height: 24, borderRadius: 12,
        background: on ? "#6366f1" : "rgba(255,255,255,0.1)",
        border: "none", cursor: "pointer", transition: "background 0.25s", flexShrink: 0,
        boxShadow: on ? "0 0 12px rgba(99,102,241,0.45)" : "none",
      }}
    >
      <motion.div
        animate={{ x: on ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{ position: "absolute", top: 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
      />
    </button>
  );
}

function FieldInput({
  label, value, onChange, type = "text", placeholder, hint, disabled,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; hint?: string; disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={isPassword && !showPw ? "password" : isPassword ? "text" : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%", padding: isPassword ? "10px 40px 10px 14px" : "10px 14px",
            borderRadius: 10, border: `1px solid ${focused ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)"}`,
            background: disabled ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
            color: disabled ? "rgba(255,255,255,0.3)" : "#fff", fontSize: 13,
            outline: "none", transition: "border-color 0.18s", boxSizing: "border-box",
            fontFamily: "inherit",
          }}
        />
        {isPassword && (
          <button onClick={() => setShowPw(p => !p)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}>
            {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        )}
      </div>
      {hint && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function FieldSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13, outline: "none", cursor: "pointer", boxSizing: "border-box" }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Section({ title, desc, children, accent }: { title: string; desc?: string; children: React.ReactNode; accent?: string }) {
  return (
    <div style={{ borderRadius: 18, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: 14, boxShadow: "0 1px 2px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.18)" }}>
      <div style={{ padding: "16px 22px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
        {accent && <div style={{ width: 3, height: 20, borderRadius: 2, background: accent, flexShrink: 0 }} />}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{title}</div>
          {desc && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{desc}</div>}
        </div>
      </div>
      <div style={{ padding: "18px 22px" }}>{children}</div>
    </div>
  );
}

function Row({ label, desc, children, last }: { label: string; desc?: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, paddingBottom: last ? 0 : 14, marginBottom: last ? 0 : 14, borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function SaveBar({ onSave, loading }: { onSave: () => void; loading: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4, marginBottom: 4 }}>
      <button
        onClick={onSave}
        disabled={loading}
        style={{
          padding: "10px 22px", borderRadius: 11, fontSize: 13, fontWeight: 700,
          border: "none", background: "linear-gradient(135deg, #6366f1, #4f46e5)",
          color: "#fff", cursor: loading ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", gap: 7,
          boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
          opacity: loading ? 0.7 : 1,
          transition: "opacity 0.2s",
        }}
      >
        {loading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={13} />}
        {loading ? "Сохранение..." : "Сохранить изменения"}
      </button>
    </div>
  );
}

// ─── Panels ───────────────────────────────────────────────────────────────────

function ProfilePanel({ showToast }: { showToast: (m: string, t: "success"|"error") => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ firstName: "Founder", lastName: "", email: "", phone: "", title: "", company: "", country: "Россия", timezone: "GMT+3 (Москва)", bio: "AI-driven founder building the future of executive intelligence." });

  useEffect(() => {
    fetch("/api/user").then(r => r.json()).then(d => {
      if (d.data) {
        const name = (d.data.name || "").split(" ");
        setForm(f => ({ ...f, firstName: name[0] || "Founder", lastName: name.slice(1).join(" ") || "", email: d.data.email || "" }));
      }
    }).catch(() => {});
  }, []);

  const save = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/user", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: `${form.firstName} ${form.lastName}`.trim() }) });
      const d = await r.json();
      if (d.success) showToast("Профиль сохранён", "success");
      else showToast(d.error || "Ошибка сохранения", "error");
    } catch { showToast("Ошибка сети", "error"); }
    finally { setLoading(false); }
  };

  const upd = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <Section title="Публичный профиль" desc="Отображается для вашей команды и партнёров" accent="#6366f1">
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 22, paddingBottom: 22, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: 68, height: 68, borderRadius: 20, background: "linear-gradient(135deg, #6366f1, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, color: "#fff", boxShadow: "0 8px 24px rgba(99,102,241,0.4)" }}>
              {form.firstName[0] || "F"}
            </div>
            <button style={{ position: "absolute", bottom: -4, right: -4, width: 22, height: 22, borderRadius: "50%", background: "#6366f1", border: "2px solid #07090F", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Camera size={9} color="#fff" />
            </button>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{form.firstName} {form.lastName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 10 }}>{form.email || "email не указан"}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>Загрузить фото</button>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FieldInput label="Имя" value={form.firstName} onChange={upd("firstName")} placeholder="Имя" />
          <FieldInput label="Фамилия" value={form.lastName} onChange={upd("lastName")} placeholder="Фамилия" />
          <FieldInput label="Email" value={form.email} onChange={upd("email")} type="email" placeholder="you@company.com" />
          <FieldInput label="Телефон" value={form.phone} onChange={upd("phone")} placeholder="+7 (999) 000-00-00" />
          <FieldInput label="Должность" value={form.title} onChange={upd("title")} placeholder="CEO, Product Manager..." />
          <FieldInput label="Компания" value={form.company} onChange={upd("company")} placeholder="My Startup" />
          <FieldInput label="Страна" value={form.country} onChange={upd("country")} placeholder="Россия" />
          <FieldInput label="Часовой пояс" value={form.timezone} onChange={upd("timezone")} placeholder="GMT+3" />
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>О себе</label>
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            placeholder="Краткое описание..."
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13, outline: "none", resize: "none", height: 72, boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.6 }}
          />
        </div>
      </Section>
      <SaveBar onSave={save} loading={loading} />
    </div>
  );
}

function WorkspacePanel({ showToast }: { showToast: (m: string, t: "success"|"error") => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "Apex AI", domain: "apex-ai.workspace", industry: "", teamSize: "", description: "", accent: "#6366f1" });
  const upd = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ preferences: { workspace: form } }) });
      const d = await r.json();
      if (d.success) showToast("Рабочее пространство сохранено", "success");
      else showToast(d.error || "Ошибка", "error");
    } catch { showToast("Ошибка сети", "error"); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <Section title="Организация" desc="Основная информация о вашей компании" accent="#6366f1">
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg, #6366f1, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff" }}>A</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{form.name || "Apex AI Workspace"}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{form.domain} · Starter Plan</div>
          </div>
          <button style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Camera size={11} />Логотип
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FieldInput label="Название" value={form.name} onChange={upd("name")} placeholder="My Startup" />
          <FieldInput label="Домен" value={form.domain} onChange={upd("domain")} hint="workspace.apex-ai.com" />
          <FieldSelect label="Отрасль" value={form.industry} onChange={upd("industry")} options={["","SaaS / Software","E-commerce","FinTech","EdTech","Healthcare","Marketplace","Other"]} />
          <FieldSelect label="Размер команды" value={form.teamSize} onChange={upd("teamSize")} options={["","1–5","6–20","21–50","51–200","200+"]} />
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Описание компании</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Что делает ваша компания?"
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13, outline: "none", resize: "none", height: 72, boxSizing: "border-box", fontFamily: "inherit" }}
          />
        </div>
      </Section>
      <Section title="Акцентный цвет" desc="Основной цвет вашего бренда" accent="#8b5cf6">
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {["#6366f1","#4f46e5","#10b981","#ef4444","#f59e0b","#8b5cf6","#f43f5e","#3b82f6"].map(c => (
            <button key={c} onClick={() => setForm(f => ({ ...f, accent: c }))} style={{ position: "relative", width: 32, height: 32, borderRadius: 10, background: c, border: form.accent === c ? "2px solid #fff" : "2px solid transparent", cursor: "pointer", transition: "all 0.2s", boxShadow: form.accent === c ? `0 0 14px ${c}80` : "none" }}>
              {form.accent === c && <Check size={13} color="#fff" style={{ position: "absolute", inset: 0, margin: "auto" }} />}
            </button>
          ))}
        </div>
      </Section>
      <SaveBar onSave={save} loading={loading} />
    </div>
  );
}

function AIPanel({ settings, onUpdate, showToast }: { settings: Settings; onUpdate: (p: Partial<Settings>) => void; showToast: (m: string, t: "success"|"error") => void }) {
  const [model, setModel] = useState(settings.ai_model || "claude-sonnet-5");
  const [creativity, setCreativity] = useState(65);
  const [tone, setTone] = useState("Нейтральный");
  const [memory, setMemory] = useState(true);
  const [auto, setAuto] = useState(false);
  const [instructions, setInstructions] = useState("Я основатель AI-стартапа. Фокус на growth, product-market fit и эффективности команды. Отвечай структурированно, используй цифры.");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ai_model: model, preferences: { creativity, tone, memory, auto, instructions } }) });
      const d = await r.json();
      if (d.success) { onUpdate({ ai_model: model }); showToast("Настройки AI сохранены", "success"); }
      else showToast(d.error || "Ошибка", "error");
    } catch { showToast("Ошибка сети", "error"); }
    finally { setLoading(false); }
  };

  const MODELS = [
    { id: "claude-sonnet-5", name: "Claude Sonnet 5", desc: "Баланс скорости и качества", badge: "Рекомендовано", color: "#6366f1" },
    { id: "claude-opus-4-8", name: "Claude Opus 4.8", desc: "Максимальное качество",      badge: "Pro",           color: "#10b981" },
    { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", desc: "Максимальная скорость", badge: null, color: "#4f46e5" },
  ];

  return (
    <div>
      <Section title="Модель AI" desc="Выберите мощность и скорость для агентов" accent="#8b5cf6">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {MODELS.map(m => (
            <button key={m.id} onClick={() => setModel(m.id)} style={{ borderRadius: 14, padding: "16px 14px", background: model === m.id ? `rgba(${m.color === "#6366f1" ? "99,102,241" : m.color === "#10b981" ? "16,185,129" : "79,70,229"},0.12)` : "rgba(255,255,255,0.03)", border: `1.5px solid ${model === m.id ? m.color : "rgba(255,255,255,0.07)"}`, cursor: "pointer", textAlign: "left", transition: "all 0.2s", position: "relative" }}>
              {m.badge && <div style={{ position: "absolute", top: 8, right: 8, fontSize: 8.5, padding: "2px 7px", borderRadius: 5, background: `${m.color}22`, color: m.color, fontWeight: 700, letterSpacing: "0.05em" }}>{m.badge}</div>}
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${m.color}18`, border: `1px solid ${m.color}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <Bot size={13} style={{ color: m.color }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: model === m.id ? "#fff" : "rgba(255,255,255,0.6)", marginBottom: 3 }}>{m.name}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{m.desc}</div>
              {model === m.id && (
                <div style={{ position: "absolute", bottom: 10, right: 12, width: 16, height: 16, borderRadius: "50%", background: m.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={9} color="#fff" />
                </div>
              )}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Поведение" desc="Стиль и параметры ответов" accent="#6366f1">
        <Row label="Уровень креативности" desc={`Температура: ${(creativity / 100).toFixed(2)}`}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>Точный</span>
            <input type="range" min={0} max={100} value={creativity} onChange={e => setCreativity(+e.target.value)} style={{ width: 120, accentColor: "#6366f1" }} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>Творческий</span>
          </div>
        </Row>
        <Row label="Стиль общения" desc="Тон и манера ответов AI">
          <div style={{ display: "flex", gap: 6 }}>
            {["Формальный","Нейтральный","Дружелюбный"].map(s => (
              <button key={s} onClick={() => setTone(s)} style={{ padding: "5px 10px", borderRadius: 7, fontSize: 10, fontWeight: 600, border: `1px solid ${tone === s ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`, background: tone === s ? "rgba(99,102,241,0.12)" : "transparent", color: tone === s ? "#8b5cf6" : "rgba(255,255,255,0.4)", cursor: "pointer" }}>{s}</button>
            ))}
          </div>
        </Row>
        <Row label="Память сессий" desc="AI помнит контекст между сессиями">
          <Toggle on={memory} onChange={() => setMemory(m => !m)} />
        </Row>
        <Row label="Автозапуск агентов" desc="Автоматически при создании нового проекта" last>
          <Toggle on={auto} onChange={() => setAuto(a => !a)} />
        </Row>
      </Section>

      <Section title="Персональные инструкции" desc="Контекст применяется ко всем 20 AI-агентам" accent="#10b981">
        <textarea
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
          placeholder="Опиши себя, своё дело и как агенты должны отвечать..."
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13, outline: "none", resize: "none", height: 100, boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.65 }}
        />
        <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.22)", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
          {instructions.length} символов · применяется ко всем агентам
        </div>
      </Section>
      <SaveBar onSave={save} loading={loading} />
    </div>
  );
}

function TeamPanel({ showToast }: { showToast: (m: string, t: "success"|"error") => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Редактор");
  const [sending, setSending] = useState(false);

  const MEMBERS = [
    { name: "Founder",  email: "founder@example.com",  role: "Владелец",      avatar: "F", color: "#6366f1", online: true  },
    { name: "Alex Kim", email: "alex@example.com",      role: "Администратор", avatar: "A", color: "#4f46e5", online: true  },
    { name: "Sara M.",  email: "sara@example.com",      role: "Редактор",      avatar: "S", color: "#10b981", online: false },
    { name: "James L.", email: "james@example.com",     role: "Наблюдатель",   avatar: "J", color: "#f59e0b", online: false },
  ];

  const invite = async () => {
    if (!email.includes("@")) { showToast("Введите корректный email", "error"); return; }
    setSending(true);
    await new Promise(r => setTimeout(r, 1000));
    showToast(`Приглашение отправлено на ${email}`, "success");
    setEmail("");
    setSending(false);
  };

  return (
    <div>
      <Section title="Участники команды" desc={`${MEMBERS.length} из 5 мест заняты (Starter)`} accent="#6366f1">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {MEMBERS.map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", transition: "background 0.15s" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${m.color}, ${m.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>{m.avatar}</div>
                {m.online && <div style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8, borderRadius: "50%", background: "#10b981", border: "2px solid #07090F" }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{m.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</div>
              </div>
              <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 7, fontWeight: 700, background: m.role === "Владелец" ? "rgba(99,102,241,0.12)" : m.role === "Администратор" ? "rgba(79,70,229,0.1)" : m.role === "Редактор" ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.06)", color: m.role === "Владелец" ? "#6366f1" : m.role === "Администратор" ? "#818cf8" : m.role === "Редактор" ? "#10b981" : "rgba(255,255,255,0.4)" }}>{m.role}</span>
              {m.role !== "Владелец" && <button style={{ width: 28, height: 28, borderRadius: 7, background: "transparent", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={11} style={{ color: "#ef4444" }} /></button>}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Пригласить участника" accent="#10b981">
        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && invite()}
            placeholder="email@company.com"
            style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13, outline: "none" }}
          />
          <select value={role} onChange={e => setRole(e.target.value)} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", fontSize: 12, outline: "none" }}>
            <option>Редактор</option><option>Наблюдатель</option><option>Администратор</option>
          </select>
          <button onClick={invite} disabled={sending} style={{ padding: "10px 18px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff", cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6, opacity: sending ? 0.7 : 1 }}>
            {sending ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : null}
            {sending ? "Отправка..." : "Пригласить"}
          </button>
        </div>
      </Section>
    </div>
  );
}

function NotificationsPanel({ settings, onUpdate, showToast }: { settings: Settings; onUpdate: (p: Partial<Settings>) => void; showToast: (m: string, t: "success"|"error") => void }) {
  const [emailOn, setEmailOn] = useState(settings.email_notifs);
  const [pushOn, setPushOn] = useState(settings.push_notifs);
  const [states, setStates] = useState({ email_insights: true, email_product: false, email_report: true, tg: false, slack: false, discord: false, sms: false, weekly: true, ai_alerts: true });
  const tog = (k: keyof typeof states) => setStates(s => ({ ...s, [k]: !s[k] }));
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email_notifs: emailOn, push_notifs: pushOn, preferences: { notif_details: states } }) });
      const d = await r.json();
      if (d.success) { onUpdate({ email_notifs: emailOn, push_notifs: pushOn }); showToast("Уведомления сохранены", "success"); }
      else showToast(d.error || "Ошибка", "error");
    } catch { showToast("Ошибка сети", "error"); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <Section title="Email-уведомления" desc="Контролируй что приходит на почту" accent="#6366f1">
        <Row label="Email-уведомления" desc="Включить все уведомления на email">
          <Toggle on={emailOn} onChange={() => setEmailOn(v => !v)} />
        </Row>
        <Row label="Завершение AI-анализа" desc="Когда 20 агентов завершили отчёт">
          <Toggle on={states.email_insights} onChange={() => tog("email_insights")} />
        </Row>
        <Row label="Обновления продукта" desc="Новые функции и улучшения">
          <Toggle on={states.email_product} onChange={() => tog("email_product")} />
        </Row>
        <Row label="Ежедневный дайджест" desc="Сводка в 18:00" last>
          <Toggle on={states.email_report} onChange={() => tog("email_report")} />
        </Row>
      </Section>

      <Section title="Push и мессенджеры" accent="#8b5cf6">
        {([
          { key: "push" as const,    label: "Push-уведомления", desc: "В браузере и мобильном", Icon: Bell },
          { key: "tg" as const,      label: "Telegram",          desc: "@ApexAI_bot",             Icon: MessageSquare },
          { key: "slack" as const,   label: "Slack",             desc: "Подключить workspace",    Icon: MessageSquare },
          { key: "discord" as const, label: "Discord",           desc: "Подключить сервер",       Icon: MessageSquare },
          { key: "sms" as const,     label: "SMS",               desc: "Критичные алерты",        Icon: Phone },
        ] as const).map(({ key, label, desc, Icon }, i, arr) => (
          <Row key={key} label={label} desc={desc} last={i === arr.length - 1}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon size={14} style={{ color: "rgba(255,255,255,0.2)" }} />
              <Toggle on={key === "push" ? pushOn : states[key as keyof typeof states] as boolean} onChange={() => key === "push" ? setPushOn(v => !v) : tog(key as keyof typeof states)} />
            </div>
          </Row>
        ))}
      </Section>

      <Section title="Дайджесты" accent="#10b981">
        <Row label="Еженедельный обзор" desc="Каждый понедельник в 9:00">
          <Toggle on={states.weekly} onChange={() => tog("weekly")} />
        </Row>
        <Row label="AI-алерты" desc="Срочные события требуют внимания" last>
          <Toggle on={states.ai_alerts} onChange={() => tog("ai_alerts")} />
        </Row>
      </Section>
      <SaveBar onSave={save} loading={loading} />
    </div>
  );
}

function SecurityPanel({ settings, onUpdate, showToast }: { settings: Settings; onUpdate: (p: Partial<Settings>) => void; showToast: (m: string, t: "success"|"error") => void }) {
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [twoFA, setTwoFA] = useState(settings.two_fa);
  const [pwLoading, setPwLoading] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);

  const SESSIONS = [
    { device: "MacBook Pro", location: "Москва, Россия", time: "Сейчас", Icon: Laptop, current: true },
    { device: "iPhone 15",   location: "Москва, Россия", time: "2 часа назад", Icon: Smartphone, current: false },
    { device: "Chrome / Windows", location: "Санкт-Петербург", time: "3 дня назад", Icon: Monitor, current: false },
  ];

  const savePw = async () => {
    if (!pw.current || !pw.next) { showToast("Заполните все поля пароля", "error"); return; }
    if (pw.next !== pw.confirm) { showToast("Пароли не совпадают", "error"); return; }
    if (pw.next.length < 8) { showToast("Минимум 8 символов", "error"); return; }
    setPwLoading(true);
    await new Promise(r => setTimeout(r, 900));
    showToast("Пароль обновлён", "success");
    setPw({ current: "", next: "", confirm: "" });
    setPwLoading(false);
  };

  const toggle2FA = async () => {
    setTwoFALoading(true);
    const next = !twoFA;
    try {
      const r = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ two_fa: next }) });
      const d = await r.json();
      if (d.success) { setTwoFA(next); onUpdate({ two_fa: next }); showToast(next ? "2FA включена" : "2FA отключена", "success"); }
      else showToast(d.error || "Ошибка", "error");
    } catch { showToast("Ошибка сети", "error"); }
    finally { setTwoFALoading(false); }
  };

  return (
    <div>
      <Section title="Смена пароля" accent="#6366f1">
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
          <FieldInput label="Текущий пароль" type="password" value={pw.current} onChange={v => setPw(p => ({ ...p, current: v }))} placeholder="••••••••" />
          <FieldInput label="Новый пароль" type="password" value={pw.next} onChange={v => setPw(p => ({ ...p, next: v }))} placeholder="••••••••" hint="Минимум 8 символов" />
          <FieldInput label="Подтвердить" type="password" value={pw.confirm} onChange={v => setPw(p => ({ ...p, confirm: v }))} placeholder="••••••••" />
          <button onClick={savePw} disabled={pwLoading} style={{ padding: "10px 20px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, width: "fit-content", opacity: pwLoading ? 0.7 : 1 }}>
            {pwLoading ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={12} />}
            {pwLoading ? "Сохранение..." : "Обновить пароль"}
          </button>
        </div>
      </Section>

      <Section title="Двухфакторная аутентификация" desc="Дополнительный уровень защиты аккаунта" accent={twoFA ? "#10b981" : "#f59e0b"}>
        <Row label="2FA через приложение" desc="Google Authenticator, Authy" last>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {twoFALoading && <Loader2 size={13} style={{ color: "#6366f1", animation: "spin 1s linear infinite" }} />}
            <Toggle on={twoFA} onChange={toggle2FA} />
          </div>
        </Row>
        {twoFA && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
              <CheckCircle2 size={13} />2FA включена — ваш аккаунт защищён
            </div>
          </motion.div>
        )}
      </Section>

      <Section title="Активные сессии" desc="Устройства, подключённые к вашему аккаунту" accent="#8b5cf6">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SESSIONS.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 12, background: s.current ? "rgba(99,102,241,0.07)" : "rgba(255,255,255,0.025)", border: `1px solid ${s.current ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)"}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <s.Icon size={16} style={{ color: s.current ? "#6366f1" : "rgba(255,255,255,0.3)" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                  {s.device}
                  {s.current && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 5, background: "rgba(16,185,129,0.12)", color: "#10b981", fontWeight: 700 }}>Текущая</span>}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{s.location} · {s.time}</div>
              </div>
              {!s.current && <button onClick={() => showToast("Сессия завершена", "success")} style={{ padding: "5px 10px", borderRadius: 7, fontSize: 10, fontWeight: 600, border: "1px solid rgba(239,68,68,0.25)", background: "transparent", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <LogOut size={10} />Завершить
              </button>}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function APIPanel({ showToast }: { showToast: (m: string, t: "success"|"error") => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [webhook, setWebhook] = useState("");
  const [webhookSaving, setWebhookSaving] = useState(false);

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    }).catch(() => showToast("Не удалось скопировать", "error"));
  };

  const KEYS = [
    { name: "Production API Key", key: "sk-apex-prod-••••••••••••••••Kx9f", created: "1 янв 2025", last: "2 мин назад", scope: "Полный доступ", scopeColor: "#10b981" },
    { name: "Analytics Read-Only", key: "sk-apex-ro-••••••••••••••••mN2p",  created: "15 фев 2025",last: "Никогда",     scope: "Только чтение", scopeColor: "#f59e0b" },
  ];

  const saveWebhook = async () => {
    if (!webhook.startsWith("http")) { showToast("Введите корректный URL", "error"); return; }
    setWebhookSaving(true);
    const r = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ preferences: { webhook_url: webhook } }) });
    const d = await r.json();
    if (d.success) showToast("Webhook сохранён", "success");
    else showToast(d.error || "Ошибка", "error");
    setWebhookSaving(false);
  };

  return (
    <div>
      <Section title="API Keys" desc="Управление ключами доступа к Apex AI API" accent="#6366f1">
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          {KEYS.map((k, i) => (
            <div key={i} style={{ borderRadius: 12, padding: "16px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{k.name}</div>
                <span style={{ fontSize: 9.5, padding: "3px 9px", borderRadius: 6, background: `${k.scopeColor}15`, color: k.scopeColor, fontWeight: 700 }}>{k.scope}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.25)", borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
                <code style={{ flex: 1, fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: "ui-monospace,monospace" }}>{k.key}</code>
                <button onClick={() => copy(k.name, k.key)} style={{ background: "transparent", border: "none", cursor: "pointer", color: copied === k.name ? "#10b981" : "rgba(255,255,255,0.3)", flexShrink: 0 }}>
                  {copied === k.name ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)" }}>Создан: {k.created}</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)" }}>Использован: {k.last}</span>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => showToast("Новый ключ создан (заглушка)", "success")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: "1px dashed rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.06)", color: "#8b5cf6", cursor: "pointer" }}>
          <Plus size={13} />Создать новый ключ
        </button>
      </Section>

      <Section title="Webhooks" desc="Отправляй события на ваш сервер в реальном времени" accent="#8b5cf6">
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <input
            value={webhook}
            onChange={e => setWebhook(e.target.value)}
            placeholder="https://your-server.com/webhook"
            style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13, outline: "none" }}
          />
          <button onClick={saveWebhook} disabled={webhookSaving} style={{ padding: "10px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, opacity: webhookSaving ? 0.7 : 1 }}>
            {webhookSaving ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : null}
            {webhookSaving ? "Сохранение..." : "Добавить"}
          </button>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
          <ExternalLink size={11} />Документация SDK
        </button>
      </Section>
    </div>
  );
}

function IntegrationsPanel({ showToast }: { showToast: (m: string, t: "success"|"error") => void }) {
  const [connected, setConnected] = useState<Record<string, boolean>>({ slack: true, notion: false, github: false, jira: false, google: true, zapier: false });
  const [saving, setSaving] = useState<string | null>(null);

  const toggle = async (id: string) => {
    setSaving(id);
    const next = !connected[id];
    await new Promise(r => setTimeout(r, 700));
    setConnected(s => ({ ...s, [id]: next }));
    showToast(`${id} ${next ? "подключён" : "отключён"}`, "success");
    setSaving(null);
  };

  const INTEGRATIONS = [
    { id: "slack",  name: "Slack",   desc: "Уведомления в каналы",          color: "#4A154B", rgb: "74,21,75",   logo: "S" },
    { id: "notion", name: "Notion",  desc: "Экспорт отчётов",               color: "#fff",    rgb: "255,255,255",logo: "N" },
    { id: "github", name: "GitHub",  desc: "Связь с репозиториями",         color: "#e2e8f0", rgb: "226,232,240", logo: "G" },
    { id: "jira",   name: "Jira",    desc: "Создание задач из AI-инсайтов", color: "#0052CC", rgb: "0,82,204",   logo: "J" },
    { id: "google", name: "Google",  desc: "Analytics и Workspace",         color: "#4285F4", rgb: "66,133,244",  logo: "G" },
    { id: "zapier", name: "Zapier",  desc: "Автоматизация рабочих потоков", color: "#FF4A00", rgb: "255,74,0",   logo: "Z" },
  ];

  return (
    <div>
      <Section title="Интеграции" desc="Подключи внешние сервисы к Apex AI" accent="#6366f1">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {INTEGRATIONS.map(int => (
            <div key={int.id} style={{ borderRadius: 14, padding: "16px", background: connected[int.id] ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.025)", border: `1px solid ${connected[int.id] ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.06)"}`, display: "flex", alignItems: "center", gap: 14, transition: "all 0.2s" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `rgba(${int.rgb},0.15)`, border: `1px solid rgba(${int.rgb},0.2)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{int.logo}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{int.name}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{int.desc}</div>
              </div>
              {saving === int.id
                ? <Loader2 size={16} style={{ color: "#6366f1", animation: "spin 1s linear infinite", flexShrink: 0 }} />
                : <Toggle on={connected[int.id]} onChange={() => toggle(int.id)} />}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function SubscriptionPanel() {
  const FEATURES = [
    { label: "AI-анализов в месяц", used: 3, limit: 3, color: "#ef4444" },
    { label: "Активных проектов",   used: 1, limit: 1, color: "#f59e0b" },
    { label: "Членов команды",      used: 4, limit: 5, color: "#10b981" },
    { label: "Хранилище (GB)",      used: 0.8, limit: 5, color: "#4f46e5" },
  ];

  return (
    <div>
      <div style={{ borderRadius: 18, padding: "24px", background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(79,70,229,0.07))", border: "1px solid rgba(99,102,241,0.22)", marginBottom: 14, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)" }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>Starter</div>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 8, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>Текущий план</span>
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 16 }}>$0 / месяц · Бесплатно навсегда</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["3 AI-анализа/мес","1 проект","5 участников","5 GB"].map(f => (
                <span key={f} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 7, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)" }}>{f}</span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <button style={{ padding: "11px 22px", borderRadius: 12, fontSize: 13, fontWeight: 800, border: "none", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 7, boxShadow: "0 4px 20px rgba(99,102,241,0.4)" }}>
              <Crown size={14} />Upgrade to Pro
            </button>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 6 }}>от $29/месяц</div>
          </div>
        </div>
      </div>

      <Section title="Использование в этом месяце" accent="#6366f1">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {FEATURES.map((f, i) => (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{f.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: f.used / f.limit >= 1 ? f.color : "rgba(255,255,255,0.55)", fontFamily: "monospace" }}>{f.used} / {f.limit}</span>
              </div>
              <div style={{ height: 5, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (f.used / f.limit) * 100)}%` }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  style={{ height: "100%", borderRadius: 4, background: f.color, boxShadow: `0 0 8px ${f.color}60` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function UsagePanel() {
  const USAGE = [
    { label: "AI-запросов",    used: 284,  limit: 300,  color: "#6366f1" },
    { label: "Токенов (тыс.)", used: 1820, limit: 2000, color: "#4f46e5" },
    { label: "Отчётов",        used: 3,    limit: 3,    color: "#ef4444" },
    { label: "Агент-часов",    used: 12,   limit: 20,   color: "#10b981" },
  ];

  return (
    <div>
      <Section title="Использование AI" desc="Расчётный период: 1–31 июля 2026" accent="#6366f1">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 }}>
          {USAGE.map((u, i) => (
            <div key={i} style={{ borderRadius: 14, padding: "18px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1.5, background: `linear-gradient(90deg, transparent, ${u.color}60, transparent)` }} />
              <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 2, fontFamily: "ui-monospace,monospace" }}>
                {u.used}<span style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>/{u.limit}</span>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>{u.label}</div>
              <div style={{ height: 4, borderRadius: 3, background: "rgba(255,255,255,0.06)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (u.used / u.limit) * 100)}%` }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.8 }}
                  style={{ height: "100%", borderRadius: 3, background: u.color, boxShadow: `0 0 6px ${u.color}60` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Следующий сброс" accent="#f59e0b">
        <Row label="Лимиты обновятся" desc="1 августа 2026 в 00:00 UTC" last>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b", fontFamily: "monospace" }}>29 дней</div>
        </Row>
      </Section>
    </div>
  );
}

function LanguagePanel({ settings, onUpdate, showToast }: { settings: Settings; onUpdate: (p: Partial<Settings>) => void; showToast: (m: string, t: "success"|"error") => void }) {
  const [lang, setLang] = useState(settings.language || "ru");
  const [tz, setTz] = useState(settings.timezone || "Europe/Moscow");
  const [aiLang, setAiLang] = useState("Русский");
  const [dateFormat, setDateFormat] = useState("ДД.ММ.ГГГГ");
  const [currency, setCurrency] = useState("RUB (₽)");
  const [weekStart, setWeekStart] = useState("Понедельник");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language: lang, timezone: tz }) });
      const d = await r.json();
      if (d.success) { onUpdate({ language: lang, timezone: tz }); showToast("Язык и регион сохранены", "success"); }
      else showToast(d.error || "Ошибка", "error");
    } catch { showToast("Ошибка сети", "error"); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <Section title="Язык и регион" accent="#6366f1">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FieldSelect label="Язык интерфейса" value={lang} onChange={setLang} options={["ru","en","zh","es","de"]} />
          <FieldSelect label="Язык AI-ответов" value={aiLang} onChange={setAiLang} options={["Русский","English","中文"]} />
          <FieldSelect label="Формат даты" value={dateFormat} onChange={setDateFormat} options={["ДД.ММ.ГГГГ","MM/DD/YYYY","YYYY-MM-DD"]} />
          <FieldSelect label="Часовой пояс" value={tz} onChange={setTz} options={["Europe/Moscow","UTC","America/New_York","Europe/London","Asia/Tokyo"]} />
          <FieldSelect label="Валюта" value={currency} onChange={setCurrency} options={["RUB (₽)","USD ($)","EUR (€)","GBP (£)"]} />
          <FieldSelect label="Первый день недели" value={weekStart} onChange={setWeekStart} options={["Понедельник","Воскресенье"]} />
        </div>
      </Section>
      <SaveBar onSave={save} loading={loading} />
    </div>
  );
}

function AppearancePanel({ settings, onUpdate, showToast }: { settings: Settings; onUpdate: (p: Partial<Settings>) => void; showToast: (m: string, t: "success"|"error") => void }) {
  const [theme, setTheme] = useState(settings.theme || "dark");
  const [accent, setAccent] = useState("#6366f1");
  const [compact, setCompact] = useState(false);
  const [animations, setAnimations] = useState(true);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme, preferences: { accent, compact, animations } }) });
      const d = await r.json();
      if (d.success) { onUpdate({ theme }); showToast("Внешний вид сохранён", "success"); }
      else showToast(d.error || "Ошибка", "error");
    } catch { showToast("Ошибка сети", "error"); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <Section title="Тема оформления" accent="#6366f1">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { id: "dark",   label: "Тёмная",  Icon: Moon,    bg: "#0a0b0f" },
            { id: "light",  label: "Светлая", Icon: Sun,     bg: "#f0f0f5" },
            { id: "system", label: "Системная",Icon: Monitor, bg: "linear-gradient(135deg, #0a0b0f 50%, #f0f0f5 50%)" },
          ].map(t => (
            <button key={t.id} onClick={() => setTheme(t.id)} style={{ borderRadius: 14, padding: "16px", background: theme === t.id ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.025)", border: `2px solid ${theme === t.id ? "#6366f1" : "rgba(255,255,255,0.06)"}`, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
              <div style={{ width: "100%", height: 52, borderRadius: 8, background: t.bg, marginBottom: 10 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <t.Icon size={12} style={{ color: theme === t.id ? "#6366f1" : "rgba(255,255,255,0.35)" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: theme === t.id ? "#fff" : "rgba(255,255,255,0.4)" }}>{t.label}</span>
                {theme === t.id && <Check size={11} style={{ color: "#6366f1", marginLeft: "auto" }} />}
              </div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Акцентный цвет" accent="#8b5cf6">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { color: "#6366f1", name: "Indigo" },
            { color: "#4f46e5", name: "Violet" },
            { color: "#10b981", name: "Emerald" },
            { color: "#ef4444", name: "Rose" },
            { color: "#f59e0b", name: "Amber" },
            { color: "#8b5cf6", name: "Purple" },
            { color: "#3b82f6", name: "Blue" },
          ].map(c => (
            <button key={c.color} onClick={() => setAccent(c.color)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "transparent", border: "none", cursor: "pointer" }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: c.color, boxShadow: accent === c.color ? `0 0 16px ${c.color}80` : "none", border: accent === c.color ? "2px solid #fff" : "2px solid transparent", transition: "all 0.2s" }} />
              <span style={{ fontSize: 9, color: accent === c.color ? "#fff" : "rgba(255,255,255,0.3)", fontWeight: 600 }}>{c.name}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Интерфейс" accent="#10b981">
        <Row label="Компактный режим" desc="Уменьшенные отступы и элементы">
          <Toggle on={compact} onChange={() => setCompact(v => !v)} />
        </Row>
        <Row label="Анимации" desc="Плавные переходы и эффекты" last>
          <Toggle on={animations} onChange={() => setAnimations(v => !v)} />
        </Row>
      </Section>
      <SaveBar onSave={save} loading={loading} />
    </div>
  );
}

function AdvancedPanel({ showToast }: { showToast: (m: string, t: "success"|"error") => void }) {
  const [beta, setBeta] = useState(false);
  const [debug, setDebug] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [exporting, setExporting] = useState(false);

  const exportData = async () => {
    setExporting(true);
    await new Promise(r => setTimeout(r, 1200));
    showToast("Запрос на экспорт принят — ссылка придёт на email", "success");
    setExporting(false);
  };

  return (
    <div>
      <Section title="Экспериментальные функции" accent="#8b5cf6">
        <Row label="Beta-функции" desc="Доступ к ранним версиям новых инструментов">
          <Toggle on={beta} onChange={() => setBeta(v => !v)} />
        </Row>
        <Row label="Режим разработчика" desc="Расширенные логи и API-метрики">
          <Toggle on={debug} onChange={() => setDebug(v => !v)} />
        </Row>
        <Row label="Аналитика использования" desc="Помогает улучшать продукт (анонимно)" last>
          <Toggle on={analytics} onChange={() => setAnalytics(v => !v)} />
        </Row>
      </Section>

      <Section title="Данные" accent="#6366f1">
        <Row label="Экспорт данных" desc="Скачать проекты, отчёты и настройки" last>
          <button onClick={exportData} disabled={exporting} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)", cursor: "pointer", opacity: exporting ? 0.7 : 1 }}>
            {exporting ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Download size={11} />}
            {exporting ? "Подготовка..." : "Запросить экспорт"}
          </button>
        </Row>
      </Section>

      <div style={{ borderRadius: 16, padding: "18px 20px", background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <AlertTriangle size={13} style={{ color: "#ef4444" }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>Опасная зона</div>
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 14 }}>Эти действия необратимы.</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => showToast("Настройки сброшены (заглушка)", "success")} style={{ padding: "7px 14px", borderRadius: 9, fontSize: 11, fontWeight: 600, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#ef4444", cursor: "pointer" }}>Сбросить настройки</button>
          <button style={{ padding: "7px 14px", borderRadius: 9, fontSize: 11, fontWeight: 600, border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.08)", color: "#ef4444", cursor: "pointer" }}>Удалить аккаунт</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function SettingsPage() {
  const [active, setActive] = useState("workspace");
  const [toast, setToast] = useState<{ msg: string; type: "success"|"error" } | null>(null);
  const [settings, setSettings] = useState<Settings>({
    language: "ru", timezone: "Europe/Moscow", theme: "dark",
    ai_model: "claude-sonnet-5", email_notifs: true, push_notifs: false,
    two_fa: false, preferences: {},
  });
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => {
      if (d.data) setSettings(d.data);
    }).catch(() => {}).finally(() => setLoadingSettings(false));
  }, []);

  const showToast = useCallback((msg: string, type: "success"|"error") => {
    setToast({ msg, type });
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings(s => ({ ...s, ...patch }));
  }, []);

  const groups = [...new Set(NAV.map(n => n.group))];
  const current = NAV.find(n => n.id === active);

  const renderPanel = () => {
    if (loadingSettings) return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, gap: 10, color: "rgba(255,255,255,0.3)" }}>
        <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: 13 }}>Загрузка настроек...</span>
      </div>
    );
    switch (active) {
      case "profile":       return <ProfilePanel showToast={showToast} />;
      case "workspace":     return <WorkspacePanel showToast={showToast} />;
      case "ai":            return <AIPanel settings={settings} onUpdate={updateSettings} showToast={showToast} />;
      case "team":          return <TeamPanel showToast={showToast} />;
      case "notifications": return <NotificationsPanel settings={settings} onUpdate={updateSettings} showToast={showToast} />;
      case "security":      return <SecurityPanel settings={settings} onUpdate={updateSettings} showToast={showToast} />;
      case "api":           return <APIPanel showToast={showToast} />;
      case "integrations":  return <IntegrationsPanel showToast={showToast} />;
      case "subscription":  return <SubscriptionPanel />;
      case "usage":         return <UsagePanel />;
      case "language":      return <LanguagePanel settings={settings} onUpdate={updateSettings} showToast={showToast} />;
      case "appearance":    return <AppearancePanel settings={settings} onUpdate={updateSettings} showToast={showToast} />;
      case "advanced":      return <AdvancedPanel showToast={showToast} />;
      default:              return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#07090F", display: "flex", position: "relative" }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2); }
        select option { background: #1a1b2e; color: #fff; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>

      {/* Ambient gradient */}
      <div style={{ position: "fixed", top: -80, right: 0, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* Left Nav */}
      <aside style={{ width: 216, flexShrink: 0, padding: "28px 10px", borderRight: "1px solid rgba(255,255,255,0.05)", position: "sticky", top: 0, height: "100vh", overflowY: "auto", zIndex: 10 }}>
        <div style={{ marginBottom: 24, paddingLeft: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>Настройки</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>Apex AI Workspace</div>
        </div>

        {groups.map(group => (
          <div key={group} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", padding: "0 10px", marginBottom: 4 }}>{group}</div>
            {NAV.filter(n => n.group === group).map(item => (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 10px",
                  borderRadius: 10, fontSize: 12, fontWeight: active === item.id ? 700 : 500,
                  border: `1px solid ${active === item.id ? "rgba(99,102,241,0.22)" : "transparent"}`,
                  background: active === item.id ? "rgba(99,102,241,0.1)" : "transparent",
                  color: active === item.id ? "#fff" : "rgba(255,255,255,0.38)",
                  cursor: "pointer", textAlign: "left", transition: "all 0.15s", marginBottom: 2,
                }}
              >
                <item.icon size={13} style={{ color: active === item.id ? "#6366f1" : "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {active === item.id && <ChevronRight size={11} style={{ color: "rgba(99,102,241,0.5)" }} />}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "28px 40px 80px", maxWidth: 780, overflowX: "hidden", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            {current && (
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <current.icon size={15} style={{ color: "#6366f1" }} />
              </div>
            )}
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.4px" }}>{current?.label}</h1>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", paddingLeft: 42 }}>{DESCRIPTIONS[active]}</div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderPanel()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast key={toast.msg} msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
