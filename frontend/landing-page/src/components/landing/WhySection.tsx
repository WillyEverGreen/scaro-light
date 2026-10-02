import { Globe } from "@/components/ui/globe";
import { Globe2, Sparkles, Shield } from "lucide-react";

const processSteps = [
  {
    id: 1,
    label: "Risk detected",
  },
  {
    id: 2,
    label: "Analyzed",
  },
  {
    id: 3,
    label: "Protected",
  },
];

const WhySection = () => {
  return (
    <section className="py-24 px-6 bg-card relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Why Edgecase exists
          </h2>
          <p className="text-lg text-muted-foreground font-normal leading-relaxed max-w-2xl mx-auto">
            In supply chains that demand constant attention, we've created
            clarity and confidence through intelligent monitoring.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Content */}
          <div className="space-y-6 order-2 lg:order-1">
            <div className="space-y-4 text-lg text-muted-foreground font-normal leading-relaxed">
              <div className="flex items-start gap-3 p-4 bg-background rounded-2xl shadow-sm border border-border/50">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-foreground font-medium mb-1 text-sm">
                    Built for resilience
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Protect your operations from hidden vulnerabilities.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-background rounded-2xl shadow-sm border border-border/50">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                  <Globe2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-foreground font-medium mb-1 text-sm">
                    Global visibility
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Monitor supply chains across continents in real-time.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-background rounded-2xl shadow-sm border border-border/50">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-foreground font-medium mb-1 text-sm">
                    Continuous improvement
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Learn from every event—build stronger supply chains.
                  </p>
                </div>
              </div>
            </div>

            {/* Transformation flow */}
            <div className="py-12 relative max-w-2xl mx-auto">
              {/* Connecting Line Background */}
              <div
                className="absolute top-[4.5rem] left-[15%] right-[15%] h-[1px] bg-primary/20 hidden md:block"
                aria-hidden="true"
              />

              <div className="flex items-center justify-between relative z-10">
                {processSteps.map((step) => (
                  <div key={step.id} className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-background border-2 border-primary/20 shadow-sm flex items-center justify-center text-primary font-bold text-lg mb-4 ring-8 ring-card">
                      {step.id}
                    </div>
                    <p className="text-sm text-muted-foreground font-medium whitespace-nowrap">
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right side - Interactive Globe */}
          <div className="relative order-1 lg:order-2 h-[600px] flex items-center justify-center">
            <div className="relative w-full max-w-[550px] h-[550px]">
              {/* Ambient glow effect */}
              <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-primary/5 to-transparent rounded-full blur-3xl" />

              {/* Globe container */}
              <div className="relative w-full h-full rounded-full overflow-hidden border border-primary/10 bg-gradient-to-br from-background to-primary/5">
                <Globe
                  className="top-0"
                  config={{
                    width: 550,
                    height: 550,
                    onRender: () => {},
                    devicePixelRatio: 2,
                    phi: 0,
                    theta: 0.3,
                    dark: 0,
                    diffuse: 0.4,
                    mapSamples: 16000,
                    mapBrightness: 1.2,
                    baseColor: [160 / 255, 180 / 255, 170 / 255], // Sage green base
                    markerColor: [125 / 255, 184 / 255, 165 / 255], // Primary color markers
                    glowColor: [160 / 255, 180 / 255, 170 / 255],
                    markers: [
                      { location: [14.5995, 120.9842], size: 0.03 },
                      { location: [19.076, 72.8777], size: 0.1 },
                      { location: [23.8103, 90.4125], size: 0.05 },
                      { location: [30.0444, 31.2357], size: 0.07 },
                      { location: [39.9042, 116.4074], size: 0.08 },
                      { location: [-23.5505, -46.6333], size: 0.1 },
                      { location: [19.4326, -99.1332], size: 0.1 },
                      { location: [40.7128, -74.006], size: 0.1 },
                      { location: [34.6937, 135.5022], size: 0.05 },
                      { location: [41.0082, 28.9784], size: 0.06 },
                      { location: [51.5074, -0.1278], size: 0.08 }, // London
                      { location: [35.6762, 139.6503], size: 0.09 }, // Tokyo
                      { location: [-33.8688, 151.2093], size: 0.07 }, // Sydney
                      { location: [55.7558, 37.6176], size: 0.06 }, // Moscow
                    ],
                  }}
                />
              </div>

              {/* Floating text elements */}
              <div className="absolute -top-8 -left-8 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/50 shadow-sm">
                <span className="text-sm text-muted-foreground">
                  Global community
                </span>
              </div>

              <div className="absolute -bottom-6 -right-6 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/50 shadow-sm">
                <span className="text-sm text-muted-foreground">
                  One gentle step
                </span>
              </div>

              <div className="absolute top-1/4 -right-12 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/50 shadow-sm">
                <span className="text-sm text-muted-foreground">
                  Shared clarity
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom message */}
        <div className="text-center mt-16 max-w-2xl mx-auto">
          <p className="text-lg text-muted-foreground font-normal leading-relaxed">
            We built this space to help you find clarity—one gentle step at a
            time. Not another tool that demands more. A companion that gives you
            room to breathe.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground/70">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span>Join thousands finding their calm</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhySection;
