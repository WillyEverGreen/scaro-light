"use client";

import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface RiskScoreCardProps {
    title: string;
    value: string | number;
    subtitle: string;
    icon: LucideIcon;
    trend?: ReactNode;
    colorClass?: string;
}

export function RiskScoreCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    colorClass = "bg-card",
}: RiskScoreCardProps) {
    return (
        <div
            className={`group panel-surface p-5 rounded-xl border ${colorClass} card-hover cursor-pointer`}
        >
            <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-primary/12 border border-primary/25 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-2">
                    <Icon className="w-5 h-5 text-primary" />
                </div>
                {trend && <div className="transition-transform duration-300 group-hover:scale-105">{trend}</div>}
            </div>

            <div className="mt-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold transition-colors duration-200">{title}</p>
                <p className="text-3xl font-bold mt-1 transition-all duration-300 group-hover:tracking-[0.02em] font-heading">{value}</p>
                <p className="text-xs text-muted-foreground mt-1 transition-colors duration-200 font-medium">{subtitle}</p>
            </div>
        </div>
    );
}
