// Depth border styles — V3 card pattern: border-2 border-b-4
import { StyleSheet } from "react-native";
import { colors } from "./colors";

const c = colors.light;

export const depthNeutral = {
  borderWidth: 2,
  borderBottomWidth: 4,
  borderColor: c.border,
  borderBottomColor: c.depthBorderDark,
} as const;

export function depthSemantic(color: string) {
  return {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: color + "25",
    borderBottomColor: color + "66",
  };
}

export const depth = StyleSheet.create({
  card: { ...depthNeutral, backgroundColor: c.surface },
});
