"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
    CloudRain,
    AlertTriangle,
    Lightbulb,
    Activity,
    ChevronRight,
    Bell,
    Globe,
    Shield
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Reminder {
    id: string;
    type: "weather" | "risk" | "insight" | "system" | "geopolitical" | "route";
    priority: "high" | "medium" | "low";
    title: string;
    message: string;
    action: string;
    link: string;
}

export function RemindersWidget() {
    const { data, isLoading } = useQuery({
        queryKey: ["smart-reminders"],
        queryFn: async () => {
            const response = await fetch(`${API_BASE}/api/dashboard/reminders`);
            if (!response.ok) throw new Error("Failed to fetch reminders");
            return response.json();
        },
        refetchInterval: 60000, // Refresh every minute
    });

    const reminders: Reminder[] = data?.reminders || [];

    const getIcon = (type: string) => {
        switch (type) {
            case "weather": return <CloudRain className="w-5 h-5" />;
            case "risk": return <AlertTriangle className="w-5 h-5" />;
            case "geopolitical": return <Shield className="w-5 h-5" />;
            case "route": return <Globe className="w-5 h-5" />;
            case "insight": return <Lightbulb className="w-5 h-5" />;
            case "system": return <Activity className="w-5 h-5" />;
            default: return <Bell className="w-5 h-5" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high": return "border-red-500/30 bg-red-500/5";
            case "medium": return "border-amber-500/30 bg-amber-500/5";
            case "low": return "border-blue-500/30 bg-blue-500/5";
            default: return "border-border bg-card";
        }
    };

    const getIconColor = (type: string, priority: string) => {
        if (priority === "high") return "text-red-500";
        if (priority === "medium") return "text-amber-500";

        switch (type) {
            case "weather": return "text-blue-500";
            case "risk": return "text-orange-500";
            case "geopolitical": return "text-red-600";
            case "route": return "text-cyan-500";
            case "insight": return "text-purple-500";
            case "system": return "text-green-500";
            default: return "text-primary";
        }
    };

    return (
        <div className="panel-surface rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold font-heading text-xl flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Smart Reminders
                </h2>
                {reminders.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/14 border border-primary/30 text-primary text-xs font-semibold uppercase tracking-[0.08em]">
                        {reminders.length}
                    </span>
                )}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
            ) : reminders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">All clear. No urgent reminders.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {reminders.map((reminder) => (
                        <Link
                            key={reminder.id}
                            href={reminder.link}
                            className={`block p-3 rounded-lg border transition-all hover:translate-x-1 ${getPriorityColor(reminder.priority)}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg border border-border/50 bg-background/60 ${getIconColor(reminder.type, reminder.priority)}`}>
                                    {getIcon(reminder.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm mb-1">{reminder.title}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {reminder.message}
                                    </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
