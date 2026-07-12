"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Star, Play, MessageSquare, Settings, Filter, X } from "lucide-react";
import Link from "next/link";

const EASE = [0.22, 1, 0.36, 1] as const;

// ─── ALL AGENTS FROM ALL DEPARTMENTS ──────────────────────────────────────
const AGENTS_ALL = [
  // Руководство
  { id: "ceo", dept: "Руководство", name: "Victoria Sterling", role: "Chief Executive Officer", icon: "👑", color: "#8b5cf6", deptColor: "#8b5cf6", desc: "Стратегическое видение, ключевые решения и управление компанией", model: "Claude Opus", tasks: 2847, rating: 4.9, speed: "1.2s", online: true },
  { id: "coo", dept: "Руководство", name: "Elena Vasquez", role: "Chief Operating Officer", icon: "⚙️", color: "#3b82f6", deptColor: "#8b5cf6", desc: "Операционная эффективность, процессы, масштабирование", model: "Claude Opus", tasks: 2103, rating: 4.8, speed: "1.4s", online: true },
  { id: "cfo", dept: "Руководство", name: "James Hartley", role: "Chief Financial Officer", icon: "💰", color: "#10b981", deptColor: "#8b5cf6", desc: "Финансовые модели, бюджетирование, инвестиции, ROI", model: "Claude Opus", tasks: 1984, rating: 4.9, speed: "1.1s", online: true },
  { id: "cmo", dept: "Руководство", name: "Sarah Chen", role: "Chief Marketing Officer", icon: "📢", color: "#f43f5e", deptColor: "#8b5cf6", desc: "Go-to-market, бренд-стратегия, рост аудитории", model: "Claude Sonnet", tasks: 1756, rating: 4.7, speed: "0.9s", online: true },
  { id: "cso", dept: "Руководство", name: "Marcus Webb", role: "Chief Strategy Officer", icon: "📊", color: "#f59e0b", deptColor: "#8b5cf6", desc: "Стратегия, партнёрства, корпоративные сделки", model: "Claude Sonnet", tasks: 1423, rating: 4.8, speed: "1.0s", online: false },
  { id: "cto", dept: "Руководство", name: "David Park", role: "Chief Technology Officer", icon: "⚡", color: "#a78bfa", deptColor: "#8b5cf6", desc: "Технический стек, архитектура, R&D стратегия", model: "Claude Opus", tasks: 1612, rating: 4.8, speed: "1.3s", online: true },

  // Финансы
  { id: "inv", dept: "Финансы", name: "Robert Kim", role: "Investment Analyst", icon: "📈", color: "#10b981", deptColor: "#3b82f6", desc: "Оценка инвестиций, DCF анализ, венчурный анализ", model: "Claude Sonnet", tasks: 890, rating: 4.7, speed: "1.5s", online: true },
  { id: "fp", dept: "Финансы", name: "Natasha Orlov", role: "Financial Planner", icon: "📊", color: "#3b82f6", deptColor: "#3b82f6", desc: "Бюджетирование, прогнозирование, P&L анализ", model: "Claude Sonnet", tasks: 743, rating: 4.6, speed: "1.2s", online: false },
  { id: "budget", dept: "Финансы", name: "Alicia Monroe", role: "Budget Manager", icon: "💳", color: "#8b5cf6", deptColor: "#3b82f6", desc: "Контроль расходов, оптимизация бюджета", model: "Claude Haiku", tasks: 612, rating: 4.5, speed: "0.7s", online: true },
  { id: "rev", dept: "Финансы", name: "Lucas Sterling", role: "Revenue Analyst", icon: "📈", color: "#f59e0b", deptColor: "#3b82f6", desc: "Анализ выручки, MRR/ARR, когортный анализ", model: "Claude Sonnet", tasks: 528, rating: 4.7, speed: "1.1s", online: true },
  { id: "fund", dept: "Финансы", name: "Isabella Monroe", role: "Fundraising Advisor", icon: "🏦", color: "#f43f5e", deptColor: "#3b82f6", desc: "Питч-деки, term sheet, переговоры с инвесторами", model: "Claude Opus", tasks: 421, rating: 4.9, speed: "1.6s", online: false },

  // Маркетинг
  { id: "perf", dept: "Маркетинг", name: "Jessica Wong", role: "Performance Marketer", icon: "🎯", color: "#f43f5e", deptColor: "#10b981", desc: "Платная реклама, ROAS, A/B тестирование", model: "Claude Sonnet", tasks: 1102, rating: 4.7, speed: "0.9s", online: true },
  { id: "brand", dept: "Маркетинг", name: "Oliver Chen", role: "Brand Strategist", icon: "🎨", color: "#a78bfa", deptColor: "#10b981", desc: "Идентичность бренда, позиционирование", model: "Claude Sonnet", tasks: 876, rating: 4.8, speed: "1.0s", online: true },
  { id: "smm", dept: "Маркетинг", name: "Sophie Laurent", role: "Social Media Manager", icon: "📱", color: "#3b82f6", deptColor: "#10b981", desc: "Контент для соцсетей, виральность, сообщества", model: "Claude Haiku", tasks: 1430, rating: 4.5, speed: "0.6s", online: true },
  { id: "copy", dept: "Маркетинг", name: "Nathan Brooks", role: "Copywriter", icon: "✍️", color: "#10b981", deptColor: "#10b981", desc: "Продающие тексты, UX-копи, storytelling", model: "Claude Sonnet", tasks: 2100, rating: 4.8, speed: "0.8s", online: true },
  { id: "seo", dept: "Маркетинг", name: "Priya Patel", role: "SEO Expert", icon: "🔍", color: "#f59e0b", deptColor: "#10b981", desc: "Семантика, техническое SEO, контент-стратегия", model: "Claude Sonnet", tasks: 914, rating: 4.6, speed: "1.1s", online: false },
  { id: "growth", dept: "Маркетинг", name: "Maya Scott", role: "Growth Hacker", icon: "📈", color: "#8b5cf6", deptColor: "#10b981", desc: "Виральные петли, product-led growth", model: "Claude Opus", tasks: 678, rating: 4.8, speed: "1.3s", online: true },
  { id: "email", dept: "Маркетинг", name: "Alex Rivera", role: "Email Marketer", icon: "📧", color: "#3b82f6", deptColor: "#10b981", desc: "Автоматизация рассылок, открываемость", model: "Claude Haiku", tasks: 763, rating: 4.5, speed: "0.7s", online: true },

  // Продажи
  { id: "sales", dept: "Продажи", name: "Jason Turner", role: "Sales Manager", icon: "🤝", color: "#10b981", deptColor: "#22c55e", desc: "Закрытие сделок, переговоры, работа с возражениями", model: "Claude Sonnet", tasks: 1324, rating: 4.7, speed: "1.0s", online: true },
  { id: "sdr", dept: "Продажи", name: "Emma Thompson", role: "Sales Development Rep", icon: "📞", color: "#f43f5e", deptColor: "#22c55e", desc: "Поиск и квалификация лидов, холодные письма", model: "Claude Haiku", tasks: 2210, rating: 4.4, speed: "0.6s", online: true },
  { id: "ae", dept: "Продажи", name: "Michael Chen", role: "Account Executive", icon: "💼", color: "#a78bfa", deptColor: "#22c55e", desc: "Enterprise-продажи, демо, contract management", model: "Claude Sonnet", tasks: 876, rating: 4.8, speed: "1.2s", online: false },
  { id: "crm", dept: "Продажи", name: "Lisa Martinez", role: "CRM Specialist", icon: "📊", color: "#f59e0b", deptColor: "#22c55e", desc: "Настройка CRM, автоматизация воронки", model: "Claude Haiku", tasks: 543, rating: 4.5, speed: "0.8s", online: true },

  // Продукт
  { id: "pm", dept: "Продукт", name: "Kevin Yang", role: "Product Manager", icon: "💡", color: "#8b5cf6", deptColor: "#a855f7", desc: "Роадмап, бэклог, приоритизация", model: "Claude Opus", tasks: 1567, rating: 4.9, speed: "1.4s", online: true },
  { id: "ux", dept: "Продукт", name: "Rachel Green", role: "UX Designer", icon: "🎨", color: "#3b82f6", deptColor: "#a855f7", desc: "Исследования, wireframes, user journey", model: "Claude Sonnet", tasks: 987, rating: 4.7, speed: "1.1s", online: true },
  { id: "ui", dept: "Продукт", name: "Thomas Wright", role: "UI Designer", icon: "🖌", color: "#10b981", deptColor: "#a855f7", desc: "Дизайн-система, визуальные интерфейсы", model: "Claude Sonnet", tasks: 845, rating: 4.8, speed: "1.0s", online: false },
  { id: "uxr", dept: "Продукт", name: "Sofia Rodriguez", role: "UX Researcher", icon: "🧪", color: "#f43f5e", deptColor: "#a855f7", desc: "Пользовательские интервью, usability тесты", model: "Claude Sonnet", tasks: 412, rating: 4.7, speed: "1.3s", online: true },

  // Разработка
  { id: "fs", dept: "Разработка", name: "Gabriel Silva", role: "Full Stack Dev", icon: "👨‍💻", color: "#8b5cf6", deptColor: "#a855f7", desc: "React, Node.js, databases, API design", model: "Claude Opus", tasks: 3210, rating: 4.9, speed: "1.8s", online: true },
  { id: "fe", dept: "Разработка", name: "Amara Johnson", role: "Frontend Dev", icon: "⚛", color: "#3b82f6", deptColor: "#a855f7", desc: "React, TypeScript, CSS, performance", model: "Claude Opus", tasks: 2876, rating: 4.8, speed: "1.5s", online: true },
  { id: "be", dept: "Разработка", name: "Dmitri Volkov", role: "Backend Dev", icon: "🖥", color: "#10b981", deptColor: "#a855f7", desc: "Node, Python, PostgreSQL, Redis", model: "Claude Opus", tasks: 2640, rating: 4.8, speed: "1.6s", online: true },
  { id: "ai_eng", dept: "Разработка", name: "Zara Okonkwo", role: "AI Engineer", icon: "🤖", color: "#a78bfa", deptColor: "#a855f7", desc: "LLM интеграции, RAG, fine-tuning", model: "Claude Opus", tasks: 1432, rating: 4.9, speed: "2.1s", online: true },
  { id: "devops", dept: "Разработка", name: "Marcus Klein", role: "DevOps Engineer", icon: "☁", color: "#f59e0b", deptColor: "#a855f7", desc: "CI/CD, Docker, Kubernetes, инфраструктура", model: "Claude Sonnet", tasks: 1123, rating: 4.7, speed: "1.3s", online: false },
  { id: "sec", dept: "Разработка", name: "Ava Thompson", role: "Security Engineer", icon: "🔒", color: "#f43f5e", deptColor: "#a855f7", desc: "Pentest, OWASP, secure architecture", model: "Claude Sonnet", tasks: 678, rating: 4.8, speed: "1.4s", online: true },
  { id: "ml", dept: "Разработка", name: "James Hong", role: "ML Engineer", icon: "🧠", color: "#8b5cf6", deptColor: "#a855f7", desc: "Машинное обучение, модели, MLOps", model: "Claude Opus", tasks: 987, rating: 4.9, speed: "2.4s", online: true },

  // Аналитика
  { id: "da", dept: "Аналитика", name: "Nicole Clark", role: "Data Analyst", icon: "📊", color: "#3b82f6", deptColor: "#0ea5e9", desc: "SQL, Python, дашборды, анализ данных", model: "Claude Sonnet", tasks: 1654, rating: 4.7, speed: "1.2s", online: true },
  { id: "bi", dept: "Аналитика", name: "Carlos Mendez", role: "BI Analyst", icon: "📈", color: "#10b981", deptColor: "#0ea5e9", desc: "Tableau, Power BI, бизнес-дашборды", model: "Claude Sonnet", tasks: 923, rating: 4.6, speed: "1.1s", online: true },
  { id: "market_a", dept: "Аналитика", name: "Elena Rossi", role: "Market Analyst", icon: "📉", color: "#f59e0b", deptColor: "#0ea5e9", desc: "Анализ рынка, тренды, TAM/SAM/SOM", model: "Claude Sonnet", tasks: 743, rating: 4.7, speed: "1.0s", online: false },
  { id: "comp", dept: "Аналитика", name: "Pavel Sokolov", role: "Competitor Analyst", icon: "🔍", color: "#8b5cf6", deptColor: "#0ea5e9", desc: "Конкурентный анализ, benchmarking", model: "Claude Sonnet", tasks: 612, rating: 4.8, speed: "1.3s", online: true },
  { id: "research", dept: "Аналитика", name: "Jessica Lee", role: "Research Agent", icon: "📑", color: "#f43f5e", deptColor: "#0ea5e9", desc: "Deep research, сбор данных, синтез", model: "Claude Opus", tasks: 1890, rating: 4.9, speed: "2.8s", online: true },

  // Юридический
  { id: "legal", dept: "Юридический", name: "Alexander Müller", role: "Legal Advisor", icon: "⚖", color: "#a78bfa", deptColor: "#94a3b8", desc: "Корпоративное право, структурирование сделок", model: "Claude Opus", tasks: 432, rating: 4.8, speed: "1.7s", online: true },
  { id: "contract", dept: "Юридический", name: "Hannah Schmidt", role: "Contract Reviewer", icon: "📜", color: "#3b82f6", deptColor: "#94a3b8", desc: "Проверка договоров, NDA, SLA", model: "Claude Sonnet", tasks: 623, rating: 4.7, speed: "1.4s", online: false },
  { id: "comply", dept: "Юридический", name: "Raj Patel", role: "Compliance Officer", icon: "🛡", color: "#10b981", deptColor: "#94a3b8", desc: "GDPR, регуляторное соответствие", model: "Claude Sonnet", tasks: 341, rating: 4.7, speed: "1.5s", online: true },

  // HR
  { id: "hr", dept: "HR", name: "Victoria Adams", role: "HR Manager", icon: "👥", color: "#f59e0b", deptColor: "#ec4899", desc: "Культура компании, онбординг, retention", model: "Claude Sonnet", tasks: 876, rating: 4.6, speed: "1.0s", online: true },
  { id: "rec", dept: "HR", name: "Michael Foster", role: "Recruiter", icon: "🎤", color: "#f43f5e", deptColor: "#ec4899", desc: "Поиск талантов, оценка кандидатов", model: "Claude Sonnet", tasks: 1234, rating: 4.7, speed: "0.9s", online: true },
  { id: "coach", dept: "HR", name: "Louise Bennet", role: "Learning Coach", icon: "📚", color: "#8b5cf6", deptColor: "#ec4899", desc: "Обучение, развитие компетенций", model: "Claude Sonnet", tasks: 543, rating: 4.8, speed: "1.1s", online: false },

  // Универсальные
  { id: "ai", dept: "Универсальные", name: "Aria AI", role: "AI Assistant", icon: "🤖", color: "#8b5cf6", deptColor: "#6366f1", desc: "Универсальный помощник для любых вопросов", model: "Claude Opus", tasks: 9812, rating: 5.0, speed: "0.8s", online: true },
  { id: "deep", dept: "Универсальные", name: "Sage Research", role: "Deep Research", icon: "🧠", color: "#a78bfa", deptColor: "#6366f1", desc: "Глубокий анализ любой темы", model: "Claude Opus", tasks: 4523, rating: 4.9, speed: "3.2s", online: true },
  { id: "quick", dept: "Универсальные", name: "Swift Expert", role: "Quick Expert", icon: "⚡", color: "#10b981", deptColor: "#6366f1", desc: "Быстрые экспертные ответы", model: "Claude Haiku", tasks: 7214, rating: 4.7, speed: "0.3s", online: true },
  { id: "decision", dept: "Универсальные", name: "Logic Advisor", role: "Decision Maker", icon: "🎯", color: "#f59e0b", deptColor: "#6366f1", desc: "Структурированный анализ решений", model: "Claude Opus", tasks: 2341, rating: 4.9, speed: "1.9s", online: true },
  { id: "startup", dept: "Универсальные", name: "Venture Coach", role: "Startup Advisor", icon: "🚀", color: "#f43f5e", deptColor: "#6366f1", desc: "Полный советник для стартапа", model: "Claude Opus", tasks: 1876, rating: 5.0, speed: "1.6s", online: true },
];

