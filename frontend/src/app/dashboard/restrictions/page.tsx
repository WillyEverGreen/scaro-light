"use client";

import { useQuery } from "@tanstack/react-query";
import { Ban, AlertTriangle, ArrowRight, ExternalLink } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Mock trade restrictions data
const mockRestrictions = [
    {
        id: "1",
        source_country: "USA",
        target_country: "CHN",
        type: "export_control",
        description: "US semiconductor export controls - advanced chips and manufacturing equipment",
        severity: 0.9,
        commodities: ["Semiconductors", "AI Chips", "EUV Lithography"],
        is_active: true,
    },
    {
        id: "2",
        source_country: "USA",
        target_country: "RUS",
        type: "sanction",
        description: "Comprehensive US sanctions on Russia",
        severity: 0.95,
        commodities: ["Technology", "Energy Equipment", "Financial Services"],
        is_active: true,
    },
    {
        id: "3",
        source_country: "NLD",
        target_country: "CHN",
        type: "export_control",
        description: "Netherlands ASML export restrictions - advanced lithography machines",
        severity: 0.85,
        commodities: ["EUV Lithography Machines"],
        is_active: true,
    },
    {
        id: "4",
        source_country: "USA",
        target_country: "IRN",
        type: "sanction",
        description: "US sanctions on Iran - oil and financial restrictions",
        severity: 0.9,
        commodities: ["Oil", "Petroleum", "Financial Services"],
        is_active: true,
    },
    {
        id: "5",
        source_country: "JPN",
        target_country: "CHN",
        type: "export_control",
        description: "Japan semiconductor equipment export restrictions",
        severity: 0.8,
        commodities: ["Semiconductor Manufacturing Equipment"],
        is_active: true,
    },
];

export default function RestrictionsPage() {
    const { data } = useQuery({
        queryKey: ["trade-restrictions"],
        queryFn: async () => {
            try {
                const response = await fetch(`${API_BASE}/api/risk/country-restrictions`);
                if (!response.ok) throw new Error("API not available");
                return response.json();
            } catch {
                return { restrictions: mockRestrictions };
            }
        },
    });

    const restrictions = data?.restrictions || mockRestrictions;

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            sanction: "Sanction",
            export_control: "Export Control",
            tariff: "Tariff",
            embargo: "Embargo",
        };
        return labels[type] || type;
    };

    const getSeverityColor = (severity: number) => {
        if (severity >= 0.8) return "bg-red-500";
        if (severity >= 0.6) return "bg-orange-500";
        if (severity >= 0.4) return "bg-amber-500";
        return "bg-green-500";
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Ban className="w-6 h-6" />
                    Trade Restrictions
                </h1>
                <p className="text-muted-foreground">
                    Active sanctions, export controls, and trade barriers
                </p>
            </div>

            {/* Summary */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                <Ban className="w-5 h-5 text-red-500" />
                <p>
                    <span className="font-medium">{restrictions.length}</span> active
                    trade restrictions affecting supply chains
                </p>
            </div>

            {/* Restrictions List */}
            <div className="space-y-4">
                {restrictions.map((restriction: any) => (
                    <div
                        key={restriction.id}
                        className="rounded-xl border bg-card p-5 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                {/* Country Flow */}
                                <div className="flex items-center gap-2 text-lg font-semibold">
                                    <span className="px-2 py-1 rounded bg-muted">
                                        {restriction.source_country}
                                    </span>
                                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                                    <span className="px-2 py-1 rounded bg-muted">
                                        {restriction.target_country}
                                    </span>
                                </div>

                                {/* Type Badge */}
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                    {getTypeLabel(restriction.type)}
                                </span>
                            </div>

                            {/* Severity */}
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Severity</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span
                                        className={`w-3 h-3 rounded-full ${getSeverityColor(
                                            restriction.severity
                                        )}`}
                                    />
                                    <span className="font-bold">
                                        {(restriction.severity * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        <p className="mt-3 text-foreground/80">{restriction.description}</p>

                        {/* Affected Commodities */}
                        <div className="mt-3 flex flex-wrap gap-2">
                            {restriction.commodities.map((commodity: string) => (
                                <span
                                    key={commodity}
                                    className="px-2 py-1 rounded-lg bg-muted text-xs"
                                >
                                    {commodity}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
