export interface RiskMetrics {
  overall_risk_score: number;
  overconfidence_alerts: number;
  high_risk_vendors: number;
  affected_countries: number;
  active_events: number;
}

export interface Event {
  id: string;
  title: string;
  category: "geopolitical" | "weather" | "trade_restriction" | "commodity" | "vendor" | "economic" | "other";
  severity: "low" | "medium" | "high" | "critical";
  country: string;
  created_at: string;
  description?: string;
  source_url?: string;
  risk_score?: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type: "vendor" | "country" | "product" | "event";
  properties: Record<string, unknown>;
  risk_score?: number;
  color?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  type: "supplies_to" | "located_in" | "affected_by" | "depends_on";
  properties: Record<string, unknown>;
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface QueryResponse {
  query: string;
  answer: string;
  sources: Source[];
  confidence: number;
  processing_time_ms: number;
}

export interface Source {
  id: string;
  title: string;
  url?: string;
  type: string;
  relevance_score: number;
  snippet: string;
}

export interface WeatherStatus {
  port: string;
  country: string;
  temperature_c: number;
  wind_speed_kmh: number;
  precipitation_mm: number;
  condition: string;
  status: "normal" | "warning" | "critical";
  alert?: string;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  created_at: string;
  dismissed: boolean;
}

export interface DashboardSummary {
  metrics: RiskMetrics;
  recent_events: Event[];
  system_status: SystemStatus;
}

export interface SystemStatus {
  api: boolean;
  database: boolean;
  ai_service: boolean;
}

export interface TimelinePoint {
  date: string;
  risk_score: number;
  event_count: number;
}

export interface CommodityStatus {
  name: string;
  mention_count: number;
  avg_risk_score: number;
  trend: "up" | "down" | "stable";
}

export interface ScrapingJob {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  query?: string;
  started_at?: string;
  completed_at?: string;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error";
  message: string;
}

export interface RiskBreakdown {
  fragility_index: number;
  stability_index: number;
  event_impact: number;
  confidence_gap: number;
}

export interface VendorRisk {
  id: string;
  name: string;
  country: string;
  risk_score: number;
  dependency_percentage: number;
  fragility: number;
  stability: number;
}

export interface OverconfidenceAlert {
  id: string;
  vendor_id: string;
  vendor_name: string;
  confidence_gap: number;
  alert_level: "low" | "medium" | "high" | "critical";
  explanation: string;
  created_at: string;
}

export interface TradeRestriction {
  id: string;
  source_country: string;
  target_country: string;
  type: "sanction" | "embargo" | "export_control";
  source_authority: "OFAC" | "EU" | "Other";
  commodities: string[];
  effective_date: string;
  description: string;
}

export interface AppSettings {
  apiBaseUrl: string;
  theme: "light" | "dark" | "system";
  notifications: boolean;
  alertThreshold: number;
}
