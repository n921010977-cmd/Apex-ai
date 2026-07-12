"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Activity, Clock, Cpu, Users, TrendingUp, MessageCircle, ArrowRight, X, Sparkles } from "lucide-react";
import { DEPARTMENTS } from "@/lib/corp";
import { TEAM, TEAM_BY_SLUG } from "@/lib/team";

const EASE = [0.22, 1, 0.36, 1] as const;
const EASE_OUT_CUBIC = [0.33, 1, 0.68, 1] as const;

// ─── Mock live data ──────────────────────────────────────────────────────────
type LiveEvent = { time: string; from: string; to: string; action: string; id: string; priority: "high" | "normal" | "low" };

function generateLiveEvents(): LiveEvent[] {
  const deptNames = DEPARTMENTS.map(d => d.short);
  const actions = [
    { text: "планирует задачу", priority: "high" as const },
    { text: "назначает работу", priority: "high" as const },
    { text: "генерирует результат", priority: "normal" as const },
    { text: "завершает процесс", priority: "high" as const },
    { text: "обновляет статус", priority: "low" as const },
    { text: "синхронизирует данные", priority: "normal" as const },
    { text: "оптимизирует процесс", priority: "low" as const },
  ];
  return Array.from({ length: 8 }, (_, i) => {
    const action = actions[Math.floor(Math.random() * actions.length)];
    return {
      time: new Date(Date.now() - i * 2500).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      from: deptNames[Math.floor(Math.random() * deptNames.length)],
      to: deptNames[Math.floor(Math.random() * deptNames.length)],
      action: action.text,
      priority: action.priority,
      id: `evt-${i}`,
    };
  });
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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(generateMetrics());
      setLiveEvents(prev => [generateLiveEvents()[0], ...prev.slice(0, 7)]);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Particle animation background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
    canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      a: number;
      c: string;
    }

    const particles: Particle[] = Array.from({ length: 15 }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      a: Math.random() * 0.3 + 0.1,
      c: ["#6366f1", "#4f46e5", "#818cf8"][Math.floor(Math.random() * 3)],
    }));

    let animationId: number;
    const animate = () => {
      ctx.fillStyle = "rgba(5, 6, 10, 0.1)";
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.a += (Math.random() - 0.5) * 0.05;
        p.a = Math.max(0.05, Math.min(0.4, p.a));

        if (p.x < 0) p.x = canvas.offsetWidth;
        if (p.x > canvas.offsetWidth) p.x = 0;
        if (p.y < 0) p.y = canvas.offsetHeight;
        if (p.y > canvas.offsetHeight) p.y = 0;

        ctx.fillStyle = p.c + Math.floor(p.a * 255).toString(16).padStart(2, "0");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="agents-root">
      <canvas ref={canvasRef} className="agents-bg-canvas" />
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
            {liveEvents.map((evt, i) => {
              const priorityColor = evt.priority === "high" ? "#ef4444" : evt.priority === "normal" ? "#f59e0b" : "#6b7280";
              return (
                <motion.div key={evt.id} className={`agents-console-event priority-${evt.priority}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} style={{ borderLeftColor: priorityColor }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <div className="agents-event-time">{evt.time}</div>
                    <motion.div className="agents-priority-dot" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }} style={{ background: priorityColor }} />
                  </div>
                  <div className="agents-event-flow">
                    <span className="agents-event-badge" style={{ background: DEPARTMENTS.find(d => d.short === evt.from)?.color }}>{evt.from}</span>
                    <ArrowRight size={13} strokeWidth={2} />
                    <span className="agents-event-badge" style={{ background: DEPARTMENTS.find(d => d.short === evt.to)?.color }}>{evt.to}</span>
                  </div>
                  <div className="agents-event-action">{evt.action}</div>
                </motion.div>
              );
            })}
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
    <motion.div className="status-card" whileHover={{ y: -6, scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.3, ease: EASE }}>
      <div className="status-card-inner" style={{ borderColor: `${color}40`, background: `linear-gradient(135deg, ${color}12, ${color}06)` }}>
        <motion.div className="status-card-icon-wrapper" whileHover={{ rotate: 6 }} transition={{ duration: 0.4 }}>
          <div className="status-card-icon" style={{ background: `${color}25`, color, boxShadow: `0 0 20px ${color}40` }}><Icon size={20} strokeWidth={1.5} /></div>
        </motion.div>
        <div className="status-card-text">
          <div className="status-card-label">{label}</div>
          <motion.div className="status-card-value" style={{ color }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            {value}
          </motion.div>
        </div>
        {isLive && (
          <div className="status-card-live">
            <motion.div className="status-card-pulse" animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ background: color }} />
            <motion.div className="status-card-pulse-ring" animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ borderColor: color }} />
          </div>
        )}
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
        <defs>
          <linearGradient id="ceoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          {DEPARTMENTS.map(dept => (
            <filter key={`glow-${dept.id}`} id={`glow-${dept.id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
        </defs>

        {/* Animated pulse rings from CEO */}
        <motion.circle cx={center} cy={center} r={120} fill="none" stroke="#6366f1" strokeWidth="1" opacity="0.1" animate={{ r: [100, 160, 100], opacity: [0.3, 0, 0.3] }} transition={{ duration: 4, repeat: Infinity }} />

        {/* Animated connection lines */}
        {DEPARTMENTS.map((dept, i) => {
          const angle = (i / deptCount) * Math.PI * 2 - Math.PI / 2;
          const x = center + deptRadius * Math.cos(angle);
          const y = center + deptRadius * Math.sin(angle);
          const isHovered = hoveredDept === dept.id;

          return (
            <motion.g key={`line-${dept.id}`}>
              <line x1={center} y1={center} x2={x} y2={y} stroke={dept.color} strokeWidth="2" opacity="0.15" />
              <motion.line x1={center} y1={center} x2={x} y2={y} stroke={dept.color} strokeWidth="2.5" opacity={isHovered ? 0.8 : 0.3} animate={{ strokeDashoffset: isHovered ? 0 : 8 }} transition={{ duration: 0.4, repeat: Infinity }} strokeDasharray="8" strokeLinecap="round" />
            </motion.g>
          );
        })}

        {/* CEO Center with glow */}
        <g filter="url(#glow-ceo)">
          <motion.circle cx={center} cy={center} r={ceoRadius} fill="url(#ceoGradient)" stroke="#6366f1" strokeWidth="2" animate={{ r: [ceoRadius, ceoRadius + 5, ceoRadius] }} transition={{ duration: 2.5, repeat: Infinity }} />
          <motion.circle cx={center} cy={center} r={ceoRadius + 10} fill="none" stroke="#6366f1" strokeWidth="1" opacity="0.2" animate={{ r: [ceoRadius + 8, ceoRadius + 18, ceoRadius + 8] }} transition={{ duration: 2.5, repeat: Infinity }} />
          <text x={center} y={center} textAnchor="middle" dy="0.3em" fill="#fff" fontSize="24" fontWeight="800" fontFamily="monospace" style={{ pointerEvents: "none" }}>CEO</text>
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
              <motion.circle cx={x} cy={y} r={35} fill={dept.color} opacity={isHovered ? 0.35 : 0.18} animate={{ r: isHovered || isExpanded ? 44 : 35 }} transition={{ duration: 0.35 }} />
              <motion.circle cx={x} cy={y} r={isHovered || isExpanded ? 44 : 35} fill="none" stroke={dept.color} strokeWidth={isHovered || isExpanded ? "2.5" : "1.5"} opacity={isHovered || isExpanded ? 0.9 : 0.45} animate={{ r: isHovered || isExpanded ? 44 : 35 }} transition={{ duration: 0.35 }} />
              {isHovered && <motion.circle cx={x} cy={y} r={50} fill="none" stroke={dept.color} strokeWidth="1.5" opacity="0" animate={{ r: [40, 55], opacity: [0.6, 0] }} transition={{ duration: 0.8, repeat: Infinity }} />}
              <text x={x} y={y} textAnchor="middle" dy="0.3em" fill="#fff" fontSize="13" fontWeight="800" fontFamily="monospace" style={{ pointerEvents: "none" }}>
                {dept.short}
              </text>
            </g>
          );
        })}
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
                      <span>Память</span>
                      <motion.div className="agent-mini-bar" initial={{ scaleX: 0 }} animate={{ scaleX: [Math.random() * 0.7 + 0.2, Math.random() * 0.8 + 0.2, Math.random() * 0.7 + 0.2] }} transition={{ duration: 2, repeat: Infinity }}>
                        <div style={{ background: agentColor, height: "100%", width: "100%" }} />
                      </motion.div>
                    </div>
                    <div className="agent-mini-metric">
                      <span>CPU</span>
                      <motion.div className="agent-mini-bar" initial={{ scaleX: 0 }} animate={{ scaleX: [Math.random() * 0.6 + 0.1, Math.random() * 0.7 + 0.1, Math.random() * 0.6 + 0.1] }} transition={{ duration: 2, repeat: Infinity }}>
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
    { agent: "CEO", action: "Получила задачу", color: "#818cf8", icon: "👁️" },
    { agent: "Strategy", action: "Анализирует цели", color: "#6366f1", icon: "📊" },
    { agent: "Marketing", action: "Планирует кампанию", color: "#10b981", icon: "📢" },
    { agent: "Development", action: "Начинает разработку", color: "#a855f7", icon: "⚙️" },
    { agent: "Finance", action: "Рассчитывает бюджет", color: "#3b82f6", icon: "💰" },
    { agent: "Analytics", action: "Настраивает метрики", color: "#0ea5e9", icon: "📈" },
    { agent: "CEO", action: "Собирает результаты", color: "#818cf8", icon: "✅" },
    { agent: "User", action: "Получает результат", color: "#10b981", icon: "🎯" },
  ];

  return (
    <div className="timeline-container">
      {timeline.map((item, i) => (
        <motion.div key={i} className="timeline-item" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }}>
          <motion.div className="timeline-dot" style={{ background: item.color, boxShadow: `0 0 16px ${item.color}60` }} whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.95 }} >
            <div className="timeline-dot-inner">{item.icon}</div>
          </motion.div>
          <motion.div className="timeline-content" whileHover={{ x: 4 }}>
            <div className="timeline-agent" style={{ color: item.color }}>{item.agent}</div>
            <div className="timeline-action">{item.action}</div>
          </motion.div>
          {i < timeline.length - 1 && (
            <motion.div className="timeline-arrow" animate={{ x: [0, 4, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <ArrowRight size={16} />
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
function AgentStyles() {
  return (
    <style jsx global>{`
      .agents-root { background: #05060A; min-height: 100%; position: relative; overflow: hidden; }
      .agents-bg-canvas { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; opacity: 0.5; z-index: 0; }

      .agents-header, .agents-status-grid, .agents-main, .agents-timeline-section { position: relative; z-index: 1; }

      .agents-header { padding: 48px 24px 32px; border-bottom: 1px solid rgba(255,255,255,0.07); background: linear-gradient(180deg, rgba(99,102,241,0.05), transparent); }
      .agents-head-content { max-width: 1200px; margin: 0 auto; }
      .agents-eyebrow { font-family: var(--font-geist-mono), monospace; font-size: 11px; letter-spacing: 0.16em; color: rgba(255,255,255,0.35); margin-bottom: 12px; text-transform: uppercase; font-weight: 600; }
      .agents-title { font-size: 38px; font-weight: 900; letter-spacing: -0.03em; color: #E5E7EB; margin: 0 0 12px; text-wrap: balance; background: linear-gradient(135deg, #E5E7EB, rgba(255,255,255,0.8)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      .agents-subtitle { font-size: 15px; line-height: 1.65; color: rgba(255,255,255,0.55); max-width: 70ch; margin: 0; }

      .agents-status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; max-width: 1200px; margin: 32px auto; padding: 0 24px; }

      .status-card { cursor: pointer; }
      .status-card-inner { border-radius: 18px; padding: 18px; border: 1px solid; display: flex; align-items: center; gap: 14px; transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1); box-shadow: 0 1px 3px rgba(0,0,0,0.5), 0 12px 40px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.08); backdrop-filter: blur(8px); }
      .status-card-inner:hover { box-shadow: 0 1px 3px rgba(0,0,0,0.5), 0 20px 60px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.12); }

      .status-card-icon-wrapper { flex-shrink: 0; }
      .status-card-icon { width: 44px; height: 44px; border-radius: 13px; display: flex; align-items: center; justify-content: center; transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1); }

      .status-card-text { flex: 1; }
      .status-card-label { font-family: var(--font-geist-mono), monospace; font-size: 10.5px; letter-spacing: 0.12em; color: rgba(255,255,255,0.42); margin-bottom: 6px; text-transform: uppercase; font-weight: 600; }
      .status-card-value { font-size: 24px; font-weight: 900; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }

      .status-card-live { position: relative; width: 12px; height: 12px; }
      .status-card-pulse { width: 12px; height: 12px; border-radius: 50%; position: absolute; top: 0; left: 0; }
      .status-card-pulse-ring { width: 12px; height: 12px; border-radius: 50%; position: absolute; top: 0; left: 0; border: 2px solid; }

      .agents-main { display: grid; grid-template-columns: 1fr 360px; gap: 24px; max-width: 1200px; margin: 36px auto; padding: 0 24px; }

      .agents-map-section, .agents-console-section { border-radius: 24px; border: 1px solid rgba(255,255,255,0.08); padding: 28px; background: rgba(255,255,255,0.03); box-shadow: 0 1px 3px rgba(0,0,0,0.5), 0 12px 40px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.08); backdrop-filter: blur(12px); }

      .agents-map-header, .agents-console-header { margin-bottom: 20px; }
      .agents-map-header h2, .agents-console-header h2 { font-size: 17px; font-weight: 800; letter-spacing: -0.01em; color: #E5E7EB; margin: 0 0 6px; }
      .agents-map-header p { font-size: 13px; color: rgba(255,255,255,0.45); margin: 0; }

      .agents-console-header { display: flex; justify-content: space-between; align-items: center; }
      .agents-console-pulse { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,0.65); }
      .agents-pulse-dot { width: 7px; height: 7px; background: #10b981; border-radius: 50%; animation: pulse 2s cubic-bezier(0.22, 1, 0.36, 1) infinite; box-shadow: 0 0 12px #10b981; }

      .company-map { height: 420px; display: flex; align-items: center; justify-content: center; }
      .company-map svg { filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.1)); }

      .agents-console-content { display: flex; flex-direction: column; gap: 10px; max-height: 360px; overflow-y: auto; }
      .agents-console-event { display: flex; flex-direction: column; gap: 8px; padding: 10px 12px; border-radius: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-left: 3px solid; transition: all 0.25s; }
      .agents-console-event:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.12); }
      .agents-console-event.priority-high { background: rgba(239, 68, 68, 0.05); }
      .agents-console-event.priority-normal { background: rgba(245, 158, 11, 0.04); }

      .agents-priority-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

      .agents-event-time { font-family: var(--font-geist-mono), monospace; font-size: 9.5px; color: rgba(255,255,255,0.38); font-weight: 500; }
      .agents-event-flow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .agents-event-badge { font-family: var(--font-geist-mono), monospace; font-size: 10.5px; font-weight: 800; color: #fff; padding: 3px 8px; border-radius: 7px; opacity: 0.9; }
      .agents-event-action { font-size: 12px; color: rgba(255,255,255,0.68); font-weight: 500; }

      .expanded-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 50; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.3s ease-out; }
      .expanded-modal { background: linear-gradient(135deg, rgba(5,6,10,0.95), rgba(5,6,10,0.98)); border-radius: 28px; border: 1px solid rgba(255,255,255,0.08); max-width: 920px; width: 92vw; max-height: 88vh; overflow-y: auto; position: relative; box-shadow: 0 25px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06); }

      .expanded-close { position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; width: 40px; height: 40px; cursor: pointer; color: rgba(255,255,255,0.65); z-index: 10; transition: all 0.25s; display: flex; align-items: center; justify-content: center; }
      .expanded-close:hover { background: rgba(255,255,255,0.15); color: #fff; border-color: rgba(255,255,255,0.2); }

      .expanded-header { padding: 32px; border-bottom: 1px solid rgba(255,255,255,0.07); border-radius: 28px 28px 0 0; display: flex; gap: 20px; align-items: flex-start; background: linear-gradient(135deg, rgba(99,102,241,0.08), transparent); }
      .expanded-dept-icon { width: 70px; height: 70px; border-radius: 18px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 900; font-size: 28px; flex-shrink: 0; box-shadow: 0 0 30px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.2); }
      .expanded-title { font-size: 26px; font-weight: 900; letter-spacing: -0.02em; color: #E5E7EB; margin: 0 0 6px; }
      .expanded-subtitle { font-size: 14px; color: rgba(255,255,255,0.55); margin: 0; }

      .expanded-thoughts { padding: 28px 32px; border-bottom: 1px solid rgba(255,255,255,0.07); }
      .expanded-thoughts-label { font-family: var(--font-geist-mono), monospace; font-size: 10.5px; letter-spacing: 0.12em; color: rgba(255,255,255,0.42); margin-bottom: 14px; text-transform: uppercase; font-weight: 700; }
      .expanded-thoughts-list { display: flex; flex-direction: column; gap: 10px; }
      .expanded-thought { font-size: 13.5px; line-height: 1.7; color: rgba(255,255,255,0.75); }

      .expanded-agents { padding: 32px; }
      .expanded-agents-label { font-family: var(--font-geist-mono), monospace; font-size: 10.5px; letter-spacing: 0.12em; color: rgba(255,255,255,0.42); margin-bottom: 16px; text-transform: uppercase; font-weight: 700; }
      .expanded-agents-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 14px; }

      .agent-mini-os { border-radius: 16px; padding: 16px; border: 1px solid; display: flex; flex-direction: column; gap: 12px; transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1); background: rgba(255,255,255,0.02); }
      .agent-mini-os:hover { transform: translateY(-3px); border-color: rgba(255,255,255,0.18); background: rgba(255,255,255,0.05); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }

      .agent-mini-header { display: flex; gap: 12px; align-items: flex-start; }
      .agent-mini-avatar { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 900; font-size: 13px; flex-shrink: 0; box-shadow: 0 0 16px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.15); }
      .agent-mini-info { flex: 1; min-width: 0; }
      .agent-mini-name { font-size: 13px; font-weight: 800; color: rgba(255,255,255,0.92); letter-spacing: -0.01em; }
      .agent-mini-role { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 2px; }

      .agent-mini-metrics { display: flex; flex-direction: column; gap: 8px; }
      .agent-mini-metric { display: flex; align-items: center; gap: 10px; }
      .agent-mini-metric span { font-size: 10.5px; color: rgba(255,255,255,0.45); min-width: 55px; font-weight: 600; }
      .agent-mini-bar { flex: 1; height: 5px; background: rgba(255,255,255,0.1); border-radius: 2.5px; origin: left; overflow: hidden; }

      .agent-mini-status { display: flex; gap: 8px; }
      .agent-status-badge { font-size: 10.5px; font-weight: 700; padding: 5px 10px; border-radius: 9px; display: flex; align-items: center; gap: 5px; letter-spacing: 0.02em; }
      .agent-status-dot { width: 5px; height: 5px; border-radius: 50%; animation: pulse 1.5s cubic-bezier(0.22, 1, 0.36, 1) infinite; }

      .agents-timeline-section { max-width: 1200px; margin: 48px auto; padding: 0 24px; }
      .agents-timeline-section h2 { font-size: 17px; font-weight: 800; letter-spacing: -0.01em; color: #E5E7EB; margin: 0 0 20px; }

      .timeline-container { display: flex; align-items: center; gap: 8px; overflow-x: auto; padding: 28px 20px; border-radius: 22px; background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(255,255,255,0.02)); border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 1px 3px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06); backdrop-filter: blur(12px); }
      .timeline-item { display: flex; align-items: center; gap: 10px; flex-shrink: 0; min-width: max-content; padding: 0 4px; }
      .timeline-dot { width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0; box-shadow: 0 0 20px currentColor; cursor: pointer; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.08); border: 1.5px solid rgba(255,255,255,0.1); transition: all 0.3s; }
      .timeline-dot:hover { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.25); }
      .timeline-dot-inner { font-size: 18px; line-height: 1; }
      .timeline-content { display: flex; flex-direction: column; gap: 4px; cursor: pointer; transition: all 0.3s; }
      .timeline-agent { font-size: 12.5px; font-weight: 800; letter-spacing: -0.01em; }
      .timeline-action { font-size: 11px; color: rgba(255,255,255,0.6); font-weight: 500; }
      .timeline-arrow { margin: 0 -4px; color: rgba(255,255,255,0.3); flex-shrink: 0; font-size: 16px; }

      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }

      @media (max-width: 1000px) {
        .agents-main { grid-template-columns: 1fr; }
        .expanded-agents-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
      }

      @media (prefers-reduced-motion: reduce) {
        * { animation: none !important; transition: none !important; }
      }
    `}</style>
  );
}
