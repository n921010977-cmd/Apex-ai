import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-500" />
            <span className="text-xl font-bold text-white">Apex AI</span>
          </div>
          <nav className="hidden gap-6 md:flex">
            <a href="#" className="text-sm text-slate-300 hover:text-white transition-colors">Возможности</a>
            <a href="#" className="text-sm text-slate-300 hover:text-white transition-colors">Цены</a>
            <a href="#" className="text-sm text-slate-300 hover:text-white transition-colors">Документация</a>
          </nav>
          <div className="flex gap-3">
            <Button variant="ghost" className="text-white hover:bg-white/10">Войти</Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">Начать</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 py-24 text-center">
        <Badge variant="secondary" className="mb-6 bg-purple-500/20 text-purple-300 border-purple-500/30">
          Next.js 15 + TypeScript + Tailwind + shadcn/ui
        </Badge>
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-white md:text-7xl">
          Добро пожаловать в{" "}
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Apex AI
          </span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-300">
          Современная платформа на базе искусственного интеллекта. Построена с использованием новейших технологий для максимальной производительности.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8">
            Начать бесплатно
          </Button>
          <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
            Смотреть демо
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold text-white">Ключевые возможности</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Next.js 15",
              description: "App Router, React Server Components, Turbopack — всё готово к работе.",
              badge: "Фреймворк",
            },
            {
              title: "TypeScript",
              description: "Полная типизация кода для надёжной разработки без ошибок.",
              badge: "Типизация",
            },
            {
              title: "Tailwind CSS",
              description: "Utility-first подход для быстрого и гибкого создания интерфейсов.",
              badge: "Стили",
            },
            {
              title: "shadcn/ui",
              description: "Готовые доступные компоненты, легко настраиваемые под ваш дизайн.",
              badge: "Компоненты",
            },
            {
              title: "ESLint",
              description: "Статический анализ кода с правилами Next.js и TypeScript.",
              badge: "Качество",
            },
            {
              title: "Production Ready",
              description: "Оптимизировано для деплоя: Image Optimization, Font Optimization и многое другое.",
              badge: "Деплой",
            },
          ].map((feature) => (
            <Card key={feature.title} className="border-white/10 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 transition-colors">
              <CardHeader>
                <Badge variant="outline" className="w-fit border-purple-500/50 text-purple-300 text-xs mb-2">
                  {feature.badge}
                </Badge>
                <CardTitle className="text-white">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-400">{feature.description}</CardDescription>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 p-0">
                  Подробнее →
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center">
        <p className="text-sm text-slate-500">
          © 2025 Apex AI. Построено с Next.js 15, TypeScript, Tailwind CSS и shadcn/ui.
        </p>
      </footer>
    </main>
  )
}
