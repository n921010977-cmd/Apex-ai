"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Play, Bot, MessageSquare, Ticket, Activity,
  Calendar, Users, Search, ArrowUpRight, ChevronDown,
  ChevronRight, Send, Paperclip, Zap, Star, Clock,
  CheckCircle, AlertCircle, AlertTriangle, Phone,
  Mail, ExternalLink, Sparkles, Shield, BarChart2,
  Settings, Key, FileText, TrendingUp, Layers,
  Plus, X, Upload, Monitor,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { icon: BookOpen,    label: "Документация",   desc: "Гайды и туториалы",          color: "#7A5CFF", rgb: "122,92,255" },
  { icon: Play,        label: "Видеоуроки",     desc: "Обучающие видео",             color: "#5A8DFF", rgb: "90,141,255" },
  { icon: Bot,         label: "AI Помощник",    desc: "Мгновенные ответы",           color: "#00E7A7", rgb: "0,231,167" },
  { icon: MessageSquare,label: "Live Chat",     desc: "Онлайн прямо сейчас",        color: "#a78bfa", rgb: "167,139,250" },
  { icon: Ticket,      label: "Создать тикет",  desc: "Официальное обращение",       color: "#FFB800", rgb: "255,184,0" },
  { icon: Activity,    label: "Статус системы", desc: "Все сервисы работают",        color: "#00E7A7", rgb: "0,231,167" },
  { icon: Calendar,    label: "Демо-звонок",    desc: "Запланировать встречу",       color: "#FF5470", rgb: "255,84,112" },
  { icon: Users,       label: "Сообщество",     desc: "Форум и Discord",             color: "#5A8DFF", rgb: "90,141,255" },
];

const KB_CATEGORIES = [
  { icon: Zap,        label: "Начало работы",    articles: 12, color: "#7A5CFF" },
  { icon: Layers,     label: "Создание стратегии",articles: 8,  color: "#5A8DFF" },
  { icon: BarChart2,  label: "Аналитика",         articles: 15, color: "#00E7A7" },
  { icon: Bot,        label: "AI Агенты",          articles: 11, color: "#a78bfa" },
  { icon: TrendingUp, label: "Финансовые модели",  articles: 7,  color: "#FFB800" },
  { icon: ExternalLink,label: "Интеграции",        articles: 9,  color: "#FF5470" },
  { icon: Key,        label: "API",                articles: 6,  color: "#5A8DFF" },
  { icon: FileText,   label: "Отчёты",             articles: 10, color: "#7A5CFF" },
  { icon: Settings,   label: "Настройки",          articles: 8,  color: "#00E7A7" },
  { icon: Shield,     label: "Безопасность",       articles: 5,  color: "#FF5470" },
];

const POPULAR_ARTICLES = [
  { title: "Как создать первый AI-проект за 5 минут",           cat: "Начало работы",    time: "3 мин", reads: 4820, new: true  },
  { title: "Расшифровка рекомендаций AI Executive Board",       cat: "AI Агенты",        time: "7 мин", reads: 3210, new: false },
  { title: "Настройка интеграции с Notion и Slack",             cat: "Интеграции",       time: "5 мин", reads: 2890, new: true  },
  { title: "Финансовая модель: как AI считает ROI",             cat: "Финансовые модели",time: "9 мин", reads: 2140, new: false },
  { title: "Экспорт отчётов: PDF, Excel и API",                 cat: "Отчёты",           time: "4 мин", reads: 1960, new: false },
  { title: "Использование API ключей и вебхуков",               cat: "API",              time: "6 мин", reads: 1720, new: true  },
];

