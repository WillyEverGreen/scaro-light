import "dotenv/config";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { db } from "../server/db";
import { graphNodes } from "../shared/schema";

async function check() {
    try {
        const nodes = await db.select().from(graphNodes);
        console.log("DB_NODES_START");
        nodes.forEach(n => console.log(`${n.id}|${n.label}`));
        console.log("DB_NODES_END");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
