import { colors, type ThemeColors } from "./colors";
import { useWindowDimensions } from "react-native";

export { colors, spacing, radius, fontSize, fontFamily } from "./colors";
export type { ThemeColors } from "./colors";
export { depthNeutral, depthSemantic, depth } from "./depth";

export function useThemeColors(): ThemeColors {
  return colors.light;
}

export function useSkillColor(skill: string): string {
  const map: Record<string, string> = {
    listening: colors.light.skillListening,
    reading: colors.light.skillReading,
    writing: colors.light.skillWriting,
    speaking: colors.light.skillSpeaking,
  };
  return map[skill] ?? colors.light.primary;
}

export function useResponsiveLayout() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isTabletLandscape = width >= 1024;
  return {
    width,
    isTablet,
    isTabletLandscape,
    horizontalPadding: isTablet ? 32 : 20,
    contentInsetStart: isTabletLandscape ? 96 : 32,
    contentMaxWidth: isTablet ? 920 : 560,
  };
}
