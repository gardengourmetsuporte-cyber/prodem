import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { CTASection } from "@/components/landing/CTASection";
import { ContactSection } from "@/components/landing/ContactSection";
import { FooterSection } from "@/components/landing/FooterSection";

export default function Landing() {
  return (
    <div className="dark min-h-screen bg-background text-foreground scroll-smooth overflow-x-hidden">
      <LandingNavbar />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <CTASection />
      <ContactSection />
      <FooterSection />
    </div>
  );
}
