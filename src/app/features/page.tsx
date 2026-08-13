import type { Metadata } from "next";
import Link from "next/link";
import { Users, FileText, Presentation, Target, Bot, Globe, Flag, MessageSquare } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

// SEO-страница по РЕАЛЬНЫМ возможностям продукта. Каждый пункт ниже —
// работающий инструмент в кабинете, а не обещание из будущего роадмапа.

export const metadata: Metadata = {
  title: "Возможности",
  description: "Что умеет Vertlix AI: совет из 20 AI-директоров, стратегия, питч-дек с экспортом в PDF, план 30/60/90, фокус недели, библиотека агентов и AI-чат.",
  alternates: { canonical: "/features" },
};

const FEATURES = [
  { icon: Users,         title: "Совет из 20 AI-директоров",  what: "Заседание, где CEO, CFO, CMO, COO, CTO, юрист и аналитик разбирают ваш проект каждый со своей позиции.", benefit: "Видите риски и возможности, которые в одиночку не заметны." },
  { icon: FileText,      title: "Генерация стратегии",         what: "Позиционирование, рынок, конкуренты, модель монетизации и приоритеты — цельным документом.",           benefit: "Есть с чем идти к команде, партнёрам и инвестору." },
  { icon: Presentation,  title: "Питч-дек для инвестора",      what: "Слайды по классической структуре: выбор языка и стиля подачи, правка прямо в браузере, экспорт в PDF.", benefit: "Презентация за вечер вместо недели вёрстки." },
  { icon: Target,        title: "Студия «Цели и план»",        what: "Цель раскладывается на план 30/60/90 с конкретными шагами и чек-листом выполнения.",                    benefit: "Понятно, что делать в ближайший понедельник." },
  { icon: Flag,          title: "Фокус недели",                what: "Трекер целей выбирает, на чём сосредоточиться на этой неделе, и показывает скорость движения.",          benefit: "Задачи не расползаются, прогресс виден." },
  { icon: Bot,           title: "Библиотека AI-агентов",       what: "Больше 20 ролей — от growth-хакера до налогового специалиста; можно завести собственного агента.",       benefit: "Спрашиваете профильного специалиста, а не универсальный чат." },
  { icon: MessageSquare, title: "AI-чат и разбор проекта",     what: "Диалог с сохранением контекста, заметки с пересказом, история запросов.",                               benefit: "Работа не теряется между сессиями." },
  { icon: Globe,         title: "Свежие данные с рынка",       what: "На тарифах Pro и Max ответы дополняются актуальной информацией из веб-поиска.",                          benefit: "Меньше устаревших выводов." },
];

export default function FeaturesPage() {
  return (
    <main style={{ minHeight: "100dvh", background: "#05060A", color: "#fff" }}>
      <Navbar />
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "120px 24px 80px" }}>
        <h1 style={{ fontSize: "clamp(30px,5vw,48px)", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 14px", textWrap: "balance" }}>
          Возможности Vertlix AI
        </h1>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)", maxWidth: 640, lineHeight: 1.65, margin: "0 0 48px" }}>
          Восемь инструментов, которые уже работают в кабинете. Ничего из списка не «в разработке».
        </p>

        <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 14 }}>
          {FEATURES.map(f => (
            <section key={f.title} style={{ borderRadius: 16, padding: "22px 24px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}>
                <f.icon size={18} color="#a5b4fc" />
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.01em" }}>{f.title}</h2>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "rgba(255,255,255,0.5)", margin: "0 0 10px" }}>{f.what}</p>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: "#a5b4fc", fontWeight: 600, margin: 0 }}>{f.benefit}</p>
            </section>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 40 }}>
          <Link href="/register" style={{ display: "inline-flex", alignItems: "center", height: 50, padding: "0 28px", borderRadius: 13, fontSize: 15, fontWeight: 700, color: "#fff", textDecoration: "none", background: "linear-gradient(135deg,#6366f1,#4f46e5)", boxShadow: "0 8px 24px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.16)" }}>
            Начать бесплатно
          </Link>
          <Link href="/pricing" style={{ display: "inline-flex", alignItems: "center", height: 50, padding: "0 26px", borderRadius: 13, fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.75)", textDecoration: "none", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            Посмотреть тарифы
          </Link>
          <Link href="/use-cases" style={{ display: "inline-flex", alignItems: "center", height: 50, padding: "0 26px", borderRadius: 13, fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.75)", textDecoration: "none", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            Сценарии использования
          </Link>
        </div>
      </div>
      <Footer />
      <style>{`@media (max-width: 820px){ .features-grid { grid-template-columns: 1fr !important; } }`}</style>
    </main>
  );
}
