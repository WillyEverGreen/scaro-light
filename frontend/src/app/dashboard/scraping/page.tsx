"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Play,
    Pause,
    RefreshCcw,
    CheckCircle,
    XCircle,
    Loader2,
    Search,
    Newspaper,
    CloudSun,
    Ban,
    Rss,
    Globe,
    Plus,
    Trash2,
    Activity,
    TrendingUp,
    Clock,
    AlertTriangle,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FeedInfo {
    name: string;
    category: string;
    priority: number;
    enabled: boolean;
    articles_scraped: number;
    last_poll: string | null;
    errors: number;
    avg_per_poll: number;
}

interface ActivityItem {
    title: string;
    source: string;
    category: string;
    scraped_at: string | null;
    risk_score: number;
}

export default function ScrapingPage() {
    const [keywords, setKeywords] = useState(
        "supply chain disruption, semiconductor shortage, port congestion, trade sanctions"
    );
    const [isContinuous, setIsContinuous] = useState(false);
    const [newFeedName, setNewFeedName] = useState("");
    const [newFeedUrl, setNewFeedUrl] = useState("");
    const [showAddFeed, setShowAddFeed] = useState(false);
    const queryClient = useQueryClient();

    // Fetch scraping status
    const { data: status, refetch: refetchStatus } = useQuery({
        queryKey: ["scraping-status"],
        queryFn: async () => {
            try {
                const response = await fetch(`${API_BASE}/api/scraping/status`);
                if (!response.ok) throw new Error("API not available");
                return response.json();
            } catch {
                return { status: "idle", active_jobs: 0, jobs: [] };
            }
        },
        refetchInterval: 5000,
    });

    // Fetch feed stats
    const { data: feedStats } = useQuery({
        queryKey: ["feed-stats"],
        queryFn: async () => {
            try {
                const response = await fetch(`${API_BASE}/api/scraping/feeds`);
                if (!response.ok) throw new Error("API not available");
                return response.json();
            } catch {
                return { feeds: [], is_running: false, total_articles: 0 };
            }
        },
        refetchInterval: 10000,
    });

    // Fetch activity log
    const { data: activity } = useQuery({
        queryKey: ["scraping-activity"],
        queryFn: async () => {
            try {
                const response = await fetch(`${API_BASE}/api/scraping/activity`);
                if (!response.ok) throw new Error("API not available");
                return response.json();
            } catch {
                return { recent_items: [], is_polling: false };
            }
        },
        refetchInterval: 5000,
    });

    // Fetch crawl stats
    const { data: crawlStats } = useQuery({
        queryKey: ["crawl-stats"],
        queryFn: async () => {
            try {
                const response = await fetch(`${API_BASE}/api/scraping/crawl/stats`);
                if (!response.ok) return null;
                return response.json();
            } catch {
                return null;
            }
        },
        refetchInterval: 10000,
    });

    // Start scraping mutation
    const startMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`${API_BASE}/api/scraping/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sources: ["all"],
                    keywords: keywords.split(",").map((k) => k.trim()),
                    max_items: 100,
                    continuous: isContinuous,
                }),
            });
            return response.json();
        },
        onSuccess: () => refetchStatus(),
    });

    // Stop all mutation
    const stopMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`${API_BASE}/api/scraping/stop-all`, { method: "POST" });
            return response.json();
        },
        onSuccess: () => refetchStatus(),
    });

    // Trigger crawl mutation
    const crawlMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`${API_BASE}/api/scraping/crawl`, { method: "POST" });
            return response.json();
        },
    });

    // Add feed mutation
    const addFeedMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(
                `${API_BASE}/api/scraping/feeds?name=${encodeURIComponent(newFeedName)}&url=${encodeURIComponent(newFeedUrl)}`,
                { method: "POST" }
            );
            return response.json();
        },
        onSuccess: () => {
            setNewFeedName("");
            setNewFeedUrl("");
            setShowAddFeed(false);
            queryClient.invalidateQueries({ queryKey: ["feed-stats"] });
        },
    });

    // Remove feed mutation
    const removeFeedMutation = useMutation({
        mutationFn: async (feedName: string) => {
            const response = await fetch(`${API_BASE}/api/scraping/feeds/${encodeURIComponent(feedName)}`, {
                method: "DELETE",
            });
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["feed-stats"] });
        },
    });

    const feeds: FeedInfo[] = feedStats?.feeds || [];
    const recentItems: ActivityItem[] = activity?.recent_items || [];
    const isPolling = feedStats?.is_running || false;

    const getRiskColor = (score: number) => {
        if (score >= 0.7) return "text-red-500 bg-red-500/10";
        if (score >= 0.5) return "text-orange-500 bg-orange-500/10";
        if (score >= 0.3) return "text-yellow-500 bg-yellow-500/10";
        return "text-green-500 bg-green-500/10";
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Rss className="w-6 h-6" />
                        Scraping Control
                    </h1>
                    <p className="text-muted-foreground">
                        RSS feeds, auto-crawling, and search engine scraping
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Status indicator */}
                    {isPolling ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-green-500/10 text-green-500">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Polling Active
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => startMutation.mutate()}
                                disabled={startMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground cursor-pointer transition-all font-medium"
                            >
                                <Play className="w-4 h-4" />
                                Start Continuous
                            </button>
                            <button
                                onClick={() => crawlMutation.mutate()}
                                disabled={crawlMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-muted text-foreground hover:bg-muted/80 cursor-pointer transition-colors"
                            >
                                <RefreshCcw className="w-4 h-4" />
                                Run Once
                            </button>
                        </>
                    )}

                    <button
                        onClick={() => stopMutation.mutate()}
                        disabled={stopMutation.isPending}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Pause className="w-4 h-4" />
                        Stop All
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-card border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                            <Rss className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{feeds.length}</p>
                            <p className="text-sm text-muted-foreground">RSS Feeds</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-card border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10">
                            <Newspaper className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{feedStats?.total_articles || 0}</p>
                            <p className="text-sm text-muted-foreground">Articles Scraped</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-card border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                            <Globe className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{crawlStats?.pages_crawled || 0}</p>
                            <p className="text-sm text-muted-foreground">Pages Crawled</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-card border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/10">
                            <Activity className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{feedStats?.poll_count || 0}</p>
                            <p className="text-sm text-muted-foreground">Poll Cycles</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-2 gap-6">
                {/* RSS Feeds Panel */}
                <div className="p-4 rounded-xl bg-card border">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Rss className="w-5 h-5 text-orange-500" />
                            RSS Feeds ({feeds.length})
                        </h2>
                        <button
                            onClick={() => setShowAddFeed(!showAddFeed)}
                            className="p-1.5 rounded-lg border hover:bg-muted transition-colors cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Add Feed Form */}
                    {showAddFeed && (
                        <div className="mb-4 p-3 rounded-lg bg-muted/50 space-y-2">
                            <input
                                type="text"
                                placeholder="Feed name"
                                value={newFeedName}
                                onChange={(e) => setNewFeedName(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-background border text-sm"
                            />
                            <input
                                type="url"
                                placeholder="RSS feed URL"
                                value={newFeedUrl}
                                onChange={(e) => setNewFeedUrl(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-background border text-sm"
                            />
                            <button
                                onClick={() => addFeedMutation.mutate()}
                                disabled={!newFeedName || !newFeedUrl || addFeedMutation.isPending}
                                className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50"
                            >
                                Add Feed
                            </button>
                        </div>
                    )}

                    {/* Feeds List */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {feeds.slice(0, 10).map((feed) => (
                            <div key={feed.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${feed.errors > 0 ? "bg-red-500" :
                                        feed.articles_scraped > 0 ? "bg-green-500" : "bg-muted-foreground"
                                        }`} />
                                    <div>
                                        <p className="text-sm font-medium">{feed.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {feed.articles_scraped} articles • {feed.category}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeFeedMutation.mutate(feed.name)}
                                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-red-500 transition-opacity"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        {feeds.length > 10 && (
                            <p className="text-xs text-muted-foreground text-center py-2">
                                +{feeds.length - 10} more feeds
                            </p>
                        )}
                    </div>
                </div>

                {/* Auto-Crawl Panel */}
                <div className="p-4 rounded-xl bg-card border">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Globe className="w-5 h-5 text-blue-500" />
                            Auto-Crawl
                        </h2>
                        <button
                            onClick={() => crawlMutation.mutate()}
                            disabled={crawlMutation.isPending}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
                        >
                            {crawlMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Play className="w-4 h-4" />
                            )}
                            Start Crawl
                        </button>
                    </div>

                    {/* Crawl Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xl font-bold">{crawlStats?.articles_found || 0}</p>
                            <p className="text-xs text-muted-foreground">Articles Found</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xl font-bold">{crawlStats?.articles_processed || 0}</p>
                            <p className="text-xs text-muted-foreground">Processed</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xl font-bold">{crawlStats?.visited_urls || 0}</p>
                            <p className="text-xs text-muted-foreground">URLs Visited</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xl font-bold">{crawlStats?.errors || 0}</p>
                            <p className="text-xs text-muted-foreground">Errors</p>
                        </div>
                    </div>

                    {/* Seed Sites */}
                    <div className="mt-4">
                        <p className="text-xs text-muted-foreground mb-2">Seed Sites:</p>
                        <div className="flex flex-wrap gap-1">
                            {["Reuters", "Supply Chain Dive", "TheLoadstar", "FreightWaves", "SemiEngineering"].map((site) => (
                                <span key={site} className="px-2 py-0.5 bg-muted text-xs rounded-full">
                                    {site}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Activity Log */}
            <div className="p-4 rounded-xl bg-card border">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold flex items-center gap-2">
                        <Activity className="w-5 h-5 text-green-500" />
                        Live Activity
                    </h2>
                    <button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ["scraping-activity"] })}
                        className="p-1.5 rounded-lg border hover:bg-muted transition-colors cursor-pointer"
                    >
                        <RefreshCcw className="w-4 h-4" />
                    </button>
                </div>

                {/* Recent Items */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {recentItems.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No recent activity</p>
                            <p className="text-sm">Articles will appear here as they are scraped</p>
                        </div>
                    ) : (
                        recentItems.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{item.title}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{item.source}</span>
                                        <span>•</span>
                                        <span className="capitalize">{item.category || "other"}</span>
                                        {item.scraped_at && (
                                            <>
                                                <span>•</span>
                                                <Clock className="w-3 h-3" />
                                                <span>{new Date(item.scraped_at).toLocaleTimeString()}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(item.risk_score)}`}>
                                    {(item.risk_score * 100).toFixed(0)}%
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    );
}
