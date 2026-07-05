"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search, Plus, Star, Pin, Archive, Users, MessageSquare,
  Send, Paperclip, Mic, Image, Globe, FileText,
  ChevronRight, Zap, Brain, Target, Rocket, Crown,
  TrendingUp, BarChart2, Shield, Settings2, Sparkles,
  Clock, CheckCircle, Filter, Grid, List,
  Layers, Code, Database, Cloud, Lock,
  UserCheck, BookOpen, PenTool, Video, Mail,
  ShoppingCart, Phone, Activity, Award, Briefcase,
} from "lucide-react";

// ─── AGENTS ──────────────────────────────────────────────────────────────────

const AGENTS = [
  // Руководство
  { id:"ceo",     dept:"Руководство",   name:"CEO",              role:"Стратег",           desc:"Стратегическое видение, приоритеты, ключевые решения",    icon:"👑", color:"#8b5cf6", model:"Claude Opus", tasks:2847, rating:4.9, speed:"1.2s", online:true  },
  { id:"coo",     dept:"Руководство",   name:"COO",              role:"Операционист",      desc:"Процессы, масштабирование, операционная эффективность",   icon:"📈", color:"#3b82f6", model:"Claude Opus", tasks:2103, rating:4.8, speed:"1.4s", online:true  },
  { id:"cfo",     dept:"Руководство",   name:"CFO",              role:"Финансист",         desc:"Финансовые модели, ROI, инвестиции, бюджетирование",      icon:"💰", color:"#10b981", model:"Claude Opus", tasks:1984, rating:4.9, speed:"1.1s", online:true  },
  { id:"cmo",     dept:"Руководство",   name:"CMO",              role:"Маркетолог",        desc:"Go-to-market, бренд, рост аудитории, каналы",             icon:"📢", color:"#f43f5e", model:"Claude Sonnet",tasks:1756,rating:4.7, speed:"0.9s", online:true  },
  { id:"cso",     dept:"Руководство",   name:"CSO",              role:"Стратег продаж",    desc:"Sales-стратегия, партнёрства, корпоративные сделки",      icon:"💼", color:"#f59e0b", model:"Claude Sonnet",tasks:1423,rating:4.8, speed:"1.0s", online:false },
  { id:"cto",     dept:"Руководство",   name:"CTO",              role:"Технический директор","desc":"Технологический стек, архитектура, R&D стратегия",    icon:"⚡", color:"#a78bfa", model:"Claude Opus", tasks:1612, rating:4.8, speed:"1.3s", online:true  },
  // Финансы
  { id:"inv",     dept:"Финансы",       name:"Investment Analyst",role:"Аналитик",         desc:"Оценка инвестиций, DCF, венчурный анализ, due diligence", icon:"📉", color:"#10b981", model:"Claude Sonnet",tasks:890, rating:4.7, speed:"1.5s", online:true  },
  { id:"fp",      dept:"Финансы",       name:"Financial Planner", role:"Планировщик",      desc:"Бюджетирование, прогнозирование, P&L, денежные потоки",  icon:"📊", color:"#3b82f6", model:"Claude Sonnet",tasks:743, rating:4.6, speed:"1.2s", online:false },
  { id:"budget",  dept:"Финансы",       name:"Budget Manager",    role:"Менеджер",         desc:"Контроль расходов, оптимизация бюджета, unit-экономика",  icon:"💳", color:"#8b5cf6", model:"Claude Haiku", tasks:612, rating:4.5, speed:"0.7s", online:true  },
  { id:"rev",     dept:"Финансы",       name:"Revenue Analyst",   role:"Аналитик",         desc:"Анализ выручки, MRR/ARR, когортный анализ, churn",        icon:"📈", color:"#f59e0b", model:"Claude Sonnet",tasks:528, rating:4.7, speed:"1.1s", online:true  },
  { id:"fund",    dept:"Финансы",       name:"Fundraising Advisor",role:"Советник",        desc:"Питч-деки, term sheet, переговоры с инвесторами",         icon:"🏦", color:"#f43f5e", model:"Claude Opus", tasks:421, rating:4.9, speed:"1.6s", online:false },
  // Маркетинг
  { id:"perf",    dept:"Маркетинг",     name:"Performance Marketer",role:"Перфоманс",      desc:"Платная реклама, ROAS, CPA, A/B тестирование",            icon:"🎯", color:"#f43f5e", model:"Claude Sonnet",tasks:1102,rating:4.7, speed:"0.9s", online:true  },
  { id:"brand",   dept:"Маркетинг",     name:"Brand Strategist",  role:"Бренд",            desc:"Идентичность бренда, позиционирование, нарратив",         icon:"🎨", color:"#a78bfa", model:"Claude Sonnet",tasks:876, rating:4.8, speed:"1.0s", online:true  },
  { id:"smm",     dept:"Маркетинг",     name:"Social Media Manager",role:"SMM",            desc:"Контент для соцсетей, виральность, сообщества",           icon:"📱", color:"#3b82f6", model:"Claude Haiku", tasks:1430,rating:4.5, speed:"0.6s", online:true  },
  { id:"copy",    dept:"Маркетинг",     name:"Copywriter",        role:"Копирайтер",       desc:"Продающие тексты, UX-копи, storytelling, landing pages",  icon:"✍️", color:"#10b981", model:"Claude Sonnet",tasks:2100,rating:4.8, speed:"0.8s", online:true  },
  { id:"seo",     dept:"Маркетинг",     name:"SEO Expert",        role:"SEO",              desc:"Семантика, техническое SEO, контентная стратегия",        icon:"🔍", color:"#f59e0b", model:"Claude Sonnet",tasks:914, rating:4.6, speed:"1.1s", online:false },
  { id:"growth",  dept:"Маркетинг",     name:"Growth Hacker",     role:"Рост",             desc:"Виральные петли, product-led growth, экспериментирование",icon:"📈", color:"#8b5cf6", model:"Claude Opus", tasks:678, rating:4.8, speed:"1.3s", online:true  },
  { id:"email",   dept:"Маркетинг",     name:"Email Marketer",    role:"Email",            desc:"Автоматизация рассылок, открываемость, конверсии",        icon:"📧", color:"#3b82f6", model:"Claude Haiku", tasks:763, rating:4.5, speed:"0.7s", online:true  },
  // Продажи
  { id:"sales",   dept:"Продажи",       name:"Sales Manager",     role:"Менеджер",         desc:"Закрытие сделок, переговоры, работа с возражениями",      icon:"🤝", color:"#10b981", model:"Claude Sonnet",tasks:1324,rating:4.7, speed:"1.0s", online:true  },
  { id:"sdr",     dept:"Продажи",       name:"SDR",               role:"Аутрич",           desc:"Поиск и квалификация лидов, холодные письма, LinkedIn",   icon:"📞", color:"#f43f5e", model:"Claude Haiku", tasks:2210,rating:4.4, speed:"0.6s", online:true  },
  { id:"ae",      dept:"Продажи",       name:"Account Executive", role:"Аккаунт",          desc:"Enterprise-продажи, демо, contract management",           icon:"💼", color:"#a78bfa", model:"Claude Sonnet",tasks:876, rating:4.8, speed:"1.2s", online:false },
  { id:"crm",     dept:"Продажи",       name:"CRM Specialist",    role:"CRM",              desc:"Настройка CRM, автоматизация воронки, retention",         icon:"📊", color:"#f59e0b", model:"Claude Haiku", tasks:543, rating:4.5, speed:"0.8s", online:true  },
  // Продукт
  { id:"pm",      dept:"Продукт",       name:"Product Manager",   role:"PM",               desc:"Роадмап, бэклог, приоритизация, пользовательские истории",icon:"💡", color:"#8b5cf6", model:"Claude Opus", tasks:1567,rating:4.9, speed:"1.4s", online:true  },
  { id:"ux",      dept:"Продукт",       name:"UX Designer",       role:"UX",               desc:"Исследования, wireframes, user journey, прототипы",       icon:"🎨", color:"#3b82f6", model:"Claude Sonnet",tasks:987, rating:4.7, speed:"1.1s", online:true  },
  { id:"ui",      dept:"Продукт",       name:"UI Designer",       role:"UI",               desc:"Дизайн-система, визуальные интерфейсы, Figma",            icon:"🖌", color:"#10b981", model:"Claude Sonnet",tasks:845, rating:4.8, speed:"1.0s", online:false },
  { id:"uxr",     dept:"Продукт",       name:"UX Researcher",     role:"Исследователь",    desc:"Пользовательские интервью, usability тесты, инсайты",     icon:"🧪", color:"#f43f5e", model:"Claude Sonnet",tasks:412, rating:4.7, speed:"1.3s", online:true  },
  // Разработка
  { id:"fs",      dept:"Разработка",    name:"Full Stack Dev",    role:"Разработчик",      desc:"React, Node.js, databases, API design, архитектура",      icon:"👨‍💻", color:"#8b5cf6",model:"Claude Opus", tasks:3210,rating:4.9, speed:"1.8s", online:true  },
  { id:"fe",      dept:"Разработка",    name:"Frontend Dev",      role:"Frontend",         desc:"React, TypeScript, CSS, производительность интерфейсов",  icon:"⚛", color:"#3b82f6", model:"Claude Opus", tasks:2876,rating:4.8, speed:"1.5s", online:true  },
  { id:"be",      dept:"Разработка",    name:"Backend Dev",       role:"Backend",          desc:"Node, Python, PostgreSQL, Redis, микросервисы, API",       icon:"🖥", color:"#10b981", model:"Claude Opus", tasks:2640,rating:4.8, speed:"1.6s", online:true  },
  { id:"ai_eng",  dept:"Разработка",    name:"AI Engineer",       role:"AI/ML",            desc:"LLM интеграции, RAG, fine-tuning, AI продукты",           icon:"🤖", color:"#a78bfa", model:"Claude Opus", tasks:1432,rating:4.9, speed:"2.1s", online:true  },
  { id:"devops",  dept:"Разработка",    name:"DevOps Engineer",   role:"DevOps",           desc:"CI/CD, Docker, Kubernetes, мониторинг, инфраструктура",   icon:"☁", color:"#f59e0b", model:"Claude Sonnet",tasks:1123,rating:4.7, speed:"1.3s", online:false },
  { id:"sec",     dept:"Разработка",    name:"Security Engineer", role:"Безопасность",     desc:"Pentest, OWASP, secure architecture, compliance",          icon:"🔒", color:"#f43f5e", model:"Claude Sonnet",tasks:678, rating:4.8, speed:"1.4s", online:true  },
  { id:"ml",      dept:"Разработка",    name:"ML Engineer",       role:"ML",               desc:"Машинное обучение, модели, MLOps, data pipelines",        icon:"🧠", color:"#8b5cf6", model:"Claude Opus", tasks:987, rating:4.9, speed:"2.4s", online:true  },
  // Аналитика
  { id:"da",      dept:"Аналитика",     name:"Data Analyst",      role:"Аналитик данных",  desc:"SQL, Python, дашборды, выявление закономерностей",        icon:"📊", color:"#3b82f6", model:"Claude Sonnet",tasks:1654,rating:4.7, speed:"1.2s", online:true  },
  { id:"bi",      dept:"Аналитика",     name:"BI Analyst",        role:"BI",               desc:"Tableau, Power BI, бизнес-дашборды, KPI-системы",         icon:"📈", color:"#10b981", model:"Claude Sonnet",tasks:923, rating:4.6, speed:"1.1s", online:true  },
  { id:"market_a",dept:"Аналитика",     name:"Market Analyst",    role:"Рынок",            desc:"Анализ рынка, тренды, TAM/SAM/SOM, конкурентная среда",   icon:"📉", color:"#f59e0b", model:"Claude Sonnet",tasks:743, rating:4.7, speed:"1.0s", online:false },
  { id:"comp",    dept:"Аналитика",     name:"Competitor Analyst",role:"Конкуренты",       desc:"Конкурентный анализ, benchmarking, позиционирование",      icon:"🔍", color:"#8b5cf6", model:"Claude Sonnet",tasks:612, rating:4.8, speed:"1.3s", online:true  },
  { id:"research",dept:"Аналитика",     name:"Research Agent",    role:"Исследования",     desc:"Deep research, сбор данных, синтез информации",            icon:"📑", color:"#f43f5e", model:"Claude Opus", tasks:1890,rating:4.9, speed:"2.8s", online:true  },
  // Юридический
  { id:"legal",   dept:"Юридический",   name:"Legal Advisor",     role:"Юрист",            desc:"Корпоративное право, структурирование сделок, риски",      icon:"⚖", color:"#a78bfa", model:"Claude Opus", tasks:432, rating:4.8, speed:"1.7s", online:true  },
  { id:"contract",dept:"Юридический",   name:"Contract Reviewer", role:"Договоры",         desc:"Проверка договоров, NDA, SLA, коммерческие условия",      icon:"📜", color:"#3b82f6", model:"Claude Sonnet",tasks:623, rating:4.7, speed:"1.4s", online:false },
  { id:"comply",  dept:"Юридический",   name:"Compliance Officer",role:"Комплаенс",        desc:"GDPR, регуляторное соответствие, политики и процедуры",   icon:"🛡", color:"#10b981", model:"Claude Sonnet",tasks:341, rating:4.7, speed:"1.5s", online:true  },
  // HR
  { id:"hr",      dept:"HR",            name:"HR Manager",        role:"HR",               desc:"Культура компании, онбординг, HR-процессы, retention",    icon:"👥", color:"#f59e0b", model:"Claude Sonnet",tasks:876, rating:4.6, speed:"1.0s", online:true  },
  { id:"rec",     dept:"HR",            name:"Recruiter",         role:"Рекрутер",         desc:"Поиск талантов, оценка кандидатов, job descriptions",      icon:"🎤", color:"#f43f5e", model:"Claude Sonnet",tasks:1234,rating:4.7, speed:"0.9s", online:true  },
  { id:"coach",   dept:"HR",            name:"Learning Coach",    role:"Коуч",             desc:"Обучение, развитие компетенций, карьерные треки",          icon:"📚", color:"#8b5cf6", model:"Claude Sonnet",tasks:543, rating:4.8, speed:"1.1s", online:false },
  // Универсальные
  { id:"ai",      dept:"Универсальные", name:"AI Assistant",      role:"Помощник",         desc:"Универсальный помощник для любых вопросов и задач",        icon:"🤖", color:"#8b5cf6", model:"Claude Opus", tasks:9812,rating:5.0, speed:"0.8s", online:true  },
  { id:"deep",    dept:"Универсальные", name:"Deep Research",     role:"Исследования",     desc:"Глубокий анализ любой темы с источниками и выводами",     icon:"🧠", color:"#a78bfa", model:"Claude Opus", tasks:4523,rating:4.9, speed:"3.2s", online:true  },
  { id:"quick",   dept:"Универсальные", name:"Quick Expert",      role:"Быстрые ответы",   desc:"Быстрые экспертные ответы на любые вопросы",              icon:"⚡", color:"#10b981", model:"Claude Haiku", tasks:7214,rating:4.7, speed:"0.3s", online:true  },
  { id:"decision",dept:"Универсальные", name:"Decision Maker",    role:"Решения",          desc:"Структурированный анализ и помощь в принятии решений",    icon:"🎯", color:"#f59e0b", model:"Claude Opus", tasks:2341,rating:4.9, speed:"1.9s", online:true  },
  { id:"startup", dept:"Универсальные", name:"Startup Advisor",   role:"Стартап",          desc:"Полный советник для стартапа: продукт, рост, инвестиции", icon:"🚀", color:"#f43f5e", model:"Claude Opus", tasks:1876,rating:5.0, speed:"1.6s", online:true  },
];

