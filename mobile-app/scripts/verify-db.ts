import "dotenv/config";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import { db } from "../server/db";
import { events } from "../shared/schema";
import { desc } from "drizzle-orm";

async function verify() {
    console.log("Verifying Database Content...");
    try {
        const allEvents = await db.select().from(events).orderBy(desc(events.created_at)).limit(5);
        console.log(`Found ${allEvents.length} recent events in database.`);
        allEvents.forEach(e => {
            console.log(`- [${e.severity}] ${e.title} (${e.category})`);
        });
        process.exit(0);
    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    }
}

verify();
