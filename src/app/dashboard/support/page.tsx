"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen, Play, Bot, MessageSquare, Ticket, Activity,
  Calendar, Users, Search, ArrowUpRight, ChevronDown,
  Send, Paperclip, Star, Clock, CheckCircle,
  Mail, Zap, BarChart2, Settings, Key, FileText,
  TrendingUp, Layers, Shield, ExternalLink, Plus, X,
} from "lucide-react";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { icon: BookOpen,     label: "Документация",    desc: "Гайды и туториалы",     href: "#" },
  { icon: Play,         label: "Видеоуроки",      desc: "Обучающие видео",        href: "#" },
  { icon: Bot,          label: "AI Помощник",     desc: "Мгновенные ответы",      href: "#" },
  { icon: MessageSquare,label: "Live Chat",       desc: "Онлайн прямо сейчас",   href: "#" },
  { icon: Ticket,       label: "Создать тикет",   desc: "Официальное обращение",  href: "#" },
  { icon: Activity,     label: "Статус системы",  desc: "Все сервисы работают",   href: "#" },
  { icon: Calendar,     label: "Демо-звонок",     desc: "Запланировать встречу",  href: "#" },
  { icon: Users,        label: "Сообщество",      desc: "Форум и Discord",        href: "#" },
];

const KB_CATEGORIES = [
  { icon: Zap,         label: "Начало работы",     articles: 12 },
  { icon: Layers,      label: "Создание стратегии", articles: 8  },
  { icon: BarChart2,   label: "Аналитика",          articles: 15 },
  { icon: Bot,         label: "AI Агенты",           articles: 11 },
  { icon: TrendingUp,  label: "Финансовые модели",   articles: 7  },
  { icon: ExternalLink,label: "Интеграции",          articles: 9  },
  { icon: Key,         label: "API",                 articles: 6  },
  { icon: FileText,    label: "Отчёты",              articles: 10 },
  { icon: Settings,    label: "Настройки",           articles: 8  },
  { icon: Shield,      label: "Безопасность",        articles: 5  },
];

const POPULAR_ARTICLES = [
  { title: "Как создать первый AI-проект за 5 минут",            cat: "Начало работы",      time: "3 мин", reads: 4820, isNew: true  },
  { title: "Расшифровка рекомендаций AI Executive Board",        cat: "AI Агенты",           time: "7 мин", reads: 3210, isNew: false },
  { title: "Настройка интеграции с Notion и Slack",              cat: "Интеграции",          time: "5 мин", reads: 2890, isNew: true  },
  { title: "Финансовая модель: как AI считает ROI",              cat: "Финансовые модели",   time: "9 мин", reads: 2140, isNew: false },
  { title: "Экспорт отчётов: PDF, Excel и API",                  cat: "Отчёты",              time: "4 мин", reads: 1960, isNew: false },
  { title: "Использование API ключей и вебхуков",                cat: "API",                 time: "6 мин", reads: 1720, isNew: true  },
];

const FAQS = [
  { cat: "Основное", q: "Как работает AI Executive Board?",      a: "20 AI-агентов (CEO, CFO, CMO, CTO, COO, Product Manager и другие) анализируют ваш бизнес-план с разных углов. Каждый агент специализируется в своей области и даёт конкретные, применимые рекомендации с учётом вашего рынка и конкурентов." },
  { cat: "Основное", q: "Сколько проектов я могу создать?",      a: "На плане Starter — до 3 проектов одновременно. На плане Pro — неограниченно. Upgrade доступен в любой момент в разделе Настройки → Подписка." },
  { cat: "AI",       q: "Как долго длится AI-анализ?",           a: "Стандартный анализ занимает 2–5 минут. Глубокий анализ с детальными финансовыми моделями и рыночным исследованием — до 10–15 минут. Вы получите уведомление о готовности." },
  { cat: "AI",       q: "Могу ли я обучить AI под свой бизнес?", a: "Да. В разделе Настройки → AI Ассистент вы можете задать персональные инструкции, описать отрасль, приоритеты и стиль общения. AI будет учитывать их во всех сессиях." },
  { cat: "Отчёты",   q: "Могу ли я экспортировать отчёты?",      a: "Все отчёты доступны для скачивания в PDF. Пользователи Pro также получают экспорт в Excel и доступ через API. Экспорт находится на странице каждого отчёта." },
  { cat: "Команда",  q: "Как пригласить участников команды?",    a: "Перейдите в Настройки → Команда, введите email и выберите роль. На Starter доступно до 5 участников, на Pro — без ограничений. Участники получат email-приглашение." },
  { cat: "Биллинг",  q: "Можно ли отменить подписку?",           a: "Да, в любой момент в Настройки → Подписка. При отмене доступ сохраняется до конца оплаченного периода. Возврат средств за неиспользованные дни рассматривается индивидуально." },
];

