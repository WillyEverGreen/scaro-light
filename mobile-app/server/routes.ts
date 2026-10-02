import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";
import { db } from "./db";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { events, alerts, weatherStatus, graphNodes, graphLinks, userSettings, commodities, riskMetrics } from "@shared/schema";
import { scrapeSupplyChainNews } from "./services/news_scraper";
import { updateWeatherData } from "./services/weather_service";
import { withRetry } from "./utils/retry";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SYSTEM_PROMPT = `You are SCARO, an AI-powered Supply Chain Risk Intelligence analyst. Your role is to help supply chain professionals understand and mitigate risks.

When analyzing supply chain queries, you should:
1. Provide data-driven insights about supply chain risks
2. Consider geopolitical, weather, trade, economic, and vendor-related factors
3. Suggest actionable recommendations
4. Rate the confidence level of your analysis
5. Use markdown formatting for readability

Always structure your responses with:
- A brief executive summary
- Key risk factors identified
- Impact assessment (use terms like Low, Medium, High, Critical)
- Recommended actions
- Confidence assessment

Be professional, concise, and actionable in your responses.`;

export async function registerRoutes(app: Express): Promise<Server> {
  // AI Query endpoint
  app.post("/api/query", async (req: Request, res: Response) => {
    try {
      const { query } = req.body;

      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Query is required" });
      }

      // Fetch context for the AI
      const [recentAlerts, recentEvents, metrics] = await Promise.all([
        db.select().from(alerts).orderBy(desc(alerts.created_at)).limit(5),
        db.select().from(events).orderBy(desc(events.created_at)).limit(5),
        db.select().from(riskMetrics).orderBy(desc(riskMetrics.recorded_at)).limit(1),
      ]);

      const context = `
      CURRENT SYSTEM STATUS:
      - Overall Risk Score: ${metrics[0]?.overall_risk_score ?? "Unknown"}
      - Active Alerts: ${recentAlerts.map(a => `- [${a.severity}] ${a.title}: ${a.description}`).join("\n")}
      - Recent Events: ${recentEvents.map(e => `- ${e.title} (${e.country})`).join("\n")}
      `;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-4o", // Use a smarter model for chat
        messages: [
          { role: "system", content: SYSTEM_PROMPT + "\n\n" + context },
          { role: "user", content: query },
        ],
        stream: true,
        max_completion_tokens: 2048,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true, fullResponse })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error processing query:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to process query" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to process query" });
      }
    }
  });

  // News Scraper Trigger
  app.post("/api/scraper/trigger", async (_req: Request, res: Response) => {
    try {
      const news = await withRetry(() => scrapeSupplyChainNews());
      res.json({ success: true, count: news.length, events: news });
    } catch (error) {
      console.error("Scraper failed:", error);
      res.status(500).json({ error: "Failed to scrape news" });
    }
  });

  // Health check
  app.get("/api/health", async (_req: Request, res: Response) => {
    try {
      await withRetry(() => db.execute(sql`SELECT 1`));
      res.json({
        status: "ok",
        ai: !!process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        database: true,
      });
    } catch {
      res.json({
        status: "degraded",
        ai: !!process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        database: false,
      });
    }
  });

  // ============ EVENTS API ============
  app.get("/api/events", async (_req: Request, res: Response) => {
    try {
      const allEvents = await withRetry(() => db
        .select()
        .from(events)
        .orderBy(desc(events.created_at))
        .limit(50));
      res.json(allEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.post("/api/events", async (req: Request, res: Response) => {
    try {
      const [newEvent] = await withRetry(() => db.insert(events).values(req.body).returning());
      res.json(newEvent);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  // ============ ALERTS API ============
  app.get("/api/alerts", async (_req: Request, res: Response) => {
    try {
      const allAlerts = await withRetry(() => db
        .select()
        .from(alerts)
        .where(eq(alerts.is_dismissed, false))
        .orderBy(desc(alerts.created_at))
        .limit(50));
      res.json(allAlerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.post("/api/alerts", async (req: Request, res: Response) => {
    try {
      const [newAlert] = await withRetry(() => db.insert(alerts).values(req.body).returning());
      res.json(newAlert);
    } catch (error) {
      console.error("Error creating alert:", error);
      res.status(500).json({ error: "Failed to create alert" });
    }
  });

  app.patch("/api/alerts/:id/dismiss", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [updated] = await withRetry(() => db
        .update(alerts)
        .set({ is_dismissed: true })
        .where(eq(alerts.id, id))
        .returning());
      res.json(updated);
    } catch (error) {
      console.error("Error dismissing alert:", error);
      res.status(500).json({ error: "Failed to dismiss alert" });
    }
  });

  // ============ WEATHER API ============
  app.get("/api/weather", async (_req: Request, res: Response) => {
    try {
      const weatherData = await withRetry(() => db.select().from(weatherStatus));
      if (weatherData.length === 0) {
        await updateWeatherData();
        const freshData = await withRetry(() => db.select().from(weatherStatus));
        return res.json(freshData);
      }
      res.json(weatherData);
    } catch (error) {
      console.error("Error fetching weather:", error);
      res.status(500).json({ error: "Failed to fetch weather" });
    }
  });

  app.post("/api/weather/update", async (_req: Request, res: Response) => {
    try {
      await updateWeatherData();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update weather" });
    }
  });

  // ============ GRAPH API ============
  app.get("/api/graph/nodes", async (_req: Request, res: Response) => {
    try {
      const nodes = await withRetry(() => db.select().from(graphNodes));
      res.json(nodes);
    } catch (error) {
      console.error("Error fetching nodes:", error);
      res.status(500).json({ error: "Failed to fetch nodes" });
    }
  });

  app.get("/api/graph/links", async (_req: Request, res: Response) => {
    try {
      const links = await withRetry(() => db.select().from(graphLinks));
      res.json(links);
    } catch (error) {
      console.error("Error fetching links:", error);
      res.status(500).json({ error: "Failed to fetch links" });
    }
  });

  // ============ COMMODITIES API ============
  app.get("/api/commodities", async (_req: Request, res: Response) => {
    try {
      const allCommodities = await withRetry(() => db.select().from(commodities));
      res.json(allCommodities);
    } catch (error) {
      console.error("Error fetching commodities:", error);
      res.status(500).json({ error: "Failed to fetch commodities" });
    }
  });

  // ============ RISK METRICS API ============
  app.get("/api/metrics", async (_req: Request, res: Response) => {
    try {
      // Get the latest metrics
      const [latestMetrics] = await withRetry(() => db
        .select()
        .from(riskMetrics)
        .orderBy(desc(riskMetrics.recorded_at))
        .limit(1));

      if (latestMetrics) {
        res.json(latestMetrics);
      } else {
        // Return default metrics if none exist
        res.json({
          overall_risk_score: 0.42,
          high_risk_vendors: 0,
          affected_countries: 0,
          active_events: 0,
          overconfidence_alerts: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  app.get("/api/metrics/timeline", async (_req: Request, res: Response) => {
    try {
      // Get last 30 days of metrics
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const timeline = await withRetry(() => db
        .select()
        .from(riskMetrics)
        .where(gte(riskMetrics.recorded_at, thirtyDaysAgo))
        .orderBy(riskMetrics.recorded_at));

      res.json(timeline);
    } catch (error) {
      console.error("Error fetching timeline:", error);
      res.status(500).json({ error: "Failed to fetch timeline" });
    }
  });

  // ============ SETTINGS API ============
  app.get("/api/settings/:deviceId", async (req: Request, res: Response) => {
    try {
      const { deviceId } = req.params;
      const [settings] = await withRetry(() => db
        .select()
        .from(userSettings)
        .where(eq(userSettings.device_id, deviceId)));

      if (settings) {
        res.json(settings);
      } else {
        // Return default settings
        res.json({
          device_id: deviceId,
          dark_mode: true,
          push_notifications: true,
          email_alerts: false,
          risk_threshold: 0.7,
          auto_refresh: true,
          refresh_interval: 300,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings/:deviceId", async (req: Request, res: Response) => {
    try {
      const { deviceId } = req.params;
      const updateData = { ...req.body, device_id: deviceId, updated_at: new Date() };

      // Upsert settings
      const [existing] = await withRetry(() => db
        .select()
        .from(userSettings)
        .where(eq(userSettings.device_id, deviceId)));

      if (existing) {
        const [updated] = await withRetry(() => db
          .update(userSettings)
          .set(updateData)
          .where(eq(userSettings.device_id, deviceId))
          .returning());
        res.json(updated);
      } else {
        const [created] = await withRetry(() => db
          .insert(userSettings)
          .values(updateData)
          .returning());
        res.json(created);
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // ============ DASHBOARD SUMMARY API ============
  app.get("/api/dashboard", async (_req: Request, res: Response) => {
    try {
      // Get all dashboard data and live counts in parallel
      const [
        latestMetrics,
        recentEvents,
        activeAlerts,
        allCommodities,
        weatherData,
        eventCount,
        alertCount,
        countryCountResult,
        vendorCountResult,
      ] = await Promise.all([
        withRetry(() => db.select().from(riskMetrics).orderBy(desc(riskMetrics.recorded_at)).limit(1)),
        withRetry(() => db.select().from(events).orderBy(desc(events.created_at)).limit(10)),
        withRetry(() => db.select().from(alerts).where(eq(alerts.is_dismissed, false)).orderBy(desc(alerts.created_at)).limit(10)),
        withRetry(() => db.select().from(commodities)),
        withRetry(() => db.select().from(weatherStatus)),
        withRetry(() => db.select({ count: sql<number>`count(*)` }).from(events)),
        withRetry(() => db.select({ count: sql<number>`count(*)` }).from(alerts).where(eq(alerts.is_dismissed, false))),
        withRetry(() => db.select({ count: sql<number>`count(distinct ${events.country})` }).from(events)),
        withRetry(() => db.select({ count: sql<number>`count(*)` }).from(graphNodes).where(and(eq(graphNodes.type, 'vendor'), gte(graphNodes.risk_score, 0.5)))),
      ]);

      const liveActiveEvents = Number(eventCount[0]?.count || 0);
      const liveActiveAlerts = Number(alertCount[0]?.count || 0);
      const liveAffectedCountries = Number(countryCountResult[0]?.count || 0);
      const liveHighRiskVendors = Number(vendorCountResult[0]?.count || 0);

      res.json({
        metrics: {
          ...(latestMetrics[0] || { overall_risk_score: 0.42 }),
          active_events: liveActiveEvents,
          overconfidence_alerts: liveActiveAlerts,
          affected_countries: liveAffectedCountries,
          high_risk_vendors: liveHighRiskVendors,
        },
        events: recentEvents,
        alerts: activeAlerts,
        commodities: allCommodities,
        weather: weatherData,
        system_status: {
          api: true,
          database: true,
          ai_service: !!process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
