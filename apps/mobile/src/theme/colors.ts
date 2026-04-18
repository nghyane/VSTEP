// Design tokens aligned with frontend-v2 RFC 0002 (Duolingo Gamification)
// oklch values from src/styles.css converted to hex for React Native
// 3D Depth pattern: border-top lighter, border-bottom darker

export const colors = {
  light: {
    // Primary — VSTEP blue (oklch 0.55 0.2 258)
    primary: "#2563EB",
    primaryForeground: "#FAFAFA",

    // Base
    background: "#FAFBFC",
    foreground: "#1A1A2E",
    card: "#FFFFFF",
    cardForeground: "#1A1A2E",

    // Muted
    muted: "#F3F4F6",
    mutedForeground: "#6B7280",

    // Secondary
    secondary: "#EEF2FF",
    secondaryForeground: "#3730A3",

    // Accent
    accent: "#F3F4F6",
    accentForeground: "#1A1A2E",

    // Semantic
    destructive: "#E53935",
    destructiveForeground: "#FAFAFA",
    success: "#1DB954",
    successForeground: "#FAFAFA",
    warning: "#F5A623",
    warningForeground: "#1A1A2E",

    // Border
    border: "#E5E7EB",
    input: "#E5E7EB",
    ring: "#2563EB",

    // 3D Depth borders (Duolingo signature)
    depthBorderLight: "#D4D6DB",
    depthBorderDark: "#ABABBA",

    // Skill colors (oklch 0.65 0.18 hue — Duolingo-bright)
    skillListening: "#4F8EF7",
    skillReading: "#22B573",
    skillWriting: "#9B5DE5",
    skillSpeaking: "#E5A020",

    // Coin (amber exception)
    coin: "#F59E0B",
    coinDark: "#D97706",
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
