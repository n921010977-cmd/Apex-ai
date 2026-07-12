"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Star, Play, MessageSquare, Settings, Filter, X } from "lucide-react";
import Link from "next/link";

const EASE = [0.22, 1, 0.36, 1] as const;

// ─── AGENTS ──────────────────────────────────────────────────────────────────
const AGENTS_ALL = [
  { id: "ceo", dept: "Руководство", name: "Victoria Sterling", role: "Chief Executive Officer", icon: "👑", color: "#8b5cf6", desc: "Стратегическое видение, ключевые решения и управление компанией", model: "Claude Opus", tasks: 2847, rating: 4.9, speed: "1.2s", online: true },
  { id: "coo", dept: "Руководство", name: "Elena Vasquez", role: "Chief Operating Officer", icon: "⚙️", color: "#3b82f6", desc: "Операционная эффективность, процессы, масштабирование", model: "Claude Opus", tasks: 2103, rating: 4.8, speed: "1.4s", online: true },
  { id: "cfo", dept: "Руководство", name: "James Hartley", role: "Chief Financial Officer", icon: "💰", color: "#10b981", desc: "Финансовые модели, бюджетирование, инвестиции, ROI", model: "Claude Opus", tasks: 1984, rating: 4.9, speed: "1.1s", online: true },
  { id: "cmo", dept: "Руководство", name: "Sarah Chen", role: "Chief Marketing Officer", icon: "📢", color: "#f43f5e", desc: "Go-to-market, бренд-стратегия, рост аудитории", model: "Claude Sonnet", tasks: 1756, rating: 4.7, speed: "0.9s", online: true },
  { id: "cso", dept: "Руководство", name: "Marcus Webb", role: "Chief Strategy Officer", icon: "📊", color: "#f59e0b", desc: "Стратегия, партнёрства, корпоративные сделки", model: "Claude Sonnet", tasks: 1423, rating: 4.8, speed: "1.0s", online: false },
  { id: "cto", dept: "Руководство", name: "David Park", role: "Chief Technology Officer", icon: "⚡", color: "#a78bfa", desc: "Технический стек, архитектура, R&D стратегия", model: "Claude Opus", tasks: 1612, rating: 4.8, speed: "1.3s", online: true },
  { id: "inv", dept: "Финансы", name: "Robert Kim", role: "Investment Analyst", icon: "📈", color: "#10b981", desc: "Оценка инвестиций, DCF анализ, венчурный анализ", model: "Claude Sonnet", tasks: 890, rating: 4.7, speed: "1.5s", online: true },
  { id: "fp", dept: "Финансы", name: "Natasha Orlov", role: "Financial Planner", icon: "📊", color: "#3b82f6", desc: "Бюджетирование, прогнозирование, P&L анализ", model: "Claude Sonnet", tasks: 743, rating: 4.6, speed: "1.2s", online: false },
  { id: "budget", dept: "Финансы", name: "Alicia Monroe", role: "Budget Manager", icon: "💳", color: "#8b5cf6", desc: "Контроль расходов, оптимизация бюджета", model: "Claude Haiku", tasks: 612, rating: 4.5, speed: "0.7s", online: true },
  { id: "rev", dept: "Финансы", name: "Lucas Sterling", role: "Revenue Analyst", icon: "📈", color: "#f59e0b", desc: "Анализ выручки, MRR/ARR, когортный анализ", model: "Claude Sonnet", tasks: 528, rating: 4.7, speed: "1.1s", online: true },
  { id: "perf", dept: "Маркетинг", name: "Jessica Wong", role: "Performance Marketer", icon: "🎯", color: "#f43f5e", desc: "Платная реклама, ROAS, A/B тестирование", model: "Claude Sonnet", tasks: 1102, rating: 4.7, speed: "0.9s", online: true },
  { id: "brand", dept: "Маркетинг", name: "Oliver Chen", role: "Brand Strategist", icon: "🎨", color: "#a78bfa", desc: "Идентичность бренда, позиционирование", model: "Claude Sonnet", tasks: 876, rating: 4.8, speed: "1.0s", online: true },
  { id: "smm", dept: "Маркетинг", name: "Sophie Laurent", role: "Social Media Manager", icon: "📱", color: "#3b82f6", desc: "Контент для соцсетей, виральность, сообщества", model: "Claude Haiku", tasks: 1430, rating: 4.5, speed: "0.6s", online: true },
  { id: "copy", dept: "Маркетинг", name: "Nathan Brooks", role: "Copywriter", icon: "✍️", color: "#10b981", desc: "Продающие тексты, UX-копи, storytelling", model: "Claude Sonnet", tasks: 2100, rating: 4.8, speed: "0.8s", online: true },
  { id: "seo", dept: "Маркетинг", name: "Priya Patel", role: "SEO Expert", icon: "🔍", color: "#f59e0b", desc: "Семантика, техническое SEO, контент-стратегия", model: "Claude Sonnet", tasks: 914, rating: 4.6, speed: "1.1s", online: false },
  { id: "growth", dept: "Маркетинг", name: "Maya Scott", role: "Growth Hacker", icon: "📈", color: "#8b5cf6", desc: "Виральные петли, product-led growth", model: "Claude Opus", tasks: 678, rating: 4.8, speed: "1.3s", online: true },
  { id: "email", dept: "Маркетинг", name: "Alex Rivera", role: "Email Marketer", icon: "📧", color: "#3b82f6", desc: "Автоматизация рассылок, открываемость", model: "Claude Haiku", tasks: 763, rating: 4.5, speed: "0.7s", online: true },
  { id: "sales", dept: "Продажи", name: "Jason Turner", role: "Sales Manager", icon: "🤝", color: "#10b981", desc: "Закрытие сделок, переговоры, работа с возражениями", model: "Claude Sonnet", tasks: 1324, rating: 4.7, speed: "1.0s", online: true },
  { id: "sdr", dept: "Продажи", name: "Emma Thompson", role: "Sales Development Rep", icon: "📞", color: "#f43f5e", desc: "Поиск и квалификация лидов, холодные письма", model: "Claude Haiku", tasks: 2210, rating: 4.4, speed: "0.6s", online: true },
  { id: "ae", dept: "Продажи", name: "Michael Chen", role: "Account Executive", icon: "💼", color: "#a78bfa", desc: "Enterprise-продажи, демо, contract management", model: "Claude Sonnet", tasks: 876, rating: 4.8, speed: "1.2s", online: false },
];

