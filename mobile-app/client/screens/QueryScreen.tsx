import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Markdown from "react-native-markdown-display";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { QueryChip } from "@/components/QueryChip";
import { EmptyState } from "@/components/EmptyState";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { exampleQueries } from "@/lib/mockData";
import { getApiUrl } from "@/lib/query-client";

interface QueryResult {
  query: string;
  answer: string;
  confidence: number;
}

export default function QueryScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();

  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!query.trim() || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const baseUrl = getApiUrl();
      const response = await fetch(new URL("/api/query", baseUrl).href, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      let fullResponse = "";

      if (Platform.OS === "web" && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  fullResponse += data.content;
                  setResult({
                    query: query.trim(),
                    answer: fullResponse,
                    confidence: 0.85,
                  });
                }
                if (data.error) {
                  throw new Error(data.error);
                }
              } catch (e) {
                if (!(e instanceof SyntaxError)) throw e;
              }
            }
          }
        }
      } else {
        const text = await response.text();
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullResponse += data.content;
              }
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              if (!(e instanceof SyntaxError)) throw e;
            }
          }
        }

        setResult({
          query: query.trim(),
          answer: fullResponse,
          confidence: 0.85,
        });
      }
    } catch (err) {
      console.error("Query error:", err);
      setError(err instanceof Error ? err.message : "Failed to process query");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChipPress = (chipQuery: string) => {
    setQuery(chipQuery);
  };

  const markdownStyles = {
    body: {
      color: theme.text,
      fontSize: 15,
      lineHeight: 24,
    },
    heading1: {
      color: theme.text,
      fontSize: 22,
      fontWeight: "700" as const,
      marginBottom: Spacing.md,
    },
    heading2: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "600" as const,
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    heading3: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "600" as const,
      marginTop: Spacing.md,
      marginBottom: Spacing.xs,
    },
    strong: {
      fontWeight: "600" as const,
    },
    list_item: {
      marginBottom: Spacing.xs,
    },
    em: {
      color: theme.textSecondary,
      fontStyle: "italic" as const,
    },
    bullet_list: {
      marginLeft: Spacing.md,
    },
    ordered_list: {
      marginLeft: Spacing.md,
    },
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={exampleQueries}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <QueryChip label={item} onPress={() => handleChipPress(item)} />
        )}
        style={styles.chipsList}
        contentContainerStyle={styles.chipsContent}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundDefault,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          value={query}
          onChangeText={setQuery}
          placeholder="Ask SCARO about supply chain risks..."
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          testID="input-query"
        />
        <Button
          onPress={handleSubmit}
          disabled={!query.trim() || isLoading}
          style={styles.submitButton}
        >
          {isLoading ? "Analyzing..." : "Ask SCARO"}
        </Button>
      </View>

      {error ? (
        <View style={[styles.errorContainer, { backgroundColor: theme.backgroundDefault }]}>
          <Ionicons name="alert-circle" size={24} color="#EF4444" />
          <ThemedText style={[styles.errorText, { color: "#EF4444" }]}>
            {error}
          </ThemedText>
        </View>
      ) : null}

      {isLoading && !result ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.link} />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
            Analyzing supply chain data...
          </ThemedText>
        </View>
      ) : result ? (
        <View style={styles.resultContainer}>
          <View style={[styles.queryLabel, { borderLeftColor: theme.link }]}>
            <ThemedText style={[styles.queryLabelText, { color: theme.textSecondary }]}>
              YOUR QUERY
            </ThemedText>
            <ThemedText style={styles.queryText}>{result.query}</ThemedText>
          </View>

          <View
            style={[styles.responseCard, { backgroundColor: theme.backgroundDefault }]}
          >
            <View style={styles.responseHeader}>
              <Ionicons name="hardware-chip-outline" size={18} color={theme.link} />
              <ThemedText style={[styles.responseLabel, { color: theme.link }]}>
                AI Analysis
              </ThemedText>
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.link} style={styles.streamingIndicator} />
              ) : null}
            </View>
            <Markdown style={markdownStyles}>{result.answer}</Markdown>
          </View>
        </View>
      ) : (
        <EmptyState
          image={require("../../assets/images/empty-query.png")}
          title="Ask SCARO"
          description="Your personal AI supply chain analyst. Ask about risks, vendors, or market trends."
        />
      )}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chipsList: {
    marginBottom: Spacing.lg,
    marginHorizontal: -Spacing.lg,
  },
  chipsContent: {
    paddingHorizontal: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.xl,
  },
  input: {
    minHeight: 100,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    ...Typography.body,
    marginBottom: Spacing.md,
  },
  submitButton: {},
  loadingContainer: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.lg,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  errorText: {
    ...Typography.body,
    flex: 1,
  },
  resultContainer: {},
  queryLabel: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.md,
    marginBottom: Spacing.lg,
  },
  queryLabelText: {
    ...Typography.overline,
    marginBottom: Spacing.xs,
  },
  queryText: {
    ...Typography.body,
  },
  responseCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xl,
  },
  responseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  responseLabel: {
    ...Typography.caption,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  streamingIndicator: {
    marginLeft: "auto",
  },
});
