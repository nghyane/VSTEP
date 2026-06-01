import { colors, type ThemeColors } from "./colors";

export { colors, spacing, radius, fontSize, fontFamily } from "./colors";
export type { ThemeColors } from "./colors";

export function useThemeColors(): ThemeColors {
  return colors.light;
}

export function useSkillColor(skill: string): string {
  const map: Record<string, string> = {
    listening: colors.light.skillListening,
    reading:   colors.light.skillReading,
    writing:   colors.light.skillWriting,
    speaking:  colors.light.skillSpeaking,
  };
  return map[skill] ?? colors.light.primary;
}

export function useDepthColors() {
  return { borderLight: "#D4D6DB", borderDark: "#ABABBA" };
}
