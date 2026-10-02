import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, Alert as RNAlert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import * as Device from "expo-device";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { SettingsRow, SettingsSectionHeader } from "@/components/SettingsRow";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography } from "@/constants/theme";
import { getSettings, saveSettings, clearAllCache } from "@/lib/storage";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import type { AppSettings } from "@/types/api";

interface BackendSettings {
  device_id: string;
  dark_mode: boolean;
  push_notifications: boolean;
  email_alerts: boolean;
  risk_threshold: number;
  auto_refresh: boolean;
  refresh_interval: number;
}

function getDeviceId(): string {
  if (Platform.OS === "web") {
    let storedId = localStorage.getItem("device_id");
    if (!storedId) {
      storedId = `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("device_id", storedId);
    }
    return storedId;
  }
  return `${Device.modelName || "device"}-${Device.osVersion || "1.0"}`;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const deviceId = getDeviceId();

  const [settings, setSettings] = useState<AppSettings>({
    apiBaseUrl: "",
    theme: "system",
    notifications: true,
    alertThreshold: 0.85,
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "success" | "error">("unknown");

  const { data: backendSettings } = useQuery<BackendSettings>({
    queryKey: [`/api/settings/${deviceId}`],
    staleTime: 60000,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<BackendSettings>) => {
      await apiRequest("PUT", `/api/settings/${deviceId}`, newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/settings/${deviceId}`] });
    },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (backendSettings) {
      setSettings((prev) => ({
        ...prev,
        notifications: backendSettings.push_notifications,
        alertThreshold: backendSettings.risk_threshold,
      }));
    }
  }, [backendSettings]);

  const loadSettings = async () => {
    const stored = await getSettings();
    try {
      const apiUrl = getApiUrl();
      setSettings({ ...stored, apiBaseUrl: apiUrl });
    } catch {
      setSettings(stored);
    }
  };

  const updateSetting = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveSettings(updated);

    if (key === "notifications") {
      updateSettingsMutation.mutate({ push_notifications: value as boolean });
    } else if (key === "alertThreshold") {
      updateSettingsMutation.mutate({ risk_threshold: value as number });
    }
  };

  const handleTestConnection = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsTestingConnection(true);
    setConnectionStatus("unknown");

    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/health`);
      const data = await response.json();

      if (data.status === "ok") {
        setConnectionStatus("success");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        RNAlert.alert(
          "Connection Successful",
          `API: ${data.api ? "Connected" : "Disconnected"}\nDatabase: ${data.database ? "Connected" : "Disconnected"}\nAI Service: ${data.ai ? "Available" : "Unavailable"}`
        );
      } else {
        setConnectionStatus("error");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        RNAlert.alert("Partial Connection", "Some services may be unavailable.");
      }
    } catch (error) {
      setConnectionStatus("error");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      RNAlert.alert("Connection Failed", "Could not connect to the backend API. Please check your network connection.");
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleClearCache = async () => {
    RNAlert.alert(
      "Clear Cache",
      "This will clear all cached data. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            setIsClearingCache(true);
            try {
              await clearAllCache();
              await queryClient.clear();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              RNAlert.alert("Cache Cleared", "All cached data has been removed.");
            } catch (error) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              RNAlert.alert("Error", "Failed to clear cache.");
            } finally {
              setIsClearingCache(false);
            }
          },
        },
      ]
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
    >
      <SettingsSectionHeader title="Backend Configuration" />
      <SettingsRow
        type="navigate"
        label="API Status"
        value={
          connectionStatus === "success"
            ? "Connected"
            : connectionStatus === "error"
            ? "Disconnected"
            : "Unknown"
        }
        onPress={() => {}}
      />
      <SettingsRow
        type="button"
        label="Test Connection"
        buttonLabel={isTestingConnection ? "Testing..." : "Test"}
        isLoading={isTestingConnection}
        onPress={handleTestConnection}
      />

      <SettingsSectionHeader title="Notifications" />
      <SettingsRow
        type="toggle"
        label="Push Notifications"
        description="Receive alerts for critical risk events"
        value={settings.notifications}
        onValueChange={(value) => updateSetting("notifications", value)}
      />
      <SettingsRow
        type="navigate"
        label="Alert Threshold"
        value={`${(settings.alertThreshold * 100).toFixed(0)}%`}
        onPress={() => {}}
      />

      <SettingsSectionHeader title="Data Management" />
      <SettingsRow
        type="button"
        label="Clear Cache"
        description="Remove all cached dashboard data"
        buttonLabel={isClearingCache ? "Clearing..." : "Clear"}
        isLoading={isClearingCache}
        isDestructive
        onPress={handleClearCache}
      />

      <SettingsSectionHeader title="About" />
      <SettingsRow
        type="navigate"
        label="Version"
        value="1.0.0"
        onPress={() => {}}
      />
      <SettingsRow
        type="navigate"
        label="Open Source Licenses"
        onPress={() => {}}
      />

      <View style={styles.footer}>
        <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
          SCARO - Supply Chain Risk Intelligence
        </ThemedText>
        <ThemedText style={[styles.footerVersion, { color: theme.textSecondary }]}>
          Version 1.0.0 (Build 1)
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  footer: {
    alignItems: "center",
    marginTop: Spacing["3xl"],
    paddingVertical: Spacing.xl,
  },
  footerText: {
    ...Typography.small,
    fontWeight: "500",
  },
  footerVersion: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
});
