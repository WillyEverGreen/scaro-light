"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

// Mock data for the chart
const mockChartData = [
    { date: "Jan", overall: 35, fragility: 42, stability: 78 },
    { date: "Feb", overall: 38, fragility: 45, stability: 75 },
    { date: "Mar", overall: 45, fragility: 52, stability: 70 },
    { date: "Apr", overall: 42, fragility: 48, stability: 72 },
    { date: "May", overall: 48, fragility: 55, stability: 68 },
    { date: "Jun", overall: 52, fragility: 58, stability: 65 },
    { date: "Jul", overall: 48, fragility: 55, stability: 70 },
    { date: "Aug", overall: 45, fragility: 50, stability: 72 },
    { date: "Sep", overall: 42, fragility: 48, stability: 75 },
    { date: "Oct", overall: 40, fragility: 45, stability: 78 },
    { date: "Nov", overall: 38, fragility: 42, stability: 80 },
    { date: "Dec", overall: 42, fragility: 48, stability: 76 },
];

export function RiskChart() {
    return (
        <div className="panel-surface rounded-xl p-5 card-hover animate-fade-in">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold font-heading text-xl">Risk Trend Analysis</h2>
                <select
                    title="Select trend time range"
                    aria-label="Select trend time range"
                    className="text-sm px-3 py-1.5 rounded-lg bg-muted/60 border border-border/70 outline-none cursor-pointer transition-all duration-200 hover:bg-accent/20 focus:ring-2 focus:ring-primary/50"
                >
                    <option value="12m">Last 12 Months</option>
                    <option value="6m">Last 6 Months</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="7d">Last 7 Days</option>
                </select>
            </div>

            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                            axisLine={{ stroke: "hsl(var(--border))" }}
                        />
                        <YAxis
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                            axisLine={{ stroke: "hsl(var(--border))" }}
                            domain={[0, 100]}
                            tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "hsl(var(--card) / 0.98)",
                                border: "1px solid hsl(var(--border) / 0.9)",
                                borderRadius: "0.5rem",
                            }}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="overall"
                            name="Overall Risk"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="fragility"
                            name="Fragility"
                            stroke="#ef4444"
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="stability"
                            name="Stability"
                            stroke="#22c55e"
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
