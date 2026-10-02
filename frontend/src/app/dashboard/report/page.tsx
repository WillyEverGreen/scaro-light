"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FileText, Download, Printer, DollarSign, TrendingUp, AlertTriangle, CheckCircle, History, Play } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ReportPage() {
    const [revenueInput, setRevenueInput] = useState(10000000);
    const [currentReport, setCurrentReport] = useState<any>(null);
    const [showHistory, setShowHistory] = useState(false);

    // Mutation to generate new report
    const generateMutation = useMutation({
        mutationFn: async () => {
            // Add timeout or error handling
            const response = await fetch(`${API_BASE}/api/dashboard/report-data?revenue_at_risk_input=${revenueInput}&save_report=true`, {
                method: "POST"
            });
            if (!response.ok) throw new Error("Generation failed");
            return response.json();
        },
        onSuccess: (data) => {
            setCurrentReport(data);
        }
    });

    // Query for history
    const { data: history, refetch: refetchHistory } = useQuery({
        queryKey: ["report-history"],
        queryFn: async () => {
            try {
                const res = await fetch(`${API_BASE}/api/dashboard/reports/history`);
                if (res.ok) return await res.json();
                return [];
            } catch {
                return [];
            }
        },
        enabled: showHistory
    });

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex h-screen overflow-hidden">

            {/* History Sidebar (Collapsible) */}
            {showHistory && (
                <div className="w-80 border-r bg-muted/10 p-4 overflow-y-auto animate-fade-in print:hidden">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <History className="w-4 h-4" /> Past Reports
                    </h3>
                    <div className="space-y-2">
                        {history?.reports?.map((item: any) => (
                            <button
                                key={item.id}
                                className="w-full text-left p-3 rounded-md hover:bg-muted text-sm border bg-background"
                                onClick={() => setCurrentReport(item.data)}
                            >
                                <p className="font-medium truncate">{item.title}</p>
                                <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
                            </button>
                        ))}
                        {(!history?.reports || history.reports.length === 0) && (
                            <p className="text-sm text-muted-foreground">No saved reports.</p>
                        )}
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto space-y-8 animate-fade-in print:p-0 print:max-w-none">

                {/* Control Bar (Hidden in Print) */}
                <div className="flex items-center justify-between print:hidden">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="w-6 h-6 text-primary" />
                            Executive Briefing
                        </h1>
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                            <History className="w-4 h-4" /> {showHistory ? "Hide History" : "History"}
                        </button>
                    </div>


                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => generateMutation.mutate()}
                            disabled={generateMutation.isPending}
                            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 shadow-sm transition-all"
                        >
                            {generateMutation.isPending ? (
                                <>Generating AI Report...</>
                            ) : (
                                <><Play className="w-4 h-4" /> Generate New Report</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Empty State */}
                {!currentReport && !generateMutation.isPending && (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 border-2 border-dashed rounded-xl ">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <FileText className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold">Ready to Generate Briefing</h2>
                        <p className="text-muted-foreground max-w-md">
                            Click "Generate New Report" to analyze risk intelligence and create a strategic executive summary using AI.
                        </p>
                    </div>
                )}

                {/* Loading State */}
                {generateMutation.isPending && (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
                        <div className="relative w-20 h-20">
                            <div className="absolute inset-0 border-4 border-muted rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Consulting AI Analyst...</h2>
                            <p className="text-muted-foreground mt-2">Aggregating real-time threats and calculating financial exposure.</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {generateMutation.isError && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-lg text-center">
                        Error generating report. Please try again.
                    </div>
                )}

                {/* Report Paper */}
                {currentReport && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">

                        <div className="flex justify-end mb-4 print:hidden">
                            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted text-sm">
                                <Printer className="w-4 h-4" /> Print / Save PDF
                            </button>
                        </div>

                        <div className="bg-white text-black p-10 rounded-none shadow-lg print:shadow-none min-h-[11in] relative">

                            {/* Header */}
                            <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
                                <div>
                                    <h1 className="text-4xl font-bold tracking-tight">Supply Chain Risk Assessment</h1>
                                    <p className="text-gray-500 mt-2 text-lg">Executive Strategic Briefing</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-xl">CONFIDENTIAL</p>
                                    <p className="text-gray-500">{new Date(currentReport.generated_at).toLocaleDateString()}</p>
                                    <p className="text-sm text-gray-400 mt-1">Generated by Edgecase AI</p>
                                </div>
                            </div>

                            {/* Executive Summary Section */}
                            <div className="mb-10">
                                <h2 className="text-xl font-bold uppercase tracking-wider mb-4 border-l-4 border-black pl-3 flex items-center gap-2">
                                    1. Executive Summary
                                </h2>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <p className="text-lg leading-relaxed">
                                            {currentReport.summary.text}
                                        </p>
                                        <p className="text-gray-600">
                                            This assessment utilizes real-time intelligence aggregated from {currentReport.system_status.sources_monitored} global sources.
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Key Metrics</h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <p className="text-3xl font-bold text-black">{currentReport.summary.risk_score}/100</p>
                                                <p className="text-sm text-gray-500">Overall Risk Score</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Top Critical Threats */}
                            <div className="mb-10">
                                <h2 className="text-xl font-bold uppercase tracking-wider mb-4 border-l-4 border-black pl-3">
                                    2. Critical Threat Matrix
                                </h2>
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b-2 border-black">
                                            <th className="py-2 font-bold">Threat Title</th>
                                            <th className="py-2 font-bold">Category</th>
                                            <th className="py-2 font-bold">Region/Entity</th>
                                            <th className="py-2 font-bold">Operational Impact</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentReport.top_threats.map((threat: any, i: number) => (
                                            <tr key={i} className="border-b border-gray-200">
                                                <td className="py-3 font-medium">{threat.title}</td>
                                                <td className="py-3 text-gray-600 capitalize">{threat.category}</td>
                                                <td className="py-3 text-gray-600">{threat.country}</td>
                                                <td className="py-3 font-bold text-red-700 flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    {threat.impact}
                                                </td>
                                            </tr>
                                        ))}
                                        {currentReport.top_threats.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="py-4 text-center text-gray-500">No critical threats detected at this time.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Recommendations */}
                            <div>
                                <h2 className="text-xl font-bold uppercase tracking-wider mb-4 border-l-4 border-black pl-3">
                                    3. Strategic Recommendations
                                </h2>
                                <ul className="space-y-3">
                                    {currentReport.recommendations.map((rec: string, i: number) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                                            <span className="text-gray-800 font-medium">{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Footer */}
                            <div className="absolute bottom-10 left-10 right-10 border-t pt-4 text-center text-xs text-gray-400">
                                <p>Generated by Edgecase Intelligence System • Sources Monitored: {currentReport.system_status.sources_monitored}</p>
                                <p className="mt-1">For internal strategic planning use only. Verify critical data points with regional team leads.</p>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
