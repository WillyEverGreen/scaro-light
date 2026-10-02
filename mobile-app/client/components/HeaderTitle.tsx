import React from "react";
import { View, StyleSheet, Image } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { Spacing } from "@/constants/theme";

interface HeaderTitleProps {
  title: string;
  showLogo?: boolean;
}

export function HeaderTitle({ title, showLogo = true }: HeaderTitleProps) {
  return (
    <View style={styles.container}>
      {showLogo ? (
        <Image
          source={require("../../assets/images/edgecase-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      ) : null}
      <ThemedText style={styles.title}>{title}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
  },
});
