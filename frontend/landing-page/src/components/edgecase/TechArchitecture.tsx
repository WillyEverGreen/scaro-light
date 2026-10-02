import { Code2, Database, Cloud, Cpu, Network, GitBranch } from "lucide-react";

const TechArchitecture = () => {
  return (
    <section className="py-24 px-6 bg-card relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(125,184,165,0.1),transparent_50%)]" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Code2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              System Architecture
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Built for Scale & Reliability
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Microservices architecture with containerized deployment for maximum
            scalability and resilience
          </p>
        </div>

        {/* Architecture diagram */}
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Frontend Layer */}
            <div className="bg-background border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Frontend Layer
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    User Interface
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium text-sm mb-1">Next.js 14</div>
                  <div className="text-xs text-muted-foreground">
                    Server & Client Components
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium text-sm mb-1">
                    React Force Graph 3D
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Network Visualization
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium text-sm mb-1">Recharts</div>
                  <div className="text-xs text-muted-foreground">
                    Data Visualization
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium text-sm mb-1">
                    Tailwind + shadcn/ui
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Styled Components
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium text-sm mb-1">
                    Light/Dark Theme
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Responsive Design
                  </div>
                </div>
              </div>
            </div>

            {/* Backend Services */}
            <div className="bg-background border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Backend Services
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Core Processing
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium text-sm mb-1">Python FastAPI</div>
                  <div className="text-xs text-muted-foreground">
                    REST API Server
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium text-sm mb-1">
                    Multi-threaded Scraper
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Parallel Web Scraping
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium text-sm mb-1">
                    Risk Analysis Engine
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Real-time Scoring
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium text-sm mb-1">
                    Event Processor
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Stream Processing
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium text-sm mb-1">
                    Stress Test Simulator
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Scenario Engine
                  </div>
                </div>
              </div>
            </div>

            {/* Data & AI Layer */}
            <div className="bg-background border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Data & AI Layer
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Intelligence Engine
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium text-sm mb-1">PostgreSQL</div>
                  <div className="text-xs text-muted-foreground">
                    Time-series Data
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium text-sm mb-1">Neo4j</div>
                  <div className="text-xs text-muted-foreground">
                    Graph Database
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium text-sm mb-1">
                    Vector Database
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Embeddings Storage
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium text-sm mb-1">Ollama AI</div>
                  <div className="text-xs text-muted-foreground">
                    LLM Processing
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium text-sm mb-1">RAG Pipeline</div>
                  <div className="text-xs text-muted-foreground">
                    Contextual Retrieval
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Docker Layer */}
          <div className="mt-8 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <Cloud className="w-8 h-8 text-primary" />
              <h3 className="text-2xl font-bold text-foreground">
                Docker Orchestration
              </h3>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-background/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 text-center">
                <Database className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="font-medium text-sm">PostgreSQL</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Container
                </div>
              </div>
              <div className="bg-background/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 text-center">
                <Network className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="font-medium text-sm">Neo4j</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Container
                </div>
              </div>
              <div className="bg-background/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 text-center">
                <Cpu className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="font-medium text-sm">Ollama</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Container
                </div>
              </div>
              <div className="bg-background/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 text-center">
                <GitBranch className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="font-medium text-sm">Services</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Containers
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-primary">
                  docker-compose.yml
                </span>{" "}
                for seamless deployment and scaling
              </p>
            </div>
          </div>

          {/* Data Flow */}
          <div className="mt-8 bg-background border border-border rounded-2xl p-6">
            <h3 className="text-xl font-bold text-foreground mb-6 text-center">
              Data Flow Pipeline
            </h3>

            <div className="flex items-center justify-between gap-4 flex-wrap">
              {[
                { icon: Code2, label: "Web Scraping", desc: "Multi-source" },
                { icon: Database, label: "Data Storage", desc: "PostgreSQL" },
                { icon: Cpu, label: "AI Processing", desc: "Ollama + RAG" },
                { icon: Network, label: "Graph Analysis", desc: "Neo4j" },
                { icon: GitBranch, label: "Risk Scoring", desc: "Real-time" },
                { icon: Code2, label: "Dashboard", desc: "Next.js" },
              ].map((step, index, arr) => (
                <div key={step.label} className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                      <step.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium">{step.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {step.desc}
                      </div>
                    </div>
                  </div>
                  {index < arr.length - 1 && (
                    <div className="hidden md:block w-8 h-0.5 bg-primary/30" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechArchitecture;
