import {
  Globe,
  Brain,
  Database,
  Activity,
  Search,
  Network,
  LineChart,
  Shield,
  Zap,
  BarChart3,
  GitBranch,
  AlertTriangle,
} from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Multi-Source Web Scraping",
    description:
      "Parallel multi-threaded scraping across multiple search engines tracking global events, news, and supply chain disruptions in real-time.",
    tech: ["Beautiful Soup", "Scrapy", "Selenium"],
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Globe,
    title: "Country-Wise Risk Tracking",
    description:
      "Geographic clustering and geopolitical event monitoring. Track semiconductor shortages, trade wars, and regional disruptions affecting your supply chain.",
    tech: ["Geo-indexing", "Event correlation", "Regional analysis"],
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Brain,
    title: "AI-Powered Analysis with RAG",
    description:
      "Ollama-powered AI with Retrieval-Augmented Generation for intelligent querying, natural language insights, and contextual risk assessment.",
    tech: ["Ollama", "RAG", "Vector DB"],
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Network,
    title: "Vendor Mapping & Visualization",
    description:
      "Neo4j graph database for complex vendor relationships. Visualize supply chain networks in 3D using React Force Graph for intuitive dependency analysis.",
    tech: ["Neo4j", "React Force 3D", "Graph algorithms"],
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Activity,
    title: "Overconfidence Detection",
    description:
      "Detect hidden risks when supply chains appear stable. Flag when historical stability masks underlying fragility indicators.",
    tech: ["Statistical analysis", "Pattern recognition", "Anomaly detection"],
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: BarChart3,
    title: "Real-Time Risk Scoring",
    description:
      "Composite fragility index combining HHI, entropy, variance in lead times, and confidence gap metrics. Continuous risk assessment with live updates.",
    tech: ["Risk algorithms", "Live scoring", "Threshold alerts"],
    color: "from-red-500 to-pink-500",
  },
  {
    icon: LineChart,
    title: "Interactive Dashboard",
    description:
      "Next.js dashboard with beautiful light/dark themes. Real-time indicators, charts, and controls for scraping management and system monitoring.",
    tech: ["Next.js", "Recharts", "Real-time updates"],
    color: "from-indigo-500 to-purple-500",
  },
  {
    icon: Zap,
    title: "Stress-Test Simulator",
    description:
      "Inject synthetic shocks to test supply chain resilience. Simulate supplier failures, port closures, and demand spikes to identify vulnerabilities.",
    tech: ["Monte Carlo", "Scenario modeling", "Impact analysis"],
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: Database,
    title: "Dockerized Infrastructure",
    description:
      "Fully containerized deployment with Docker. Scalable architecture with separate containers for databases, scraping services, and AI models.",
    tech: ["Docker", "Docker Compose", "Microservices"],
    color: "from-teal-500 to-green-500",
  },
  {
    icon: GitBranch,
    title: "Fragility Indicators",
    description:
      "Multi-dimensional fragility analysis including supplier concentration, geographic clustering, reliability metrics, and dependency mapping.",
    tech: ["HHI calculation", "Entropy metrics", "Clustering algorithms"],
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Shield,
    title: "Stability Metrics",
    description:
      "Track variance in lead times, delivery reliability, and performance consistency. Identify when sustained stability creates overconfidence.",
    tech: ["Time series", "Statistical variance", "Trend analysis"],
    color: "from-lime-500 to-green-500",
  },
  {
    icon: AlertTriangle,
    title: "Automated Alerting",
    description:
      "Smart alerts when risk thresholds are breached. Proactive notifications for emerging threats before they impact operations.",
    tech: ["Rule engine", "Notification system", "Escalation protocols"],
    color: "from-amber-500 to-orange-500",
  },
];

const EdgecaseFeatures = () => {
  return (
    <section className="py-24 px-6 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Complete Ecosystem
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Comprehensive Supply Chain Intelligence
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A fully integrated platform combining real-time data collection, AI
            analysis, graph visualization, and risk scoring to protect your
            supply chain from hidden vulnerabilities.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative bg-card border border-border rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Icon with gradient background */}
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} p-0.5 mb-4 group-hover:scale-110 transition-transform`}
              >
                <div className="w-full h-full bg-card rounded-xl flex items-center justify-center">
                  <feature.icon className="w-7 h-7 text-foreground" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {feature.description}
              </p>

              {/* Tech tags */}
              <div className="flex flex-wrap gap-2">
                {feature.tech.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-1 text-xs font-medium bg-muted rounded text-muted-foreground"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Hover gradient */}
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`}
              />
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 border border-primary/20 rounded-full">
            <Database className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">
              All features integrated with real-time data pipelines and Docker
              containerization
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EdgecaseFeatures;
