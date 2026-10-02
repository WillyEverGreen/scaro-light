import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppSettings, Event, Alert, DashboardSummary } from "@/types/api";

const KEYS = {
  SETTINGS: "@scaro/settings",
  EVENTS_CACHE: "@scaro/events_cache",
  ALERTS_CACHE: "@scaro/alerts_cache",
  DASHBOARD_CACHE: "@scaro/dashboard_cache",
  QUERY_HISTORY: "@scaro/query_history",
} as const;

const DEFAULT_SETTINGS: AppSettings = {
  apiBaseUrl: "http://localhost:8000",
  theme: "system",
  notifications: true,
  alertThreshold: 0.85,
};

export async function getSettings(): Promise<AppSettings> {
  try {
    const stored = await AsyncStorage.getItem(KEYS.SETTINGS);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error("Error reading settings:", error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  try {
    const current = await getSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving settings:", error);
    throw error;
  }
}

export async function cacheEvents(events: Event[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.EVENTS_CACHE, JSON.stringify(events));
  } catch (error) {
    console.error("Error caching events:", error);
  }
}

export async function getCachedEvents(): Promise<Event[]> {
  try {
    const stored = await AsyncStorage.getItem(KEYS.EVENTS_CACHE);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading cached events:", error);
    return [];
  }
}

export async function cacheAlerts(alerts: Alert[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.ALERTS_CACHE, JSON.stringify(alerts));
  } catch (error) {
    console.error("Error caching alerts:", error);
  }
}

export async function getCachedAlerts(): Promise<Alert[]> {
  try {
    const stored = await AsyncStorage.getItem(KEYS.ALERTS_CACHE);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading cached alerts:", error);
    return [];
  }
}

export async function cacheDashboard(data: DashboardSummary): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.DASHBOARD_CACHE, JSON.stringify(data));
  } catch (error) {
    console.error("Error caching dashboard:", error);
  }
}

export async function getCachedDashboard(): Promise<DashboardSummary | null> {
  try {
    const stored = await AsyncStorage.getItem(KEYS.DASHBOARD_CACHE);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Error reading cached dashboard:", error);
    return null;
  }
}

export async function addQueryToHistory(query: string): Promise<void> {
  try {
    const history = await getQueryHistory();
    const updated = [query, ...history.filter((q) => q !== query)].slice(0, 20);
    await AsyncStorage.setItem(KEYS.QUERY_HISTORY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error adding query to history:", error);
  }
}

export async function getQueryHistory(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(KEYS.QUERY_HISTORY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading query history:", error);
    return [];
  }
}

export async function clearAllCache(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      KEYS.EVENTS_CACHE,
      KEYS.ALERTS_CACHE,
      KEYS.DASHBOARD_CACHE,
      KEYS.QUERY_HISTORY,
    ]);
  } catch (error) {
    console.error("Error clearing cache:", error);
    throw error;
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  } catch (error) {
    console.error("Error clearing all data:", error);
    throw error;
  }
}
