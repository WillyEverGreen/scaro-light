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
import { Spacing, BorderRadius, Typography, getRiskColor } from "@/constants/theme";

interface MetricCardProps {
  label: string;
  value: number | string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isRiskScore?: boolean;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MetricCard({
  label,
  value,
  trend,
  trendValue,
  icon,
  isRiskScore = false,
  onPress,
}: MetricCardProps) {
  const { theme } = useTheme();
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

  const valueColor = isRiskScore
    ? getRiskColor(typeof value === "number" ? value : parseFloat(value as string))
    : theme.text;

  const displayValue = isRiskScore && typeof value === "number"
    ? (value * 100).toFixed(0)
    : value;

  const getTrendIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (trend) {
      case "up":
        return "trending-up";
      case "down":
        return "trending-down";
      default:
        return "remove";
    }
  };

  const getTrendColor = () => {
    if (isRiskScore) {
      return trend === "down" ? "#10B981" : trend === "up" ? "#EF4444" : theme.textSecondary;
    }
    return trend === "up" ? "#10B981" : trend === "down" ? "#EF4444" : theme.textSecondary;
  };

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
      <View style={styles.header}>
        {icon ? (
          <View style={[styles.iconContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <Ionicons name={icon} size={16} color={theme.link} />
          </View>
        ) : null}
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </ThemedText>
      </View>
      <View style={styles.valueRow}>
        <ThemedText style={[styles.value, { color: valueColor }]}>
          {displayValue}
        </ThemedText>
        {trend ? (
          <View style={styles.trendContainer}>
            <Ionicons name={getTrendIcon()} size={14} color={getTrendColor()} />
            {trendValue ? (
              <ThemedText style={[styles.trendValue, { color: getTrendColor() }]}>
                {trendValue}
              </ThemedText>
            ) : null}
          </View>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    minWidth: 140,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...Typography.caption,
    flex: 1,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  value: {
    ...Typography.metricMedium,
    fontSize: 28,
    lineHeight: 34,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 4,
  },
  trendValue: {
    ...Typography.caption,
  },
});
