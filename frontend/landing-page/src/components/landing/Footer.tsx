import { Shield } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 px-6 border-t border-border bg-card">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="Edgecase Logo" 
            className="h-24 w-auto object-contain mix-blend-multiply"
          />
        </div>

        <nav className="flex items-center gap-8">
          <a
            href="#"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Documentation
          </a>
          <a
            href="#"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="#"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms of Service
          </a>
          <a
            href="#"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Contact
          </a>
        </nav>

        <p className="text-sm text-muted-foreground">
          © 2026 Edgecase. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
