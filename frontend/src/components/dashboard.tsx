"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Brain,
  Circle,
  Database,
  Globe,
  Package,
  RefreshCcw,
  Server,
  TrendingDown,
  TrendingUp,
  Wifi,
  WifiOff,
} from "lucide-react";
import { RiskScoreCard } from "./risk-score-card";
import { AlertsPanel } from "./alerts-panel";
import { RiskChart } from "./risk-chart";
import { RemindersWidget } from "./dashboard/RemindersWidget";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const mockDashboardData = {
  risk: {
    overall_risk_score: 0.42,
    overconfidence_alerts: 3,
    high_risk_vendors: 7,
    affected_countries: 12,
    active_events: 24,
  },
  recent_events: [
    {
      id: "1",
      title: "Semiconductor shortage affecting Taiwan production",
      category: "commodity",
      severity: "high",
      country: "TWN",
      created_at: new Date().toISOString(),
    },
    {
      id: "2",
      title: "Port congestion at Shanghai continues",
      category: "logistics",
      severity: "medium",
      country: "CHN",
      created_at: new Date().toISOString(),
    },
    {
      id: "3",
      title: "New US export controls on AI chips",
      category: "trade_restriction",
      severity: "critical",
      country: "USA",
      created_at: new Date().toISOString(),
    },
  ],
  scraping_status: { status: "idle", jobs_pending: 0 },
};

interface ServiceStatus {
  name: string;
  status: "online" | "offline" | "checking";
  icon: typeof Server;
}

