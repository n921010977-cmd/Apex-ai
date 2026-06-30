import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ExecutivesSection } from "@/components/landing/ExecutivesSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="relative">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <ExecutivesSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection />
      <FaqSection />

      {/* CTA Banner */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-900/20 via-blue-900/10 to-violet-900/20" />
        <div className="absolute inset-0 grid-pattern opacity-[0.06]" />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 mb-6">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-violet-300/80 font-medium">Бесплатно · Без карты</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            Готовы построить свой бизнес?
          </h2>
          <p className="text-lg text-white/40 mb-8 max-w-xl mx-auto">
            Присоединяйтесь к тысячам основателей, которые получают стратегии мирового уровня за считанные минуты.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/register"
              className="inline-flex items-center gap-3 h-14 px-8 text-base font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-2xl hover:from-violet-500 hover:to-blue-500 transition-all duration-200 hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-0.5"
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Начать бесплатно
            </a>
            <a
              href="/login"
              className="inline-flex items-center gap-2 h-14 px-8 text-base font-medium text-white/50 border border-white/[0.08] rounded-2xl hover:border-white/[0.15] hover:text-white/80 transition-all"
            >
              Войти в аккаунт →
            </a>
          </div>
          <p className="mt-4 text-sm text-white/20">3 отчёта бесплатно · Без кредитной карты · Отмена в любой момент</p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
