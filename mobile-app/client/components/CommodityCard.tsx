import React from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography, getRiskColor } from "@/constants/theme";
import type { CommodityStatus } from "@/types/api";

interface CommodityCardProps {
  commodity: CommodityStatus;
  onPress?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.65;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const commodityIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  semiconductors: "hardware-chip-outline",
  batteries: "battery-half-outline",
  "rare earth metals": "diamond-outline",
  steel: "layers-outline",
  oil: "water-outline",
  natural_gas: "flame-outline",
  aluminum: "cube-outline",
  copper: "ellipse-outline",
  lithium: "flash-outline",
  cobalt: "radio-button-on-outline",
};

export function CommodityCard({ commodity, onPress }: CommodityCardProps) {
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

  const riskColor = getRiskColor(commodity.avg_risk_score);
  const icon = commodityIcons[commodity.name.toLowerCase()] || "cube-outline";

  const getTrendIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (commodity.trend) {
      case "up":
        return "trending-up";
      case "down":
        return "trending-down";
      default:
        return "remove";
    }
  };

  const getTrendColor = () => {
    switch (commodity.trend) {
      case "up":
        return "#EF4444";
      case "down":
        return "#10B981";
      default:
        return theme.textSecondary;
    }
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
        <View style={[styles.iconContainer, { backgroundColor: theme.backgroundSecondary }]}>
          <Ionicons name={icon} size={20} color={theme.link} />
        </View>
        <Ionicons name={getTrendIcon()} size={16} color={getTrendColor()} />
      </View>
      <ThemedText style={styles.name} numberOfLines={1}>
        {commodity.name}
      </ThemedText>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <ThemedText style={[styles.statValue, { color: riskColor }]}>
            {(commodity.avg_risk_score * 100).toFixed(0)}%
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Risk
          </ThemedText>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <ThemedText style={styles.statValue}>
            {commodity.mention_count}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Mentions
          </ThemedText>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    ...Typography.h4,
    marginBottom: Spacing.md,
    textTransform: "capitalize",
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
  },
  stat: {
    flex: 1,
  },
  statValue: {
    ...Typography.h4,
    marginBottom: 2,
  },
  statLabel: {
    ...Typography.caption,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: "#E5E7EB",
    marginHorizontal: Spacing.lg,
  },
});
