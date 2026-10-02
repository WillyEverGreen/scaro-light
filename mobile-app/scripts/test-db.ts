import pg from "pg";
import { config } from "dotenv";

// Load env vars if not loaded automatically
config();

async function testConnection() {
    console.log("Testing database connection with explicit SSL...");
    try {
        const rawUrl = process.env.DATABASE_URL || "";
        // Append sslmode=require if not present
        const connectionString = rawUrl.includes("sslmode") ? rawUrl : rawUrl + "?sslmode=require";

        console.log("Using Connection URL (masked):", connectionString.replace(/:[^:]*@/, ":***@"));

        // Explicitly configure SSL
        const pool = new pg.Pool({
            connectionString,
            ssl: { rejectUnauthorized: false }
        });

        const client = await pool.connect();
        const res = await client.query("SELECT 1 as connected");
        console.log("✅ Connection SUCCESS!", res.rows);
        await client.release();
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error("❌ Connection FAILED:", error);
        process.exit(1);
    }
}

testConnection();
