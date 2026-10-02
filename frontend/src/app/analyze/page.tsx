"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import {
    Upload,
    FileSpreadsheet,
    AlertTriangle,
    Shield,
    TrendingUp,
    Loader2,
    CheckCircle2,
    XCircle,
    BarChart3,
    Info,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ColumnResult {
    classification: string;
    stability: number;
    fragility: number;
    overconfidence: number;
    risk_score: number;
    risk_level: string;
}

interface AnalysisResult {
    status: string;
    job_id: string;
    signals_analyzed: string[];
    results: Record<string, ColumnResult>;
    skipped: Record<string, string>;
    overall_risk: number;
    overall_level: string;
    chronos_available: boolean;
}

export default function AnalyzePage() {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [result, setResult] = useState<AnalysisResult | null>(null);

    const analyzeMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(`${API_BASE}/api/analyze/upload`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Analysis failed");
            }

            return response.json() as Promise<AnalysisResult>;
        },
        onSuccess: (data) => setResult(data),
    });

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.name.endsWith(".csv")) {
                setSelectedFile(file);
                setResult(null);
            }
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleAnalyze = () => {
        if (selectedFile) {
            analyzeMutation.mutate(selectedFile);
        }
    };

    const getRiskColor = (level: string) => {
        switch (level.toUpperCase()) {
            case "LOW":
                return "text-green-500 bg-green-500/10";
            case "MEDIUM":
                return "text-amber-500 bg-amber-500/10";
            case "HIGH":
                return "text-red-500 bg-red-500/10";
            default:
                return "text-gray-500 bg-gray-500/10";
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BarChart3 className="w-7 h-7 text-primary" />
                    Dataset Risk Analysis
                </h1>
                <p className="text-muted-foreground mt-1">
                    Upload any supply chain CSV to analyze for overconfidence risk using AI-powered forecasting
                </p>
            </div>

            {/* Info Card */}
            <div className="rounded-xl border bg-primary/5 p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-sm">
                    <p className="font-medium">How it works:</p>
                    <ul className="mt-1 space-y-1 text-muted-foreground">
                        <li>• AI classifies each column as stability, fragility, or overconfidence indicator</li>
                        <li>• Time-series forecasting detects hidden patterns</li>
                        <li>• Risk scores reveal overconfidence gaps in your supply chain</li>
                    </ul>
                </div>
            </div>

            {/* Upload Area */}
            <div
                className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 ${dragActive
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    id="file-upload"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="flex flex-col items-center gap-3">
                    {selectedFile ? (
                        <>
                            <div className="p-3 rounded-full bg-green-500/10">
                                <FileSpreadsheet className="w-8 h-8 text-green-500" />
                            </div>
                            <p className="font-medium">{selectedFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                                {(selectedFile.size / 1024).toFixed(1)} KB
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="p-3 rounded-full bg-muted">
                                <Upload className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <p className="font-medium">Drop CSV file here or click to browse</p>
                            <p className="text-sm text-muted-foreground">
                                Supports supply chain datasets with time-series metrics
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Analyze Button */}
            {selectedFile && !result && (
                <button
                    onClick={handleAnalyze}
                    disabled={analyzeMutation.isPending}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg active:scale-[0.99]"
                >
                    {analyzeMutation.isPending ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Analyzing with AI...
                        </>
                    ) : (
                        <>
                            <BarChart3 className="w-5 h-5" />
                            Analyze Dataset
                        </>
                    )}
                </button>
            )}

            {/* Error */}
            {analyzeMutation.isError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <div>
                        <p className="font-medium text-red-500">Analysis Failed</p>
                        <p className="text-sm text-muted-foreground">
                            {analyzeMutation.error?.message || "Unknown error"}
                        </p>
                    </div>
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="space-y-6 animate-fade-in">
                    {/* Overall Score */}
                    <div className="rounded-xl border bg-card p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">Overall Risk Assessment</h2>
                                <p className="text-sm text-muted-foreground">
                                    Based on {result.signals_analyzed.length} analyzed signals
                                </p>
                            </div>
                            <div className="text-right">
                                <div
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold ${getRiskColor(
                                        result.overall_level
                                    )}`}
                                >
                                    {result.overall_level === "HIGH" ? (
                                        <AlertTriangle className="w-5 h-5" />
                                    ) : result.overall_level === "MEDIUM" ? (
                                        <TrendingUp className="w-5 h-5" />
                                    ) : (
                                        <Shield className="w-5 h-5" />
                                    )}
                                    {result.overall_level} RISK
                                </div>
                                <p className="mt-1 text-2xl font-bold">
                                    {(result.overall_risk * 100).toFixed(0)}%
                                </p>
                            </div>
                        </div>

                        {!result.chronos_available && (
                            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-sm flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                Using statistical fallback (Chronos-2 not installed for advanced forecasting)
                            </div>
                        )}
                    </div>

                    {/* Per-Column Results */}
                    <div className="rounded-xl border bg-card p-6">
                        <h2 className="text-lg font-semibold mb-4">Signal Analysis</h2>
                        <div className="space-y-4">
                            {Object.entries(result.results).map(([col, metrics]) => (
                                <div
                                    key={col}
                                    className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <p className="font-medium">{col}</p>
                                            <span className="text-xs px-2 py-0.5 rounded bg-muted">
                                                {metrics.classification}
                                            </span>
                                        </div>
                                        <div
                                            className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(
                                                metrics.risk_level
                                            )}`}
                                        >
                                            {metrics.risk_level} ({(metrics.risk_score * 100).toFixed(0)}%)
                                        </div>
                                    </div>

                                    {/* Metrics Bars */}
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <MetricBar
                                            label="Stability"
                                            value={metrics.stability}
                                            color="green"
                                        />
                                        <MetricBar
                                            label="Fragility"
                                            value={metrics.fragility}
                                            color="red"
                                        />
                                        <MetricBar
                                            label="Overconfidence"
                                            value={metrics.overconfidence}
                                            color="amber"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Skipped Columns */}
                    {Object.keys(result.skipped).length > 0 && (
                        <div className="rounded-xl border bg-card p-6">
                            <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
                                Skipped Columns
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {Object.entries(result.skipped).map(([col, reason]) => (
                                    <div
                                        key={col}
                                        className="p-2 rounded bg-muted/30 text-sm"
                                        title={reason}
                                    >
                                        <span className="text-muted-foreground">{col}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* New Analysis Button */}
                    <button
                        onClick={() => {
                            setSelectedFile(null);
                            setResult(null);
                        }}
                        className="text-primary hover:underline text-sm"
                    >
                        ← Analyze another dataset
                    </button>
                </div>
            )}
        </div>
    );
}

function MetricBar({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: "green" | "red" | "amber";
}) {
    const barColors = {
        green: "bg-green-500",
        red: "bg-red-500",
        amber: "bg-amber-500",
    };

    return (
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{(value * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                    className={`h-full ${barColors[color]} transition-all`}
                    style={{ width: `${value * 100}%` }}
                />
            </div>
        </div>
    );
}
