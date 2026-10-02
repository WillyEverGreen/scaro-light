"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import Image from "next/image";
import {
  AlertTriangle,
  Ban,
  BarChart3,
  ChevronRight,
  CloudRain,
  Database,
  Info,
  LayoutDashboard,
  MessageSquare,
  Moon,
  Network,
  Radar,
  Settings,
  Sun,
  Zap,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/graph", label: "Supply Chain Graph", icon: Network },
  { href: "/dashboard/risks", label: "Risk Analysis", icon: AlertTriangle },
  { href: "/dashboard/analyze", label: "Dataset Analysis", icon: BarChart3 },
  { href: "/dashboard/scraping", label: "Scraping Control", icon: Radar },
  { href: "/dashboard/query", label: "Ask AI", icon: MessageSquare },
  { href: "/dashboard/weather", label: "Weather Impact", icon: CloudRain },
  { href: "/dashboard/simulator", label: "Shock Simulator", icon: Zap },
  { href: "/dashboard/report", label: "Exec. Briefing", icon: BarChart3 },
  { href: "/dashboard/restrictions", label: "Trade Restrictions", icon: Ban },
  { href: "/dashboard/debug", label: "Data Browser", icon: Database },
  { href: "/dashboard/about", label: "About", icon: Info },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <aside className="w-72 h-screen panel-surface border-r border-border/80 flex flex-col print:hidden">
      <div className="p-5 border-b border-border/70">
        <div className="flex items-center gap-3 mb-4">
          <Image
            src="/logo.png"
            alt="Edgecase Logo"
            width={44}
            height={44}
            className="object-contain"
            unoptimized
          />
          <div className="space-y-0.5">
            <h1 className="text-2xl leading-none text-foreground font-heading font-bold tracking-wide">
              Edgecase
            </h1>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground font-semibold">
              Risk Command
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-primary/35 bg-primary/10 px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-primary/80 font-semibold">
            Monitoring
          </p>
          <p className="text-sm font-semibold text-foreground">Global supply disruptions</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-200 ease-out animate-slide-in-left stagger-${index + 1} ${
                isActive
                  ? "border-primary/40 bg-primary/15 text-primary shadow-sm"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/60"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? "scale-110" : "group-hover:scale-105"
                }`}
              />
              <span className="text-sm font-semibold tracking-[0.01em]">{item.label}</span>
              {isActive && <ChevronRight className="ml-auto w-4 h-4" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/70 space-y-2 bg-muted/35">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="group flex items-center gap-3 px-3 py-2.5 rounded-lg w-full border border-transparent text-muted-foreground hover:text-foreground hover:border-border hover:bg-background transition-all duration-200"
        >
          {mounted ? (
            theme === "dark" ? (
              <Sun className="w-5 h-5 transition-transform duration-300 group-hover:rotate-180" />
            ) : (
              <Moon className="w-5 h-5 transition-transform duration-300 group-hover:-rotate-12" />
            )
          ) : (
            <Sun className="w-5 h-5" />
          )}
          <span className="text-sm font-semibold">
            {mounted
              ? theme === "dark"
                ? "Light Mode"
                : "Dark Mode"
              : "Toggle Theme"}
          </span>
        </button>

        <Link
          href="/dashboard/settings"
          className="group flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent text-muted-foreground hover:text-foreground hover:border-border hover:bg-background transition-all duration-200"
        >
          <Settings className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
          <span className="text-sm font-semibold">Settings</span>
        </Link>
      </div>
    </aside>
  );
}
