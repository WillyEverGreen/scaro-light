import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import {
  Spacing,
  BorderRadius,
  Typography,
  SeverityColors,
  SeverityColorsDark,
} from "@/constants/theme";
import type { Alert } from "@/types/api";

interface AlertCardProps {
  alert: Alert;
  onDismiss?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AlertCard({ alert, onDismiss }: AlertCardProps) {
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
  const severityStyle = severityColors[alert.severity];

  const getSeverityIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (alert.severity) {
      case "critical":
        return "warning";
      case "high":
        return "alert";
      case "medium":
        return "alert-circle";
      default:
        return "information-circle";
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss?.();
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundDefault,
          borderLeftColor: severityStyle.text,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: severityStyle.bg }]}>
            <Ionicons name={getSeverityIcon()} size={16} color={severityStyle.text} />
          </View>
          <View style={styles.headerText}>
            <ThemedText style={styles.title} numberOfLines={1}>
              {alert.title}
            </ThemedText>
            <ThemedText style={[styles.time, { color: theme.textSecondary }]}>
              {formatTime(alert.created_at)}
            </ThemedText>
          </View>
        </View>
        <ThemedText
          style={[styles.description, { color: theme.textSecondary }]}
          numberOfLines={2}
        >
          {alert.description}
        </ThemedText>
      </View>
      {onDismiss ? (
        <Pressable onPress={handleDismiss} style={styles.dismissButton}>
          <Ionicons name="close" size={18} color={theme.textSecondary} />
        </Pressable>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 3,
    marginBottom: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  headerText: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    ...Typography.body,
    fontWeight: "600",
    flex: 1,
  },
  time: {
    ...Typography.caption,
    marginLeft: Spacing.sm,
  },
  description: {
    ...Typography.small,
  },
  dismissButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
});