const SERVICES = [
  { name: "API",               status: "ok"   },
  { name: "AI Агенты",         status: "ok"   },
  { name: "Генерация отчётов", status: "ok"   },
  { name: "Аналитика",         status: "ok"   },
  { name: "Авторизация",       status: "ok"   },
  { name: "Интеграции",        status: "warn" },
];

const TICKETS = [
  { id: "APX-148", title: "AI не генерирует финансовую модель", status: "Решено",   priority: "Высокий", agent: "Sophia K.",  updated: "1 час назад" },
  { id: "APX-145", title: "Ошибка при экспорте PDF отчёта",     status: "В работе", priority: "Средний",  agent: "Marcus R.",  updated: "3 часа назад" },
  { id: "APX-139", title: "Вопрос по тарификации API",          status: "Ожидает",  priority: "Низкий",   agent: "—",          updated: "вчера" },
];

const AI_SUGGESTIONS = ["Как создать проект?", "Как работает AI?", "Пригласить команду", "Экспорт отчёта", "Изменить тариф"];
const FAQ_CATS = ["Все", "Основное", "AI", "Отчёты", "Команда", "Биллинг"];

const TICKET_STATUS: Record<string, { color: string; bg: string }> = {
  "Решено":   { color: "#10b981", bg: "rgba(16,185,129,0.1)"  },
  "В работе": { color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
  "Ожидает":  { color: "#6366f1", bg: "rgba(99,102,241,0.1)"  },
};

// ─── SHARED STYLES ─────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "10px 14px",
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12, color: "#E5E7EB",
  fontSize: 13, outline: "none",
  fontFamily: "inherit",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function useFocusBorder(color = "rgba(99,102,241,0.5)") {
  return {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.target.style.borderColor = color; },
    onBlur:  (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; },
  };
}

// ─── AI CHAT PANEL ────────────────────────────────────────────────────────────

function AIChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fb = useFocusBorder();

  const send = (text: string) => {
    const q = text || input;
    if (!q.trim() || typing) return;
    setMessages(m => [...m, { role: "user", text: q }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages(m => [...m, {
        role: "ai",
        text: `По запросу «${q}» нашёл в базе знаний: ${q.toLowerCase().includes("проект") ? "откройте дашборд → кнопка «Новый проект» → заполните 3 шага формы." : q.toLowerCase().includes("ai") ? "AI Executive Board запускается автоматически после создания проекта. Анализ занимает 2–5 мин." : "рекомендую обратиться к документации или создать тикет — команда ответит в течение 2 часов."}`,
      }]);
      setTyping(false);
    }, 900);
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  return (
    <div style={{ ...card, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Bot size={15} style={{ color: "#10b981" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#E5E7EB" }}>AI Помощник</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Мгновенные ответы на ваши вопросы</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.12)" }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
          <span style={{ fontSize: 10, color: "#10b981", fontWeight: 600 }}>Online</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: "16px 20px", minHeight: 160, maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.length === 0 ? (
          <div style={{ paddingTop: 8 }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 12 }}>Спросите что-нибудь об Apex AI</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {AI_SUGGESTIONS.map(q => (
                <button key={q} onClick={() => send(q)} style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 500,
                  border: "1px solid rgba(99,102,241,0.2)", background: "rgba(99,102,241,0.07)",
                  color: "#a5b4fc", cursor: "pointer",
                }}>{q}</button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "82%", padding: "8px 12px", fontSize: 12, lineHeight: 1.6,
                  color: "rgba(255,255,255,0.8)",
                  borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: m.role === "user" ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.04)",
                  border: m.role === "user" ? "1px solid rgba(99,102,241,0.25)" : "1px solid rgba(255,255,255,0.06)",
                }}>{m.text}</div>
              </div>
            ))}
            {typing && (
              <div style={{ display: "flex", gap: 4, padding: "10px 14px" }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "inline-block", animation: `dot-bounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send("")}
          placeholder="Задайте вопрос AI..."
          style={{ ...inputStyle, flex: 1, padding: "9px 12px" }}
          {...useFocusBorder()} />
        <button onClick={() => send("")} style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <Send size={13} style={{ color: "#6366f1" }} />
        </button>
      </div>
      <style>{`@keyframes dot-bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }`}</style>
    </div>
  );
}

// ─── TICKET MODAL ─────────────────────────────────────────────────────────────

function TicketModal({ onClose }: { onClose: () => void }) {
  const [msg, setMsg] = useState("");
  const [subject, setSubject] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const fb = useFocusBorder();

  const submit = () => {
    if (!msg.trim() || !subject.trim() || loading) return;
    setLoading(true);
    setTimeout(() => { setSent(true); setLoading(false); setTimeout(onClose, 2500); }, 1200);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
        style={{ width: "100%", maxWidth: 540, background: "#0C0E14", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 22, overflow: "hidden" }}>

        {sent ? (
          <div style={{ padding: "56px 40px", textAlign: "center" }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}
              style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <CheckCircle size={24} style={{ color: "#10b981" }} />
            </motion.div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#E5E7EB", marginBottom: 8, letterSpacing: "-0.02em" }}>Обращение создано</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>Мы ответим в течение 2 часов.<br/>Следите за статусом в разделе «Мои обращения».</div>
          </div>
        ) : (
          <>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#E5E7EB", letterSpacing: "-0.01em" }}>Новое обращение</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>Опишите проблему, мы поможем</div>
              </div>
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={13} style={{ color: "rgba(255,255,255,0.4)" }} />
              </button>
            </div>

            <div style={{ padding: "20px 24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Категория</label>
                  <select style={{ ...inputStyle }} {...fb}>
                    <option>Технический вопрос</option>
                    <option>Биллинг</option>
                    <option>AI Агенты</option>
                    <option>Интеграции</option>
                    <option>Другое</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Приоритет</label>
                  <select style={{ ...inputStyle }} {...fb}>
                    <option>Низкий</option>
                    <option>Средний</option>
                    <option>Высокий</option>
                    <option>Критичный</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Тема</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Краткое описание проблемы" style={{ ...inputStyle }} {...fb} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Описание</label>
                <textarea value={msg} onChange={e => setMsg(e.target.value)}
                  placeholder="Опишите проблему подробно..."
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                  {...(useFocusBorder() as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} />
              </div>

              <div style={{ padding: "10px 14px", borderRadius: 12, border: "1px dashed rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 20 }}>
                <Paperclip size={13} style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Прикрепить файл или скриншот</span>
                <span style={{ marginLeft: "auto", fontSize: 10, color: "rgba(255,255,255,0.2)" }}>Макс. 25 МБ</span>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={onClose} style={{
                  flex: 1, height: 44, borderRadius: 12, fontSize: 13, fontWeight: 600,
                  border: "1px solid rgba(255,255,255,0.08)", background: "transparent",
                  color: "rgba(255,255,255,0.4)", cursor: "pointer",
                }}>Отмена</button>
                <button onClick={submit} disabled={loading || !msg.trim() || !subject.trim()} style={{
                  flex: 2, height: 44, borderRadius: 12, fontSize: 13, fontWeight: 700,
                  border: "none", cursor: "pointer",
                  background: loading ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg,#6366f1,#4f46e5)",
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  opacity: (!msg.trim() || !subject.trim()) ? 0.5 : 1,
                  transition: "all 0.15s",
                }}>
                  {loading ? (
                    <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  ) : <Send size={13} />}
                  {loading ? "Отправка..." : "Отправить обращение"}
                </button>
              </div>
            </div>
          </>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </motion.div>
    </motion.div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const [heroSearch, setHeroSearch] = useState("");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [faqCat, setFaqCat] = useState("Все");
  const [faqSearch, setFaqSearch] = useState("");
  const [ticketOpen, setTicketOpen] = useState(false);
  const fb = useFocusBorder();

  const filteredFAQ = FAQS.filter(f =>
    (faqCat === "Все" || f.cat === faqCat) &&
    (!faqSearch || f.q.toLowerCase().includes(faqSearch.toLowerCase()))
  );

  return (
    <div style={{ padding: "0 0 64px", maxWidth: 1200, margin: "0 auto" }}>

      {/* ── HERO ── */}
      <div style={{ padding: "48px 40px 40px", textAlign: "center" }}>
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.15)", marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>Support Online · Среднее время ответа: 1.4 ч</span>
          </div>

          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#E5E7EB", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 12 }}>
            Центр поддержки
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", marginBottom: 32, maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.6 }}>
            Найдите ответы в базе знаний, пообщайтесь с AI или создайте обращение.
          </p>

          {/* Search */}
          <div style={{ maxWidth: 540, margin: "0 auto 24px", position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", pointerEvents: "none" }} />
            <input value={heroSearch} onChange={e => setHeroSearch(e.target.value)}
              placeholder="Поиск по базе знаний, статьям, FAQ..."
              style={{ ...inputStyle, padding: "14px 48px 14px 44px", borderRadius: 14, fontSize: 14 }}
              {...fb} />
            <kbd style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 5, padding: "2px 6px" }}>⌘K</kbd>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            <button onClick={() => setTicketOpen(true)} style={{
              display: "flex", alignItems: "center", gap: 7,
              height: 44, padding: "0 20px", borderRadius: 12, fontSize: 13, fontWeight: 700,
              border: "none", background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff",
              cursor: "pointer", boxShadow: "0 4px 16px rgba(99,102,241,0.25)",
            }}>
              <Plus size={14} />Создать обращение
            </button>
            <button style={{
              display: "flex", alignItems: "center", gap: 7,
              height: 44, padding: "0 20px", borderRadius: 12, fontSize: 13, fontWeight: 600,
              border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)",
              color: "rgba(255,255,255,0.6)", cursor: "pointer",
            }}>
              <MessageSquare size={14} />Live Chat
            </button>
          </div>
        </motion.div>
      </div>

      <div style={{ padding: "0 40px" }}>

        {/* ── QUICK ACTIONS ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 8, marginBottom: 24 }}>
          {QUICK_ACTIONS.map((a, i) => (
            <button key={i} style={{
              ...card, padding: "16px 8px", textAlign: "center", cursor: "pointer",
              transition: "border-color 0.15s, transform 0.15s",
              borderRadius: 12,
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.13)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                <a.icon size={14} style={{ color: "#6366f1" }} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#E5E7EB", marginBottom: 2 }}>{a.label}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", lineHeight: 1.3 }}>{a.desc}</div>
            </button>
          ))}
        </motion.div>

        {/* ── MAIN ROW: AI Chat + Sidebar ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginBottom: 16 }}>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <AIChat />
          </motion.div>

          {/* Status + Contacts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* System Status */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              style={{ ...card, padding: "20px", borderRadius: 16, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#E5E7EB" }}>Статус системы</div>
                <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.12)", color: "#10b981", fontWeight: 700 }}>Работает</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {SERVICES.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{s.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.status === "ok" ? "#10b981" : "#f59e0b", display: "inline-block" }} />
                      <span style={{ fontSize: 11, color: s.status === "ok" ? "#10b981" : "#f59e0b", fontWeight: 600 }}>{s.status === "ok" ? "Работает" : "Замедление"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Contacts */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
              style={{ ...card, padding: "20px", borderRadius: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#E5E7EB", marginBottom: 14 }}>Контакты</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { icon: Mail,          label: "support@apex-ai.com", sub: "Ответ до 2 часов" },
                  { icon: MessageSquare, label: "Telegram @ApexAIBot",  sub: "Бот 24/7" },
                  { icon: Clock,         label: "Пн–Пт, 9:00–18:00",   sub: "MSK · Живой чат" },
                ].map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <c.icon size={12} style={{ color: "rgba(255,255,255,0.4)" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{c.label}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>{c.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── KNOWLEDGE BASE ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ ...card, padding: "24px", marginBottom: 16, borderRadius: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#E5E7EB", letterSpacing: "-0.01em" }}>База знаний</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>91 статья по всем разделам</div>
            </div>
            <button style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#6366f1", background: "transparent", border: "none", cursor: "pointer" }}>
              Все статьи <ArrowUpRight size={12} />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
            {KB_CATEGORIES.map((k, i) => (
              <button key={i} style={{
                ...card, padding: "14px 12px", textAlign: "left", cursor: "pointer",
                transition: "border-color 0.15s", borderRadius: 12,
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.13)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)"; }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <k.icon size={13} style={{ color: "rgba(255,255,255,0.5)" }} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.75)", marginBottom: 2 }}>{k.label}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>{k.articles} статей</div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── POPULAR ARTICLES + MY TICKETS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

          {/* Popular articles */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            style={{ ...card, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#E5E7EB" }}>Популярные статьи</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>Самые читаемые материалы</div>
              </div>
              <Star size={13} style={{ color: "rgba(255,255,255,0.2)" }} />
            </div>
            <div style={{ padding: "8px" }}>
              {POPULAR_ARTICLES.map((a, i) => (
                <button key={i} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px", borderRadius: 10, border: "none",
                  background: "transparent", cursor: "pointer", textAlign: "left",
                  transition: "background 0.12s",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(99,102,241,0.6)", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{a.cat}</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)" }}>·</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{a.time} чтения</span>
                      {a.isNew && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)", color: "#10b981", fontWeight: 700 }}>NEW</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", flexShrink: 0 }}>{(a.reads / 1000).toFixed(1)}k</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* My tickets */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ ...card, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#E5E7EB" }}>Мои обращения</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{TICKETS.length} тикета</div>
              </div>
              <button onClick={() => setTicketOpen(true)} style={{
                display: "flex", alignItems: "center", gap: 5, padding: "5px 12px",
                height: 30, borderRadius: 8, fontSize: 11, fontWeight: 700, border: "none",
                background: "rgba(99,102,241,0.1)", borderColor: "rgba(99,102,241,0.18)",
                color: "#6366f1", cursor: "pointer",
              } as React.CSSProperties}>
                <Plus size={11} />Новый
              </button>
            </div>
            <div style={{ padding: "8px" }}>
              {TICKETS.map((t, i) => {
                const s = TICKET_STATUS[t.status] ?? TICKET_STATUS["Ожидает"];
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                    transition: "background 0.12s",
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.25)" }}>{t.id}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>{t.agent}</span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)" }}>·</span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>{t.updated}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: s.bg, color: s.color, fontWeight: 700, flexShrink: 0 }}>{t.status}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* ── FAQ ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          style={{ ...card, padding: "24px", borderRadius: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#E5E7EB", letterSpacing: "-0.01em" }}>Частые вопросы</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{FAQS.length} вопросов</div>
            </div>
            <div style={{ position: "relative" }}>
              <Search size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", pointerEvents: "none" }} />
              <input value={faqSearch} onChange={e => setFaqSearch(e.target.value)} placeholder="Поиск..."
                style={{ ...inputStyle, padding: "7px 12px 7px 28px", width: 170, borderRadius: 10 }}
                {...fb} />
            </div>
          </div>

          {/* Category pills */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {FAQ_CATS.map(c => (
              <button key={c} onClick={() => setFaqCat(c)} style={{
                padding: "5px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
                border: `1px solid ${faqCat === c ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.07)"}`,
                background: faqCat === c ? "rgba(99,102,241,0.1)" : "transparent",
                color: faqCat === c ? "#a5b4fc" : "rgba(255,255,255,0.35)",
                transition: "all 0.15s",
              }}>{c}</button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {filteredFAQ.map((faq, i) => (
              <div key={i} style={{
                borderRadius: 12,
                border: `1px solid ${faqOpen === i ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.05)"}`,
                background: faqOpen === i ? "rgba(99,102,241,0.04)" : "transparent",
                overflow: "hidden", transition: "border-color 0.2s, background 0.2s",
              }}>
                <button onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                    <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 5, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", color: "#818cf8", fontWeight: 700, flexShrink: 0 }}>{faq.cat}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: faqOpen === i ? "#E5E7EB" : "rgba(255,255,255,0.65)" }}>{faq.q}</span>
                  </div>
                  <motion.div animate={{ rotate: faqOpen === i ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={14} style={{ color: faqOpen === i ? "#6366f1" : "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {faqOpen === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
                      <div style={{ padding: "0 16px 16px", paddingTop: 0, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <div style={{ paddingTop: 12, fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>{faq.a}</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
            {filteredFAQ.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
                По запросу «{faqSearch}» ничего не найдено
              </div>
            )}
          </div>
        </motion.div>

      </div>

      {/* Ticket Modal */}
      <AnimatePresence>
        {ticketOpen && <TicketModal onClose={() => setTicketOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
