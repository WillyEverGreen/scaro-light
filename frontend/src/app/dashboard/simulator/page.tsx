"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Play, Activity, Globe, Zap, AlertTriangle, ArrowRight } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function SimulatorPage() {
    const [eventType, setEventType] = useState("Port Strike");
    const [target, setTarget] = useState("Singapore");

    const mutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`${API_BASE}/api/risk/ripple-effect?event_type=${eventType}&source_country=${target}`, {
                method: "POST",
            });
            return response.json();
        },
    });

    const result = mutation.data;

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Zap className="w-8 h-8 text-amber-500" />
                    Shock Simulator
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Predict the cascading butterfly effect of supply chain disruptions before they happen.
                </p>
            </div>

            {/* Controls */}
            <div className="p-6 rounded-xl border bg-card shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Disruption Event</label>
                        <select
                            className="w-full p-2 rounded-md border bg-background"
                            value={eventType}
                            onChange={(e) => setEventType(e.target.value)}
                        >
                            <option>Port Strike</option>
                            <option>Earthquake</option>
                            <option>Trade Sanction</option>
                            <option>Cyber Attack</option>
                            <option>Supplier Bankruptcy</option>
                            <option>Raw Material Shortage</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Target Location / Entity</label>
                        <input
                            type="text"
                            className="w-full p-2 rounded-md border bg-background"
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            placeholder="e.g. Shanghai, Nvidia, Panama Canal"
                        />
                    </div>

                    <button
                        onClick={() => mutation.mutate()}
                        disabled={mutation.isPending}
                        className="w-full py-2 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                        {mutation.isPending ? (
                            <Activity className="w-4 h-4 animate-spin" />
                        ) : (
                            <Play className="w-4 h-4" />
                        )}
                        {mutation.isPending ? "Simulating..." : "Run Simulation"}
                    </button>
                </div>
            </div>

            {/* Results */}
            {result && (
                <div className="space-y-6 animate-fade-in">

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl border bg-red-500/5 border-red-500/20">
                            <p className="text-sm text-muted-foreground">Total Impact Score</p>
                            <p className="text-3xl font-bold text-red-500">{(result.total_impact_score * 100).toFixed(0)}/100</p>
                        </div>
                        <div className="p-4 rounded-xl border bg-amber-500/5 border-amber-500/20">
                            <p className="text-sm text-muted-foreground">Cascade Depth</p>
                            <p className="text-3xl font-bold text-amber-500">{result.cascade_depth} Levels</p>
                        </div>
                        <div className="p-4 rounded-xl border bg-blue-500/5 border-blue-500/20">
                            <p className="text-sm text-muted-foreground">Affected Countries</p>
                            <p className="text-3xl font-bold text-blue-500">{result.affected_countries?.length || 0}</p>
                        </div>
                    </div>

                    {/* AI Explanation */}
                    <div className="p-6 rounded-xl border bg-muted/30">
                        <h3 className="font-semibold flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-primary" />
                            AI Analysis
                        </h3>
                        <p className="text-foreground/80 leading-relaxed">
                            {result.ai_explanation}
                        </p>
                    </div>

                    {/* Cascade Timeline */}
                    <div>
                        <h3 className="text-xl font-bold mb-4">Propagation Path</h3>
                        <div className="space-y-4">
                            {result.affected_vendors?.map((vendor: any, i: number) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold">{vendor.name}</h4>
                                        <p className="text-sm text-muted-foreground">{vendor.role}</p>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium">
                                        <AlertTriangle className="w-3 h-3" />
                                        {vendor.delay_days} Day Delay
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground/30" />
                                    <span className="text-sm font-medium px-2 py-1 bg-muted rounded">
                                        {vendor.impact} Impact
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
