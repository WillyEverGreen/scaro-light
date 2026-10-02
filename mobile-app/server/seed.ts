import { db } from "./db";
import {
  events,
  alerts,
  weatherStatus,
  graphNodes,
  graphLinks,
  commodities,
  riskMetrics,
} from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Seed Events
  const eventData = [
    {
      title: "Red Sea Shipping Disruption",
      description: "Houthi attacks force major shipping lines to reroute around Cape of Good Hope, adding 10-14 days to Asia-Europe shipments.",
      category: "geopolitical",
      severity: "critical",
      country: "Yemen",
      impact_score: 0.92,
      source: "Reuters",
    },
    {
      title: "Taiwan Semiconductor Production Alert",
      description: "Earthquake near Hsinchu causes temporary halt at major fabrication facilities. Full impact assessment ongoing.",
      category: "commodity",
      severity: "high",
      country: "Taiwan",
      impact_score: 0.85,
      source: "Bloomberg",
    },
    {
      title: "Panama Canal Drought Restrictions",
      description: "Water levels at historic lows. Daily transits reduced from 36 to 22 vessels. Booking slots now 3 weeks out.",
      category: "weather",
      severity: "high",
      country: "Panama",
      impact_score: 0.78,
      source: "Panama Canal Authority",
    },
    {
      title: "EU Carbon Border Tax Implementation",
      description: "New CBAM regulations effective Q1 2026 will impact steel, aluminum, and cement imports from non-EU countries.",
      category: "trade_restriction",
      severity: "medium",
      country: "Germany",
      impact_score: 0.65,
      source: "European Commission",
    },
    {
      title: "Chinese Rare Earth Export Controls",
      description: "Beijing announces new licensing requirements for gallium and germanium exports, affecting semiconductor supply chains.",
      category: "trade_restriction",
      severity: "high",
      country: "China",
      impact_score: 0.82,
      source: "SCMP",
    },
    {
      title: "Port of Los Angeles Labor Dispute",
      description: "Dockworkers union negotiations stalled. Potential slowdown could affect 40% of US container imports.",
      category: "vendor",
      severity: "medium",
      country: "United States",
      impact_score: 0.58,
      source: "WSJ",
    },
    {
      title: "Australian Lithium Mine Expansion",
      description: "Greenbushes mine announces 30% capacity increase, easing battery supply constraints by 2026.",
      category: "commodity",
      severity: "low",
      country: "Australia",
      impact_score: 0.25,
      source: "Mining Weekly",
    },
    {
      title: "Mexico Nearshoring Boom",
      description: "Foreign direct investment up 45% as manufacturers relocate from Asia. Infrastructure strain emerging in Monterrey.",
      category: "economic",
      severity: "medium",
      country: "Mexico",
      impact_score: 0.52,
      source: "Financial Times",
    },
  ];

  await db.delete(events);
  await db.insert(events).values(eventData);
  console.log("Seeded events");

  // Seed Alerts
  const alertData = [
    {
      title: "Critical: Red Sea Risk Score Exceeded Threshold",
      description: "Regional risk score reached 0.92, exceeding your alert threshold of 0.70",
      severity: "critical",
      type: "risk_threshold",
      is_read: false,
      is_dismissed: false,
    },
    {
      title: "Typhoon Warning: South China Sea",
      description: "Super Typhoon forming. Expected to impact Hong Kong and Shenzhen ports in 72 hours.",
      severity: "high",
      type: "weather",
      is_read: false,
      is_dismissed: false,
    },
    {
      title: "Vendor Alert: Foxconn Capacity Reduction",
      description: "Key tier-1 supplier reports 15% capacity reduction due to labor shortage.",
      severity: "medium",
      type: "vendor",
      is_read: false,
      is_dismissed: false,
    },
    {
      title: "Commodity Price Spike: Copper +8.5%",
      description: "Copper futures up 8.5% in 24 hours following Chilean mine strike.",
      severity: "high",
      type: "price_change",
      is_read: true,
      is_dismissed: false,
    },
    {
      title: "New Trade Restriction: US-China Tech Export",
      description: "Commerce Department adds 35 Chinese entities to export restriction list.",
      severity: "high",
      type: "risk_threshold",
      is_read: false,
      is_dismissed: false,
    },
  ];

  await db.delete(alerts);
  await db.insert(alerts).values(alertData);
  console.log("Seeded alerts");

  // Seed Weather Status for major ports
  const weatherData = [
    { port: "Singapore", country: "Singapore", condition: "Partly Cloudy", temperature_c: 31, wind_speed_kmh: 12, humidity: 78, status: "normal", lat: 1.29, lon: 103.85 },
    { port: "Shanghai", country: "China", condition: "Overcast", temperature_c: 18, wind_speed_kmh: 22, humidity: 65, status: "normal", lat: 31.23, lon: 121.47 },
    { port: "Rotterdam", country: "Netherlands", condition: "Rain", temperature_c: 8, wind_speed_kmh: 35, humidity: 88, status: "warning", lat: 51.92, lon: 4.48 },
    { port: "Los Angeles", country: "United States", condition: "Clear", temperature_c: 22, wind_speed_kmh: 8, humidity: 55, status: "normal", lat: 33.75, lon: -118.25 },
    { port: "Hong Kong", country: "China", condition: "Thunderstorm", temperature_c: 28, wind_speed_kmh: 65, humidity: 92, status: "critical", lat: 22.32, lon: 114.17 },
    { port: "Dubai", country: "UAE", condition: "Sunny", temperature_c: 38, wind_speed_kmh: 15, humidity: 45, status: "normal", lat: 25.27, lon: 55.29 },
    { port: "Busan", country: "South Korea", condition: "Cloudy", temperature_c: 15, wind_speed_kmh: 18, humidity: 70, status: "normal", lat: 35.18, lon: 129.08 },
    { port: "Hamburg", country: "Germany", condition: "Fog", temperature_c: 6, wind_speed_kmh: 8, humidity: 95, status: "warning", lat: 53.55, lon: 9.99 },
  ];

  await db.delete(weatherStatus);
  await db.insert(weatherStatus).values(weatherData);
  console.log("Seeded weather");

  // Seed Graph Nodes
  const nodeData = [
    { id: "vendor-foxconn", label: "Foxconn", type: "vendor", risk_score: 0.65 },
    { id: "vendor-samsung", label: "Samsung", type: "vendor", risk_score: 0.35 },
    { id: "vendor-tsmc", label: "TSMC", type: "vendor", risk_score: 0.72 },
    { id: "vendor-bosch", label: "Bosch", type: "vendor", risk_score: 0.28 },
    { id: "vendor-catl", label: "CATL", type: "vendor", risk_score: 0.55 },
    { id: "country-china", label: "China", type: "country", risk_score: 0.68 },
    { id: "country-taiwan", label: "Taiwan", type: "country", risk_score: 0.75 },
    { id: "country-germany", label: "Germany", type: "country", risk_score: 0.22 },
    { id: "country-us", label: "United States", type: "country", risk_score: 0.30 },
    { id: "country-korea", label: "South Korea", type: "country", risk_score: 0.35 },
    { id: "product-chips", label: "Semiconductors", type: "product", risk_score: 0.82 },
    { id: "product-batteries", label: "EV Batteries", type: "product", risk_score: 0.58 },
    { id: "product-displays", label: "Displays", type: "product", risk_score: 0.45 },
    { id: "event-redsea", label: "Red Sea Disruption", type: "event", risk_score: 0.92 },
    { id: "event-taiwan-quake", label: "Taiwan Earthquake", type: "event", risk_score: 0.85 },
  ];

  await db.delete(graphNodes);
  await db.insert(graphNodes).values(nodeData);
  console.log("Seeded graph nodes");

  // Seed Graph Links
  const linkData = [
    { source: "vendor-foxconn", target: "country-china", strength: 0.9, type: "located_in" },
    { source: "vendor-tsmc", target: "country-taiwan", strength: 0.95, type: "located_in" },
    { source: "vendor-samsung", target: "country-korea", strength: 0.85, type: "located_in" },
    { source: "vendor-bosch", target: "country-germany", strength: 0.8, type: "located_in" },
    { source: "vendor-catl", target: "country-china", strength: 0.9, type: "located_in" },
    { source: "vendor-tsmc", target: "product-chips", strength: 0.95, type: "supplies" },
    { source: "vendor-samsung", target: "product-displays", strength: 0.8, type: "supplies" },
    { source: "vendor-samsung", target: "product-chips", strength: 0.6, type: "supplies" },
    { source: "vendor-catl", target: "product-batteries", strength: 0.9, type: "supplies" },
    { source: "event-redsea", target: "country-china", strength: 0.7, type: "affects" },
    { source: "event-taiwan-quake", target: "vendor-tsmc", strength: 0.9, type: "affects" },
    { source: "event-taiwan-quake", target: "product-chips", strength: 0.85, type: "affects" },
  ];

  await db.delete(graphLinks);
  await db.insert(graphLinks).values(linkData);
  console.log("Seeded graph links");

  // Seed Commodities
  const commodityData = [
    { name: "Semiconductors", avg_risk_score: 0.82, mention_count: 145, trend: "up", price_change_pct: 12.5 },
    { name: "Lithium", avg_risk_score: 0.58, mention_count: 89, trend: "up", price_change_pct: 8.2 },
    { name: "Copper", avg_risk_score: 0.52, mention_count: 67, trend: "up", price_change_pct: 8.5 },
    { name: "Rare Earths", avg_risk_score: 0.75, mention_count: 112, trend: "up", price_change_pct: 15.3 },
    { name: "Steel", avg_risk_score: 0.38, mention_count: 54, trend: "stable", price_change_pct: 2.1 },
    { name: "Aluminum", avg_risk_score: 0.42, mention_count: 48, trend: "down", price_change_pct: -3.5 },
    { name: "Natural Gas", avg_risk_score: 0.55, mention_count: 78, trend: "up", price_change_pct: 6.8 },
    { name: "Crude Oil", avg_risk_score: 0.48, mention_count: 95, trend: "stable", price_change_pct: 1.2 },
  ];

  await db.delete(commodities);
  await db.insert(commodities).values(commodityData);
  console.log("Seeded commodities");

  // Seed Risk Metrics (last 30 days of historical data)
  await db.delete(riskMetrics);
  const metricsData = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    metricsData.push({
      overall_risk_score: 0.35 + Math.random() * 0.25 + (i < 10 ? 0.15 : 0), // Recent spike
      high_risk_vendors: Math.floor(3 + Math.random() * 5),
      affected_countries: Math.floor(8 + Math.random() * 7),
      active_events: Math.floor(5 + Math.random() * 10),
      overconfidence_alerts: Math.floor(2 + Math.random() * 4),
      recorded_at: date,
    });
  }
  await db.insert(riskMetrics).values(metricsData);
  console.log("Seeded risk metrics");

  console.log("Database seeding complete!");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