const FAQS = [
  { cat: "Основное", q: "Как работает AI Executive Board?",     a: "20 AI-агентов (CEO, CFO, CMO, CTO, COO, Product Manager и другие) анализируют ваш бизнес-план с разных углов. Каждый агент специализируется в своей области и даёт конкретные, применимые рекомендации с учётом вашего рынка и конкурентов." },
  { cat: "Основное", q: "Сколько проектов я могу создать?",     a: "На плане Starter — до 3 проектов одновременно. На плане Pro — неограниченно. Upgrade доступен в любой момент в разделе Настройки → Подписка." },
  { cat: "AI",       q: "Как долго длится AI-анализ?",          a: "Стандартный анализ занимает 2–5 минут. Глубокий анализ с детальными финансовыми моделями и рыночным исследованием — до 10–15 минут. Вы получите уведомление о готовности." },
  { cat: "AI",       q: "Могу ли я обучить AI под свой бизнес?",a: "Да. В разделе Настройки → AI Ассистент вы можете задать персональные инструкции, описать отрасль, приоритеты и стиль общения. AI будет учитывать их во всех сессиях." },
  { cat: "Отчёты",   q: "Могу ли я экспортировать отчёты?",     a: "Все отчёты доступны для скачивания в PDF. Пользователи Pro также получают экспорт в Excel и доступ через API. Экспорт находится на странице каждого отчёта." },
  { cat: "Команда",  q: "Как пригласить участников команды?",   a: "Перейдите в Настройки → Команда, введите email и выберите роль. На Starter доступно до 5 участников, на Pro — без ограничений. Участники получат email-приглашение." },
  { cat: "Биллинг",  q: "Можно ли отменить подписку?",          a: "Да, в любой момент в Настройки → Подписка. При отмене доступ сохраняется до конца оплаченного периода. Возврат средств за неиспользованные дни рассматривается индивидуально." },
];

const SERVICES = [
  { name: "API",                  status: "ok" },
  { name: "AI Агенты",            status: "ok" },
  { name: "Генерация отчётов",    status: "ok" },
  { name: "Аналитика",            status: "ok" },
  { name: "Авторизация",          status: "ok" },
  { name: "Интеграции",           status: "warn" },
];

const TICKETS = [
  { id: "APX-148", title: "AI не генерирует финансовую модель", status: "Решено",      priority: "Высокий", agent: "Sophia K.",  date: "28 июн", updated: "1 час назад" },
  { id: "APX-145", title: "Ошибка при экспорте PDF отчёта",     status: "В работе",    priority: "Средний",  agent: "Marcus R.",  date: "24 июн", updated: "3 часа назад" },
  { id: "APX-139", title: "Вопрос по тарификации API",          status: "Ожидает",     priority: "Низкий",   agent: "—",          date: "20 июн", updated: "вчера" },
];

const STATUS_STYLE: Record<string, { color: string; bg: string; dot: string }> = {
  "Решено":   { color: "#00E7A7", bg: "rgba(0,231,167,0.1)",  dot: "#00E7A7" },
  "В работе": { color: "#FFB800", bg: "rgba(255,184,0,0.1)",  dot: "#FFB800" },
  "Ожидает":  { color: "#5A8DFF", bg: "rgba(90,141,255,0.1)", dot: "#5A8DFF" },
};

const AI_QUICK = ["Как создать проект?","Как работает AI?","Пригласить команду","Экспортировать отчёт","Изменить тариф"];

