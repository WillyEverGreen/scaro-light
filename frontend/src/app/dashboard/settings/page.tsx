"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useMutation } from "@tanstack/react-query";
import { Moon, Sun, Monitor, Database, Server, Globe, Trash2, AlertTriangle, Loader2, Check } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const [clearStatus, setClearStatus] = useState<Record<string, string>>({});

    const connectionStatus = [
        { name: "Backend API", status: "checking", url: "localhost:8000" },
        { name: "PostgreSQL", status: "checking", url: "localhost:5432" },
        { name: "Neo4j", status: "checking", url: "localhost:7687" },
        { name: "Qdrant", status: "checking", url: "localhost:6333" },
        { name: "Redis", status: "checking", url: "localhost:6379" },
        { name: "NVIDIA NIM", status: "checking", url: "integrate.api.nvidia.com" },
    ];

    const databases = [
        { id: "memory", name: "In-Memory Cache", description: "Scraped items in memory", icon: "💾" },
        { id: "postgresql", name: "PostgreSQL", description: "Events and structured data", icon: "🐘" },
        { id: "neo4j", name: "Neo4j", description: "Supply chain graph", icon: "🔗" },
        { id: "qdrant", name: "Qdrant", description: "Vector embeddings for RAG", icon: "🎯" },
    ];

    const clearMutation = useMutation({
        mutationFn: async (dbId: string) => {
            const response = await fetch(`${API_BASE}/api/debug/database/${dbId}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to clear");
            return response.json();
        },
        onMutate: (dbId) => {
            setClearStatus((prev) => ({ ...prev, [dbId]: "clearing" }));
        },
        onSuccess: (_, dbId) => {
            setClearStatus((prev) => ({ ...prev, [dbId]: "success" }));
            setTimeout(() => {
                setClearStatus((prev) => ({ ...prev, [dbId]: "" }));
            }, 3000);
        },
        onError: (_, dbId) => {
            setClearStatus((prev) => ({ ...prev, [dbId]: "error" }));
        },
    });

    const clearAllMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`${API_BASE}/api/debug/database/all`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to clear");
            return response.json();
        },
        onMutate: () => {
            setClearStatus({ all: "clearing" });
        },
        onSuccess: () => {
            setClearStatus({ all: "success" });
            setTimeout(() => setClearStatus({}), 3000);
        },
        onError: () => {
            setClearStatus({ all: "error" });
        },
    });

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Server className="w-6 h-6" />
                    Settings
                </h1>
                <p className="text-muted-foreground">Configure Edgecase preferences</p>
            </div>

            {/* Theme */}
            <div className="rounded-xl border bg-card p-5">
                <h2 className="font-semibold mb-4">Appearance</h2>
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={() => setTheme("light")}
                        className={`p-4 rounded-lg border text-center transition-colors cursor-pointer ${theme === "light"
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                            }`}
                    >
                        <Sun className="w-6 h-6 mx-auto mb-2" />
                        <p className="text-sm font-medium">Light</p>
                    </button>
                    <button
                        onClick={() => setTheme("dark")}
                        className={`p-4 rounded-lg border text-center transition-colors cursor-pointer ${theme === "dark"
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                            }`}
                    >
                        <Moon className="w-6 h-6 mx-auto mb-2" />
                        <p className="text-sm font-medium">Dark</p>
                    </button>
                    <button
                        onClick={() => setTheme("system")}
                        className={`p-4 rounded-lg border text-center transition-colors cursor-pointer ${theme === "system"
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                            }`}
                    >
                        <Monitor className="w-6 h-6 mx-auto mb-2" />
                        <p className="text-sm font-medium">System</p>
                    </button>
                </div>
            </div>

            {/* Database Management */}
            <div className="rounded-xl border bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Trash2 className="w-5 h-5 text-red-500" />
                    <h2 className="font-semibold">Clear Databases</h2>
                </div>

                <div className="space-y-3">
                    {databases.map((db) => (
                        <div
                            key={db.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{db.icon}</span>
                                <div>
                                    <p className="font-medium">{db.name}</p>
                                    <p className="text-xs text-muted-foreground">{db.description}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => clearMutation.mutate(db.id)}
                                disabled={clearMutation.isPending && clearStatus[db.id] === "clearing"}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 disabled:opacity-50 text-sm"
                            >
                                {clearStatus[db.id] === "clearing" ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : clearStatus[db.id] === "success" ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                {clearStatus[db.id] === "success" ? "Cleared" : "Clear"}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-4 pt-4 border-t">
                    <button
                        onClick={() => clearAllMutation.mutate()}
                        disabled={clearAllMutation.isPending}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                    >
                        {clearAllMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : clearStatus.all === "success" ? (
                            <Check className="w-4 h-4" />
                        ) : (
                            <AlertTriangle className="w-4 h-4" />
                        )}
                        {clearStatus.all === "success" ? "All Cleared!" : "Clear All Databases"}
                    </button>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                        ⚠️ This action cannot be undone
                    </p>
                </div>
            </div>

            {/* Connections */}
            <div className="rounded-xl border bg-card p-5">
                <h2 className="font-semibold mb-4">Service Connections</h2>
                <div className="space-y-3">
                    {connectionStatus.map((service) => (
                        <div
                            key={service.name}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                            <div className="flex items-center gap-3">
                                {service.name === "Backend API" ? (
                                    <Server className="w-5 h-5 text-muted-foreground" />
                                ) : service.name === "NVIDIA NIM" ? (
                                    <Globe className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                    <Database className="w-5 h-5 text-muted-foreground" />
                                )}
                                <div>
                                    <p className="font-medium">{service.name}</p>
                                    <p className="text-xs text-muted-foreground">{service.url}</p>
                                </div>
                            </div>
                            <span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                                Not checked
                            </span>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                    Run <code className="px-1 py-0.5 bg-muted rounded">docker-compose up -d</code> to start services
                </p>
            </div>

            {/* About */}
            <div className="rounded-xl border bg-card p-5">
                <h2 className="font-semibold mb-4">About Edgecase</h2>
                <p className="text-sm text-muted-foreground">
                    Supply Chain Analyser for Risk and Overconfidence
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                    Version 0.1.0 • Built with Next.js, FastAPI, Neo4j, Qdrant
                </p>
            </div>
        </div>
    );
}
