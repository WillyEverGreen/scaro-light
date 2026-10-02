import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import Svg, { Circle, Line, Text as SvgText } from "react-native-svg";
import { useQuery } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, getRiskColor, Typography } from "@/constants/theme";
import type { GraphNode } from "@/types/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface GraphNodeData {
  id: string;
  label: string;
  type: string;
  risk_score: number;
  metadata?: string;
}

interface GraphLinkData {
  id: string;
  source: string;
  target: string;
  strength: number;
  type?: string;
}

export default function GraphScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();

  const [showFilters, setShowFilters] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filters, setFilters] = useState({
    showVendors: true,
    showCountries: true,
    showProducts: true,
    showEvents: true,
    riskThreshold: 0,
  });

  const { data: nodesData, isLoading: nodesLoading, refetch: refetchNodes, isRefetching: isRefetchingNodes } = useQuery<GraphNodeData[]>({
    queryKey: ["/api/graph/nodes"],
    staleTime: 60000,
  });

  const { data: linksData, isLoading: linksLoading, refetch: refetchLinks, isRefetching: isRefetchingLinks } = useQuery<GraphLinkData[]>({
    queryKey: ["/api/graph/links"],
    staleTime: 60000,
  });

  const handleRefresh = async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await Promise.all([refetchNodes(), refetchLinks()]);
  };

  const graphHeight = Dimensions.get("window").height - headerHeight - tabBarHeight - 20;

  const graphNodes: GraphNode[] = (nodesData || []).map((n) => ({
    id: n.id,
    label: n.label,
    type: n.type as GraphNode["type"],
    properties: n.metadata ? JSON.parse(n.metadata) : {},
    risk_score: n.risk_score,
  }));

  const graphLinks = (linksData || []).map((l) => ({
    source: l.source,
    target: l.target,
    type: l.type || "connected",
    weight: l.strength,
    properties: {},
  }));

  const filteredNodes = graphNodes.filter((node) => {
    if (!filters.showVendors && node.type === "vendor") return false;
    if (!filters.showCountries && node.type === "country") return false;
    if (!filters.showProducts && node.type === "product") return false;
    if (!filters.showEvents && node.type === "event") return false;
    if ((node.risk_score || 0) < filters.riskThreshold) return false;
    return true;
  });

  const nodePositions = filteredNodes.reduce(
    (acc, node, index) => {
      const angle = (2 * Math.PI * index) / filteredNodes.length;
      const radius = Math.min(SCREEN_WIDTH, graphHeight) * 0.32;
      const centerX = SCREEN_WIDTH / 2;
      const centerY = graphHeight / 2;
      acc[node.id] = {
        x: centerX + radius * Math.cos(angle - Math.PI / 2),
        y: centerY + radius * Math.sin(angle - Math.PI / 2),
      };
      return acc;
    },
    {} as Record<string, { x: number; y: number }>
  );

  const filteredLinks = graphLinks.filter(
    (link) => nodePositions[link.source] && nodePositions[link.target]
  );

  const getNodeSize = (node: GraphNode) => {
    const baseSize = 28;
    switch (node.type) {
      case "vendor":
        return baseSize * 1.4;
      case "country":
        return baseSize * 1.2;
      case "event":
        return baseSize * 1.1;
      default:
        return baseSize;
    }
  };

  const getNodeColor = (node: GraphNode) => {
    return getRiskColor(node.risk_score || 0);
  };

  const handleNodePress = (node: GraphNode) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedNode(node);
  };

  const toggleFilters = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowFilters(true);
  };

  if (nodesLoading || linksLoading) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <ActivityIndicator size="large" color={theme.link} />
        <ThemedText style={{ marginTop: Spacing.lg, color: theme.textSecondary }}>
          Loading supply chain network...
        </ThemedText>
      </ThemedView>
    );
  }

  if (graphNodes.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <EmptyState
          image={require("../../assets/images/empty-graph.png")}
          title="No graph data"
          description="Connect to the backend to load supply chain network."
          actionLabel="Retry"
          onAction={() => { }}
        />
      </ThemedView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.graphContainer, { height: graphHeight }]}>
        <Svg width={SCREEN_WIDTH} height={graphHeight} style={styles.svg}>
          {filteredLinks.map((link, index) => {
            const source = nodePositions[link.source];
            const target = nodePositions[link.target];
            if (!source || !target) return null;
            return (
              <Line
                key={`link-${index}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={isDark ? theme.backgroundTertiary : theme.border}
                strokeWidth={1.5}
                strokeOpacity={0.6}
              />
            );
          })}
          {filteredNodes.map((node) => {
            const pos = nodePositions[node.id];
            if (!pos) return null;
            const size = getNodeSize(node);
            const color = getNodeColor(node);
            return (
              <React.Fragment key={node.id}>
                <Circle
                  cx={pos.x}
                  cy={pos.y}
                  r={size}
                  fill={color}
                  opacity={0.9}
                />
                <SvgText
                  x={pos.x}
                  y={pos.y + size + 16}
                  fontSize={11}
                  fill={theme.text}
                  textAnchor="middle"
                  fontWeight="500"
                >
                  {node.label.length > 10 ? node.label.slice(0, 8) + "..." : node.label}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>

        {filteredNodes.map((node) => {
          const pos = nodePositions[node.id];
          if (!pos) return null;
          const size = getNodeSize(node);
          return (
            <Pressable
              key={`touch-${node.id}`}
              style={[
                styles.nodeTouchArea,
                {
                  left: pos.x - size - 8,
                  top: pos.y - size - 8,
                  width: (size + 8) * 2,
                  height: (size + 8) * 2,
                },
              ]}
              onPress={() => handleNodePress(node)}
              testID={`node-${node.id}`}
            />
          );
        })}
      </View>

      <Pressable
        style={[styles.fab, styles.refreshFab, { backgroundColor: theme.link }]}
        onPress={handleRefresh}
        disabled={isRefetchingNodes || isRefetchingLinks}
        testID="button-refresh"
      >
        {isRefetchingNodes || isRefetchingLinks ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Ionicons name="refresh" size={24} color="#FFFFFF" />
        )}
      </Pressable>

      <Pressable
        style={[styles.fab, { backgroundColor: theme.link }]}
        onPress={toggleFilters}
        testID="button-filter"
      >
        <Ionicons name="filter" size={24} color="#FFFFFF" />
      </Pressable>

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundRoot },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Filters</ThemedText>
              <Pressable onPress={() => setShowFilters(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.filtersList}>
              <ThemedText style={[styles.filterLabel, { color: theme.textSecondary }]}>
                Node Types
              </ThemedText>

              <FilterToggle
                label="Vendors"
                value={filters.showVendors}
                onToggle={(v) => setFilters({ ...filters, showVendors: v })}
              />
              <FilterToggle
                label="Countries"
                value={filters.showCountries}
                onToggle={(v) => setFilters({ ...filters, showCountries: v })}
              />
              <FilterToggle
                label="Products"
                value={filters.showProducts}
                onToggle={(v) => setFilters({ ...filters, showProducts: v })}
              />
              <FilterToggle
                label="Events"
                value={filters.showEvents}
                onToggle={(v) => setFilters({ ...filters, showEvents: v })}
              />

              <ThemedText
                style={[
                  styles.filterLabel,
                  { color: theme.textSecondary, marginTop: Spacing.xl },
                ]}
              >
                Risk Threshold: {(filters.riskThreshold * 100).toFixed(0)}%
              </ThemedText>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={filters.riskThreshold}
                onValueChange={(v) => setFilters({ ...filters, riskThreshold: v })}
                minimumTrackTintColor={theme.link}
                maximumTrackTintColor={theme.backgroundTertiary}
                thumbTintColor={theme.link}
              />
            </ScrollView>

            <Button onPress={() => setShowFilters(false)} style={styles.applyButton}>
              Apply Filters
            </Button>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!selectedNode}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedNode(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedNode(null)}
        >
          <Pressable
            style={[
              styles.nodeDetailContent,
              { backgroundColor: theme.backgroundRoot },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {selectedNode?.label}
              </ThemedText>
              <Pressable onPress={() => setSelectedNode(null)} hitSlop={12}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>

            {selectedNode ? (
              <View style={styles.nodeDetails}>
                <DetailRow label="Type" value={selectedNode.type} />
                <DetailRow
                  label="Risk Score"
                  value={`${((selectedNode.risk_score || 0) * 100).toFixed(0)}%`}
                  valueColor={getRiskColor(selectedNode.risk_score || 0)}
                />
                <DetailRow label="ID" value={selectedNode.id} />
              </View>
            ) : null}

            <Button onPress={() => setSelectedNode(null)} style={styles.closeButton}>
              Close
            </Button>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function FilterToggle({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      style={[styles.filterToggle, { backgroundColor: theme.backgroundDefault }]}
      onPress={() => onToggle(!value)}
    >
      <ThemedText>{label}</ThemedText>
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: value ? theme.link : "transparent",
            borderColor: value ? theme.link : theme.border,
          },
        ]}
      >
        {value ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
      </View>
    </Pressable>
  );
}

function DetailRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  const { theme } = useTheme();

  return (
    <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
      <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
      <ThemedText
        style={[styles.detailValue, valueColor ? { color: valueColor } : null]}
      >
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  graphContainer: {
    position: "relative",
  },
  svg: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  nodeTouchArea: {
    position: "absolute",
    borderRadius: 100,
  },
  fab: {
    position: "absolute",
    bottom: 120,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  refreshFab: {
    bottom: 192,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.xl,
    maxHeight: "70%",
  },
  nodeDetailContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    ...Typography.h4,
  },
  filtersList: {
    marginBottom: Spacing.lg,
  },
  filterLabel: {
    ...Typography.overline,
    marginBottom: Spacing.sm,
  },
  filterToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  slider: {
    height: 40,
  },
  applyButton: {
    marginTop: Spacing.md,
  },
  nodeDetails: {
    marginBottom: Spacing.xl,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detailLabel: {
    ...Typography.body,
  },
  detailValue: {
    ...Typography.body,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  closeButton: {},
});
