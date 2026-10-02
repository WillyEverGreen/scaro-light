import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography, RiskColors } from "@/constants/theme";
import type { TimelinePoint } from "@/types/api";

interface RiskChartProps {
  data: TimelinePoint[];
  title?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function RiskChart({ data, title = "30-Day Risk Trend" }: RiskChartProps) {
  const { theme, isDark } = useTheme();

  if (data.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <View style={styles.emptyContainer}>
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            No data available
          </ThemedText>
        </View>
      </View>
    );
  }

  const labels = data.filter((_, i) => i % 7 === 0).map((p) => {
    const date = new Date(p.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  const riskScores = data.map((p) => p.risk_score * 100);

  const chartConfig = {
    backgroundColor: theme.backgroundDefault,
    backgroundGradientFrom: theme.backgroundDefault,
    backgroundGradientTo: theme.backgroundDefault,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: () => theme.textSecondary,
    style: {
      borderRadius: BorderRadius.sm,
    },
    propsForDots: {
      r: "3",
      strokeWidth: "2",
      stroke: theme.link,
    },
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: isDark ? theme.backgroundSecondary : theme.backgroundTertiary,
      strokeWidth: 1,
    },
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.link }]} />
            <ThemedText style={[styles.legendText, { color: theme.textSecondary }]}>
              Risk Score
            </ThemedText>
          </View>
        </View>
      </View>
      <LineChart
        data={{
          labels,
          datasets: [
            {
              data: riskScores,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              strokeWidth: 2,
            },
          ],
        }}
        width={SCREEN_WIDTH - Spacing.lg * 2 - Spacing.lg * 2}
        height={180}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withInnerLines
        withOuterLines={false}
        withVerticalLabels
        withHorizontalLabels
        fromZero
        yAxisSuffix="%"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h4,
    fontSize: 16,
  },
  legend: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...Typography.caption,
  },
  chart: {
    marginLeft: -Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  emptyContainer: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    ...Typography.body,
  },
});
