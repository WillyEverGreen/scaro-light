import { Platform } from "react-native";

// SCARO Brand Colors (derived from logo)
export const BrandColors = {
  primary: "#6FBFAB", // Teal/mint from logo
  primaryLight: "#8DD4C4",
  primaryDark: "#5AA593",
  secondary: "#475569", // Dark slate from logo
  secondaryLight: "#64748B",
  secondaryDark: "#334155",
  accent: "#6FBFAB",
};

export const Colors = {
  light: {
    text: "#1E293B",
    textSecondary: "#64748B",
    buttonText: "#FFFFFF",
    tabIconDefault: "#94A3B8",
    tabIconSelected: BrandColors.primary,
    link: BrandColors.primary,
    linkHover: BrandColors.primaryDark,
    backgroundRoot: "#FFFFFF",
    backgroundDefault: "#F8FAFC",
    backgroundSecondary: "#F1F5F9",
    backgroundTertiary: "#E2E8F0",
    border: "#E2E8F0",
    surface: "#FFFFFF",
    surfaceElevated: "#F8FAFC",
    primary: BrandColors.primary,
    primaryLight: BrandColors.primaryLight,
    primaryDark: BrandColors.primaryDark,
    secondary: BrandColors.secondary,
  },
  dark: {
    text: "#F1F5F9",
    textSecondary: "#94A3B8",
    buttonText: "#FFFFFF",
    tabIconDefault: "#64748B",
    tabIconSelected: BrandColors.primary,
    link: BrandColors.primaryLight,
    linkHover: BrandColors.primary,
    backgroundRoot: "#0F172A",
    backgroundDefault: "#1E293B",
    backgroundSecondary: "#334155",
    backgroundTertiary: "#475569",
    border: "#334155",
    surface: "#1E293B",
    surfaceElevated: "#334155",
    primary: BrandColors.primary,
    primaryLight: BrandColors.primaryLight,
    primaryDark: BrandColors.primaryDark,
    secondary: BrandColors.secondaryLight,
  },
};

export const RiskColors = {
  low: "#10B981",
  medium: "#F59E0B",
  high: "#F97316",
  critical: "#EF4444",
};

export const StatusColors = {
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: BrandColors.primary,
};

export const SeverityColors = {
  low: { bg: "#D1FAE5", text: "#065F46" },
  medium: { bg: "#FEF3C7", text: "#92400E" },
  high: { bg: "#FFEDD5", text: "#9A3412" },
  critical: { bg: "#FEE2E2", text: "#991B1B" },
};

export const SeverityColorsDark = {
  low: { bg: "#064E3B", text: "#6EE7B7" },
  medium: { bg: "#78350F", text: "#FCD34D" },
  high: { bg: "#7C2D12", text: "#FDBA74" },
  critical: { bg: "#7F1D1D", text: "#FCA5A5" },
};

export const CategoryColors: Record<string, string> = {
  geopolitical: "#8B5CF6",
  weather: "#06B6D4",
  trade_restriction: "#F59E0B",
  commodity: BrandColors.primary,
  vendor: "#EC4899",
  economic: "#6366F1",
  other: "#64748B",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
  },
  overline: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "500" as const,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },
  mono: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  metricLarge: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: "700" as const,
  },
  metricMedium: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export function getRiskColor(score: number): string {
  if (score >= 0.85) return RiskColors.critical;
  if (score >= 0.66) return RiskColors.high;
  if (score >= 0.33) return RiskColors.medium;
  return RiskColors.low;
}

export function getRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 0.85) return "critical";
  if (score >= 0.66) return "high";
  if (score >= 0.33) return "medium";
  return "low";
}
