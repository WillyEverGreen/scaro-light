import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, Shield, Database } from "lucide-react";

const EdgecaseHero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-destructive/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Supply Chain Intelligence Platform
              </span>
            </div>

            {/* Main heading */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
                Edgecase
              </h1>
              <p className="text-2xl md:text-3xl font-semibold text-primary">
                Supply Chain Analyser for Risk and Overconfidence
              </p>
            </div>

            {/* Problem statement */}
            <div className="bg-destructive/5 border-l-4 border-destructive p-6 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    The Critical Problem
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Organizations underestimate risk when supply chains perform
                    well for long periods. This overconfidence blinds them to
                    hidden fragilities until it's too late.
                  </p>
                </div>
              </div>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">24/7</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Real-time Monitoring
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">200+</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Risk Indicators
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">AI</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Powered Analysis
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Button size="lg" className="gap-2">
                <Database className="w-4 h-4" />
                Start Analysis
              </Button>
              <Button variant="outline" size="lg" className="gap-2" onClick={() => window.location.href = '/dashboard'}>
                <TrendingUp className="w-4 h-4" />
                View Demo Dashboard
              </Button>
            </div>

            {/* Tech stack badges */}
            <div className="flex flex-wrap gap-2 pt-4">
              <span className="px-3 py-1 text-xs font-medium bg-background border border-border rounded-full">
                Next.js
              </span>
              <span className="px-3 py-1 text-xs font-medium bg-background border border-border rounded-full">
                Python
              </span>
              <span className="px-3 py-1 text-xs font-medium bg-background border border-border rounded-full">
                Neo4j
              </span>
              <span className="px-3 py-1 text-xs font-medium bg-background border border-border rounded-full">
                Ollama AI
              </span>
              <span className="px-3 py-1 text-xs font-medium bg-background border border-border rounded-full">
                Docker
              </span>
              <span className="px-3 py-1 text-xs font-medium bg-background border border-border rounded-full">
                RAG
              </span>
            </div>
          </div>

          {/* Right: Visual representation */}
          <div className="relative">
            <div className="relative bg-card border border-border rounded-2xl p-8 shadow-2xl">
              {/* Mock dashboard preview */}
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
                    <span className="text-sm font-medium">
                      Live Risk Detection
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Updated 2m ago
                  </span>
                </div>

                {/* Risk indicators */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      <div>
                        <div className="text-sm font-medium">
                          High Fragility Detected
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Semiconductor shortage impact
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-destructive">
                      87%
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-sm font-medium">
                          Overconfidence Risk
                        </div>
                        <div className="text-xs text-muted-foreground">
                          3-year stability masking fragility
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-primary">High</div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg border border-accent/20">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-accent-foreground" />
                      <div>
                        <div className="text-sm font-medium">
                          Vendor Concentration
                        </div>
                        <div className="text-xs text-muted-foreground">
                          HHI Index elevated
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-accent-foreground">
                      0.72
                    </div>
                  </div>
                </div>

                {/* Mini chart placeholder */}
                <div className="bg-muted/30 rounded-lg p-4 h-32 flex items-end justify-between gap-1">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary rounded-sm"
                      style={{
                        height: `${Math.random() * 100}%`,
                        opacity: 0.4 + Math.random() * 0.6,
                      }}
                    />
                  ))}
                </div>

                {/* Countries affected */}
                <div className="pt-2">
                  <div className="text-xs text-muted-foreground mb-2">
                    Active Monitoring
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["China", "Taiwan", "USA", "Germany", "Japan"].map(
                      (country) => (
                        <span
                          key={country}
                          className="px-2 py-1 text-xs bg-background border border-border rounded"
                        >
                          {country}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-6 -right-6 bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-lg px-3 py-2 shadow-lg">
              <div className="text-xs font-medium text-primary">
                Real-time Updates
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-card backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
              <div className="text-xs font-medium">AI-Powered Insights</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EdgecaseHero;
