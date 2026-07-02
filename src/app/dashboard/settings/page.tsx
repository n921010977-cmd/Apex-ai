"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Building2, Bot, Users, Bell, Shield, Key, Link2,
  CreditCard, BarChart2, Globe, Palette, Settings2,
  Camera, ChevronRight, Check, Copy, Eye, EyeOff,
  Plus, Trash2, ExternalLink, Zap, Star, Crown,
  Smartphone, Monitor, Laptop, LogOut, AlertTriangle,
  Moon, Sun, Layers, Sliders, Mail, MessageSquare,
  Phone, MapPin, Clock,
  ToggleLeft, ToggleRight, RefreshCw, Download,
} from "lucide-react";

// ─── Nav sections ────────────────────────────────────────────────────────────
const NAV = [
  { id: "profile",      label: "Профиль",           icon: User,        group: "Аккаунт" },
  { id: "workspace",    label: "Рабочее пространство", icon: Building2,  group: "Аккаунт" },
  { id: "ai",           label: "AI Ассистент",       icon: Bot,         group: "Аккаунт" },
  { id: "team",         label: "Команда",             icon: Users,       group: "Аккаунт" },
  { id: "notifications",label: "Уведомления",         icon: Bell,        group: "Система" },
  { id: "security",     label: "Безопасность",        icon: Shield,      group: "Система" },
  { id: "api",          label: "API & Webhooks",      icon: Key,         group: "Система" },
  { id: "integrations", label: "Интеграции",          icon: Link2,       group: "Система" },
  { id: "subscription", label: "Подписка",            icon: CreditCard,  group: "Биллинг" },
  { id: "usage",        label: "Использование",       icon: BarChart2,   group: "Биллинг" },
  { id: "language",     label: "Язык и регион",       icon: Globe,       group: "Настройки" },
  { id: "appearance",   label: "Внешний вид",         icon: Palette,     group: "Настройки" },
  { id: "advanced",     label: "Дополнительно",       icon: Settings2,   group: "Настройки" },
];

// ─── Toggle component ─────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} style={{ position: "relative", width: 44, height: 24, borderRadius: 12, background: on ? "#7A5CFF" : "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", transition: "background 0.25s", flexShrink: 0, boxShadow: on ? "0 0 12px rgba(122,92,255,0.5)" : "none" }}>
      <motion.div animate={{ x: on ? 22 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{ position: "absolute", top: 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }} />
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
function Input({ label, placeholder, value, type = "text", hint }: { label: string; placeholder?: string; value?: string; type?: string; hint?: string }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>{label}</label>
      <input type={type} defaultValue={value} placeholder={placeholder}
        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13, outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" }}
        onFocus={e => (e.target.style.borderColor = "rgba(122,92,255,0.5)")}
        onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
      {hint && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: 16 }}>
      <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{title}</div>
        {desc && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{desc}</div>}
      </div>
      <div style={{ padding: "20px 24px" }}>{children}</div>
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────
function Row({ label, desc, children, last }: { label: string; desc?: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, paddingBottom: last ? 0 : 16, marginBottom: last ? 0 : 16, borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{desc}</div>}
      </div>
      {children}
    </div>
  );
}

