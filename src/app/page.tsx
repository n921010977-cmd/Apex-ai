import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { LiveDemo } from "@/components/landing/LiveDemo";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { Footer } from "@/components/landing/Footer";
import { PricingCards } from "@/components/landing/PricingCards";
import { StructuredData } from "@/components/StructuredData";

import dynamic from "next/dynamic";

// Секции ниже первого экрана грузим отдельными чанками: первая отрисовка
// лендинга не должна ждать JS того, что пользователь ещё не проскроллил.
const ExecutivesSection = dynamic(() => import("@/components/landing/ExecutivesSection").then(m => m.ExecutivesSection));
const HowAgentsWork = dynamic(() => import("@/components/landing/HowAgentsWork").then(m => m.HowAgentsWork));
const WhyNotChatGPT = dynamic(() => import("@/components/landing/WhyNotChatGPT").then(m => m.WhyNotChatGPT));
const FeaturesSection = dynamic(() => import("@/components/landing/FeaturesSection").then(m => m.FeaturesSection));
const ProofSection = dynamic(() => import("@/components/landing/ProofSection").then(m => m.ProofSection));
const FaqSection = dynamic(() => import("@/components/landing/FaqSection").then(m => m.FaqSection));
const CtaBanner = dynamic(() => import("@/components/landing/CtaBanner").then(m => m.CtaBanner));

export default function LandingPage() {
  return (
    <main className="relative">
      <StructuredData />
      <ScrollProgress />
      <Navbar />
      <HeroSection />
      <LiveDemo />
      <HowItWorksSection />
      <ExecutivesSection />
      <HowAgentsWork />
      <WhyNotChatGPT />
      <FeaturesSection />
      <ProofSection />
      <div id="pricing"><PricingCards /></div>
      <FaqSection />
      <CtaBanner />
      <Footer />
    </main>
  );
}
