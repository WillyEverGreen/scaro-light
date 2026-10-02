import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import {
  Spacing,
  BorderRadius,
  Typography,
  SeverityColors,
  SeverityColorsDark,
} from "@/constants/theme";
import type { WeatherStatus } from "@/types/api";

interface WeatherCardProps {
  weather: WeatherStatus;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const weatherIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  sunny: "sunny-outline",
  clear: "sunny-outline",
  cloudy: "cloud-outline",
  "partly cloudy": "partly-sunny-outline",
  rain: "rainy-outline",
  storm: "thunderstorm-outline",
  snow: "snow-outline",
  fog: "cloud-outline",
  windy: "flag-outline",
};

export function WeatherCard({ weather, onPress }: WeatherCardProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const severityColors = isDark ? SeverityColorsDark : SeverityColors;

  const getStatusStyle = () => {
    switch (weather.status) {
      case "critical":
        return severityColors.critical;
      case "warning":
        return severityColors.medium;
      default:
        return severityColors.low;
    }
  };

  const statusStyle = getStatusStyle();
  const weatherIcon = weatherIcons[weather.condition.toLowerCase()] || "cloud-outline";

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <View style={styles.leftSection}>
        <View style={[styles.iconContainer, { backgroundColor: theme.backgroundSecondary }]}>
          <Ionicons name={weatherIcon} size={24} color={theme.link} />
        </View>
        <View style={styles.portInfo}>
          <ThemedText style={styles.portName}>{weather.port}</ThemedText>
          <ThemedText style={[styles.country, { color: theme.textSecondary }]}>
            {weather.country}
          </ThemedText>
        </View>
      </View>
      <View style={styles.rightSection}>
        <View style={styles.weatherData}>
          <View style={styles.dataRow}>
            <Ionicons name="thermometer-outline" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.dataValue, { color: theme.text }]}>
              {weather.temperature_c}°C
            </ThemedText>
          </View>
          <View style={styles.dataRow}>
            <Ionicons name="flag-outline" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.dataValue, { color: theme.text }]}>
              {weather.wind_speed_kmh} km/h
            </ThemedText>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <ThemedText style={[styles.statusText, { color: statusStyle.text }]}>
            {weather.status}
          </ThemedText>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  portInfo: {
    flex: 1,
  },
  portName: {
    ...Typography.body,
    fontWeight: "600",
  },
  country: {
    ...Typography.small,
  },
  rightSection: {
    alignItems: "flex-end",
  },
  weatherData: {
    marginBottom: Spacing.sm,
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dataValue: {
    ...Typography.small,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});
