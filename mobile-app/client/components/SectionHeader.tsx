import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography } from "@/constants/theme";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.title, { color: theme.textSecondary }]}>
        {title}
      </ThemedText>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.action}>
          <ThemedText style={[styles.actionText, { color: theme.link }]}>
            {actionLabel}
          </ThemedText>
          <Ionicons name="chevron-forward" size={16} color={theme.link} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
    marginTop: Spacing.xl,
  },
  title: {
    ...Typography.overline,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    ...Typography.small,
    fontWeight: "500",
  },
});
