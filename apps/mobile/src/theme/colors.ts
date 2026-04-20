// Design tokens — aligned with frontend-v3 styles.css @theme
// Primary = Duolingo green (#58cc02), not blue

export const colors = {
  light: {
    // Primary — Duolingo green
    primary: "#58CC02",
    primaryForeground: "#FFFFFF",
    primaryDark: "#478700",
    primaryLight: "#79D634",
    primaryTint: "#E6F8D4",

    // Semantic
    destructive: "#EA4335",
    destructiveTint: "#FFE6E4",
    warning: "#FF9B00",
    warningTint: "#FFF0DC",
    success: "#58CC02",
    info: "#1CB0F6",
    infoTint: "#DDF4FF",

    // Neutrals
    foreground: "#1E1E28",
    muted: "#4B4B5A",
    subtle: "#8C8C9B",
    placeholder: "#AFAFAF",
    border: "#E5E5E5",
    surface: "#FFFFFF",
    background: "#F7F7FA",

    // Domain — skills
    skillListening: "#1CB0F6",
    skillReading: "#7850C8",
    skillWriting: "#58CC02",
    skillSpeaking: "#FFC800",

    // Domain — streak
    streak: "#FF7800",
    streakTint: "#FFF0DC",

    // Domain — coin
    coin: "#FFC800",
    coinDark: "#DCAA00",
    coinTint: "#FFF5D2",

    // Depth borders (card: border-2 border-b-4 with border color)
    depthBorderLight: "#E5E5E5",
    depthBorderDark: "#CCCCCC",
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
  button: 13,
  card: 16,
  banner: 24,
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
