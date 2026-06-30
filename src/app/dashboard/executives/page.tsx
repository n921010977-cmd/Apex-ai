"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const EXECUTIVES = [
  {
    role: "CEO",
    title: "Исполнительный директор",
    name: "Sophia Reeves",
    color: "#7c3aed",
    gradient: "from-violet-600 to-purple-700",
    expertise: ["Стратегия роста", "Видение продукта", "Инвесторы"],
    bio: "Координирует всю команду, синтезирует инсайты в единую стратегию и формирует финальное решение. 15+ лет опыта масштабирования стартапов от идеи до Series B.",
    insights: [
      "Фокусируйтесь на одном ключевом сегменте в первые 12 месяцев",
      "Привлекайте инвесторов только при наличии чётких метрик роста",
      "Командная культура важнее любой стратегии — нанимайте тщательно",
    ],
    completedProjects: 3,
    avgScore: 87,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  },
  {
    role: "CFO",
    title: "Финансовый директор",
    name: "Marcus Chen",
    color: "#3b82f6",
    gradient: "from-blue-600 to-cyan-700",
    expertise: ["Финансовое моделирование", "Unit-экономика", "Капитал"],
    bio: "Строит финансовые модели, прогнозы выручки, анализирует затраты и инвестиционные требования. Помог 20+ компаниям привлечь финансирование.",
    insights: [
      "LTV/CAC > 3:1 — минимальный порог для масштабирования",
      "Runway минимум 18 месяцев перед следующим раундом",
      "Gross margin с первого дня — ключевой сигнал для инвесторов",
    ],
    completedProjects: 3,
    avgScore: 91,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  },
  {
    role: "CMO",
    title: "Директор по маркетингу",
    name: "Elena Torres",
    color: "#10b981",
    gradient: "from-emerald-600 to-teal-700",
    expertise: ["Go-to-market", "Brand building", "Performance"],
    bio: "Разрабатывает позиционирование бренда, стратегию выхода на рынок, воронки привлечения и контент-план. Вывела 10+ продуктов от 0 до 1M пользователей.",
    insights: [
      "Начинайте с 1-2 каналов привлечения, не распыляйтесь",
      "Контент-маркетинг даёт лучший ROI в долгосрочной перспективе",
      "NPS и word-of-mouth — самые дешёвые источники роста",
    ],
    completedProjects: 3,
    avgScore: 84,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  },
  {
    role: "COO",
    title: "Операционный директор",
    name: "James Wright",
    color: "#f59e0b",
    gradient: "from-amber-500 to-orange-600",
    expertise: ["Операционная эффективность", "Процессы", "Масштабирование"],
    bio: "Создаёт операционный роадмап, план запуска, дизайн процессов и структуру команды. Строил операционные системы для компаний от 5 до 500 сотрудников.",
    insights: [
      "Документируйте процессы с первого дня — масштабирование без них невозможно",
      "Автоматизируйте всё, что повторяется более 3 раз в неделю",
      "OKR работают только если команда понимает зачем они нужны",
    ],
    completedProjects: 3,
    avgScore: 79,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
  },
  {
    role: "Business Analyst",
    title: "Аналитик рынка",
    name: "Priya Sharma",
    color: "#f97316",
    gradient: "from-orange-500 to-amber-600",
    expertise: ["Исследование рынка", "SWOT-анализ", "Конкуренты"],
    bio: "Глубокий анализ рынка, конкурентная разведка, сегментация аудитории и маппинг возможностей. Специализируется на поиске незанятых ниш и голубых океанов.",
    insights: [
      "Изучите 10 конкурентов перед запуском — найдите их слабые места",
      "TAM > $1B — минимальный рынок для привлечения венчурных инвестиций",
      "Один детальный customer interview стоит 100 опросов",
    ],
    completedProjects: 3,
    avgScore: 85,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  },
  {
    role: "CTO",
    title: "Технический директор",
    name: "Aiden Park",
    color: "#ec4899",
    gradient: "from-pink-600 to-rose-700",
    expertise: ["Архитектура систем", "AI/ML", "DevOps"],
    bio: "Рекомендует оптимальный технологический стек, дизайн инфраструктуры и технический роадмап. 15 лет строил масштабируемые системы для продуктов с миллионами пользователей.",
    insights: [
      "MVP должен быть ugly — красота приходит с пониманием пользователей",
      "Технический долг убивает стартапы — рефакторьте постоянно",
      "Безопасность данных с первого дня — потом будет в 10 раз дороже",
    ],
    completedProjects: 3,
    avgScore: 90,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  },
  {
    role: "Sales Director",
    title: "Директор по продажам",
    name: "Carlos Mendes",
    color: "#6366f1",
    gradient: "from-indigo-600 to-violet-700",
    expertise: ["Sales funnel", "Pricing", "Lead generation"],
    bio: "Разрабатывает воронки продаж, модели ценообразования, стратегии лидогенерации и системы удержания клиентов. Закрыл сделки на суммарно $50M+.",
    insights: [
      "Первые 10 продаж делайте лично — это ваш лучший источник фидбека",
      "Цена слишком низкая — ошибка большинства стартапов на старте",
      "Follow-up решает: 80% продаж закрываются после 5-го контакта",
    ],
    completedProjects: 3,
    avgScore: 83,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  },
  {
    role: "Legal Advisor",
    title: "Юридический советник",
    name: "Diana Volkov",
    color: "#64748b",
    gradient: "from-slate-600 to-gray-700",
    expertise: ["Структура бизнеса", "IP-стратегия", "Compliance"],
    bio: "Рекомендации по структуре бизнеса, защите интеллектуальной собственности и соответствию требованиям регуляторов. Не является юридической консультацией.",
    insights: [
      "Выбор юрисдикции важен: Delaware C-Corp — стандарт для венчурных инвестиций",
      "Зарегистрируйте торговую марку до запуска, не после",
      "NDA имеют смысл только при раскрытии реально конфиденциальных данных",
    ],
    completedProjects: 3,
    avgScore: 81,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  },
];

