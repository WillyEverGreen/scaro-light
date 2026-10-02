"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCcw, Maximize2, Wifi, WifiOff, AlertTriangle, Globe, Network } from "lucide-react";
import { useGraphUpdates, getRiskColor, getNodeSize, GraphData, GraphNode, GraphUpdate } from "./hooks";

// Dynamic import for react-force-graph-3d (requires window)
const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
    ),
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";


export default function GraphPage() {
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [connectedNodes, setConnectedNodes] = useState<GraphNode[]>([]);
    const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
    const [highlightLinks, setHighlightLinks] = useState<Set<string>>(new Set());
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [affectedNodes, setAffectedNodes] = useState<Set<string>>(new Set());
    const [pulsePhase, setPulsePhase] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fgRef = useRef<any>(null);

    // Pulse animation for high-risk nodes and selected nodes
    useEffect(() => {
        const interval = setInterval(() => {
            setPulsePhase((prev) => (prev + 1) % 60);
        }, 50); // 20fps animation
        return () => clearInterval(interval);
    }, []);

    // Measure container size
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight,
                });
            }
        };

        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    // Handle real-time updates
    const handleGraphUpdate = useCallback((update: GraphUpdate) => {
        if (update.type === "risk_change" && update.payload.affectedNodes) {
            setAffectedNodes(new Set(update.payload.affectedNodes));
            // Clear after animation
            setTimeout(() => setAffectedNodes(new Set()), 5000);
        }
    }, []);

    // WebSocket disabled by default - set to true when backend WS is ready
    const { connected } = useGraphUpdates(handleGraphUpdate, false);

    const { data, refetch, isLoading } = useQuery({
        queryKey: ["graph-data"],
        queryFn: async () => {
            try {
                // Request more nodes for denser graph
                const response = await fetch(`${API_BASE}/api/graph/full?max_nodes=5000`);
                if (!response.ok) throw new Error("API not available");
                return await response.json() as GraphData;
            } catch {
                // Return empty graph - no mock data
                return { nodes: [], links: [] } as GraphData;
            }
        },
        refetchInterval: 30000, // Auto-refresh every 30s
    });

    const graphData = data || { nodes: [], links: [] };
    const hasData = graphData.nodes.length > 0;

    // Handle node click - highlight connected nodes
    const handleNodeClick = useCallback((node: GraphNode) => {
        setSelectedNode(node);

        // Find all connected nodes
        const connected: GraphNode[] = [];
        const nodeIds = new Set<string>();
        const linkIds = new Set<string>();

        nodeIds.add(node.id);

        graphData.links.forEach((link: any) => {
            const sourceId = typeof link.source === "object" ? link.source.id : link.source;
            const targetId = typeof link.target === "object" ? link.target.id : link.target;

            if (sourceId === node.id) {
                nodeIds.add(targetId);
                linkIds.add(`${sourceId}-${targetId}`);
                const targetNode = graphData.nodes.find(n => n.id === targetId);
                if (targetNode) connected.push(targetNode);
            } else if (targetId === node.id) {
                nodeIds.add(sourceId);
                linkIds.add(`${sourceId}-${targetId}`);
                const sourceNode = graphData.nodes.find(n => n.id === sourceId);
                if (sourceNode) connected.push(sourceNode);
            }
        });

        setConnectedNodes(connected);
        setHighlightNodes(nodeIds);
        setHighlightLinks(linkIds);
    }, [graphData]);

    // Calculate dynamic node colors with pulse effect and highlighting
    const getNodeColor = useCallback(
        (node: GraphNode) => {
            const isSelected = selectedNode?.id === node.id;
            const isConnected = highlightNodes.has(node.id);
            const isAffected = affectedNodes.has(node.id);
            const isHighRisk = node.risk_score >= 0.7;

            // Selected node - bright highlight with pulse
            if (isSelected) {
                const pulseIntensity = Math.sin((pulsePhase / 60) * Math.PI * 2) * 0.3 + 0.7;
                return `rgba(59, 130, 246, ${pulseIntensity})`; // Bright blue pulse
            }

            // Connected nodes - enhanced visibility
            if (isConnected && !isSelected) {
                return "#10b981"; // Bright green for connected nodes
            }

            if (isAffected || isHighRisk) {
                // Pulsing effect: oscillate between base color and bright
                const pulseIntensity = Math.sin((pulsePhase / 60) * Math.PI * 2) * 0.5 + 0.5;
                const baseColor = getRiskColor(node.risk_score);

                // Return animated color
                if (isAffected) {
                    // Brighter pulse for newly affected nodes
                    return pulseIntensity > 0.5 ? "#ff0000" : baseColor;
                }
                return pulseIntensity > 0.7 ? "#ff6666" : baseColor;
            }

            return getRiskColor(node.risk_score);
        },
        [affectedNodes, pulsePhase, selectedNode, highlightNodes]
    );

    // Calculate link color - highlight selected connections with particles
    const getLinkColor = useCallback(
        (link: any) => {
            const sourceId = typeof link.source === "object" ? link.source.id : link.source;
            const targetId = typeof link.target === "object" ? link.target.id : link.target;
            const linkId = `${sourceId}-${targetId}`;

            // Highlighted connections - bright with animation
            if (highlightLinks.has(linkId)) {
                const pulseIntensity = Math.sin((pulsePhase / 60) * Math.PI * 2) * 0.4 + 0.6;
                return `rgba(16, 185, 129, ${pulseIntensity})`; // Bright green pulse
            }

            if (affectedNodes.has(sourceId) || affectedNodes.has(targetId)) {
                const pulseIntensity = Math.sin((pulsePhase / 60) * Math.PI * 2) * 0.5 + 0.5;
                return pulseIntensity > 0.5 ? "rgba(239, 68, 68, 0.8)" : "rgba(239, 68, 68, 0.4)";
            }

            // Better visibility in dark theme
            return "rgba(156, 163, 175, 0.5)";
        },
        [affectedNodes, pulsePhase, highlightLinks]
    );

    // Count high-risk nodes
    const highRiskCount = useMemo(() => {
        return graphData.nodes.filter((n) => n.risk_score >= 0.7).length;
    }, [graphData]);

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b bg-card">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Globe className="w-6 h-6" />
                            Supply Chain Network
                        </h1>
                        <p className="text-muted-foreground">
                            Interactive 3D visualization • {graphData.nodes.length} nodes • {graphData.links.length} links
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Connection status */}
                        <div className={`flex items-center gap-1 text-xs ${connected ? "text-green-500" : "text-muted-foreground"}`}>
                            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                            <span>{connected ? "Live" : "Offline"}</span>
                        </div>

                        {/* High risk alert */}
                        {highRiskCount > 0 && (
                            <div className="flex items-center gap-1 text-xs text-red-500 bg-red-500/10 px-2 py-1 rounded">
                                <AlertTriangle className="w-3 h-3" />
                                <span>{highRiskCount} High Risk</span>
                            </div>
                        )}

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => refetch()}
                                disabled={isLoading}
                                className="p-2 rounded-lg border bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                <RefreshCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                            </button>
                            <button
                                onClick={() => fgRef.current?.zoomToFit(400)}
                                className="p-2 rounded-lg border bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
                            >
                                <Maximize2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Graph Container */}
            <div className="flex-1 relative" ref={containerRef}>
                {/* Legend */}
                <div className="absolute top-4 left-4 z-10 p-3 rounded-lg bg-card/90 backdrop-blur border text-sm">
                    <p className="font-medium mb-2">Legend</p>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="text-muted-foreground">Low Risk (&lt;30%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-yellow-500" />
                            <span className="text-muted-foreground">Medium Risk (30-50%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-orange-500" />
                            <span className="text-muted-foreground">Elevated (50-70%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-muted-foreground">High Risk (&gt;70%)</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                            <span className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="text-muted-foreground">Selected</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="text-muted-foreground">Connected</span>
                        </div>
                    </div>
                </div>

                {/* Node Info Panel */}
                {selectedNode && (
                    <div className="absolute top-4 right-4 z-10 p-4 rounded-lg bg-card/90 backdrop-blur border w-80 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h3 className="font-medium text-lg">{selectedNode.label}</h3>
                                <p className="text-sm text-muted-foreground capitalize">{selectedNode.type}</p>
                            </div>
                            <div
                                className={`px-2 py-1 rounded text-xs font-medium ${selectedNode.risk_score >= 0.7
                                    ? "bg-red-500/20 text-red-400"
                                    : selectedNode.risk_score >= 0.5
                                        ? "bg-orange-500/20 text-orange-400"
                                        : selectedNode.risk_score >= 0.3
                                            ? "bg-yellow-500/20 text-yellow-400"
                                            : "bg-green-500/20 text-green-400"
                                    }`}
                            >
                                {(selectedNode.risk_score * 100).toFixed(0)}% Risk
                            </div>
                        </div>

                        <div className="pt-3 border-t space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Status</span>
                                <span className={selectedNode.risk_score >= 0.7 ? "text-red-400" : "text-green-400"}>
                                    {selectedNode.risk_score >= 0.7 ? "⚠️ At Risk" : "✓ Stable"}
                                </span>
                            </div>
                            {selectedNode.type === "event" && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Impact</span>
                                    <span>Supply Chain Disruption</span>
                                </div>
                            )}
                        </div>

                        {/* Connected Nodes Section */}
                        {connectedNodes.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                                <div className="flex items-center gap-2 mb-3">
                                    <Network className="w-4 h-4 text-green-500" />
                                    <h4 className="font-medium text-sm">Connected Nodes ({connectedNodes.length})</h4>
                                </div>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {connectedNodes.map((node) => (
                                        <div
                                            key={node.id}
                                            className="p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                                            onClick={() => handleNodeClick(node)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: getRiskColor(node.risk_score) }}
                                                    />
                                                    <span className="text-xs font-medium">{node.label}</span>
                                                </div>
                                                <span className="text-xs text-muted-foreground capitalize">
                                                    {node.type}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Risk: {(node.risk_score * 100).toFixed(0)}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                setSelectedNode(null);
                                setConnectedNodes([]);
                                setHighlightNodes(new Set());
                                setHighlightLinks(new Set());
                            }}
                            className="mt-3 w-full text-xs px-3 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 border transition-colors cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                )}

                {/* 3D Graph or Empty State */}
                {dimensions.width > 0 && dimensions.height > 0 && (
                    hasData ? (
                        <ForceGraph3D
                            ref={fgRef}
                            graphData={graphData}
                            width={dimensions.width}
                            height={dimensions.height}
                            nodeLabel={(node: any) => `${node.label} (${(node.risk_score * 100).toFixed(0)}% risk)`}
                            nodeColor={(node: any) => getNodeColor(node)}
                            nodeVal={(node: any) => {
                                // Larger size for selected and connected nodes
                                if (selectedNode?.id === node.id) return getNodeSize(node) * 2;
                                if (highlightNodes.has(node.id)) return getNodeSize(node) * 1.5;
                                return getNodeSize(node);
                            }}
                            nodeOpacity={0.95}
                            linkColor={getLinkColor}
                            linkWidth={(link: any) => {
                                const sourceId = typeof link.source === "object" ? link.source.id : link.source;
                                const targetId = typeof link.target === "object" ? link.target.id : link.target;
                                const linkId = `${sourceId}-${targetId}`;

                                // Thicker lines for highlighted connections
                                if (highlightLinks.has(linkId)) return 4;
                                if (affectedNodes.has(sourceId) || affectedNodes.has(targetId)) return 2;
                                return 1;
                            }}
                            linkOpacity={0.7}
                            linkDirectionalParticles={(link: any) => {
                                const sourceId = typeof link.source === "object" ? link.source.id : link.source;
                                const targetId = typeof link.target === "object" ? link.target.id : link.target;
                                const linkId = `${sourceId}-${targetId}`;

                                // Show particles on highlighted connections
                                return highlightLinks.has(linkId) ? 4 : 0;
                            }}
                            linkDirectionalParticleSpeed={0.006}
                            linkDirectionalParticleWidth={2}
                            linkDirectionalParticleColor={() => "#10b981"}
                            backgroundColor="rgba(0,0,0,0)"
                            onNodeClick={(node: any) => handleNodeClick(node)}
                            enableNodeDrag={true}
                            enableNavigationControls={true}
                            // GPU rendering for better performance
                            rendererConfig={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="p-8 rounded-2xl bg-muted/30 border border-dashed max-w-md">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">No Graph Data Yet</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    The supply chain graph will populate automatically as articles are scraped and analyzed by Gemini.
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Run a scraping mission to start building your intelligence graph.
                                </p>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
