// 3D Depth Card — Duolingo signature pattern (RFC 0002)
// border-top thinner + lighter, border-bottom thicker + darker
import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { radius, spacing, useThemeColors } from "@/theme";

type Variant = "neutral" | "primary" | "success" | "destructive" | "skill";

interface DepthCardProps {
  children: ReactNode;
  variant?: Variant;
  /** Skill color hex — required when variant="skill" */
  skillColor?: string;
  /** Override padding */
  padding?: number;
  style?: ViewStyle;
}

export function DepthCard({
  children,
  variant = "neutral",
  skillColor,
  padding = spacing.lg,
  style,
}: DepthCardProps) {
  const c = useThemeColors();
  const { borderTop, borderBottom, bg } = getColors(variant, skillColor, c);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: bg,
          borderColor: borderTop,
          borderBottomColor: borderBottom,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function getColors(variant: Variant, skillColor: string | undefined, c: ReturnType<typeof useThemeColors>) {
  switch (variant) {
    case "primary":
      return { borderTop: c.primary + "25", borderBottom: c.primary + "66", bg: c.primary + "0D" };
    case "success":
      return { borderTop: c.success + "25", borderBottom: c.success + "66", bg: c.success + "1A" };
    case "destructive":
      return { borderTop: c.destructive + "25", borderBottom: c.destructive + "66", bg: c.destructive + "1A" };
    case "skill": {
      const sc = skillColor ?? c.primary;
      return { borderTop: sc + "33", borderBottom: sc + "80", bg: sc + "1A" };
    }
    default:
      return { borderTop: c.depthBorderLight, borderBottom: c.depthBorderDark, bg: c.card };
  }
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius["2xl"],
  },
});