function SystemStatusBar() {
  const [mounted, setMounted] = useState(false);
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: "Backend", status: "checking", icon: Server },
    { name: "Database", status: "checking", icon: Database },
    { name: "NVIDIA NIM", status: "checking", icon: Brain },
  ]);

  useEffect(() => {
    setMounted(true);

    const checkServices = async () => {
      const newServices: ServiceStatus[] = [];

      try {
        const res = await fetch(`${API_BASE}/health`, { method: "GET" });
        newServices.push({
          name: "Backend",
          status: res.ok ? "online" : "offline",
          icon: Server,
        });
      } catch {
        newServices.push({ name: "Backend", status: "offline", icon: Server });
      }

      try {
        const res = await fetch(`${API_BASE}/api/debug/stats`);
        newServices.push({
          name: "Database",
          status: res.ok ? "online" : "offline",
          icon: Database,
        });
      } catch {
        newServices.push({ name: "Database", status: "offline", icon: Database });
      }

      try {
        // We check the backend's health, which now verifies NVIDIA connectivity
        const res = await fetch(`${API_BASE}/health`, { method: "GET" });
        newServices.push({
          name: "NVIDIA NIM",
          status: res.ok ? "online" : "offline",
          icon: Brain,
        });
      } catch {
        newServices.push({ name: "NVIDIA NIM", status: "offline", icon: Brain });
      }

      setServices(newServices);
    };

    checkServices();
    const interval = setInterval(checkServices, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className="panel-surface rounded-xl px-4 py-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Circle className="w-3 h-3" />
          Checking system status...
        </div>
      </div>
    );
  }

  const allOnline = services.every((s) => s.status === "online");
  const allOffline = services.every((s) => s.status === "offline");

  return (
    <div
      className={`rounded-xl px-4 py-3 border panel-surface ${
        allOnline
          ? "border-green-500/40 bg-green-500/8"
          : allOffline
            ? "border-red-500/40 bg-red-500/8"
            : "border-amber-500/40 bg-amber-500/8"
      }`}
    >
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          {allOnline ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : allOffline ? (
            <WifiOff className="w-4 h-4 text-red-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          )}
          <span
            className={`font-semibold tracking-[0.01em] ${
              allOnline
                ? "text-green-700 dark:text-green-400"
                : allOffline
                  ? "text-red-700 dark:text-red-400"
                  : "text-amber-700 dark:text-amber-400"
            }`}
          >
            {allOnline ? "All Systems Online" : allOffline ? "System Offline" : "Partial Connectivity"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {services.map((service) => (
            <div key={service.name} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/70 border border-border/60">
              <service.icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground font-medium">{service.name}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  service.status === "online"
                    ? "bg-green-500"
                    : service.status === "offline"
                      ? "bg-red-500"
                      : "bg-gray-400 animate-pulse"
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString());
    const interval = setInterval(() => {
      setLastUpdated(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE}/api/dashboard/summary`);
        if (!response.ok) {
          throw new Error("API not available");
        }
        return response.json();
      } catch {
        return mockDashboardData;
      }
    },
    refetchInterval: 30000,
  });

  const summary = data || mockDashboardData;
  const riskLevel = getRiskLevel(summary.risk.overall_risk_score);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <section className="panel-surface-strong rounded-2xl p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-primary/80 font-semibold">Operations Room</p>
            <h1 className="text-3xl font-bold leading-tight mt-1 font-heading">Supply Chain Dashboard</h1>
            <p className="text-muted-foreground mt-1">Real-time risk monitoring and intelligence synthesis</p>
          </div>

          <button
            onClick={() => refetch()}
            className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary/50 bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg"
          >
            <RefreshCcw className={`w-4 h-4 transition-transform duration-300 ${isLoading ? "animate-spin" : "group-hover:rotate-180"}`} />
            {isLoading ? "Refreshing..." : "Refresh Signals"}
          </button>
        </div>
      </section>

      <SystemStatusBar />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="animate-fade-in stagger-1">
          <RiskScoreCard
            title="Overall Risk Score"
            value={`${(summary.risk.overall_risk_score * 100).toFixed(0)}%`}
            subtitle={`Risk Level: ${riskLevel.label}`}
            icon={Activity}
            trend={
              summary.risk.overall_risk_score > 0.5 ? (
                <TrendingUp className="w-4 h-4 text-red-500 animate-pulse" />
              ) : (
                <TrendingDown className="w-4 h-4 text-green-500" />
              )
            }
            colorClass={riskLevel.colorClass}
          />
        </div>

        <div className="animate-fade-in stagger-2">
          <RiskScoreCard
            title="Overconfidence Alerts"
            value={summary.risk.overconfidence_alerts}
            subtitle="Stability is not security"
            icon={AlertTriangle}
            colorClass={
              summary.risk.overconfidence_alerts > 0
                ? "bg-amber-500/12 border-amber-500/35"
                : "bg-green-500/12 border-green-500/35"
            }
          />
        </div>

        <div className="animate-fade-in stagger-3">
          <RiskScoreCard
            title="High Risk Vendors"
            value={summary.risk.high_risk_vendors}
            subtitle={`${summary.risk.affected_countries} countries affected`}
            icon={Package}
            colorClass="bg-orange-500/12 border-orange-500/35"
          />
        </div>

        <div className="animate-fade-in stagger-4">
          <RiskScoreCard
            title="Active Events"
            value={summary.risk.active_events}
            subtitle="Monitoring worldwide"
            icon={Globe}
            colorClass="bg-blue-500/12 border-blue-500/35"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 flex flex-col gap-6">
          <RiskChart />
          <div className="animate-fade-in">
            <RemindersWidget />
          </div>
        </div>

        <div className="xl:col-span-1">
          <AlertsPanel events={summary.recent_events} />
        </div>
      </div>

      <div className="panel-surface rounded-xl p-4 text-sm text-muted-foreground">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                summary.scraping_status.status === "running" ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`}
            />
            <span className="font-medium">Scraping: {summary.scraping_status.status}</span>
          </div>
          <div className="font-medium">Last updated: {lastUpdated || "--:--:--"}</div>
        </div>
      </div>
    </div>
  );
}

function getRiskLevel(score: number): { label: string; colorClass: string } {
  if (score >= 0.8) {
    return { label: "Critical", colorClass: "bg-red-500/12 border-red-500/35" };
  }
  if (score >= 0.6) {
    return { label: "High", colorClass: "bg-orange-500/12 border-orange-500/35" };
  }
  if (score >= 0.4) {
    return { label: "Medium", colorClass: "bg-amber-500/12 border-amber-500/35" };
  }
  return { label: "Low", colorClass: "bg-green-500/12 border-green-500/35" };
}
