import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

// Сценарии описаны через инструменты, которые реально есть в продукте.
// Никаких кейсов «клиент вырос в 3 раза» — таких данных у нас нет.

export const metadata: Metadata = {
  title: "Сценарии использования",
  description: "Как предприниматели используют Vertlix AI: проверка идеи, подготовка к инвестору, план запуска, разбор просевших метрик и еженедельная приоритизация.",
  alternates: { canonical: "/use-cases" },
};

const CASES = [
  {
    who: "Проверяю идею перед стартом",
    pain: "Непонятно, стоит ли вкладывать деньги и полгода жизни.",
    how: ["Описываете идею в разборе проекта", "Совет директоров даёт вердикт с рисками", "Стратегия показывает рынок и модель заработка"],
    tools: "Разбор проекта · Совет директоров · Стратегия",
  },
  {
    who: "Готовлюсь к разговору с инвестором",
    pain: "Нужна презентация и внятные ответы на неудобные вопросы.",
    how: ["Собираете питч-дек с выбором стиля подачи", "Правите слайды прямо в браузере", "Выгружаете в PDF и отправляете"],
    tools: "Питч-дек · Экспорт в PDF",
  },
  {
    who: "Запускаю продукт и теряюсь в задачах",
    pain: "Список дел бесконечный, а что делать в понедельник — неясно.",
    how: ["Ставите цель в студии планирования", "Получаете план 30/60/90 с шагами", "Каждую неделю берёте фокус недели"],
    tools: "Цели и план · Фокус недели",
  },
  {
    who: "Разбираюсь, почему просели метрики",
    pain: "Цифры падают, гипотез много, проверять нечем.",
    how: ["Спрашиваете профильного агента — маркетолога, финансиста, аналитика", "Сравниваете версии в совете директоров", "Фиксируете решение в плане"],
    tools: "Библиотека агентов · Совет директоров",
  },
];

export default function UseCasesPage() {
  return (
    <main style={{ minHeight: "100dvh", background: "#05060A", color: "#fff" }}>
      <Navbar />
      <div style={{ maxWidth: 940, margin: "0 auto", padding: "120px 24px 80px" }}>
        <h1 style={{ fontSize: "clamp(30px,5vw,48px)", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 14px", textWrap: "balance" }}>
          Когда Vertlix AI действительно помогает
        </h1>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)", maxWidth: 620, lineHeight: 1.65, margin: "0 0 48px" }}>
          Четыре ситуации, ради которых продукт и делался. В каждой — какие инструменты нажимать.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {CASES.map(c => (
            <section key={c.who} style={{ borderRadius: 16, padding: "24px 26px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h2 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.01em" }}>{c.who}</h2>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", margin: "0 0 16px", lineHeight: 1.6 }}>{c.pain}</p>
              <ol style={{ margin: "0 0 16px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {c.how.map((step, i) => (
                  <li key={step} style={{ display: "flex", gap: 11, alignItems: "flex-start", fontSize: 13.5, color: "rgba(255,255,255,0.72)", lineHeight: 1.5 }}>
                    <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 6, background: "rgba(99,102,241,0.14)", border: "1px solid rgba(99,102,241,0.28)", color: "#a5b4fc", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", letterSpacing: "0.02em" }}>{c.tools}</div>
            </section>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 40 }}>
          <Link href="/register" style={{ display: "inline-flex", alignItems: "center", height: 50, padding: "0 28px", borderRadius: 13, fontSize: 15, fontWeight: 700, color: "#fff", textDecoration: "none", background: "linear-gradient(135deg,#6366f1,#4f46e5)", boxShadow: "0 8px 24px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.16)" }}>
            Попробовать бесплатно
          </Link>
          <Link href="/features" style={{ display: "inline-flex", alignItems: "center", height: 50, padding: "0 26px", borderRadius: 13, fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.75)", textDecoration: "none", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            Все возможности
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  );
}
