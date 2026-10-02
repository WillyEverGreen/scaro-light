import EdgecaseHero from "@/components/edgecase/EdgecaseHero";
import EdgecaseFeatures from "@/components/edgecase/EdgecaseFeatures";
import TechArchitecture from "@/components/edgecase/TechArchitecture";
import EdgecaseCTA from "@/components/edgecase/EdgecaseCTA";
import EdgecaseFooter from "@/components/edgecase/EdgecaseFooter";

const Edgecase = () => {
  return (
    <main className="min-h-screen bg-background">
      <EdgecaseHero />
      <EdgecaseFeatures />
      <TechArchitecture />
      <EdgecaseCTA />
      <EdgecaseFooter />
    </main>
  );
};

export default Edgecase;
