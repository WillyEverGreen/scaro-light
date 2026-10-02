import { Search, Brain, Network, Activity, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Real-Time Intelligence",
    description:
      "Continuous monitoring of global events, news, and supply chain disruptions across multiple sources.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description:
      "Advanced AI analysis with natural language queries for instant, actionable risk assessment.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Network,
    title: "Vendor Mapping",
    description:
      "Visual supply chain networks reveal hidden dependencies and critical vulnerabilities.",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: Activity,
    title: "Overconfidence Detection",
    description:
      "Identify hidden risks when everything appears stable. See beyond the surface.",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    icon: Shield,
    title: "Fragility Scoring",
    description:
      "Comprehensive risk metrics combining concentration, clustering, and reliability indicators.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Zap,
    title: "Stress Testing",
    description:
      "Simulate disruptions to test resilience and identify weak points before they fail.",
    gradient: "from-indigo-500 to-purple-500",
  },
];

const BenefitsSection = () => {
  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Intelligent Risk Detection
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Advanced capabilities that uncover hidden vulnerabilities and
            protect your supply chain
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg opacity-0 animate-fade-up"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: "forwards",
              }}
            >
              <div
                className={`w-12 h-12 mb-4 bg-gradient-to-br ${feature.gradient} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
