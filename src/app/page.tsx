import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ExecutivesSection } from "@/components/landing/ExecutivesSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="relative">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <ExecutivesSection />
      <FeaturesSection />
      <PricingSection />

      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-900/20 via-blue-900/10 to-violet-900/20" />
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            Ready to Build Your Empire?
          </h2>
          <p className="text-lg text-white/40 mb-8">
            Join thousands of founders who replaced expensive consultants with their AI Executive Board.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-3 h-16 px-10 text-lg font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-2xl hover:from-violet-500 hover:to-blue-500 transition-all duration-200 hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-1"
          >
            <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            Start Your Free Strategy
          </a>
          <p className="mt-4 text-sm text-white/25">No credit card required · 3 free reports per month</p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
