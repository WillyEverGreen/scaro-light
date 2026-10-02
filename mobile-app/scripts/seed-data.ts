import "dotenv/config";
// Bypass SSL for Supabase
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { db } from "../server/db";
import { graphNodes, graphLinks, alerts, riskMetrics, commodities } from "../shared/schema";

async function seed() {
    console.log("Seeding database with sample data...");

    try {
        // 1. Graph Nodes
        const nodes = [
            { id: "supplier-1", label: "Foxconn", type: "vendor", risk_score: 0.3, metadata: JSON.stringify({ location: "Taiwan" }) },
            { id: "supplier-2", label: "TSMC", type: "vendor", risk_score: 0.1, metadata: JSON.stringify({ location: "Taiwan" }) },
            { id: "loc-1", label: "Shenzhen Port", type: "country", risk_score: 0.5, metadata: JSON.stringify({ type: "port" }) },
            { id: "prod-1", label: "iPhone", type: "product", risk_score: 0.2 },
            { id: "event-1", label: "Typhoon In-Fa", type: "event", risk_score: 0.8 },
        ];

        for (const node of nodes) {
            await db.insert(graphNodes).values(node).onConflictDoNothing();
        }

        // 2. Graph Links
        const links = [
            { source: "supplier-1", target: "prod-1", type: "supplies", strength: 1 },
            { source: "supplier-2", target: "prod-1", type: "supplies", strength: 1 },
            { source: "supplier-1", target: "loc-1", type: "located_in", strength: 0.8 },
            { source: "event-1", target: "loc-1", type: "affects", strength: 0.9 },
        ];

        for (const link of links) {
            await db.insert(graphLinks).values(link).onConflictDoNothing();
        }

        // 3. Alerts
        const newAlerts = [
            {
                title: "High Risk Vendor Detected",
                description: "Foxconn reporting disruption due to local weather events.",
                severity: "high",
                type: "vendor"
            },
            {
                title: "Port Congestion Warning",
                description: "Shenzhen Port throughput dropped by 15% this week.",
                severity: "medium",
                type: "weather"
            },
        ];

        for (const alert of newAlerts) {
            await db.insert(alerts).values(alert);
        }

        // 4. Commodities
        const comms = [
            { name: "Copper", avg_risk_score: 0.4, trend: "up", price_change_pct: 2.5 },
            { name: "Lithium", avg_risk_score: 0.6, trend: "stable", price_change_pct: -0.5 },
            { name: "Steel", avg_risk_score: 0.2, trend: "down", price_change_pct: -1.2 },
        ];

        for (const c of comms) {
            await db.insert(commodities).values(c).onConflictDoNothing();
        }

        // 5. Risk Metrics History (for detailed chart)
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            // Simulate fluctuating risk
            const risk = 0.3 + (Math.sin(i) * 0.1) + (Math.random() * 0.1);

            await db.insert(riskMetrics).values({
                overall_risk_score: Math.max(0, Math.min(1, risk)),
                high_risk_vendors: Math.floor(Math.random() * 5),
                active_events: Math.floor(Math.random() * 10),
                recorded_at: date,
            });
        }

        console.log("✅ Seeding complete!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

seed();