export default function ExecutivesPage() {
  const [active, setActive] = useState(EXECUTIVES[0]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-0.5">Исполнительный совет</h1>
        <p className="text-sm text-white/35">8 AI-экспертов, каждый отвечает за свою область анализа</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Список агентов */}
        <div className="space-y-1.5">
          {EXECUTIVES.map((exec) => {
            const isActive = active.role === exec.role;
            return (
              <button
                key={exec.role}
                onClick={() => setActive(exec)}
                className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all duration-150 ${
                  isActive
                    ? "border-violet-500/30 bg-violet-600/8"
                    : "border-white/[0.05] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="size-8 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                    style={{ background: `${exec.color}18`, border: `1px solid ${exec.color}30` }}
                  >
                    <span style={{ color: exec.color }}>{exec.role[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[12px] font-semibold text-white">{exec.role}</span>
                      <span className="size-1.5 rounded-full bg-emerald-400/70" />
                    </div>
                    <div className="text-[10px] text-white/30 truncate">{exec.title}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold" style={{ color: exec.color }}>{exec.avgScore}</div>
                    <div className="text-[9px] text-white/20">балл</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Детали */}
        <div className="xl:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-5">
              {/* Header */}
              <div className="flex items-start gap-4 mb-5">
                <div
                  className={`size-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 bg-gradient-to-br ${active.gradient}`}
                  style={{ boxShadow: `0 8px 24px ${active.color}35` }}
                >
                  {active.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-base font-bold text-white">{active.name}</h2>
                    <Badge variant="success" dot>Активен</Badge>
                  </div>
                  <p className="text-xs text-white/40 mb-2">{active.title}</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {active.expertise.map((e) => (
                      <span key={e} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-white/40 border border-white/[0.06]">{e}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-3xl font-bold" style={{ color: active.color }}>{active.avgScore}</div>
                  <div className="text-[10px] text-white/30">средний балл</div>
                  <div className="text-[10px] text-white/20 mt-0.5">{active.completedProjects} проекта</div>
                </div>
              </div>

              <p className="text-[13px] text-white/50 leading-relaxed mb-5">{active.bio}</p>

              {/* Insights */}
              <div className="rounded-xl bg-white/[0.025] border border-white/[0.05] p-4">
                <h3 className="text-[10px] font-semibold text-white/35 uppercase tracking-widest mb-3">Ключевые инсайты</h3>
                <div className="space-y-3">
                  {active.insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        className="size-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5"
                        style={{ background: `${active.color}20`, color: active.color }}
                      >
                        {i + 1}
                      </div>
                      <p className="text-[12px] text-white/55 leading-relaxed">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Завершено проектов", value: active.completedProjects.toString() },
              { label: "Средний балл", value: active.avgScore.toString() },
              { label: "Статус", value: "Активен" },
            ].map((s) => (
              <Card key={s.label} className="p-4">
                <CardContent className="p-0 text-center">
                  <div className="text-xl font-bold text-white mb-0.5">{s.value}</div>
                  <div className="text-[10px] text-white/30">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Link
            href="/dashboard/new"
            className="w-full h-9 text-[13px] font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-500 hover:to-blue-500 transition-all flex items-center justify-center gap-2"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            Брифовать совет по новому проекту
          </Link>
        </div>
      </div>
    </div>
  );
}
