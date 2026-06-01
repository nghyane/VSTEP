import Svg, { Path } from "react-native-svg";
import { useThemeColors } from "@/theme";

const sizes = {
  sm: { height: 20, width: 75 },
  default: { height: 28, width: 105 },
  lg: { height: 42, width: 158 },
} as const;

interface LogoProps {
  size?: keyof typeof sizes;
  color?: string;
}

export function Logo({ size = "default", color }: LogoProps) {
  const c = useThemeColors();
  const { width, height } = sizes[size];
  const stroke = color ?? c.primary;

  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 120 32"
      fill="none"
      stroke={stroke}
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* V — ascending progress mark */}
      <Path d="M 12 9 L 22 24 L 26 18 M 30 12 L 34 6" />
      {/* S */}
      <Path d="M 57 12 A 4 4 0 0 0 53 8 L 50 8 A 4 4 0 0 0 46 12 A 4 4 0 0 0 50 16 L 53 16 A 4 4 0 0 1 57 20 A 4 4 0 0 1 53 24 L 50 24 A 4 4 0 0 1 46 20" />
      {/* T */}
      <Path d="M 63 8 L 75 8 M 69 8 L 69 24" />
      {/* E */}
      <Path d="M 92 8 L 81 8 L 81 24 L 92 24 M 81 16 L 90 16" />
      {/* P */}
      <Path d="M 98 24 L 98 8 L 105 8 A 4 4 0 0 1 109 12 A 4 4 0 0 1 105 16 L 98 16" />
    </Svg>
  );
}
