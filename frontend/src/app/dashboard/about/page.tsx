"use client";

import { Info, Code, Cpu, ShieldCheck } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="p-8 max-w-4xl mx-auto space-y-12 animate-fade-in">

            {/* Header */}
            <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Info className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight">About Edgecase</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Supply Chain Analyser for Risk and Overconfidence
                </p>
            </div>

            {/* Mission Section */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 rounded-xl border bg-card hover:border-primary/50 transition-colors">
                    <Cpu className="w-8 h-8 text-blue-500 mb-4" />
                    <h3 className="font-semibold text-lg mb-2">AI-Powered Intelligence</h3>
                    <p className="text-sm text-muted-foreground">
                        Utilizing advanced LLMs to scrape, analyze, and interpret global supply chain disruptions in real-time.
                    </p>
                </div>
                <div className="p-6 rounded-xl border bg-card hover:border-primary/50 transition-colors">
                    <ShieldCheck className="w-8 h-8 text-green-500 mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Risk Quantification</h3>
                    <p className="text-sm text-muted-foreground">
                        Converting qualitative news into specific quantitative risk scores and financial exposure estimates.
                    </p>
                </div>
                <div className="p-6 rounded-xl border bg-card hover:border-primary/50 transition-colors">
                    <Code className="w-8 h-8 text-purple-500 mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Modern Architecture</h3>
                    <p className="text-sm text-muted-foreground">
                        Built with Next.js, Python FastAPI, and vector databases for high-speed retrieval and analysis.
                    </p>
                </div>
            </div>

            <div className="text-center text-sm text-muted-foreground pt-8 border-t">
                <p>&copy; {new Date().getFullYear()} Edgecase Project. All rights reserved.</p>
            </div>
        </div>
    );
}
