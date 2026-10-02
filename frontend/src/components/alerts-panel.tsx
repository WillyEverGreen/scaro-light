"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock } from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Event {
    id: string;
    title: string;
    category: string;
    severity: string;
    country: string | null;
    created_at: string;
}

interface AlertsPanelProps {
    events?: Event[]; // Optional - will fetch if not provided
}

export function AlertsPanel({ events: providedEvents }: AlertsPanelProps) {
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch with time formatting
    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch events from backend if not provided
    const { data } = useQuery<Event[]>({
        queryKey: ["recent-events"],
        queryFn: async () => {
            const response = await fetch(`${API_BASE}/api/dashboard/summary`);
            if (!response.ok) throw new Error("Failed to fetch events");
            const data = await response.json();
            return data.recent_events || [];
        },
        enabled: !providedEvents, // Only fetch if events not provided
        refetchInterval: 30000, // Refresh every 30s
    });

    const events: Event[] = providedEvents ?? data ?? [];

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "critical":
                return "bg-red-500";
            case "high":
                return "bg-orange-500";
            case "medium":
                return "bg-amber-500";
            default:
                return "bg-green-500";
        }
    };

    return (
        <div className="panel-surface rounded-xl p-5 h-full card-hover">
            <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                <h2 className="font-semibold font-heading text-xl">Recent Events</h2>
            </div>

            <div className="space-y-3">
                {events.length === 0 ? (
                    <p className="text-muted-foreground text-sm animate-fade-in">No recent events</p>
                ) : (
                    events.slice(0, 5).map((event, index) => (
                        <div
                            key={event.id}
                            className={`p-3 rounded-lg border border-border/70 bg-muted/35 hover:bg-muted/60 transition-all duration-200 cursor-pointer hover:translate-x-1 animate-fade-in stagger-${Math.min(index + 1, 8)}`}
                        >
                            <div className="flex items-start gap-3">
                                <span
                                    className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(
                                        event.severity
                                    )} ${event.severity === 'critical' ? 'animate-pulse' : ''}`}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium line-clamp-2 transition-colors duration-200 hover:text-primary">
                                        {event.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                        <span className="px-1.5 py-0.5 rounded bg-background/80 border border-border/60 transition-colors duration-200 hover:bg-accent/20">
                                            {event.category}
                                        </span>
                                        {event.country && (
                                            <span className="px-1.5 py-0.5 rounded bg-background/80 border border-border/60 transition-colors duration-200 hover:bg-accent/20">
                                                {event.country}
                                            </span>
                                        )}
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {mounted ? formatTimeAgo(event.created_at) : "..."}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {events.length > 0 && (
                <Link
                    href="/dashboard/events"
                    className="group w-full mt-4 py-2 text-sm text-primary transition-all duration-200 flex items-center justify-center gap-1 font-semibold uppercase tracking-[0.08em]"
                >
                    View All Events
                    <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                </Link>
            )}
        </div>
    );
}

function formatTimeAgo(dateString: string): string {
    if (!dateString) return "Just now";

    const now = new Date();
    const date = new Date(dateString);

    // Check for invalid date
    if (isNaN(date.getTime())) {
        return "Just now";
    }

    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
}
