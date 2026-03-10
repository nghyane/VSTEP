export const colors = {
  light: {
    primary: "#4F5BD5",
    primaryForeground: "#FAFAFA",
    background: "#FAFBFF",
    foreground: "#171723",
    card: "#FAFBFF",
    cardForeground: "#171723",
    muted: "#F2F3F7",
    mutedForeground: "#6C6F7F",
    secondary: "#E4E8FA",
    secondaryForeground: "#3D4A8A",
    accent: "#F2F3F7",
    accentForeground: "#171723",
    destructive: "#E5484D",
    border: "#E2E4ED",
    input: "#E2E4ED",
    ring: "#4F5BD5",
    success: "#30A46C",
    successForeground: "#FAFAFA",
    warning: "#E5A700",
    warningForeground: "#171723",
    skillListening: "#4B7BF5",
    skillReading: "#34B279",
    skillWriting: "#9B59D0",
    skillSpeaking: "#E5A817",
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
