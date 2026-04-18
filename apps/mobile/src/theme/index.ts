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

/** Depth border colors for 3D illusion (Duolingo pattern) */
export function useDepthColors(baseColor?: string) {
  const c = colors.light;
  if (!baseColor) {
    return { borderLight: c.depthBorderLight, borderDark: c.depthBorderDark };
  }
  // For semantic colors, derive lighter/darker variants
  return { borderLight: baseColor + "25", borderDark: baseColor + "66" };
}