const DEPARTMENTS = ["Все","Руководство","Финансы","Маркетинг","Продажи","Продукт","Разработка","Аналитика","Юридический","HR","Универсальные"];

const PINNED_CHATS = [
  { id:"p1", title:"Стратегия выхода на SEA-рынок",  agent:"CEO",     time:"2ч назад",  color:"#8b5cf6" },
  { id:"p2", title:"Финансовая модель Q3 2026",       agent:"CFO",     time:"5ч назад",  color:"#10b981" },
];
const RECENT_CHATS = [
  { id:"r1", title:"Go-to-market план для B2B SaaS", agent:"CMO",     time:"вчера",     color:"#f43f5e" },
  { id:"r2", title:"Анализ конкурентов по рынку AI",  agent:"Research",time:"2д назад",  color:"#a78bfa" },
  { id:"r3", title:"Техдолг и рефакторинг архитектуры",agent:"CTO",   time:"3д назад",  color:"#3b82f6" },
  { id:"r4", title:"Оценка инвестиционного раунда А", agent:"CFO",    time:"4д назад",  color:"#10b981" },
  { id:"r5", title:"Структура команды на рост x3",    agent:"COO",    time:"5д назад",  color:"#f59e0b" },
];

const QUICK_PROMPTS = [
  "Проведи SWOT-анализ моего бизнеса",
  "Создай финансовую модель на 12 месяцев",
  "Напиши pitch deck для инвесторов",
  "Разработай go-to-market стратегию",
  "Оцени риски масштабирования",
  "Предложи структуру команды",
];

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function AgentCard({ agent, onStart, compact }: { agent: typeof AGENTS[0]; onStart: (a: typeof AGENTS[0]) => void; compact?: boolean }) {
  const [hov, setHov] = useState(false);

  if (compact) {
    return (
      <motion.div onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
        onClick={() => onStart(agent)}
        style={{ borderRadius: 12, padding: "10px 12px", background: hov ? `rgba(${agent.color === "#8b5cf6" ? "139,92,246" : agent.color === "#3b82f6" ? "59,130,246" : agent.color === "#10b981" ? "16,185,129" : agent.color === "#f43f5e" ? "244,63,94" : agent.color === "#f59e0b" ? "245,158,11" : "167,139,250"},0.08)` : "rgba(255,255,255,0.025)", border: `1px solid ${hov ? agent.color + "30" : "rgba(255,255,255,0.06)"}`, cursor: "pointer", transition: "all 0.18s", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 20, flexShrink: 0 }}>{agent.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.name}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.role}</div>
        </div>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: agent.online ? "#10b981" : "rgba(255,255,255,0.2)", flexShrink: 0 }} />
      </motion.div>
    );
  }

  return (
    <motion.div onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)} whileHover={{ y: -2 }}
      style={{ borderRadius: 16, padding: "16px", background: hov ? "rgba(255,255,255,0.045)" : "rgba(255,255,255,0.025)", border: `1px solid ${hov ? agent.color + "35" : "rgba(255,255,255,0.06)"}`, cursor: "default", transition: "all 0.18s", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${agent.color}50, transparent)`, opacity: hov ? 1 : 0, transition: "opacity 0.2s" }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: `${agent.color}18`, border: `1px solid ${agent.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{agent.icon}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{agent.name}</div>
            <div style={{ fontSize: 10, color: agent.color, fontWeight: 600 }}>{agent.role}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 7px", borderRadius: 20, background: agent.online ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${agent.online ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.08)"}` }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: agent.online ? "#10b981" : "rgba(255,255,255,0.25)" }} />
          <span style={{ fontSize: 9, color: agent.online ? "#10b981" : "rgba(255,255,255,0.3)", fontWeight: 600 }}>{agent.online ? "Online" : "Away"}</span>
        </div>
      </div>

      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.55, marginBottom: 12, minHeight: 34 }}>{agent.desc}</div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <span style={{ fontSize: 9, padding: "3px 7px", borderRadius: 6, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{agent.model}</span>
        <span style={{ fontSize: 9, padding: "3px 7px", borderRadius: 6, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>⚡ {agent.speed}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>{(agent.tasks / 1000).toFixed(1)}k</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>задач</div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#f59e0b" }}>★ {agent.rating}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>рейтинг</div>
          </div>
        </div>
      </div>

      <button onClick={() => onStart(agent)}
        style={{ width: "100%", padding: "8px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: "none", background: hov ? `linear-gradient(135deg, ${agent.color}, ${agent.color}bb)` : "rgba(255,255,255,0.07)", color: hov ? "#fff" : "rgba(255,255,255,0.55)", cursor: "pointer", transition: "all 0.2s", boxShadow: hov ? `0 4px 16px ${agent.color}40` : "none" }}>
        Начать чат →
      </button>
    </motion.div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

function buildPersona(agent: typeof AGENTS[0]): string {
  return `Ты — ${agent.name} (${agent.role}) в элитной AI-команде руководителей Apex AI. Твоя специализация: ${agent.desc}.

ПРАВИЛА:
- Отвечай СТРОГО в рамках своей роли и экспертизы (${agent.role}).
- Пиши по-русски, профессионально, по делу, без воды и лести.
- Используй markdown: заголовки, списки, выделения где уместно.
- Давай конкретику: цифры, метрики, фреймворки, чёткие шаги.
- Никогда не выдумывай факты о бизнесе пользователя — если данных нет, задай уточняющий вопрос.
- Заканчивай ответ конкретным действием или рекомендацией.`;
}

export default function ChatPage() {
  const [dept, setDept] = useState("Все");
  const [search, setSearch] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid"|"list">("grid");
  const [activeAgent, setActiveAgent] = useState<typeof AGENTS[0] | null>(null);
  const [messages, setMessages] = useState<{role:"user"|"ai";text:string;agent?:string}[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [deepResearch, setDeepResearch] = useState(false);
  const [recording, setRecording] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(["ceo","cfo","ai","startup","pm","fs"]));
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [attachments, setAttachments] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<unknown>(null);

  const filtered = AGENTS.filter(a =>
    (dept === "Все" || a.dept === dept) &&
    (!search || a.name.toLowerCase().includes(search.toLowerCase()) || a.role.toLowerCase().includes(search.toLowerCase()) || a.desc.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const startChat = async (agent: typeof AGENTS[0]) => {
    setActiveAgent(agent);
    setAttachments([]);
    setMessages([{ role: "ai", text: `Привет! Я ${agent.name} — ${agent.role}. ${agent.desc}. Чем могу помочь?`, agent: agent.name }]);
  };

  // Open a specific agent when arriving from Executives / Dashboard via ?agent=<id>
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("agent");
    if (!param) return;
    const found = AGENTS.find(a => a.id === param)
      ?? AGENTS.find(a => a.name.toLowerCase().includes(param.toLowerCase()));
    if (found) {
      setActiveAgent(found);
      setAttachments([]);
      setMessages([{ role: "ai", text: `Привет! Я ${found.name} — ${found.role}. ${found.desc}. Чем могу помочь?`, agent: found.name }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openChatByAgentName = (agentName: string) => {
    const found = AGENTS.find(a => a.name === agentName)
      ?? AGENTS.find(a => agentName.toLowerCase().includes(a.name.toLowerCase()))
      ?? AGENTS[0];
    startChat(found);
  };

  // open a specific agent handed off from the Agents Studio ("Чат" button)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("apex-chat-agent");
      if (!raw) return;
      localStorage.removeItem("apex-chat-agent");
      const a = JSON.parse(raw) as { id: string; name: string; role: string; prompt?: string };
      const synth = {
        id: a.id, dept: "Универсальные", name: a.name, role: a.role,
        desc: a.prompt ? a.prompt.slice(0, 120) : a.role,
        icon: "🤖", color: "#8b5cf6", model: "Claude Opus",
        tasks: 0, rating: 5, speed: "1.2s", online: true,
      } as typeof AGENTS[0];
      startChat(synth);
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); showToast("Удалено из избранного"); }
      else { next.add(id); showToast("Добавлено в избранное ⭐"); }
      return next;
    });
  };

  const togglePin = (id: string) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); showToast("Чат откреплён"); }
      else { next.add(id); showToast("Чат закреплён 📌"); }
      return next;
    });
  };

  const archiveChat = (id: string) => {
    setArchivedIds(prev => new Set(prev).add(id));
    showToast("Чат архивирован");
    setActiveAgent(null);
    setMessages([]);
  };

  const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) {
      setAttachments(prev => [...prev, ...files.map(f => f.name)]);
      showToast(`Прикреплено: ${files.map(f => f.name).join(", ")}`);
    }
    e.target.value = "";
  };

  const toggleMic = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) as any;
    if (!SR) { showToast("Голосовой ввод не поддерживается браузером"); return; }
    if (recording) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (recognitionRef.current as any)?.stop?.();
      setRecording(false);
      return;
    }
    const rec = new SR();
    rec.lang = "ru-RU";
    rec.interimResults = true;
    rec.continuous = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (ev: any) => {
      const text = Array.from(ev.results).map((r: any) => r[0].transcript).join("");
      setInput(text);
    };
    rec.onend = () => setRecording(false);
    rec.onerror = () => { setRecording(false); showToast("Ошибка распознавания речи"); };
    recognitionRef.current = rec;
    rec.start();
    setRecording(true);
    showToast("🎤 Говорите...");
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeAgent || sending) return;
    const userMsg = input;
    const attachNote = attachments.length ? `\n\n[Прикреплённые файлы: ${attachments.join(", ")}]` : "";
    const modeNote = [webSearch ? "Используй актуальные данные из интернета." : "", deepResearch ? "Проведи глубокий структурированный анализ с источниками." : ""].filter(Boolean).join(" ");
    setInput("");
    setAttachments([]);
    setMessages(m => [...m, { role: "user", text: userMsg }, { role: "ai", text: "", agent: activeAgent.name }]);
    setSending(true);

    // history mapping: ai -> assistant, keep last 6 exchanges
    const history = messages
      .filter(m => m.text.trim().length > 0)
      .slice(-8)
      .map(m => ({ role: m.role === "user" ? ("user" as const) : ("assistant" as const), content: m.text }));

    try {
      const res = await fetch("/api/chat/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: (modeNote ? modeNote + "\n\n" : "") + userMsg + attachNote,
          agentId: activeAgent.id,
          persona: buildPersona(activeAgent),
          history,
        }),
      });

      if (!res.ok || !res.body) {
        let errMsg = "Сервис временно недоступен";
        try { const j = await res.json(); errMsg = j.error ?? errMsg; } catch {}
        setMessages(m => { const c = [...m]; c[c.length - 1] = { role: "ai", text: `⚠️ ${errMsg}`, agent: activeAgent.name }; return c; });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          try {
            const ev = JSON.parse(payload);
            if (ev.type === "token") {
              acc += ev.token;
              setMessages(m => { const c = [...m]; c[c.length - 1] = { role: "ai", text: acc, agent: activeAgent.name }; return c; });
            } else if (ev.type === "error") {
              acc = `⚠️ ${ev.message ?? "Ошибка генерации"}`;
              setMessages(m => { const c = [...m]; c[c.length - 1] = { role: "ai", text: acc, agent: activeAgent.name }; return c; });
            }
          } catch { /* ignore malformed chunk */ }
        }
      }

      if (!acc.trim()) {
        setMessages(m => { const c = [...m]; c[c.length - 1] = { role: "ai", text: "Не удалось получить ответ. Попробуйте ещё раз.", agent: activeAgent.name }; return c; });
      }
    } catch {
      setMessages(m => { const c = [...m]; c[c.length - 1] = { role: "ai", text: "⚠️ Ошибка соединения с AI-сервисом.", agent: activeAgent!.name }; return c; });
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", background: "#07090F", overflow: "hidden" }}>

      {/* Toast */}
      {toast && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 9999, padding: "9px 18px", borderRadius: 12, background: "rgba(20,18,32,0.95)", border: "1px solid rgba(139,92,246,0.3)", color: "#fff", fontSize: 12, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }}>
          {toast}
        </motion.div>
      )}

      {/* ── LEFT SIDEBAR ── */}
      <div style={{ width: 240, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Top */}
        <div style={{ padding: "16px 14px 12px" }}>
          <button onClick={() => { setActiveAgent(null); setMessages([]); }}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 11, fontSize: 12, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", color: "#fff", cursor: "pointer", marginBottom: 12, boxShadow: "0 4px 16px rgba(139,92,246,0.3)" }}>
            <Plus size={13} />Новый чат
          </button>
          <div style={{ position: "relative" }}>
            <Search size={11} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", pointerEvents: "none" }} />
            <input value={chatSearch} onChange={e => setChatSearch(e.target.value)} placeholder="Поиск чатов..."
              style={{ width: "100%", padding: "7px 10px 7px 28px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 11, outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 16px" }}>
          {/* Pinned */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", padding: "0 6px", marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}>
              <Pin size={9} />Закреплённые
            </div>
            {PINNED_CHATS.map(c => (
              <button key={c.id} onClick={() => openChatByAgentName(c.agent)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 9, border: "1px solid transparent", background: "transparent", cursor: "pointer", textAlign: "left", marginBottom: 2 }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{c.agent} · {c.time}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Recent */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", padding: "0 6px", marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}>
              <Clock size={9} />Недавние
            </div>
            {RECENT_CHATS.map(c => (
              <button key={c.id} onClick={() => openChatByAgentName(c.agent)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 9, border: "1px solid transparent", background: "transparent", cursor: "pointer", textAlign: "left", marginBottom: 2 }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: c.color, flexShrink: 0, opacity: 0.7 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.22)" }}>{c.agent} · {c.time}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Top Agents compact */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", padding: "0 6px", marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}>
              <Star size={9} />Избранные агенты
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {AGENTS.filter(a => favorites.has(a.id)).map(a => (
                <AgentCard key={a.id} agent={a} onStart={startChat} compact />
              ))}
              {AGENTS.filter(a => favorites.has(a.id)).length === 0 && (
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", padding: "6px 8px" }}>Нет избранных агентов</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── CENTER ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {activeAgent ? (
          // ── ACTIVE CHAT ──
          <>
            {/* Chat Header */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
              <button onClick={() => { setActiveAgent(null); setMessages([]); }} style={{ padding: "6px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>← Назад</button>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${activeAgent.color}18`, border: `1px solid ${activeAgent.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{activeAgent.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{activeAgent.name} · {activeAgent.role}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{activeAgent.model} · ⚡ {activeAgent.speed}</div>
                </div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <button onClick={() => { setWebSearch(v => !v); showToast(webSearch ? "Поиск в интернете выключен" : "Поиск в интернете включён"); }}
                  style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: `1px solid ${webSearch ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.08)"}`, background: webSearch ? "rgba(59,130,246,0.15)" : "transparent", color: webSearch ? "#3b82f6" : "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s" }}>
                  <Globe size={11} />Интернет
                </button>
                <button onClick={() => { setDeepResearch(v => !v); showToast(deepResearch ? "Deep Research выключен" : "Deep Research включён"); }}
                  style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: `1px solid ${deepResearch ? "rgba(167,139,250,0.5)" : "rgba(255,255,255,0.08)"}`, background: deepResearch ? "rgba(167,139,250,0.15)" : "transparent", color: deepResearch ? "#a78bfa" : "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s" }}>
                  <Brain size={11} />Deep Research
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
              <div style={{ maxWidth: 760, margin: "0 auto" }}>
                {messages.map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: 20, display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                    {m.role === "ai" && (
                      <div style={{ width: 30, height: 30, borderRadius: 9, background: `${activeAgent.color}18`, border: `1px solid ${activeAgent.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0, marginRight: 10, marginTop: 2 }}>{activeAgent.icon}</div>
                    )}
                    <div style={{ maxWidth: "72%", padding: "12px 16px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: m.role === "user" ? "rgba(139,92,246,0.18)" : "rgba(255,255,255,0.04)", border: m.role === "user" ? "1px solid rgba(139,92,246,0.3)" : "1px solid rgba(255,255,255,0.07)", fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                      {m.role === "ai" && m.text === "" ? (
                        <span style={{ display: "flex", gap: 5, padding: "2px 0" }}>
                          {[0,1,2].map(j => (
                            <motion.span key={j} animate={{ opacity: [0.3,1,0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: j*0.3 }}
                              style={{ width: 6, height: 6, borderRadius: "50%", background: activeAgent.color, display: "inline-block" }} />
                          ))}
                        </span>
                      ) : m.text}
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEnd} />
              </div>
            </div>

            {/* Input */}
            <div style={{ padding: "14px 28px 20px", flexShrink: 0 }}>
              <div style={{ maxWidth: 760, margin: "0 auto" }}>
                {/* Quick prompts */}
                <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                  {QUICK_PROMPTS.slice(0, 3).map(p => (
                    <button key={p} onClick={() => setInput(p)}
                      style={{ padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 500, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>{p}</button>
                  ))}
                </div>
                {/* Attachment chips */}
                {attachments.length > 0 && (
                  <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                    {attachments.map((name, i) => (
                      <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 8, fontSize: 10, fontWeight: 500, background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", color: "#a78bfa" }}>
                        <Paperclip size={10} />{name.length > 22 ? name.slice(0, 20) + "…" : name}
                        <button onClick={() => setAttachments(a => a.filter((_, j) => j !== i))} style={{ background: "transparent", border: "none", color: "#a78bfa", cursor: "pointer", padding: 0, display: "flex" }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
                {/* Hidden file inputs */}
                <input ref={fileInputRef} type="file" multiple onChange={onFilePicked} style={{ display: "none" }} />
                <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={onFilePicked} style={{ display: "none" }} />
                <input ref={pdfInputRef} type="file" accept=".pdf,application/pdf" multiple onChange={onFilePicked} style={{ display: "none" }} />
                <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                  <textarea value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder={`Сообщение для ${activeAgent.name}...`}
                    style={{ width: "100%", padding: "14px 16px 10px", background: "transparent", border: "none", color: "#fff", fontSize: 13, outline: "none", resize: "none", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box", minHeight: 52 }}
                    rows={2}
                  />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[
                        { icon: Paperclip, tip: "Файл",        onClick: () => fileInputRef.current?.click(),  active: false },
                        { icon: Image,     tip: "Изображение", onClick: () => imageInputRef.current?.click(), active: false },
                        { icon: FileText,  tip: "PDF",         onClick: () => pdfInputRef.current?.click(),   active: false },
                        { icon: Globe,     tip: "Поиск в сети", onClick: () => { setWebSearch(v => !v); showToast(webSearch ? "Поиск в интернете выключен" : "Поиск в интернете включён"); }, active: webSearch },
                        { icon: Mic,       tip: "Голос",       onClick: toggleMic, active: recording },
                      ].map(b => (
                        <button key={b.tip} title={b.tip} onClick={b.onClick} style={{ width: 30, height: 30, borderRadius: 8, background: b.active ? "rgba(139,92,246,0.16)" : "transparent", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: b.active ? "#a78bfa" : "rgba(255,255,255,0.25)", transition: "all 0.15s" }}
                          onMouseEnter={e => { if (!b.active) e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
                          onMouseLeave={e => { if (!b.active) e.currentTarget.style.color = "rgba(255,255,255,0.25)"; }}>
                          <b.icon size={14} style={b.tip === "Голос" && recording ? { animation: "sb-pulse 1s ease-in-out infinite" } : undefined} />
                        </button>
                      ))}
                    </div>
                    <button onClick={sendMessage} disabled={!input.trim() || sending}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: "none", background: input.trim() ? "linear-gradient(135deg, #8b5cf6, #3b82f6)" : "rgba(255,255,255,0.08)", color: input.trim() ? "#fff" : "rgba(255,255,255,0.25)", cursor: input.trim() ? "pointer" : "default", transition: "all 0.2s" }}>
                      <Send size={13} />Отправить
                    </button>
                  </div>
                </div>
                <div style={{ textAlign: "center", marginTop: 6, fontSize: 10, color: "rgba(255,255,255,0.18)" }}>Enter — отправить · Shift+Enter — новая строка</div>
              </div>
            </div>
          </>
        ) : (
          // ── AGENT CATALOG ──
          <>
            <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>AI Command Center</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{AGENTS.length} специализированных агентов · {AGENTS.filter(a=>a.online).length} онлайн</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ position: "relative" }}>
                    <Search size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", pointerEvents: "none" }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск агентов..."
                      style={{ padding: "8px 12px 8px 30px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 12, outline: "none", width: 200 }}
                      onFocus={e => (e.target.style.borderColor = "rgba(139,92,246,0.4)")}
                      onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
                  </div>
                  <button onClick={() => setViewMode(v => v === "grid" ? "list" : "grid")}
                    style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.5)" }}>
                    {viewMode === "grid" ? <List size={14} /> : <Grid size={14} />}
                  </button>
                </div>
              </div>

              {/* Dept Filters */}
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
                {DEPARTMENTS.map(d => (
                  <button key={d} onClick={() => setDept(d)}
                    style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, border: `1px solid ${dept === d ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.07)"}`, background: dept === d ? "rgba(139,92,246,0.14)" : "transparent", color: dept === d ? "#a78bfa" : "rgba(255,255,255,0.35)", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.15s" }}>{d}</button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
              {/* Quick Prompts */}
              {dept === "Все" && !search && (
                <div style={{ marginBottom: 20, borderRadius: 16, padding: "16px 20px", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #8b5cf660, transparent)" }} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <Sparkles size={13} style={{ color: "#8b5cf6" }} />Быстрые задачи
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {QUICK_PROMPTS.map(p => (
                      <button key={p} onClick={() => { startChat(AGENTS[0]); setInput(p); }}
                        style={{ padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 500, border: "1px solid rgba(139,92,246,0.25)", background: "rgba(139,92,246,0.08)", color: "#a78bfa", cursor: "pointer" }}>{p}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Group by dept or flat */}
              {dept === "Все" && !search ? (
                DEPARTMENTS.filter(d => d !== "Все").map(d => {
                  const ag = AGENTS.filter(a => a.dept === d);
                  return (
                    <div key={d} style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                        {d} <span style={{ fontWeight: 500, opacity: 0.6 }}>({ag.length})</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                        {ag.map(a => <AgentCard key={a.id} agent={a} onStart={startChat} />)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 12 }}>
                    {filtered.length} агентов {search && `по запросу «${search}»`} {dept !== "Все" && `· ${dept}`}
                  </div>
                  <div style={viewMode === "grid" ? { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 } : { display: "flex", flexDirection: "column", gap: 8 }}>
                    {filtered.map(a => viewMode === "grid"
                      ? <AgentCard key={a.id} agent={a} onStart={startChat} />
                      : <AgentCard key={a.id} agent={a} onStart={startChat} compact />
                    )}
                  </div>
                  {filtered.length === 0 && (
                    <div style={{ textAlign: "center", padding: "48px", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>Агенты не найдены</div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── RIGHT PANEL (agent info) ── */}
      {activeAgent && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          style={{ width: 260, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.05)", padding: "20px 16px", overflowY: "auto" }}>
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: `${activeAgent.color}18`, border: `1px solid ${activeAgent.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 10px" }}>{activeAgent.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{activeAgent.name}</div>
            <div style={{ fontSize: 11, color: activeAgent.color, fontWeight: 600, marginBottom: 6 }}>{activeAgent.role}</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: activeAgent.online ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.05)", border: `1px solid ${activeAgent.online ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.08)"}` }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: activeAgent.online ? "#10b981" : "rgba(255,255,255,0.25)" }} />
              <span style={{ fontSize: 10, color: activeAgent.online ? "#10b981" : "rgba(255,255,255,0.3)", fontWeight: 600 }}>{activeAgent.online ? "Online" : "Away"}</span>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {[
              { label: "Задач",   val: `${(activeAgent.tasks/1000).toFixed(1)}k` },
              { label: "Рейтинг",val: `★ ${activeAgent.rating}` },
              { label: "Скорость",val: activeAgent.speed },
              { label: "Модель",  val: activeAgent.model.split(" ")[1] },
            ].map(s => (
              <div key={s.label} style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{s.val}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* About */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Специализация</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{activeAgent.desc}</div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Инструменты</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {["Интернет","Файлы","Код","Таблицы","PDF"].map(t => (
                <span key={t} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>{t}</span>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Модель</div>
            <div style={{ padding: "10px 12px", borderRadius: 10, background: `${activeAgent.color}0d`, border: `1px solid ${activeAgent.color}20`, display: "flex", alignItems: "center", gap: 8 }}>
              <Brain size={13} style={{ color: activeAgent.color }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{activeAgent.model}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Anthropic · 2026</div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Быстрые действия</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { icon: Star,    label: favorites.has(activeAgent.id) ? "В избранном ✓" : "Добавить в избранное", active: favorites.has(activeAgent.id), onClick: () => toggleFavorite(activeAgent.id) },
                { icon: Pin,     label: pinnedIds.has(activeAgent.id) ? "Закреплён ✓" : "Закрепить чат",          active: pinnedIds.has(activeAgent.id), onClick: () => togglePin(activeAgent.id) },
                { icon: Archive, label: "Архивировать", active: false, onClick: () => archiveChat(activeAgent.id) },
              ].map(a => (
                <button key={a.label} onClick={a.onClick} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 9, fontSize: 11, fontWeight: 500, border: `1px solid ${a.active ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.06)"}`, background: a.active ? "rgba(139,92,246,0.1)" : "transparent", color: a.active ? "#a78bfa" : "rgba(255,255,255,0.45)", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                  onMouseEnter={e => { if (!a.active) { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)"; } }}
                  onMouseLeave={e => { if (!a.active) { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)"; } }}>
                  <a.icon size={12} />{a.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