const DEPARTMENTS = ["Все", "Руководство", "Финансы", "Маркетинг", "Продажи", "Продукт", "Разработка", "Аналитика", "Юридический", "HR", "Универсальные"];

// Metrics calculation
const getMetrics = () => {
  const online = AGENTS_ALL.filter(a => a.online).length;
  const totalTasks = AGENTS_ALL.reduce((sum, a) => sum + a.tasks, 0);
  const avgRating = (AGENTS_ALL.reduce((sum, a) => sum + a.rating, 0) / AGENTS_ALL.length).toFixed(1);
  const spent = Math.round((totalTasks / 10) * (Math.random() * 0.5 + 0.8));
  return {
    total: AGENTS_ALL.length,
    online,
    tasks: totalTasks,
    rating: avgRating,
    spent,
  };
};

export default function ChatPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("Все");
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
  const metrics = getMetrics();

  const filteredAgents = AGENTS_ALL.filter(agent => {
    const matchSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = selectedDept === "Все" || agent.dept === selectedDept;
    return matchSearch && matchDept;
  });

  return (
    <div className="chat-studio-root">
      {/* Header */}
      <div className="chat-studio-header">
        <div className="chat-studio-title">
          <div className="chat-studio-badge">
            <span className="chat-studio-badge-icon">🤖</span>
            <span>AGENT STUDIO</span>
            <span className="chat-studio-badge-count">{filteredAgents.length} ACTIVE</span>
          </div>
          <h1>Выберите агента для чата</h1>
          <p>// управление, настройка и запуск AI-агентов</p>
        </div>

        {/* Metrics */}
        <div className="chat-studio-metrics">
          <motion.div className="chat-metric" whileHover={{ y: -2 }}>
            <div className="chat-metric-value">{metrics.total}</div>
            <div className="chat-metric-label">Всего агентов</div>
          </motion.div>
          <motion.div className="chat-metric" whileHover={{ y: -2 }}>
            <div className="chat-metric-value">{metrics.online}</div>
            <div className="chat-metric-label">Онлайн сейчас</div>
          </motion.div>
          <motion.div className="chat-metric" whileHover={{ y: -2 }}>
            <div className="chat-metric-value">{(metrics.tasks / 1000).toFixed(1)}K</div>
            <div className="chat-metric-label">Запусков/день</div>
          </motion.div>
          <motion.div className="chat-metric" whileHover={{ y: -2 }}>
            <div className="chat-metric-value">{metrics.rating}</div>
            <div className="chat-metric-label">Среднее качество</div>
          </motion.div>
          <motion.div className="chat-metric" whileHover={{ y: -2 }}>
            <div className="chat-metric-value">${metrics.spent}K</div>
            <div className="chat-metric-label">Расходы/месяц</div>
          </motion.div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="chat-studio-controls">
        <div className="chat-studio-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Поиск агентов…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="chat-search-clear">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="chat-studio-filter">
          {DEPARTMENTS.map(dept => (
            <button
              key={dept}
              className={`chat-filter-btn${selectedDept === dept ? " active" : ""}`}
              onClick={() => setSelectedDept(dept)}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Agents Grid */}
      <div className="chat-studio-grid">
        <AnimatePresence>
          {filteredAgents.length > 0 ? (
            filteredAgents.map((agent, i) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                index={i}
                isHovered={hoveredAgent === agent.id}
                onHover={setHoveredAgent}
              />
            ))
          ) : (
            <motion.div className="chat-studio-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="chat-empty-icon">🔍</div>
              <div className="chat-empty-text">Агентов не найдено</div>
              <div className="chat-empty-hint">Попробуйте другой поиск или фильтр</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ChatStyles />
    </div>
  );
}

// ─── Agent Card ──────────────────────────────────────────────────────────────
function AgentCard({ agent, index, isHovered, onHover }: { agent: any; index: number; isHovered: boolean; onHover: (id: string | null) => void }) {
  return (
    <motion.div
      className="chat-agent-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.3 }}
      onMouseEnter={() => onHover(agent.id)}
      onMouseLeave={() => onHover(null)}
      whileHover={{ y: -4 }}
    >
      <div className="chat-card-inner">
        {/* Header */}
        <div className="chat-card-header">
          <div className="chat-card-avatar" style={{ background: `linear-gradient(135deg, ${agent.color}, ${agent.color}cc)` }}>
            {agent.icon}
          </div>
          <div className="chat-card-info">
            <h3 className="chat-card-name">{agent.name}</h3>
            <p className="chat-card-role">{agent.role}</p>
          </div>
          {agent.online && <div className="chat-card-online" />}
        </div>

        {/* Description */}
        <p className="chat-card-desc">{agent.desc}</p>

        {/* Model & Stats */}
        <div className="chat-card-meta">
          <div className="chat-meta-item">
            <span className="chat-meta-label">Модель</span>
            <span className="chat-meta-value" style={{ color: agent.color }}>{agent.model}</span>
          </div>
          <div className="chat-meta-item">
            <span className="chat-meta-label">Скорость</span>
            <span className="chat-meta-value">Быстрый</span>
          </div>
          <div className="chat-meta-item">
            <span className="chat-meta-label">{agent.tasks.toLocaleString()}</span>
            <span className="chat-meta-value">запусков</span>
          </div>
          <div className="chat-meta-item">
            <span className="chat-meta-label">
              <Star size={12} fill={agent.color} color={agent.color} style={{ display: "inline", marginRight: "4px" }} />
              {agent.rating}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="chat-card-actions">
          <button className="chat-action-btn chat-btn-launch" style={{ background: `linear-gradient(135deg, ${agent.deptColor}, ${agent.deptColor}dd)`, color: "#fff" }}>
            Запуск
          </button>
          <Link href={`/dashboard/chat/${agent.id}`} className="chat-action-btn chat-btn-chat" style={{ color: agent.deptColor, borderColor: agent.deptColor }}>
            Чат
          </Link>
          <button className="chat-action-btn chat-btn-settings">
            Настройка
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
function ChatStyles() {
  return (
    <style jsx global>{`
      .chat-studio-root { background: #05060A; min-height: 100vh; padding: 32px 24px; }

      .chat-studio-header { margin-bottom: 40px; max-width: 1400px; margin-left: auto; margin-right: auto; }
      .chat-studio-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); padding: 8px 14px; border-radius: 10px; margin-bottom: 16px; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; color: rgba(255, 255, 255, 0.7); text-transform: uppercase; }
      .chat-studio-badge-icon { font-size: 14px; }
      .chat-studio-badge-count { background: rgba(99, 102, 241, 0.3); padding: 2px 8px; border-radius: 6px; color: #6366f1; }

      .chat-studio-title h1 { font-size: 36px; font-weight: 900; letter-spacing: -0.03em; color: #E5E7EB; margin: 0 0 8px; text-wrap: balance; }
      .chat-studio-title p { font-family: var(--font-geist-mono), monospace; font-size: 13px; letter-spacing: 0.08em; color: rgba(255, 255, 255, 0.35); margin: 0 0 28px; }

      .chat-studio-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; margin-top: 28px; }
      .chat-metric { padding: 16px; border-radius: 14px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.07); cursor: pointer; transition: all 0.3s; }
      .chat-metric:hover { background: rgba(255, 255, 255, 0.06); border-color: rgba(99, 102, 241, 0.3); }
      .chat-metric-value { font-size: 24px; font-weight: 900; color: #E5E7EB; font-variant-numeric: tabular-nums; margin-bottom: 4px; }
      .chat-metric-label { font-size: 10px; letter-spacing: 0.1em; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; }

      .chat-studio-controls { max-width: 1400px; margin: 0 auto 32px; display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }
      .chat-studio-search { flex: 1; min-width: 240px; display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 14px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.07); }
      .chat-studio-search:focus-within { background: rgba(255, 255, 255, 0.06); border-color: rgba(99, 102, 241, 0.4); }
      .chat-studio-search svg { color: rgba(255, 255, 255, 0.4); flex-shrink: 0; }
      .chat-studio-search input { flex: 1; background: none; border: none; outline: none; color: #E5E7EB; font-size: 14px; }
      .chat-studio-search input::placeholder { color: rgba(255, 255, 255, 0.3); }
      .chat-search-clear { background: none; border: none; color: rgba(255, 255, 255, 0.4); cursor: pointer; padding: 4px; }

      .chat-studio-filter { display: flex; gap: 8px; flex-wrap: wrap; }
      .chat-filter-btn { padding: 8px 12px; border-radius: 10px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.07); color: rgba(255, 255, 255, 0.6); font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
      .chat-filter-btn:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.12); }
      .chat-filter-btn.active { background: rgba(99, 102, 241, 0.2); border-color: rgba(99, 102, 241, 0.4); color: #6366f1; }

      .chat-studio-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; max-width: 1400px; margin: 0 auto; }

      .chat-agent-card { cursor: pointer; }
      .chat-card-inner { border-radius: 16px; padding: 20px; border: 1px solid rgba(255, 255, 255, 0.07); background: rgba(255, 255, 255, 0.03); display: flex; flex-direction: column; gap: 14px; transition: all 0.3s; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4), 0 8px 32px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.045); }
      .chat-agent-card:hover .chat-card-inner { border-color: rgba(255, 255, 255, 0.13); background: rgba(255, 255, 255, 0.06); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5), 0 16px 48px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08); }

      .chat-card-header { display: flex; gap: 12px; align-items: flex-start; }
      .chat-card-avatar { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; box-shadow: 0 0 16px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15); }
      .chat-card-info { flex: 1; }
      .chat-card-name { font-size: 14px; font-weight: 700; color: #E5E7EB; margin: 0 0 2px; }
      .chat-card-role { font-size: 12px; color: rgba(255, 255, 255, 0.45); margin: 0; }
      .chat-card-online { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981; margin-top: 4px; }

      .chat-card-desc { font-size: 13px; line-height: 1.6; color: rgba(255, 255, 255, 0.65); margin: 0; }

      .chat-card-meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 12px 0; border-top: 1px solid rgba(255, 255, 255, 0.06); border-bottom: 1px solid rgba(255, 255, 255, 0.06); }
      .chat-meta-item { display: flex; flex-direction: column; gap: 2px; }
      .chat-meta-label { font-size: 10px; letter-spacing: 0.08em; color: rgba(255, 255, 255, 0.35); text-transform: uppercase; font-weight: 600; }
      .chat-meta-value { font-size: 12px; font-weight: 700; color: rgba(255, 255, 255, 0.8); }

      .chat-card-actions { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
      .chat-action-btn { display: flex; align-items: center; justify-content: center; gap: 4px; padding: 10px 12px; border-radius: 12px; border: none; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; outline: none; text-decoration: none; min-height: 40px; }
      .chat-action-btn:focus { outline: 2px solid rgba(99, 102, 241, 0.5); outline-offset: 2px; }

      .chat-btn-launch { box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2); }
      .chat-btn-launch:hover { transform: translateY(-2px); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 8px 20px rgba(99, 102, 241, 0.3); }

      .chat-btn-chat { background: transparent; border: 1.5px solid; }
      .chat-btn-chat:hover { background: rgba(255, 255, 255, 0.06); }

      .chat-btn-settings { background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.6); }
      .chat-btn-settings:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.15); color: rgba(255, 255, 255, 0.8); }

      .chat-studio-empty { grid-column: 1 / -1; text-align: center; padding: 60px 24px; }
      .chat-empty-icon { font-size: 48px; margin-bottom: 16px; }
      .chat-empty-text { font-size: 18px; font-weight: 700; color: rgba(255, 255, 255, 0.7); margin-bottom: 8px; }
      .chat-empty-hint { font-size: 14px; color: rgba(255, 255, 255, 0.4); }

      @media (max-width: 1024px) {
        .chat-studio-grid { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
        .chat-studio-title h1 { font-size: 28px; }
      }

      @media (max-width: 640px) {
        .chat-studio-root { padding: 20px 16px; }
        .chat-studio-grid { grid-template-columns: 1fr; }
        .chat-studio-title h1 { font-size: 24px; }
        .chat-studio-metrics { grid-template-columns: 1fr 1fr; }
        .chat-card-meta { grid-template-columns: repeat(2, 1fr); }
      }

      @media (prefers-reduced-motion: reduce) {
        * { animation: none !important; transition: none !important; }
      }
    `}</style>
  );
}
