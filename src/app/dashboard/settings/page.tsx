"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Bot, Bell, Shield, Globe, Palette,
  Check, Eye, EyeOff, AlertTriangle, ChevronRight,
  Moon, Sun, Monitor, Loader2, X, CheckCircle2,
  MessageSquare, Phone, Copy, KeyRound, ShieldCheck,
  Fingerprint, Trash2, Plus,
} from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";

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
  { id: "profile",       label: "Профиль",       icon: User,    group: "Аккаунт" },
  { id: "ai",            label: "AI Ассистент",  icon: Bot,     group: "Аккаунт" },
  { id: "notifications", label: "Уведомления",   icon: Bell,    group: "Система" },
  { id: "security",      label: "Безопасность",  icon: Shield,  group: "Система" },
  { id: "language",      label: "Язык и регион", icon: Globe,   group: "Настройки" },
  { id: "appearance",    label: "Внешний вид",   icon: Palette, group: "Настройки" },
];

const DESCRIPTIONS: Record<string, string> = {
  profile:       "Ваше имя и данные аккаунта",
  ai:            "Конфигурация AI-ассистента и 20 агентов совета директоров",
  notifications: "Контролируй как и когда ты получаешь уведомления",
  security:      "Двухфакторная аутентификация и защита аккаунта",
  language:      "Язык интерфейса, регион и форматы",
  appearance:    "Тема, цвета и визуальные настройки",
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
  const [form, setForm] = useState({ firstName: "Founder", lastName: "", email: "" });

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
      <Section title="Профиль" desc="Имя, под которым вас видит AI-команда" accent="#6366f1">
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 22, paddingBottom: 22, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ width: 68, height: 68, borderRadius: 20, background: "linear-gradient(135deg, #6366f1, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, color: "#fff", boxShadow: "0 8px 24px rgba(99,102,241,0.4)" }}>
            {form.firstName[0] || "F"}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{form.firstName} {form.lastName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{form.email || "email не указан"}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FieldInput label="Имя" value={form.firstName} onChange={upd("firstName")} placeholder="Имя" />
          <FieldInput label="Фамилия" value={form.lastName} onChange={upd("lastName")} placeholder="Фамилия" />
        </div>
        <div style={{ marginTop: 12 }}>
          <FieldInput label="Email" value={form.email} onChange={() => {}} disabled hint="Email привязан к аккаунту и не меняется здесь" />
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
          { key: "tg" as const,      label: "Telegram",          desc: "@VertlixAI_bot",             Icon: MessageSquare },
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
  const twoFA = settings.two_fa;

  // Password change
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confPw, setConfPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // 2FA enrollment flow: idle → enrolling (QR + code) → codes (backup codes, once)
  const [phase, setPhase] = useState<"idle" | "enrolling" | "codes">("idle");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [manualSecret, setManualSecret] = useState("");
  const [enrollCode, setEnrollCode] = useState("");
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Disable flow
  const [disabling, setDisabling] = useState(false);
  const [disablePw, setDisablePw] = useState("");
  const [disableLoading, setDisableLoading] = useState(false);

  // Security event log
  const [log, setLog] = useState<{ id: string; type: string; created_at: string }[]>([]);
  const [logLoaded, setLogLoaded] = useState(false);
  useEffect(() => {
    fetch("/api/security/log").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.success && Array.isArray(d.data)) setLog(d.data);
    }).catch(() => {}).finally(() => setLogLoaded(true));
  }, [twoFA]); // refetch after enabling/disabling 2FA so the new event shows

  // Passkeys (WebAuthn)
  type Passkey = { id: string; device_label: string | null; created_at: string; last_used_at: string | null };
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [pkLoaded, setPkLoaded] = useState(false);
  const [pkAdding, setPkAdding] = useState(false);
  const loadPasskeys = useCallback(() => {
    fetch("/api/auth/passkey").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.success && Array.isArray(d.passkeys)) setPasskeys(d.passkeys);
    }).catch(() => {}).finally(() => setPkLoaded(true));
  }, []);
  useEffect(() => { loadPasskeys(); }, [loadPasskeys]);

  const addPasskey = async () => {
    setPkAdding(true);
    try {
      const optRes = await fetch("/api/auth/passkey/register/options", { method: "POST" });
      const optData = await optRes.json();
      if (!optRes.ok || !optData.success) { showToast(optData.error || "Не удалось начать регистрацию passkey", "error"); return; }
      const label = typeof navigator !== "undefined" ? navigator.platform || "Устройство" : "Устройство";
      const attestation = await startRegistration(optData.options);
      const verifyRes = await fetch("/api/auth/passkey/register/verify", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ response: attestation, label }),
      });
      const verifyData = await verifyRes.json();
      if (verifyData.success) { showToast("Passkey добавлен", "success"); loadPasskeys(); setLog([]); setLogLoaded(false); fetch("/api/security/log").then(r => r.ok ? r.json() : null).then(d => { if (d?.success && Array.isArray(d.data)) setLog(d.data); }).catch(() => {}).finally(() => setLogLoaded(true)); }
      else showToast(verifyData.error || "Passkey не подтверждён", "error");
    } catch {
      showToast("Регистрация passkey отменена", "error");
    } finally {
      setPkAdding(false);
    }
  };

  const removePasskey = async (id: string) => {
    try {
      const r = await fetch(`/api/auth/passkey/${encodeURIComponent(id)}`, { method: "DELETE" });
      const d = await r.json();
      if (d.success) { showToast("Passkey удалён", "success"); setPasskeys(p => p.filter(k => k.id !== id)); }
      else showToast(d.error || "Не удалось удалить passkey", "error");
    } catch { showToast("Ошибка сети", "error"); }
  };

  const changePassword = async () => {
    if (newPw.length < 8) { showToast("Новый пароль минимум 8 символов", "error"); return; }
    if (!/[a-zа-яё]/i.test(newPw) || !/[0-9]/.test(newPw)) { showToast("Пароль должен содержать буквы и цифры", "error"); return; }
    if (newPw !== confPw) { showToast("Пароли не совпадают", "error"); return; }
    setPwLoading(true);
    try {
      const r = await fetch("/api/user/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: curPw, newPassword: newPw }) });
      const d = await r.json();
      if (d.success) { showToast("Пароль изменён", "success"); setCurPw(""); setNewPw(""); setConfPw(""); }
      else showToast(d.error || "Не удалось изменить пароль", "error");
    } catch { showToast("Ошибка сети", "error"); }
    finally { setPwLoading(false); }
  };

  const startEnroll = async () => {
    setEnrollLoading(true);
    try {
      const r = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const d = await r.json();
      if (d.success) { setQrDataUrl(d.qrDataUrl); setManualSecret(d.secret); setPhase("enrolling"); }
      else showToast(d.error || "Не удалось начать настройку 2FA", "error");
    } catch { showToast("Ошибка сети", "error"); }
    finally { setEnrollLoading(false); }
  };

  const confirmEnroll = async () => {
    if (!/^\d{6}$/.test(enrollCode)) { showToast("Введите 6-значный код из приложения", "error"); return; }
    setEnrollLoading(true);
    try {
      const r = await fetch("/api/auth/2fa/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: enrollCode }) });
      const d = await r.json();
      if (d.success) {
        onUpdate({ two_fa: true });
        setBackupCodes(d.backupCodes);
        setPhase("codes");
        setEnrollCode("");
      } else showToast(d.error || "Неверный код", "error");
    } catch { showToast("Ошибка сети", "error"); }
    finally { setEnrollLoading(false); }
  };

  const finishEnroll = () => {
    setPhase("idle"); setQrDataUrl(""); setManualSecret(""); setBackupCodes([]);
    showToast("2FA включена — аккаунт защищён", "success");
  };

  const confirmDisable = async () => {
    if (!disablePw) { showToast("Введите текущий пароль", "error"); return; }
    setDisableLoading(true);
    try {
      const r = await fetch("/api/auth/2fa/disable", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: disablePw }) });
      const d = await r.json();
      if (d.success) { onUpdate({ two_fa: false }); setDisabling(false); setDisablePw(""); showToast("2FA отключена", "success"); }
      else showToast(d.error || "Не удалось отключить 2FA", "error");
    } catch { showToast("Ошибка сети", "error"); }
    finally { setDisableLoading(false); }
  };

  const copyBackupCodes = () => {
    navigator.clipboard?.writeText(backupCodes.join("\n")).then(() => showToast("Резервные коды скопированы", "success"));
  };

  return (
    <div>
      <Section title="Пароль" desc="Смените пароль от аккаунта" accent="#6366f1">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FieldInput label="Текущий пароль" type="password" value={curPw} onChange={setCurPw} placeholder="••••••••" hint="Оставьте пустым, если входите только через Google/GitHub" />
          <FieldInput label="Новый пароль" type="password" value={newPw} onChange={setNewPw} placeholder="Минимум 8 символов, буквы и цифры" />
          <FieldInput label="Повторите новый пароль" type="password" value={confPw} onChange={setConfPw} placeholder="••••••••" />
          <div>
            <button onClick={changePassword} disabled={pwLoading || !newPw}
              style={{ height: 42, padding: "0 20px", borderRadius: 11, border: "none", cursor: pwLoading || !newPw ? "default" : "pointer", fontSize: 13, fontWeight: 700, color: "#fff",
                background: pwLoading || !newPw ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#6366f1,#4f46e5)", display: "inline-flex", alignItems: "center", gap: 8 }}>
              {pwLoading && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
              {pwLoading ? "Сохранение…" : "Изменить пароль"}
            </button>
          </div>
        </div>
      </Section>

      <Section title="Двухфакторная аутентификация" desc="Код из приложения-аутентификатора (Google Authenticator, Authy) при каждом входе" accent={twoFA ? "#10b981" : "#f59e0b"}>
        {twoFA ? (
          <>
            <Row label="2FA включена" desc="Вход требует код из приложения-аутентификатора" last={!disabling}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#10b981", fontSize: 12.5, fontWeight: 600 }}>
                <ShieldCheck size={15} /> Активна
              </div>
            </Row>
            {!disabling ? (
              <div style={{ marginTop: 10 }}>
                <button onClick={() => setDisabling(true)}
                  style={{ height: 36, padding: "0 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer",
                    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
                  Отключить 2FA
                </button>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                style={{ marginTop: 12, padding: "14px 16px", borderRadius: 12, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 10 }}>Подтвердите текущий пароль, чтобы отключить 2FA</div>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <FieldInput label="Текущий пароль" type="password" value={disablePw} onChange={setDisablePw} placeholder="••••••••" />
                  </div>
                  <button onClick={confirmDisable} disabled={disableLoading || !disablePw}
                    style={{ height: 42, padding: "0 16px", borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: disableLoading ? "default" : "pointer",
                      background: "linear-gradient(135deg,#ef4444,#b91c1c)", border: "none", color: "#fff", display: "flex", alignItems: "center", gap: 7 }}>
                    {disableLoading && <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />}
                    Отключить
                  </button>
                  <button onClick={() => { setDisabling(false); setDisablePw(""); }}
                    style={{ height: 42, padding: "0 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 600, cursor: "pointer", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                    Отмена
                  </button>
                </div>
              </motion.div>
            )}
          </>
        ) : phase === "idle" ? (
          <Row label="2FA через приложение" desc="Google Authenticator, Authy" last>
            <button onClick={startEnroll} disabled={enrollLoading}
              style={{ height: 38, padding: "0 18px", borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: enrollLoading ? "default" : "pointer",
                background: "linear-gradient(135deg,#6366f1,#4f46e5)", border: "none", color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
              {enrollLoading && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
              Включить 2FA
            </button>
          </Row>
        ) : phase === "enrolling" ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
              {qrDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR-код для двухфакторной аутентификации" width={160} height={160}
                  style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "#fff", padding: 8 }} />
              )}
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: 10 }}>
                  1. Отсканируйте QR-код в Google Authenticator или Authy.<br />
                  2. Или введите секретный ключ вручную:
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 14, fontFamily: "monospace", fontSize: 12, color: "#a5b4fc", wordBreak: "break-all" }}>
                  <KeyRound size={13} style={{ flexShrink: 0 }} /> {manualSecret}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
                  <div style={{ width: 140 }}>
                    <FieldInput label="Код из приложения" type="text" value={enrollCode} onChange={v => setEnrollCode(v.replace(/\D/g, "").slice(0, 6))} placeholder="000000" />
                  </div>
                  <button onClick={confirmEnroll} disabled={enrollLoading || enrollCode.length !== 6}
                    style={{ height: 42, padding: "0 16px", borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: enrollLoading ? "default" : "pointer",
                      background: enrollCode.length === 6 ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "rgba(255,255,255,0.06)", border: "none", color: "#fff", display: "flex", alignItems: "center", gap: 7 }}>
                    {enrollLoading && <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />}
                    Подтвердить
                  </button>
                  <button onClick={() => setPhase("idle")}
                    style={{ height: 42, padding: "0 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 600, cursor: "pointer", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#10b981", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
              <CheckCircle2 size={15} /> 2FA включена — сохраните резервные коды
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 12, lineHeight: 1.6 }}>
              Каждый код можно использовать один раз вместо кода из приложения — если потеряете доступ к телефону. Сохраните их в надёжном месте, они больше не будут показаны.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, padding: 14, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 12 }}>
              {backupCodes.map(c => (
                <div key={c} style={{ fontFamily: "monospace", fontSize: 13, color: "#E5E7EB", letterSpacing: "0.03em" }}>{c}</div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={copyBackupCodes}
                style={{ height: 36, padding: "0 14px", borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: 6 }}>
                <Copy size={12} /> Скопировать
              </button>
              <button onClick={finishEnroll}
                style={{ height: 36, padding: "0 16px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", background: "linear-gradient(135deg,#6366f1,#4f46e5)", border: "none", color: "#fff" }}>
                Готово
              </button>
            </div>
          </motion.div>
        )}
      </Section>

      <Section title="Passkeys" desc="Вход по отпечатку, Face ID или PIN устройства — без пароля" accent="#8b5cf6">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {!pkLoaded ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.35)", fontSize: 12.5, padding: "8px 0" }}>
              <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Загрузка…
            </div>
          ) : passkeys.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, padding: "2px 0" }}>
              У вас пока нет passkey. Добавьте его, чтобы входить без пароля — быстрее и безопаснее.
            </div>
          ) : (
            passkeys.map(pk => (
              <div key={pk.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 10, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(139,92,246,0.14)", border: "1px solid rgba(139,92,246,0.3)" }}>
                  <Fingerprint size={15} style={{ color: "#8b5cf6" }} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: "#E5E7EB", fontWeight: 600 }}>{pk.device_label || "Passkey"}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontVariantNumeric: "tabular-nums" }}>
                    Добавлен {new Date(pk.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" })}
                    {pk.last_used_at && ` · вход ${new Date(pk.last_used_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })}`}
                  </div>
                </div>
                <button onClick={() => removePasskey(pk.id)} title="Удалить passkey"
                  style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", color: "#f87171" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
          <div>
            <button onClick={addPasskey} disabled={pkAdding}
              style={{ height: 38, padding: "0 16px", borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: pkAdding ? "default" : "pointer",
                background: pkAdding ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#8b5cf6,#6d28d9)", border: "none", color: "#fff", display: "inline-flex", alignItems: "center", gap: 8 }}>
              {pkAdding ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={14} />}
              {pkAdding ? "Добавление…" : "Добавить passkey"}
            </button>
          </div>
        </div>
      </Section>

      <Section title="Журнал безопасности" desc="Последние действия с вашим аккаунтом" accent="#6366f1">
        {!logLoaded ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.35)", fontSize: 12.5, padding: "8px 0" }}>
            <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Загрузка…
          </div>
        ) : log.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.35)", padding: "6px 0" }}>
            Событий безопасности пока нет. Смена пароля, включение 2FA и добавление passkey будут отображаться здесь.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {log.map(ev => {
              const meta = SECURITY_EVENT_META[ev.type] ?? { label: ev.type.replace("security.", ""), color: "#6366f1", Icon: Shield };
              return (
                <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `${meta.color}16`, border: `1px solid ${meta.color}30` }}>
                    <meta.Icon size={14} style={{ color: meta.color }} />
                  </span>
                  <span style={{ flex: 1, fontSize: 12.5, color: "#E5E7EB", fontWeight: 600 }}>{meta.label}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontVariantNumeric: "tabular-nums" }}>
                    {new Date(ev.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}

const SECURITY_EVENT_META: Record<string, { label: string; color: string; Icon: typeof Shield }> = {
  "security.password_changed": { label: "Пароль изменён",       color: "#6366f1", Icon: KeyRound },
  "security.2fa_enabled":      { label: "2FA включена",         color: "#10b981", Icon: ShieldCheck },
  "security.2fa_disabled":     { label: "2FA отключена",        color: "#f59e0b", Icon: Shield },
  "security.passkey_added":    { label: "Добавлен passkey",     color: "#8b5cf6", Icon: KeyRound },
  "security.passkey_removed":  { label: "Passkey удалён",       color: "#f59e0b", Icon: KeyRound },
  "security.login":            { label: "Вход в аккаунт",       color: "#3b82f6", Icon: CheckCircle2 },
};

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

const VALID_TABS = new Set(["profile", "ai", "notifications", "security", "language", "appearance"]);

function SettingsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [active, setActiveState] = useState(initialTab && VALID_TABS.has(initialTab) ? initialTab : "profile");

  // Keep the tab deep-linkable and back-button-friendly, like a real
  // settings page: switching tabs updates ?tab= without a full navigation,
  // and browser back/forward restores the previous tab.
  const selectTab = useCallback((id: string) => {
    setActiveState(id);
    router.push(`/dashboard/settings?tab=${id}`, { scroll: false });
  }, [router]);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && VALID_TABS.has(t) && t !== active) setActiveState(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
      case "ai":            return <AIPanel settings={settings} onUpdate={updateSettings} showToast={showToast} />;
      case "notifications": return <NotificationsPanel settings={settings} onUpdate={updateSettings} showToast={showToast} />;
      case "security":      return <SecurityPanel settings={settings} onUpdate={updateSettings} showToast={showToast} />;
      case "language":      return <LanguagePanel settings={settings} onUpdate={updateSettings} showToast={showToast} />;
      case "appearance":    return <AppearancePanel settings={settings} onUpdate={updateSettings} showToast={showToast} />;
      default:              return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#05060A", display: "flex", position: "relative" }}>
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
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>Vertlix AI Workspace</div>
        </div>

        {groups.map(group => (
          <div key={group} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", padding: "0 10px", marginBottom: 4 }}>{group}</div>
            {NAV.filter(n => n.group === group).map(item => (
              <button
                key={item.id}
                onClick={() => selectTab(item.id)}
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
            <h1 className="term-mono" style={{ fontSize: 19, fontWeight: 800, color: "#fff", letterSpacing: "0.01em", textTransform: "uppercase" }}>{current?.label}</h1>
          </div>
          <div className="term-mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", paddingLeft: 42, letterSpacing: "0.03em" }}>// {DESCRIPTIONS[active]}</div>
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

export default function SettingsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#05060A" }} />}>
      <SettingsPageInner />
    </Suspense>
  );
}
