import { useState } from "react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { CTASection } from "@/components/landing/CTASection";
import { ContactSection } from "@/components/landing/ContactSection";
import { FooterSection } from "@/components/landing/FooterSection";
import { QuoteRequestDialog } from "@/components/landing/QuoteRequestDialog";

export default function Landing() {
  const [quoteOpen, setQuoteOpen] = useState(false);

  return (
    <div className="dark min-h-screen bg-background text-foreground scroll-smooth overflow-x-hidden">
      <LandingNavbar onQuoteClick={() => setQuoteOpen(true)} />
      <HeroSection onQuoteClick={() => setQuoteOpen(true)} />
      <ProblemSection />
      <SolutionSection />
      <CTASection onQuoteClick={() => setQuoteOpen(true)} />
      <ContactSection />
      <FooterSection />
      <QuoteRequestDialog open={quoteOpen} onOpenChange={setQuoteOpen} />
    </div>
  );
}
