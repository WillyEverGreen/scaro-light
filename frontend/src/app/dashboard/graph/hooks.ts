"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_BASE = API_BASE.replace("http", "ws");

export interface GraphNode {
    id: string;
    label: string;
    type: "vendor" | "country" | "product" | "event";
    risk_score: number;
    color: string;
    properties?: Record<string, unknown>;
}

export interface GraphLink {
    source: string;
    target: string;
    type: string;
    weight?: number;
}

export interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

export interface GraphUpdate {
    type: "node_update" | "link_update" | "new_event" | "risk_change";
    payload: {
        nodeId?: string;
        riskScore?: number;
        affectedNodes?: string[];
        newNode?: GraphNode;
        newLink?: GraphLink;
    };
}

/**
 * Hook to fetch and manage graph data with real-time updates.
 */
export function useGraphData() {
    const [data, setData] = useState<GraphData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [affectedNodes, setAffectedNodes] = useState<Set<string>>(new Set());

    const fetchGraph = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/api/graph/full`);
            if (!response.ok) throw new Error("Failed to fetch graph");
            const graphData = await response.json();
            setData(graphData);
            setError(null);
        } catch (e) {
            setError(e as Error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGraph();
    }, [fetchGraph]);

    // Mark nodes as affected (for animation)
    const markAffected = useCallback((nodeIds: string[]) => {
        setAffectedNodes(new Set(nodeIds));
    }, []);

    // Clear affected status after animation
    const clearAffected = useCallback(() => {
        setAffectedNodes(new Set());
    }, []);

    return {
        data,
        loading,
        error,
        refetch: fetchGraph,
        affectedNodes,
        markAffected,
        clearAffected,
    };
}

/**
 * Hook for WebSocket connection to receive real-time graph updates.
 * WebSocket is optional - only connects when explicitly requested.
 */
export function useGraphUpdates(onUpdate: (update: GraphUpdate) => void, autoConnect: boolean = false) {
    const wsRef = useRef<WebSocket | null>(null);
    const [connected, setConnected] = useState(false);
    const [reconnectAttempt, setReconnectAttempt] = useState(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        try {
            const ws = new WebSocket(`${WS_BASE}/api/graph/ws`);

            ws.onopen = () => {
                console.log("[WebSocket] Connected to graph updates");
                setConnected(true);
                setReconnectAttempt(0);
            };

            ws.onmessage = (event) => {
                try {
                    const update = JSON.parse(event.data) as GraphUpdate;
                    onUpdate(update);
                } catch (e) {
                    console.warn("[WebSocket] Failed to parse message:", e);
                }
            };

            ws.onclose = () => {
                setConnected(false);
                wsRef.current = null;

                // Auto-reconnect with exponential backoff (only if we were connected before)
                if (reconnectAttempt < 3 && reconnectAttempt > 0) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 10000);
                    reconnectTimeoutRef.current = setTimeout(() => {
                        setReconnectAttempt((prev) => prev + 1);
                    }, delay);
                }
            };

            ws.onerror = () => {
                // Silently handle - WebSocket is optional enhancement
                setConnected(false);
            };

            wsRef.current = ws;
        } catch {
            // WebSocket not available - graceful degradation
            setConnected(false);
        }
    }, [onUpdate, reconnectAttempt]);

    useEffect(() => {
        // Only auto-connect if explicitly enabled
        if (autoConnect) {
            connect();
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [connect, autoConnect]);

    // Reconnect when reconnectAttempt changes
    useEffect(() => {
        if (reconnectAttempt > 0 && reconnectAttempt < 3) {
            connect();
        }
    }, [reconnectAttempt, connect]);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
    }, []);

    return { connected, disconnect, reconnect: connect };
}

/**
 * Get color based on risk score with smooth gradient.
 */
export function getRiskColor(riskScore: number): string {
    if (riskScore >= 0.7) return "#ef4444"; // red
    if (riskScore >= 0.5) return "#f97316"; // orange
    if (riskScore >= 0.3) return "#eab308"; // yellow
    return "#22c55e"; // green
}

/**
 * Calculate node size based on type and risk.
 */
export function getNodeSize(node: GraphNode): number {
    const baseSize = node.type === "event" ? 4 : node.type === "country" ? 3 : 2;
    // Increase size for high-risk nodes
    return baseSize * (1 + node.risk_score * 0.5);
}
