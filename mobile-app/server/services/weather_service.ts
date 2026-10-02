import { db } from "../db";
import { weatherStatus } from "@shared/schema";
import { eq } from "drizzle-orm";

const PORTS = [
    { name: "Singapore", country: "Singapore", lat: 1.2902, lon: 103.8519 },
    { name: "Shanghai", country: "China", lat: 31.2304, lon: 121.4737 },
    { name: "Rotterdam", country: "Netherlands", lat: 51.9225, lon: 4.47917 },
    { name: "Los Angeles", country: "USA", lat: 34.0522, lon: -118.2437 },
    { name: "Panama Canal", country: "Panama", lat: 9.08, lon: -79.68 },
    { name: "Suez Canal", country: "Egypt", lat: 29.97, lon: 32.53 },
];

function getWeatherCondition(code: number): string {
    if (code === 0) return "Clear";
    if (code <= 3) return "Partly Cloudy";
    if (code <= 48) return "Foggy";
    if (code <= 67) return "Rainy";
    if (code <= 86) return "Snowy";
    if (code <= 99) return "Thunderstorm";
    return "Variable";
}

function getStatus(code: number, wind: number): "normal" | "warning" | "critical" {
    if (code > 80 || wind > 60) return "critical";
    if (code > 50 || wind > 40) return "warning";
    return "normal";
}

export async function updateWeatherData() {
    console.log("Updating weather data from Open-Meteo...");

    for (const port of PORTS) {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${port.lat}&longitude=${port.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.current) {
                const condition = getWeatherCondition(data.current.weather_code);
                const status = getStatus(data.current.weather_code, data.current.wind_speed_10m);

                // Update or insert
                const existing = await db.select().from(weatherStatus).where(eq(weatherStatus.port, port.name));

                const payload = {
                    port: port.name,
                    country: port.country,
                    condition,
                    temperature_c: data.current.temperature_2m,
                    wind_speed_kmh: data.current.wind_speed_10m,
                    humidity: data.current.relative_humidity_2m,
                    status,
                    lat: port.lat,
                    lon: port.lon,
                    updated_at: new Date(),
                };

                if (existing.length > 0) {
                    await db.update(weatherStatus).set(payload).where(eq(weatherStatus.port, port.name));
                } else {
                    await db.insert(weatherStatus).values(payload);
                }
            }
        } catch (error) {
            console.error(`Error updating weather for ${port.name}:`, error);
        }
    }
}
