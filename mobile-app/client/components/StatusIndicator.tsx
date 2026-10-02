import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, StatusColors, BorderRadius } from "@/constants/theme";

interface StatusIndicatorProps {
  label: string;
  status: "connected" | "disconnected" | "warning";
}

export function StatusIndicator({ label, status }: StatusIndicatorProps) {
  const { theme } = useTheme();

  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return StatusColors.success;
      case "warning":
        return StatusColors.warning;
      case "disconnected":
        return StatusColors.error;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
      <View style={[styles.dot, { backgroundColor: getStatusColor() }]} />
      <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
  },
});
