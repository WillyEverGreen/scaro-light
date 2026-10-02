import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { WeatherCard } from "@/components/WeatherCard";
import { AlertCard } from "@/components/AlertCard";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import type { WeatherStatus, Alert } from "@/types/api";

type TabType = "weather" | "alerts";

interface WeatherData {
  id: string;
  port: string;
  country: string;
  condition: string;
  temperature_c: number;
  wind_speed_kmh: number;
  humidity: number;
  status: string;
}

interface AlertData {
  id: string;
  title: string;
  description?: string;
  severity: string;
  type: string;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

export default function MonitorScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>("weather");

  const { data: weatherData, isLoading: weatherLoading, isRefetching: weatherRefetching } = useQuery<WeatherData[]>({
    queryKey: ["/api/weather"],
    staleTime: 60000,
  });

  const { data: alertsData, isLoading: alertsLoading, isRefetching: alertsRefetching } = useQuery<AlertData[]>({
    queryKey: ["/api/alerts"],
    staleTime: 30000,
  });

  const dismissAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await apiRequest("PATCH", `/api/alerts/${alertId}/dismiss`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
    },
  });

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeTab === "weather") {
      await queryClient.invalidateQueries({ queryKey: ["/api/weather"] });
    } else {
      await queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
    }
  }, [activeTab, queryClient]);

  const handleTabChange = (tab: TabType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const handleDismissAlert = (alertId: string) => {
    dismissAlertMutation.mutate(alertId);
  };

  const weather: WeatherStatus[] = (weatherData || []).map((w) => ({
    port: w.port,
    country: w.country,
    temperature_c: w.temperature_c,
    wind_speed_kmh: w.wind_speed_kmh,
    precipitation_mm: 0,
    condition: w.condition,
    status: w.status as WeatherStatus["status"],
    alert: w.status === "critical" ? "Operations may be affected" : undefined,
  }));

  const alerts: Alert[] = (alertsData || []).map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description || "",
    severity: a.severity as Alert["severity"],
    category: a.type,
    created_at: a.created_at,
    dismissed: a.is_dismissed,
  }));

  const renderTabButton = (tab: TabType, label: string, icon: keyof typeof Ionicons.glyphMap) => {
    const isActive = activeTab === tab;
    return (
      <Pressable
        onPress={() => handleTabChange(tab)}
        style={[
          styles.tabButton,
          {
            backgroundColor: isActive ? theme.link : theme.backgroundDefault,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={isActive ? "#FFFFFF" : theme.textSecondary}
        />
        <ThemedText
          style={[
            styles.tabLabel,
            { color: isActive ? "#FFFFFF" : theme.textSecondary },
          ]}
        >
          {label}
        </ThemedText>
      </Pressable>
    );
  };

  const renderWeatherContent = () => {
    if (weatherLoading) {
      return (
        <View>
          <SectionHeader title="Port Weather Status" />
          <ThemedText style={{ color: theme.textSecondary, padding: Spacing.lg }}>
            Loading weather data...
          </ThemedText>
        </View>
      );
    }

    if (weather.length === 0) {
      return (
        <EmptyState
          image={require("../../assets/images/empty-events.png")}
          title="No weather data"
          description="Port weather information will appear here."
        />
      );
    }

    return (
      <View>
        <SectionHeader title="Port Weather Status" />
        {weather.map((w) => (
          <WeatherCard key={w.port} weather={w} />
        ))}
      </View>
    );
  };

  const renderAlertsContent = () => {
    if (alertsLoading) {
      return (
        <View>
          <SectionHeader title="Active Alerts" />
          <ThemedText style={{ color: theme.textSecondary, padding: Spacing.lg }}>
            Loading alerts...
          </ThemedText>
        </View>
      );
    }

    if (alerts.length === 0) {
      return (
        <EmptyState
          image={require("../../assets/images/empty-events.png")}
          title="No active alerts"
          description="You're all caught up! New alerts will appear here."
        />
      );
    }

    return (
      <View>
        <SectionHeader title="Active Alerts" />
        {alerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onDismiss={() => handleDismissAlert(alert.id)}
          />
        ))}
      </View>
    );
  };

  const isRefetching = activeTab === "weather" ? weatherRefetching : alertsRefetching;

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
      <View style={styles.tabBar}>
        {renderTabButton("weather", "Weather", "cloud-outline")}
        {renderTabButton("alerts", "Alerts", "notifications-outline")}
      </View>

      {activeTab === "weather" ? renderWeatherContent() : renderAlertsContent()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  tabLabel: {
    ...Typography.body,
    fontWeight: "600",
  },
});
