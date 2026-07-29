import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { LiveDemo } from "@/components/landing/LiveDemo";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ExecutivesSection } from "@/components/landing/ExecutivesSection";
import { HowAgentsWork } from "@/components/landing/HowAgentsWork";
import { WhyNotChatGPT } from "@/components/landing/WhyNotChatGPT";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { CtaBanner } from "@/components/landing/CtaBanner";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { Footer } from "@/components/landing/Footer";
import { PricingCards } from "@/components/landing/PricingCards";

export default function LandingPage() {
  return (
    <main className="relative">
      <ScrollProgress />
      <Navbar />
      <HeroSection />
      <LiveDemo />
      <HowItWorksSection />
      <ExecutivesSection />
      <HowAgentsWork />
      <WhyNotChatGPT />
      <FeaturesSection />
      <TestimonialsSection />
      <div id="pricing"><PricingCards /></div>
      <FaqSection />
      <CtaBanner />
      <Footer />
    </main>
  );
}
