import type {
  RiskMetrics,
  Event,
  TimelinePoint,
  CommodityStatus,
  SystemStatus,
  WeatherStatus,
  Alert,
  GraphNode,
  GraphLink,
  VendorRisk,
  OverconfidenceAlert,
  TradeRestriction,
} from "@/types/api";

export const mockRiskMetrics: RiskMetrics = {
  overall_risk_score: 0.67,
  overconfidence_alerts: 12,
  high_risk_vendors: 8,
  affected_countries: 15,
  active_events: 47,
};

export const mockSystemStatus: SystemStatus = {
  api: true,
  database: true,
  ai_service: true,
};

export const mockEvents: Event[] = [
  {
    id: "evt-1",
    title: "Taiwan Semiconductor Production Slowdown Due to Water Shortage",
    category: "commodity",
    severity: "high",
    country: "TWN",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    description: "TSMC reports 15% production reduction due to ongoing drought conditions.",
    risk_score: 0.78,
  },
  {
    id: "evt-2",
    title: "New US Export Controls on Advanced AI Chips",
    category: "trade_restriction",
    severity: "critical",
    country: "USA",
    created_at: new Date(Date.now() - 7200000).toISOString(),
    description: "Department of Commerce announces expanded restrictions on semiconductor exports.",
    risk_score: 0.92,
  },
  {
    id: "evt-3",
    title: "Typhoon Warning for South China Sea Shipping Routes",
    category: "weather",
    severity: "medium",
    country: "CHN",
    created_at: new Date(Date.now() - 10800000).toISOString(),
    description: "Category 3 typhoon expected to disrupt major shipping lanes for 3-5 days.",
    risk_score: 0.55,
  },
  {
    id: "evt-4",
    title: "German Auto Parts Supplier Files for Bankruptcy",
    category: "vendor",
    severity: "high",
    country: "DEU",
    created_at: new Date(Date.now() - 14400000).toISOString(),
    description: "Major Tier-1 supplier serving BMW and Volkswagen enters insolvency proceedings.",
    risk_score: 0.71,
  },
  {
    id: "evt-5",
    title: "EU-China Trade Tensions Escalate Over EV Tariffs",
    category: "geopolitical",
    severity: "medium",
    country: "EUR",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    description: "European Commission announces provisional tariffs on Chinese electric vehicles.",
    risk_score: 0.58,
  },
  {
    id: "evt-6",
    title: "Rare Earth Mining Operations Suspended in Myanmar",
    category: "commodity",
    severity: "high",
    country: "MMR",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    description: "Political instability forces closure of key rare earth extraction facilities.",
    risk_score: 0.74,
  },
];

export const mockTimeline: TimelinePoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toISOString().split("T")[0],
    risk_score: 0.45 + Math.random() * 0.35,
    event_count: Math.floor(Math.random() * 15) + 5,
  };
});

export const mockCommodities: CommodityStatus[] = [
  { name: "Semiconductors", mention_count: 156, avg_risk_score: 0.72, trend: "up" },
  { name: "Batteries", mention_count: 89, avg_risk_score: 0.58, trend: "stable" },
  { name: "Rare Earth Metals", mention_count: 67, avg_risk_score: 0.81, trend: "up" },
  { name: "Steel", mention_count: 43, avg_risk_score: 0.34, trend: "down" },
  { name: "Lithium", mention_count: 78, avg_risk_score: 0.65, trend: "up" },
];

export const mockWeather: WeatherStatus[] = [
  {
    port: "Shanghai",
    country: "China",
    temperature_c: 28,
    wind_speed_kmh: 15,
    precipitation_mm: 0,
    condition: "Cloudy",
    status: "normal",
  },
  {
    port: "Rotterdam",
    country: "Netherlands",
    temperature_c: 18,
    wind_speed_kmh: 25,
    precipitation_mm: 5,
    condition: "Rain",
    status: "warning",
    alert: "Strong winds expected",
  },
  {
    port: "Los Angeles",
    country: "United States",
    temperature_c: 24,
    wind_speed_kmh: 10,
    precipitation_mm: 0,
    condition: "Sunny",
    status: "normal",
  },
  {
    port: "Singapore",
    country: "Singapore",
    temperature_c: 31,
    wind_speed_kmh: 8,
    precipitation_mm: 12,
    condition: "Storm",
    status: "critical",
    alert: "Thunderstorm activity affecting operations",
  },
  {
    port: "Hamburg",
    country: "Germany",
    temperature_c: 16,
    wind_speed_kmh: 20,
    precipitation_mm: 2,
    condition: "Cloudy",
    status: "normal",
  },
];

