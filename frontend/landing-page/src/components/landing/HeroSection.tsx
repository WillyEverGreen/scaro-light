import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import BackgroundTrucks from "./BackgroundTrucks";

const HeroSection = () => {
  return (
    <section className="hero-section min-h-screen flex items-center justify-center px-6 py-20 relative overflow-hidden">
      {/* Background animated trucks */}
      <Suspense fallback={null}>
        <BackgroundTrucks />
      </Suspense>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Headline */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight tracking-tight mb-6 opacity-0 animate-fade-up animation-delay-100">
          A smarter way to protect
          <br />
          <span className="text-primary">your supply chain.</span>
        </h1>

        {/* Sub-headline */}
        <p className="text-xl md:text-2xl text-muted-foreground font-normal leading-relaxed max-w-2xl mx-auto mb-10 opacity-0 animate-fade-up animation-delay-200">
          Edgecase - Your intelligent companion for supply chain clarity. Detect
          risks before they become crises.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-up animation-delay-300">
          <Button variant="calm" size="xl" onClick={() => window.location.href = "http://localhost:3000"}>
            Start analyzing
          </Button>
          <Button variant="gentle" size="xl" onClick={() => window.location.href = "http://localhost:3000"}>
            See how it works
          </Button>
        </div>

        {/* Subtle trust indicator */}
        <p className="mt-12 text-sm text-muted-foreground/70 font-light opacity-0 animate-fade-up animation-delay-400">
          No credit card required · Enterprise-ready security
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
