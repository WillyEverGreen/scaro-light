import React from "react";
import { View, StyleSheet, Pressable, Switch, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography, BorderRadius } from "@/constants/theme";

interface SettingsRowBaseProps {
  label: string;
  description?: string;
}

interface SettingsRowToggleProps extends SettingsRowBaseProps {
  type: "toggle";
  value: boolean;
  onValueChange: (value: boolean) => void;
}

interface SettingsRowNavigateProps extends SettingsRowBaseProps {
  type: "navigate";
  value?: string;
  onPress: () => void;
}

interface SettingsRowInputProps extends SettingsRowBaseProps {
  type: "input";
  value: string;
  placeholder?: string;
  onChangeText: (value: string) => void;
}

interface SettingsRowButtonProps extends SettingsRowBaseProps {
  type: "button";
  buttonLabel: string;
  isLoading?: boolean;
  isDestructive?: boolean;
  onPress: () => void;
}

type SettingsRowProps =
  | SettingsRowToggleProps
  | SettingsRowNavigateProps
  | SettingsRowInputProps
  | SettingsRowButtonProps;

export function SettingsRow(props: SettingsRowProps) {
  const { theme } = useTheme();

  const renderControl = () => {
    switch (props.type) {
      case "toggle":
        return (
          <Switch
            value={props.value}
            onValueChange={props.onValueChange}
            trackColor={{ false: theme.backgroundTertiary, true: theme.link }}
            thumbColor="#FFFFFF"
          />
        );
      case "navigate":
        return (
          <View style={styles.navigateControl}>
            {props.value ? (
              <ThemedText style={[styles.navigateValue, { color: theme.textSecondary }]}>
                {props.value}
              </ThemedText>
            ) : null}
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </View>
        );
      case "input":
        return (
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={props.value}
            onChangeText={props.onChangeText}
            placeholder={props.placeholder}
            placeholderTextColor={theme.textSecondary}
          />
        );
      case "button":
        return (
          <Pressable
            onPress={props.onPress}
            style={[
              styles.button,
              {
                backgroundColor: props.isDestructive
                  ? "#FEE2E2"
                  : theme.backgroundSecondary,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.buttonLabel,
                { color: props.isDestructive ? "#DC2626" : theme.link },
              ]}
            >
              {props.isLoading ? "Loading..." : props.buttonLabel}
            </ThemedText>
          </Pressable>
        );
    }
  };

  const Container = props.type === "navigate" ? Pressable : View;
  const containerProps =
    props.type === "navigate" ? { onPress: props.onPress } : {};

  return (
    <Container
      {...containerProps}
      style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
    >
      <View style={styles.content}>
        <ThemedText style={styles.label}>{props.label}</ThemedText>
        {props.description ? (
          <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
            {props.description}
          </ThemedText>
        ) : null}
      </View>
      {renderControl()}
    </Container>
  );
}

export function SettingsSectionHeader({ title }: { title: string }) {
  const { theme } = useTheme();

  return (
    <View style={styles.sectionHeader}>
      <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        {title}
      </ThemedText>
    </View>
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
  content: {
    flex: 1,
    marginRight: Spacing.md,
  },
  label: {
    ...Typography.body,
    fontWeight: "500",
  },
  description: {
    ...Typography.small,
    marginTop: 2,
  },
  navigateControl: {
    flexDirection: "row",
    alignItems: "center",
  },
  navigateValue: {
    ...Typography.small,
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    maxWidth: 200,
    height: 40,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    ...Typography.small,
  },
  button: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  buttonLabel: {
    ...Typography.small,
    fontWeight: "600",
  },
  sectionHeader: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.overline,
  },
});
