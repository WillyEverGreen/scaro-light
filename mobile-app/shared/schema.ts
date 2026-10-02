import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Events table for supply chain events/news
export const events = pgTable("events", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // geopolitical, weather, trade_restriction, commodity, vendor, economic
  severity: varchar("severity", { length: 20 }).notNull(), // low, medium, high, critical
  country: varchar("country", { length: 100 }).notNull(),
  impact_score: real("impact_score").default(0),
  source: text("source"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Alerts table for user notifications
export const alerts = pgTable("alerts", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  severity: varchar("severity", { length: 20 }).notNull(), // low, medium, high, critical
  type: varchar("type", { length: 50 }).notNull(), // risk_threshold, weather, vendor, price_change
  is_read: boolean("is_read").default(false),
  is_dismissed: boolean("is_dismissed").default(false),
  related_event_id: varchar("related_event_id", { length: 36 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  created_at: true,
});

export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;

// Weather status for ports
export const weatherStatus = pgTable("weather_status", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  port: varchar("port", { length: 100 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  condition: varchar("condition", { length: 50 }).notNull(),
  temperature_c: real("temperature_c").notNull(),
  wind_speed_kmh: real("wind_speed_kmh").notNull(),
  humidity: integer("humidity"),
  status: varchar("status", { length: 20 }).notNull(), // normal, warning, critical
  lat: real("lat"),
  lon: real("lon"),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertWeatherSchema = createInsertSchema(weatherStatus).omit({
  id: true,
  updated_at: true,
});

export type InsertWeather = z.infer<typeof insertWeatherSchema>;
export type WeatherStatus = typeof weatherStatus.$inferSelect;

// Graph nodes for supply chain network
export const graphNodes = pgTable("graph_nodes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  label: text("label").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // vendor, country, product, event
  risk_score: real("risk_score").default(0),
  metadata: text("metadata"), // JSON string for additional data
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertGraphNodeSchema = createInsertSchema(graphNodes).omit({
  created_at: true,
});

export type InsertGraphNode = z.infer<typeof insertGraphNodeSchema>;
export type GraphNode = typeof graphNodes.$inferSelect;

// Graph links for supply chain connections
export const graphLinks = pgTable("graph_links", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  source: varchar("source", { length: 36 }).notNull(),
  target: varchar("target", { length: 36 }).notNull(),
  strength: real("strength").default(1),
  type: varchar("type", { length: 50 }), // supplies, located_in, affects
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertGraphLinkSchema = createInsertSchema(graphLinks).omit({
  id: true,
  created_at: true,
});

export type InsertGraphLink = z.infer<typeof insertGraphLinkSchema>;
export type GraphLink = typeof graphLinks.$inferSelect;

// User settings
export const userSettings = pgTable("user_settings", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  device_id: varchar("device_id", { length: 100 }).notNull().unique(),
  dark_mode: boolean("dark_mode").default(true),
  push_notifications: boolean("push_notifications").default(true),
  email_alerts: boolean("email_alerts").default(false),
  risk_threshold: real("risk_threshold").default(0.7),
  auto_refresh: boolean("auto_refresh").default(true),
  refresh_interval: integer("refresh_interval").default(300), // seconds
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  updated_at: true,
});

export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;

// Commodities tracking
export const commodities = pgTable("commodities", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  avg_risk_score: real("avg_risk_score").default(0),
  mention_count: integer("mention_count").default(0),
  trend: varchar("trend", { length: 20 }).default("stable"), // up, down, stable
  price_change_pct: real("price_change_pct").default(0),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCommoditySchema = createInsertSchema(commodities).omit({
  id: true,
  updated_at: true,
});

export type InsertCommodity = z.infer<typeof insertCommoditySchema>;
export type Commodity = typeof commodities.$inferSelect;

// Risk metrics history
export const riskMetrics = pgTable("risk_metrics", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  overall_risk_score: real("overall_risk_score").notNull(),
  high_risk_vendors: integer("high_risk_vendors").default(0),
  affected_countries: integer("affected_countries").default(0),
  active_events: integer("active_events").default(0),
  overconfidence_alerts: integer("overconfidence_alerts").default(0),
  recorded_at: timestamp("recorded_at").defaultNow().notNull(),
});

export const insertRiskMetricsSchema = createInsertSchema(riskMetrics).omit({
  id: true,
  recorded_at: true,
});

export type InsertRiskMetrics = z.infer<typeof insertRiskMetricsSchema>;
export type RiskMetrics = typeof riskMetrics.$inferSelect;

export * from "./models/chat";
