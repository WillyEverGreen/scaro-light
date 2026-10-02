import React, { useEffect } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function LoadingSkeleton({
  width = "100%",
  height = 20,
  borderRadius = BorderRadius.xs,
  style,
}: LoadingSkeletonProps) {
  const { theme, isDark } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? theme.backgroundSecondary : theme.backgroundTertiary,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

interface MetricCardSkeletonProps {
  style?: ViewStyle;
}

export function MetricCardSkeleton({ style }: MetricCardSkeletonProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.metricCard, { backgroundColor: theme.backgroundDefault }, style]}>
      <View style={styles.metricHeader}>
        <LoadingSkeleton width={28} height={28} borderRadius={BorderRadius.xs} />
        <LoadingSkeleton width={60} height={12} style={{ marginLeft: Spacing.sm }} />
      </View>
      <LoadingSkeleton width={80} height={32} style={{ marginTop: Spacing.sm }} />
    </View>
  );
}

export function EventCardSkeleton() {
  const { theme } = useTheme();

  return (
    <View style={[styles.eventCard, { backgroundColor: theme.backgroundDefault }]}>
      <View style={styles.eventHeader}>
        <LoadingSkeleton width={80} height={20} />
        <LoadingSkeleton width={60} height={20} />
      </View>
      <LoadingSkeleton width="100%" height={20} style={{ marginVertical: Spacing.sm }} />
      <LoadingSkeleton width="70%" height={20} />
      <View style={styles.eventFooter}>
        <LoadingSkeleton width={50} height={14} />
        <LoadingSkeleton width={40} height={14} />
      </View>
    </View>
  );
}

export function ChartSkeleton() {
  const { theme } = useTheme();

  return (
    <View style={[styles.chartContainer, { backgroundColor: theme.backgroundDefault }]}>
      <View style={styles.chartHeader}>
        <LoadingSkeleton width={120} height={18} />
        <LoadingSkeleton width={80} height={14} />
      </View>
      <LoadingSkeleton width="100%" height={180} borderRadius={BorderRadius.sm} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {},
  metricCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    minWidth: 140,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  eventFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.md,
  },
  chartContainer: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
});
