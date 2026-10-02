"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock, Calendar, Filter, ArrowLeft, X, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Event {
    id: string;
    title: string;
    category: string;
    severity: string;
    country: string | null;
    created_at: string;
    content?: string;
    full_content?: string;
    url?: string;
}

export default function EventsPage() {
    const [severityFilter, setSeverityFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["all-events"],
        queryFn: async () => {
            const response = await fetch(`${API_BASE}/api/dashboard/events`);
            if (!response.ok) throw new Error("Failed to fetch events");
            const data = await response.json();
            return data.events || [];
        },
        refetchInterval: 30000,
    });

    const events: Event[] = data || [];

    // Filter events
    const filteredEvents = events.filter((event) => {
        if (severityFilter !== "all" && event.severity !== severityFilter) return false;
        if (categoryFilter !== "all" && event.category !== categoryFilter) return false;
        return true;
    });

    // Get unique categories - ensure they're strings
    const categories = Array.from(
        new Set(
            events
                .map((e) => e.category)
                .filter((cat) => cat && typeof cat === 'string')
        )
    );

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "critical":
                return "bg-red-500/20 text-red-400 border-red-500/30";
            case "high":
                return "bg-orange-500/20 text-orange-400 border-orange-500/30";
            case "medium":
                return "bg-amber-500/20 text-amber-400 border-amber-500/30";
            default:
                return "bg-green-500/20 text-green-400 border-green-500/30";
        }
    };

    const getSeverityDot = (severity: string) => {
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
        <div className="h-full flex flex-col p-6">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Calendar className="w-6 h-6" />
                            All Events
                        </h1>
                        <p className="text-muted-foreground">
                            Complete history of supply chain events
                        </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {filteredEvents.length} of {events.length} events
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6 p-4 rounded-lg border bg-card">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Severity:</label>
                    <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border bg-background text-sm cursor-pointer"
                    >
                        <option value="all">All</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Category:</label>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border bg-background text-sm cursor-pointer"
                    >
                        <option value="all">All</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {String(cat)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Events List */}
            <div className="flex-1 overflow-y-auto space-y-3">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="text-center py-12">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">No events found</p>
                    </div>
                ) : (
                    filteredEvents.map((event) => (
                        <div
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className="p-4 rounded-lg border bg-card hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/50"
                        >
                            <div className="flex items-start gap-4">
                                <span
                                    className={`w-3 h-3 rounded-full mt-1.5 ${getSeverityDot(
                                        event.severity
                                    )} ${event.severity === 'critical' ? 'animate-pulse' : ''}`}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <h3 className="font-medium text-lg">{event.title}</h3>
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(
                                                event.severity
                                            )}`}
                                        >
                                            {event.severity.toUpperCase()}
                                        </span>
                                    </div>
                                    {event.content && (
                                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                            {event.content}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="px-2 py-1 rounded bg-muted">
                                            {event.category}
                                        </span>
                                        {event.country && (
                                            <span className="px-2 py-1 rounded bg-muted">
                                                {event.country}
                                            </span>
                                        )}
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(event.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Article Modal */}
            {selectedEvent && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedEvent(null)}
                >
                    <div
                        className="bg-card border rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b flex items-start justify-between">
                            <div className="flex-1 pr-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span
                                        className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(
                                            selectedEvent.severity
                                        )}`}
                                    >
                                        {selectedEvent.severity.toUpperCase()}
                                    </span>
                                    <span className="px-2 py-1 rounded bg-muted text-xs">
                                        {selectedEvent.category}
                                    </span>
                                    {selectedEvent.country && (
                                        <span className="px-2 py-1 rounded bg-muted text-xs">
                                            {selectedEvent.country}
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-xl font-bold">{selectedEvent.title}</h2>
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    {new Date(selectedEvent.created_at).toLocaleString()}
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <p className="whitespace-pre-wrap">
                                    {selectedEvent.full_content || selectedEvent.content || "No content available"}
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        {selectedEvent.url && (
                            <div className="p-4 border-t">
                                <a
                                    href={selectedEvent.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    View Original Article
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
