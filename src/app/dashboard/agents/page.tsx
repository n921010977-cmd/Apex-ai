"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Activity, Clock, Cpu, Users, TrendingUp, MessageCircle, ArrowRight, X } from "lucide-react";
import { DEPARTMENTS } from "@/lib/corp";
import { TEAM, TEAM_BY_SLUG } from "@/lib/team";

const EASE = [0.22, 1, 0.36, 1] as const;

// ─── Mock live data ──────────────────────────────────────────────────────────
type LiveEvent = { time: string; from: string; to: string; action: string; id: string };

function generateLiveEvents(): LiveEvent[] {
  const deptNames = DEPARTMENTS.map(d => d.short);
  const actions = ["планирует задачу", "назначает работу", "генерирует результат", "завершает процесс", "обновляет статус"];
  return Array.from({ length: 8 }, (_, i) => ({
    time: new Date(Date.now() - i * 2000).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    from: deptNames[Math.floor(Math.random() * deptNames.length)],
    to: deptNames[Math.floor(Math.random() * deptNames.length)],
    action: actions[Math.floor(Math.random() * actions.length)],
    id: `evt-${i}`,
  }));
}

function generateMetrics() {
  return {
    active: Math.floor(Math.random() * 8) + 20,
    online: Math.floor(Math.random() * 6) + 28,
    tasksToday: Math.floor(Math.random() * 50) + 140,
    timeSaved: Math.floor(Math.random() * 12) + 18,
    credits: Math.floor(Math.random() * 1200) + 2400,
  };
}

export default function AIAgentsPage() {
  const [metrics, setMetrics] = useState(generateMetrics());
  const [liveEvents, setLiveEvents] = useState(generateLiveEvents());
  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [hoveredDept, setHoveredDept] = useState<string | null>(null);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(generateMetrics());
      setLiveEvents(prev => [generateLiveEvents()[0], ...prev.slice(0, 7)]);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="agents-root">
      {/* Header */}
      <div className="agents-header">
        <div className="agents-head-content">
          <div className="agents-eyebrow">ЦИФРОВАЯ КОРПОРАЦИЯ</div>
          <h1 className="agents-title">AI Company Command Center</h1>
          <p className="agents-subtitle">Интерактивная карта всех отделов, агентов и их реальной активности</p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="agents-status-grid">
        <StatusCard icon={Users} label="Активные агенты" value={`${metrics.active}`} color="#6366f1" />
        <StatusCard icon={Activity} label="Онлайн" value={`${metrics.online}`} color="#10b981" />
        <StatusCard icon={TrendingUp} label="Задач сегодня" value={`${metrics.tasksToday}`} color="#f59e0b" />
        <StatusCard icon={Clock} label="Экономия времени" value={`${metrics.timeSaved}ч`} color="#0ea5e9" />
        <StatusCard icon={Cpu} label="AI Credits" value={`${(metrics.credits / 1000).toFixed(1)}K`} color="#a855f7" />
        <StatusCard icon={Zap} label="Статус" value="Live" color="#ec4899" isLive />
      </div>

      <div className="agents-main">
        {/* Left: Interactive Map */}
        <div className="agents-map-section">
          <div className="agents-map-header">
            <h2>Организационная структура</h2>
            <p>Нажмите на отдел чтобы увидеть сотрудников</p>
          </div>
          <CompanyMap expandedDept={expandedDept} setExpandedDept={setExpandedDept} hoveredDept={hoveredDept} setHoveredDept={setHoveredDept} />
        </div>

        {/* Right: Live Console */}
        <div className="agents-console-section">
          <div className="agents-console-header">
            <h2>Live Console</h2>
            <div className="agents-console-pulse">
              <span className="agents-pulse-dot" />
              Live
            </div>
          </div>
          <div className="agents-console-content">
            {liveEvents.map((evt, i) => (
              <motion.div key={evt.id} className="agents-console-event" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                <div className="agents-event-time">{evt.time}</div>
                <div className="agents-event-flow">
                  <span className="agents-event-badge" style={{ background: DEPARTMENTS.find(d => d.short === evt.from)?.color }}>{evt.from}</span>
                  <ArrowRight size={14} />
                  <span className="agents-event-badge" style={{ background: DEPARTMENTS.find(d => d.short === evt.to)?.color }}>{evt.to}</span>
                </div>
                <div className="agents-event-action">{evt.action}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Expanded Department */}
      <AnimatePresence>
        {expandedDept && (
          <ExpandedDepartment dept={DEPARTMENTS.find(d => d.id === expandedDept)!} onClose={() => setExpandedDept(null)} />
        )}
      </AnimatePresence>

      <div className="agents-timeline-section">
        <h2>Real-time Action Timeline</h2>
        <ActionTimeline />
      </div>

      <AgentStyles />
    </div>
  );
}

// ─── Status Card ──────────────────────────────────────────────────────────
function StatusCard({ icon: Icon, label, value, color, isLive = false }: { icon: any; label: string; value: string; color: string; isLive?: boolean }) {
  return (
    <motion.div className="status-card" whileHover={{ y: -4 }} transition={{ duration: 0.3, ease: EASE }}>
      <div className="status-card-inner" style={{ borderColor: `${color}30`, background: `linear-gradient(135deg, ${color}08, ${color}04)` }}>
        <div className="status-card-icon" style={{ background: `${color}20`, color }}><Icon size={20} /></div>
        <div className="status-card-text">
          <div className="status-card-label">{label}</div>
          <div className="status-card-value" style={{ color }}>{value}</div>
        </div>
        {isLive && <motion.div className="status-card-pulse" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ background: color }} />}
      </div>
    </motion.div>
  );
}

