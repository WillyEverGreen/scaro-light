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
  CategoryColors,
  SeverityColors,
  SeverityColorsDark,
} from "@/constants/theme";
import type { Event } from "@/types/api";

interface EventCardProps {
  event: Event;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  geopolitical: "globe-outline",
  weather: "rainy-outline",
  trade_restriction: "ban-outline",
  commodity: "cube-outline",
  vendor: "car-outline",
  economic: "trending-up-outline",
  other: "alert-circle-outline",
};

export function EventCard({ event, onPress }: EventCardProps) {
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
  const severityStyle = severityColors[event.severity];
  const categoryColor = CategoryColors[event.category] || CategoryColors.other;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        { backgroundColor: theme.backgroundDefault, borderLeftColor: categoryColor },
        animatedStyle,
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.categoryBadge, { backgroundColor: categoryColor + "20" }]}>
          <Ionicons
            name={categoryIcons[event.category] || "alert-circle-outline"}
            size={12}
            color={categoryColor}
          />
          <ThemedText style={[styles.categoryText, { color: categoryColor }]}>
            {event.category.replace("_", " ")}
          </ThemedText>
        </View>
        <View
          style={[
            styles.severityBadge,
            { backgroundColor: severityStyle.bg },
          ]}
        >
          <ThemedText style={[styles.severityText, { color: severityStyle.text }]}>
            {event.severity}
          </ThemedText>
        </View>
      </View>
      <ThemedText style={styles.title} numberOfLines={2}>
        {event.title}
      </ThemedText>
      <View style={styles.footer}>
        <View style={styles.countryContainer}>
          <ThemedText style={[styles.country, { color: theme.textSecondary }]}>
            {event.country}
          </ThemedText>
        </View>
        <ThemedText style={[styles.time, { color: theme.textSecondary }]}>
          {formatTime(event.created_at)}
        </ThemedText>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 3,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
    gap: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  severityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  severityText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  title: {
    ...Typography.body,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countryContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  country: {
    ...Typography.caption,
  },
  time: {
    ...Typography.caption,
  },
});
