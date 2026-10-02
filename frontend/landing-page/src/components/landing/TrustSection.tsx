import {
  Shield,
  Target,
  Clock,
  Eye,
  Brain,
  Globe,
  AlertTriangle,
  Users,
  BarChart3,
} from "lucide-react";
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";
import { motion } from "framer-motion";
import usePrefersReducedMotion from "@/hooks/use-prefers-reduced-motion";

const scaroTimelineData = [
  {
    id: 1,
    title: "Data Protection",
    date: "Always",
    content:
      "Enterprise-grade encryption and strict security practices keep your supply chain information safe and compliant.",
    category: "Security",
    icon: Shield,
    relatedIds: [2, 6],
    status: "completed" as const,
    energy: 100,
  },
  {
    id: 2,
    title: "Real-Time Monitoring",
    date: "24/7",
    content:
      "Continuous surveillance of your supply chain with instant alerts for disruptions and anomalies across global operations.",
    category: "Monitoring",
    icon: Eye,
    relatedIds: [1, 3, 4],
    status: "completed" as const,
    energy: 95,
  },
  {
    id: 3,
    title: "AI Intelligence",
    date: "Live",
    content:
      "Carefully trained AI models focus on accuracy and relevance—identifying risks before they become critical issues.",
    category: "Intelligence",
    icon: Brain,
    relatedIds: [2, 4, 5],
    status: "in-progress" as const,
    energy: 90,
  },
  {
    id: 4,
    title: "Risk Analysis",
    date: "Instant",
    content:
      "Advanced risk assessment algorithms analyze patterns and predict potential supply chain vulnerabilities.",
    category: "Analysis",
    icon: AlertTriangle,
    relatedIds: [2, 3, 5],
    status: "in-progress" as const,
    energy: 85,
  },
  {
    id: 5,
    title: "Global Networks",
    date: "Worldwide",
    content:
      "Visual representation of supplier relationships and dependency chains across continents and regions.",
    category: "Network",
    icon: Globe,
    relatedIds: [3, 4, 6],
    status: "completed" as const,
    energy: 80,
  },
  {
    id: 6,
    title: "Team Insights",
    date: "On-Demand",
    content:
      "Fast, responsive analysis helps teams act early instead of reacting late to supply chain disruptions.",
    category: "Insights",
    icon: Users,
    relatedIds: [1, 5, 7],
    status: "completed" as const,
    energy: 75,
  },
  {
    id: 7,
    title: "Performance Metrics",
    date: "Real-Time",
    content:
      "Comprehensive analytics and KPIs help optimize efficiency and reduce operational costs across your supply chain.",
    category: "Analytics",
    icon: BarChart3,
    relatedIds: [6],
    status: "pending" as const,
    energy: 70,
  },
];

const trustPoints = [
  {
    icon: Shield,
    title: "Your data stays protected—always.",
    description:
      "Enterprise-grade encryption and strict security practices keep your supply chain information safe.",
  },
  {
    icon: Target,
    title: "Insights you can rely on.",
    description:
      "Carefully trained AI models focus on accuracy and relevance—not noise.",
  },
  {
    icon: Clock,
    title: "Timely insights, right when you need them.",
    description:
      "Fast, responsive analysis helps teams act early instead of reacting late.",
  },
];

const TrustSection = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  return (
    <motion.section
      id="security"
      className="py-12 px-6 bg-secondary/10"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Built for Supply Chain Teams
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Reliability and clarity when stakes are high. Explore our ecosystem
            below.
          </p>
        </div>

        {/* Interactive Orbital Timeline */}
        <div className="mb-40">
          {!prefersReducedMotion && (
            <RadialOrbitalTimeline timelineData={scaroTimelineData} />
          )}
          {prefersReducedMotion && (
            <div className="w-full flex items-center justify-center py-16 border border-dashed border-primary/30 rounded-2xl text-sm text-muted-foreground">
              Interactive visualization disabled to honor your motion
              preferences.
            </div>
          )}
        </div>

        {/* Trust Points Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {trustPoints.map((point, index) => (
            <motion.div
              key={point.title}
              className={`flex flex-col items-center ${
                index === 0 || index === 2 ? "mb-8 md:mb-12" : "mt-8 md:mt-12"
              }`}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
            >
              <div className="w-12 h-12 mb-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center shadow-sm border border-primary/20">
                <point.icon className="w-6 h-6 text-primary" strokeWidth={2} />
              </div>
              <h3 className="text-foreground font-semibold mb-1 text-base">
                {point.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-xs font-light text-center">
                {point.description}
              </p>
            </motion.div>
          ))}
        </div>

        <p className="text-muted-foreground/80 mt-6 text-sm font-light italic max-w-2xl mx-auto text-center">
          Because trust is built through clarity—not complexity.
        </p>
      </div>
    </motion.section>
  );
};

export default TrustSection;
