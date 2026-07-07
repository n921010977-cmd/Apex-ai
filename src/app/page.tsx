import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ExecutivesSection } from "@/components/landing/ExecutivesSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { CtaBanner } from "@/components/landing/CtaBanner";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { Footer } from "@/components/landing/Footer";
import { ApexChatWidget } from "@/components/ApexChatWidget";

export default function LandingPage() {
  return (
    <main className="relative">
      <ScrollProgress />
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <ExecutivesSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection />
      <FaqSection />
      <CtaBanner />
      <Footer />
      <ApexChatWidget />
    </main>
  );
}