const FAQ_CATS = ["Все","Основное","AI","Отчёты","Команда","Биллинг"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const color = status === "ok" ? "#00E7A7" : status === "warn" ? "#FFB800" : "#FF5470";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}`, display: "inline-block" }} />
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function SupportPage() {
  const [heroSearch, setHeroSearch] = useState("");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [faqCat, setFaqCat] = useState("Все");
  const [faqSearch, setFaqSearch] = useState("");
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<{ role: "user"|"ai"; text: string }[]>([]);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);
  const [ticketMsg, setTicketMsg] = useState("");

  const sendAI = (text: string) => {
    const q = text || aiInput;
    if (!q.trim()) return;
    setAiMessages(m => [...m, { role: "user", text: q }, { role: "ai", text: "Анализирую ваш запрос... Вот что я нашёл в базе знаний Apex AI: для «" + q + "» рекомендую обратиться к разделу документации или воспользоваться живым чатом. Если вопрос срочный — создайте тикет и команда ответит в течение 2 часов." }]);
    setAiInput("");
  };

  const sendTicket = () => {
    if (!ticketMsg.trim()) return;
    setTicketSent(true);
    setTimeout(() => { setTicketSent(false); setTicketOpen(false); setTicketMsg(""); }, 2500);
  };

  const filteredFAQ = FAQS.filter(f =>
    (faqCat === "Все" || f.cat === faqCat) &&
    (!faqSearch || f.q.toLowerCase().includes(faqSearch.toLowerCase()))
  );

  return (
    <div style={{ minHeight: "100vh", background: "#07090F", position: "relative", overflow: "hidden" }}>
      {/* Ambient */}
      <div style={{ position: "fixed", top: -200, left: "50%", transform: "translateX(-50%)", width: 700, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(122,92,255,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,231,167,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* ── HERO ── */}
      <div style={{ padding: "52px 40px 40px", textAlign: "center", position: "relative" }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 20, background: "rgba(0,231,167,0.08)", border: "1px solid rgba(0,231,167,0.18)", marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00E7A7", boxShadow: "0 0 8px #00E7A7" }} />
            <span style={{ fontSize: 11, color: "#00E7A7", fontWeight: 700 }}>Support Online · Среднее время ответа: 1.4 ч</span>
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 900, color: "#fff", letterSpacing: "-1px", lineHeight: 1.1, marginBottom: 12 }}>
            Центр поддержки<br />
            <span style={{ background: "linear-gradient(135deg, #7A5CFF, #5A8DFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI Executive Board</span>
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", marginBottom: 32, maxWidth: 520, margin: "0 auto 32px" }}>
            Получите помощь, изучите документацию или свяжитесь с нашей командой.
          </p>

          {/* Hero Search */}
          <div style={{ maxWidth: 560, margin: "0 auto 24px", position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", pointerEvents: "none" }} />
            <input
              value={heroSearch} onChange={e => setHeroSearch(e.target.value)}
              placeholder="Поиск по базе знаний, статьям, FAQ..."
              style={{ width: "100%", padding: "14px 18px 14px 46px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", backdropFilter: "blur(12px)" }}
              onFocus={e => (e.target.style.borderColor = "rgba(122,92,255,0.5)")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
            <kbd style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 5, padding: "2px 6px" }}>⌘K</kbd>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            <button onClick={() => setTicketOpen(true)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 11, fontSize: 13, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #7A5CFF, #5A8DFF)", color: "#fff", cursor: "pointer", boxShadow: "0 4px 20px rgba(122,92,255,0.35)" }}>
              <Plus size={14} />Создать обращение
            </button>
            <button style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 11, fontSize: 13, fontWeight: 600, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.65)", cursor: "pointer" }}>
              <MessageSquare size={14} />Live Chat
            </button>
          </div>
        </motion.div>
      </div>

      <div style={{ padding: "0 40px 60px", maxWidth: 1200, margin: "0 auto" }}>

        {/* ── QUICK ACTIONS ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 10, marginBottom: 32 }}>
          {QUICK_ACTIONS.map((a, i) => (
            <motion.button key={i} whileHover={{ y: -3, scale: 1.02 }} transition={{ type: "spring", stiffness: 400 }}
              style={{ borderRadius: 16, padding: "16px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer", textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${a.color}50, transparent)` }} />
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `rgba(${a.rgb},0.12)`, border: `1px solid rgba(${a.rgb},0.2)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                <a.icon size={16} style={{ color: a.color }} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{a.label}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", lineHeight: 1.3 }}>{a.desc}</div>
            </motion.button>
          ))}
        </motion.div>

        {/* ── BENTO ROW 1: AI Helper + Status ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, marginBottom: 16 }}>

          {/* AI Assistant */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            style={{ borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #00E7A780, transparent)" }} />
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(0,231,167,0.12)", border: "1px solid rgba(0,231,167,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={15} style={{ color: "#00E7A7" }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>AI Помощник</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Мгновенные ответы на ваши вопросы</div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: "rgba(0,231,167,0.08)", border: "1px solid rgba(0,231,167,0.15)" }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00E7A7", boxShadow: "0 0 6px #00E7A7" }} />
                <span style={{ fontSize: 10, color: "#00E7A7", fontWeight: 600 }}>Online</span>
              </div>
            </div>

            {/* Messages */}
            <div style={{ padding: "16px 24px", minHeight: 140, maxHeight: 220, overflowY: "auto" }}>
              {aiMessages.length === 0 ? (
                <div style={{ textAlign: "center", paddingTop: 16 }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginBottom: 16 }}>Спросите что-нибудь об Apex AI</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                    {AI_QUICK.map(q => (
                      <button key={q} onClick={() => sendAI(q)}
                        style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 500, border: "1px solid rgba(122,92,255,0.25)", background: "rgba(122,92,255,0.08)", color: "#a78bfa", cursor: "pointer" }}>{q}</button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {aiMessages.map((m, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                      <div style={{ maxWidth: "80%", padding: "9px 13px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.role === "user" ? "rgba(122,92,255,0.2)" : "rgba(0,231,167,0.08)", border: m.role === "user" ? "1px solid rgba(122,92,255,0.3)" : "1px solid rgba(0,231,167,0.15)", fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 8 }}>
              <input value={aiInput} onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendAI("")}
                placeholder="Задайте вопрос AI..."
                style={{ flex: 1, padding: "9px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 12, outline: "none" }}
                onFocus={e => (e.target.style.borderColor = "rgba(0,231,167,0.4)")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
              <button onClick={() => sendAI("")}
                style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,231,167,0.15)", border: "1px solid rgba(0,231,167,0.25)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Send size={14} style={{ color: "#00E7A7" }} />
              </button>
            </div>
          </motion.div>

          {/* Status + Contacts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* System Status */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              style={{ borderRadius: 18, padding: "18px 20px", background: "rgba(0,231,167,0.04)", border: "1px solid rgba(0,231,167,0.1)", flex: 1, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #00E7A740, transparent)" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Статус системы</div>
                <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: "rgba(0,231,167,0.12)", color: "#00E7A7", fontWeight: 700 }}>Всё работает</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {SERVICES.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{s.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <StatusDot status={s.status} />
                      <span style={{ fontSize: 10, color: s.status === "ok" ? "#00E7A7" : "#FFB800", fontWeight: 600 }}>{s.status === "ok" ? "Работает" : "Замедление"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Contacts */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
              style={{ borderRadius: 18, padding: "16px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 12 }}>Контакты</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { icon: Mail,         label: "support@apex-ai.com",  sub: "Ответ до 2 часов" },
                  { icon: MessageSquare,label: "Telegram @ApexAIBot",   sub: "Бот 24/7" },
                  { icon: Clock,        label: "Пн–Пт, 9:00–18:00",    sub: "MSK · Живой чат" },
                ].map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(122,92,255,0.1)", border: "1px solid rgba(122,92,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <c.icon size={12} style={{ color: "#7A5CFF" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>{c.label}</div>
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
          style={{ borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "24px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #7A5CFF60, transparent)" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>База знаний</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>91 статья по всем разделам</div>
            </div>
            <button style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "#7A5CFF", background: "transparent", border: "none", cursor: "pointer" }}>
              Все статьи <ArrowUpRight size={12} />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {KB_CATEGORIES.map((k, i) => (
              <motion.button key={i} whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400 }}
                style={{ borderRadius: 14, padding: "14px 12px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", textAlign: "left", position: "relative", overflow: "hidden" }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${k.color}16`, border: `1px solid ${k.color}28`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <k.icon size={13} style={{ color: k.color }} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.75)", marginBottom: 3 }}>{k.label}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>{k.articles} статей</div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ── POPULAR ARTICLES + TICKETS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

          {/* Popular */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            style={{ borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #5A8DFF60, transparent)" }} />
            <div style={{ padding: "20px 22px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Популярные статьи</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>Самые читаемые материалы</div>
              </div>
              <Star size={13} style={{ color: "rgba(255,255,255,0.2)" }} />
            </div>
            <div style={{ padding: "8px 8px" }}>
              {POPULAR_ARTICLES.map((a, i) => (
                <motion.button key={i} whileHover={{ background: "rgba(255,255,255,0.03)" }} transition={{ duration: 0.15 }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7A5CFF", flexShrink: 0, opacity: 0.7 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{a.cat}</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.18)" }}>·</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{a.time} чтения</span>
                      {a.new && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: "rgba(0,231,167,0.1)", color: "#00E7A7", fontWeight: 700 }}>NEW</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", flexShrink: 0 }}>{(a.reads / 1000).toFixed(1)}k</div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Tickets */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #FFB80060, transparent)" }} />
            <div style={{ padding: "20px 22px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Мои обращения</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>3 тикета</div>
              </div>
              <button onClick={() => setTicketOpen(true)}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: "none", background: "rgba(122,92,255,0.12)", color: "#a78bfa", cursor: "pointer" }}>
                <Plus size={11} />Новый
              </button>
            </div>
            <div style={{ padding: "8px 8px" }}>
              {TICKETS.map((t, i) => (
                <motion.div key={i} whileHover={{ background: "rgba(255,255,255,0.025)" }} transition={{ duration: 0.15 }}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, cursor: "pointer" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.3)" }}>{t.id}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{t.agent}</span>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.18)" }}>·</span>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{t.updated}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: STATUS_STYLE[t.status]?.bg, color: STATUS_STYLE[t.status]?.color, fontWeight: 700, flexShrink: 0 }}>{t.status}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── FAQ ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          style={{ borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "24px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>Часто задаваемые вопросы</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{FAQS.length} вопросов в {FAQ_CATS.length - 1} категориях</div>
            </div>
            <div style={{ position: "relative" }}>
              <Search size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", pointerEvents: "none" }} />
              <input value={faqSearch} onChange={e => setFaqSearch(e.target.value)} placeholder="Поиск..."
                style={{ padding: "7px 12px 7px 28px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 12, outline: "none", width: 180 }}
                onFocus={e => (e.target.style.borderColor = "rgba(122,92,255,0.4)")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
            </div>
          </div>

          {/* Category tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {FAQ_CATS.map(c => (
              <button key={c} onClick={() => setFaqCat(c)}
                style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, border: `1px solid ${faqCat === c ? "rgba(122,92,255,0.4)" : "rgba(255,255,255,0.07)"}`, background: faqCat === c ? "rgba(122,92,255,0.12)" : "transparent", color: faqCat === c ? "#a78bfa" : "rgba(255,255,255,0.35)", cursor: "pointer", transition: "all 0.15s" }}>{c}</button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filteredFAQ.map((faq, i) => (
              <div key={i} style={{ borderRadius: 12, border: `1px solid ${faqOpen === i ? "rgba(122,92,255,0.2)" : "rgba(255,255,255,0.05)"}`, background: faqOpen === i ? "rgba(122,92,255,0.05)" : "transparent", overflow: "hidden", transition: "all 0.2s" }}>
                <button onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                    <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 5, background: "rgba(122,92,255,0.1)", color: "#a78bfa", fontWeight: 700, flexShrink: 0 }}>{faq.cat}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: faqOpen === i ? "#fff" : "rgba(255,255,255,0.7)" }}>{faq.q}</span>
                  </div>
                  <motion.div animate={{ rotate: faqOpen === i ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={14} style={{ color: faqOpen === i ? "#7A5CFF" : "rgba(255,255,255,0.25)", flexShrink: 0 }} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {faqOpen === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
                      <div style={{ padding: "0 18px 16px 18px", fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12, marginTop: 0 }}>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
            {filteredFAQ.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>По запросу «{faqSearch}» ничего не найдено</div>
            )}
          </div>
        </motion.div>

      </div>

      {/* ── TICKET MODAL ── */}
      <AnimatePresence>
        {ticketOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={e => e.target === e.currentTarget && setTicketOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              style={{ width: "100%", maxWidth: 560, borderRadius: 22, background: "#0d0f14", border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #7A5CFF80, transparent)" }} />

              {ticketSent ? (
                <div style={{ padding: "60px 40px", textAlign: "center" }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
                    style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(0,231,167,0.12)", border: "1px solid rgba(0,231,167,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <CheckCircle size={28} style={{ color: "#00E7A7" }} />
                  </motion.div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Обращение создано!</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Мы ответим в течение 2 часов. Следите за статусом в разделе «Мои обращения».</div>
                </div>
              ) : (
                <>
                  <div style={{ padding: "22px 28px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>Новое обращение</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>Опишите проблему и мы поможем</div>
                    </div>
                    <button onClick={() => setTicketOpen(false)} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <X size={13} style={{ color: "rgba(255,255,255,0.5)" }} />
                    </button>
                  </div>

                  <div style={{ padding: "22px 28px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Категория</label>
                        <select style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box" }}>
                          <option>Технический вопрос</option><option>Биллинг</option><option>AI Агенты</option><option>Интеграции</option><option>Другое</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Приоритет</label>
                        <select style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box" }}>
                          <option>Низкий</option><option>Средний</option><option>Высокий</option><option>Критичный</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Тема</label>
                      <input placeholder="Краткое описание проблемы" style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box" }}
                        onFocus={e => (e.target.style.borderColor = "rgba(122,92,255,0.4)")}
                        onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Описание</label>
                      <textarea value={ticketMsg} onChange={e => setTicketMsg(e.target.value)}
                        placeholder="Опишите проблему подробно..."
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 12, outline: "none", resize: "none", height: 90, boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.6 }}
                        onFocus={e => (e.target.style.borderColor = "rgba(122,92,255,0.4)")}
                        onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
                    </div>
                    <div style={{ padding: "10px 14px", borderRadius: 10, border: "1px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 18 }}>
                      <Paperclip size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Прикрепить файл, скриншот или запись экрана</span>
                      <span style={{ marginLeft: "auto", fontSize: 10, color: "rgba(255,255,255,0.18)" }}>Макс. 25 MB</span>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => setTicketOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: 11, fontSize: 12, fontWeight: 600, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>Отмена</button>
                      <button onClick={sendTicket} style={{ flex: 2, padding: "10px", borderRadius: 11, fontSize: 12, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #7A5CFF, #5A8DFF)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                        <Send size={13} />Отправить обращение
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
