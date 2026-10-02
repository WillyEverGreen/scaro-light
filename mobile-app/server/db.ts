import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const isSupabase = process.env.DATABASE_URL?.includes("supabase");

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
  max: 5, // Reduce max connections to keep them active
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 0, // Disable idle timeout (close immediately after use) to avoid firewall drops
});

export const db = drizzle(pool, { schema });
