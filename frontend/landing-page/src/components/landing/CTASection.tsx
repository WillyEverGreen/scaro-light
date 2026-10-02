import { Button } from "@/components/ui/button";
import { Rocket, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

const CTASection = () => {
  return (
    <motion.section
      className="py-24 px-6 relative overflow-hidden"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true, amount: 0.2 }}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-blue-500/10" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
          Ready to Strengthen Your Supply Chain?
        </h2>
        <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          Join forward-thinking organizations using Edgecase to detect risks before
          they become crises.
        </p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Button size="lg" className="gap-2">
            <Rocket className="w-4 h-4" />
            Start Free Trial
          </Button>
          <Button variant="outline" size="lg" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Schedule Demo
          </Button>
        </motion.div>

        <p className="mt-8 text-sm text-muted-foreground">
          No credit card required · 14-day free trial · Cancel anytime
        </p>
      </div>
    </motion.section>
  );
};

export default CTASection;
