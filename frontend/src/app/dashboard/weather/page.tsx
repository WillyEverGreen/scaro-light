"use client";

import { useQuery } from "@tanstack/react-query";
import {
    CloudRain,
    Wind,
    Thermometer,
    AlertTriangle,
    Ship,
    RefreshCcw,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Mock weather data for major ports
const mockWeatherData = [
    {
        port: "Shanghai",
        country: "CHN",
        condition: "Partly Cloudy",
        temp: 18,
        wind: 25,
        status: "normal",
        alert: null,
    },
    {
        port: "Singapore",
        country: "SGP",
        condition: "Thunderstorms",
        temp: 29,
        wind: 45,
        status: "warning",
        alert: "Heavy rain expected next 6 hours",
    },
    {
        port: "Rotterdam",
        country: "NLD",
        condition: "Clear",
        temp: 12,
        wind: 15,
        status: "normal",
        alert: null,
    },
    {
        port: "Los Angeles",
        country: "USA",
        condition: "Clear",
        temp: 22,
        wind: 10,
        status: "normal",
        alert: null,
    },
    {
        port: "Busan",
        country: "KOR",
        condition: "High Winds",
        temp: 14,
        wind: 65,
        status: "critical",
        alert: "Port operations suspended due to high winds",
    },
    {
        port: "Dubai",
        country: "ARE",
        condition: "Clear",
        temp: 35,
        wind: 8,
        status: "normal",
        alert: null,
    },
];

export default function WeatherPage() {
    const { data, refetch, isLoading } = useQuery({
        queryKey: ["weather-alerts"],
        queryFn: async () => {
            try {
                const response = await fetch(`${API_BASE}/api/dashboard/weather`);
                if (!response.ok) throw new Error("API not available");
                return response.json();
            } catch {
                return { ports: mockWeatherData };
            }
        },
    });

    const ports = data?.ports || mockWeatherData;
    const alertCount = ports.filter((p: any) => p.alert).length;

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <CloudRain className="w-6 h-6" />
                        Weather Impact
                    </h1>
                    <p className="text-muted-foreground">
                        Weather conditions at major shipping ports
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="p-2 rounded-lg border bg-muted hover:bg-muted/80 cursor-pointer transition-colors"
                >
                    <RefreshCcw className="w-4 h-4" />
                </button>
            </div>

            {/* Alert Summary */}
            {alertCount > 0 && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <p className="font-medium">
                        {alertCount} port{alertCount > 1 ? "s" : ""} experiencing weather disruptions
                    </p>
                </div>
            )}

            {/* Port Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ports.map((port: any) => (
                    <PortWeatherCard key={port.port} {...port} />
                ))}
            </div>
        </div>
    );
}

function PortWeatherCard({
    port,
    country,
    condition,
    temp,
    wind,
    status,
    alert,
}: {
    port: string;
    country: string;
    condition: string;
    temp: number;
    wind: number;
    status: "normal" | "warning" | "critical";
    alert: string | null;
}) {
    const statusColors = {
        normal: "border-green-500/30 bg-green-500/5",
        warning: "border-amber-500/30 bg-amber-500/5",
        critical: "border-red-500/30 bg-red-500/5",
    };

    const statusIcons = {
        normal: <Ship className="w-5 h-5 text-green-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        critical: <AlertTriangle className="w-5 h-5 text-red-500" />,
    };

    return (
        <div className={`rounded-xl border p-5 ${statusColors[status]}`}>
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="font-semibold">{port}</h3>
                    <p className="text-sm text-muted-foreground">{country}</p>
                </div>
                {statusIcons[status]}
            </div>

            <p className="mt-3 text-lg">{condition}</p>

            <div className="mt-3 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                    <Thermometer className="w-4 h-4 text-muted-foreground" />
                    <span>{temp}°C</span>
                </div>
                <div className="flex items-center gap-1">
                    <Wind className="w-4 h-4 text-muted-foreground" />
                    <span>{wind} km/h</span>
                </div>
            </div>

            {alert && (
                <p className="mt-3 text-sm text-amber-600 dark:text-amber-400 font-medium">
                    ⚠️ {alert}
                </p>
            )}
        </div>
    );
}
