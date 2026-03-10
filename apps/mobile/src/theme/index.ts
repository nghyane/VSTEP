import { colors, type ThemeColors } from "./colors";

export { colors, spacing, radius, fontSize, fontFamily } from "./colors";
export type { ThemeColors } from "./colors";

export function useThemeColors(): ThemeColors {
  return colors.light;
}

export function useSkillColor(skill: string): string {
  const key = `skill${skill.charAt(0).toUpperCase()}${skill.slice(1)}` as keyof ThemeColors;
  return (colors.light[key] as string) ?? colors.light.primary;
}
