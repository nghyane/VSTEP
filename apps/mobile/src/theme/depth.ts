// Shared depth border styles — Duolingo 3D illusion (RFC 0002/0009)
// Use these instead of flat `borderWidth: 1`
import { StyleSheet } from "react-native";
import { colors } from "./colors";

const c = colors.light;

/** Neutral depth — default for all cards */
export const depthNeutral = {
  borderWidth: 2,
  borderBottomWidth: 4,
  borderColor: c.depthBorderLight,
  borderBottomColor: c.depthBorderDark,
} as const;

/** Semantic depth — for skill/status cards */
export function depthSemantic(color: string) {
  return {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: color + "25",
    borderBottomColor: color + "66",
  };
}

/** Pre-built depth styles for common patterns */
export const depth = StyleSheet.create({
  card: { ...depthNeutral, backgroundColor: c.card },
  muted: { ...depthNeutral, backgroundColor: c.muted + "80" },
});
