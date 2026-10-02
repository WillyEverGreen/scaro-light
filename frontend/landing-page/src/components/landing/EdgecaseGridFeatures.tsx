import {
  Shield,
  TrendingUp,
  Network,
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  DollarSign,
  Users,
  Eye,
  Brain,
  Globe,
  PieChart,
  Zap,
  Lock,
  FileCheck,
  Calculator,
  Building2,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { FeatureCard } from "@/components/ui/grid-feature-cards";

const scaroFeatures = [
  {
    title: "Real-Time Monitoring",
    icon: Eye,
    description:
      "Continuous surveillance of your supply chain with instant alerts for disruptions and anomalies.",
  },
  {
    title: "Risk Intelligence",
    icon: Brain,
    description:
      "AI-powered analysis identifies hidden vulnerabilities before they become critical issues.",
  },
  {
    title: "Network Mapping",
    icon: Globe,
    description:
      "Visual representation of supplier relationships and dependency chains across global operations.",
  },
  {
    title: "Performance Analytics",
    icon: PieChart,
    description:
      "Comprehensive metrics and KPIs to optimize efficiency and reduce operational costs.",
  },
  {
    title: "Predictive Insights",
    icon: Zap,
    description:
      "Machine learning models forecast potential disruptions weeks before they occur.",
  },
  {
    title: "Enterprise Security",
    icon: Lock,
    description:
      "Bank-grade encryption and compliance standards protect your sensitive supply chain data.",
  },
  {
    title: "Compliance Monitoring",
    icon: FileCheck,
    description:
      "Automated tracking of regulatory requirements and certification standards across your supply network.",
  },
  {
    title: "Cost Optimization",
    icon: Calculator,
    description:
      "Intelligent cost analysis and optimization recommendations to maximize profitability and efficiency.",
  },
  {
    title: "Supplier Intelligence",
    icon: Building2,
    description:
      "Comprehensive supplier profiling and performance tracking to ensure reliable partnerships.",
  },
];

export function EdgecaseGridFeatures() {
  return (
    <section id="features" className="py-16 md:py-32 bg-primary/5">
      <div className="mx-auto w-full max-w-6xl space-y-8 px-6">
        <AnimatedContainer className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Intelligent Risk Detection
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
            Advanced capabilities that uncover hidden vulnerabilities and
            protect your supply chain with powerful tools designed to monitor
            and optimize your global operations.
          </p>
        </AnimatedContainer>

        <AnimatedContainer
          delay={0.4}
          className="grid grid-cols-1 divide-x divide-y divide-dashed border border-dashed sm:grid-cols-2 md:grid-cols-3 rounded-lg overflow-hidden"
        >
          {scaroFeatures.map((feature, i) => (
            <FeatureCard
              key={i}
              feature={feature}
              className="bg-background/50 hover:bg-background transition-colors duration-300"
            />
          ))}
        </AnimatedContainer>
      </div>
    </section>
  );
}

type ViewAnimationProps = {
  delay?: number;
  className?: React.ComponentProps<typeof motion.div>["className"];
  children: React.ReactNode;
};

function AnimatedContainer({
  className,
  delay = 0.1,
  children,
}: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ filter: "blur(4px)", translateY: -8, opacity: 0 }}
      whileInView={{ filter: "blur(0px)", translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
