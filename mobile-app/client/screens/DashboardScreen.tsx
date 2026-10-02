import React, { useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { Alert } from "react-native";
import { usePushNotifications } from "@/hooks/usePushNotifications";

import { ThemedText } from "@/components/ThemedText";
import { StatusIndicator } from "@/components/StatusIndicator";
import { MetricCard } from "@/components/MetricCard";
import { RiskGauge } from "@/components/RiskGauge";
import { EventCard } from "@/components/EventCard";
import { CommodityCard } from "@/components/CommodityCard";
import { RiskChart } from "@/components/RiskChart";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import {
  MetricCardSkeleton,
  EventCardSkeleton,
  ChartSkeleton,
} from "@/components/LoadingSkeleton";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { Event, CommodityStatus, TimelinePoint, RiskMetrics, SystemStatus } from "@/types/api";

interface DashboardData {
  metrics: RiskMetrics;
  events: Array<{
    id: string;
    title: string;
    description?: string;
    category: string;
    severity: string;
    country: string;
    impact_score?: number;
    source?: string;
    created_at: string;
  }>;
  alerts: Array<{
    id: string;
    title: string;
    description?: string;
    severity: string;
    type: string;
    is_read: boolean;
    is_dismissed: boolean;
    created_at: string;
  }>;
  commodities: Array<{
    id: string;
    name: string;
    avg_risk_score: number;
    mention_count: number;
    trend: string;
    price_change_pct: number;
  }>;
  weather: Array<{
    id: string;
    port: string;
    country: string;
    condition: string;
    temperature_c: number;
    wind_speed_kmh: number;
    humidity: number;
    status: string;
  }>;
  system_status: SystemStatus;
}

interface TimelineData {
  id: string;
  overall_risk_score: number;
  high_risk_vendors: number;
  affected_countries: number;
  active_events: number;
  overconfidence_alerts: number;
  recorded_at: string;
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const { sendLocalNotification } = usePushNotifications();

  const { data: dashboard, isLoading, isRefetching } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    staleTime: 30000,
  });

  const { data: timeline } = useQuery<TimelineData[]>({
    queryKey: ["/api/metrics/timeline"],
    staleTime: 60000,
  });

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    await queryClient.invalidateQueries({ queryKey: ["/api/metrics/timeline"] });
  }, [queryClient]);

  const handleRefetchNews = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await apiRequest("POST", "/api/scraper/trigger");
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      // Also update weather while we are at it
      apiRequest("POST", "/api/weather/update").catch(() => { });

      // Trigger notification for demo
      sendLocalNotification("News Refetched", "AI analysis complete. New risks may have been detected.");
    } catch (error) {
      Alert.alert("Error", "Failed to fetch latest news");
    }
  };

  const metrics = dashboard?.metrics || {
    overall_risk_score: 0,
    overconfidence_alerts: 0,
    high_risk_vendors: 0,
    affected_countries: 0,
    active_events: 0,
  };

  const systemStatus = dashboard?.system_status || {
    api: false,
    database: false,
    ai_service: false,
  };

  const events: Event[] = (dashboard?.events || []).map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category as Event["category"],
    severity: e.severity as Event["severity"],
    country: e.country,
    created_at: e.created_at,
    description: e.description,
    risk_score: e.impact_score,
  }));

  const commodities: CommodityStatus[] = (dashboard?.commodities || []).map((c) => ({
    name: c.name,
    mention_count: c.mention_count,
    avg_risk_score: c.avg_risk_score,
    trend: c.trend as CommodityStatus["trend"],
  }));

  const timelineData: TimelinePoint[] = (timeline || []).map((t) => ({
    date: t.recorded_at.split("T")[0],
    risk_score: t.overall_risk_score,
    event_count: t.active_events,
  }));

  const renderStatusBar = () => (
    <View style={styles.statusBar}>
      <StatusIndicator
        label="API"
        status={systemStatus.api ? "connected" : "disconnected"}
      />
      <StatusIndicator
        label="Database"
        status={systemStatus.database ? "connected" : "disconnected"}
      />
      <StatusIndicator
        label="AI Service"
        status={systemStatus.ai_service ? "connected" : "warning"}
      />
    </View>
  );

  const renderRiskOverview = () => (
    <View style={[styles.riskOverview, { backgroundColor: theme.backgroundDefault }]}>
      <RiskGauge score={metrics.overall_risk_score} size={140} />
    </View>
  );

  const renderMetrics = () => (
    <View style={styles.metricsGrid}>
      <View style={styles.metricsRow}>
        {isLoading ? (
          <>
            <MetricCardSkeleton style={{ flex: 1, marginRight: Spacing.sm }} />
            <MetricCardSkeleton style={{ flex: 1 }} />
          </>
        ) : (
          <>
            <MetricCard
              label="Alerts"
              value={metrics.overconfidence_alerts}
              icon="warning-outline"
              trend="up"
              trendValue={`+${Math.min(metrics.overconfidence_alerts, 5)}`}
            />
            <View style={{ width: Spacing.sm }} />
            <MetricCard
              label="High Risk Vendors"
              value={metrics.high_risk_vendors}
              icon="business-outline"
              trend="stable"
            />
          </>
        )}
      </View>
      <View style={[styles.metricsRow, { marginTop: Spacing.sm }]}>
        {isLoading ? (
          <>
            <MetricCardSkeleton style={{ flex: 1, marginRight: Spacing.sm }} />
            <MetricCardSkeleton style={{ flex: 1 }} />
          </>
        ) : (
          <>
            <MetricCard
              label="Countries"
              value={metrics.affected_countries}
              icon="globe-outline"
            />
            <View style={{ width: Spacing.sm }} />
            <MetricCard
              label="Active Events"
              value={metrics.active_events}
              icon="pulse-outline"
              trend="up"
              trendValue={`+${Math.min(metrics.active_events, 12)}`}
            />
          </>
        )}
      </View>
    </View>
  );

  const renderChart = () => (
    isLoading ? <ChartSkeleton /> : <RiskChart data={timelineData} />
  );

  const renderCommodities = () => (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={commodities}
      keyExtractor={(item) => item.name}
      renderItem={({ item }) => <CommodityCard commodity={item} />}
      contentContainerStyle={styles.commoditiesList}
      ListEmptyComponent={
        <ThemedText style={{ color: theme.textSecondary, padding: Spacing.lg }}>
          No commodity data available
        </ThemedText>
      }
    />
  );

  const renderEvents = () => {
    if (events.length === 0 && !isLoading) {
      return (
        <EmptyState
          image={require("../../assets/images/empty-events.png")}
          title="No recent events"
          description="Supply chain events will appear here when detected."
        />
      );
    }

    return (
      <View>
        {isLoading ? (
          <>
            <EventCardSkeleton />
            <EventCardSkeleton />
            <EventCardSkeleton />
          </>
        ) : (
          events.slice(0, 5).map((event) => (
            <EventCard key={event.id} event={event} />
          ))
        )}
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={onRefresh}
          tintColor={theme.link}
        />
      }
    >
      {renderStatusBar()}
      {renderRiskOverview()}
      {renderMetrics()}

      <SectionHeader title="Risk Trend" />
      {renderChart()}

      <SectionHeader title="Commodities" actionLabel="View All" onAction={() => { }} />
      {renderCommodities()}

      <SectionHeader title="Recent Events" actionLabel="Refetch News" onAction={handleRefetchNews} />
      {renderEvents()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBar: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  riskOverview: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  metricsGrid: {},
  metricsRow: {
    flexDirection: "row",
  },
  commoditiesList: {
    paddingRight: Spacing.lg,
  },
});
