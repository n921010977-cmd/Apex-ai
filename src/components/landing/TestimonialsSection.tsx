const TESTIMONIALS = [
  {
    quote: "Мы потратили $30K на консалтинг, прежде чем нашли Apex AI. За один вечер получили стратегию лучшего качества.",
    name: "Dmitri Volkov",
    role: "CEO, TechFlow SaaS",
    avatar: "D",
    color: "#7c3aed",
    rating: 5,
  },
  {
    quote: "Business Analyst нашёл нишу, которую мы пропустили. Мы изменили позиционирование и выросли в 3 раза за квартал.",
    name: "Sarah Kim",
    role: "Founder, MarketNest",
    avatar: "S",
    color: "#3b82f6",
    rating: 5,
  },
  {
    quote: "CFO просчитал точку безубыточности точнее, чем наш финансовый советник за $500/час. Впечатляюще.",
    name: "Marco Rossi",
    role: "Co-founder, InvoiceAI",
    avatar: "M",
    color: "#10b981",
    rating: 5,
  },
  {
    quote: "Запустил ресторанный бизнес по стратегии от Apex AI. Вышел в плюс на 4 месяца раньше прогноза.",
    name: "Anna Petrova",
    role: "Owner, Bistro Verde",
    avatar: "A",
    color: "#f59e0b",
    rating: 5,
  },
  {
    quote: "COO прописал операционный план так детально, что я просто следовал инструкциям. Теперь у меня команда 12 человек.",
    name: "Liam Carter",
    role: "Founder, OpsTech",
    avatar: "L",
    color: "#ec4899",
    rating: 5,
  },
  {
    quote: "Legal Advisor предупредил о рисках корпоративной структуры. Сэкономил нам тысячи на юридических ошибках.",
    name: "Yuna Park",
    role: "CEO, LegalFlow",
    avatar: "Y",
    color: "#6366f1",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative py-28 px-6 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-[0.03]" />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] mb-6">
            <span className="text-xs text-white/50 font-medium tracking-wide uppercase">Отзывы</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            Тысячи основателей уже{" "}
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              внутри
            </span>
          </h2>
          <p className="text-lg text-white/35 max-w-xl mx-auto">
            Реальные результаты от реальных предпринимателей.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="relative p-5 rounded-2xl bg-white/[0.025] border border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.04] transition-all duration-300 group"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <svg key={j} className="size-3.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>

              <p className="text-[13px] text-white/60 leading-relaxed mb-5">"{t.quote}"</p>

              <div className="flex items-center gap-3">
                <div
                  className="size-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}88)` }}
                >
                  {t.avatar}
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-white">{t.name}</div>
                  <div className="text-[10px] text-white/30">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Social proof bar */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-center">
          {[
            { value: "2,400+", label: "Основателей" },
            { value: "8,900+", label: "Стратегий создано" },
            { value: "4.9 / 5", label: "Средняя оценка" },
            { value: "$140M+", label: "Прогнозируемая выручка" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-white mb-0.5">{s.value}</div>
              <div className="text-xs text-white/30">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