const DEPARTMENTS = ["Все", "Руководство", "Финансы", "Маркетинг", "Продажи", "Продукт", "Разработка"];

// Metrics calculation
const getMetrics = () => {
  const online = AGENTS_ALL.filter(a => a.online).length;
  const totalTasks = AGENTS_ALL.reduce((sum, a) => sum + a.tasks, 0);
  const avgRating = (AGENTS_ALL.reduce((sum, a) => sum + a.rating, 0) / AGENTS_ALL.length).toFixed(1);
  return {
    total: AGENTS_ALL.length,
    online,
    tasks: totalTasks,
    rating: avgRating,
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
          <p>Взаимодействуйте с 50+ специализированными AI агентами</p>
        </div>

        {/* Metrics */}
        <div className="chat-studio-metrics">
          <motion.div className="chat-metric" whileHover={{ y: -2 }}>
            <div className="chat-metric-value">{metrics.total}</div>
            <div className="chat-metric-label">Всего агентов</div>
          </motion.div>
          <motion.div className="chat-metric" whileHover={{ y: -2 }}>
            <div className="chat-metric-value">{metrics.online}</div>
            <div className="chat-metric-label">Онлайн</div>
          </motion.div>
          <motion.div className="chat-metric" whileHover={{ y: -2 }}>
            <div className="chat-metric-value">{(metrics.tasks / 1000).toFixed(1)}K</div>
            <div className="chat-metric-label">Всего запусков</div>
          </motion.div>
          <motion.div className="chat-metric" whileHover={{ y: -2 }}>
            <div className="chat-metric-value">{metrics.rating}</div>
            <div className="chat-metric-label">Средний рейтинг</div>
          </motion.div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="chat-studio-controls">
        <div className="chat-studio-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Поиск агентов, ролей, навыков…"
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
      <div className="chat-card-inner" style={{ borderColor: `${agent.color}30`, background: `linear-gradient(135deg, ${agent.color}08, ${agent.color}04)` }}>
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

        {/* Stats */}
        <div className="chat-card-stats">
          <div className="chat-stat">
            <span className="chat-stat-label">Модель</span>
            <span className="chat-stat-value" style={{ color: agent.color }}>{agent.model}</span>
          </div>
          <div className="chat-stat">
            <span className="chat-stat-label">Скорость</span>
            <span className="chat-stat-value">{agent.speed}</span>
          </div>
          <div className="chat-stat">
            <span className="chat-stat-label">Запусков</span>
            <span className="chat-stat-value">{agent.tasks.toLocaleString()}</span>
          </div>
          <div className="chat-stat">
            <span className="chat-stat-label">Рейтинг</span>
            <div className="chat-rating">
              <Star size={14} fill={agent.color} color={agent.color} />
              <span>{agent.rating}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="chat-card-actions">
          <Link href={`/dashboard/chat/${agent.id}`} className="chat-action-btn chat-btn-primary">
            <MessageSquare size={16} />
            <span>Чат</span>
          </Link>
          <button className="chat-action-btn chat-btn-secondary">
            <Settings size={16} />
            <span>Настройка</span>
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

      .chat-studio-header { margin-bottom: 40px; max-width: 1280px; margin-left: auto; margin-right: auto; }
      .chat-studio-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); padding: 8px 14px; border-radius: 10px; margin-bottom: 16px; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; color: rgba(255, 255, 255, 0.7); text-transform: uppercase; }
      .chat-studio-badge-icon { font-size: 14px; }
      .chat-studio-badge-count { background: rgba(99, 102, 241, 0.3); padding: 2px 8px; border-radius: 6px; color: #6366f1; }

      .chat-studio-title h1 { font-size: 42px; font-weight: 900; letter-spacing: -0.03em; color: #E5E7EB; margin: 0 0 8px; text-wrap: balance; }
      .chat-studio-title p { font-size: 16px; line-height: 1.6; color: rgba(255, 255, 255, 0.5); margin: 0 0 24px; max-width: 70ch; }

      .chat-studio-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-top: 28px; }
      .chat-metric { padding: 16px; border-radius: 16px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.07); cursor: pointer; transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
      .chat-metric:hover { background: rgba(255, 255, 255, 0.06); border-color: rgba(99, 102, 241, 0.3); }
      .chat-metric-value { font-size: 28px; font-weight: 900; color: #E5E7EB; font-variant-numeric: tabular-nums; margin-bottom: 4px; }
      .chat-metric-label { font-size: 11px; letter-spacing: 0.1em; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; }

      .chat-studio-controls { max-width: 1280px; margin: 0 auto 32px; display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }

      .chat-studio-search { flex: 1; min-width: 240px; display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 14px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.07); transition: all 0.2s; }
      .chat-studio-search:focus-within { background: rgba(255, 255, 255, 0.06); border-color: rgba(99, 102, 241, 0.4); }
      .chat-studio-search svg { color: rgba(255, 255, 255, 0.4); flex-shrink: 0; }
      .chat-studio-search input { flex: 1; background: none; border: none; outline: none; color: #E5E7EB; font-size: 14px; }
      .chat-studio-search input::placeholder { color: rgba(255, 255, 255, 0.3); }
      .chat-search-clear { background: none; border: none; color: rgba(255, 255, 255, 0.4); cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; transition: color 0.2s; }
      .chat-search-clear:hover { color: rgba(255, 255, 255, 0.7); }

      .chat-studio-filter { display: flex; gap: 8px; flex-wrap: wrap; }
      .chat-filter-btn { padding: 8px 14px; border-radius: 10px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.07); color: rgba(255, 255, 255, 0.6); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.25s; white-space: nowrap; }
      .chat-filter-btn:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.12); }
      .chat-filter-btn.active { background: rgba(99, 102, 241, 0.2); border-color: rgba(99, 102, 241, 0.4); color: #6366f1; }

      .chat-studio-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; max-width: 1280px; margin: 0 auto; }

      .chat-agent-card { cursor: pointer; }
      .chat-card-inner { border-radius: 18px; padding: 20px; border: 1px solid; display: flex; flex-direction: column; gap: 14px; transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4), 0 8px 32px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.06); }
      .chat-agent-card:hover .chat-card-inner { box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5), 0 16px 48px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.15); }

      .chat-card-header { display: flex; gap: 14px; align-items: flex-start; }
      .chat-card-avatar { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; box-shadow: 0 0 16px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15); }
      .chat-card-info { flex: 1; min-width: 0; }
      .chat-card-name { font-size: 14px; font-weight: 800; color: rgba(255, 255, 255, 0.95); margin: 0 0 2px; letter-spacing: -0.01em; }
      .chat-card-role { font-size: 12px; color: rgba(255, 255, 255, 0.45); margin: 0; }
      .chat-card-online { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981; flex-shrink: 0; margin-top: 4px; }

      .chat-card-desc { font-size: 13px; line-height: 1.6; color: rgba(255, 255, 255, 0.65); margin: 0; }

      .chat-card-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 8px; padding: 12px 0; border-top: 1px solid rgba(255, 255, 255, 0.06); border-bottom: 1px solid rgba(255, 255, 255, 0.06); }
      .chat-stat { display: flex; flex-direction: column; gap: 3px; }
      .chat-stat-label { font-size: 10px; letter-spacing: 0.08em; color: rgba(255, 255, 255, 0.35); text-transform: uppercase; font-weight: 600; }
      .chat-stat-value { font-size: 12px; font-weight: 700; color: rgba(255, 255, 255, 0.8); font-variant-numeric: tabular-nums; }
      .chat-rating { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; color: rgba(255, 255, 255, 0.8); }

      .chat-card-actions { display: flex; gap: 8px; }
      .chat-action-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 12px; border-radius: 12px; border: none; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.25s; outline: none; min-height: 40px; }
      .chat-action-btn:focus { outline: 2px solid rgba(99, 102, 241, 0.5); outline-offset: 2px; }

      .chat-btn-primary { background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 12px rgba(99, 102, 241, 0.3); }
      .chat-btn-primary:hover { transform: translateY(-2px); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 8px 20px rgba(99, 102, 241, 0.4); }

      .chat-btn-secondary { background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.7); }
      .chat-btn-secondary:hover { background: rgba(255, 255, 255, 0.12); border-color: rgba(255, 255, 255, 0.18); color: rgba(255, 255, 255, 0.9); }

      .chat-studio-empty { grid-column: 1 / -1; text-align: center; padding: 60px 24px; }
      .chat-empty-icon { font-size: 48px; margin-bottom: 16px; }
      .chat-empty-text { font-size: 18px; font-weight: 700; color: rgba(255, 255, 255, 0.7); margin-bottom: 8px; }
      .chat-empty-hint { font-size: 14px; color: rgba(255, 255, 255, 0.4); }

      @media (max-width: 1024px) {
        .chat-studio-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
        .chat-studio-title h1 { font-size: 32px; }
      }

      @media (max-width: 640px) {
        .chat-studio-root { padding: 20px 16px; }
        .chat-studio-header { margin-bottom: 28px; }
        .chat-studio-title h1 { font-size: 28px; }
        .chat-studio-metrics { grid-template-columns: 1fr 1fr; gap: 12px; }
        .chat-studio-grid { grid-template-columns: 1fr; gap: 16px; }
        .chat-studio-controls { flex-direction: column; }
        .chat-studio-search { width: 100%; }
        .chat-studio-filter { width: 100%; }
      }

      @media (prefers-reduced-motion: reduce) {
        * { animation: none !important; transition: none !important; }
      }
    `}</style>
  );
}
