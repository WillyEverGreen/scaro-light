"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import {
    Database,
    Play,
    Pause,
    RefreshCcw,
    Search,
    ExternalLink,
    Sparkles,
    Loader2,
    Clock,
    Globe,
    Package,
    Eye,
    EyeOff,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Strip <think> blocks from AI output and optionally extract them
 */
function processAIOutput(text: string): { content: string; thinking: string } {
    const thinkRegex = /<think>([\s\S]*?)<\/think>/gi;
    let thinking = "";

    // Extract all think blocks
    const matches = text.matchAll(thinkRegex);
    for (const match of matches) {
        thinking += match[1].trim() + "\n\n";
    }

    // Remove think blocks from content
    const content = text.replace(thinkRegex, "").trim();

    return { content, thinking: thinking.trim() };
}

interface DataItem {
    id: string;
    title: string;
    content: string;
    url: string;
    source: string;
    source_name: string;
    countries: string[];
    commodities: string[];
    category: string | null;
    severity: string | null;
    risk_score: number;
    ai_summary: string | null;
    scraped_at: string | null;
    processed_at: string | null;
}

export default function DebugPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSource, setSelectedSource] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedItem, setSelectedItem] = useState<DataItem | null>(null);
    const [interpretation, setInterpretation] = useState<string>("");
    const [showThinking, setShowThinking] = useState(false);

    // Fetch pipeline stats
    const { data: stats, refetch: refetchStats } = useQuery({
        queryKey: ["debug-stats"],
        queryFn: async () => {
            const response = await fetch(`${API_BASE}/api/debug/stats`);
            if (!response.ok) throw new Error("Failed to fetch stats");
            return response.json();
        },
        refetchInterval: 5000,
    });

    // Fetch items
    const { data: itemsData, refetch: refetchItems } = useQuery({
        queryKey: ["debug-items", searchQuery, selectedSource, selectedCategory],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (searchQuery) params.set("query", searchQuery);
            if (selectedSource) params.set("source", selectedSource);
            if (selectedCategory) params.set("category", selectedCategory);
            params.set("limit", "100");

            const response = await fetch(`${API_BASE}/api/debug/items?${params}`);
            if (!response.ok) throw new Error("Failed to fetch items");
            return response.json();
        },
        refetchInterval: 10000,
    });

    // Fetch available filters
    const { data: sources } = useQuery({
        queryKey: ["debug-sources"],
        queryFn: async () => {
            const response = await fetch(`${API_BASE}/api/debug/sources`);
            if (!response.ok) return { sources: [], categories: [], countries: [] };
            return response.json();
        },
    });

    // Scheduler control
    const schedulerMutation = useMutation({
        mutationFn: async (action: string) => {
            const response = await fetch(`${API_BASE}/api/debug/scheduler/control`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });
            return response.json();
        },
        onSuccess: () => {
            refetchStats();
        },
    });

    // AI interpretation
    const interpretMutation = useMutation({
        mutationFn: async (itemId: string) => {
            const response = await fetch(`${API_BASE}/api/debug/interpret/${itemId}`, {
                method: "POST",
            });
            if (!response.ok) throw new Error("Interpretation failed");
            return response.json();
        },
        onSuccess: (data) => {
            setInterpretation(data.interpretation);
        },
    });

    const items = itemsData?.items || [];
    const isSchedulerRunning = stats?.scheduler?.is_running;

    const getSeverityColor = (severity: string | null) => {
        switch (severity) {
            case "critical": return "bg-red-500";
            case "high": return "bg-orange-500";
            case "medium": return "bg-amber-500";
            case "low": return "bg-green-500";
            default: return "bg-gray-400";
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Database className="w-6 h-6" />
                        Data Browser
                    </h1>
                    <p className="text-muted-foreground">
                        View and search scraped data, manage the pipeline
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            refetchStats();
                            refetchItems();
                        }}
                        className="p-2 rounded-lg border bg-muted hover:bg-muted/80 cursor-pointer transition-colors"
                    >
                        <RefreshCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border bg-card">
                    <p className="text-sm text-muted-foreground">Total Items</p>
                    <p className="text-2xl font-bold">{stats?.data_store?.total_items || 0}</p>
                </div>
                <div className="p-4 rounded-xl border bg-card">
                    <p className="text-sm text-muted-foreground">Scraping Runs</p>
                    <p className="text-2xl font-bold">{stats?.scheduler?.total_runs || 0}</p>
                </div>
                <div className="p-4 rounded-xl border bg-card">
                    <p className="text-sm text-muted-foreground">Items Processed</p>
                    <p className="text-2xl font-bold">{stats?.scheduler?.total_items_processed || 0}</p>
                </div>
                <div className="p-4 rounded-xl border bg-card">
                    <p className="text-sm text-muted-foreground">Errors</p>
                    <p className="text-2xl font-bold">{stats?.scheduler?.total_errors || 0}</p>
                </div>
            </div>

            {/* Scheduler Controls */}
            <div className="flex items-center gap-4 p-4 rounded-xl border bg-card">
                <div className="flex items-center gap-2">
                    <span
                        className={`w-3 h-3 rounded-full ${isSchedulerRunning
                            ? "bg-green-500 animate-pulse"
                            : "bg-gray-400"
                            }`}
                    />
                    <span className="font-medium">
                        Scheduler: {isSchedulerRunning ? "Running" : "Stopped"}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {isSchedulerRunning ? (
                        <button
                            onClick={() => schedulerMutation.mutate("stop")}
                            disabled={schedulerMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                        >
                            <Pause className="w-4 h-4" />
                            Stop
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => schedulerMutation.mutate("start")}
                                disabled={schedulerMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground border border-primary hover:bg-primary/90 cursor-pointer transition-colors"
                            >
                                <Play className="w-4 h-4" />
                                Start Continuous
                            </button>
                            <button
                                onClick={() => schedulerMutation.mutate("run_once")}
                                disabled={schedulerMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-foreground border border-border hover:bg-muted/80 cursor-pointer transition-colors"
                            >
                                <RefreshCcw className="w-4 h-4" />
                                Run Once
                            </button>
                        </>
                    )}
                </div>
                {stats?.scheduler?.last_run && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Last run: {new Date(stats.scheduler.last_run).toLocaleTimeString()}
                    </div>
                )}
            </div>

            {/* Search & Filters */}
            <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search scraped data..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted border-none outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <select
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-muted border-none outline-none"
                >
                    <option value="">All Sources</option>
                    {sources?.sources?.map((s: string) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-muted border-none outline-none"
                >
                    <option value="">All Categories</option>
                    {sources?.categories?.map((c: string) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            {/* Data Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Items List */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {items.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            No data found. Start the scraper to gather data.
                        </div>
                    ) : (
                        items.map((item: DataItem) => (
                            <div
                                key={item.id}
                                onClick={() => {
                                    setSelectedItem(item);
                                    setInterpretation("");
                                }}
                                className={`p-4 m-[10px] rounded-xl border bg-card cursor-pointer transition-all hover:shadow-lg ${selectedItem?.id === item.id
                                    ? "ring-2 ring-primary border-primary"
                                    : "hover:border-primary/50"
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <span className={`w-2 h-2 mt-2 rounded-full ${getSeverityColor(item.severity)}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium line-clamp-2">{item.title}</p>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                            <span className="px-1.5 py-0.5 rounded bg-muted">{item.source}</span>
                                            {item.category && (
                                                <span className="px-1.5 py-0.5 rounded bg-muted">{item.category}</span>
                                            )}
                                            {item.countries.length > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <Globe className="w-3 h-3" />
                                                    {item.countries.slice(0, 2).map((c: any) => typeof c === 'string' ? c : c.name).join(", ")}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {item.risk_score ? `${(item.risk_score * 100).toFixed(0)}%` : ""}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Detail Panel */}
                <div className="rounded-xl border bg-card p-5 h-fit sticky top-6">
                    {selectedItem ? (
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-lg">{selectedItem.title}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`px-2 py-0.5 rounded text-xs text-white ${getSeverityColor(selectedItem.severity)}`}>
                                        {selectedItem.severity || "unknown"}
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-xs bg-muted">
                                        {selectedItem.source_name}
                                    </span>
                                    {selectedItem.url && (
                                        <a
                                            href={selectedItem.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline text-xs flex items-center gap-1"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            Source
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Content</p>
                                <p className="text-sm">{selectedItem.content || "No content"}</p>
                            </div>

                            {selectedItem.countries.length > 0 && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                        <Globe className="w-4 h-4" /> Countries
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedItem.countries.map((c: any, i: number) => {
                                            const label = typeof c === 'string' ? c : c.name || JSON.stringify(c);
                                            return <span key={i} className="px-2 py-0.5 rounded bg-muted text-xs">{label}</span>;
                                        })}
                                    </div>
                                </div>
                            )}

                            {selectedItem.commodities.length > 0 && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                        <Package className="w-4 h-4" /> Commodities
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedItem.commodities.map((c: any, i: number) => {
                                            const label = typeof c === 'string' ? c : c.name || JSON.stringify(c);
                                            return <span key={i} className="px-2 py-0.5 rounded bg-muted text-xs">{label}</span>;
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t">
                                <button
                                    onClick={() => interpretMutation.mutate(selectedItem.id)}
                                    disabled={interpretMutation.isPending}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-primary bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground w-full justify-center cursor-pointer transition-all font-medium"
                                >
                                    {interpretMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-4 h-4" />
                                    )}
                                    AI Interpretation
                                </button>

                                {interpretation && (() => {
                                    const { content, thinking } = processAIOutput(interpretation);
                                    return (
                                        <div className="mt-4 space-y-3">
                                            <div className="p-4 rounded-lg bg-muted/50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-sm font-medium flex items-center gap-2">
                                                        <Sparkles className="w-4 h-4 text-primary" />
                                                        AI Analysis
                                                    </p>
                                                    {thinking && (
                                                        <button
                                                            onClick={() => setShowThinking(!showThinking)}
                                                            className="text-xs flex items-center gap-1 px-2 py-1 rounded-md border bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
                                                        >
                                                            {showThinking ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                            {showThinking ? "Hide" : "Show"} Thinking
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                                    <ReactMarkdown>{content}</ReactMarkdown>
                                                </div>
                                            </div>

                                            {thinking && showThinking && (
                                                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2">
                                                        💭 AI Reasoning (Think Block)
                                                    </p>
                                                    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                                                        <ReactMarkdown>{thinking}</ReactMarkdown>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            Select an item to view details
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
