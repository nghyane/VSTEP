// Design tokens — synced with frontend-v3 src/styles.css @theme block
// Single source of truth for all colors, spacing, radius, typography

export const colors = {
  light: {
    // Primary (VSTEP green — Duolingo-style)
    primary: "#58CC02",
    primaryForeground: "#FFFFFF",
    primaryDark: "#478700",
    primaryLight: "#79D634",
    primaryTint: "#E6F8D4",

    // Base surfaces
    background: "#F7F7FA",
    foreground: "#1E1E28",
    surface: "#FFFFFF",

    // Card
    card: "#FFFFFF",
    cardForeground: "#1E1E28",

    // Neutrals
    muted: "#F3F4F6",
    mutedForeground: "#4B4B5A",
    subtle: "#8C8C9B",
    placeholder: "#AFAFAF",

    // Borders
    border: "#E5E5E5",
    borderLight: "#EFEFEF",
    borderFocus: "#6BD43A",

    // Semantic
    destructive: "#EA4335",
    destructiveTint: "#FFE6E4",
    warning: "#FF9B00",
    warningTint: "#FFF0DC",
    success: "#58CC02",
    info: "#1CB0F6",
    infoTint: "#DDF4FF",

    // Skills (exact match with frontend-v3)
    skillListening: "#1CB0F6",
    skillReading: "#7850C8",
    skillWriting: "#58CC02",
    skillSpeaking: "#FFC800",

    // Streak
    streak: "#FF7800",
    streakTint: "#FFF0DC",

    // Coin
    coin: "#FFC800",
    coinDark: "#DCAA00",
    coinTint: "#FFF5D2",
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
  button: 13,
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
