"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";

const FAQS = [
  { q: "Как работает AI Executive Board?", a: "Наш AI анализирует ваш бизнес-план с точки зрения 5 ролей: CEO, CFO, CMO, COO и CTO. Каждый агент специализируется на своей области и даёт конкретные рекомендации." },
  { q: "Сколько проектов я могу создать?", a: "На плане Starter — до 3 проектов. На Pro — неограниченно. Вы можете обновить план в любой момент." },
  { q: "Как долго длится анализ?", a: "Обычно 2-5 минут. Сложные проекты с большим количеством деталей могут занять до 10 минут." },
  { q: "Могу ли я экспортировать отчёты?", a: "Да, все готовые отчёты можно скачать в формате PDF. Функция доступна на всех тарифах." },
  { q: "Как изменить детали проекта?", a: "Откройте проект, нажмите 'Редактировать' и внесите изменения. AI пересчитает стратегию автоматически." },
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;
    setSent(true);
    setMessage("");
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Помощь и поддержка</h1>
        <p className="text-sm text-white/35">Ответы на вопросы и связь с командой</p>
      </div>

      {/* Быстрые ссылки */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Документация", desc: "Гайды и туториалы", icon: <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
          { label: "Видеоуроки", desc: "Обучающие видео", icon: <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg> },
          { label: "Чат поддержки", desc: "Ответим за 2 часа", icon: <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
        ].map((item) => (
          <Card key={item.label} hover className="cursor-pointer">
            <CardContent className="p-4 text-center">
              <div className="size-10 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-400 mx-auto mb-2">{item.icon}</div>
              <div className="text-xs font-semibold text-white">{item.label}</div>
              <div className="text-[10px] text-white/35 mt-0.5">{item.desc}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Часто задаваемые вопросы</h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
                >
                  <span className="text-xs font-medium text-white/80">{faq.q}</span>
                  <svg
                    className={`size-4 text-white/30 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-xs text-white/50 leading-relaxed border-t border-white/[0.06] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Написать нам */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Написать в поддержку</h2>
          {sent ? (
            <div className="text-center py-8">
              <div className="size-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                <svg className="size-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <p className="text-sm text-white/60">Сообщение отправлено! Ответим в течение 2 часов.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Тема</label>
                <select className="w-full h-9 px-3 text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/70 outline-none focus:border-violet-500/50 transition-colors">
                  <option value="">Выберите тему</option>
                  <option>Технический вопрос</option>
                  <option>Вопрос по тарифу</option>
                  <option>Ошибка в отчёте</option>
                  <option>Другое</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Сообщение</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Опишите вашу проблему или вопрос..."
                  className="w-full px-3 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-colors resize-none"
                />
              </div>
              <button
                onClick={handleSend}
                className="w-full h-9 text-xs font-medium bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-500 hover:to-blue-500 transition-all"
              >
                Отправить сообщение
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
