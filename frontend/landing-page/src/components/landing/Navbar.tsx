import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
        isScrolled
          ? "bg-background py-3"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto md:grid md:grid-cols-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Edgecase Logo"
            className="h-20 w-auto object-contain mix-blend-multiply transition-transform hover:scale-105 duration-300"
          />
        </div>

        <div className="hidden md:flex items-center justify-center gap-8">
          <a
            href="#features"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Features
          </a>
          <a
            href="#why"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Why Edgecase
          </a>
          <a
            href="#security"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Security
          </a>
        </div>

        <div className="flex items-center justify-end gap-4">
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            Log in
          </Button>
          <Button size="sm" className="bg-primary text-white">
            Get Started
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
