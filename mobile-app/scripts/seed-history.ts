import "dotenv/config";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { db } from "../server/db";
import { riskMetrics } from "../shared/schema";
import { sql } from "drizzle-orm";

async function seedHistory() {
    console.log("Seeding 30-day risk history...");

    try {
        // Clear existing metrics to avoid duplication for this seed
        await db.execute(sql`delete from risk_metrics`);

        const points = [];
        const now = new Date();

        // Base risk around 0.45
        let currentRisk = 0.45;

        for (let i = 30; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);

            // Random fluctuation (+/- 0.05)
            currentRisk += (Math.random() - 0.5) * 0.1;
            // Clamp between 0.2 and 0.8
            currentRisk = Math.max(0.2, Math.min(0.8, currentRisk));

            points.push({
                overall_risk_score: parseFloat(currentRisk.toFixed(2)),
                high_risk_vendors: Math.floor(Math.random() * 5) + 3,
                affected_countries: Math.floor(Math.random() * 10) + 5,
                active_events: Math.floor(Math.random() * 20) + 10,
                overconfidence_alerts: Math.floor(Math.random() * 3),
                recorded_at: date
            });
        }

        await db.insert(riskMetrics).values(points);
        console.log("successfully seeded 30 days of history! ✅");
        process.exit(0);
    } catch (error) {
        console.error("Failed to seed history:", error);
        process.exit(1);
    }
}

seedHistory();
