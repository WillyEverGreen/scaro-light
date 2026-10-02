// Bypass SSL verification for corporate networks (Firewall/Zscaler)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import Parser from "rss-parser";
import OpenAI from "openai";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { events, alerts } from "@shared/schema";

const RSS_SOURCES = [
    { name: "Reuters Logistics", url: "https://www.reuters.com/arc/outboundfeeds/news-handler/?facetId=business-logistics&size=10" },
    { name: "CNBC Supply Chain", url: "https://www.cnbc.com/id/10001099/device/rss/rss.html" },
    { name: "The Loadstar", url: "https://theloadstar.com/feed/" },
    { name: "Maritime Executive", url: "https://maritime-executive.com/rss" },
    { name: "GCaptain", url: "https://gcaptain.com/feed/" },
    { name: "Supply Chain Dive", url: "https://www.supplychaindive.com/feeds/news/" },
    { name: "SupplyChainBrain", url: "https://www.supplychainbrain.com/rss/all" },
    { name: "Inbound Logistics", url: "https://www.inboundlogistics.com/feed/" }
];
const DEFAULT_LIMIT_PER_SOURCE = 3;

type ScraperOptions = {
    limit?: number;
    dryRun?: boolean;
    rssUrl?: string;
};

// Initialize OpenRouter client
const openai = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "https://openrouter.ai/api/v1",
});

type ScrapedItem = {
    title: string;
    link: string;
    description: string;
    pubDate: string;
};

const FALLBACK_ITEMS: ScrapedItem[] = [
    {
        title: "Typhoon disrupts key Asian shipping lanes",
        link: "https://example.com/weather-disruption",
        description: "Major typhoon forces port closures and delays across East Asia trade routes.",
        pubDate: new Date().toISOString(),
    },
    {
        title: "Copper prices spike on mine shutdown",
        link: "https://example.com/commodity-copper",
        description: "Unexpected maintenance at a top copper mine triggers supply concerns and price volatility.",
        pubDate: new Date().toISOString(),
    },
    {
        title: "New export controls hit semiconductor supply chain",
        link: "https://example.com/trade-semiconductors",
        description: "Fresh restrictions on advanced chip equipment exports raise lead times for foundries.",
        pubDate: new Date().toISOString(),
    },
];

export async function scrapeSupplyChainNews(options: ScraperOptions = {}) {
    const { limit = DEFAULT_LIMIT_PER_SOURCE, dryRun = false } = options;
    const parser = new Parser();
    const allScrapedEvents = [];

    for (const source of RSS_SOURCES) {
        console.log(`Starting news scrape from ${source.name}:`, source.url, dryRun ? "(dry run)" : "");

        try {
            let feed;
            try {
                feed = await parser.parseURL(source.url);
                console.log(`Fetched ${feed.items.length} items from ${source.name}`);
            } catch (err) {
                console.warn(`RSS fetch failed for ${source.name}, skipping source:`, err);
                continue;
            }

            const items = feed.items.slice(0, limit);

            for (const item of items) {
                if (!item.title || !item.link) continue;

                if (!dryRun) {
                    const duplicate = await db
                        .select({ id: events.id })
                        .from(events)
                        .where(eq(events.source, item.link))
                        .limit(1);
                    if (duplicate.length) {
                        console.log(`Skipping existing event from ${source.name}:`, item.title);
                        continue;
                    }
                }

                const analysis = await analyzeWithAI(item.title, item.contentSnippet || item.description || "");
                const record = {
                    title: item.title,
                    description: analysis.summary,
                    category: analysis.category,
                    severity: analysis.severity,
                    country: analysis.country || "Global",
                    impact_score: analysis.impact_score,
                    source: item.link,
                };

                if (dryRun) {
                    allScrapedEvents.push({ ...record, id: null, created_at: new Date(), updated_at: new Date() });
                } else {
                    const event = await db.insert(events).values(record).returning();
                    allScrapedEvents.push(event[0]);

                    // AUTO-GENERATE ALERT FOR HIGH RISK
                    if (analysis.impact_score >= 6) {
                        await db.insert(alerts).values({
                            title: `[LIVE ALERT] ${analysis.category.toUpperCase()}: ${item.title.slice(0, 50)}...`,
                            description: `${analysis.summary} Impact Score: ${analysis.impact_score}/10. (Source: ${source.name})`,
                            severity: analysis.severity,
                            type: analysis.category,
                            is_read: false,
                            is_dismissed: false,
                        });
                        console.log(`Promoted high-risk event to Alert: ${item.title}`);
                    }
                }
            }
        } catch (sourceError) {
            console.error(`Error processing source ${source.name}:`, sourceError);
        }
    }

    return allScrapedEvents;
}

async function analyzeWithAI(title: string, description: string) {
    const fallback = buildFallbackAnalysis(title, description);

    if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
        console.warn("AI key missing, using fallback analysis.");
        return fallback;
    }

    try {
        const prompt = `
      Analyze this supply chain news item:
      Title: ${title}
      Description: ${description}

      Return a JSON object with:
      - summary: A concise summary (max 2 sentences)
      - category: One of [geopolitical, weather, trade_restriction, commodity, vendor, economic]
      - severity: One of [low, medium, high, critical]
      - country: Primary country affected (or "Global")
      - impact_score: A number 1-10 indicating impact
    `;

        const response = await openai.chat.completions.create({
            model: "openai/gpt-3.5-turbo", // OpenRouter maps this effectively
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
        });

        const content = response.choices[0].message.content;
        if (!content) return fallback;

        const parsed = JSON.parse(content);
        return {
            ...fallback,
            ...parsed,
        };
    } catch (error) {
        console.error("AI Analysis failed:", error);
        return fallback;
    }
}

function buildFallbackAnalysis(title: string, description: string) {
    const text = description || title;
    return {
        summary: text.slice(0, 200) || "No summary available",
        category: "economic",
        severity: "low",
        country: "Global",
        impact_score: 1,
    };
}
