"use client";

import { useState } from "react";

const FAQ = [
  {
    q: "Это реальный AI или просто шаблонные ответы?",
    a: "Это реальные AI-агенты на базе передовых языковых моделей. Каждый из 8 экспертов анализирует именно ваш бизнес, а не подставляет вас в шаблон. CEO синтезирует результаты всей команды в единый отчёт.",
  },
  {
    q: "Насколько это лучше обычного ChatGPT?",
    a: "Принципиально. Вместо одного ответа вы получаете 8 параллельных специализированных анализов. CFO считает финансовую модель, CMO строит go-to-market, Legal Advisor проверяет риски — всё одновременно и без ваших дополнительных запросов.",
  },
  {
    q: "Могу ли я доверять финансовым и юридическим рекомендациям?",
    a: "Отчёты дают вам стратегическую базу и ориентиры, но не заменяют профессиональных консультантов. Legal Advisor не является юридической консультацией. Для критических решений рекомендуем верифицировать данные у профессионалов.",
  },
  {
    q: "Сколько времени занимает генерация отчёта?",
    a: "Обычно 2-5 минут. Все 8 агентов работают параллельно, CEO объединяет результаты и вы получаете полный структурированный отчёт.",
  },
  {
    q: "Что входит в бесплатный тариф?",
    a: "3 полных анализа в месяц, все 8 AI-экспертов, финансовые прогнозы, анализ рисков, рыночный анализ и резюме стратегии. Без кредитной карты.",
  },
  {
    q: "Можно ли экспортировать отчёты?",
    a: "Да, на Pro и Business тарифах доступен экспорт в PDF и Google Docs. На Free — только просмотр онлайн.",
  },
  {
    q: "Мои данные в безопасности?",
    a: "Данные вашего бизнеса используются только для генерации вашего отчёта и не передаются третьим лицам и не используются для обучения моделей. Все данные шифруются при передаче и хранении.",
  },
  {
    q: "Есть ли скидки для стартапов и студентов?",
    a: "Да. Для верифицированных стартапов из акселераторов — скидка 50%. Для студентов — бесплатный Pro-доступ на 3 месяца. Напишите нам на support@apexai.com.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-28 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] mb-6">
            <span className="text-xs text-white/50 font-medium tracking-wide uppercase">FAQ</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-3 tracking-tight">Часто задаваемые вопросы</h2>
          <p className="text-white/35 text-base">Всё, что нужно знать перед началом работы.</p>
        </div>

        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <div
              key={i}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                open === i ? "border-white/[0.1] bg-white/[0.04]" : "border-white/[0.06] bg-white/[0.02]"
              }`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 p-4 text-left"
              >
                <span className={`text-sm font-medium transition-colors ${open === i ? "text-white" : "text-white/60"}`}>
                  {item.q}
                </span>
                <svg
                  className={`size-4 text-white/30 flex-shrink-0 transition-transform duration-200 ${open === i ? "rotate-45" : ""}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              {open === i && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-white/45 leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-white/30 mb-3">Не нашли ответа?</p>
          <a
            href="mailto:support@apexai.com"
            className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            support@apexai.com
          </a>
        </div>
      </div>
    </section>
  );
}