// ─── Company Map ──────────────────────────────────────────────────────────
function CompanyMap({ expandedDept, setExpandedDept, hoveredDept, setHoveredDept }: { expandedDept: string | null; setExpandedDept: (id: string | null) => void; hoveredDept: string | null; setHoveredDept: (id: string | null) => void }) {
  const size = 540;
  const center = size / 2;
  const ceoRadius = 50;
  const deptRadius = 160;
  const deptCount = DEPARTMENTS.length;

  return (
    <div className="company-map">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Animated connection lines */}
        {DEPARTMENTS.map((dept, i) => {
          const angle = (i / deptCount) * Math.PI * 2 - Math.PI / 2;
          const x = center + deptRadius * Math.cos(angle);
          const y = center + deptRadius * Math.sin(angle);
          return (
            <motion.line key={`line-${dept.id}`} x1={center} y1={center} x2={x} y2={y} stroke={dept.color} strokeWidth="2" opacity="0.2" animate={{ strokeDashoffset: hoveredDept === dept.id ? 0 : 8 }} transition={{ duration: 0.6, repeat: Infinity }} strokeDasharray="8" />
          );
        })}

        {/* CEO Center */}
        <g>
          <motion.circle cx={center} cy={center} r={ceoRadius} fill="url(#ceoGradient)" stroke="#6366f1" strokeWidth="2" animate={{ r: [ceoRadius, ceoRadius + 4, ceoRadius] }} transition={{ duration: 2.5, repeat: Infinity }} />
          <text x={center} y={center} textAnchor="middle" dy="0.3em" fill="#fff" fontSize="24" fontWeight="800" fontFamily="monospace">CEO</text>
        </g>

        {/* Departments */}
        {DEPARTMENTS.map((dept, i) => {
          const angle = (i / deptCount) * Math.PI * 2 - Math.PI / 2;
          const x = center + deptRadius * Math.cos(angle);
          const y = center + deptRadius * Math.sin(angle);
          const isHovered = hoveredDept === dept.id;
          const isExpanded = expandedDept === dept.id;

          return (
            <g key={dept.id} onMouseEnter={() => setHoveredDept(dept.id)} onMouseLeave={() => setHoveredDept(null)} onClick={() => setExpandedDept(dept.id)} style={{ cursor: "pointer" }}>
              <motion.circle cx={x} cy={y} r={35} fill={dept.color} opacity={isHovered ? 0.3 : 0.15} animate={{ r: isHovered || isExpanded ? 42 : 35 }} transition={{ duration: 0.3 }} />
              <circle cx={x} cy={y} r={35} fill="none" stroke={dept.color} strokeWidth={isHovered || isExpanded ? "2.5" : "1.5"} opacity={isHovered || isExpanded ? 1 : 0.4} />
              <text x={x} y={y} textAnchor="middle" dy="0.3em" fill="#fff" fontSize="13" fontWeight="800" fontFamily="monospace">{dept.short}</text>
            </g>
          );
        })}

        <defs>
          <linearGradient id="ceoGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#4f46e5" /></linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ─── Expanded Department ──────────────────────────────────────────────────────────
function ExpandedDepartment({ dept, onClose }: { dept: typeof DEPARTMENTS[0]; onClose: () => void }) {
  const deptAgents = dept.agents;

  const getAgentColor = (agentName: string) => {
    const team = TEAM.find(t => t.name === agentName);
    return team ? team.c : dept.color;
  };

  const getAgentGradient = (agentName: string): [string, string] => {
    const team = TEAM.find(t => t.name === agentName);
    return team ? team.g : [dept.color, dept.g[1]];
  };

  return (
    <motion.div className="expanded-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="expanded-modal" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.3, ease: EASE }} onClick={e => e.stopPropagation()}>
        <button className="expanded-close" onClick={onClose}><X size={20} /></button>

        <div className="expanded-header" style={{ borderColor: `${dept.color}30`, background: `linear-gradient(135deg, ${dept.color}10, ${dept.color}05)` }}>
          <div className="expanded-dept-icon" style={{ background: `linear-gradient(135deg, ${dept.g[0]}, ${dept.g[1]})` }}>{dept.short}</div>
          <div>
            <h2 className="expanded-title">{dept.name}</h2>
            <p className="expanded-subtitle">{dept.deliverable}</p>
          </div>
        </div>

        <div className="expanded-thoughts">
          <div className="expanded-thoughts-label">Что они думают:</div>
          <div className="expanded-thoughts-list">
            {dept.thoughts.map((thought, i) => (
              <motion.div key={i} className="expanded-thought" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                <span style={{ color: dept.color }}>▸</span> {thought}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="expanded-agents">
          <div className="expanded-agents-label">Команда ({deptAgents.length})</div>
          <div className="expanded-agents-grid">
            {deptAgents.map((agent, i) => {
              const agentColor = getAgentColor(agent.name);
              const agentGradient = getAgentGradient(agent.name);
              return (
                <motion.div key={agent.ab} className="agent-mini-os" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} style={{ borderColor: `${agentColor}40`, background: `linear-gradient(135deg, ${agentColor}08, ${agentColor}03)` }}>
                  <div className="agent-mini-header">
                    <div className="agent-mini-avatar" style={{ background: `linear-gradient(135deg, ${agentGradient[0]}, ${agentGradient[1]})` }}>{agent.ab}</div>
                    <div className="agent-mini-info">
                      <div className="agent-mini-name">{agent.name}</div>
                      <div className="agent-mini-role">{agent.role}</div>
                    </div>
                  </div>

                  <div className="agent-mini-metrics">
                    <div className="agent-mini-metric">
                      <span>Загрузка</span>
                      <motion.div className="agent-mini-bar" initial={{ scaleX: 0 }} animate={{ scaleX: Math.random() }} transition={{ duration: 1 }}>
                        <div style={{ background: agentColor, height: "100%", width: "100%" }} />
                      </motion.div>
                    </div>
                    <div className="agent-mini-metric">
                      <span>Скорость</span>
                      <motion.div className="agent-mini-bar" initial={{ scaleX: 0 }} animate={{ scaleX: Math.random() }} transition={{ duration: 1 }}>
                        <div style={{ background: agentColor, height: "100%", width: "100%" }} />
                      </motion.div>
                    </div>
                  </div>

                  <div className="agent-mini-status">
                    <span className="agent-status-badge" style={{ background: `${agentColor}30`, color: agentColor }}>
                      <span className="agent-status-dot" style={{ background: agentColor }} />
                      Working
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Action Timeline ──────────────────────────────────────────────────────────
function ActionTimeline() {
  const timeline = [
    { agent: "CEO", action: "Получила задачу", color: "#818cf8" },
    { agent: "Strategy", action: "Анализирует цели", color: "#6366f1" },
    { agent: "Marketing", action: "Планирует кампанию", color: "#10b981" },
    { agent: "Development", action: "Начинает разработку", color: "#a855f7" },
    { agent: "Finance", action: "Рассчитывает бюджет", color: "#3b82f6" },
    { agent: "Analytics", action: "Настраивает метрики", color: "#0ea5e9" },
    { agent: "CEO", action: "Собирает результаты", color: "#818cf8" },
    { agent: "User", action: "Получает результат ✓", color: "#10b981" },
  ];

  return (
    <div className="timeline-container">
      {timeline.map((item, i) => (
        <motion.div key={i} className="timeline-item" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
          <div className="timeline-dot" style={{ background: item.color, boxShadow: `0 0 16px ${item.color}60` }} />
          <div className="timeline-content">
            <div className="timeline-agent" style={{ color: item.color }}>{item.agent}</div>
            <div className="timeline-action">{item.action}</div>
          </div>
          {i < timeline.length - 1 && <div className="timeline-arrow"><ArrowRight size={16} /></div>}
        </motion.div>
      ))}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
function AgentStyles() {
  return (
    <style jsx global>{`
      .agents-root { background: #05060A; min-height: 100%; }

      .agents-header { padding: 40px 24px 24px; border-bottom: 1px solid rgba(255,255,255,0.07); }
      .agents-head-content { max-width: 1200px; margin: 0 auto; }
      .agents-eyebrow { font-family: var(--font-geist-mono), monospace; font-size: 10.5px; letter-spacing: 0.14em; color: rgba(255,255,255,0.32); margin-bottom: 9px; }
      .agents-title { font-size: 32px; font-weight: 800; letter-spacing: -0.025em; color: #E5E7EB; margin: 0 0 8px; text-wrap: balance; }
      .agents-subtitle { font-size: 14px; line-height: 1.55; color: rgba(255,255,255,0.5); max-width: 70ch; margin: 0; }

      .agents-status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; max-width: 1200px; margin: 24px auto; padding: 0 24px; }

      .status-card { cursor: pointer; }
      .status-card-inner { border-radius: 16px; padding: 16px; border: 1px solid; display: flex; align-items: center; gap: 12px; transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1); box-shadow: 0 1px 2px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05); }
      .status-card-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
      .status-card-text { flex: 1; }
      .status-card-label { font-family: var(--font-geist-mono), monospace; font-size: 10px; letter-spacing: 0.1em; color: rgba(255,255,255,0.4); margin-bottom: 4px; }
      .status-card-value { font-size: 22px; font-weight: 800; font-variant-numeric: tabular-nums; }
      .status-card-pulse { width: 8px; height: 8px; border-radius: 50%; }

      .agents-main { display: grid; grid-template-columns: 1fr 340px; gap: 20px; max-width: 1200px; margin: 30px auto; padding: 0 24px; }

      .agents-map-section, .agents-console-section { border-radius: 22px; border: 1px solid rgba(255,255,255,0.07); padding: 24px; background: rgba(255,255,255,0.02); box-shadow: 0 1px 2px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.045); }

      .agents-map-header, .agents-console-header { margin-bottom: 16px; }
      .agents-map-header h2, .agents-console-header h2 { font-size: 16px; font-weight: 700; color: #E5E7EB; margin: 0 0 4px; }
      .agents-map-header p { font-size: 12px; color: rgba(255,255,255,0.4); margin: 0; }

      .agents-console-header { display: flex; justify-content: space-between; align-items: center; }
      .agents-console-pulse { display: flex; align-items: center; gap: 6px; font-size: 12px; color: rgba(255,255,255,0.6); }
      .agents-pulse-dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; animation: pulse 2s cubic-bezier(0.22, 1, 0.36, 1) infinite; }

      .company-map { height: 400px; display: flex; align-items: center; justify-content: center; }

      .agents-console-content { display: flex; flex-direction: column; gap: 8px; max-height: 360px; overflow-y: auto; }
      .agents-console-event { display: flex; flex-direction: column; gap: 6px; padding: 8px; border-radius: 10px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); }
      .agents-event-time { font-family: var(--font-geist-mono), monospace; font-size: 9px; color: rgba(255,255,255,0.35); }
      .agents-event-flow { display: flex; align-items: center; gap: 6px; }
      .agents-event-badge { font-family: var(--font-geist-mono), monospace; font-size: 10px; font-weight: 700; color: #fff; padding: 2px 6px; border-radius: 6px; opacity: 0.85; }
      .agents-event-action { font-size: 11px; color: rgba(255,255,255,0.65); }

      .expanded-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 50; display: flex; align-items: center; justify-content: center; }
      .expanded-modal { background: #05060A; border-radius: 24px; border: 1px solid rgba(255,255,255,0.07); max-width: 900px; width: 90vw; max-height: 85vh; overflow-y: auto; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05); }
      .expanded-close { position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; width: 36px; height: 36px; cursor: pointer; color: rgba(255,255,255,0.6); z-index: 10; transition: all 0.2s; }
      .expanded-close:hover { background: rgba(255,255,255,0.12); color: #fff; }

      .expanded-header { padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.07); border-radius: 24px 24px 0 0; display: flex; gap: 16px; align-items: flex-start; }
      .expanded-dept-icon { width: 60px; height: 60px; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 20px; flex-shrink: 0; }
      .expanded-title { font-size: 22px; font-weight: 800; color: #E5E7EB; margin: 0 0 4px; }
      .expanded-subtitle { font-size: 13px; color: rgba(255,255,255,0.5); margin: 0; }

      .expanded-thoughts { padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.07); }
      .expanded-thoughts-label { font-family: var(--font-geist-mono), monospace; font-size: 10px; letter-spacing: 0.1em; color: rgba(255,255,255,0.4); margin-bottom: 12px; }
      .expanded-thoughts-list { display: flex; flex-direction: column; gap: 8px; }
      .expanded-thought { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.7); }

      .expanded-agents { padding: 24px; }
      .expanded-agents-label { font-family: var(--font-geist-mono), monospace; font-size: 10px; letter-spacing: 0.1em; color: rgba(255,255,255,0.4); margin-bottom: 12px; }
      .expanded-agents-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }

      .agent-mini-os { border-radius: 14px; padding: 14px; border: 1px solid; display: flex; flex-direction: column; gap: 10px; transition: all 0.3s; }
      .agent-mini-os:hover { transform: translateY(-2px); border-color: rgba(255,255,255,0.15); }

      .agent-mini-header { display: flex; gap: 10px; align-items: center; }
      .agent-mini-avatar { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 12px; flex-shrink: 0; }
      .agent-mini-info { flex: 1; min-width: 0; }
      .agent-mini-name { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.9); }
      .agent-mini-role { font-size: 10px; color: rgba(255,255,255,0.4); }

      .agent-mini-metrics { display: flex; flex-direction: column; gap: 6px; }
      .agent-mini-metric { display: flex; align-items: center; gap: 8px; }
      .agent-mini-metric span { font-size: 10px; color: rgba(255,255,255,0.4); min-width: 50px; }
      .agent-mini-bar { flex: 1; height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; origin: left; }

      .agent-mini-status { display: flex; gap: 6px; }
      .agent-status-badge { font-size: 10px; font-weight: 600; padding: 4px 8px; border-radius: 8px; display: flex; align-items: center; gap: 4px; }
      .agent-status-dot { width: 4px; height: 4px; border-radius: 50%; animation: pulse 1.5s cubic-bezier(0.22, 1, 0.36, 1) infinite; }

      .agents-timeline-section { max-width: 1200px; margin: 40px auto; padding: 0 24px; }
      .agents-timeline-section h2 { font-size: 16px; font-weight: 700; color: #E5E7EB; margin: 0 0 16px; }

      .timeline-container { display: flex; align-items: center; gap: 8px; overflow-x: auto; padding: 20px 0; }
      .timeline-item { display: flex; align-items: center; gap: 12px; flex-shrink: 0; min-width: max-content; }
      .timeline-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
      .timeline-content { display: flex; flex-direction: column; gap: 2px; }
      .timeline-agent { font-size: 11px; font-weight: 700; }
      .timeline-action { font-size: 10px; color: rgba(255,255,255,0.5); }
      .timeline-arrow { margin: 0 4px; color: rgba(255,255,255,0.2); }

      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

      @media (max-width: 980px) {
        .agents-main { grid-template-columns: 1fr; }
        .agents-console-section { grid-column: 1; }
      }

      @media (prefers-reduced-motion: reduce) {
        * { animation: none !important; }
      }
    `}</style>
  );
}
