// Depth border system — Duolingo 3D card effect
// Synced with frontend-v3 .card { border: 2px solid border; border-bottom-width: 4px }
import { StyleSheet } from "react-native";

/** Neutral depth card borders */
export const depthNeutral = {
  borderWidth: 2,
  borderBottomWidth: 4,
  borderColor: "#E5E5E5",
  borderBottomColor: "#CACACA",
} as const;

/** Semantic depth for skill/accent cards */
export function depthSemantic(color: string) {
  return {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: color + "40",
    borderBottomColor: color + "80",
  };
}

export const depth = StyleSheet.create({
  card: { ...depthNeutral, backgroundColor: "#FFFFFF" },
});
