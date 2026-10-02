import "dotenv/config";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { db } from "../server/db";
import { graphNodes, graphLinks } from "../shared/schema";
import { sql } from "drizzle-orm";

async function seedGraph() {
    console.log("Seeding realistic Global Supply Chain Graph...");

    try {
        // Clear existing graph data
        await db.execute(sql`delete from graph_links`);
        await db.execute(sql`delete from graph_nodes`);

        const nodes = [
            // Countries
            { id: "c-taiwan", label: "Taiwan", type: "country", risk_score: 0.55 },
            { id: "c-china", label: "China", type: "country", risk_score: 0.65 },
            { id: "c-usa", label: "USA", type: "country", risk_score: 0.35 },
            { id: "c-germany", label: "Germany", type: "country", risk_score: 0.30 },
            { id: "c-skorea", label: "S. Korea", type: "country", risk_score: 0.40 },

            // Vendors
            { id: "v-tsmc", label: "TSMC", type: "vendor", risk_score: 0.60 },
            { id: "v-foxconn", label: "Foxconn", type: "vendor", risk_score: 0.62 },
            { id: "v-samsung", label: "Samsung Semi", type: "vendor", risk_score: 0.45 },
            { id: "v-nvidia", label: "NVIDIA", type: "vendor", risk_score: 0.38 },
            { id: "v-asml", label: "ASML", type: "vendor", risk_score: 0.25 },
            { id: "v-maersk", label: "Maersk", type: "vendor", risk_score: 0.50 },

            // Hubs/Ports
            { id: "p-shanghai", label: "Port of Shanghai", type: "country", risk_score: 0.70 },
            { id: "p-rotterdam", label: "Port of Rotterdam", type: "country", risk_score: 0.32 },
            { id: "p-la", label: "Port of LA", type: "country", risk_score: 0.45 },

            // Products
            { id: "prod-semi", label: "Semiconductors", type: "product", risk_score: 0.80 },
            { id: "prod-lithium", label: "Lithium Cells", type: "product", risk_score: 0.75 },
            { id: "prod-auto", label: "Auto Parts", type: "product", risk_score: 0.55 },
        ];

        const links = [
            // Supplier to Product
            { source: "v-tsmc", target: "prod-semi", strength: 0.9 },
            { source: "v-samsung", target: "prod-semi", strength: 0.7 },
            { source: "v-asml", target: "v-tsmc", strength: 0.95 },
            { source: "v-nvidia", target: "prod-semi", strength: 0.8 },

            // Vendor to Country
            { source: "v-tsmc", target: "c-taiwan", strength: 1.0 },
            { source: "v-foxconn", target: "c-china", strength: 0.9 },
            { source: "v-asml", target: "c-germany", strength: 0.8 },
            { source: "v-nvidia", target: "c-usa", strength: 0.9 },

            // Hub Connections
            { source: "c-china", target: "p-shanghai", strength: 0.95 },
            { source: "c-germany", target: "p-rotterdam", strength: 0.85 },
            { source: "p-shanghai", target: "p-la", strength: 0.6 },
            { source: "p-la", target: "c-usa", strength: 0.9 },

            // Complex Dependencies
            { source: "prod-semi", target: "v-foxconn", strength: 0.85 },
            { source: "v-foxconn", target: "p-shanghai", strength: 0.75 },
            { source: "v-maersk", target: "p-rotterdam", strength: 0.9 },
            { source: "v-maersk", target: "p-shanghai", strength: 0.9 },
        ];

        await db.insert(graphNodes).values(nodes);
        await db.insert(graphLinks).values(links);

        console.log("successfully seeded realistic graph! ✅");
        process.exit(0);
    } catch (error) {
        console.error("Failed to seed graph:", error);
        process.exit(1);
    }
}

seedGraph();
