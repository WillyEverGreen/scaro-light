import "dotenv/config";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { db } from "../server/db";
import { weatherStatus } from "../shared/schema";

async function verify() {
    console.log("Verifying Weather Data...");
    try {
        const data = await db.select().from(weatherStatus);
        console.log(`Found ${data.length} ports in database.`);
        data.forEach(p => {
            console.log(`- ${p.port}: ${p.condition} (${p.status})`);
        });
        process.exit(0);
    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    }
}

verify();
