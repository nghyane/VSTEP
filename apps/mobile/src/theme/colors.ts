// Design tokens aligned with frontend-v2 (apps/frontend-v2/src/styles.css)
// oklch values converted to hex for React Native

export const colors = {
  light: {
    // Primary — VSTEP blue (frontend-v2: oklch(0.55 0.2 258) ≈ #1a6ef5)
    primary: "#1a6ef5",
    primaryForeground: "#FAFAFA",

    // Base
    background: "#FAFAFA",
    foreground: "#1a1a2e",
    card: "#FFFFFF",
    cardForeground: "#1a1a2e",

    // Muted
    muted: "#F3F4F6",
    mutedForeground: "#6B7280",

    // Secondary
    secondary: "#EEF0FA",
    secondaryForeground: "#3D4A8A",

    // Accent
    accent: "#F3F4F6",
    accentForeground: "#1a1a2e",

    // Semantic
    destructive: "#EF4444",
    border: "#E5E7EB",
    input: "#E5E7EB",
    ring: "#1a6ef5",
    success: "#22C55E",
    successForeground: "#FAFAFA",
    warning: "#F59E0B",
    warningForeground: "#1a1a2e",

    // Skill colors (frontend-v2: oklch(0.65 0.18 hue))
    skillListening: "#3B82F6",
    skillReading: "#10B981",
    skillWriting: "#8B5CF6",
    skillSpeaking: "#F59E0B",
  },
} as const;

export type ThemeColors = { [K in keyof typeof colors.light]: string };

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  full: 9999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
} as const;

export const fontFamily = {
  regular: "Nunito-Regular",
  medium: "Nunito-Medium",
  semiBold: "Nunito-SemiBold",
  bold: "Nunito-Bold",
  extraBold: "Nunito-ExtraBold",
} as const;