export const mockAlerts: Alert[] = [
  {
    id: "alert-1",
    title: "Critical Risk Level Detected",
    description: "Overall supply chain risk score has exceeded 85% threshold for semiconductor sector.",
    severity: "critical",
    category: "risk",
    created_at: new Date(Date.now() - 1800000).toISOString(),
    dismissed: false,
  },
  {
    id: "alert-2",
    title: "New Trade Restriction",
    description: "US Department of Commerce has added new entities to export control list.",
    severity: "high",
    category: "trade",
    created_at: new Date(Date.now() - 7200000).toISOString(),
    dismissed: false,
  },
  {
    id: "alert-3",
    title: "Weather Warning",
    description: "Typhoon approaching major shipping route in South China Sea.",
    severity: "medium",
    category: "weather",
    created_at: new Date(Date.now() - 14400000).toISOString(),
    dismissed: false,
  },
];

export const mockGraphNodes: GraphNode[] = [
  { id: "v1", label: "TSMC", type: "vendor", properties: { tier: 1 }, risk_score: 0.72 },
  { id: "v2", label: "Samsung", type: "vendor", properties: { tier: 1 }, risk_score: 0.45 },
  { id: "v3", label: "Intel", type: "vendor", properties: { tier: 1 }, risk_score: 0.38 },
  { id: "c1", label: "Taiwan", type: "country", properties: {}, risk_score: 0.78 },
  { id: "c2", label: "South Korea", type: "country", properties: {}, risk_score: 0.42 },
  { id: "c3", label: "USA", type: "country", properties: {}, risk_score: 0.35 },
  { id: "p1", label: "5nm Chips", type: "product", properties: {}, risk_score: 0.68 },
  { id: "p2", label: "Memory", type: "product", properties: {}, risk_score: 0.52 },
  { id: "e1", label: "Water Shortage", type: "event", properties: {}, risk_score: 0.85 },
];

export const mockGraphLinks: GraphLink[] = [
  { source: "v1", target: "c1", type: "located_in", properties: {}, weight: 1 },
  { source: "v2", target: "c2", type: "located_in", properties: {}, weight: 1 },
  { source: "v3", target: "c3", type: "located_in", properties: {}, weight: 1 },
  { source: "v1", target: "p1", type: "supplies_to", properties: {}, weight: 0.8 },
  { source: "v2", target: "p2", type: "supplies_to", properties: {}, weight: 0.6 },
  { source: "c1", target: "e1", type: "affected_by", properties: {}, weight: 0.9 },
];

export const mockVendorRisks: VendorRisk[] = [
  { id: "v1", name: "TSMC", country: "TWN", risk_score: 0.72, dependency_percentage: 54, fragility: 0.68, stability: 0.75 },
  { id: "v2", name: "Samsung Electronics", country: "KOR", risk_score: 0.45, dependency_percentage: 28, fragility: 0.42, stability: 0.82 },
  { id: "v3", name: "Intel Corporation", country: "USA", risk_score: 0.38, dependency_percentage: 18, fragility: 0.35, stability: 0.88 },
  { id: "v4", name: "ASML", country: "NLD", risk_score: 0.52, dependency_percentage: 12, fragility: 0.48, stability: 0.79 },
];

export const mockOverconfidenceAlerts: OverconfidenceAlert[] = [
  {
    id: "oc-1",
    vendor_id: "v1",
    vendor_name: "TSMC",
    confidence_gap: 0.23,
    alert_level: "high",
    explanation: "Market confidence significantly exceeds actual stability metrics based on geopolitical factors.",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "oc-2",
    vendor_id: "v4",
    vendor_name: "ASML",
    confidence_gap: 0.15,
    alert_level: "medium",
    explanation: "Dependency concentration poses underestimated risk in EUV equipment supply.",
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

export const mockTradeRestrictions: TradeRestriction[] = [
  {
    id: "tr-1",
    source_country: "USA",
    target_country: "CHN",
    type: "export_control",
    source_authority: "OFAC",
    commodities: ["Advanced semiconductors", "AI chips", "Quantum computing"],
    effective_date: "2024-01-15",
    description: "Expanded export controls on advanced computing and semiconductor manufacturing equipment.",
  },
  {
    id: "tr-2",
    source_country: "EUR",
    target_country: "RUS",
    type: "sanction",
    source_authority: "EU",
    commodities: ["Oil", "Natural gas", "Steel"],
    effective_date: "2024-02-01",
    description: "Extended sanctions on energy and industrial products.",
  },
];

export const exampleQueries = [
  "What are the biggest risks in Taiwan?",
  "Impact of US-China trade tensions?",
  "Weather disruptions affecting ports?",
  "Semiconductor supply chain vulnerabilities?",
  "Which vendors have highest risk?",
];
