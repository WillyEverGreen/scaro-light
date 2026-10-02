import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Circle, Path, G, Text as SvgText } from "react-native-svg";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { getRiskColor, Spacing, BorderRadius, Typography } from "@/constants/theme";

interface RiskGaugeProps {
  score: number;
  size?: number;
  showLabel?: boolean;
}

export function RiskGauge({ score, size = 120, showLabel = true }: RiskGaugeProps) {
  const { theme, isDark } = useTheme();
  const riskColor = getRiskColor(score);

  const strokeWidth = size * 0.1;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI;
  const progress = score * circumference;

  const startAngle = 180;
  const endAngle = 0;

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const radians = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(radians),
      y: cy + r * Math.sin(radians),
    };
  };

  const describeArc = (x: number, y: number, r: number, start: number, end: number) => {
    const startPoint = polarToCartesian(x, y, r, end);
    const endPoint = polarToCartesian(x, y, r, start);
    const largeArcFlag = end - start <= 180 ? "0" : "1";
    return [
      "M",
      startPoint.x,
      startPoint.y,
      "A",
      r,
      r,
      0,
      largeArcFlag,
      0,
      endPoint.x,
      endPoint.y,
    ].join(" ");
  };

  const progressAngle = startAngle + (endAngle - startAngle + 360) % 360 * score;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size / 2 + strokeWidth}>
        <G>
          <Path
            d={describeArc(size / 2, size / 2, radius, startAngle, endAngle)}
            stroke={isDark ? theme.backgroundSecondary : theme.backgroundTertiary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d={describeArc(size / 2, size / 2, radius, startAngle, progressAngle)}
            stroke={riskColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={styles.scoreContainer}>
        <ThemedText style={[styles.score, { color: riskColor }]}>
          {(score * 100).toFixed(0)}
        </ThemedText>
        {showLabel ? (
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            Risk Score
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  scoreContainer: {
    position: "absolute",
    bottom: 0,
    alignItems: "center",
  },
  score: {
    ...Typography.metricLarge,
    fontSize: 36,
    lineHeight: 42,
  },
  label: {
    ...Typography.caption,
    marginTop: 2,
  },
});
