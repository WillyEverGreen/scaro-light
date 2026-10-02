"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, TrendingUp, Shield, Activity, Loader2, RefreshCcw } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface MasterAnalysisResult {
    status: string;
    results: Record<string, {
        stability: number;
        fragility: number;
        overconfidence: number;
        risk_score: number;
        risk_level: string;
    }>;
    overall_risk: number;
    overall_level: string;
    data_points: number;
    chronos_available: boolean;
}

export default function RisksPage() {
    const { data: masterData, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ["master-risk-analysis"],
        queryFn: async (): Promise<MasterAnalysisResult> => {
            const response = await fetch(`${API_BASE}/api/analyze/master`);
            if (!response.ok) throw new Error("API not available");
            return response.json();
        },
        staleTime: 60000,
    });

    const results = masterData?.results || {};
    const entries = Object.entries(results);

    const avgStability = entries.length > 0
        ? entries.reduce((acc, [_, v]) => acc + v.stability, 0) / entries.length
        : 0.78;
    const avgFragility = entries.length > 0
        ? entries.reduce((acc, [_, v]) => acc + v.fragility, 0) / entries.length
        : 0.55;
    const avgOverconfidence = entries.length > 0
        ? entries.reduce((acc, [_, v]) => acc + v.overconfidence, 0) / entries.length
        : 0.23;
    const overallRisk = masterData?.overall_risk || 0.42;

    const isOverconfident = avgStability > 0.7 && avgFragility > 0.4;

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6" />
                        Risk Analysis
                    </h1>
                    <p className="text-muted-foreground">
                        Master dataset risk assessment using time-series forecasting
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    disabled={isRefetching}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 cursor-pointer"
                >
                    <RefreshCcw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {/* Risk Gauges */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <RiskGauge label="Overall Risk" value={overallRisk} icon={Activity} color="primary" />
                        <RiskGauge label="Fragility Index" value={avgFragility} icon={AlertTriangle} color="red" />
                        <RiskGauge label="Stability Index" value={avgStability} icon={Shield} color="green" />
                        <RiskGauge label="Confidence Gap" value={avgOverconfidence} icon={TrendingUp} color="amber" />
                    </div>

                    {/* Overconfidence Alert */}
                    {isOverconfident && (
                        <div className="rounded-xl border-2 border-amber-500/50 bg-amber-500/5 p-5 animate-fade-in">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-amber-500/20">
                                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-semibold text-amber-500">
                                        ⚠️ Overconfidence Risk Detected
                                    </h2>
                                    <p className="mt-2 text-foreground/80">
                                        Your supply chain shows high stability ({(avgStability * 100).toFixed(0)}%)
                                        but elevated fragility ({(avgFragility * 100).toFixed(0)}%).
                                        This indicates hidden structural vulnerabilities.
                                    </p>
                                    <div className="mt-4">
                                        <p className="font-medium mb-2">Recommendations:</p>
                                        <ul className="space-y-2">
                                            <li className="flex items-start gap-2 text-sm">
                                                <span className="text-primary">•</span>
                                                Diversify supplier base to reduce concentration risk
                                            </li>
                                            <li className="flex items-start gap-2 text-sm">
                                                <span className="text-primary">•</span>
                                                Develop suppliers in different geographic regions
                                            </li>
                                            <li className="flex items-start gap-2 text-sm">
                                                <span className="text-primary">•</span>
                                                Conduct stress testing to identify vulnerabilities
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Detailed Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="rounded-xl border bg-card p-5">
                            <h2 className="font-semibold mb-4">Fragility Indicators</h2>
                            <div className="space-y-4">
                                {entries
                                    .filter(([k]) => k.includes("concentration") || k.includes("single"))
                                    .map(([key, metrics]) => (
                                        <MetricBar
                                            key={key}
                                            label={formatLabel(key)}
                                            value={metrics.fragility}
                                            description={`Risk: ${metrics.risk_level}`}
                                            color="red"
                                        />
                                    ))}
                                {entries.filter(([k]) => k.includes("concentration") || k.includes("single")).length === 0 && (
                                    <>
                                        <MetricBar label="Vendor Concentration" value={0.55} description="HHI Index" />
                                        <MetricBar label="Geographic Clustering" value={0.65} description="Regional dependency" />
                                        <MetricBar label="Single Points of Failure" value={0.3} description="Critical dependencies" />
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border bg-card p-5">
                            <h2 className="font-semibold mb-4">Stability Indicators</h2>
                            <div className="space-y-4">
                                {entries
                                    .filter(([k]) => k.includes("delivery") || k.includes("lead") || k.includes("reliab"))
                                    .map(([key, metrics]) => (
                                        <MetricBar
                                            key={key}
                                            label={formatLabel(key)}
                                            value={metrics.stability}
                                            description={`Risk: ${metrics.risk_level}`}
                                            color="green"
                                        />
                                    ))}
                                {entries.filter(([k]) => k.includes("delivery") || k.includes("lead") || k.includes("reliab")).length === 0 && (
                                    <>
                                        <MetricBar label="Delivery Consistency" value={0.82} description="On-time performance" color="green" />
                                        <MetricBar label="Lead Time Stability" value={0.75} description="Variance in lead times" color="green" />
                                        <MetricBar label="Supplier Reliability" value={0.88} description="Historical performance" color="green" />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-center text-sm text-muted-foreground">
                        {masterData?.data_points ? (
                            <p>Analysis based on {masterData.data_points} data points from master dataset</p>
                        ) : (
                            <p>Using synthetic master dataset for demonstration</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function formatLabel(key: string): string {
    return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function RiskGauge({ label, value, icon: Icon, color }: {
    label: string;
    value: number;
    icon: any;
    color: "primary" | "red" | "green" | "amber";
}) {
    const colorClasses = {
        primary: "text-primary bg-primary/10",
        red: "text-red-500 bg-red-500/10",
        green: "text-green-500 bg-green-500/10",
        amber: "text-amber-500 bg-amber-500/10",
    };

    return (
        <div className="rounded-xl border bg-card p-5 text-center transition-all duration-300 hover:shadow-md animate-fade-in">
            <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${colorClasses[color]}`}>
                <Icon className="w-6 h-6" />
            </div>
            <p className="mt-3 text-3xl font-bold">{(value * 100).toFixed(0)}%</p>
            <p className="text-sm text-muted-foreground">{label}</p>
        </div>
    );
}

function MetricBar({ label, value, description, color = "red" }: {
    label: string;
    value: number;
    description: string;
    color?: "red" | "green";
}) {
    const barColor = color === "green" ? "bg-green-500" : "bg-red-500";

    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{label}</span>
                <span>{(value * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${value * 100}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
    );
}
