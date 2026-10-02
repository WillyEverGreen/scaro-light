import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

const EdgecaseCTA = () => {
  return (
    <section className="py-24 px-6 bg-gradient-to-br from-primary/10 via-background to-primary/5 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Don't Let Overconfidence Blind Your Supply Chain
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Start monitoring hidden risks today. Edgecase provides the
              intelligence you need to protect your supply chain before
              disruptions happen.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="gap-2 text-lg px-8 py-6">
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 text-lg px-8 py-6"
            >
              <Play className="w-5 h-5" />
              Watch Demo
            </Button>
          </div>

          <div className="pt-8 space-y-4">
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span>Free trial available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span>Enterprise support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EdgecaseCTA;