// ─── Save Button ──────────────────────────────────────────────────────────────
function SaveBar({ onSave, saved }: { onSave: () => void; saved: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
      <button style={{ padding: "9px 18px", borderRadius: 10, fontSize: 12, fontWeight: 600, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>Отмена</button>
      <button onClick={onSave} style={{ padding: "9px 20px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: "none", background: saved ? "#00E7A7" : "linear-gradient(135deg, #7A5CFF, #5A8DFF)", color: "#fff", cursor: "pointer", transition: "all 0.3s", display: "flex", alignItems: "center", gap: 6 }}>
        {saved ? <><Check size={13} />Сохранено</> : "Сохранить изменения"}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION PANELS
// ═══════════════════════════════════════════════════════════════════════════════

function ProfilePanel({ saved, onSave }: { saved: boolean; onSave: () => void }) {
  return (
    <div>
      <Section title="Публичный профиль" desc="Отображается для вашей команды и партнёров">
        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg, #7A5CFF, #5A8DFF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "#fff", boxShadow: "0 8px 24px rgba(122,92,255,0.4)" }}>F</div>
            <button style={{ position: "absolute", bottom: -4, right: -4, width: 24, height: 24, borderRadius: "50%", background: "#7A5CFF", border: "2px solid #07090F", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Camera size={10} color="#fff" />
            </button>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Founder</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 10 }}>founder@example.com</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>Загрузить фото</button>
              <button style={{ padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: "none", background: "transparent", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>Удалить</button>
            </div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
              <ExternalLink size={11} />Публичный профиль
            </button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input label="Имя" value="Founder" placeholder="Имя" />
          <Input label="Фамилия" placeholder="Фамилия" />
          <Input label="Email" value="founder@example.com" type="email" />
          <Input label="Телефон" placeholder="+7 (999) 000-00-00" />
          <Input label="Должность" placeholder="CEO, Product Manager..." />
          <Input label="Компания" placeholder="My Startup" />
          <Input label="Страна" placeholder="Россия" />
          <Input label="Часовой пояс" value="GMT+3 (Москва)" />
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>О себе</label>
          <textarea placeholder="Краткое описание..." defaultValue="AI-driven founder building the future of executive intelligence."
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13, outline: "none", resize: "none", height: 72, boxSizing: "border-box", fontFamily: "inherit" }} />
        </div>
      </Section>

      <Section title="Социальные ссылки" desc="Ваши публичные профили">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { icon: Link2,   label: "GitHub",   placeholder: "github.com/username" },
            { icon: Link2,   label: "Twitter",  placeholder: "twitter.com/username" },
            { icon: Link2,   label: "LinkedIn", placeholder: "linkedin.com/in/username" },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <s.icon size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
              </div>
              <input placeholder={s.placeholder} style={{ flex: 1, padding: "9px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13, outline: "none" }}
                onFocus={e => (e.target.style.borderColor = "rgba(122,92,255,0.5)")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
            </div>
          ))}
        </div>
      </Section>
      <SaveBar onSave={onSave} saved={saved} />
    </div>
  );
}

function WorkspacePanel({ saved, onSave }: { saved: boolean; onSave: () => void }) {
  return (
    <div>
      <Section title="Рабочее пространство" desc="Настройки вашей организации">
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #7A5CFF, #5A8DFF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#fff" }}>A</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Apex AI Workspace</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>apex-ai.workspace · Starter Plan</div>
          </div>
          <button style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>Загрузить логотип</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input label="Название" value="Apex AI" />
          <Input label="Домен" value="apex-ai.workspace" hint="workspace.apex-ai.com" />
          <Input label="Отрасль" placeholder="Технологии, SaaS..." />
          <Input label="Размер команды" placeholder="1–10, 11–50..." />
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Описание компании</label>
          <textarea placeholder="Что делает ваша компания?"
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13, outline: "none", resize: "none", height: 72, boxSizing: "border-box", fontFamily: "inherit" }} />
        </div>
      </Section>

      <Section title="Бренд" desc="Цвета и фирменный стиль">
        <Row label="Акцентный цвет" desc="Основной цвет вашего бренда">
          <div style={{ display: "flex", gap: 8 }}>
            {["#7A5CFF","#5A8DFF","#00E7A7","#FF5470","#FFB800"].map(c => (
              <button key={c} style={{ width: 24, height: 24, borderRadius: "50%", background: c, border: c === "#7A5CFF" ? "2px solid #fff" : "2px solid transparent", cursor: "pointer" }} />
            ))}
          </div>
        </Row>
      </Section>
      <SaveBar onSave={onSave} saved={saved} />
    </div>
  );
}

function AIPanel() {
  const [creativity, setCreativity] = useState(65);
  const [mem, setMem] = useState(true);
  const [auto, setAuto] = useState(false);

  return (
    <div>
      <Section title="Модель AI" desc="Выберите мощность и скорость">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { name: "Claude Sonnet", desc: "Баланс скорости и качества", badge: "Рекомендовано", color: "#7A5CFF" },
            { name: "Claude Opus",   desc: "Максимальное качество",      badge: "Pro",           color: "#00E7A7" },
            { name: "Claude Haiku",  desc: "Максимальная скорость",      badge: null,            color: "#5A8DFF" },
          ].map((m, i) => (
            <div key={i} onClick={() => {}} style={{ borderRadius: 12, padding: "14px 16px", background: i === 0 ? "rgba(122,92,255,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${i === 0 ? "rgba(122,92,255,0.35)" : "rgba(255,255,255,0.07)"}`, cursor: "pointer", transition: "all 0.2s", position: "relative" }}>
              {m.badge && <div style={{ position: "absolute", top: 8, right: 8, fontSize: 9, padding: "2px 6px", borderRadius: 5, background: `${m.color}20`, color: m.color, fontWeight: 700 }}>{m.badge}</div>}
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${m.color}18`, border: `1px solid ${m.color}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <Bot size={13} style={{ color: m.color }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{m.name}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Поведение" desc="Стиль и параметры ответов">
        <Row label="Уровень креативности" desc={`Температура: ${creativity / 100}`}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Точный</span>
            <input type="range" min={0} max={100} value={creativity} onChange={e => setCreativity(+e.target.value)}
              style={{ width: 120, accentColor: "#7A5CFF" }} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Творческий</span>
          </div>
        </Row>
        <Row label="Язык ответов" desc="По умолчанию для AI-ответов">
          <select style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 12, outline: "none", cursor: "pointer" }}>
            <option>Русский</option><option>English</option><option>中文</option>
          </select>
        </Row>
        <Row label="Стиль общения" desc="Тон и манера ответов AI">
          <div style={{ display: "flex", gap: 6 }}>
            {["Формальный","Нейтральный","Дружелюбный"].map((s, i) => (
              <button key={s} style={{ padding: "5px 10px", borderRadius: 7, fontSize: 10, fontWeight: 600, border: `1px solid ${i === 1 ? "rgba(122,92,255,0.4)" : "rgba(255,255,255,0.08)"}`, background: i === 1 ? "rgba(122,92,255,0.12)" : "transparent", color: i === 1 ? "#a78bfa" : "rgba(255,255,255,0.4)", cursor: "pointer" }}>{s}</button>
            ))}
          </div>
        </Row>
        <Row label="Память сессий" desc="AI помнит контекст между сессиями">
          <Toggle on={mem} onChange={() => setMem(!mem)} />
        </Row>
        <Row label="Автоматизация" desc="Автозапуск агентов при создании проекта" last>
          <Toggle on={auto} onChange={() => setAuto(!auto)} />
        </Row>
      </Section>

      <Section title="Персональные инструкции" desc="Контекст для всех AI-сессий">
        <textarea placeholder="Я являюсь CEO стартапа в сфере B2B SaaS. Всегда учитывай риски масштабирования и фокусируйся на метриках роста..." defaultValue="Я основатель AI-стартапа. Фокус на growth, product-market fit и эффективности команды. Отвечай структурированно, используй цифры."
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13, outline: "none", resize: "none", height: 100, boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.6 }} />
        <div style={{ marginTop: 10, fontSize: 10, color: "rgba(255,255,255,0.25)" }}>Инструкции применяются ко всем 20 AI-агентам вашего совета директоров</div>
      </Section>
    </div>
  );
}

function TeamPanel() {
  const MEMBERS = [
    { name: "Founder",   email: "founder@example.com",  role: "Владелец",     avatar: "F", color: "#7A5CFF", online: true  },
    { name: "Alex Kim",  email: "alex@example.com",      role: "Администратор",avatar: "A", color: "#5A8DFF", online: true  },
    { name: "Sara M.",   email: "sara@example.com",      role: "Редактор",     avatar: "S", color: "#00E7A7", online: false },
    { name: "James L.",  email: "james@example.com",     role: "Наблюдатель",  avatar: "J", color: "#FFB800", online: false },
  ];
  const ROLES: Record<string, { color: string; bg: string }> = {
    "Владелец":     { color: "#7A5CFF", bg: "rgba(122,92,255,0.12)" },
    "Администратор":{ color: "#5A8DFF", bg: "rgba(90,141,255,0.12)" },
    "Редактор":     { color: "#00E7A7", bg: "rgba(0,231,167,0.1)"   },
    "Наблюдатель":  { color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.06)" },
  };

  return (
    <div>
      <Section title="Участники команды" desc="4 из 5 мест заняты (Starter)">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {MEMBERS.map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ position: "relative" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${m.color}, ${m.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>{m.avatar}</div>
                {m.online && <div style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8, borderRadius: "50%", background: "#00E7A7", border: "2px solid #07090F" }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{m.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{m.email}</div>
              </div>
              <select defaultValue={m.role} style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${ROLES[m.role]?.color}30`, background: ROLES[m.role]?.bg, color: ROLES[m.role]?.color, fontSize: 11, fontWeight: 700, outline: "none", cursor: "pointer" }}>
                <option>Владелец</option><option>Администратор</option><option>Редактор</option><option>Наблюдатель</option>
              </select>
              {m.role !== "Владелец" && <button style={{ width: 28, height: 28, borderRadius: 7, background: "transparent", border: "1px solid rgba(255,84,112,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={11} style={{ color: "#FF5470" }} /></button>}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Пригласить участника">
        <div style={{ display: "flex", gap: 10 }}>
          <input placeholder="email@company.com" style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13, outline: "none" }} />
          <select style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", fontSize: 12, outline: "none" }}>
            <option>Редактор</option><option>Наблюдатель</option><option>Администратор</option>
          </select>
          <button style={{ padding: "10px 18px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #7A5CFF, #5A8DFF)", color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}>
            Отправить приглашение
          </button>
        </div>
      </Section>
    </div>
  );
}

function NotificationsPanel() {
  const [states, setStates] = useState<Record<string, boolean>>({
    email_analysis: true, email_insights: true, email_product: false, email_report: true,
    push_alerts: true, push_ai: true,
    tg: false, slack: false, discord: false, sms: false,
    daily: true, weekly: true, ai_alerts: true,
  });
  const tog = (k: string) => setStates(s => ({ ...s, [k]: !s[k] }));

  return (
    <div>
      <Section title="Email-уведомления" desc="Контролируй что приходит на почту">
        <Row label="Завершение анализа" desc="AI завершил анализ вашего проекта">
          <Toggle on={states.email_analysis} onChange={() => tog("email_analysis")} />
        </Row>
        <Row label="Новые AI-инсайты" desc="Рекомендации совета директоров">
          <Toggle on={states.email_insights} onChange={() => tog("email_insights")} />
        </Row>
        <Row label="Обновления продукта" desc="Новые функции и улучшения">
          <Toggle on={states.email_product} onChange={() => tog("email_product")} />
        </Row>
        <Row label="Ежедневный отчёт" desc="Сводка за день в 18:00" last>
          <Toggle on={states.daily} onChange={() => tog("daily")} />
        </Row>
      </Section>

      <Section title="Push и мессенджеры">
        {[
          { key: "push_alerts", label: "Push-уведомления",   desc: "В браузере и мобильном",  icon: Bell },
          { key: "tg",          label: "Telegram",            desc: "@ApexAI_bot",              icon: MessageSquare },
          { key: "slack",       label: "Slack",               desc: "Подключить workspace",     icon: MessageSquare },
          { key: "discord",     label: "Discord",             desc: "Подключить сервер",        icon: MessageSquare },
          { key: "sms",         label: "SMS",                 desc: "Критичные алерты",         icon: Phone },
        ].map((n, i, arr) => (
          <Row key={n.key} label={n.label} desc={n.desc} last={i === arr.length - 1}>
            <Toggle on={states[n.key]} onChange={() => tog(n.key)} />
          </Row>
        ))}
      </Section>

      <Section title="Отчёты и дайджесты">
        <Row label="Еженедельный обзор" desc="Каждый понедельник в 9:00">
          <Toggle on={states.weekly} onChange={() => tog("weekly")} />
        </Row>
        <Row label="AI-алерты" desc="Срочные решения требуют внимания" last>
          <Toggle on={states.ai_alerts} onChange={() => tog("ai_alerts")} />
        </Row>
      </Section>
    </div>
  );
}

function SecurityPanel() {
  const [show, setShow] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const SESSIONS = [
    { device: "MacBook Pro", location: "Москва, Россия", time: "Сейчас", icon: Laptop, current: true },
    { device: "iPhone 15",   location: "Москва, Россия", time: "2 часа назад", icon: Smartphone, current: false },
    { device: "Chrome / Windows", location: "Санкт-Петербург", time: "3 дня назад", icon: Monitor, current: false },
  ];

  return (
    <div>
      <Section title="Смена пароля">
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
          <Input label="Текущий пароль" type="password" placeholder="••••••••" />
          <Input label="Новый пароль" type="password" placeholder="••••••••" hint="Минимум 12 символов, заглавные, цифры, спецсимволы" />
          <Input label="Подтвердить пароль" type="password" placeholder="••••••••" />
          <button style={{ padding: "9px 18px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #7A5CFF, #5A8DFF)", color: "#fff", cursor: "pointer", width: "fit-content" }}>
            Обновить пароль
          </button>
        </div>
      </Section>

      <Section title="Двухфакторная аутентификация" desc="Дополнительный уровень защиты">
        <Row label="2FA через приложение" desc="Google Authenticator, Authy" last>
          <Toggle on={twoFA} onChange={() => setTwoFA(!twoFA)} />
        </Row>
        {twoFA && (
          <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: "rgba(0,231,167,0.06)", border: "1px solid rgba(0,231,167,0.15)" }}>
            <div style={{ fontSize: 11, color: "#00E7A7", fontWeight: 600 }}>✓ 2FA включена — ваш аккаунт защищён</div>
          </div>
        )}
      </Section>

      <Section title="Активные сессии" desc="Устройства, подключённые к вашему аккаунту">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SESSIONS.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 12, background: s.current ? "rgba(122,92,255,0.07)" : "rgba(255,255,255,0.025)", border: `1px solid ${s.current ? "rgba(122,92,255,0.2)" : "rgba(255,255,255,0.05)"}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <s.icon size={16} style={{ color: s.current ? "#7A5CFF" : "rgba(255,255,255,0.3)" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                  {s.device}
                  {s.current && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 5, background: "rgba(0,231,167,0.12)", color: "#00E7A7", fontWeight: 700 }}>Текущая</span>}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{s.location} · {s.time}</div>
              </div>
              {!s.current && <button style={{ padding: "5px 10px", borderRadius: 7, fontSize: 10, fontWeight: 600, border: "1px solid rgba(255,84,112,0.25)", background: "transparent", color: "#FF5470", cursor: "pointer" }}>
                <LogOut size={10} style={{ display: "inline", marginRight: 4 }} />Выйти
              </button>}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <button style={{ padding: "7px 14px", borderRadius: 9, fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,84,112,0.2)", background: "transparent", color: "#FF5470", cursor: "pointer" }}>
            Завершить все сессии
          </button>
        </div>
      </Section>
    </div>
  );
}

function APIPanel() {
  const [copied, setCopied] = useState<string | null>(null);
  const KEYS = [
    { name: "Production API Key", key: "sk-apex-prod-••••••••••••••••••••Kx9f", created: "1 янв 2025", last: "2 мин назад", scope: "Полный доступ" },
    { name: "Analytics Read-Only",key: "sk-apex-ro-••••••••••••••••••••mN2p",   created: "15 фев 2025",last: "Никогда",     scope: "Только чтение" },
  ];
  const copy = (k: string) => { setCopied(k); setTimeout(() => setCopied(null), 1500); };

  return (
    <div>
      <Section title="API Keys" desc="Управление ключами доступа к API">
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          {KEYS.map((k, i) => (
            <div key={i} style={{ borderRadius: 12, padding: "14px 16px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{k.name}</div>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(0,231,167,0.1)", color: "#00E7A7", fontWeight: 600 }}>{k.scope}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
                <code style={{ flex: 1, fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>{k.key}</code>
                <button onClick={() => copy(k.name)} style={{ background: "transparent", border: "none", cursor: "pointer", color: copied === k.name ? "#00E7A7" : "rgba(255,255,255,0.3)" }}>
                  {copied === k.name ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>Создан: {k.created}</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>Последнее использование: {k.last}</span>
              </div>
            </div>
          ))}
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: "1px dashed rgba(122,92,255,0.3)", background: "rgba(122,92,255,0.06)", color: "#a78bfa", cursor: "pointer" }}>
          <Plus size={13} />Создать новый ключ
        </button>
      </Section>

      <Section title="Webhooks" desc="Отправляй события на ваш сервер">
        <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Webhook URL не настроен</div>
          <div style={{ display: "flex", gap: 10 }}>
            <input placeholder="https://your-server.com/webhook" style={{ flex: 1, padding: "8px 12px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 12, outline: "none" }} />
            <button style={{ padding: "8px 14px", borderRadius: 9, fontSize: 11, fontWeight: 700, border: "none", background: "#7A5CFF", color: "#fff", cursor: "pointer" }}>Добавить</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
            <ExternalLink size={11} />Документация SDK
          </button>
        </div>
      </Section>
    </div>
  );
}

function IntegrationsPanel() {
  const [connected, setConnected] = useState<Record<string, boolean>>({ slack: true, notion: false, github: false, jira: false, google: true, zapier: false });
  const INTEGRATIONS = [
    { id: "slack",  name: "Slack",   desc: "Уведомления в каналы",         color: "#4A154B", logo: "S" },
    { id: "notion", name: "Notion",  desc: "Экспорт отчётов",              color: "#fff",    logo: "N" },
    { id: "github", name: "GitHub",  desc: "Связь с репозиториями",        color: "#24292e", logo: "G" },
    { id: "jira",   name: "Jira",    desc: "Создание задач из AI-инсайтов",color: "#0052CC", logo: "J" },
    { id: "google", name: "Google",  desc: "Analytics и Workspace",        color: "#4285F4", logo: "G" },
    { id: "zapier", name: "Zapier",  desc: "Автоматизация рабочих потоков",color: "#FF4A00", logo: "Z" },
  ];

  return (
    <div>
      <Section title="Интеграции" desc="Подключи внешние сервисы к Apex AI">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {INTEGRATIONS.map(int => (
            <div key={int.id} style={{ borderRadius: 14, padding: "16px 18px", background: connected[int.id] ? "rgba(122,92,255,0.06)" : "rgba(255,255,255,0.025)", border: `1px solid ${connected[int.id] ? "rgba(122,92,255,0.2)" : "rgba(255,255,255,0.06)"}`, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${int.color}22`, border: `1px solid ${int.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{int.logo}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{int.name}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{int.desc}</div>
              </div>
              <Toggle on={connected[int.id]} onChange={() => setConnected(s => ({ ...s, [int.id]: !s[int.id] }))} />
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function SubscriptionPanel() {
  const FEATURES = [
    { label: "AI-анализов в месяц", used: 3, limit: 3, color: "#FF5470" },
    { label: "Активных проектов",   used: 1, limit: 1, color: "#FFB800" },
    { label: "Членов команды",      used: 4, limit: 5, color: "#00E7A7" },
    { label: "Хранилище (GB)",      used: 0.8, limit: 5, color: "#5A8DFF" },
  ];

  return (
    <div>
      {/* Current Plan */}
      <div style={{ borderRadius: 18, padding: "24px", background: "linear-gradient(135deg, rgba(122,92,255,0.12), rgba(90,141,255,0.08))", border: "1px solid rgba(122,92,255,0.25)", marginBottom: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #7A5CFF80, transparent)" }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>Starter</div>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 8, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Текущий план</span>
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>$0 / месяц · Бесплатно навсегда</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["3 AI-анализа/мес","1 проект","5 участников","5 GB"].map(f => (
                <span key={f} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 7, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>{f}</span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <button style={{ padding: "10px 20px", borderRadius: 11, fontSize: 13, fontWeight: 800, border: "none", background: "linear-gradient(135deg, #7A5CFF, #5A8DFF)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 7, boxShadow: "0 4px 20px rgba(122,92,255,0.4)" }}>
              <Crown size={14} />Upgrade to Pro
            </button>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 6 }}>от $29/месяц</div>
          </div>
        </div>
      </div>

      {/* Pro plan card */}
      <div style={{ borderRadius: 18, padding: "24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Использование в этом месяце</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {FEATURES.map((f, i) => (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{f.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: f.used / f.limit > 0.8 ? f.color : "rgba(255,255,255,0.55)" }}>{f.used} / {f.limit}</span>
              </div>
              <div style={{ height: 5, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${(f.used / f.limit) * 100}%` }} transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                  style={{ height: "100%", borderRadius: 4, background: f.color, boxShadow: `0 0 8px ${f.color}60` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Section title="История платежей">
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "20px 0" }}>Нет платёжной истории — вы на бесплатном плане</div>
      </Section>
    </div>
  );
}

function UsagePanel() {
  const USAGE = [
    { label: "AI-запросов",      used: 284,  limit: 300,  color: "#7A5CFF", unit: "" },
    { label: "Токенов (тыс.)",   used: 1820, limit: 2000, color: "#5A8DFF", unit: "k" },
    { label: "Отчётов",          used: 3,    limit: 3,    color: "#FF5470", unit: "" },
    { label: "Агент-часов",      used: 12,   limit: 20,   color: "#00E7A7", unit: "h" },
  ];

  return (
    <div>
      <Section title="Использование AI" desc="Текущий расчётный период: 1–31 июля 2026">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          {USAGE.map((u, i) => (
            <div key={i} style={{ borderRadius: 14, padding: "18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${u.color}60, transparent)` }} />
              <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 4 }}>{u.used}<span style={{ fontSize: 14, color: "rgba(255,255,255,0.3)" }}>/{u.limit}{u.unit}</span></div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>{u.label}</div>
              <div style={{ height: 4, borderRadius: 3, background: "rgba(255,255,255,0.06)" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${(u.used / u.limit) * 100}%` }} transition={{ delay: 0.2 + i * 0.1, duration: 0.8 }}
                  style={{ height: "100%", borderRadius: 3, background: u.color }} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Сброс и история">
        <Row label="Следующий сброс" desc="Лимиты обновятся 1 августа 2026" last>
          <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>29 дней</div>
        </Row>
      </Section>
    </div>
  );
}

function LanguagePanel({ saved, onSave }: { saved: boolean; onSave: () => void }) {
  return (
    <div>
      <Section title="Язык и регион">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            { label: "Язык интерфейса",  opts: ["Русский","English","中文","Español","Deutsch"] },
            { label: "Язык AI-ответов",  opts: ["Русский","English","中文"] },
            { label: "Формат даты",      opts: ["ДД.ММ.ГГГГ","MM/DD/YYYY","YYYY-MM-DD"] },
            { label: "Часовой пояс",     opts: ["GMT+3 (Москва)","GMT+0 (Лондон)","GMT-5 (Нью-Йорк)"] },
            { label: "Валюта",           opts: ["RUB (₽)","USD ($)","EUR (€)"] },
            { label: "Первый день недели",opts: ["Понедельник","Воскресенье"] },
          ].map(f => (
            <div key={f.label}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>{f.label}</label>
              <select style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13, outline: "none", cursor: "pointer", boxSizing: "border-box" }}>
                {f.opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
      </Section>
      <SaveBar onSave={onSave} saved={saved} />
    </div>
  );
}

function AppearancePanel() {
  const [theme, setTheme] = useState("dark");
  const [accent, setAccent] = useState("#7A5CFF");
  const [compact, setCompact] = useState(false);
  const [animations, setAnimations] = useState(true);
  const [density, setDensity] = useState("normal");

  return (
    <div>
      <Section title="Тема оформления">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 4 }}>
          {[
            { id: "dark",   label: "Тёмная",  icon: Moon,    bg: "#0a0b0f", preview: "rgba(255,255,255,0.05)" },
            { id: "light",  label: "Светлая", icon: Sun,     bg: "#f5f5f5", preview: "rgba(0,0,0,0.08)" },
            { id: "system", label: "System",  icon: Monitor, bg: "linear-gradient(135deg, #0a0b0f 50%, #f5f5f5 50%)", preview: "rgba(0,0,0,0.05)" },
          ].map(t => (
            <button key={t.id} onClick={() => setTheme(t.id)}
              style={{ borderRadius: 14, padding: "16px", background: theme === t.id ? "rgba(122,92,255,0.1)" : "rgba(255,255,255,0.025)", border: `2px solid ${theme === t.id ? "#7A5CFF" : "rgba(255,255,255,0.06)"}`, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
              <div style={{ width: "100%", height: 56, borderRadius: 8, background: t.bg, marginBottom: 10, overflow: "hidden", position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${t.preview}, transparent)` }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <t.icon size={12} style={{ color: theme === t.id ? "#7A5CFF" : "rgba(255,255,255,0.35)" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: theme === t.id ? "#fff" : "rgba(255,255,255,0.45)" }}>{t.label}</span>
                {theme === t.id && <Check size={11} style={{ color: "#7A5CFF", marginLeft: "auto" }} />}
              </div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Акцентный цвет">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { color: "#7A5CFF", name: "Violet"  },
            { color: "#5A8DFF", name: "Blue"    },
            { color: "#00E7A7", name: "Emerald" },
            { color: "#FF5470", name: "Rose"    },
            { color: "#FFB800", name: "Amber"   },
            { color: "#a78bfa", name: "Purple"  },
          ].map(c => (
            <button key={c.color} onClick={() => setAccent(c.color)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer" }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: c.color, boxShadow: accent === c.color ? `0 0 16px ${c.color}80` : "none", border: accent === c.color ? `2px solid #fff` : "2px solid transparent", transition: "all 0.2s" }} />
              <span style={{ fontSize: 9, color: accent === c.color ? "#fff" : "rgba(255,255,255,0.3)", fontWeight: 600 }}>{c.name}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Интерфейс">
        <Row label="Компактный режим" desc="Уменьшенные отступы и элементы">
          <Toggle on={compact} onChange={() => setCompact(!compact)} />
        </Row>
        <Row label="Анимации" desc="Плавные переходы и эффекты">
          <Toggle on={animations} onChange={() => setAnimations(!animations)} />
        </Row>
        <Row label="Плотность элементов" desc="Размер карточек и строк" last>
          <div style={{ display: "flex", gap: 6 }}>
            {["compact","normal","spacious"].map(d => (
              <button key={d} onClick={() => setDensity(d)}
                style={{ padding: "5px 10px", borderRadius: 7, fontSize: 10, fontWeight: 600, border: `1px solid ${density === d ? "rgba(122,92,255,0.4)" : "rgba(255,255,255,0.08)"}`, background: density === d ? "rgba(122,92,255,0.12)" : "transparent", color: density === d ? "#a78bfa" : "rgba(255,255,255,0.4)", cursor: "pointer", textTransform: "capitalize" }}>{d}</button>
            ))}
          </div>
        </Row>
      </Section>
    </div>
  );
}

function AdvancedPanel() {
  const [beta, setBeta] = useState(false);
  const [debug, setDebug] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  return (
    <div>
      <Section title="Экспериментальные функции">
        <Row label="Beta-функции" desc="Доступ к ранним версиям новых инструментов">
          <Toggle on={beta} onChange={() => setBeta(!beta)} />
        </Row>
        <Row label="Режим разработчика" desc="Расширенные логи и API-метрики">
          <Toggle on={debug} onChange={() => setDebug(!debug)} />
        </Row>
        <Row label="Аналитика использования" desc="Помогает улучшать продукт (анонимно)" last>
          <Toggle on={analytics} onChange={() => setAnalytics(!analytics)} />
        </Row>
      </Section>

      <Section title="Данные">
        <Row label="Экспорт всех данных" desc="Скачать проекты, отчёты и настройки" last>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)", cursor: "pointer" }}>
            <Download size={11} />Запросить экспорт
          </button>
        </Row>
      </Section>

      <div style={{ borderRadius: 16, padding: "18px 20px", background: "rgba(255,84,112,0.05)", border: "1px solid rgba(255,84,112,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <AlertTriangle size={14} style={{ color: "#FF5470" }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: "#FF5470" }}>Опасная зона</div>
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 14 }}>Эти действия необратимы. Будьте осторожны.</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ padding: "7px 14px", borderRadius: 9, fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,84,112,0.3)", background: "transparent", color: "#FF5470", cursor: "pointer" }}>Сбросить настройки</button>
          <button style={{ padding: "7px 14px", borderRadius: 9, fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,84,112,0.4)", background: "rgba(255,84,112,0.08)", color: "#FF5470", cursor: "pointer" }}>Удалить аккаунт</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function SettingsPage() {
  const [active, setActive] = useState("profile");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const groups = [...new Set(NAV.map(n => n.group))];
  const current = NAV.find(n => n.id === active);

  const renderPanel = () => {
    switch (active) {
      case "profile":       return <ProfilePanel saved={saved} onSave={handleSave} />;
      case "workspace":     return <WorkspacePanel saved={saved} onSave={handleSave} />;
      case "ai":            return <AIPanel />;
      case "team":          return <TeamPanel />;
      case "notifications": return <NotificationsPanel />;
      case "security":      return <SecurityPanel />;
      case "api":           return <APIPanel />;
      case "integrations":  return <IntegrationsPanel />;
      case "subscription":  return <SubscriptionPanel />;
      case "usage":         return <UsagePanel />;
      case "language":      return <LanguagePanel saved={saved} onSave={handleSave} />;
      case "appearance":    return <AppearancePanel />;
      case "advanced":      return <AdvancedPanel />;
      default:              return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#07090F", display: "flex", position: "relative" }}>
      {/* Ambient */}
      <div style={{ position: "fixed", top: -100, right: 0, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(122,92,255,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Left Nav */}
      <aside style={{ width: 220, flexShrink: 0, padding: "28px 12px", borderRight: "1px solid rgba(255,255,255,0.05)", position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <div style={{ marginBottom: 24, paddingLeft: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>Настройки</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>Apex AI Workspace</div>
        </div>

        {groups.map(group => (
          <div key={group} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", padding: "0 8px", marginBottom: 4 }}>{group}</div>
            {NAV.filter(n => n.group === group).map(item => (
              <button key={item.id} onClick={() => setActive(item.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 10, fontSize: 12, fontWeight: active === item.id ? 700 : 500, border: `1px solid ${active === item.id ? "rgba(122,92,255,0.25)" : "transparent"}`, background: active === item.id ? "rgba(122,92,255,0.12)" : "transparent", color: active === item.id ? "#fff" : "rgba(255,255,255,0.4)", cursor: "pointer", textAlign: "left", transition: "all 0.15s", marginBottom: 2 }}>
                <item.icon size={13} style={{ color: active === item.id ? "#7A5CFF" : "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                {item.label}
                {active === item.id && <ChevronRight size={11} style={{ color: "rgba(122,92,255,0.5)", marginLeft: "auto" }} />}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "28px 36px 60px", maxWidth: 760, overflowX: "hidden" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            {current && <current.icon size={16} style={{ color: "#7A5CFF" }} />}
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.4px" }}>{current?.label}</h1>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            {active === "profile" && "Управляй своим публичным профилем и личными данными"}
            {active === "workspace" && "Настройки вашей организации и бренда"}
            {active === "ai" && "Конфигурация AI-ассистента и 20 агентов совета директоров"}
            {active === "team" && "Управление участниками и правами доступа"}
            {active === "notifications" && "Контролируй как и когда ты получаешь уведомления"}
            {active === "security" && "Защита аккаунта, сессии и двухфакторная аутентификация"}
            {active === "api" && "API-ключи, вебхуки и интеграция через SDK"}
            {active === "integrations" && "Подключи сторонние сервисы к Apex AI"}
            {active === "subscription" && "Тарифный план, лимиты и история платежей"}
            {active === "usage" && "Мониторинг потребления AI и ресурсов"}
            {active === "language" && "Язык интерфейса, регион и форматы"}
            {active === "appearance" && "Тема, цвета и визуальные настройки"}
            {active === "advanced" && "Экспериментальные функции и управление данными"}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={active} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {renderPanel()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
